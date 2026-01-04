# Vybaveno — Claude Context

## Přehled projektu

**vybaveno.cz** – AI-powered DIFM (Do-It-For-Me) služba pro virtuální staging interiérů
- **MVP:** Uživatel nahraje fotku pokoje, AI navrhne a vizualizuje nábytek
- **Cílová skupina:** Časově vytížení rodiče, kteří chtějí "hotový pokoj bez práce"
- **Monetizace:** Affiliate provize (IKEA, Bonami) + montážní služby

## Brand Identity

- **Archetyp:** Modern Concierge — empatický, klidný, řešící
- **Barvy:** Šalvějová zelená (#7C8F80), Písková (#F0E8D9), Terakota (#C87F69)
- **Fonty:** Plus Jakarta Sans (nadpisy), Figtree (text)
- **Claim:** "Od chaosu ke klidu" / "Váš pokoj, vaše vize – my to zařídíme"

## Tech Stack

| Vrstva | Technologie |
|--------|-------------|
| Frontend | Next.js 14 (App Router) + Tailwind + Shadcn/ui |
| State | Zustand |
| AI Core | **Gemini 3 Flash** (`gemini-3-flash-preview`) |
| Local Vision | **Transformers.js** (Object Detection) |
| Storage | Local File System (`www/public/uploads`) |
| Database | SQLite (Local `vybaveno.db`) |
| Hosting | Local Docker + Traefik (`vybaveno.yrx.cz`) |

## Struktura projektu

```
/home/vybaveno/project/
├── www/                          ⏳ Next.js aplikace
├── docs/
│   ├── README.md                 📂 Index dokumentace
│   ├── ARCHITECTURE.md           🏗️ Architektura a tech stack
│   ├── STRATEGY.md               📈 Strategie a MVP roadmapa
│   ├── DESIGN.md                 🎨 Brand a vizuální identita
│   ├── DATABASE.md               🗄️ Databáze a migrace
│   ├── PROMPTS.md                🤖 Reference AI promptů
│   ├── progress.md               📝 Log postupu prací
│   └── CLAUDE.md                 🛠️ Tento soubor (instrukce pro agenty)
├── scripts/                      🛠️ Importní a údržbové skripty
├── supabase/                     🗄️ SQL schémata a migrace
└── docker-compose.yml            🚀 Deployment konfigurace
```

## Klíčové soubory

| Soubor | Účel |
|--------|------|
| `docs/progress.md` | Historie vývoje a aktuální stav |
| `docs/ARCHITECTURE.md` | Detailní popis technického řešení |
| `www/src/app/page.tsx` | Hlavní vstupní bod aplikace |
| `www/src/lib/db.ts` | SQLite Singleton wrapper |
| `www/src/lib/gemini-client.ts` | Gemini 3 Flash integrace |
| `progress.md` | Zápisy z každého vývojového runu |
| `www/src/lib/storage.ts` | Lokální úložiště s optimalizací a deduplikací |
| `www/src/lib/local-vision.ts` | Lokální AI kontrola obsahu (Transformers.js) |
| `www/src/app/api/generate/route.ts` | AI Inpainting endpoint (Gemini 3 Flash) |
| `www/src/components/ResultsView.tsx` | UI pro zobrazení analýzy a vizualizací |
| `vybaveno_architecture.md` | Technická architektura a datové typy |
| `gemini_flash_implementation_instructions.md` | Gemini 3 Flash konfigurace a prompty |

## User Flow (MVP)

```
1. UPLOAD → 2. ANALYZE → 3. CONFIGURE → 4. GENERATE
   Fotka      Gemini       Typ pokoje     AI Inpainting
   .jpg       Vision       Barvy          Výsledek
                           Rozpočet       .png
```

## Dva režimy

1. **"Nechte to na nás"** — AI vybere a umístí nábytek automaticky
2. **"Navrhnu sám"** — Studio editor s katalogem a drag & drop

## Gemini 3 Flash — Klíčové info

- **Model ID:** `gemini-3-flash-preview`
- **Input:** Text + Obrázky (multimodální)
- **Output:** Text (+ obrázky přes editaci)
- **Thinking Level:** `medium` (balance rychlost/kvalita)
- **Cena:** $0.50/1M input, $3.00/1M output
- **Context caching:** Až 90% úspora při opakovaném použití

## Vývojový Workflow

1. **Před prací:** Přečti `progress.md` a `implementation.md`
2. **Během práce:** Implementuj úkoly podle roadmapy
3. **Po práci:** Zapiš do `progress.md` co bylo uděláno
4. **Testování:** Po každém runu otestuj funkčnost (build, lint, nebo manuální ověření)
5. **Deploy & Test:** Pokud byl proveden deploy, **VŽDY** otestuj výsledek na **vybaveno.yrx.cz** (testovací server) před ukončením odpovědi.
6. **Testování (příkazy):** `make dev` (lokálně) nebo `make deploy-dev` (dev doména)
7. **Deploy:** `make deploy-prod`

## Příkazy

```bash
# Vývoj (lokální)
make dev

# Deploy na dev (vybaveno.yrx.cz přes Docker)
make deploy-dev

# Deploy na produkci
make deploy-prod

# Build
make build
```

## Pravidla pro AI asistenta

1. **Vždy čti `progress.md`** před začátkem práce
2. **Vždy zapisuj do `progress.md`** po dokončení práce
3. **Drž se roadmapy** v `implementation.md`
4. **Používej české názvy** v UI, anglické v kódu
5. **Mobile-first** — vše musí fungovat na telefonu
6. **Gemini 3 Flash** je primární AI model, ne GPT

## Poznámky

- Detailní architekturu viz `vybaveno_architecture.md`
- Gemini prompty viz `gemini_flash_implementation_instructions.md`
- Strategii viz `analyzy/vybaveno_strategie_a_mvp.md`

