import Parser from 'rss-parser';
import { fetch } from 'undici';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import type { ERPVendor, Category } from '../types';
import { isAIRelated } from '../utils/ai-detection';

type NewsSource = ERPVendor | 'TechCrunch' | 'ZDNet' | 'VentureBeat' | 'TechTarget' | 'ComputerWeekly';

interface DatabaseSource {
  id: number;
  url: string;
  vendor: NewsSource;
  type: 'rss' | 'html';
  active: boolean;
  last_crawled: string | null;
}

interface Source extends DatabaseSource {
  name?: string;
  articleSelector?: string;
  titleSelector?: string;
  summarySelector?: string;
  contentSelector?: string;
  imageSelector?: string;
  dateSelector?: string;
  dateFormat?: string;
}

interface Article {
  title: string;
  summary: string;
  content: string;  // Full article content
  source: string;
  source_id: number;  // Add source_id field
  url: string;
  image_url: string | null;
  published_at: Date;
  vendor: NewsSource;
  categories: Category[];
  is_ai_related: boolean;
}

// Initialize Supabase client with proper environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL ?? '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

// Initialize schema cache
async function initializeSchema() {
  try {
    await supabase.from('articles').select('*').limit(1);
  } catch (error) {
    console.error('Error initializing schema:', error);
  }
}

// Configure parser with headers
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive'
  }
});

// Fetch active sources from the database
async function fetchSources(): Promise<Source[]> {
  try {
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .eq('active', true);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching sources:', error);
    return [];
  }
}

