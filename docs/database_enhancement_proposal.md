# Návrh rozšíření databázového schématu - Vybaveno

## Přehled
Tento dokument analyzuje současný stav databáze a navrhuje rozšíření pro lepší využití dostupných dat a zlepšení AI doporučení.

## Aktuální situace

### Dostupná data
- **IKEA CSV**: ~5156 produktů s názvem, cenou, obrázky, rozměry v názvech
- **JYSK CSV**: ~5495 produktů s podobnými informacemi
- **Celkem**: >10 000 produktů připravených k importu

### Současné schéma `products`
```sql
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
```

## Navrhovaná rozšíření

### 1. Produktové varianty a stav dostupnosti

**Problém**: CSV data ukazují, že mnoho produktů má varianty (barvy, velikosti) a stav skladu.

**Řešení**: Přidat tabulku variants a pole pro stav dostupnosti

```sql
-- Rozšíření tabulky products
ALTER TABLE products ADD COLUMN availability_status TEXT DEFAULT 'in_stock';
  -- hodnoty: 'in_stock', 'low_stock', 'out_of_stock', 'discontinued'
ALTER TABLE products ADD COLUMN stock_info TEXT;
  -- např. "Do vyprodání zásob", "Novinka"
ALTER TABLE products ADD COLUMN is_seasonal BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN season TEXT;
  -- např. "christmas", "summer", null

-- Nová tabulka pro varianty produktů
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  color TEXT,
  size TEXT,
  material TEXT,
  price_czk INTEGER,
  image_url TEXT,
  sku TEXT UNIQUE,
  availability_status TEXT DEFAULT 'in_stock',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_availability ON product_variants(availability_status);
```

### 2. Detailnější dimenze a specifikace

**Problém**: Rozměry jsou v JSONB, ale chybí strukturované informace o tvaru, typu.

**Řešení**: Rozšířit dimensions_cm o další metadata

```sql
-- Rozšíření products o prostorové informace
ALTER TABLE products ADD COLUMN shape TEXT;
  -- hodnoty: 'rectangular', 'circular', 'oval', 'irregular', 'l-shaped'
ALTER TABLE products ADD COLUMN weight_kg DECIMAL(10,2);
ALTER TABLE products ADD COLUMN volume_m3 DECIMAL(10,4);
ALTER TABLE products ADD COLUMN assembly_required BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN assembly_time_minutes INTEGER;

-- Příklad struktury dimensions_cm s metadaty:
-- {
--   "width": 70,
--   "height": 160,
--   "depth": 3,
--   "diameter": null,
--   "unit": "cm",
--   "adjustable": false,
--   "range": {"min_height": 60, "max_height": 90}
-- }
```

### 3. Styly, kolekce a kompatibilita

**Problém**: AI potřebuje chápat, které produkty k sobě ladí. Původní CSV data neobsahují explicitní styl.

**Řešení**: Implementována automatická taxonomie stylů během importu.

```sql
-- Rozšíření products o styl a kolekce
ALTER TABLE products ADD COLUMN style_tags TEXT[];
  -- např. ['scandinavian', 'minimalist', 'modern']
ALTER TABLE products ADD COLUMN collection_name TEXT;
  -- např. 'NORDBORG', 'HEMNES'
```

**Implementovaná logika detekce stylu (`detectStyle`):**
Algoritmus v `scripts/parsers/utils.ts` automaticky přiřazuje tagy na základě:
1.  **Názvu série**: Mapování známých kolekcí (např. `HEMNES` -> `scandinavian`, `FJÄLLBO` -> `industrial`).
2.  **Klíčových slov**: Detekce v názvu (např. "kov", "ocel" + kovový materiál -> `industrial`).
3.  **Materiálových vazeb**: Sklo a chrom automaticky přidávají tag `modern`.

Tato data umožňují doporučovacímu algoritmu okamžitě filtrovat produkty, které k sobě vizuálně ladí, aniž by musel pokaždé analyzovat obrázek.

