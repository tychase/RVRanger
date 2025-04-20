-- Add search_vector column to rv_listings table
ALTER TABLE rv_listings ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update existing rows to populate the search vector
UPDATE rv_listings 
SET search_vector = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') || 
  setweight(to_tsvector('english', coalesce(description, '')), 'B');

-- Create a trigger to automatically update search_vector when title or description is updated
CREATE OR REPLACE FUNCTION rv_listings_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rv_listings_search_vector_trigger ON rv_listings;
CREATE TRIGGER rv_listings_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, description ON rv_listings
FOR EACH ROW
EXECUTE FUNCTION rv_listings_search_vector_update();

-- Create a GIN index for full-text search
CREATE INDEX IF NOT EXISTS rv_listings_search_idx ON rv_listings USING GIN (search_vector);