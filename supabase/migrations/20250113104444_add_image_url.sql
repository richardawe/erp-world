-- Add image_url column to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_url text; 