import { startCrawler } from '../src/server/crawler';

console.log('Starting local crawler...');
startCrawler()
  .then(() => {
    console.log('Crawler finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Crawler failed:', error);
    process.exit(1);
  }); 