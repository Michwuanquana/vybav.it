-- Migration: Add placement_type for product categorization
-- Description: Adds placement_type column to categorize products by where they are placed (wall, floor, table, ceiling, window, any)
-- Date: 2026-01-05

-- Add placement_type column
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS placement_type TEXT DEFAULT 'any';

-- Create index for placement_type
CREATE INDEX IF NOT EXISTS idx_products_placement_type ON products(placement_type);

-- Add comment
COMMENT ON COLUMN products.placement_type IS 'Placement type: wall, floor, table, ceiling, window, any';
