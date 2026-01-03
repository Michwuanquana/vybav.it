# Rychlý Start - Vybaveno Database Import

## 📍 Spouštění příkazů

Máš **2 možnosti** jak spouštět npm příkazy:

### Option A: Z root projektu (jednodušší) ✨
```bash
# Jsi v /home/vybaveno/project
npm install                    # Nainstaluje helper skripty
npm run validate:csv -- ...    # Spustí validaci
npm run import:csv -- ...      # Spustí import
```

### Option B: Ze složky www
```bash
cd www                         # Přejdi do www
npm install                    # Nainstaluj závislosti
npm run validate:csv -- ...    # Spustí validaci
```

## 🚀 Quickstart Guide

### 1️⃣ Instalace (jednorázově)

```bash
# Z root projektu
npm install
```

### 2️⃣ Validace CSV

```bash
# Validuj IKEA data (prvních 100 produktů)
npm run validate:csv -- --file=docs/tmp/ikea-yrx-cz-2026-01-03-2.csv --brand=IKEA --limit=100

# Validuj JYSK data
npm run validate:csv -- --file=docs/tmp/jysk-cz-2026-01-03-2.csv --brand=JYSK --limit=100

# S ukázáním varování
npm run validate:csv -- --file=docs/tmp/ikea-yrx-cz-2026-01-03-2.csv --brand=IKEA --show-warnings
```

### 3️⃣ Import do databáze

**DŮLEŽITÉ**: Nejprve aplikuj SQL migrace v Supabase!

```bash
# Dry run (test bez zápisu do DB)
npm run import:csv -- --file=docs/tmp/ikea-yrx-cz-2026-01-03-2.csv --brand=IKEA --limit=10 --dry-run

# Skutečný import
npm run import:csv -- --file=docs/tmp/ikea-yrx-cz-2026-01-03-2.csv --brand=IKEA --limit=100

# Plný import obou
npm run import:csv -- --all
```

## ❌ Běžné chyby

### "Could not read package.json"
```bash
# ❌ Špatně - spouštíš z root bez helper skriptů
npm run validate:csv

# ✅ Správně - Option A
npm install  # nejprve nainstaluj helper skripty
npm run validate:csv -- ...

# ✅ Správně - Option B  
cd www
npm run validate:csv -- ...
```

### "Cannot find module tsx"
```bash
cd www
npm install  # doinstaluje tsx a csv-parse
```

### Cesty k souborům
```bash
# Z root projektu - BEZ ../
npm run validate:csv -- --file=docs/tmp/ikea-yrx-cz-2026-01-03-2.csv --brand=IKEA

# Ze složky www - S ../
cd www
npm run validate:csv -- --file=../docs/tmp/ikea-yrx-cz-2026-01-03-2.csv --brand=IKEA
```

## 📚 Další dokumentace

- [DATABASE_MIGRATIONS_README.md](DATABASE_MIGRATIONS_README.md) - Kompletní dokumentace
- [scripts/README.md](scripts/README.md) - Detaily o skriptech
- [docs/database_enhancement_proposal.md](docs/database_enhancement_proposal.md) - Návrh rozšíření DB
