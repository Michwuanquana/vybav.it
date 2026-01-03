-- Migration: Add product variants support
-- Description: Extends products table and adds variants table for multiple product options
-- Date: 2026-01-03

-- Add new columns to products table for variants and availability
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'in_stock',
  ADD COLUMN IF NOT EXISTS stock_info TEXT,
  ADD COLUMN IF NOT EXISTS is_seasonal BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS season TEXT,
  ADD COLUMN IF NOT EXISTS collection_name TEXT;

-- Add comment to column
COMMENT ON COLUMN products.availability_status IS 'Product availability: in_stock, low_stock, out_of_stock, discontinued';
COMMENT ON COLUMN products.stock_info IS 'Human-readable stock info from source (e.g., "Do vyprodání zásob")';
COMMENT ON COLUMN products.is_seasonal IS 'Whether product is seasonal (e.g., Christmas items)';
COMMENT ON COLUMN products.season IS 'Season identifier: christmas, summer, spring, fall';

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  color TEXT,
  size TEXT,
  material TEXT,
  price_czk INTEGER,
  image_url TEXT,
  sku TEXT UNIQUE,
  availability_status TEXT DEFAULT 'in_stock',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for variants
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_availability ON product_variants(availability_status);
CREATE INDEX IF NOT EXISTS idx_variants_color ON product_variants(color);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku) WHERE sku IS NOT NULL;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE product_variants IS 'Product variants (different colors, sizes, materials of the same base product)';
