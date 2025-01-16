import { Handler, schedule } from "@netlify/functions";
import { main as runCrawler } from "../../src/server/crawler";
import OpenAI from 'openai';
import type { Article } from '../../src/types';

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

const scheduledCrawlerHandler: Handler = async (event, context) => {
  try {
    console.log("Starting scheduled crawler...");
    
    // Validate environment variables before running
    validateEnv();
    
    // Log configuration (without sensitive values)
    console.log("Scheduled Crawler configuration:", {
      supabaseUrl: process.env.VITE_SUPABASE_URL,
      hasServiceKey: !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
      hasLinkedInToken: !!LINKEDIN_ACCESS_TOKEN,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Run crawler
      await runCrawler();
      console.log("Crawler execution completed");

      // For now, return success as we're still implementing the LinkedIn integration
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: "Scheduled Crawler executed successfully",
          timestamp: new Date().toISOString()
        })
      };
    } catch (crawlerError) {
      console.error("Error during crawler execution:", crawlerError);
      throw new Error(`Crawler execution failed: ${crawlerError instanceof Error ? crawlerError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error("Error running scheduled crawler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Failed to run scheduled crawler",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Export the scheduled handler directly
export const handler = schedule("0 */6 * * *", async (event, context) => {
  // If it's a direct POST request or a scheduled event, run the crawler
  if (event.httpMethod === 'POST' || event.type === 'scheduled') {
    return scheduledCrawlerHandler(event, context);
  }

  // For any other HTTP method, return method not allowed
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
}); 