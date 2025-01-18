import { Handler } from "@netlify/functions";
import { main as runCrawler } from "../../src/server/crawler";
import cheerio from 'cheerio';

// Validate environment variables
function validateEnv() {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

const VENDOR_FEEDS = {
  SAP: 'https://news.sap.com/feed/',
  Oracle: 'https://www.oracle.com/news/rss.html',
  Microsoft: 'https://news.microsoft.com/feed/',
  Workday: 'https://blog.workday.com/en-us/feeds/posts/default',
  Unit4: 'https://www.unit4.com/rss.xml',
  Infor: 'https://www.infor.com/news/rss.xml',
  Forterro: 'https://www.forterro.com/en/news/feed'
};

async function crawlForterro() {
  try {
    const baseUrl = 'https://www.forterro.com/en/news';
    const response = await fetch(baseUrl);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const articles = [];
    
    // Adjust the selector based on Forterro's HTML structure
    $('.news-item').each((_, element) => {
      const title = $(element).find('.news-title').text().trim();
      const url = $(element).find('a').attr('href');
      const summary = $(element).find('.news-summary').text().trim();
      const date = $(element).find('.news-date').text().trim();
      
      if (title && url) {
        articles.push({
          title,
          url: url.startsWith('http') ? url : `https://www.forterro.com${url}`,
          summary,
          published_at: new Date(date),
          vendor: 'Forterro',
          category: determineCategory(title + ' ' + summary)
        });
      }
    });
    
    return articles;
  } catch (error) {
    console.error('Error crawling Forterro:', error);
    return [];
  }
}

// Add Forterro to the main crawl function
export async function crawlAllVendors() {
  const results = await Promise.all([
    crawlSAP(),
    crawlOracle(),
    crawlMicrosoft(),
    crawlWorkday(),
    crawlUnit4(),
    crawlInfor(),
    crawlForterro()
  ]);
  
  return results.flat();
}

const crawlerHandler: Handler = async (event, context) => {
  try {
    console.log("Starting crawler...");
    
    // Validate environment variables before running
    validateEnv();
    
    // Log configuration (without sensitive values)
    console.log("Crawler configuration:", {
      supabaseUrl: process.env.VITE_SUPABASE_URL,
      hasServiceKey: !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
    await runCrawler();
    console.log("Crawler finished successfully");
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: "Crawler executed successfully",
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error("Error running crawler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Failed to run crawler",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      })
    };
  }
};

export const handler = crawlerHandler; 