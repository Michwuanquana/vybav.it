# Gemini 3 Flash - Specifikace

## Přehled

**Gemini 3 Flash** je nejnovější model od Googlu z rodiny Gemini 3, navržený jako rychlý a cenově efektivní model s frontier intelligence. Kombinuje výkon úrovně Gemini 3 Pro s rychlostí a nižší cenou řady Flash.

**Model ID**: `gemini-3-flash-preview`

**Datum vydání**: Prosinec 2024

**Knowledge cutoff**: Leden 2025

## Klíčové vlastnosti

- **Frontier reasoning**: State-of-the-art výkon v komplexním uvažování
- **Multimodální schopnosti**: Pokročilé vizuální a prostorové vnímání
- **Agentic workflows**: Optimalizováno pro agentní úlohy a coding assistants
- **Rychlost**: 3x rychlejší než Gemini 2.5 Pro při stejné nebo lepší kvalitě
- **Efektivita**: Používá průměrně o 30% méně output tokenů než 2.5 Pro

## Technické parametry

### Context Window

- **Maximum input tokens**: 1,048,576 (1M)
- **Maximum output tokens**: 65,536

### Podporované formáty

**Vstup**:
- Text
- Obrázky (PNG, JPEG, WEBP, GIF)
- Video
- Audio
- PDF dokumenty

**Výstup**:
- Text

### Media Resolution

Kontrola rozlišení pro multimodální vstupy pomocí parametru `media_resolution`:
- `low` - nízké rozlišení
- `medium` - střední rozlišení
- `high` - vysoké rozlišení
- `ultra high` - ultra vysoké rozlišení (pouze IMAGE modalita)

## Thinking Levels

Gemini 3 Flash zavádí nový parametr `thinking_level` pro kontrolu množství interního uvažování:

- **minimal** - minimální latence, nejnižší náklady
- **low** - nízká úroveň uvažování
- **medium** - střední úroveň uvažování
- **high** - nejvyšší úroveň uvažování, nejlepší výsledky

Nahrazuje starší `thinking_budget` z Gemini 2.5.

## Ceny (Gemini API & Vertex AI)

| Typ | Cena |
|-----|------|
| Input tokens (text) | $0.50 / 1M tokenů |
| Output tokens | $3.00 / 1M tokenů |
| Input tokens (audio) | $1.00 / 1M tokenů |

### Úspory nákladů

- **Context caching**: Až 90% úspora při opakovaném použití tokenů
- **Batch API**: 50% úspora pro asynchronní zpracování
- **Vyšší rate limity** pro Paid API zákazníky

### Porovnání s předchůdci

- **4x levnější** než Gemini 3 Pro (≤200k tokens)
- **8x levnější** než Gemini 3 Pro (>200k tokens)
- Mírně dražší než Gemini 2.5 Flash ($0.30/$2.50 vs $0.50/$3.00)
- Kompenzováno efektivnějším využitím tokenů

## Benchmark výsledky

### Reasoning benchmarks

- **GPQA Diamond**: 90.4%
- **Humanity's Last Exam**: 33.7% (bez nástrojů)
- **SWE-bench Verified**: 78% (agentic coding)

### Srovnání s konkurencí

Model překonává Gemini 2.5 Pro na většině benchmarků, přičemž je 3x rychlejší a výrazně levnější.

**LMArena Elo Score**: Vyšší než Gemini 2.5 Pro

## Speciální funkce

### Code Execution

Gemini 3 Flash podporuje code execution pro:
- Zoomování vizuálních vstupů
- Počítání objektů v obrázcích
- Editaci vizuálních dat

### Tool Use

- Vylepšená práce s nástroji a function calling
- Spolehlivé zpracování až 100 function calls současně
- Strictnější validace thought signatures pro multi-turn function calling

### Context Caching

Automatická podpora context caching s výraznými úsporami při opakovaném použití stejného kontextu.

### Batch API

Dostupná pro asynchronní zpracování s 50% slevou a vyššími rate limity.

## Dostupnost

### Pro vývojáře

- **Gemini API** via Google AI Studio
- **Vertex AI** (enterprise)
- **Google Antigravity** (nová agentic platforma)
- **Gemini CLI**
- **Android Studio**

### Pro uživatele

- **Gemini app** (mobilní i webová)
- **AI Mode v Google Search**

### Integrace

Model je dostupný také v:
- Cursor IDE
- GitHub Copilot
- Figma Make
- Workday
- Debug Mode v Cursor

## Použití

### Typické use cases

- **Agentic workflows**: Autonomní agenti, multi-step úlohy
- **Coding assistance**: Generování, debugging, refactoring kódu
- **Multimodální analýza**: Zpracování videí, obrázků, dokumentů v reálném čase
- **Document analysis**: Analýza PDF, zpracování velkých dokumentů
- **Gaming**: Real-time strategické vedení s vizuálním vstupem
- **Deepfake detection**: Pokročilá vizuální analýza
- **Load testing**: Generování test scriptů pro zátěžové testy
- **Pull request reviews**: Zpracování velkých PR s tisíci komentáři

### Výhody pro vývojáře

- Nejlepší model pro agentic coding workflows
- Vysoká přesnost při řešení software engineering problémů
- Rychlá iterace a A/B testování díky nízké latenci
- Spolehlivé generování kódu s minimálními halucinacemi

## Příklady výkonu

### Coding

- 35% vyšší přesnost než Gemini 2.5 Pro v GitHub Copilot (VS Code)
- 10% baseline zlepšení na agentic coding úlohách
- Schopnost zpracovat 1000 komentářů v PR a najít jediný relevantní požadavek

### Multimodální zpracování

- Real-time analýza video + hand-tracking vstupů
- Geometrické výpočty a odhad rychlosti pro interaktivní hry
- Současná práce s 100 ingrediencemi a 100 nástroji

## Srovnání s Gemini 3 Pro

| Vlastnost | Gemini 3 Flash | Gemini 3 Pro |
|-----------|----------------|--------------|
| Cena (input) | $0.50/1M | $2.00/1M (≤200k) |
| Rychlost | 3x rychlejší | Baseline |
| Use case | Agentic, high-frequency | Komplexní reasoning |
| Token efektivita | 30% méně output tokenů | Baseline |

## Poznámky

- Model je aktuálně v preview verzi
- Není kompatibilní s některými legacy parametry (např. `thinking_budget`)
- PDF token counts jsou počítány pod IMAGE modalitou místo DOCUMENT
- Thinking signatures vyžadují správné zpracování i při minimální thinking level

## Odkazy

- **Dokumentace**: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/3-flash
- **Blog announcement**: https://blog.google/products/gemini/gemini-3-flash/
- **Developer guide**: https://blog.google/technology/developers/build-with-gemini-3-flash/
- **DeepMind**: https://deepmind.google/models/gemini/flash/

---

*Poslední aktualizace: Prosinec 2025*