-- Tabulka pro kompatibilní produkty (AI doporučení)
CREATE TABLE product_compatibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_a_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  product_b_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  compatibility_score DECIMAL(3,2), -- 0.00 - 1.00
  reason TEXT, -- 'matching_style', 'color_complement', 'same_collection'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compat_product_a ON product_compatibility(product_a_id);
CREATE INDEX idx_compat_product_b ON product_compatibility(product_b_id);
```

### 4. Obrazové metadata a AI tagging

**Problém**: Aplikace používá Gemini Vision - potřebujeme uložit výsledky analýzy.

**Řešení**: AI-generované tagy a vizuální metadata

```sql
-- Rozšíření products o AI metadata
ALTER TABLE products ADD COLUMN ai_tags JSONB;
  -- {
  --   "visual_features": ["metal_legs", "wooden_top", "modern_design"],
  --   "detected_colors": ["#FFFFFF", "#8B7355", "#2C2C2C"],
  --   "dominant_color": "#FFFFFF",
  --   "texture": "smooth",
  --   "complexity": "simple"
  -- }
ALTER TABLE products ADD COLUMN ai_description TEXT;
  -- AI-generovaný popis pro uživatele
ALTER TABLE products ADD COLUMN search_keywords TEXT[];
  -- vyhledávací klíčová slova

-- Tabulka pro vícero obrázků
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT, -- 'main', 'lifestyle', 'detail', 'angle_front', 'angle_side'
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  width_px INTEGER,
  height_px INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_images_product ON product_images(product_id);
```

### 5. Cenová historie a akce

**Problém**: Ceny se mění, ale nemáme historii.

**Řešení**: Tracking cenových změn

```sql
-- Tabulka pro cenovou historii
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  price_czk INTEGER NOT NULL,
  discount_percentage INTEGER,
  promotion_name TEXT,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_history_product ON price_history(product_id);
CREATE INDEX idx_price_history_dates ON price_history(valid_from, valid_until);
```

### 6. Uživatelské preference a interakce

**Problém**: Potřebujeme sledovat, co uživatelé preferují pro lepší doporučení.

**Řešení**: Tracking uživatelských interakcí

```sql
-- Rozšíření sessions o více informací
ALTER TABLE sessions ADD COLUMN user_id UUID;
ALTER TABLE sessions ADD COLUMN room_type TEXT;
  -- 'living_room', 'bedroom', 'office', 'kitchen', 'bathroom'
ALTER TABLE sessions ADD COLUMN budget_min INTEGER;
ALTER TABLE sessions ADD COLUMN budget_max INTEGER;
ALTER TABLE sessions ADD COLUMN style_preferences TEXT[];

-- Tabulka pro uživatelské interakce
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  interaction_type TEXT NOT NULL,
  -- 'view', 'click', 'add_to_room', 'remove', 'favorite', 'purchase_intent'
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_interactions_session ON user_interactions(session_id);
CREATE INDEX idx_interactions_product ON user_interactions(product_id);
CREATE INDEX idx_interactions_type ON user_interactions(interaction_type);

-- Tabulka pro oblíbené produkty
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- bude referovat users až bude auth
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
```

### 7. Room context a spatial fitting

**Problém**: AI potřebuje vědět, jak produkt zapadne do prostoru.

**Řešení**: Prostorové metadata

```sql
-- Rozšíření products o prostorové vlastnosti
ALTER TABLE products ADD COLUMN placement_type TEXT;
  -- 'floor_standing', 'wall_mounted', 'ceiling_mounted', 'tabletop', 'freestanding'
ALTER TABLE products ADD COLUMN clearance_required_cm JSONB;
  -- {"front": 60, "sides": 10, "back": 5, "top": 0}
ALTER TABLE products ADD COLUMN recommended_room_size_m2 DECIMAL(10,2);
ALTER TABLE products ADD COLUMN suitable_for_rooms TEXT[];
  -- ['living_room', 'bedroom', 'office']

