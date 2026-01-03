# Vybaveno — Progress Log

Zápisy z každého vývojového runu. Nejnovější nahoře.

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
