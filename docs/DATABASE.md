# Database & Migrations

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

### 2. Spuštění migrací

**Z root projektu:**
```bash
npm run migrate
```

### 3. Import CSV dat

**Z root projektu:**
```bash
# Validace
npm run validate:csv -- --file=docs/tmp/ikea-yrx-cz-2026-01-03-2.csv --brand=IKEA

# Import
npm run import:csv -- --all
```

## 🛠️ Technické detaily

- **SQLite FTS5**: Používáme virtuální tabulky pro bleskové full-text vyhledávání.
- **BM25 Ranking**: Výsledky vyhledávání jsou řazeny podle relevance (váhy na názvu a kategoriích).
- **Deduplikace**: Skripty automaticky detekují duplicity na základě názvu a značky.
