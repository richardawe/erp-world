import { Handler, HandlerEvent } from '@netlify/functions';
import { main, updateOracleFeed } from '../../src/server/crawler';

// Add CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Extend HandlerEvent to include isScheduled property
interface ScheduledHandlerEvent extends HandlerEvent {
  isScheduled?: boolean;
}

// Validate environment variables
function validateEnvironment() {
  // In development, we use VITE_ prefixed variables
  const isDevelopment = process.env.NODE_ENV === 'development';
  const supabaseUrl = isDevelopment 
    ? process.env.VITE_SUPABASE_URL 
    : (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const supabaseKey = isDevelopment
    ? process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    : (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

  console.log('Environment variable status in Netlify function:', {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    VITE_SUPABASE_SERVICE_ROLE_KEY: !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
    CONTEXT: process.env.CONTEXT || 'unknown',
    isDevelopment,
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseKey?.length || 0
  });

  if (!supabaseUrl || !supabaseKey) {
    const missingVars: string[] = [];
    if (!supabaseUrl) missingVars.push(isDevelopment ? 'VITE_SUPABASE_URL' : 'SUPABASE_URL');
    if (!supabaseKey) missingVars.push(isDevelopment ? 'VITE_SUPABASE_SERVICE_ROLE_KEY' : 'SUPABASE_SERVICE_ROLE_KEY');
    
    const error = new Error(`Missing required environment variables in Netlify function: ${missingVars.join(', ')}`);
    console.error('Environment configuration error in Netlify function:', {
      error: error.message,
      missingVars,
      env: process.env.NODE_ENV,
      context: process.env.CONTEXT || 'unknown',
      isDevelopment
    });
    throw error;
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (urlError) {
    console.error('Invalid Supabase URL format:', {
      error: urlError instanceof Error ? urlError.message : 'Unknown error',
      urlLength: supabaseUrl.length
    });
    throw new Error('Invalid Supabase URL format');
  }

  // Set the environment variables for the crawler
  if (isDevelopment) {
    if (!process.env.SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
      process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    }
  }
}

const handler: Handler = async (event: ScheduledHandlerEvent) => {
  console.log('scheduledCrawler function invoked with event:', {
    httpMethod: event.httpMethod,
    body: event.body,
    headers: event.headers,
    path: event.path,
    queryStringParameters: event.queryStringParameters,
    isScheduled: event.isScheduled || false
  });

  try {
    // Validate environment variables first
    validateEnvironment();

    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'OK' }),
      };
    }

    // Parse request body with error handling
    let body;
    try {
      body = event.body ? JSON.parse(event.body) : {};
      console.log('Parsed request body:', body);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Invalid JSON',
          message: 'Failed to parse request body',
          details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
        }),
      };
    }

    // Validate request body
    if (!body || (typeof body !== 'object')) {
      console.error('Invalid request body format:', body);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Invalid request',
          message: 'Request body must be a valid JSON object'
        }),
      };
    }

    // Handle scheduled event
    if (event.isScheduled || (body && 'next_run' in body)) {
      console.log('Running scheduled crawler...');
      try {
        const result = await main();
        console.log('Successfully completed scheduled crawl:', result);
        return { 
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ 
            message: 'Successfully completed scheduled crawl',
            result: result
          })
        };
      } catch (scheduledError) {
        console.error('Failed scheduled crawl:', scheduledError);
        throw new Error(
          `Failed scheduled crawl: ${scheduledError instanceof Error ? scheduledError.message : 'Unknown error'}`
        );
      }
    }

    // Only allow POST requests for manual triggers
    if (event.httpMethod !== 'POST') {
      console.warn(`Rejected ${event.httpMethod} request`);
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Method not allowed',
          message: `HTTP method ${event.httpMethod} is not supported.`
        }),
      };
    }

    // Handle Oracle feed update
    if (body.updateOracleFeed) {
      console.log('Updating Oracle feed...');
      try {
        await updateOracleFeed();
        console.log('Successfully updated Oracle feed');
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ 
            message: 'Successfully updated Oracle feed'
          }),
        };
      } catch (oracleError) {
        console.error('Failed to update Oracle feed:', oracleError);
        throw new Error(
          `Failed to update Oracle feed: ${oracleError instanceof Error ? oracleError.message : 'Unknown error'}`
        );
      }
    }

    // Handle manual trigger (with optional sourceId)
    if (body.manual) {
      console.log('Running manual crawler...');
      try {
        const sourceId = body.sourceId ? parseInt(body.sourceId) : undefined;
        console.log(`Crawling${sourceId ? ` source ${sourceId}` : ' all sources'}...`);
        
        const result = await main(3, sourceId);
        console.log('Successfully completed manual crawl:', result);
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ 
            message: result.message,
            result: result.items,
            errors: result.errors
          }),
        };
      } catch (manualError) {
        console.error('Failed manual crawl:', {
          error: manualError,
          message: manualError instanceof Error ? manualError.message : 'Unknown error',
          stack: manualError instanceof Error ? manualError.stack : undefined,
          type: manualError instanceof Error ? manualError.constructor.name : typeof manualError
        });
        throw new Error(
          `Failed manual crawl: ${manualError instanceof Error ? manualError.message : 'Unknown error'}`
        );
      }
    }

    // Invalid request
    console.warn('Invalid request received:', body);
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Invalid request',
        message: 'Request must be a scheduled event, manual trigger, or Oracle feed update',
        receivedBody: body
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
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      }),
    };
  }
};

export { handler }; 