// Update the RSS crawler
async function crawlRSSFeed(source: Source): Promise<void> {
  try {
    console.log(`Attempting to fetch RSS feed from ${source.url}`);
    const feed = await parser.parseURL(source.url);
    console.log(`Successfully fetched feed for ${source.vendor}. Found ${feed.items?.length || 0} items`);
    
    if (!feed.items || feed.items.length === 0) {
      console.warn(`No items found in feed for ${source.vendor}`);
      return;
    }
    
    for (const item of feed.items) {
      try {
        console.log('\nProcessing article:', item.title);
        
        let imageUrl = null;
        
        // Handle VentureBeat and TechCrunch specific image extraction
        if (source.vendor === 'VentureBeat' || source.vendor === 'TechCrunch') {
          try {
            if (!item.link) {
              console.warn('Skipping article without link');
              continue;
            }
            const articleResponse = await fetch(item.link, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
              }
            });
            
            if (articleResponse.ok) {
              const articleHtml = await articleResponse.text();
              const $ = cheerio.load(articleHtml);
              
              // Try meta tags first
              imageUrl = $('meta[property="og:image"]').attr('content') ||
                        $('meta[name="twitter:image"]').attr('content');
              
              // If no meta image, try article content
              if (!imageUrl) {
                const $img = $('article img').first();
                imageUrl = $img.attr('src') || $img.attr('data-src');
              }
              
              console.log(`Found image for article: ${imageUrl}`);
            }
          } catch (error) {
            console.warn(`Failed to fetch article page for image: ${error}`);
          }
        }

        const categories = await categorizeArticle(
          item.title || '',
          item.contentSnippet || ''
        );

        // Fetch the full article content
        let content = '';
        try {
          if (!item.link) {
            console.warn('Skipping article content fetch - no link available');
          } else {
            const articleResponse = await fetch(item.link, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
              }
            });
            
            if (articleResponse.ok) {
              const articleHtml = await articleResponse.text();
              const $ = cheerio.load(articleHtml);
              content = await extractArticleContent($);
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch full content for article: ${item.title}`, error);
        }
        
        const article: Article = {
          title: item.title || '',
          summary: item.contentSnippet || '',
          content,
          source: feed.title || source.vendor,
          source_id: source.id,  // Add source_id
          url: item.link || '',
          image_url: imageUrl,
          published_at: item.pubDate ? parseDate(item.pubDate) : new Date(),
          vendor: source.vendor,
          categories,
          is_ai_related: isAIRelated(item.title + ' ' + item.contentSnippet + ' ' + (item.content || ''))
        };
        
        console.log(`Found image for "${article.title}":`, imageUrl);
        
        // Validate required fields
        if (!article.title || !article.url) {
          console.warn(`Skipping article from ${source.vendor} - missing required fields`);
          continue;
        }
        
        const { error } = await supabase
          .from('articles')
          .upsert(
            article,
            { onConflict: 'url' }
          );
        
        if (error) {
          console.error(`Error inserting article from ${source.vendor}: ${error.message}`);
        } else {
          console.log(`Successfully inserted/updated article from ${source.vendor}: ${article.title}`);
          
          // Update last_crawled timestamp for the source
          await supabase
            .from('sources')
            .update({ last_crawled: new Date().toISOString() })
            .eq('id', source.id);
        }
      } catch (itemError) {
        console.error(`Error processing item from ${source.vendor}:`, itemError);
      }
    }
  } catch (error) {
    console.error(`Error crawling ${source.url}:`, error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Update the main crawler function
export async function main() {
  try {
    console.log("Initializing crawler...");
    await initializeSchema();
    console.log("Schema initialized successfully");
    
    // Fetch active sources from the database
    console.log("Fetching active sources...");
    const { data: dbSources, error } = await supabase
      .from('sources')
      .select('*')
      .eq('active', true);

    if (error) {
      console.error("Error fetching sources:", {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log(`Found ${dbSources?.length || 0} active sources`);

    if (!dbSources || dbSources.length === 0) {
      console.log("No active sources found");
      return [];
    }

    const results = [];
    for (const source of dbSources) {
      try {
        console.log(`Processing source: ${source.vendor} (${source.url})`);
        if (source.type === 'rss') {
          await crawlRSSFeed(source);
        }
        // Add result to track processed sources
        results.push({
          source: source.vendor,
          url: source.url,
          status: 'success'
        });
      } catch (sourceError) {
        console.error(`Error processing source ${source.vendor}:`, {
          error: sourceError,
          message: sourceError instanceof Error ? sourceError.message : 'Unknown error',
          stack: sourceError instanceof Error ? sourceError.stack : undefined
        });
        results.push({
          source: source.vendor,
          url: source.url,
          status: 'error',
          error: sourceError instanceof Error ? sourceError.message : 'Unknown error'
        });
      }
    }

    console.log("Crawler execution completed", {
      totalSources: dbSources.length,
      results
    });
    return results;
  } catch (error) {
    console.error("Error in main crawler function:", {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// Add a helper function for date parsing
function parseDate(dateStr: string): Date {
  // First try parsing as ISO date
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try to parse common date formats
  const formats = [
    // Jan 1, 2024 or January 1, 2024
    /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/,
    // 01/01/2024 or 01-01-2024
    /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/,
    // 2024/01/01 or 2024-01-01
    /(\d{4})[/-](\d{1,2})[/-](\d{1,2})/,
    // 1 January 2024 or 1st January 2024
    /(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/,
    // January 2024
    /([A-Za-z]+)\s+(\d{4})/
  ];

  // Clean up the date string
  const cleanDateStr = dateStr.trim().replace(/\s+/g, ' ');

  for (const format of formats) {
    const match = cleanDateStr.match(format);
    if (match) {
      // Try parsing with the original string first
      const date = new Date(cleanDateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      // If that fails, try manual parsing based on the format
      try {
        if (format === formats[0] || format === formats[3]) {
          // Handle "Month Day, Year" or "Day Month Year"
          const monthStr = match[1];
          const day = parseInt(match[2], 10);
          const year = parseInt(match[3], 10);
          const month = new Date(Date.parse(monthStr + " 1, 2000")).getMonth();
          return new Date(year, month, day);
        } else if (format === formats[4]) {
          // Handle "Month Year"
          const monthStr = match[1];
          const year = parseInt(match[2], 10);
          const month = new Date(Date.parse(monthStr + " 1, 2000")).getMonth();
          return new Date(year, month, 1);
        }
      } catch (e) {
        console.warn(`Failed to manually parse date: ${cleanDateStr}`);
      }
    }
  }

  // If no format matches, return current date
  console.warn(`Could not parse date: ${dateStr}, using current date`);
  return new Date();
}

// Add this helper function to extract article content
async function extractArticleContent($: cheerio.Root): Promise<string> {
  // Try different content selectors based on common article structures
  const contentSelectors = [
    'article .content',
    '.article-content',
    '.news-content',
    'article .body',
    '.press-release-content',
    'article p',
    '.article-body',
    '.post-content'
  ];

  for (const selector of contentSelectors) {
    const $content = $(selector);
    if ($content.length) {
      // Remove any unwanted elements
      $content.find('script, style, .social-share, .related-articles, nav').remove();
      
      // Get the HTML content
      const content = $content.html();
      if (content && content.trim().length > 0) {
        return content.trim();
      }
    }
  }

  // If no content found with selectors, try getting all paragraphs within the article
  const $article = $('article');
  if ($article.length) {
    const paragraphs = $article.find('p')
      .map((_, el) => $(el).html())
      .get()
      .filter(html => html && html.trim().length > 0);
    
    if (paragraphs.length > 0) {
      return paragraphs.join('\n');
    }
  }

  return '';
}

async function categorizeArticle(title: string, content: string): Promise<Category[]> {
  const categories: Category[] = [];
  
  // Enhanced keyword-based categorization with AI focus
  const keywords: Record<Category, string[]> = {
    'Product Launch': ['launch', 'release', 'new feature', 'announced', 'introduces', 'unveils'],
    'Security Update': ['security', 'vulnerability', 'patch', 'fix', 'protection', 'privacy'],
    'Market Trend': ['market', 'trend', 'industry', 'growth', 'forecast', 'future'],
    'Partnership': ['partner', 'collaboration', 'alliance', 'partnership', 'joint venture'],
    'Acquisition': ['acquire', 'acquisition', 'merge', 'merger', 'takeover'],
    'AI Innovation': [
      'artificial intelligence', 'machine learning', 'ml', 'ai', 'deep learning', 
      'neural network', 'nlp', 'natural language', 'computer vision', 
      'predictive analytics', 'generative ai', 'large language model', 'llm',
      'chatbot', 'automation', 'intelligent automation', 'cognitive computing',
      'ai-powered', 'ai powered', 'ai-driven', 'ai driven'
    ],
    'General': []
  };

  const text = `${title} ${content}`.toLowerCase();
  
  // First check for AI-related content
  const aiKeywords = keywords['AI Innovation'];
  const isAIContent = aiKeywords.some(word => text.includes(word));
  
  if (isAIContent) {
    categories.push('AI Innovation');
  }
  
  // Then check other categories
  (Object.entries(keywords) as [Category, string[]][]).forEach(([category, words]) => {
    if (category !== 'General' && category !== 'AI Innovation' && words.some(word => text.includes(word))) {
      categories.push(category);
    }
  });
  
  // Add General category if no other categories found
  if (categories.length === 0) {
    categories.push('General');
  }
  
  return categories;
}

// Only run crawler directly if this file is being run as a script
if (require.main === module) {
main();
}