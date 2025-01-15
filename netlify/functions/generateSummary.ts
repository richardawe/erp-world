import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

// Define all possible aspects to ensure type safety
type ArticleAspect = 'market_trends' | 'competitive_moves' | 'technology_impacts' | 'general';

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

const aspectPrompts: Record<ArticleAspect, string> = {
  market_trends: '\nFocus specifically on market trends, industry shifts, and market opportunities.',
  competitive_moves: '\nFocus specifically on competitive landscape, strategic moves by competitors, and market positioning.',
  technology_impacts: '\nFocus specifically on technological innovations, digital transformation impacts, and tech adoption implications.',
  general: ''
};

const getPromptForAspect = (content: string, aspect: ArticleAspect): string => {
  const basePrompt = `As an executive advisor, analyze this article and provide:
1. Executive Summary (2-3 bullet points)
2. Key Takeaways (2-3 points)
3. Strategic Implications (1-2 points)

Article content:
${content}`;

  return basePrompt + aspectPrompts[aspect];
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
  // Get headers based on the request origin
  const headers = getHeaders(event.headers.origin);

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    if (!event.body) {
      throw new Error('Request body is missing');
    }

    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    const { content, aspect = 'general' } = JSON.parse(event.body) as SummaryRequest;

    if (!content?.trim()) {
      throw new Error('Content is required and cannot be empty');
    }

    // Validate aspect
    if (aspect && !aspectPrompts.hasOwnProperty(aspect)) {
      throw new Error(`Invalid aspect: ${aspect}`);
    }

    const prompt = getPromptForAspect(content, aspect as ArticleAspect);

    console.log('Making request to OpenRouter:', {
      model: API_CONFIG.model,
      contentLength: content.length,
      aspect
    });

    const completion = await openai.chat.completions.create({
      ...API_CONFIG,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const summary = completion.choices?.[0]?.message?.content;

    if (!summary) {
      throw new Error('Invalid response format from OpenRouter API');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ summary })
    };

  } catch (error) {
    console.error('Summary generation error:', error);
    
    const statusCode = error instanceof Error && error.message.includes('API key') ? 503 : 500;
    
    return {
      statusCode,
      headers,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate summary',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      })
    };
  }
};

export { handler };