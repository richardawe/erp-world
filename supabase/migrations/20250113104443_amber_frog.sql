/*
  # Create articles table and related functions

  1. New Tables
    - `articles`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `summary` (text)
      - `source` (text, not null)
      - `url` (text, not null, unique)
      - `image_url` (text)
      - `published_at` (timestamptz, not null)
      - `vendor` (text, not null)
      - `categories` (text[], not null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `articles` table
    - Add policy for public read access
    - Add policy for service role insert access
*/

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  source text NOT NULL,
  url text NOT NULL UNIQUE,
  image_url text,
  published_at timestamptz NOT NULL,
  vendor text NOT NULL,
  categories text[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access"
  ON articles
  FOR SELECT
  TO public
  USING (true);

-- Create policy for service role insert/update access
CREATE POLICY "Allow service role insert access"
  ON articles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow service role update access"
  ON articles
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);