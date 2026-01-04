# Vybaveno — Architektura aplikace

## Přehled systému

Aplikace je postavena jako **AI-first řešení** využívající **Gemini 3 Flash**. Cílem je "Do-It-For-Me" (DIFM) zážitek, kde uživatel vyfotí pokoj a AI do něj fotorealisticky vloží vybraný nábytek při zachování původní architektury.

### User Flow
1. **Upload**: Uživatel nahraje fotografii místnosti.
2. **Analyze**: Gemini 3 Flash analyzuje prostor (styl, rozměry, osvětlení) a navrhne zóny pro nábytek.
3. **Discovery**: Systém okamžitě nabídne relevantní produkty z katalogu (IKEA, JYSK).
4. **Generate**: Gemini Inpainting (Visual Anchoring) vygeneruje finální vizualizaci s vybraným nábytkem.

---

## 1. Tech Stack

| Komponenta | Technologie | Důvod |
|------------|-------------|-------|
| Frontend | **Next.js 15 (App Router)** | Server components, API routes, vysoký výkon |
| UI/UX | **Tailwind CSS + Shadcn/ui** | Moderní "glassmorphism" design, mobile-first |
| AI Core | **Google Gemini 3 Flash** | SOTA model, levný, rychlý, nativní multimodalita |
| Database | **SQLite (Singleton)** | Jednoduchost, nulová latence, FTS5 vyhledávání |
| Infrastructure | **Docker + Traefik** | Kontejnerizace, automatické SSL, snadný deploy |

---

## 2. Klíčové principy

### Unified Interface (App-First)
Aplikace se vyhýbá klasickým landing pages. Po vstupu je uživatel přímo v interaktivním rozhraní:
- **Stage (60%)**: Hlavní vizuální plocha pro nahrání fotky, zobrazení AI značek a Before/After slideru.
- **Sidebar (40%)**: Ovládací panel s rozpočtem, typem místnosti a katalogem produktů.

### Smart Search & Discovery
- **FTS5 & BM25**: Pokročilé full-text vyhledávání v SQLite s vážením relevance.
- **Discovery Mode**: Okamžité zobrazení produktů i bez nahrané fotky na základě výchozích filtrů.
- **Debounced Updates**: Filtry (rozpočet, místnost) aktualizují výsledky s mírným zpožděním pro úsporu zdrojů.

### Visual Anchoring
Místo složitého 3D modelování používáme 2D souřadnicový systém (0-1000), který Gemini využívá pro přesné umístění objektů do scény při zachování perspektivy a stínů.

---

## 3. Adresářová struktura

```
vybaveno/
├── www/                    # Next.js aplikace
│   ├── src/app/            # Routy a API
│   ├── src/components/     # UI komponenty
│   └── src/lib/            # DB, AI klient, utility
├── scripts/                # Importní a údržbové skripty
├── supabase/               # SQL migrace a schémata
└── docs/                   # Dokumentace projektu
```
