# Vybaveno.cz — Projektový Overview

> **Datum vytvoření:** 6. ledna 2026  
> **Účel:** Kompletní shrnutí projektu pro rychlý onboarding a pokračování práce

---

## 🎯 Co je Vybaveno?

**AI-powered DIFM (Do-It-For-Me) služba pro virtuální staging interiérů.**

Uživatel nahraje fotku pokoje → AI analyzuje prostor → navrhne nábytek → vizualizuje výsledek.

### Business Model
- **Cílová skupina:** Časově vytížení rodiče, lidé v novostavbách, milovníci designu
- **Monetizace:** Affiliate provize (IKEA, JYSK, Bonami) + montážní služby
- **Claim:** "Od chaosu ke klidu"

---

## 🏗️ Architektura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                     │
│  ┌─────────┐  ┌───────────┐  ┌──────────┐  ┌───────────────┐   │
│  │ Upload  │→ │  Analyze  │→ │ Configure│→ │   Results     │   │
│  │  Zone   │  │  (Gemini) │  │  (Style) │  │ (Popup/Marker)│   │
│  └─────────┘  └───────────┘  └──────────┘  └───────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐  ┌──────────────┐  ┌────────────────────┐
│  SQLite + FTS5  │  │ Gemini 3 API │  │ Local File Storage │
│  (5700+ items)  │  │   (Vision)   │  │  (www/public/...)  │
└─────────────────┘  └──────────────┘  └────────────────────┘
```

---

## 💻 Tech Stack

| Vrstva | Technologie | Verze |
|--------|-------------|-------|
| **Frontend** | Next.js (App Router) | 16.1.1 |
| **UI** | Tailwind CSS + shadcn/ui | v4 |
| **State** | Zustand | 5.x |
| **AI** | Google Gemini 3 Flash | `gemini-3-flash-preview` |
| **Database** | SQLite + FTS5 | 5.1.7 |
| **Runtime** | Node.js | 20.x |
| **Images** | Sharp | 0.34.5 |
| **Infra** | Docker + Traefik | - |

---

## 📁 Struktura projektu

```
/home/vybaveno/project/
├── www/                      # 🌐 Next.js aplikace
│   ├── src/
│   │   ├── app/
│   │   │   ├── [lang]/       # i18n (cs/en) + stránky
│   │   │   │   ├── page.tsx          # Landing + Upload
│   │   │   │   ├── HomeClient.tsx    # Hlavní client component
│   │   │   │   └── room/[id]/        # Detail analyzovaného pokoje
│   │   │   └── api/
│   │   │       ├── analyze/          # POST: AI analýza fotky
│   │   │       ├── upload/           # POST: Nahrání obrázku
│   │   │       ├── room/             # Session management
│   │   │       ├── products/         # Katalog + recommend engine
│   │   │       ├── generate/         # AI inpainting (TODO)
│   │   │       └── uploads/          # Servírování uploadnutých souborů
│   │   ├── components/       # UI komponenty
│   │   │   ├── UploadZone.tsx
│   │   │   ├── ResultsView.tsx
│   │   │   ├── StudioEditor.tsx
│   │   │   └── ui/           # shadcn/ui primitives
│   │   └── lib/
│   │       ├── db.ts                 # SQLite Singleton
│   │       ├── gemini-client.ts      # Gemini 3 Flash client
│   │       ├── storage.ts            # Upload + deduplikace
│   │       ├── prompts/              # AI prompt templates
│   │       └── recommendation/       # Recommend engine (FTS + scoring)
│   └── public/uploads/       # Uploadnuté obrázky
│
├── scripts/                  # 🛠️ CLI nástroje
│   ├── import-csv.ts         # Import produktů z CSV
│   ├── run-migrations.ts     # Spuštění DB migrací
│   ├── setup-fts.ts          # FTS5 full-text search setup
│   └── test-api-quality.ts   # Benchmark API
│
├── supabase/                 # 🗄️ SQL schémata
│   ├── schema.sql            # Základní schéma
│   └── migrations/           # Inkrementální migrace
│
├── docs/                     # 📚 Dokumentace
│   ├── CLAUDE.md             # Pravidla pro AI agenty
│   ├── ARCHITECTURE.md       # Technická architektura
│   ├── progress.md           # Historie změn (ČIST PŘED PRACÍ!)
│   ├── DATABASE.md           # DB schéma a migrace
│   └── PROMPTS.md            # AI prompts reference
│
├── vybaveno.db               # 📊 SQLite databáze (5700+ produktů)
├── docker-compose.yml        # 🐳 Docker konfigurace
└── Makefile                  # ⚡ Make příkazy
```

---

## 🚀 Příkazy

```bash
# Lokální vývoj
make dev                    # → localhost:3000

# Build
make build                  # → .next/standalone

# Deploy na vybaveno.yrx.cz
make deploy-dev             # Docker rebuild + restart

