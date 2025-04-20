-- Add a tsvector column for full-text search
ALTER TABLE "rv_listings" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Update existing records to have search vectors
UPDATE "rv_listings" SET search_vector = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(location, '')), 'C');

-- Create a function to automatically update the search vector when records change
CREATE OR REPLACE FUNCTION rv_listings_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function
DROP TRIGGER IF EXISTS rv_listings_search_vector_update ON "rv_listings";
CREATE TRIGGER rv_listings_search_vector_update
  BEFORE INSERT OR UPDATE ON "rv_listings"
  FOR EACH ROW
  EXECUTE FUNCTION rv_listings_search_vector_update();

-- Create a GIN index on the search_vector for efficient searches
CREATE INDEX IF NOT EXISTS rv_listings_search_vector_idx ON "rv_listings" USING GIN(search_vector);

-- Create B-tree indexes on commonly filtered columns for faster filtering
CREATE INDEX IF NOT EXISTS rv_listings_price_idx ON "rv_listings" (price);
CREATE INDEX IF NOT EXISTS rv_listings_year_idx ON "rv_listings" (year);
CREATE INDEX IF NOT EXISTS rv_listings_manufacturer_id_idx ON "rv_listings" (manufacturer_id);
CREATE INDEX IF NOT EXISTS rv_listings_chassis_type_id_idx ON "rv_listings" (chassis_type_id);