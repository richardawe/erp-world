import { Handler, schedule } from "@netlify/functions";
import { main as runCrawler } from "../../src/server/crawler";

const handler: Handler = async (event, context) => {
  try {
    console.log("Starting crawler...");
    await runCrawler();
    console.log("Crawler finished successfully");
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Crawler executed successfully" })
    };
  } catch (error) {
    console.error("Error running crawler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to run crawler" })
    };
  }
};

// Run every 6 hours
export const handler = schedule("0 */6 * * *", handler); 