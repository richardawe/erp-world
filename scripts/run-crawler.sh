#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Go to project directory
cd "$PROJECT_DIR"

# Load environment variables
source .env

# Run the crawler
npm run crawl

# Log the completion
echo "Crawler finished at $(date)" >> crawler.log 