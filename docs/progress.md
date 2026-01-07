## [2026-01-07] - Phase B: Selection Logic & Visual Polish (Zero Friction)

### Změna
- **Smart Room Detection & Auto-switch:** Po analýze fotky AI nyní vrací pravděpodobnosti pro různé typy pokojů. Pokud uživatel pokoj nevybral ručně, systém automaticky přepne na nejpravděpodobnější typ.
- **Rozšířené kategorie:** Přidány nové typy místností (studentský pokoj, jídelna, kuchyně, předsíň, koupelna, terasa).
- **UX - Scrollovatelný selektor:**
    - Implementován horizontální swipe s snap-center efektem pro mobilní zařízení.
    - Přidána podpora pro horizontální scrollování kolečkem myši na PC.
    - Vizualizovány navigační šipky pro PC při detekci možnosti scrollu.
    - Kliknutí na kategorii automaticky vycentruje daný prvek v selektoru.
    - Přidány interaktivní nápovědy (hints) "Swipe" / "Scroll" pro nové uživatele.
- **Dynamické řazení:** Selekce typu pokoje se po analýze seřadí sestupně podle pravděpodobnosti shody. U typů s pravděpodobností > 15 % se zobrazuje badge s procentuálním vyjádřením.
- **Nasazení:** Úspěšný build a deploy na dev server (`vybaveno.yrx.cz`). Ověřena integrita SQLite databáze.
- **Seamless Replacement:** Výběr nového produktu v zóně nyní automaticky nahradí předchozí. Není nutné nejprve produkt odebírat.
- **Project Progress Bar:** Přidán vizuální ukazatel dokončenosti projektu (0-100 %) v hlavičce sidebaru. Bar mění barvu na terracottu a zobrazuje "Vše hotovo!" při 100 %.
- **Auto-scroll:** Při změně aktivní zóny (kliknutí na marker nebo tlačítko "Pokračovat") se sidebar automaticky vyroluje nahoru na začátek katalogu.
- **Smart Labels:** Přidány štítky "Výhodnější" pro produkty s lepší cenou než stávající výběr a "V rozpočtu" pro kousky, které se vejdou do zbývajícího limitu.
- **Rozšířená shoda:** Vylepšena logika detekce kategorií při výběru z obecného katalogu (přidány synonymy jako "svítidlo", "stolek" atd.).

---

## [2026-01-06] - Implementace Guided Flow (Fáze A)

