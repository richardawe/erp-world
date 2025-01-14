import Parser from 'rss-parser';
import { fetch } from 'undici';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import type { ERPVendor, Category } from '../types';
import { isAIRelated } from '../utils/ai-detection';

type NewsSource = ERPVendor | 'TechCrunch' | 'ZDNet' | 'VentureBeat' | 'TechTarget' | 'ComputerWeekly';

interface Source {
  name: string;
  vendor: NewsSource;
  type: 'rss' | 'html';
  url: string;
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
  url: string;
  image_url: string | null;
  published_at: Date;
  vendor: NewsSource;
  categories: Category[];
  is_ai_related: boolean;  // Changed from isAIRelated to is_ai_related to match DB column
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

const sources: Source[] = [
  {
    name: 'SAP News',
    vendor: 'SAP',
    type: 'rss',
    url: 'https://news.sap.com/feed/'
  },
  {
    name: 'Oracle Press Releases',
    vendor: 'Oracle',
    type: 'rss',
    url: 'https://www.oracle.com/corporate/pressrelease/rss'
  },
  {
    name: 'Microsoft Dynamics Blog',
    vendor: 'Microsoft',
    type: 'rss',
    url: 'https://cloudblogs.microsoft.com/dynamics365/feed/'
  },
  {
    name: 'Workday Blog',
    vendor: 'Workday',
    type: 'rss',
    url: 'https://blog.workday.com/en-us/feeds/atom/blog-posts.xml'
  },
  {
    name: 'Unit4 Blog',
    vendor: 'Unit4',
    type: 'rss',
    url: 'https://www.unit4.com/blog/rss.xml'
  },
  {
    name: 'Infor News',
    vendor: 'Infor',
    type: 'html',
    url: 'https://www.infor.com/news',
    articleSelector: '.news-item',
    titleSelector: '.news-item__title',
    summarySelector: '.news-item__description',
    dateSelector: '.news-item__date'
  },
  {
    name: 'TechCrunch Enterprise',
    vendor: 'TechCrunch',
    type: 'rss',
    url: 'https://techcrunch.com/category/enterprise/feed/'
  },
  {
    name: 'VentureBeat Enterprise',
    vendor: 'VentureBeat',
    type: 'rss',
    url: 'https://venturebeat.com/category/enterprise/feed/'
  },
  {
    name: 'VentureBeat AI',
    vendor: 'VentureBeat',
    type: 'rss',
    url: 'https://venturebeat.com/category/ai/feed/'
  }
];

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
        
