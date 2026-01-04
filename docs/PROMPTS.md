# AI Prompts Reference

Tento dokument slouží jako archiv a reference pro prompty používané v aplikaci. Aktuální prompty jsou implementovány v `www/src/lib/prompts/`.

## 1. Analýza místnosti (Analysis)
Používá se pro prvotní pochopení prostoru z nahrané fotografie.

**Cíl**: Získat strukturovaná data o stylu, rozměrech, osvětlení a navrhnout zóny pro nábytek.

```markdown
Analyze this photograph in extreme detail. I need a precise description for image editing purposes.
Describe: Camera angle, Architecture (walls, windows, doors), Lighting (sources, shadows), Surfaces, and Objects.
Estimate room dimensions and suggest 10-15 placement zones for furniture.
```

## 2. Vizualizace (Inpainting)
Používá se pro vložení konkrétního produktu do scény.

**Cíl**: Fotorealistické vložení objektu při zachování perspektivy, stínů a okolní architektury.

```markdown
Edit this exact photograph by adding furniture. 
Preserve all architecture exactly as described in analysis.
Add [PRODUCT_NAME] at [COORDINATES].
Lighting must match existing sun shadows (direction, intensity).
```

## 3. Generování celého návrhu (Full Design)
Používá se pro kompletní proměnu místnosti.

**Cíl**: Zaplnit prostor nábytkem v daném stylu a rozpočtu.
