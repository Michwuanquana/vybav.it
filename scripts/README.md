# Import Scripts

Skripty pro import produktových dat z CSV souborů do Supabase databáze.

## Prerekvizity

```bash
npm install tsx csv-parse @supabase/supabase-js
```

## Nastavení prostředí

Vytvoř `.env.local` soubor v root projektu:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Použití

**DŮLEŽITÉ**: Všechny npm příkazy musíš spouštět buď:
- Z **root projektu** (používá helper skripty): `npm run validate:csv`
- Ze složky **www**: `cd www && npm run validate:csv`

### 1. Spustit migrace

Nejprve aplikuj všechny migrace v Supabase:

```bash
cd supabase
supabase db push
```

Nebo ručně přes Supabase Dashboard → SQL Editor.

### 2. Validace CSV (DOPORUČENO!)

Před importem vždy validuj data:

**Z root projektu:**
```bash
npm run validate:csv -- --file=docs/tmp/ikea-yrx-cz-2026-01-03-2.csv --brand=IKEA
```

**Ze složky www:**
```bash
cd www
npm run validate:csv -- --file=../docs/tmp/ikea-yrx-cz-2026-01-03-2.csv --brand=IKEA

# Validace s ukázáním varování
npm run validate:csv -- --file=../docs/tmp/jysk-cz-2026-01-03-2.csv --brand=JYSK --show-warnings

# Validace prvních 100 řádků
npm run validate:csv -- --file=../docs/tmp/ikea-yrx-cz-2026-01-03-2.csv --brand=IKEA --limit=100
```

### 3. Import produktů

**DŮLEŽITÉ**: Pokud validace selže, import se ZASTAVÍ!

```bash
# Import všech produktů (IKEA + JYSK)
npm run import:csv -- --all

# Import s limitem (pro testování)
npm run import:csv -- --all --limit=100

# Dry run (bez zápisu do DB)
npm run import:csv -- --all --dry-run

# Import pouze IKEA
npm run import:csv -- --file=docs/tmp/ikea-yrx-cz-2026-01-03-2.csv --brand=IKEA

# Import pouze JYSK
npm run import:csv -- --file=docs/tmp/jysk-cz-2026-01-03-2.csv --brand=JYSK
```

### 3. Přidat do package.json

```json
{
  "scripts": {
    "import:csv": "tsx scripts/import-csv.ts"
  }
}
```

## Struktura

```
scripts/
├── import-csv.ts          # Hlavní import script
├── parsers/
│   ├── product-parser.ts  # Parser pro IKEA/JYSK produkty
│   └── utils.ts           # Utility funkce (dimenze, barvy, materiály)
├── types.ts               # TypeScript typy
└── README.md              # Tento soubor
```

## Parsování dat

### IKEA CSV

```
price, price2, data (série), data2 (plný název), image, image2, ...
```

**Příklad:**
- `price`: "399"
- `data`: "RIGGA"
- `data2`: "Šatní stojan, bílá"
- `image`: "https://..."

### JYSK CSV

```
image, data, title, name, price, data4 (stock info)
```

**Příklad:**
- `title`: "RAV"
- `name`: "Vánoční hvězda RAV Š11xD12xV11 cm kamenina bílá"
- `price`: "50 Kč"

## Co se parsuje

### Z názvu produktu:
- **Rozměry**: `70x160`, `Ø50`, `40×60×5`
- **Barva**: bílá, černá, zlatá, přírodní, ...
- **Materiál**: bambus, dřevo, kov, sklo, kamenina, ...
- **Kategorie**: stolek, židle, lampa, zrcadlo, ...

### Automatická detekce:
- Sezónní produkty (Vánoce, Velikonoce)
- Tvar (kruhový, obdélníkový, nepravidelný)
- Kolekce/série (RIGGA, NORDBORG, ...)
- Vyhledávací klíčová slova

## Výstup

Import vytvoří záznamy v tabulkách:
- `products` - hlavní produktová data
- `product_images` - dodatečné obrázky produktů

## Statistiky

Po dokončení importu se zobrazí:
```
📈 Import Statistics:
   Total processed: 5156
   ✅ Imported: 4892
   🔄 Updated: 213
   ⏭️  Skipped: 51
   ❌ Errors: 0
   Success rate: 99%
```

## Tipsy

1. **První import**: Použij `--limit=10 --dry-run` pro test
2. **Kontrola**: Po importu zkontroluj data v Supabase Dashboard
3. **Re-import**: Script automaticky updatuje existující produkty
4. **Chyby**: Logy obsahují detaily o chybách při parsování

## Další kroky

Po importu můžeš:
1. Spustit AI analýzu obrázků (Gemini Vision) → `ai_tags`
2. Generovat kompatibility produktů
3. Vytvořit cenovou historii
4. Doplnit prostorové vlastnosti
