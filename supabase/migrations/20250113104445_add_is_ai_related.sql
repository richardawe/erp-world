-- Add is_ai_related column to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_ai_related boolean DEFAULT false;

-- Update existing articles to set is_ai_related based on categories and content
UPDATE articles 
SET is_ai_related = true 
WHERE 'AI Innovation' = ANY(categories) 
   OR title ILIKE '%artificial intelligence%'
   OR title ILIKE '%machine learning%'
   OR title ILIKE '%AI%'
   OR summary ILIKE '%artificial intelligence%'
   OR summary ILIKE '%machine learning%'
   OR summary ILIKE '%AI%'; 