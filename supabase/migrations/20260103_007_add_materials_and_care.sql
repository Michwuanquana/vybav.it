-- Migration: Add detailed materials and care instructions
-- Description: Sustainability, materials, and product care
-- Date: 2026-01-03

-- Add material and sustainability columns
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS materials_detailed JSONB,
  ADD COLUMN IF NOT EXISTS sustainability_score INTEGER CHECK (sustainability_score >= 0 AND sustainability_score <= 100),
  ADD COLUMN IF NOT EXISTS eco_friendly_tags TEXT[],
  ADD COLUMN IF NOT EXISTS care_instructions TEXT,
  ADD COLUMN IF NOT EXISTS is_functional BOOLEAN DEFAULT true;

COMMENT ON COLUMN products.materials_detailed IS 'Detailed materials (JSONB: primary, secondary, certifications, recycled_content_percent)';
COMMENT ON COLUMN products.sustainability_score IS 'Sustainability score 0-100';
COMMENT ON COLUMN products.eco_friendly_tags IS 'Eco tags: recyclable, sustainable_wood, low_voc, fsc_certified, recycled_materials';
COMMENT ON COLUMN products.care_instructions IS 'How to care for the product';
COMMENT ON COLUMN products.is_functional IS 'false for purely decorative items';

CREATE INDEX IF NOT EXISTS idx_products_sustainability ON products(sustainability_score DESC) WHERE sustainability_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_eco_tags ON products USING GIN(eco_friendly_tags);

-- Example materials_detailed structure:
-- {
--   "primary": "oak_wood",
--   "secondary": ["metal", "fabric"],
--   "certifications": ["FSC", "PEFC"],
--   "recycled_content_percent": 30,
--   "origin_country": "Sweden",
--   "treatment": "lacquered"
-- }
