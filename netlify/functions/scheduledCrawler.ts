import { HandlerEvent, HandlerResponse } from "@netlify/functions";
import { main as runCrawler } from "../../src/server/crawler";
import OpenAI from 'openai';

// LinkedIn API configuration
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Create OpenAI client for summary generation
const openai = new OpenAI({
  baseURL: OPENROUTER_BASE_URL,
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://github.com/richardawe/erp-world",
    "X-Title": "ERP World"
  }
});

// Validate environment variables
function validateEnv() {
  const required = [
    'VITE_SUPABASE_URL', 
    'VITE_SUPABASE_SERVICE_ROLE_KEY',
    'LINKEDIN_ACCESS_TOKEN',
    'OPENROUTER_API_KEY'
  ];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

async function generateSummary(content: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'meta-llama/llama-3.1-70b-instruct:free',
      messages: [{
        role: 'user',
        content: `As an executive advisor, analyze this article and provide a comprehensive analysis:

Executive Summary:
• First key insight
• Second key insight

Key Takeaways:
• First takeaway
• Second takeaway

Strategic Implications:
• Key implication

Article content:
${content}`
      }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
}

async function postToLinkedIn(summary: string, articleUrl: string) {
  try {
    const shareContent = {
      author: `urn:li:person:${process.env.LINKEDIN_USER_ID}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: `${summary}\n\nRead more: ${articleUrl}`
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shareContent)
    });

    if (!response.ok) {
      throw new Error(`LinkedIn API error: ${response.statusText}`);
    }

    console.log('Successfully posted to LinkedIn');
  } catch (error) {
    console.error('Error posting to LinkedIn:', error);
    throw error;
  }
}

interface CrawlerItem {
  title: string;
  content: string;
  url: string;
}

const scheduledCrawlerHandler = async (): Promise<HandlerResponse> => {
  try {
    console.log("Starting scheduled crawler...");
    
    // Validate environment variables before running
    try {
      validateEnv();
    } catch (envError) {
      console.error("Environment validation failed:", envError);
      throw envError;
    }
    
    // Log configuration (without sensitive values)
    console.log("Scheduled Crawler configuration:", {
      supabaseUrl: process.env.VITE_SUPABASE_URL,
      hasServiceKey: !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
      hasLinkedInToken: !!LINKEDIN_ACCESS_TOKEN,
      hasOpenRouterKey: !!OPENROUTER_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Run crawler and get new items
      console.log("Starting crawler execution...");
      const crawlerResult = await runCrawler();
      console.log("Crawler execution completed:", {
        resultType: typeof crawlerResult,
        isArray: Array.isArray(crawlerResult),
        length: Array.isArray(crawlerResult) ? crawlerResult.length : 'not an array'
      });

      if (!crawlerResult) {
        throw new Error('Crawler returned no result');
      }

      const newItems = crawlerResult as unknown as CrawlerItem[];
      console.log(`Found ${newItems?.length || 0} new items`);

      // Process each new item
      if (newItems && newItems.length > 0) {
        for (const item of newItems) {
          try {
            // Generate summary
            console.log(`Generating summary for: ${item.title}`);
            const summary = await generateSummary(item.content);

            // Post to LinkedIn
            if (summary) {
              console.log(`Posting to LinkedIn: ${item.title}`);
              await postToLinkedIn(summary, item.url);
            }
          } catch (itemError) {
            console.error(`Error processing item ${item.title}:`, itemError);
            // Continue with next item even if one fails
            continue;
          }
        }
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: "Scheduled Crawler executed successfully",
          newItems: newItems?.length || 0,
          timestamp: new Date().toISOString()
        })
      };
    } catch (crawlerError) {
      console.error("Error during crawler execution:", {
        error: crawlerError,
        message: crawlerError instanceof Error ? crawlerError.message : 'Unknown error',
        stack: crawlerError instanceof Error ? crawlerError.stack : undefined
      });
      throw new Error(`Crawler execution failed: ${crawlerError instanceof Error ? crawlerError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error("Error running scheduled crawler:", {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: "Failed to run scheduled crawler",
        message: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Export the handler function
export const handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'OK' })  // Return valid JSON even for OPTIONS
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Method not allowed',
        message: `Method ${event.httpMethod} is not allowed. Only POST requests are accepted.`
      })
    };
  }

  try {
    // Run the crawler
    const response = await scheduledCrawlerHandler();
    
    // Ensure response has a body
    if (!response.body) {
      response.body = JSON.stringify({
        message: 'Crawler completed with no response body',
        timestamp: new Date().toISOString()
      });
    }
    
    // Add CORS headers to the response
    return {
      ...response,
      headers: {
        ...corsHeaders,
        ...response.headers
      }
    };
  } catch (error) {
    console.error("Error in handler:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Failed to run crawler",
        message: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
    };
  }
}; 