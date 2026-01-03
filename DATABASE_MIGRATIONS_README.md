# Database Migrations & CSV Import - Vybaveno

Kompletní sada migračních SQL skriptů a importních nástrojů pro rozšíření databáze projektu Vybaveno.

## 📋 Přehled

Bylo vytvořeno:
- **7 SQL migračních souborů** (postupné rozšíření databáze)
- **TypeScript import skripty** pro CSV data
- **Parser utilities** pro IKEA a JYSK produkty
- **Automatizované skripty** pro spuštění

## 🗂️ Struktura souborů

```
supabase/
├── schema.sql                    # Původní základní schéma
└── migrations/                   # Nové migrace ↓
    ├── 20260103_001_add_product_variants.sql
    ├── 20260103_002_add_product_images.sql
    ├── 20260103_003_add_ai_metadata.sql
    ├── 20260103_004_add_spatial_properties.sql
    ├── 20260103_005_add_compatibility_and_price_history.sql
    ├── 20260103_006_add_user_interactions.sql
    └── 20260103_007_add_materials_and_care.sql

scripts/
├── run-migrations.ts             # Runner pro migrace
├── import-csv.ts                 # Hlavní import script
├── parsers/
│   ├── product-parser.ts         # IKEA/JYSK parser
│   └── utils.ts                  # Utility funkce
├── types.ts                      # TypeScript typy
└── README.md                     # Dokumentace

docs/
└── database_enhancement_proposal.md  # Detailní návrh rozšíření
```

## 🚀 Quickstart

### 1. Instalace závislostí

**Z root projektu:**
```bash
npm run install
# nebo
npm install  # instaluje helper skripty v rootu
cd www && npm install
```

**Ze složky www:**
```bash
cd www
npm install
```

Nově přidané: `tsx`, `csv-parse`

### 2. Spuštění migrací

**Z root projektu:**
```bash
npm run migrate
```

**Ze složky www:**
```bash
cd www
npm run migrate
```

**Ručně přes Supabase Dashboard:**
1. Otevři https://supabase.com/dashboard
2. Vyber projekt → SQL Editor
3. Postupně zkopíruj a spusť SQL z `supabase/migrations/`
4. Pořadí: 001 → 002 → 003 → ... → 007

### 3. Import CSV dat

**Z root projektu:**
```bash
# Validace
npm run validate:csv -- --file=docs/tmp/ikea-yrx-cz-2026-01-03-2.csv --brand=IKEA

# Import
npm run import:csv -- --all --limit=10 --dry-run
npm run import:csv -- --all
```

**Ze složky www:**
```bash
cd www

# Test import (prvních 10 produktů, bez zápisu)
npm run import:csv -- --all --limit=10 --dry-run

# Plný import IKEA + JYSK
npm run import:csv -- --all

# Pouze IKEA (s limitem)
npm run import:csv -- --file=../docs/tmp/ikea-yrx-cz-2026-01-03-2.csv --brand=IKEA --limit=100
```

## 📊 Co migrace přidávají

### Migrace 001: Product Variants
- Varianty produktů (barvy, velikosti)
- Stav dostupnosti
- Sezónní produkty
- Kolekce/série

### Migrace 002: Product Images
- Více obrázků na produkt
- Typy obrázků (hlavní, lifestyle, detail)
- Galerie produktů

### Migrace 003: AI Metadata
- AI-generované tagy
- Fulltextové vyhledávání (PostgreSQL FTS)
- Styly a kategorie
- Hledání v češtině

### Migrace 004: Spatial Properties
- Prostorové vlastnosti (kde se vejde)
- Rozměry a tvar
- Vhodné typy místností
- Kontext pro AI

### Migrace 005: Compatibility & Price History
- Kompatibilita produktů (co ladí dohromady)
- Cenová historie a akce
- AI doporučení

### Migrace 006: User Interactions
- Tracking chování uživatelů
- Oblíbené produkty
- Analytika popularity

### Migrace 007: Materials & Care
- Detailní materiály
- Udržitelnost
- Návody na péči

## 🎯 Co CSV import dělá

### Parsuje z názvů produktů:
- ✅ Rozměry: `70x160 cm`, `Ø50cm`, `40×60×5`
- ✅ Barvy: bílá → white, černá → black, zlatá → gold
- ✅ Materiály: bambus, dřevo, kov, sklo, kamenina
- ✅ Kategorie: stolek, židle, lampa, zrcadlo

### Automaticky detekuje:
- ✅ Sezónní produkty (vánoční dekorace)
- ✅ Tvary (kruhový, obdélníkový, nepravidelný)
- ✅ Kolekce (RIGGA, NORDBORG, MARSTAL, ...)
- ✅ Vyhledávací klíčová slova

