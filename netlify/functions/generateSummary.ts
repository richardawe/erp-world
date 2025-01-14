import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';
import type { Response } from 'node-fetch';

interface SummaryRequest {
  content: string;
  aspect?: 'market_trends' | 'competitive_moves' | 'technology_impacts' | 'general';
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

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
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  try {
    const { content, aspect = 'general' } = JSON.parse(event.body) as SummaryRequest;

    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    const prompt = getPromptForAspect(content, aspect);

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
      throw new Error(data.error?.message || 'Failed to generate summary');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: data.choices[0].message.content
      })
    };
  } catch (error) {
    console.error('Summary generation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate summary' })
    };
  }
};

export { handler }; 