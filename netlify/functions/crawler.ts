import { Handler, schedule } from "@netlify/functions";
import { main as runCrawler } from "../../src/server/crawler";

// Validate environment variables
function validateEnv() {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

const crawlerHandler: Handler = async (event, context) => {
  try {
    console.log("Starting crawler...");
    
    // Validate environment variables before running
    validateEnv();
    
    // Log configuration (without sensitive values)
    console.log("Crawler configuration:", {
      supabaseUrl: process.env.VITE_SUPABASE_URL,
      hasServiceKey: !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
    await runCrawler();
    console.log("Crawler finished successfully");
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: "Crawler executed successfully",
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error("Error running crawler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Failed to run crawler",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      })
    };
  }
};

// Run every 6 hours
export const handler = schedule("0 */6 * * *", crawlerHandler); 