-- Migration: Add product images support
-- Description: Enables multiple images per product (lifestyle, detail, angle views)
-- Date: 2026-01-03

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT DEFAULT 'gallery',
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  width_px INTEGER,
  height_px INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_images_type ON product_images(image_type);
CREATE INDEX IF NOT EXISTS idx_images_sort ON product_images(product_id, sort_order);

COMMENT ON TABLE product_images IS 'Multiple images per product for gallery and different views';
COMMENT ON COLUMN product_images.image_type IS 'Image type: main, lifestyle, detail, angle_front, angle_side, angle_top, gallery';
COMMENT ON COLUMN product_images.sort_order IS 'Display order (0 = first/primary)';
