import { HandlerEvent } from '@netlify/functions';
import { main, updateOracleFeed } from '../../src/server/crawler';

// Remove all unused functions and constants, keep only the handler
export default async function handler(event: HandlerEvent) {
  console.log('scheduledCrawler function invoked with event:', {
    httpMethod: event.httpMethod,
    body: event.body,
    headers: event.headers
  });

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
    console.warn(`Rejected ${event.httpMethod} request`);
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
    // Parse request body with error handling
    let body;
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Invalid JSON',
          message: 'Failed to parse request body'
        }),
      };
    }

    console.log('Processing request with body:', body);

    // Handle Oracle feed update
    if (body.updateOracleFeed) {
      console.log('Updating Oracle feed...');
      try {
        await updateOracleFeed();
        console.log('Successfully updated Oracle feed');
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
      } catch (oracleError) {
        console.error('Failed to update Oracle feed:', oracleError);
        throw oracleError;
      }
    }

    // Handle scheduled event
    if (event.body === '{"scheduled":true}') {
      console.log('Running scheduled crawler...');
      try {
        await main();
        console.log('Successfully completed scheduled crawl');
        return { 
          statusCode: 200,
          body: JSON.stringify({ message: 'Successfully completed scheduled crawl' })
        };
      } catch (scheduledError) {
        console.error('Failed scheduled crawl:', scheduledError);
        throw scheduledError;
      }
    }

    // Handle manual trigger (with optional sourceId)
    if (body.manual) {
      console.log('Running manual crawler...');
      try {
        const sourceId = body.sourceId ? parseInt(body.sourceId) : undefined;
        console.log(`Crawling${sourceId ? ` source ${sourceId}` : ' all sources'}...`);
        
        const result = await main(3, sourceId);
        console.log('Successfully completed manual crawl');
        
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
      } catch (manualError) {
        console.error('Failed manual crawl:', manualError);
        throw manualError;
      }
    }

    // Invalid request
    console.warn('Invalid request received:', body);
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
    console.error('Error in scheduledCrawler:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    });

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      }),
    };
  }
} 