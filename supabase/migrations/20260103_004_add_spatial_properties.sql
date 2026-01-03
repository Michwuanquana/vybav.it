-- Migration: Add spatial and physical properties
-- Description: Dimensions, weight, placement requirements for AI room fitting
-- Date: 2026-01-03

-- Add physical and spatial properties to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS shape TEXT,
  ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS volume_m3 DECIMAL(10,4),
  ADD COLUMN IF NOT EXISTS assembly_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS assembly_time_minutes INTEGER;

-- Add placement and room suitability
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS placement_type TEXT,
  ADD COLUMN IF NOT EXISTS clearance_required_cm JSONB,
  ADD COLUMN IF NOT EXISTS recommended_room_size_m2 DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS suitable_for_rooms TEXT[];

COMMENT ON COLUMN products.shape IS 'Product shape: rectangular, circular, oval, irregular, l-shaped, u-shaped';
COMMENT ON COLUMN products.weight_kg IS 'Product weight in kilograms';
COMMENT ON COLUMN products.volume_m3 IS 'Product volume in cubic meters';
COMMENT ON COLUMN products.assembly_required IS 'Whether product requires assembly';
COMMENT ON COLUMN products.assembly_time_minutes IS 'Estimated assembly time in minutes';
COMMENT ON COLUMN products.placement_type IS 'Placement: floor_standing, wall_mounted, ceiling_mounted, tabletop, freestanding, built-in';
COMMENT ON COLUMN products.clearance_required_cm IS 'Required clearance space (JSONB: front, sides, back, top)';
COMMENT ON COLUMN products.recommended_room_size_m2 IS 'Recommended minimum room size in square meters';
COMMENT ON COLUMN products.suitable_for_rooms IS 'Suitable room types: living_room, bedroom, office, kitchen, bathroom, hallway, dining_room';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_placement ON products(placement_type);
CREATE INDEX IF NOT EXISTS idx_products_rooms ON products USING GIN(suitable_for_rooms);

-- Extend generations table with room context
ALTER TABLE generations
  ADD COLUMN IF NOT EXISTS room_dimensions JSONB,
  ADD COLUMN IF NOT EXISTS lighting_conditions TEXT,
  ADD COLUMN IF NOT EXISTS wall_color TEXT,
  ADD COLUMN IF NOT EXISTS floor_type TEXT;

COMMENT ON COLUMN generations.room_dimensions IS 'Room dimensions (JSONB: width, height, depth in meters)';
COMMENT ON COLUMN generations.lighting_conditions IS 'Lighting: bright, medium, dim, mixed, natural';
COMMENT ON COLUMN generations.floor_type IS 'Floor type: hardwood, carpet, tile, laminate, concrete, vinyl';

-- Example clearance_required_cm structure:
-- {"front": 60, "sides": 10, "back": 5, "top": 0}

-- Example room_dimensions structure:
-- {"width": 4.5, "height": 2.7, "depth": 5.2, "unit": "meters"}
