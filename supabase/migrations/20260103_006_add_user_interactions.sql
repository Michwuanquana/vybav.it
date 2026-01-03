-- Migration: Add user interactions and favorites
-- Description: Track user behavior for better recommendations
-- Date: 2026-01-03

-- Extend sessions table
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS room_type TEXT,
  ADD COLUMN IF NOT EXISTS budget_min INTEGER,
  ADD COLUMN IF NOT EXISTS budget_max INTEGER,
  ADD COLUMN IF NOT EXISTS style_preferences TEXT[];

COMMENT ON COLUMN sessions.room_type IS 'Room type: living_room, bedroom, office, kitchen, bathroom, dining_room, hallway';
COMMENT ON COLUMN sessions.budget_min IS 'Minimum budget in CZK';
COMMENT ON COLUMN sessions.budget_max IS 'Maximum budget in CZK';
COMMENT ON COLUMN sessions.style_preferences IS 'Preferred styles from user';

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_room_type ON sessions(room_type);

-- Create user interactions table
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  interaction_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_interactions_session ON user_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_interactions_product ON user_interactions(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_interactions_type ON user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_timestamp ON user_interactions(timestamp DESC);

COMMENT ON TABLE user_interactions IS 'User interaction tracking for analytics and recommendations';
COMMENT ON COLUMN user_interactions.interaction_type IS 'Type: view, click, add_to_room, remove_from_room, favorite, unfavorite, purchase_intent, share';
COMMENT ON COLUMN user_interactions.metadata IS 'Additional interaction data (JSONB)';

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product ON favorites(product_id);

COMMENT ON TABLE favorites IS 'User favorite products';

-- Create view for popular products
CREATE OR REPLACE VIEW popular_products AS
SELECT 
  product_id,
  COUNT(*) as interaction_count,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(*) FILTER (WHERE interaction_type = 'add_to_room') as add_to_room_count,
  COUNT(*) FILTER (WHERE interaction_type = 'favorite') as favorite_count
FROM user_interactions
WHERE timestamp > NOW() - INTERVAL '30 days'
  AND product_id IS NOT NULL
GROUP BY product_id
ORDER BY interaction_count DESC;

COMMENT ON VIEW popular_products IS 'Popular products based on last 30 days of interactions';
