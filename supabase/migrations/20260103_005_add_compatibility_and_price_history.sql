-- Migration: Add product compatibility and price history
-- Description: Track which products work well together and price changes
-- Date: 2026-01-03

-- Create product compatibility table
CREATE TABLE IF NOT EXISTS product_compatibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_a_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_b_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  compatibility_score DECIMAL(3,2) CHECK (compatibility_score >= 0 AND compatibility_score <= 1),
  reason TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_a_id, product_b_id)
);

CREATE INDEX IF NOT EXISTS idx_compat_product_a ON product_compatibility(product_a_id);
CREATE INDEX IF NOT EXISTS idx_compat_product_b ON product_compatibility(product_b_id);
CREATE INDEX IF NOT EXISTS idx_compat_score ON product_compatibility(compatibility_score DESC);

COMMENT ON TABLE product_compatibility IS 'Product compatibility for AI recommendations';
COMMENT ON COLUMN product_compatibility.compatibility_score IS 'Compatibility score from 0.00 to 1.00';
COMMENT ON COLUMN product_compatibility.reason IS 'Reason: matching_style, color_complement, same_collection, ai_suggested, user_preference';
COMMENT ON COLUMN product_compatibility.source IS 'Source: manual, ai_generated, user_behavior';

-- Create price history table
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price_czk INTEGER NOT NULL,
  discount_percentage INTEGER CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  promotion_name TEXT,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_dates ON price_history(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_price_history_active ON price_history(product_id, valid_from, valid_until) 
  WHERE valid_until IS NULL OR valid_until >= NOW();

COMMENT ON TABLE price_history IS 'Product price history and promotions';
COMMENT ON COLUMN price_history.discount_percentage IS 'Discount percentage (0-100)';
COMMENT ON COLUMN price_history.valid_from IS 'Price valid from this date';
COMMENT ON COLUMN price_history.valid_until IS 'Price valid until this date (NULL = current price)';

-- Create view for current prices
CREATE OR REPLACE VIEW current_prices AS
SELECT DISTINCT ON (product_id)
  product_id,
  price_czk,
  discount_percentage,
  promotion_name,
  valid_from,
  valid_until
FROM price_history
WHERE valid_from <= NOW()
  AND (valid_until IS NULL OR valid_until >= NOW())
ORDER BY product_id, valid_from DESC;

COMMENT ON VIEW current_prices IS 'Current active prices for all products';
