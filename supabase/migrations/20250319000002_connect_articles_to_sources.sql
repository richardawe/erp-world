-- Add source_id column to articles table (nullable at first)
ALTER TABLE articles
ADD COLUMN source_id BIGINT REFERENCES sources(id);

-- Create index for better join performance
CREATE INDEX articles_source_id_idx ON articles(source_id);

-- Update existing articles to match sources based on vendor name
UPDATE articles a
SET source_id = s.id
FROM sources s
WHERE a.vendor = s.vendor;

-- Handle any remaining articles without source_id by creating default sources
DO $$
DECLARE
    vendor_name text;
BEGIN
    -- For each vendor in articles that doesn't have a matching source
    FOR vendor_name IN 
        SELECT DISTINCT vendor 
        FROM articles 
        WHERE source_id IS NULL
    LOOP
        -- Insert a new source for this vendor if it doesn't exist
        INSERT INTO sources (vendor, url, type, active)
        VALUES (
            vendor_name,
            'https://' || lower(vendor_name) || '.com',
            'rss',
            true
        )
        ON CONFLICT (url) DO NOTHING
        RETURNING id;

        -- Update articles for this vendor
        UPDATE articles a
        SET source_id = s.id
        FROM sources s
        WHERE a.vendor = s.vendor
        AND a.source_id IS NULL;
    END LOOP;
END $$;

-- Verify no articles are left without source_id
DO $$
DECLARE
    null_count integer;
BEGIN
    SELECT COUNT(*) INTO null_count FROM articles WHERE source_id IS NULL;
    IF null_count > 0 THEN
        RAISE EXCEPTION 'There are still % articles without source_id', null_count;
    END IF;
END $$;

-- Now make source_id NOT NULL
ALTER TABLE articles
ALTER COLUMN source_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE articles
ADD CONSTRAINT fk_articles_source
FOREIGN KEY (source_id)
REFERENCES sources(id)
ON DELETE CASCADE; 