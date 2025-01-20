import { HandlerEvent } from '@netlify/functions';
import { main, updateOracleFeed } from '../../src/server/crawler';

// Remove all unused functions and constants, keep only the handler
export default async function handler(event: HandlerEvent) {
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ message: 'OK' }),
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Method not allowed',
        message: `HTTP method ${event.httpMethod} is not supported.`
      }),
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    console.log('Request body:', body);

    // Handle Oracle feed update
    if (body.updateOracleFeed) {
      console.log('Updating Oracle feed...');
      await updateOracleFeed();
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: 'Successfully updated Oracle feed'
        }),
      };
    }

    // Handle scheduled event
    if (event.body === '{"scheduled":true}') {
      console.log('Running scheduled crawler...');
      await main();
      return { statusCode: 200 };
    }

    // Handle manual trigger (with optional sourceId)
    if (body.manual) {
      console.log('Running manual crawler...');
      const sourceId = body.sourceId ? parseInt(body.sourceId) : undefined;
      const result = await main(3, sourceId);
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: sourceId ? 
            `Successfully crawled source ${sourceId}` : 
            'Successfully ran crawler',
          result 
        }),
      };
    }

    // Invalid request
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Invalid request',
        message: 'Request must be a scheduled event or manual trigger'
      }),
    };

  } catch (error) {
    console.error('Error in scheduledCrawler:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
    };
  }
} 