-- Rozšíření generations o spatial context
ALTER TABLE generations ADD COLUMN room_dimensions JSONB;
ALTER TABLE generations ADD COLUMN lighting_conditions TEXT;
  -- 'bright', 'medium', 'dim', 'mixed'
ALTER TABLE generations ADD COLUMN wall_color TEXT;
ALTER TABLE generations ADD COLUMN floor_type TEXT;
  -- 'hardwood', 'carpet', 'tile', 'laminate'
```

### 8. Textilní a doplňkové produkty

**Problém**: CSV obsahuje i textilie (závěsy, povlečení), svíčky, dekorace.

**Řešení**: Rozšířit kategorii o product_type

```sql
ALTER TABLE products ADD COLUMN product_type TEXT NOT NULL DEFAULT 'furniture';
  -- 'furniture', 'lighting', 'textile', 'decoration', 'storage'
ALTER TABLE products ADD COLUMN subcategory TEXT;
  -- detailnější než category
ALTER TABLE products ADD COLUMN is_functional BOOLEAN DEFAULT true;
  -- false pro čistě dekorativní předměty
ALTER TABLE products ADD COLUMN care_instructions TEXT;
  -- péče o produkt
```

### 9. Udržitelnost a materiály

**Problém**: Moderní zákazníci se zajímají o udržitelnost.

**Řešení**: Ekologická metadata

```sql
ALTER TABLE products ADD COLUMN materials_detailed JSONB;
  -- {
  --   "primary": "oak_wood",
  --   "secondary": ["metal", "fabric"],
  --   "certifications": ["FSC"],
  --   "recycled_content_percent": 30
  -- }
ALTER TABLE products ADD COLUMN sustainability_score INTEGER;
  -- 1-100
ALTER TABLE products ADD COLUMN eco_friendly_tags TEXT[];
  -- ['recyclable', 'sustainable_wood', 'low_voc']
```

### 10. Fulltextové vyhledávání

**Problém**: Potřebujeme rychlé vyhledávání produktů.

**Řešení**: PostgreSQL full-text search

```sql
-- Přidat tsvector sloupec pro fulltextové vyhledávání
ALTER TABLE products ADD COLUMN search_vector tsvector;

