# AI Backend Strategy (Python & google-genai)

Tento dokument popisuje strategii přechodu na dedikovaný AI backend postavený na Pythonu a novém SDK `google-genai`.

## 🎯 Cíle
- **Precizní Inpainting:** Využití Python knihoven (Pillow, OpenCV) pro lepší vkládání nábytku do fotek.
- **Batch Processing:** Hromadné obohacování produktových dat (Product Enrichment) pomocí Gemini.
- **Škálovatelnost:** Příprava na přechod k Vertex AI.
- **Separace zájmů:** Next.js pro UI, Python pro těžké AI výpočty.

## 🛠️ Technický Stack
- **Jazyk:** Python 3.12+
- **SDK:** `google-genai` (nejnovější unifikované SDK od Googlu)
- **Framework:** FastAPI (pro budoucí API endpointy)
- **Zpracování obrazu:** Pillow, OpenCV

## 📋 Plán implementace

### Fáze 1: Inicializace (Právě teď)
- [ ] Vytvoření `backend/requirements.txt`.
- [ ] Nastavení virtuálního prostředí.
- [ ] Vytvoření Proof of Concept (PoC) skriptu pro analýzu pokoje v Pythonu.

### Fáze 2: Product Enrichment
- [ ] Skript pro automatické doplňování stylů a barev k produktům v databázi.
- [ ] Validace dat pomocí Gemini 3 Flash.

### Fáze 3: Pokročilý Inpainting
- [ ] Implementace logiky pro vkládání objektů s respektováním perspektivy a stínů.
- [ ] Generování masek pomocí Gemini.

### Fáze 4: API Integrace
- [ ] Vytvoření FastAPI služby.
- [ ] Propojení Next.js s Python backendem přes interní API.

---
*Poslední aktualizace: 2026-01-04*
