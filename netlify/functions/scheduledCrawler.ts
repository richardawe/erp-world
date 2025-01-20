import { Handler, HandlerEvent } from '@netlify/functions';
import { main as runCrawler } from '../../src/server/crawler';
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

// Maximum number of sources to process in one batch
const BATCH_SIZE = 3;

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

// Main handler function
export const handler: Handler = async (event: HandlerEvent) => {
  try {
    // Validate environment variables first
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

    // For manual triggers via HTTP POST
    if (event.httpMethod === 'POST') {
      console.log('Starting manual crawler execution...');
      const result = await runCrawler(BATCH_SIZE);
      
      // Generate summary for new articles
      if (result && result.length > 0) {
        for (const item of result) {
          try {
            const summary = await generateSummary(item.content);
            await postToLinkedIn(summary, item.url);
          } catch (error) {
            console.error('Error processing article:', error);
            // Continue with next article even if one fails
          }
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, result })
      };
    }
    
    // For scheduled events
    if (event.body === '{"scheduled":true}') {
      console.log('Starting scheduled crawler execution...');
      const newItems = await runCrawler(BATCH_SIZE);
      
      // Generate summary and post to LinkedIn for new articles
      if (newItems && newItems.length > 0) {
        for (const item of newItems) {
          try {
            const summary = await generateSummary(item.content);
            await postToLinkedIn(summary, item.url);
          } catch (error) {
            console.error('Error processing article:', error);
            // Continue with next article even if one fails
          }
        }
      }

      return { statusCode: 200 };
    }

    // For unsupported methods
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Error in handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}; 