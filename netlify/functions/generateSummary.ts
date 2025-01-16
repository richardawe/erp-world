import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

// Define all possible aspects to ensure type safety
type ArticleAspect = 'market_trends' | 'competitive_moves' | 'technology_impacts' | 'general' | 'ai_in_erp';

interface SummaryRequest {
  content: string;
  aspect?: ArticleAspect;
}

// Move to environment variable for flexibility
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Define headers based on the origin
const getHeaders = (requestOrigin?: string) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(requestOrigin || '') 
    ? requestOrigin 
    : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
});

const getAIInERPPrompt = (articles: string[]): string => {
  return `As an AI and ERP expert, analyze these articles and provide a comprehensive daily summary of AI developments in ERP systems:

Executive Summary:
• Overview of key AI developments in ERP today
• Major trends and patterns observed
• Potential impact on ERP industry

Key Innovations:
• Notable AI features and capabilities
• Technical breakthroughs
• Integration approaches

Strategic Implications:
• Business impact assessment
• Adoption considerations
• Future outlook

Articles content:
${articles.join('\n\n---\n\n')}`;
};

const getPromptForAspect = (content: string, aspect: ArticleAspect): string => {
  // Extract URLs from the content using a regex pattern
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlPattern) || [];
  const urlList = urls.length ? '\n\nRelevant Links:\n' + urls.join('\n') : '';

  const aspectPrompts = {
    market_trends: `As a market analyst, analyze this article focusing on market trends and industry dynamics. Format your response EXACTLY as follows:

Executive Summary:
• Key market trends and industry shifts identified
• Market size and growth potential highlighted
• Notable market opportunities or challenges

Key Takeaways:
• Current market dynamics and their implications
• Emerging trends and their potential impact
• Market demand and consumer behavior insights

Strategic Implications:
• Long-term market outlook and growth trajectory
• Recommended market positioning strategies`,

    competitive_moves: `As a competitive strategy advisor, analyze this article focusing on competitive landscape. Format your response EXACTLY as follows:

Executive Summary:
• Key competitive moves and strategic shifts
• Changes in competitive positioning
• Notable competitive advantages or threats

Key Takeaways:
• Competitor strategies and their implications
• Market share and positioning insights
• Competitive advantages and disadvantages

Strategic Implications:
• Long-term competitive impact
• Recommended competitive response strategies`,

    technology_impacts: `As a technology strategist, analyze this article focusing on technological implications. Format your response EXACTLY as follows:

Executive Summary:
• Key technological innovations or breakthroughs
• Technical implementation considerations
• Potential disruption to existing systems

Key Takeaways:
• Technical feasibility and requirements
• Integration challenges and solutions
• Technology adoption implications

Strategic Implications:
• Long-term technology impact
• Recommended implementation approach`,

    general: `As an executive advisor, analyze this article and provide a comprehensive analysis. Format your response EXACTLY as follows:

Executive Summary:
• First key insight
• Second key insight
• Third key insight (if applicable)

Key Takeaways:
• First takeaway
• Second takeaway
• Third takeaway (if applicable)

Strategic Implications:
• First implication
• Second implication (if applicable)`,

    ai_in_erp: getAIInERPPrompt([content])
  };

  const basePrompt = `${aspectPrompts[aspect]}

Use ONLY the bullet point format shown above with the "•" symbol. Do not use any other formatting or symbols. Keep each bullet point concise and focused.

Article content:
${content}${urlList}`;

  return basePrompt;
};

// Create OpenAI client only once
const openai = new OpenAI({
  baseURL: OPENROUTER_BASE_URL,
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://github.com/richardawe/erp-world",
    "X-Title": "ERP World"
  }
});

// Constants for API configuration
const API_CONFIG = {
  model: 'meta-llama/llama-3.1-70b-instruct:free',
  temperature: 0.7,
  max_tokens: 1000,
} as const;

const handler: Handler = async (event) => {
  console.log('generateSummary function invoked.');

  const headers = getHeaders(event.headers.origin);
  console.log('CORS headers set:', headers);

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request.');
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    console.warn(`Method not allowed: ${event.httpMethod}`);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    console.log('Processing POST request.');

    if (!event.body) {
      console.error('Request body is missing.');
      throw new Error('Request body is missing');
    }

    const { content, aspect = 'general' } = JSON.parse(event.body) as SummaryRequest;
    console.log('Parsed request:', { contentLength: content?.length, aspect });

    if (!content) {
      throw new Error('Content is required');
    }

    if (!OPENROUTER_API_KEY) {
      console.error('OpenRouter API key is missing');
      throw new Error('OpenRouter API key not configured');
    }

    const prompt = getPromptForAspect(content, aspect as ArticleAspect);
    console.log('Generated prompt:', { promptLength: prompt.length });

    console.log('Making request to OpenRouter with:', {
      baseURL: OPENROUTER_BASE_URL,
      model: API_CONFIG.model,
      contentLength: content.length,
      aspect
    });

    try {
      const completion = await openai.chat.completions.create({
        ...API_CONFIG,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      console.log('OpenRouter API response received:', {
        status: 'success',
        hasChoices: !!completion.choices?.length,
        firstChoice: completion.choices?.[0]
      });

      const summary = completion.choices?.[0]?.message?.content;

      if (!summary) {
        console.error('Unexpected API response format:', completion);
        throw new Error('Invalid response format from OpenRouter API');
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ summary })
      };
    } catch (apiError) {
      console.error('OpenRouter API error:', apiError);
      throw new Error(`OpenRouter API error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
    }
  } catch (error: unknown) {
    console.error('Summary generation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary';
    const statusCode = errorMessage.includes('API key') ? 503 : 500;

    return {
      statusCode,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      })
    };
  }
};

export { handler };