### Vytvoří:
- ✅ Unikátní ID pro každý produkt
- ✅ Strukturované JSONB pro rozměry
- ✅ Odkazy na affiliate URLs
- ✅ Dodatečné obrázky v `product_images` tabulce

## 📝 Příklady použití po importu

### Vyhledávání produktů

```sql
-- Fulltextové vyhledávání
SELECT name, category, price_czk 
FROM products
WHERE search_vector @@ to_tsquery('simple', 'stolek & dřevo')
ORDER BY ts_rank(search_vector, to_tsquery('simple', 'stolek & dřevo')) DESC;

-- Produkty podle stylu a ceny
SELECT * FROM products
WHERE 'scandinavian' = ANY(style_tags)
  AND price_czk BETWEEN 1000 AND 5000
ORDER BY price_czk;
```

### Kompatibilní produkty

```sql
-- Najít produkty, které ladí s vybraným produktem
SELECT p.*, pc.compatibility_score
FROM products p
JOIN product_compatibility pc ON p.id = pc.product_b_id
WHERE pc.product_a_id = 'ikea-abc123'
  AND pc.compatibility_score > 0.7
ORDER BY pc.compatibility_score DESC;
```

### Populární produkty

```sql
-- Top 10 nejpopulárnějších za poslední měsíc
SELECT p.*, pp.interaction_count, pp.favorite_count
FROM products p
JOIN popular_products pp ON p.id = pp.product_id
ORDER BY pp.interaction_count DESC
LIMIT 10;
```

## 🎨 Výhody pro AI (Gemini)

S rozšířenou databází může Gemini:

1. **Lépe rozumět kontextu**
   - Ví, jaké rozměry má produkt
   - Zná materiály a barvy
   - Chápe, kam produkt patří

2. **Přesnější doporučení**
   - Kompatibilita podle stylu
   - Filtrování podle místnosti
   - Respektování rozpočtu

3. **Prostorové porozumění**
   - Kontrola, zda se produkt vejde
   - Doporučení clearance space
   - Optimální umístění v místnosti

4. **Personalizace**
   - Učení z preferencí uživatelů
   - Tracking popularity
   - Adaptivní doporučení

## 📈 Odhadované výsledky

### Import statistiky (očekávané):
```
📈 Import Statistics:
   Total processed: 10,651
   ✅ Imported: ~9,500
   🔄 Updated: ~800
   ⏭️  Skipped: ~300
   ❌ Errors: ~50
   Success rate: ~97%
```

### Databázové nároky:
- **Původní schéma**: ~100 KB/produkt
- **Po rozšíření**: ~150-200 KB/produkt
- **Pro 10K produktů**: ~1.5-2 GB
- **S indexy**: ~2.5 GB celkem

## ⚠️ Poznámky a tipy

### Před importem:
1. Zalohuj databázi
2. Spusť migrace postupně
3. Zkontroluj, že máš správné ENV variables

### Během importu:
1. První import udělej s `--limit=10 --dry-run`
2. Sleduj logy pro chyby
3. Import může trvat 10-30 minut pro plný dataset

### Po importu:
1. Zkontroluj data v Supabase Dashboard
2. Otestuj vyhledávání
3. Ověř počet importovaných produktů

## 🔧 Troubleshooting

**Problem**: Migration fails
```bash
# Řešení: Spusť migrace ručně přes Dashboard
# Dashboard → SQL Editor → zkopíruj SQL z migrations/
```

**Problem**: CSV import errors
```bash
# Řešení: Zkontroluj cesty k CSV souborům
ls docs/tmp/*.csv

# Ověř ENV variables
echo $NEXT_PUBLIC_SUPABASE_URL
```

**Problem**: Duplicate key violations
```bash
# Řešení: Script automaticky updatuje existující
# nebo můžeš vymazat všechny produkty:
# DELETE FROM products WHERE brand = 'IKEA';
```

## 🎯 Další kroky

Po úspěšném importu:

1. **AI analýza obrázků**
   - Spusť Gemini Vision na product images
   - Generuj `ai_tags` pro lepší matching

2. **Vytvoř kompatibility**
   - Použij AI k analýze stylové kompatibility
   - Naplň `product_compatibility` tabulku

3. **Optimalizuj vyhledávání**
   - Doplň `search_keywords`
   - Testuj fulltextové vyhledávání

4. **Monitoring**
   - Sleduj `user_interactions`
   - Analyzuj populární produkty

## 📚 Reference

- [Database Enhancement Proposal](../docs/database_enhancement_proposal.md)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)

---

**Created**: 2026-01-03
**Author**: GitHub Copilot
**Status**: Ready for production ✨