        // For Microsoft specifically
        if (source.vendor === 'Microsoft') {
          console.log('Processing Microsoft article, available fields:', Object.keys(item));
          
          // Fetch the full article page
          try {
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
              
              // Try different image selectors specific to Microsoft's blog
              const selectors = [
                '.c-hero-image img',
                '.c-feature-image img',
                '.c-image img',
                'article img',
                '.entry-content img',
                'img.wp-post-image',
                'img'
              ];
              
              for (const selector of selectors) {
                const $img = $(selector).first();
                if ($img.length) {
                  const src = $img.attr('src') || $img.attr('data-src');
                  // Skip Microsoft logo
                  if (src && !src.includes('UHFbanner-MSlogo')) {
                    imageUrl = src;
                    console.log(`Found Microsoft image using selector "${selector}":`, imageUrl);
                    break;
                  }
                }
              }
              
              // Try to find image in meta tags if no image found in content
              if (!imageUrl || imageUrl.includes('UHFbanner-MSlogo')) {
                const metaImage = $('meta[property="og:image"]').attr('content') ||
                                $('meta[name="twitter:image"]').attr('content');
                if (metaImage && !metaImage.includes('UHFbanner-MSlogo')) {
                  imageUrl = metaImage;
                  console.log('Found Microsoft image in meta tags:', imageUrl);
                }
              }
            } else {
              console.warn(`Failed to fetch Microsoft article page: ${item.link}`);
            }
          } catch (error) {
            console.error(`Error fetching Microsoft article page: ${error}`);
          }
        }
        // For SAP specifically
        else if (source.vendor === 'SAP') {
          console.log('Processing SAP article:', item.title);
          console.log('Article link:', item.link);  // Debug log
          
          if (item['content:encoded']) {
            const $ = cheerio.load(item['content:encoded']);
            console.log('Searching for images in content:encoded'); // Debug log
            
            // Try different image selectors
            const selectors = [
              'img.size-full', // Full size images
              'img.wp-post-image', // Featured images
              'figure img', // Images in figure tags
              'img[width="1140"]', // Specific size images
              'img' // Any image as last resort
            ];
            
            for (const selector of selectors) {
              const $img = $(selector).first();
              if ($img.length) {
                imageUrl = $img.attr('src') || $img.attr('data-lazy-src') || null;
                console.log(`Found image using selector "${selector}":`, imageUrl);
                if (imageUrl) break;
              }
            }
          }
          
          // Try to find image in regular content if still not found
          if (!imageUrl && item.content) {
            const $ = cheerio.load(item.content);
            console.log('Searching for images in content'); // Debug log
            $('img').each((index: number, img: cheerio.Element) => {
              const src = $(img).attr('src');
              const width = parseInt($(img).attr('width') || '0', 10);
              if (src && width >= 600) { // Look for larger images
                imageUrl = src;
                console.log('Found large image in content:', imageUrl);
                return false;
              }
            });
          }
        }
        
        // Fallback to standard RSS image sources if no vendor-specific image found
        if (!imageUrl) {
          if (item['media:content'] && item['media:content'].$ && item['media:content'].$.url) {
            imageUrl = item['media:content'].$.url;
            console.log('Found image in media:content:', imageUrl);
          }
          else if (item.enclosure && item.enclosure.url) {
            imageUrl = item.enclosure.url;
            console.log('Found image in enclosure:', imageUrl);
          }
          else if (item['media:thumbnail'] && item['media:thumbnail'].$ && item['media:thumbnail'].$.url) {
            imageUrl = item['media:thumbnail'].$.url;
            console.log('Found image in media:thumbnail:', imageUrl);
          }
        }

        // Validate and clean up image URL
        if (imageUrl) {
          try {
            imageUrl = imageUrl.split('?')[0];
            new URL(imageUrl);
            console.log('Final validated image URL:', imageUrl);
          } catch (e) {
            console.warn(`Invalid image URL for article "${item.title}": ${imageUrl}`);
            imageUrl = null;
          }
        } else {
          console.log('No image found for article');
        }
        
        // Fetch the full article content
        let content = '';
        try {
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
        } catch (error) {
          console.warn(`Failed to fetch full content for article: ${item.title}`, error);
        }
        
        const article: Article = {
          title: item.title || '',
          summary: item.contentSnippet || '',
          content,
          source: feed.title || source.vendor,
          url: item.link || '',  // Ensure link is set
          image_url: imageUrl,
          published_at: item.pubDate ? parseDate(item.pubDate) : new Date(),
          vendor: source.vendor,
          categories,
          is_ai_related: isAIRelated(item.title + ' ' + item.contentSnippet + ' ' + (item.content || ''))
        };
        
        console.log(`Found image for "${article.title}":`, imageUrl); // Debug log
        
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

