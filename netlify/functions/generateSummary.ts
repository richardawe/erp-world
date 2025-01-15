import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

interface SummaryRequest {
  content: string;
  aspect?: 'market_trends' | 'competitive_moves' | 'technology_impacts' | 'general';
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const getPromptForAspect = (content: string, aspect: string) => {
  const basePrompt = `As an executive advisor, analyze this article and provide:
1. Executive Summary (2-3 bullet points)
2. Key Takeaways (2-3 points)
3. Strategic Implications (1-2 points)

Article content:
${content}`;

  const aspectPrompts = {
    market_trends: '\nFocus specifically on market trends, industry shifts, and market opportunities.',
    competitive_moves: '\nFocus specifically on competitive landscape, strategic moves by competitors, and market positioning.',
    technology_impacts: '\nFocus specifically on technological innovations, digital transformation impacts, and tech adoption implications.',
    general: ''
  };

  return basePrompt + (aspectPrompts[aspect] || '');
};

const openai = new OpenAI({
  baseURL: OPENROUTER_BASE_URL,
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://github.com/richardawe/erp-world",
    "X-Title": "ERP World",
  }
});

const handler: Handler = async (event) => {
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
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

    const { content, aspect = 'general' } = JSON.parse(event.body) as SummaryRequest;

    if (!content) {
      throw new Error('Content is required');
    }

    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    const prompt = getPromptForAspect(content, aspect);

    console.log('Making request to OpenRouter with:', {
      url: `${OPENROUTER_BASE_URL}/chat/completions`,
      model: 'meta-llama/llama-3.1-405b-instruct:free',
      contentLength: content.length,
      aspect
    });

    const completion = await openai.chat.completions.create({
      model: 'meta-llama/llama-3.1-405b-instruct:free',
      messages: [{
        role: 'user',
        content: prompt
      }],
      temperature: 0.7,
      max_tokens: 1000
    });

    const summary = completion.choices?.[0]?.message?.content;

    if (!summary) {
      console.error('Unexpected API response format:', completion);
      throw new Error('Invalid response format from OpenRouter API');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        summary
      })
    };
  } catch (error) {
    console.error('Summary generation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate summary',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      })
    };
  }
};

export { handler }; 