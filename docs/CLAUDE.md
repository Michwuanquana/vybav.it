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
| Storage | Local File System (`www/public/uploads`) |
| Database | SQLite (Local `vybaveno.db`) |
| Hosting | Vercel |

## Struktura projektu

```
/home/vybaveno/project/
├── www/                          ⏳ Next.js aplikace
├── backend/                      ⏳ (rezerva pro budoucí API)
├── docs/
│   ├── CLAUDE.md                 📝 Tento soubor
│   ├── progress.md               📈 Log postupu prací
│   ├── implementation.md         📋 Implementační roadmapa
│   ├── vybaveno_architecture.md  🏗️ Architektura aplikace
│   ├── gemini_flash_implementation_instructions.md  🤖 Gemini setup
│   ├── brand_identita.md         🎨 Brand guidelines
│   └── analyzy/                  📊 Strategické dokumenty
└── docker-compose.yml            ⏳ Lokální prostředí
```

## Klíčové soubory

| Soubor | Účel |
|--------|------|
| `implementation.md` | Roadmapa s úkoly a checklistem |
| `progress.md` | Zápisy z každého vývojového runu |
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
5. **Testování (příkazy):** `make dev` (lokálně) nebo `make deploy-dev` (dev doména)
6. **Deploy:** `make deploy-prod`

## Příkazy

```bash
# Vývoj (lokální)
make dev

# Deploy na dev (vybaveno.yrx.cz)
make deploy-dev

# Deploy na produkci (vybaveno.cz)
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

