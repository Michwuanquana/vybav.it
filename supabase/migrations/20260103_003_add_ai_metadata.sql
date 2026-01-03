-- Migration: Add AI metadata and search
-- Description: AI-generated tags, visual analysis, and full-text search support
-- Date: 2026-01-03

-- Add AI and search columns to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS ai_tags JSONB,
  ADD COLUMN IF NOT EXISTS ai_description TEXT,
  ADD COLUMN IF NOT EXISTS search_keywords TEXT[],
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Add product type and style information
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'furniture',
  ADD COLUMN IF NOT EXISTS subcategory TEXT,
  ADD COLUMN IF NOT EXISTS style_tags TEXT[],
  ADD COLUMN IF NOT EXISTS finish TEXT;

COMMENT ON COLUMN products.ai_tags IS 'AI-generated visual tags and metadata (JSONB: visual_features, detected_colors, dominant_color, texture, complexity)';
COMMENT ON COLUMN products.ai_description IS 'AI-generated product description for users';
COMMENT ON COLUMN products.search_keywords IS 'Search keywords for better findability';
COMMENT ON COLUMN products.search_vector IS 'Full-text search vector (auto-generated)';
COMMENT ON COLUMN products.product_type IS 'Type: furniture, lighting, textile, decoration, storage';
COMMENT ON COLUMN products.subcategory IS 'More specific category than main category';
COMMENT ON COLUMN products.style_tags IS 'Style tags: scandinavian, minimalist, modern, rustic, industrial, etc.';
COMMENT ON COLUMN products.finish IS 'Surface finish: matte, glossy, textured, natural, polished';

-- Create function to update search vector
CREATE OR REPLACE FUNCTION products_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('simple', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.ai_description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.description_visual, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.category, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.subcategory, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.brand, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.search_keywords, ' '), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector
DROP TRIGGER IF EXISTS products_search_vector_trigger ON products;
CREATE TRIGGER products_search_vector_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_search_vector_update();

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_products_style_tags ON products USING GIN(style_tags);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);

-- Example ai_tags structure:
-- {
--   "visual_features": ["metal_legs", "wooden_top", "modern_design"],
--   "detected_colors": ["#FFFFFF", "#8B7355", "#2C2C2C"],
--   "dominant_color": "#FFFFFF",
--   "color_palette": ["white", "beige", "gray"],
--   "texture": "smooth",
--   "complexity": "simple",
--   "confidence": 0.92
-- }
