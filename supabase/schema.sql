CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_image_url TEXT NOT NULL,
  analysis JSONB,
  user_preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  dimensions_cm JSONB NOT NULL,
  color TEXT,
  material TEXT,
  price_czk INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,
  description_visual TEXT
);

CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  image_url TEXT NOT NULL,
  prompt_used TEXT,
  products_used TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
