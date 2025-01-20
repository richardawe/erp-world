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

interface CrawlerItem {
  title: string;
  content: string;
  url: string;
}

// Initialize Supabase client with proper environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    env: process.env.NODE_ENV
  });
  throw new Error('Missing required Supabase configuration');
}

// Initialize Supabase client with detailed error logging
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

// Test database connection immediately
(async () => {
  try {
    const { error } = await supabase.from('sources').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Supabase connection test failed:', {
        error: error.message,
        hint: error.hint,
        details: error.details,
        code: error.code
      });
      throw error;
    }
    console.log('Successfully connected to Supabase');
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    throw error;
  }
})();

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

// Update the RSS crawler
async function crawlRSSFeed(source: Source): Promise<CrawlerItem[]> {
  const crawledItems: CrawlerItem[] = [];
  try {
    console.log(`Attempting to fetch RSS feed from ${source.url}`);
    const feed = await parser.parseURL(source.url);
    console.log(`Successfully fetched feed for ${source.vendor}. Found ${feed.items?.length || 0} items`);
    
    if (!feed.items || feed.items.length === 0) {
      console.warn(`No items found in feed for ${source.vendor}`);
      return crawledItems;
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
          source_id: source.id,
          url: item.link || '',
          image_url: imageUrl || null,
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
          
          // Add to crawled items
          crawledItems.push({
            title: article.title,
            content: article.content,
            url: article.url
          });
          
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
  return crawledItems;
}

// Update the main crawler function
export async function main(batchSize = 3, sourceId?: number) {
  try {
    console.log("Initializing crawler...");
    await initializeSchema();
    console.log("Schema initialized successfully");
    
    // Fetch active sources from the database
    console.log("Fetching sources...");
    let query = supabase
      .from('sources')
      .select('*')
      .eq('active', true);
    
    // If sourceId is provided, only fetch that source
    if (sourceId) {
      query = query.eq('id', sourceId);
      console.log(`Fetching single source with ID: ${sourceId}`);
    }

    const { data: dbSources, error } = await query;

    if (error) {
      console.error("Error fetching sources:", {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    if (!dbSources || dbSources.length === 0) {
      console.log(sourceId ? "Source not found or not active" : "No active sources found");
      return [];
    }

    console.log(`Found ${dbSources.length} active source(s)`);

    // Process sources
    const results: CrawlerItem[] = [];
    const sourcesToProcess = sourceId ? dbSources : dbSources.slice(0, batchSize);
    
    console.log(`Processing ${sourcesToProcess.length} source(s)`);
    
    for (const dbSource of sourcesToProcess) {
      try {
        console.log(`\nProcessing source: ${dbSource.vendor} (${dbSource.url})`);
        const items = await crawlRSSFeed(dbSource);
        results.push(...items);
      } catch (sourceError) {
        console.error(`Error processing source ${dbSource.vendor}:`, sourceError);
        // Continue with next source even if one fails
        continue;
      }
    }

    console.log(`Completed processing ${sourcesToProcess.length} source(s)`);
    console.log(`Found ${results.length} new items`);
    
    return results;
  } catch (error) {
    console.error("Error in main crawler function:", error);
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
      } catch {
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

// Update Oracle feed URL in the database
export async function updateOracleFeed() {
  try {
    const { error } = await supabase
      .from('sources')
      .update({ 
        url: 'https://www.oracle.com/uk/news/rss.html',
        type: 'rss'
      })
      .eq('vendor', 'Oracle');

    if (error) throw error;
    console.log('Successfully updated Oracle feed URL');
  } catch (error) {
    console.error('Error updating Oracle feed:', error);
    throw error;
  }
}

// Only run crawler directly if this file is being run as a script
if (require.main === module) {
main();
}