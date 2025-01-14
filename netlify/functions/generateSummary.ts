import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';
import type { Response } from 'node-fetch';

interface SummaryRequest {
  content: string;
  aspect?: 'market_trends' | 'competitive_moves' | 'technology_impacts' | 'general';
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// CORS headers
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
      url: OPENROUTER_URL,
      model: 'anthropic/claude-2',
      contentLength: content.length,
      aspect
    });

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/richardawe/erp-world',
        'X-Title': 'ERP World'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-2',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenRouter API error:', data);
      throw new Error(data.error?.message || 'Failed to generate summary');
    }

    if (!data.choices?.[0]?.message?.content) {
      console.error('Unexpected API response format:', data);
      throw new Error('Invalid response format from OpenRouter API');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        summary: data.choices[0].message.content
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