// Update the HTML crawler
async function crawlHTMLPage(source: Source): Promise<void> {
  const { url, vendor } = source;
  console.log(`Crawling ${vendor} news from ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      console.warn(`Failed to fetch news from ${vendor}: ${response.status}`);
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const articles: Article[] = [];
    let articleSelector = '';
    let titleSelector = '';
    let summarySelector = '';
    let dateSelector = '';
    let imageSelector = '';
    let urlSelector = '';

    switch (vendor as ERPVendor) {
      case 'Oracle':
        // First find all announcement links
        const oracleLinks = $('a[href*="/announcement/"]').map((index: number, element: cheerio.Element): string | undefined => 
          $(element).attr('href')
        ).get();
        
        const uniqueOracleLinks = [...new Set(oracleLinks)].filter((link): link is string => 
          typeof link === 'string' && link.includes('/announcement/')
        );

        console.log(`Found ${uniqueOracleLinks.length} unique Oracle announcement links`);

        for (const link of uniqueOracleLinks) {
          try {
            const fullUrl = link.startsWith('http') ? link : new URL(link, url).toString();
            console.log(`Fetching Oracle article: ${fullUrl}`);
            
            const response = await fetch(fullUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
              }
            });

            if (!response.ok) {
              console.warn(`Failed to fetch Oracle article: ${fullUrl}, status: ${response.status}`);
              continue;
            }

            const articleHtml = await response.text();
            const $article = cheerio.load(articleHtml);
            
            // Get title from h1 or meta tags
            const title = $article('h1').first().text().trim() ||
                         $article('meta[property="og:title"]').attr('content') ||
                         $article('meta[name="twitter:title"]').attr('content');
            
            // Get summary from meta description
            const summary = $article('meta[name="description"]').attr('content') || 
                          $article('meta[property="og:description"]').attr('content') ||
                          $article('article p, .article-content p').first().text().trim();
            
            // Try to extract date from URL first (most reliable)
            let published_at: Date;
            try {
              const urlDateMatch = fullUrl.match(/(\d{4})-(\d{2})-(\d{2})/);
              if (urlDateMatch) {
                const [_, year, month, day] = urlDateMatch;
                published_at = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                console.log(`Extracted date from Oracle URL: ${published_at}`);
              } else {
                // Try to find date in the content
                const dateText = $article('time').first().text().trim();
                if (dateText) {
                  published_at = parseDate(dateText);
                  console.log(`Parsed Oracle visible date: ${dateText} -> ${published_at}`);
                } else {
                  throw new Error('No date found');
                }
              }

              if (isNaN(published_at.getTime())) {
                throw new Error('Invalid date');
              }
            } catch (error) {
              console.warn(`Could not parse date for Oracle article: ${title}, using current date`);
              published_at = new Date();
            }

            // Get image from meta tags or content
            const imageUrl = $article('meta[property="og:image"]').attr('content') ||
                           $article('meta[name="twitter:image"]').attr('content') ||
                           $article('article img').first().attr('src') ||
                           null;

            // Skip if we couldn't get a proper title
            if (!title) {
              console.warn(`Skipping Oracle article without title: ${fullUrl}`);
              continue;
            }

            const content = await extractArticleContent($article);
            
            const article: Article = {
              title,
              summary,
              content,
              source: fullUrl,
              url: fullUrl,
              published_at,
              vendor: 'Oracle',
              categories: await categorizeArticle(title, summary),
              image_url: imageUrl,
              is_ai_related: isAIRelated(title + ' ' + summary + ' ' + (content || ''))
            };

            try {
              await supabase.from('articles').upsert(
                article,
                { onConflict: 'url' }
              );
              console.log(`Successfully inserted/updated Oracle article: ${title}`);
            } catch (error) {
              console.error(`Error inserting/updating Oracle article: ${title}`, error);
            }
          } catch (error) {
            console.error(`Error processing Oracle article: ${link}`, error);
          }
        }
        return;
      case 'Workday':
        // First find all press release links
        const workdayLinks = $('a[href*="/20"]').map((index: number, element: cheerio.Element): string | undefined => {
          const href = $(element).attr('href');
          // Only include links that match the press release pattern (YYYY-MM-DD)
          // and exclude any language-specific duplicates (e.g. /fr/, /de/, etc.)
          if (href?.match(/\/\d{4}-\d{2}-\d{2}-/) && !href.match(/\/(fr|de|es|it|ja|nl|sv)\//)) {
            // Clean up the URL to ensure consistent format
            const cleanUrl = href.split('?')[0].replace(/\/+$/, '');
            return cleanUrl;
          }
          return undefined;
        }).get();
        
        // Create a Map to deduplicate by normalized URL
        const workdayUrlMap = new Map<string, string>();
        workdayLinks.forEach((link: string | undefined) => {
          if (link) {
            // Normalize the URL by removing language codes and cleaning up
            const normalizedUrl = link
              .toLowerCase()
              .replace(/^https?:\/\//, '')
              .replace(/^www\./, '')
              .replace(/\/+$/, '');
            
            // Only keep the first occurrence of each normalized URL
            if (!workdayUrlMap.has(normalizedUrl)) {
              workdayUrlMap.set(normalizedUrl, link);
            }
          }
        });

        const uniqueWorkdayLinks = Array.from(workdayUrlMap.values());
        console.log(`Found ${uniqueWorkdayLinks.length} unique Workday press release links`);

        for (const link of uniqueWorkdayLinks) {
          try {
            const fullUrl = link.startsWith('http') ? link : `https://newsroom.workday.com${link}`;
            console.log(`Fetching Workday article: ${fullUrl}`);
            
            const response = await fetch(fullUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
              }
            });

            if (!response.ok) {
              console.warn(`Failed to fetch Workday article: ${fullUrl}, status: ${response.status}`);
              continue;
            }

            const articleHtml = await response.text();
            const $article = cheerio.load(articleHtml);
            
            // Get title from h1 or meta tags
            const title = $article('h1').first().text().trim() ||
                         $article('meta[property="og:title"]').attr('content') ||
                         $article('meta[name="twitter:title"]').attr('content');
            
            // Get summary from meta description or first paragraph
            const summary = $article('meta[name="description"]').attr('content') || 
                          $article('meta[property="og:description"]').attr('content') ||
                          $article('article p, .press-release p').first().text().trim();
            
            // Try to extract date from URL first (most reliable)
            let published_at: Date;
            try {
              const urlDateMatch = fullUrl.match(/(\d{4})-(\d{2})-(\d{2})/);
              if (urlDateMatch) {
                const [_, year, month, day] = urlDateMatch;
                published_at = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                console.log(`Extracted date from Workday URL: ${published_at}`);
              } else {
                // Try to find date in the content
                const dateText = $article('time').first().text().trim();
                if (dateText) {
                  published_at = parseDate(dateText);
                  console.log(`Parsed Workday visible date: ${dateText} -> ${published_at}`);
                } else {
                  throw new Error('No date found');
                }
              }

              if (isNaN(published_at.getTime())) {
                throw new Error('Invalid date');
              }
            } catch (error) {
              console.warn(`Could not parse date for Workday article: ${title}, using current date`);
              published_at = new Date();
            }

            // Get image from meta tags or content
            const imageUrl = $article('meta[property="og:image"]').attr('content') ||
                           $article('meta[name="twitter:image"]').attr('content') ||
                           $article('img[alt*="PRNewsfoto"]').attr('src') ||
                           null;

            // Skip if we couldn't get a proper title
            if (!title) {
              console.warn(`Skipping Workday article without title: ${fullUrl}`);
              continue;
            }

            const content = await extractArticleContent($article);
            
            const article: Article = {
              title,
              summary,
              content,
              source: fullUrl,
              url: fullUrl,
              published_at,
              vendor: 'Workday',
              categories: await categorizeArticle(title, summary),
              image_url: imageUrl,
              is_ai_related: isAIRelated(title + ' ' + summary + ' ' + (content || ''))
            };

            try {
              await supabase.from('articles').upsert(
                article,
                { onConflict: 'url' }
              );
              console.log(`Successfully inserted/updated Workday article: ${title}`);
            } catch (error) {
              console.error(`Error inserting/updating Workday article: ${title}`, error);
            }
          } catch (error) {
            console.error(`Error processing Workday article: ${link}`, error);
          }
        }
        return;
      case 'Unit4':
        // Find all news links
        const unit4Links = $('a[href*="/news/"]').map((index: number, element: cheerio.Element): string | undefined => {
          const href = $(element).attr('href');
          // Only include news links and exclude language-specific duplicates
          if (href?.includes('/news/') && !href.match(/\/(de|fr|nl|no|fi|sv)\//)) {
            return href;
          }
          return undefined;
        }).get();
        
        // Create a Map to deduplicate by normalized URL
        const unit4UrlMap = new Map<string, string>();
        unit4Links.forEach((link: string | undefined) => {
          if (link) {
            // Normalize the URL by removing language codes and cleaning up
            const normalizedUrl = link
              .toLowerCase()
              .replace(/^https?:\/\//, '')
              .replace(/^www\./, '')
              .replace(/\/+$/, '');
            
            // Only keep the first occurrence of each normalized URL
            if (!unit4UrlMap.has(normalizedUrl)) {
              unit4UrlMap.set(normalizedUrl, link);
            }
          }
        });

        const uniqueUnit4Links = Array.from(unit4UrlMap.values());
        console.log(`Found ${uniqueUnit4Links.length} unique Unit4 news links`);

        for (const link of uniqueUnit4Links) {
          try {
            const fullUrl = link.startsWith('http') ? link : `https://www.unit4.com${link}`;
            console.log(`Processing Unit4 article URL: ${fullUrl}`);  // Debug log
            
            const response = await fetch(fullUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
              }
            });

            if (!response.ok) {
              console.warn(`Failed to fetch Unit4 article: ${fullUrl}, status: ${response.status}`);
              continue;
            }

            const articleHtml = await response.text();
            const $article = cheerio.load(articleHtml);
            
            // Get title from h1
            const title = $article('h1').first().text().trim();
            
            // Get summary from first paragraph after location
            const summary = $article('h1 + p').text().trim();
            
            // Get date from multiple possible locations with focus on Unit4's format
            const dateText = $article([
              'meta[property="article:published_time"]',
              'meta[property="og:article:published_time"]',
              'p.date',
              'p:contains("Published")',
              'p:contains("January")',
              'p:contains("February")',
              'p:contains("March")',
              'p:contains("April")',
              'p:contains("May")',
              'p:contains("June")',
              'p:contains("July")',
              'p:contains("August")',
              'p:contains("September")',
              'p:contains("October")',
              'p:contains("November")',
              'p:contains("December")'
            ].join(', ')).first().text().trim() || 
            $article('meta[property="article:published_time"]').attr('content');
            
            // Try to parse the date
            let published_at: Date;
            try {
              if (dateText) {
                // First try parsing as ISO date (from meta tags)
                if (dateText.includes('T')) {
                  published_at = new Date(dateText);
                  if (!isNaN(published_at.getTime())) {
                    console.log(`Successfully parsed ISO date: ${dateText} -> ${published_at}`);
                  } else {
                    throw new Error('Invalid ISO date');
                  }
                } else {
                  // Extract date from text that might contain other content
                  const dateMatch = dateText.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
                  if (dateMatch) {
                    const [_, month, day, year] = dateMatch;
                    published_at = new Date(Date.parse(`${month} ${day}, ${year}`));
                    console.log(`Extracted and parsed Unit4 date: ${month} ${day}, ${year} -> ${published_at}`);
                  } else {
                    // Try parsing the whole text as a date
                    published_at = parseDate(dateText);
                    console.log(`Parsed full text as date: ${dateText} -> ${published_at}`);
                  }
                }
              } else {
                // Try to extract date from URL
                const urlDateMatch = fullUrl.match(/\/(\d{4})\/(\d{2})\/(\d{2})/);
                if (urlDateMatch) {
                  const [_, year, month, day] = urlDateMatch;
                  published_at = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  console.log(`Extracted date from URL: ${published_at}`);
                } else {
                  throw new Error('No date found in text or URL');
                }
              }
              
              // Validate the parsed date
              if (isNaN(published_at.getTime()) || published_at.getFullYear() < 2000) {
                throw new Error('Invalid date or year before 2000');
              }
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              console.warn(`Could not parse date for Unit4 article: ${title}, using current date. Error: ${errorMessage}`);
              published_at = new Date();
            }

            // Get image from article
            const imageUrl = $article('img[alt*="headshot"], img[alt*="Headshot"]').first().attr('src') || null;

            // Skip if we couldn't get a proper title
            if (!title) {
              console.warn(`Skipping Unit4 article without title: ${fullUrl}`);
              continue;
            }

            const content = await extractArticleContent($article);
            
            const article: Article = {
              title,
              summary,
              content,
              source: 'Unit4',
              url: fullUrl,  // Ensure full URL is set
              published_at,
              vendor: 'Unit4',
              categories: await categorizeArticle(title, summary),
              image_url: imageUrl,
              is_ai_related: isAIRelated(title + ' ' + summary + ' ' + (content || ''))
            };
            
            // Validate URL before inserting
            if (!article.url || !article.url.startsWith('http')) {
              console.warn(`Skipping Unit4 article with invalid URL: ${article.title}`);
              continue;
            }
            
            await supabase.from('articles').upsert(
              article,
              { onConflict: 'url' }
            );
            console.log(`Successfully inserted/updated Unit4 article: ${title} with URL: ${fullUrl}`);
          } catch (error) {
            console.error(`Error processing Unit4 article: ${link}`, error);
          }
        }
        return;
      case 'Infor': {
        const inforLinks = $('a[href*="/news/"]').map((index: number, element: cheerio.Element): string | undefined => 
          $(element).attr('href')
        ).get();
        
        const uniqueInforLinks = [...new Set(inforLinks)].filter((link): link is string => 
          typeof link === 'string' && link.includes('/news/')
        );

        for (const link of uniqueInforLinks) {
          try {
            const fullUrl = link.startsWith('http') ? link : `https://www.infor.com${link}`;
            console.log(`Fetching Infor article: ${fullUrl}`);
            
            const response = await fetch(fullUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
              }
            });

            if (!response.ok) {
              console.warn(`Failed to fetch Infor article: ${fullUrl}, status: ${response.status}`);
              continue;
            }

            const articleHtml = await response.text();
            const $article = cheerio.load(articleHtml);
            
            // Get title from article content area, not navigation
            const title = $article('article h1, .article-content h1, .news-content h1').first().text().trim();
            
            // Get summary from meta description or first paragraph
            const summary = $article('meta[name="description"]').attr('content') || 
                           $article('article p, .article-content p, .news-content p').first().text().trim();
            
            // Get date from multiple possible locations with expanded selectors
            const dateText = $article('meta[property="article:published_time"], meta[property="og:article:published_time"]').attr('content') || 
              $article('.article-date, .news-date, time[datetime], span:contains("AM"), span:contains("PM"), div:contains("AM"), div:contains("PM")').first().text().trim();

            let published_at: Date;
            try {
              if (dateText) {
                // First try parsing as ISO date
                published_at = new Date(dateText);
                if (isNaN(published_at.getTime())) {
                  // Try parsing Infor's specific format: "March 08, 2024, 12:00 AM"
                  const match = dateText.match(/([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4}),\s+(\d{1,2}):(\d{2})\s+(AM|PM)/);
                  if (match) {
                    const [_, month, day, year, hours, minutes, ampm] = match;
                    let hour = parseInt(hours);
                    if (ampm === 'PM' && hour < 12) hour += 12;
                    if (ampm === 'AM' && hour === 12) hour = 0;
                    published_at = new Date(Date.UTC(
                      parseInt(year),
                      ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(month),
                      parseInt(day),
                      hour,
                      parseInt(minutes)
                    ));
                  } else {
                    // Try other date formats
                    published_at = parseDate(dateText);
                  }
                }
              } else {
                published_at = new Date();
              }
              if (isNaN(published_at.getTime())) {
                throw new Error('Invalid date');
              }
            } catch (error) {
              console.warn(`Could not parse date for Infor article: ${title}. Date text was: "${dateText}"`);
              published_at = new Date();
            }

            // Skip if we couldn't get a proper title (likely not a real article page)
            if (!title || title.includes('Industry cloud solutions')) {
              console.warn(`Skipping invalid Infor article: ${fullUrl}`);
              continue;
            }

            // Get image from meta tags or article content
            const imageUrl = $article('meta[property="og:image"]').attr('content') || 
                           $article('article img, .article-content img, .news-content img').first().attr('src') || 
                           null;

            const content = await extractArticleContent($article);
            
            const article: Article = {
              title,
              summary,
              content,
              source: fullUrl,
              url: fullUrl,
              published_at,
              vendor: 'Infor',
              categories: await categorizeArticle(title, summary),
              image_url: imageUrl,
              is_ai_related: isAIRelated(title + ' ' + summary + ' ' + (content || ''))
            };

            try {
              await supabase.from('articles').upsert(
                article,
                { onConflict: 'url' }
              );
              console.log(`Successfully inserted/updated Infor article: ${title}`);
            } catch (error) {
              console.error(`Error inserting/updating Infor article: ${title}`, error);
            }
          } catch (error) {
            console.error(`Error processing Infor article: ${link}`, error);
          }
        }
        return;
      }
      default:
        break;
    }

    // Process articles for non-Infor vendors
    $(articleSelector).each((index: number, element: cheerio.Element) => {
      const $element = $(element);
      const title = $element.find(titleSelector).text().trim();
      const summary = $element.find(summarySelector).text().trim();
      const dateText = $element.find(dateSelector).text().trim();
      const imageUrl = $element.find(imageSelector).attr('src') || null;
      const articleUrl = $element.find(urlSelector).attr('href');

      if (!title || !articleUrl) {
        console.warn(`Skipping article without title or URL for ${vendor}`);
        return;
      }

      let published_at: Date;
      try {
        published_at = dateText ? new Date(dateText) : new Date();
        if (isNaN(published_at.getTime())) {
          throw new Error('Invalid date');
        }
      } catch (error) {
        console.warn(`Could not parse date for ${vendor} article: ${title}, using current date`);
        published_at = new Date();
      }

      const fullUrl = articleUrl.startsWith('http') ? articleUrl : new URL(articleUrl, url).toString();

      articles.push({
        title,
        summary,
        content: '',  // Add empty content for non-crawled articles
        source: fullUrl,
        url: fullUrl,
        published_at,
        vendor,
        categories: [],
        image_url: imageUrl,
        is_ai_related: isAIRelated(title + ' ' + summary + ' ' + '')
      });
    });

    // Categorize and insert articles
    for (const article of articles) {
      article.categories = await categorizeArticle(article.title, article.summary);
      try {
        await supabase.from('articles').upsert(
          article,
          { onConflict: 'url' }
        );
        console.log(`Successfully inserted/updated ${vendor} article: ${article.title}`);
      } catch (error) {
        console.error(`Error inserting/updating ${vendor} article: ${article.title}`, error);
      }
    }
  } catch (error) {
    console.error(`Error crawling ${vendor} news:`, error);
  }
}

// Main crawler function
async function main() {
  console.log('Starting crawler...');
  
  // Initialize schema cache
  await initializeSchema();

  // Crawl all sources
  for (const source of sources) {
    console.log(`Processing source: ${source.vendor}`);
    if (source.type === 'rss') {
      await crawlRSSFeed(source);
    } else {
      await crawlHTMLPage(source);
    }
  }

  console.log('Crawler finished');
}

// Run the crawler
main().catch(console.error);

// Export the main function
export { main };

// Only run crawler directly if this file is being run as a script
if (require.main === module) {
main();
}