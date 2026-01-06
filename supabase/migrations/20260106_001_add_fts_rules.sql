-- Migration: Add FTS rules and synonyms tables
-- Created: 2026-01-06

-- Mapování českých termínů na DB kategorie
CREATE TABLE IF NOT EXISTS fts_term_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  term TEXT NOT NULL UNIQUE,      -- "obraz", "obrazy", "plakát"
  category TEXT NOT NULL,         -- "picture_frame"
  priority INTEGER DEFAULT 0,     -- Vyšší = přednost při konfliktu
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Synonyma pro rozšíření FTS dotazů
CREATE TABLE IF NOT EXISTS fts_synonyms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_term TEXT NOT NULL,      -- "obraz"
  synonym TEXT NOT NULL,          -- "plakát", "rám", "rámeček"
  weight REAL DEFAULT 1.0,        -- Váha synonyma (0.0-1.0)
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_term, synonym)
);

-- Indexy pro rychlé lookup
CREATE INDEX IF NOT EXISTS idx_term_mappings_term ON fts_term_mappings(term);
CREATE INDEX IF NOT EXISTS idx_synonyms_source ON fts_synonyms(source_term);

-- Seed data for term mappings
INSERT OR IGNORE INTO fts_term_mappings (term, category) VALUES 
('obraz', 'picture_frame'),
('obrazy', 'picture_frame'),
('plakát', 'picture_frame'),
('plakáty', 'picture_frame'),
('rámeček', 'picture_frame'),
('rám', 'picture_frame'),
('zrcadlo', 'mirror'),
('zrcadla', 'mirror'),
('stolek', 'table'),
('stůl', 'table'),
('židle', 'chair'),
('sedačka', 'sofa'),
('pohovka', 'sofa'),
('postel', 'bed'),
('skříň', 'wardrobe'),
('lampa', 'lamp'),
('světlo', 'lamp'),
('koberec', 'rug'),
('závěs', 'curtain'),
('závěsy', 'curtain'),
('polštář', 'cushion'),
('deka', 'blanket'),
('váza', 'vase'),
('květináč', 'plant_pot'),
('rostlina', 'plant');

-- Seed data for synonyms
INSERT OR IGNORE INTO fts_synonyms (source_term, synonym) VALUES 
('obraz', 'plakát'),
('obraz', 'rám'),
('obraz', 'rámeček'),
('obraz', 'obrázek'),
('obraz', 'poster'),
('obrazy', 'plakáty'),
('obrazy', 'rámy'),
('obrazy', 'rámečky'),
('obrazy', 'obrázky'),
('abstraktní', 'moderní'),
('abstraktní', 'minimalistický'),
('abstraktní', 'geometrický'),
('moderní', 'contemporary'),
('moderní', 'modern'),
('moderní', 'minimalist'),
('stolek', 'stůl'),
('stolek', 'stolík'),
('stolek', 'table'),
('sedačka', 'pohovka'),
('sedačka', 'sofa'),
('sedačka', 'gauč');