-- Vytvořit trigger pro automatickou aktualizaci
CREATE FUNCTION products_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('czech', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('czech', coalesce(NEW.description_visual, '')), 'B') ||
    setweight(to_tsvector('czech', coalesce(NEW.category, '')), 'C') ||
    setweight(to_tsvector('czech', coalesce(NEW.brand, '')), 'C') ||
    setweight(to_tsvector('czech', array_to_string(NEW.search_keywords, ' ')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_search_vector_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

CREATE INDEX idx_products_search ON products USING GIN(search_vector);
```

## Migrace a implementace

### Fáze 1: Základní rozšíření (priorita VYSOKÁ)
1. Produktové varianty
2. Vícero obrázků
3. Stav dostupnosti
4. AI tagy a metadata

### Fáze 2: Pokročilé funkce (priorita STŘEDNÍ)
1. Styly a kompatibilita
2. Cenová historie
3. Prostorové vlastnosti
4. Fulltextové vyhledávání

### Fáze 3: Analytika a optimalizace (priorita NÍZKÁ)
1. Uživatelské interakce
2. Udržitelnost
3. Detailní materiály

## Import dat z CSV

### Strategie pro parsování CSV dat:

```typescript
// Příklad parsování IKEA produktu
interface IkeaCSVRow {
  price: string;          // "399"
  price2: string;         // ",–"
  data: string;           // název série
  data2: string;          // plný název
  image: string;          // URL
}

function parseIkeaProduct(row: IkeaCSVRow): Product {
  // Extrahovat rozměry z názvu pomocí regex
  const dimensionMatch = row.data2.match(/(\d+)x(\d+)(?:x(\d+))?/);
  const diameterMatch = row.data2.match(/Ø(\d+)/);
  
  // Extrahovat barvu z názvu
  const colorMatch = row.data2.match(/(bílá|černá|zlatá|stříbrná|přírodní)/i);
  
  // Detekovat materiál
  const materialMatch = row.data2.match(/(bambus|dřevo|kov|sklo|kamenina)/i);
  
  return {
    name: row.data2,
    brand: 'IKEA',
    price_czk: parseInt(row.price),
    dimensions_cm: dimensionMatch ? {
      width: parseInt(dimensionMatch[1]),
      height: parseInt(dimensionMatch[2]),
      depth: dimensionMatch[3] ? parseInt(dimensionMatch[3]) : null
    } : null,
    color: colorMatch ? colorMatch[1] : null,
    material: materialMatch ? materialMatch[1] : null,
    // ...
  };
}
```

## Výhody rozšířeného schématu

### Pro AI (Gemini)
- **Lepší kontext**: Rozměry, styl, barvy → přesnější doporučení
- **Prostorové porozumění**: Víme, co se vejde kam
- **Vizuální matching**: AI tagy pomáhají najít podobné produkty

### Pro uživatele
- **Přesnější filtrování**: Podle stylu, ceny, rozměrů
- **Lepší doporučení**: Kompatibilní produkty
- **Transparentnost**: Dostupnost, ceny, materiály

### Pro business
- **Analytika**: Tracking popularity produktů
- **Optimalizace**: Které produkty se používají společně
- **Personalizace**: Učení z preferencí uživatelů

## Odhadované nároky

### Úložiště
- Základní schéma: ~100 KB na produkt
- S rozšířeními: ~150-200 KB na produkt
- Pro 10 000 produktů: ~1.5-2 GB

### Výkon
- Indexy na všech foreign keys a často používaných sloupcích
- PostgreSQL full-text search je velmi rychlý i na 10K+ produktech
- JSONB sloupce jsou efektivní s GIN indexy

## Doporučení k implementaci

1. **Start simple**: Implementuj fázi 1 jako MVP
2. **Measure usage**: Sleduj, která data se využívají
3. **Iterate**: Přidávej další metadata podle potřeby
4. **AI-first**: Nech Gemini analyzovat obrázky a generovat tagy
5. **Czech language**: Použij český stemmer pro fulltextové vyhledávání

## Příklady SQL dotazů po rozšíření

```sql
-- Najít produkty kompatibilní s vybraným produktem
SELECT p.*, pc.compatibility_score, pc.reason
FROM products p
JOIN product_compatibility pc ON p.id = pc.product_b_id
WHERE pc.product_a_id = 'some-product-id'
  AND pc.compatibility_score > 0.7
ORDER BY pc.compatibility_score DESC;

-- Najít produkty ve skandinávském stylu s cenovou historií
SELECT p.*, 
       ph.price_czk as current_price,
       ph.discount_percentage
FROM products p
LEFT JOIN price_history ph ON p.id = ph.product_id
  AND ph.valid_from <= NOW()
  AND (ph.valid_until IS NULL OR ph.valid_until >= NOW())
WHERE 'scandinavian' = ANY(p.style_tags)
  AND p.price_czk BETWEEN 1000 AND 5000
ORDER BY p.price_czk;

-- Fulltextové vyhledávání
SELECT p.*, ts_rank(p.search_vector, query) as rank
FROM products p,
     to_tsquery('czech', 'stolek & dřevo') query
WHERE p.search_vector @@ query
ORDER BY rank DESC
LIMIT 20;
```

## Závěr

Rozšířené schéma poskytne aplikaci Vybaveno robustní základ pro:
- Přesná AI doporučení
- Rychlé vyhledávání
- Bohatá produktová metadata
- Analytiku a personalizaci

**Doporučení**: Implementuj postupně podle fází, začni s variantami, obrázky a AI tagy.