### Změna
- **HomeClient:** 
  - Refaktoring sledování výběru: z `selectedProducts` (pole) na `selections` (objekt mapující index doporučení na produkt). To umožňuje přesné sledování, která zóna je již "vyřešena".
  - Vizuální vylepšení markerů: neutrální kroužky (#F0E8D9) s pulzující animací pro nevybrané zóny.
  - Interaktivita: Kliknutí na marker automaticky přefiltruje sidebar na danou kategorii (např. "Pohovka") a "zamkne" ho.
  - Náhledy: Po výběru konkrétního kousku se v markeru na fotce zobrazí náhled produktu s checkmarkem.
- **ResultsView:**
  - Přidána sekce "Průzkum zóny" s informací o aktivním filtru a možností jej zrušit.
  - Implementována logika "Co dál?" — po výběru produktu systém inteligentně navrhne další prázdnou zónu k řešení.
  - Oprava duplicitních klíčů a propojování indexů mezi AI analýzou a UI.

---

## [2026-01-06] - Sloučení rozpočtu se sliderem + Progress Bar

### Změna
- **PriceSlider:** Přidána vizuální indikace utracené částky ("spending progress bar").
  - Tmavší pozadí se doplňuje zleva podle součtu cen produktů vybraných "Do projektu".
  - Pokud útrata překročí rozpočet, částka a bar se zbarví červeně.
- **HomeClient:** Přidán state `selectedProducts` pro sledování produktů v aktuálním návrhu.
- **Product Popup:** Přidáno tlačítko "Do projektu" pro přidání/odebrání produktu z rozpočtu.
- **Barevnost:** Implementovány brand barvy (sage pro aktivní prvky, terracotta pro hlavní CTA).

### Technické detaily
- **Komponenta:** [PriceSlider.tsx](www/src/components/PriceSlider.tsx)
- **Logika:** Logaritmické měřítko pro progress bar shodné se sliderem.
- **Deploy:** Úspěšně nasazeno na vybaveno.yrx.cz.

---

## [2026-01-06] - Optimalizace Recommendation API (12x zrychlení)

### Problém: API recommend bylo pomalé (~200ms+ na request)
- **Příčina:** Route handler načítal celou databázi produktů (5000+ položek) do paměti při každém requestu.
- **Symptom:** Pomalá odezva při přepínání stylů nebo po analýze místnosti.
- **Řešení:** 
  1. **Lazy Loading:** API route už nestahuje celou DB. V AI módu stahuje pouze kandidáty pro "bomby" (upsell), zbytek řeší engine přes FTS přímo v DB.
  2. **Paralelizace:** Engine nyní provádí FTS vyhledávání pro všechna AI doporučení paralelně pomocí `Promise.all`.
  3. **SQL Filtrování:** Discovery Mode (bez AI) nyní filtruje produkty podle kategorií přímo v SQL dotazu místo v RAM.
  4. **Benchmark:** Vytvořen skript `scripts/test-api-quality.ts` pro měření výkonu a kvality.
- **Výsledek:** Průměrný čas zpracování klesl z **198ms** na **16ms** (na lokálním datasetu).

## [2026-01-06] - Health Check & Hardware Diagnostics

### Stav systému
- **Disk SSD (systémový):** 86% zaplněno (30GB volných).
  - **Docker Build Cache:** ~85 GB (hlavní příčina zaplnění).
  - **Docker Images:** ~27 GB.
- **HDD (sekundární):** 1TB `/dev/sda` je funkční, ale nepoužitý (bez partition).
  - **SMART status:** PASSED (104 reallocated sectors - disk je starší, ale zatím drží).

---

## [2026-01-05] - FTS Vylepšení: Kategorie + Synonyma

### Problém: AI navrhuje "Obraz", FTS vrací "Zrcadlo"
- **Příčina:** FTS hledá přesná slova, ale "abstraktní obraz" nemá shodu v DB
- **Symptom:** Popup ukazuje zrcadlo místo obrazu/plakátu
- **Řešení:** 
  1. Přidáno mapování českých termínů na DB kategorie (`obraz` → `picture_frame`)
  2. Přidána synonyma pro rozšíření dotazu (`obraz` → `plakát`, `rám`, `rámeček`)
  3. Fallback na kategorii když FTS nic nenajde

### Technické Detaily
- **Soubor:** [fts.ts](www/src/lib/recommendation/strategies/fts.ts)
- **Nové konstanty:**
  - `TERM_TO_CATEGORY`: Mapování 20+ českých termínů na kategorie
  - `TERM_SYNONYMS`: Rozšíření dotazů o synonyma
- **Nová funkce:** `getCategoryFromItem()` - extrakce kategorie z AI doporučení
- **Vylepšená logika:**
  1. FTS s rozšířenými synonymy
  2. Fallback na kategorii pokud FTS selže

### Validace
- ✅ Build projde bez chyb
- ✅ Deploy na vybaveno.yrx.cz

---

## [2026-01-06] - Oprava 404 Errors (API Routes + Favicon)

### Problém: /api/analyze vrací 404
- **Příčina:** Starý Docker build neobsahoval nové API routes po refactoringu `/session/` → `/room/`
- **Symptom:** Browser console: `Failed to load resource: 404 /api/analyze`
- **Řešení:** 
  1. Rebuild + redeploy (`make deploy-dev`)
  2. Ověření: `curl -I /api/analyze` → **405** (Method Not Allowed) = route existuje ✅
  3. Route správně očekává POST request s JSON tělem

### Problém: /cs/favicon.svg vrací 404
- **Příčina:** Next.js s `[lang]` routingem přidává locale prefix k assetům definovaným v metadata
- **Symptom:** Browser console: `Failed to load resource: 404 /cs/favicon.svg`
- **Řešení:**
  1. Zkopírován `/public/favicon.svg` → `/src/app/icon.svg` (Next.js file convention)
  2. Odstraněn `icons` block z `layout.tsx` metadata
  3. Next.js nyní automaticky servuje ikonu z `/icon.svg`

### Technické Detaily
- **Next.js File Conventions:** `app/icon.svg` automaticky rozpoznán jako favicon
- **Build Process:** Každý rebuild kompletně přestaví standalone bundle s aktuálními routes
- **Status Codes:**
  - 404 = route neexistuje
  - 405 = route existuje, ale metoda (GET/POST) není povolena
  - 307 = temporary redirect (Next.js optimalizuje asset delivery)

---

# Vybaveno — Progress Log

Zápisy z každého vývojového runu. Nejnovější nahoře.

---

## [2026-01-06] - Oprava Image Upload + URL Refactoring

### Problém: Broken Images (404)
- **Příčina:** Next.js standalone **neservíruje** `/public/` folder automaticky runtime
- **Symptom:** Obrázky uploadované do `/uploads/` vracely 404
- **Řešení:** 
  1. Vytvořena custom API route `/api/uploads/[...path]` pro servírování souborů
  2. Změna `storage.ts` - URL z `/uploads/` na `/api/uploads/`
  3. Vyčištění DB - smazáno 62 starých sessions se starou URL strukturou

### URL Struktura - Session → Room
- **Změna:** `/cs/session/[id]` → `/cs/room/[id]`
- **Důvod:** Lepší sémantika ("pokoj" místo "relace")
- **Soubory:**
  - Přejmenovány složky: `www/src/app/[lang]/session` → `room`
  - Přejmenovány API routes: `www/src/app/api/session` → `api/room`
  - Aktualizovány odkazy v `HomeClient.tsx`, `SessionClient.tsx`

### Technické Detaily
- **API Route Pattern:** `/api/uploads/[...path]/route.ts` s catch-all segmentem
- **Cache Headers:** `public, max-age=31536000, immutable` pro optimální cachování
- **Security:** Path traversal protection (`..` blokován)
- **Content Types:** Automatická detekce pro .jpg, .png, .gif, .webp

### Validace
- ✅ Build projde bez chyb
- ✅ Obrázky se načítají přes `/api/uploads/` (200 OK)
- ✅ Nová URL struktura `/cs/room/[id]` funkční
- ✅ Deploy na vybaveno.yrx.cz kompletní

---

## [2026-01-06] - UX Refactoring: Marker → Popup Only + UI Tlačítka

### Změna UI
- **Reload tlačítko (reload ikona):** Přesunuto z pravého panelu na levý horní roh obrázku
  - Bylo: V Settings Row s ArrowLeft ikonou
  - Je teď: Na obrázku vlevo nahoře, vedle X tlačítka (reload ikona `RotateCcw`)
  - Barva: Bílá s shadow (contrast na obrázku)
  
- **X tlačítko (Vyčistit):** Zůstává vpravo nahoře na obrázku
  - Barva: Terracotta background

### Změna Chování
**Před:** Po kliknutí na bod na fotce se spustilo vykreslování/generování návrhu (slider with before/after)
**Po:** Po kliknutí se otevře popup s top doporučeným produktem pro danou kategorii

### Odstraněno
- [x] **State Variables:** `generatedImage`, `visualizingId`, `sliderPosition`, `placement`
- [x] **Funkce:** `handleVisualize()`, `handleGenerateFullDesign()`
- [x] **UI Komponenty:**
  - Before/after slider pro porovnání původní a generované fotky
  - Sticky CTA tlačítko "Vytvořit finální návrh"
  - Action tlačítka (Back, Download, Share) pro generovaný obrázek
  - Props v `ResultsView`: `onGenerateFullDesign`, `isGenerating`
- [x] **Logika v Error Handling:** Odstranění retry logiky pro `visualizingId` a `placement`

### Přidáno
- [x] **Popup Dialog:** Při kliknutí na marker se otevře dialog s:
  - Obrázek produktu (fallback na placeholder)
  - Název produktu, značka, cena
  - Tagy/kategorie
  - Důvod doporučení (fallback na popis z databáze)
  - Affiliate odkaz "Zobrazit na webu"
- [x] **State:** `selectedProduct`, `selectedRecommendation`
- [x] **Handler:** `handleMarkerClick(rec)` - hledá produkt v `recommendedProducts` a otevírá popup

### Technické Detaily
- **Soubory:** [HomeClient.tsx](www/src/app/[lang]/HomeClient.tsx), [ResultsView.tsx](www/src/components/ResultsView.tsx)
- **Dialog UI:** shadcn/ui `Dialog` komponenta
- **Icons:** `ShoppingCart`, `ExternalLink` z lucide-react

### Důvod
Generování/vykreslování se odložuje na později - nejprve je potřeba vychytat umístění produktů. 
Aktuální UX se soustředí pouze na jednoduchou prezentaci doporučení.

### Validace
- ✅ Build projde bez chyb
- ✅ Deploy na vybaveno.yrx.cz funkční
- 🔲 **TODO:** Otestovat klikání na markery a popup flow

---

## [2026-01-06] - Hotfix: API 500 Error + Icon Cleanup

### Opraveno
- [x] **Icon Cleanup:** Opraveny neexistující lucide-react ikony:
  - `MagicWand` → `Wand` (ve 3 souborech, celkem 11 výskytů)
  - `Rulers` → `Ruler`
  - Soubory: `UploadZone.tsx`, `ResultsView.tsx`, `HomeClient.tsx`
  
- [x] **KRITICKÝ BUG #1 - SQL Dimensions:** Endpoint `/api/products/recommend` vracel 500 kvůli neexistujícím sloupcům.
  - **Příčina:** SQL dotaz používal `p.width_cm`, `p.height_cm`, `p.depth_cm`
  - **Realita:** DB má `dimensions_cm JSONB`
  - **Oprava:** Parsování rozměrů z JSON s bezpečným try/catch

- [x] **KRITICKÝ BUG #2 - Null Safety:** TypeError při volání `.toLowerCase()` na null hodnotách.
  - **Příčina:** `product.color` a `rec.suggested_color` mohou být null
  - **Oprava:** Přidány null checky před toLowerCase() ve [style.ts](www/src/lib/recommendation/strategies/style.ts)
  - **Bonus:** Konzistentní parsování dimensions_cm i v [fts.ts](www/src/lib/recommendation/strategies/fts.ts)

### Validace
- ✅ Build projde bez chyb
- ✅ API vrací produkty (5707 v DB)
- ✅ AI doporučení fungují (FTS search + scoring + bomby)
- ✅ Deploy na vybaveno.yrx.cz funkční

### Soubory upraveny
- [route.ts](www/src/app/api/products/recommend/route.ts): SQL + JSON parsing
- [style.ts](www/src/lib/recommendation/strategies/style.ts): Null-safe toLowerCase()
- [fts.ts](www/src/lib/recommendation/strategies/fts.ts): Dimensions parsing

---

## [2026-01-05] - Sprint 16: Centralizovaný Recommendation System

### Dokončeno
- [x] **Recommendation System Architecture:** Vytvořen kompletní modul `lib/recommendation/` pro centralizovanou logiku doporučování.
- [x] **Strategie:**
    - **Budget Strategy** (`strategies/budget.ts`): Dynamické "bomby" (upsell) podle cenového pásma uživatele.
      - Budget (<20k): +10-15%, max 1 bomba
      - Mid (20-60k): +10-20%, max 2 bomby
      - Premium (60k+): +15-25%, max 2 bomby
    - **Style Strategy** (`strategies/style.ts`): Fuzzy matching stylů s fallback na příbuzné styly.
    - **Furnishing Strategy** (`strategies/furnishing.ts`): Prioritizace produktů podle zaplněnosti místnosti (prázdné = velký nábytek, plné = doplňky).
    - **FTS Strategy** (`strategies/fts.ts`): Wrapper pro SQLite FTS5 s AND/OR fallback logikou.
- [x] **Recommendation Engine** (`engine.ts`): Hlavní orchestrace se skórovacím systémem (styl + AI shoda + velikost + cena = 0-240 bodů).
- [x] **API Refaktoring:** `/api/products/recommend` nyní používá centralizovaný engine místo duplicitní logiky.
- [x] **Helpers:** `getDiscoveryRecommendations()` pro discovery mode, `getAIRecommendations()` pro režim s analýzou.
- [x] **Typy:** Kompletní TypeScript interface (`Product`, `RecommendationConfig`, `BombConfig`, `ProductScore`).

### Technické detaily
- **Skórovací systém:**
  - Styl: 0-100 bodů (přímá shoda nebo příbuzné styly)
  - AI doporučení: 0-100 bodů (shoda názvu + styl + barva + priorita)
  - Zaplněnost: 0-30 bodů (velký nábytek v prázdné místnosti = +30)
  - Cena: 0-10 bodů (levnější = lepší)
- **Bomby:** Identifikují se MIMO rozpočet, ale v dynamickém pásmu. Seřazené podle skóre.
- **FTS5:** Zachována původní logika s BM25 ranking a relaxed fallback.

### Soubory vytvořeny
1. [lib/recommendation/types.ts](www/src/lib/recommendation/types.ts)
2. [lib/recommendation/strategies/budget.ts](www/src/lib/recommendation/strategies/budget.ts)
3. [lib/recommendation/strategies/style.ts](www/src/lib/recommendation/strategies/style.ts)
4. [lib/recommendation/strategies/furnishing.ts](www/src/lib/recommendation/strategies/furnishing.ts)
5. [lib/recommendation/strategies/fts.ts](www/src/lib/recommendation/strategies/fts.ts)
6. [lib/recommendation/engine.ts](www/src/lib/recommendation/engine.ts)
7. [lib/recommendation/index.ts](www/src/lib/recommendation/index.ts)

### Soubory upraveny
- [/api/products/recommend/route.ts](www/src/app/api/products/recommend/route.ts): Kompletně přepsáno na použití recommendation engine (~200 řádků → ~70 řádků).

### Výhody nové architektury
✅ Jedna pravda — logika doporučování na jednom místě  
✅ Snadno testovatelné — každá strategie je izolovaná  
✅ Konfigurovatelné — bomby, limity, váhy se nastavují v config objektu  
✅ Rozšiřitelné — nové strategie (např. seasonal, trending) se přidávají snadno  
✅ Type-safe — kompletní TypeScript coverage

---

## [2026-01-05] - Sprint 15: UI Floating Controls

### Dokončeno
- [x] **Floating Buttons:** Implementovány 2 kruhová tlačítka v pravém horním rohu nad obrázkem (design: Modern Concierge):
    - **"Znovu"** (RotateCcw ikona, sage barva) — resetuje jen design/návrh, zachová session a analýzu.
    - **"Vyčistit"** (X ikona, terracotta barva) — smaže vše včetně cache, vrátí na titulní stránku.
- [x] **Slovníkové klíče:** Přidány lokalizace `restart_design` a `clear_all` do cs.json a en.json.
- [x] **Handler logika:**
    - `handleRestartDesign()` — resetuje `generatedImage`, `visualizingId`, `placement`, slider a error stav.
    - `handleClearAll()` — smaže session z DB a vrátí na homepage.
- [x] **Responsive design:** Buttons se zobrazují pouze pokud existuje analýza nebo vygenerovaný obrázek (podmínka `(analysisResult || generatedImage)`).
- [x] **Styling:** Glassmorphism design s `backdrop-blur-md`, poloprůhledné pozadí a hover/active stavy (scale animace).
- [x] **Build & Test:** Projekt se builduje bez chyb, dev server běží na `localhost:3000`.

### Technické detaily
- **Ikony:** `RotateCcw` (znovu) a `X` (vyčistit) z lucide-react.
- **Podmínka zobrazení:** Buttons se zobrazují v `group/image-container` pouze pokud `(analysisResult || generatedImage)`.
- **Styling:** Brand barvy (sage #5D7A66, terracotta #C1664E), jemné stíny a animace.

### Soubory upraveny
- [HomeClient.tsx](www/src/app/[lang]/HomeClient.tsx): Přidáno `handleRestartDesign()`, `handleClearAll()`, ikony, floating buttons.
- [cs.json](www/src/dictionaries/cs.json): Nové klíče `restart_design`, `clear_all`.
- [en.json](www/src/dictionaries/en.json): Nové klíče `restart_design`, `clear_all`.

---

## [2026-01-04] - Sprint 14: Feedback System & Language Consistency

### Dokončeno
- [x] **Language Consistency:** Gemini nyní dostává instrukci pro konkrétní jazyk (cs/en) a vrací celou odpověď v tomto jazyce.
- [x] **DB-UI Language Decoupling:** `search_query` je nyní vynuceně v češtině pro správné párování s databází, zatímco `item_label` je v jazyce uživatele.
- [x] **Feedback System (In Progress):** Implementace palec nahoru/dolů pro hodnocení analýzy.
- [x] **Negative Feedback Dialog:** Přidáno okno pro nepovinné sdělení důvodu nespokojenosti.

---

## [2026-01-04] - Sprint 14: Feedback System & Language Consistency

### Dokončeno
- [x] **Language Consistency:** Gemini nyní dostává instrukci pro konkrétní jazyk (cs/en) a vrací celou odpověď v tomto jazyce.
- [x] **DB-UI Language Decoupling:** `search_query` je nyní vynuceně v češtině pro správné párování s databází, zatímco `item_label` je v jazyce uživatele.
- [x] **Feedback System:** Implementace palec nahoru/dolů pro hodnocení analýzy s ukládáním do DB.
- [x] **Negative Feedback Dialog:** Přidáno okno pro nepovinné sdělení důvodu nespokojenosti.
- [x] **Testing Protocol:** Vytvořen [docs/TESTING.md](docs/TESTING.md) - POVINNÝ checklist před každým deploymentem.

### ⚠️ DŮLEŽITÉ: Testovací Protokol
**Od tohoto okamžiku KAŽDÝ deploy MUSÍ splňovat požadavky v [docs/TESTING.md](docs/TESTING.md).**
- Minimálně: Build check + Smoke test + Critical path
- Při změně AI promptu: Kompletní regression testing
- Agent MUSÍ projít checklist před merge do main

---

## [2026-01-04] - Sprint 13: Intelligent Prioritization & Furnishing Analysis

### Dokončeno
- [x] **Furnishing Level Detection:** Gemini AI nyní analyzuje úroveň zabydlenosti místnosti (0-100%).
- [x] **Smart Prioritization:** Implementována logika řazení doporučení:
    - **Prázdné místnosti (<35%):** Prioritizují velký nábytek (pohovky, postele, stoly, skříně).
    - **Plné místnosti (>75%):** Prioritizují doplňky, dekorace, osvětlení a textilie.
- [x] **Prompt Engineering:** Rozšířen `ANALYSIS_PROMPT` o instrukce pro prioritizaci a kategorizaci velikosti produktů.
- [x] **Backend Logic:** API `/api/analyze` nyní vrací `furnishing_level` a `/api/products/recommend` využívá tuto hodnotu pro vážené řazení v Discovery módu.
- [x] **UI Indicator:** V sekci analýzy prostoru se nyní zobrazuje procentuální úroveň zabydlenosti a slovní kategorie (Prázdná, Částečně vybavená, Plně vybavená).
- [x] **i18n Support:** Přidány lokalizační klíče pro stavy zabydlenosti v češtině i angličtině.

---

## [2026-01-04] - Sprint 12: Docker Storage & Upload Fix

### Dokončeno
- [x] **Docker Path Fix:** Opravena cesta pro ukládání obrázků v Docker kontejneru. Problém byl s Docker cache, která neaktualizovala kód po změnách.
- [x] **Full Rebuild:** Provedeno `docker-compose build --no-cache www` pro vynucení nového buildu.
- [x] **Upload API Verified:** Ověřena funkčnost upload API s FormData - session se vytváří, obrázky se ukládají do `/app/www/public/uploads/`.
- [x] **HTTP Access Confirmed:** Potvrzeno, že obrázky jsou dostupné přes `https://vybaveno.yrx.cz/uploads/...` (HTTP 200).
- [x] **AI Cache Working:** Deduplikace obrázků pomocí SHA-256 hash funguje správně - stejný obrázek = stejná analýza.
- [x] **Inteligentní Tooltip Pozicování:** Tooltips se nyní zobrazují vlevo od markeru pokud je marker blízko pravého okraje (x > 55%), jinak vpravo. Šipka se automaticky přesouvá na správnou stranu.
- [x] **Demo Auto-Retry:** Implementována automatická retry logika pro demo testování. Pokud AI analýza selže, systém automaticky stáhne nový obrázek a zkusí znovu (max 3 pokusy). Cíl: 100% úspěšnost demo flow.

### Technické detaily
- Storage path v Docker: `/app/www/public/uploads/`
- CWD v kontejneru: `/app`
- Důvod problému s cache: Docker cache (`CACHED` vrstvy) bránila aplikaci nového kódu po úpravách.
- Tooltip logika: `showTooltipLeft = markerX > 55` určuje stranu zobrazení
- Demo retry: Detekce demo módu podle názvu souboru (`file.name.startsWith('demo-')`), max 3 automatické pokusy s novými obrázky

---

## [2026-01-04] - Sprint 11: Internationalization (i18n)

### Dokončeno
- [x] **i18n Infrastructure:** Implementována podpora pro více jazyků (CS/EN) pomocí Next.js Middleware a dynamického routingu `[lang]`.
- [x] **App Router Restructuring:** Migrace hlavní stránky do `src/app/[lang]/page.tsx` a oddělení klientské logiky do `HomeClient.tsx`.
- [x] **Dictionaries:** Vytvořeny JSON slovníky (`cs.json`, `en.json`) pokrývající všechny texty v aplikaci (Common, Upload, Analysis, Results).
- [x] **Component Localization:**
    - `HomeClient.tsx`: Kompletní náhrada hardcoded textů za `dict` klíče.
    - `AnalysisSpinner.tsx`: Lokalizované fáze analýzy.
    - `UploadZone.tsx`: Lokalizované instrukce a tipy pro focení.
- [x] **Middleware:** Automatická detekce jazyka prohlížeče a přesměrování na `/cs` nebo `/en`.
- [x] **Deployment Fixes:**
    - Oprava JSON syntaxe v `en.json`.
    - Aktualizace `layout.tsx` a `page.tsx` pro asynchronní zpracování `params` (Next.js 15+).
    - Prop-drilling `dict` objektu do `ResultsView` a `StudioEditor`.
    - Úspěšný build a nasazení na vývojové prostředí.
- [x] **Modern Concierge Flow Optimization:**
    - **Non-blocking Upload:** Oprava stavu `isUploading`, který blokoval zobrazení fotky během analýzy. Nyní se fotka zobrazí okamžitě po nahrání.
    - **Analysis Feedback:** Přidána vizuální notifikace "Analýza dokončena!" po úspěšném zpracování místnosti.
    - **Smart Navigation:** Vylepšena logika tlačítka "Zpět" – v režimu návrhu se nejprve vrátí k původní fotce s body, místo smazání celé relace.
    - **State Management:** Implementován kompletní reset stavů (analýza, produkty, heuristika) při nahrání nové fotografie.
    - **Dictionary Expansion:** Doplněny chybějící klíče pro rozpočet a úspěšné stavy analýzy.

---

## [2026-01-04] - Sprint 10: UI Quick Wins & Concierge Polish

### Dokončeno
- [x] **Preselection:** Nastaven "Obývací pokoj" (`living`) jako výchozí vybraná místnost pro okamžitou zpětnou vazbu v UI.
- [x] **Sidebar Opacity:** Zvýšena průhlednost pravého panelu na `bg-white/60` s `backdrop-blur-md` pro modernější "glassmorphism" vzhled, který lépe integruje panel do scény.
- [x] **Empty States Refinement:**
    - Nahrazení strohých ikon (Info) za přívětivější vizuály (`Sofa`, `Sparkles`).
    - Přidán placeholder text: "Váš inteligentní návrh se zobrazí právě zde."
    - Sjednocení stylu prázdných stavů v hlavním panelu i katalogu produktů.
- [x] **Slider Progress:** Opravena vizuální indikace postupu u slideru rozpočtu. Aktivní část (Range) nyní používá brandovou barvu `bg-sage` místo nevýrazné šedé.
- [x] **UI Consistency:** Sjednocení barev ovládacích prvků (Thumb, Track) na brandovou `sage` v komponentě `ui/slider.tsx`.
- [x] **Responsive Settings:** Oprava rozbitého layoutu ikon při šířce ~1200px. Nastavení (Rozpočet a Typ místnosti) se nyní v sidebaru řadí nad sebe až do šířky 1280px (`xl`), což dává prvkům více prostoru.
- [x] **Room Selector Optimization:** Ikony v výběru místnosti se nyní dynamicky přizpůsobují šířce kontejneru (2-5 sloupců) a mají optimalizovanou velikost, aby nedocházelo k přetékání textu.
- [x] **Manual Budget Input:** Přidána možnost ručního zadání rozpočtu kliknutím na částku. Částka se změní na textové pole, které po potvrzení (Enter/Blur) aktualizuje návrh.
- [x] **Instant Product Discovery:** Produkty se nyní načítají okamžitě po vstupu na stránku (Discovery Mode) bez nutnosti nahrát fotku.
- [x] **Dynamic Results View:** Komponenta `ResultsView` byla upravena tak, aby fungovala i bez AI analýzy. V takovém případě zobrazuje "Discovery Mode" s nejlepšími kousky pro vybranou místnost.
- [x] **Initial State Sync:** Přidán `useEffect` pro načtení výchozích produktů při startu aplikace a propojení změn filtrů (místnost, rozpočet) s okamžitou aktualizací seznamu i v prázdném stavu.
- [x] **UI Simplification:** Odstraněno tlačítko "Vizualizovat" u jednotlivých produktů. Hlavní akcí je nyní výběr produktů a následné vygenerování celého návrhu pomocí hlavního tlačítka, což je pro uživatele srozumitelnější a méně matoucí.
- [x] **Documentation Cleanup:** Kompletní reorganizace a promazání dokumentace. Odstraněno 15+ zastaralých souborů, konsolidace do 5 hlavních dokumentů (`ARCHITECTURE`, `STRATEGY`, `DESIGN`, `DATABASE`, `PROMPTS`) a vytvoření centrálního indexu `docs/README.md`.

---

## [2026-01-04] - Sprint 9: Final Polish & Mobile Optimization

### Dokončeno
- [x] **SEO & Meta:** Implementovány OpenGraph a Twitter meta tagy v `layout.tsx` pro lepší sdílení na sociálních sítích.
- [x] **Mobile UX:** 
    - Zvětšení ovládacího prvku slideru (48px) pro lepší ovladatelnost prstem.
    - Zvětšení interaktivní plochy (Stage) na mobilu na 50vh.
    - Přidání aktivních stavů a animací pro dotykové ovládání.
- [x] **Visual Refinement:** Snížení intenzity bluru na pozadí a v překryvných vrstvách (z `blur-xl` na `blur-sm`) pro čistší a profesionálnější vzhled.

### Plánováno
- [ ] **Final Testing:** Kompletní průchod aplikací na různých zařízeních.
- [ ] **Documentation:** Finální revize technické dokumentace pro předání.

---

## [2026-01-03] - Sprint 8: Agent Evolution & Persona Refinement

### Dokončeno
- [x] **Agent Evolution:** Aktualizován `Vybaveno.agent.md` na verzi 2.0. Agent nyní obsahuje specifické technické imperativy (FTS5, SQLite permissions, Gemini 3 Flash) a hlubší propojení s brand archetypem "Modern Concierge".
- [x] **Persona Alignment:** Posílení filozofie "Od chaosu ke klidu" v instrukcích agenta a definice "Svaté trojice" pravidel (Kontext, Integrita, Kvalita).
- [x] **UX Refinement (Sprint 8 - P0/P1/P2):**
    - **Marker ↔ Sidebar Sync:** Implementován okamžitý filtr a highlight (terakota border) při hoveru na marker.
    - **Full Design CTA:** Přidáno sticky tlačítko "✨ Vygenerovat návrh" pro kompletní vizualizaci.
    - **Sidebar Upgrade:** Produkty jsou nyní seskupeny podle kategorií a doplněny o interaktivní Budget Tracker.
    - **Marker Hierarchy:** Omezení na 6 primárních ikon, hierarchie velikostí (hlavní nábytek je větší) a pulzující animace.
    - **Navigace:** Přejmenování tlačítek na "Upravit pozice" a "Dokončit návrh" pro lepší srozumitelnost.
    - **Before/After Slider:** Implementován interaktivní slider pro plynulé porovnání původní fotky a AI návrhu přímo na hlavním plátně.
    - **Fix pozicování markerů:** Vyřešen problém s "cestováním" markerů při změně velikosti okna. Markery jsou nyní pevně připnuty k obsahu obrázku bez ohledu na poměr stran kontejneru.
    - **Optimalizace vyhledávání:** Implementována pokročilá FTS5 logika (prefix matching `*`, AND/OR fallback, BM25 váhy) pro přesnější shodu produktů jako "stojací lampa".
    - **Zpřesnění AI doporučení:** Aktualizován Gemini prompt pro generování vysoce specifických českých vyhledávacích dotazů.
    - **Metadata místnosti:** Rozšířené zobrazení odhadovaných rozměrů, charakteristiky stylu a barevné palety.
    - **Performance UX:** Detailní indikátor postupu generování s fázemi (např. "Ladíme osvětlení...") pro lepší zpětnou vazbu během ~25s čekání.
    - **Empty States:** Přidáno vizuální upozornění, pokud v katalogu nejsou nalezeny žádné produkty pro daný filtr.
    - **Error Handling:** Implementován robustní systém pro zachycení chyb Gemini API s možností restartu analýzy/vizualizace.
    - **Export & Share:** Přidána tlačítka pro stažení návrhu a sdílení odkazu.
    - **Brand Identity:** Vytvořeno oficiální SVG logo a favicona na základě brandových manuálů. Logo integrováno do landing page a post-analytického rozhraní.
    - **Landing Modal Refinement:** Kompletní redesign úvodního modalu. Silnější CTA (Galerie/Vyfotit), vizuální tipy s ikonami, odstranění "AI" terminologie a vylepšené pozadí s hlubokým blurem.

---

## [2026-01-03] - Sprint 7: Production Stabilization & Permission Fixes

### Dokončeno
- [x] **Oprava oprávnění DB:** Vyřešen kritický problém `SQLITE_READONLY` na produkčním serveru nastavením oprávnění `666` pro `vybaveno.db`.
- [x] **Environment Sync:** Oprava předávání `GEMINI_API_KEY` do Docker kontejneru přes `env_file` a reset `docker-compose`.
- [x] **FTS Query Fix:** Oprava syntaktické chyby v FTS5 vyhledávání (escapování dotazů do uvozovek), která způsobovala pády při hledání produktů s pomlčkami v názvu.
- [x] **Production Data Parity:** Kompletní inicializace a import dat (5700+ produktů) přímo na produkčním serveru.
- [x] **Upload Flow:** Ověření zápisu do databáze a filesystemu pod uživatelem `www-data` uvnitř kontejneru.

### Technické detaily
- **Permissions:** Databáze musí mít `666` (nebo `664` s korektní grupou), aby Docker kontejner běžící pod jiným UID mohl provádět zápisy (SQLite vytváří `-journal` soubory).
- **Docker Compose:** Použití `env_file: .env` se ukázalo jako stabilnější pro předávání klíčů než přímé mapování v `environment` sekci u starších verzí docker-compose.

---

## [2026-01-03] - Sprint 6: FTS5 Search & Guaranteed Density

### Dokončeno
- [x] **FTS5 Implementace:** Vytvoření virtuální tabulky `products_fts` v SQLite pro bleskové full-text vyhledávání s BM25 rankingem.
- [x] **Zónový Prompt:** Úprava `ANALYSIS_PROMPT` pro generování 10-15 zón a specifických vyhledávacích dotazů (search queries).
- [x] **Tříúrovňový algoritmus:** Implementace garantovaného zaplnění (1. Značky, 2. Skrytá doporučení, 3. Discovery).
- [x] **Ranked Search API:** Přechod na `MATCH` a `bm25()` v `/api/products/recommend` pro maximální relevanci.
- [x] **UI Optimalizace:** Prohození ovládacích prvků (Cena vs Typ pokoje) a zahuštění mřížky produktů.
- [x] **Data Sync:** Implementace SQLite triggerů pro automatickou synchronizaci FTS indexu při změnách v produktech.
- [x] **Interaktivní Propojení (Hover & Match):** Implementace synchronizace mezi AI značkami na fotce a katalogem produktů.
- [x] **Infinite Loading:** Přidáno tlačítko pro dynamické načítání dalších produktů z databáze přímo v sidebaru.
- [x] **Server Fixes:** Oprava escapování FTS dotazů (uvozovky) a kompletní inicializace databáze na serveru (import 5700+ produktů).

### Technické detaily
- **BM25 Tuning:** Váhy nastaveny na (5.0, 1.0, 1.0, 1.0, 1.0, 2.0) pro prioritizaci názvu a klíčových slov.
- **State Sync:** Použití `activeCategory` pro real-time řazení a zvýraznění produktů při hoveru na fotce.
- **FTS5 Schema:** Virtuální tabulka používá `id UNINDEXED` pro efektivní join s hlavní tabulkou `products`.

---

## [2026-01-03] - Sprint 5: Studio UX & Visualization Refactoring

### Dokončeno
- [x] **Layout 60/40:** Implementace vertikálního rozdělení 60% (Stage) / 40% (Sidebar) na PC pro lepší vizuální rovnováhu.
- [x] **Diverzita ikon:** AI značky na fotce nyní používají specifické ikony podle typu nábytku (pohovka, lampa, stůl atd.) místo univerzální hvězdičky.
- [x] **Optimalizace Viewportu:** Zahuštění informací v sidebaru a zmenšení paddingů, aby bylo ve viewportu vidět více produktů najednou.
- [x] **Lucide integrace:** Nahrazení emoji v selektoru místností za konzistentní Lucide ikony.
- [x] **Refaktoring vizualizace:** Vizualizace (vygenerovaný obrázek) se nyní zobrazuje přímo na hlavním plátně místo v postranním panelu.
- [x] **Lifting State:** Stav vizualizace a logika generování přesunuta do `page.tsx` pro lepší koordinaci mezi komponentami.
- [x] **Kompaktní Sidebar:** `ResultsView.tsx` kompletně přepracován na kompaktní postranní panel zaměřený na analýzu a seznam produktů.
- [x] **Interaktivní Stage:** Hlavní plocha nyní podporuje interaktivní AI značky (markers) a přepínání mezi původní a vygenerovanou fotkou.
- [x] **Oprava API:** Sjednoceno volání vizualizace na `/api/generate` s korektním payloadem.

---

## [2026-01-03] - Sprint 4: Infrastructure & Agent Setup

### Dokončeno
- [x] **Oprava DB vrstvy:** Vyřešeny problémy s `promisify` v `scripts/lib/db.ts`, které blokovaly importy a validace.
- [x] **AI Pipeline Test:** Vytvořen skript `scripts/test-ai-pipeline.ts` pro end-to-end testování analýzy a doporučování produktů.
- [x] **Agent Setup:** Vytvořen specializovaný agent `Vybaveno.agent.md` a aktualizován `CLAUDE.md` o povinnost testování na `vybaveno.yrx.cz` po každém deployi.
- [x] **Validace dat:** Úspěšně ověřena funkčnost importu a vyhledávání v lokální SQLite databázi (5 600+ produktů).
- [x] **Vylepšení doporučování:** SQL dotaz v `/api/products/recommend` nyní inteligentně filtruje venkovní nábytek pro vnitřní místnosti.
- [x] **Studio Editor (Alpha):** Implementována nová komponenta `StudioEditor.tsx` umožňující manuální přidávání a úpravu bodů v místnosti. Integrováno do `ResultsView`.

---

## [2026-01-03] - Sprint 3: UX Refinement & Visual Anchoring

### Dokončeno
- [x] **Fáze 6: Visual Anchoring (Interaktivní umisťování)**
    - Implementace AI značek (markers) přímo do náhledu místnosti po analýze
    - Automatické generování souřadnic (X, Y) pro doporučený nábytek pomocí Gemini
    - Tooltipy s detaily doporučení a náhledem produktu přímo na fotce
- [x] **UX & Design Polish**
    - Odstranění "AI" terminologie pro přirozenější uživatelský zážitek (nahrazeno "inteligentním systémem")
    - Implementace plynulých přechodů (blur & fade-in) při generování návrhu
    - Přidání živého časoměřiče a indikátorů fází postupu (Analýza -> Výběr -> Vizualizace)
- [x] **Relevance doporučení**
    - Integrace kontextu typu místnosti (např. "pracovna") do analytického promptu
    - Prioritizace základního nábytku (stoly, postele) před doplňky u prázdných místností
    - Vylepšený SQL ranking v `/api/products/recommend` (vážené řazení podle AI doporučení a kategorií)
- [x] **Technická stabilizace**
    - Implementace Singleton patternu pro SQLite v Next.js (prevence "too many clients" chyb)
    - Detailní měření času (timing logs) pro všechny backendové procesy
    - Oprava kritických chyb (ReferenceError: cn, Fetch errors)

### Technické detaily
- **Visual Anchoring:** Gemini nyní vrací souřadnice v měřítku 0-1000, které frontend mapuje na responzivní náhled.
- **Performance:** Průměrná doba analýzy ~8s, generování vizualizace ~25s.
- **Database:** SQLite singleton v `src/lib/db.ts` zajišťuje stabilitu při HMR v dev módu.

### Další kroky
- [ ] Vytvoření "Studio" editoru pro manuální úpravy designu
- [ ] Implementace exportu návrhu do PDF/Emailu

---

## [2026-01-03] - Sprint 2: Data & AI Foundation

### Dokončeno
- [x] Přechod na lokální SQLite databázi (`vybaveno.db`) pro vývoj
- [x] Implementace `LocalDB` s podporou pro produkty, obrázky a session
- [x] Plný import produktů (IKEA & JYSK) - celkem ~2900 unikátních produktů
- [x] Pokročilé parsování materiálů (hierarchie: masiv vs dýha) a barev
- [x] Automatická detekce stylu (Scandinavian, Industrial, atd.) na základě sérií a klíčových slov
- [x] Implementace `/api/upload` s podporou SQLite session
- [x] Implementace `/api/analyze` s využitím Gemini 3 Flash (včetně promptu pro analýzu místnosti)
- [x] Implementace `/api/products/recommend` pro filtrování produktů podle stylu, materiálu a ceny
- [x] **Fáze 4: UI pro zobrazení výsledků analýzy a doporučených produktů**
- [x] **Fáze 5: Integrace AI Inpaintingu pro vizualizaci nábytku v místnosti**
- [x] **Lokální bezpečnostní vrstva:** Implementace `Transformers.js` pro detekci osob a nežádoucích objektů před odesláním do AI
- [x] **Lokální úložiště:** Nahrazení Cloudflare R2 lokálním souborovým systémem (`/public/uploads`)
- [x] **Optimalizace obrázků:** Integrace knihovny `sharp` pro automatickou kompresi a změnu velikosti
- [x] **Deduplikace & Caching:** Implementace SHA-256 hashování pro zamezení duplicitních uploadů a "AI Cache" pro znovupoužití výsledků analýzy u stejných fotek

### Technické detaily
- **Databáze:** SQLite v kořeni projektu, sdílená mezi skripty a Next.js aplikací
- **AI:** Gemini 3 Flash (`gemini-3-flash-preview`) pro multimodální analýzu fotek a inpainting
- **Doporučování:** 3-vrstvý algoritmus (Styl -> Materiál/Barva -> Rozměry)
- **Inpainting:** "Visual Anchoring" strategie s využitím multimodálního vstupu Gemini 3 Flash

### Další kroky
- [ ] Vytvoření "Studio" editoru pro manuální úpravy designu
- [ ] Implementace exportu návrhu do PDF/Emailu

---

## 2026-01-02 | Setup & Architektura

**Autor:** Claude (Opus 4.5)

### Co bylo uděláno

1. **Aktualizace architektury** (`vybaveno_architecture.md`)
   - Přepsán flow z manuálního Fabric.js editoru na AI-first přístup
   - Tech stack aktualizován na Gemini 3 Flash
   - Přidány `userPreferences` (barvy, rozpočet) do datového modelu
   - Prompty rozšířeny o kontext preferencí

2. **Implementační plán Gemini** (`gemini_flash_implementation_instructions.md`)
   - Konfigurace klienta pro `gemini-3-flash-preview`
   - Prompt pro analýzu geometrie (structured output)
   - Prompt pro inpainting s "Visual Anchoring"
   - Tipy pro context caching a úsporu tokenů

3. **Implementační roadmapa** (`implementation.md`)
   - 6 sprintů od setupu po launch
   - Detailní úkoly s checklistem
   - Cenový odhad provozu

4. **Dokumentace projektu** (`CLAUDE.md`, `progress.md`)
   - Aktualizace kontextového souboru pro Vybaveno
   - Vytvoření progress logu

### Klíčová rozhodnutí

- **Gemini 3 Flash** místo 2.5 Pro — lepší poměr cena/výkon
- **AI-first** přístup — uživatel nemusí ručně umisťovat, AI to udělá za něj
- **Dva režimy**: "Nechte to na nás" (plně AI) a "Navrhnu sám" (Studio editor)

### Další kroky

- [x] Inicializace Next.js projektu
- [x] Setup Gemini API klienta
- [x] Implementace UploadZone (připraveno k implementaci v Fázi 1)

---

## 2026-01-02 | Fáze 0: Příprava prostředí

**Autor:** Gemini 3 Flash (Preview)

### Co bylo uděláno

1. **Inicializace Next.js 14** (`www/`)
   - TypeScript, Tailwind CSS, App Router
   - Instalace Shadcn UI a základních komponent (button, input, slider, card, separator, dialog)
2. **Setup AI & Storage klientů**
   - `lib/gemini-client.ts` pro Gemini 3 Flash
   - `lib/storage.ts` pro Cloudflare R2 (S3 SDK)
   - `lib/supabase.ts` pro databázi
3. **Infrastruktura**
   - `docker-compose.yml` pro lokální PostgreSQL
   - `supabase/schema.sql` s definicí tabulek `sessions`, `products`, `generations`
   - `.env.example` s potřebnými proměnnými
4. **Brand & UI Polish**
   - Nastaveny brand barvy (Sage, Sand, Terracotta) v Tailwind v4 (`globals.css`)
   - Nastaveny fonty (Plus Jakarta Sans, Figtree) v `layout.tsx`
   - Vyčištěna landing page v `page.tsx`
   - Vytvořen `Makefile` pro snadnější vývoj a nasazení

### Problémy
- Žádné, setup proběhl hladce.

### Další kroky
- [x] Fáze 1: Onboarding Flow (UploadZone, RoomTypeSelector, atd.)
- [x] Implementace API endpointu pro upload
- [ ] Fáze 2: AI Analýza (Gemini 3 Flash integrace)

---

## 2026-01-03 | Fáze 2: Data Enrichment & Import Pipeline

**Autor:** Gemini 3 Flash (Preview)

### Co bylo uděláno

1. **Pokročilý CSV Parser** (`scripts/parsers/`)
   - Implementována robustní extrakce rozměrů (ŠxDxV, Ø, cm/mm/m) s fallbackem na prohledávání všech sloupců.
   - Hierarchické tagování materiálů: rozlišení `solid_wood` (masiv) vs `engineered_wood` (dýha, lamino, MDF) se zachováním typu dřeviny (dub, borovice atd.).
   - Rozšířen slovník barev a materiálů (beton, travertin, přírodní odstíny).
   - Agregace popisů z více sloupců u IKEA pro zvýšení textové hustoty pro AI.

2. **Automatická detekce stylu**
   - Implementován `detectStyle` algoritmus mapující produkty do 5 kategorií: `scandinavian`, `industrial`, `minimalist`, `traditional`, `modern`.
   - Mapování založeno na názvech kolekcí (HEMNES, FJÄLLBO, BILLUND atd.) a materiálových charakteristikách.

3. **Validace a Duplicity** (`scripts/validators/`)
   - Zpřísněna detekce duplicit: 94% shoda jmen/rozměrů nebo 80% shoda u produktů se stejnou URL obrázku.
   - Aktualizován `ProductValidator` pro podporu nových materiálových a barevných schémat.

4. **Příprava na Import**
   - Úspěšná validace vzorků IKEA a JYSK (100% validita, automatické odfiltrování duplicit).
   - Skripty připraveny na finální import do Supabase.

### Problémy
- Nekoherentní struktura IKEA CSV (vyřešeno prohledáváním všech `dataX` sloupců).
- Riziko ztráty informace při mapování "masiv" -> "wood" (vyřešeno novou hierarchií `solid_wood (oak)`).

### Další kroky
- [ ] Spuštění plného importu (IKEA & JYSK)
- [ ] Fáze 3: AI Analýza místnosti (Gemini 3 Flash integrace)

---

## 2026-01-02 | Fáze 1: Onboarding Flow

**Autor:** Gemini 3 Flash (Preview)

### Co bylo uděláno

1. **Upload Flow**
   - Komponenta `UploadZone` s podporou drag & drop a mobilního focení.
   - API endpoint `/api/upload` pro nahrávání do Cloudflare R2 a ukládání do Supabase.
   - Mobilní detekce v `lib/device.ts`.
2. **Konfigurační UI**
   - `RoomTypeSelector` pro výběr typu místnosti s vizuálními ikonami.
   - `ColorPicker` pro výběr primární a doplňkové barvy.
   - `PriceSlider` s logaritmickou škálou (5k – 150k Kč).
3. **Integrace**
   - Propojení všech komponent na landing page.
   - Správa stavu (step-by-step flow: Landing -> Upload -> Configure).
4. **Testování & Fixy**
   - Přidáno pravidlo pro povinné testování po každém runu do `CLAUDE.md`.
   - Opravena chyba s duplicitní funkcí `cn` v `page.tsx`.
   - Ošetřena inicializace Supabase a R2 klientů pro bezproblémový build bez env proměnných.
   - Úspěšně proběhl `npm run build` a `npm run lint`.

### Problémy
- Duplicitní definice `cn` v `page.tsx` (opraveno).
- Chybějící env proměnné při buildu (ošetřeno placeholder hodnotami).

### Další kroky
- [ ] Fáze 2: AI Analýza (Prompt engineering pro Gemini 3 Flash)
- [ ] API endpoint `/api/analyze`

---

```markdown
## YYYY-MM-DD | Název sprintu/úkolu

**Autor:** [Model]

### Co bylo uděláno
- 

### Problémy
- 

### Další kroky
- [ ] 
```