# Databáze
npm run migrate             # Spustí SQL migrace
npm run setup:fts           # Nastaví FTS5 vyhledávání
npm run import:csv -- --all # Import produktů z CSV
```

---

## 🔄 User Flow (MVP)

```
1. UPLOAD                2. ANALYZE               3. DISCOVER              4. INTERACT
   ┌─────────┐             ┌─────────┐              ┌─────────┐             ┌─────────┐
   │ Fotka   │ ────────▶   │ Gemini  │ ────────▶   │Produkty │ ────────▶  │ Popup   │
   │ pokoje  │             │ Vision  │              │(FTS5)   │             │+Affiliate│
   └─────────┘             └─────────┘              └─────────┘             └─────────┘
   
   ✓ Max 10MB              ✓ Styl, rozměry         ✓ Top 20 matches        ✓ Klik na marker
   ✓ JPG/PNG/WebP          ✓ 10-15 zón             ✓ BM25 ranking          ✓ Detail produktu
   ✓ Hash dedupe           ✓ ~2-5s response        ✓ ~16ms response        ✓ Affiliate link
```

---

## 🤖 Gemini 3 Flash — Klíčové info

- **Model ID:** `gemini-3-flash-preview`
- **Capabilities:** Text + Vision (multimodální)
- **Thinking Level:** `medium`
- **Cena:** $0.50/1M input, $3.00/1M output
- **Konfigurační soubor:** [gemini-client.ts](www/src/lib/gemini-client.ts)

```typescript
// Aktuální konfigurace
{
  model: "gemini-3-flash-preview",
  temperature: 0.4,
  topP: 0.95,
  maxOutputTokens: 8192,
}
```

---

## 📊 Databáze

- **Engine:** SQLite s FTS5 rozšířením
- **Lokace:** `/home/vybaveno/project/vybaveno.db`
- **Produktů:** ~5700 (IKEA, JYSK)

### Hlavní tabulky
| Tabulka | Účel |
|---------|------|
| `products` | Katalog produktů (název, cena, rozměry, kategorie) |
| `products_fts` | FTS5 virtuální tabulka pro full-text search |
| `rooms` | Analyzované místnosti (session data) |
| `room_analysis` | Výsledky AI analýzy |

---

## 🎨 Brand Identity

- **Archetyp:** Modern Concierge — empatický, klidný, řešící
- **Barvy:** 
  - Šalvějová zelená `#7C8F80`
  - Písková `#F0E8D9`
  - Terakota `#C87F69`
- **Fonty:** Plus Jakarta Sans (nadpisy), Figtree (text)

---

## ✅ Co je hotovo (Fáze 1-4)

- [x] Upload zone s drag & drop
- [x] Gemini Vision analýza pokoje
- [x] Interaktivní markery na fotce
- [x] Popup s produktem při kliknutí
- [x] FTS5 full-text vyhledávání
- [x] Recommendation engine (FTS + scoring)
- [x] i18n (čeština/angličtina)
- [x] Mobile-responsive UI
- [x] Budget slider se sloučeným progress barem (utracená částka)
- [x] Docker deployment
- [x] 12x zrychlení API (198ms → 16ms)

---

## 🔲 Co zbývá (Fáze 5+)

- [ ] AI Inpainting (vizualizace nábytku ve fotce)
- [ ] Before/After slider
- [ ] Affiliate tracking
- [ ] Rozšíření katalogu (Bonami, Möbelix)
- [ ] User accounts + historie
- [ ] Studio editor (drag & drop nábytek)

---

## 🐛 Známé problémy

| Problém | Status | Poznámka |
|---------|--------|----------|
| Inpainting nefunkční | 🔲 TODO | Odloženo, fokus na discovery flow |
| Docker cache zabírá 85GB | ⚠️ Monitorovat | `docker system prune` při potřebě |

---

## 📝 Workflow pro AI agenty

1. **PŘED PRACÍ:** Přečti [progress.md](progress.md)
2. **BĚHEM PRÁCE:** Implementuj podle roadmapy
3. **PO PRÁCI:** Zapiš změny do [progress.md](progress.md)
4. **DEPLOY:** `make deploy-dev` → testuj na https://vybaveno.yrx.cz

---

## 🔗 Důležité odkazy

| Co | Kde |
|----|-----|
| **Produkční URL** | https://vybaveno.yrx.cz |
| **API Health** | `curl https://vybaveno.yrx.cz/api/analyze -X POST` (405 = OK) |
| **Pravidla projektu** | [docs/CLAUDE.md](CLAUDE.md) |
| **Historie změn** | [docs/progress.md](progress.md) |
| **Architektura** | [docs/ARCHITECTURE.md](ARCHITECTURE.md) |

---

*Vytvořeno automaticky pro rychlý onboarding. Aktualizuj při významných změnách.*
