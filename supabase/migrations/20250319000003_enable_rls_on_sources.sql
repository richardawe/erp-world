-- Enable RLS on sources table
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- Create policies for sources table
-- Allow public read access to active sources
CREATE POLICY "Allow public read access to active sources"
ON sources
FOR SELECT
TO public
USING (active = true);

-- Allow authenticated users to manage sources
CREATE POLICY "Allow authenticated users to manage sources"
ON sources
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure the table is accessible via the API
GRANT SELECT ON sources TO anon;
GRANT SELECT ON sources TO authenticated;
GRANT ALL ON sources TO service_role; 