# Audit: Upload & Analysis Flow

**Datum:** 4. ledna 2026
**Cíl:** Ověřit funkčnost "Modern Concierge" flow: Upload -> Okamžité zobrazení fotky -> Loader dole -> Zobrazení bodů (markers).

## 1. Analýza kódu

### 1.1 HomeClient.tsx (Upload Handler)
- **Funkce `handleUpload`:**
  - Nastavuje `setIsUploading(true)`.
  - Volá `/api/upload`.
  - Po úspěšném uploadu volá `await handleAnalyze(data.sessionId)`.
  - Teprve v `finally` bloku nastavuje `setIsUploading(false)`.
- **Důsledek:** Proměnná `isUploading` zůstává `true` po celou dobu nahrávání I analýzy (cca 20-30 sekund).

### 1.2 Rendering & AnalysisSpinner
- **Overlay Spinner:** Zobrazuje se, když je `isUploading === true`. Má `z-index: 60` a plné pozadí (`bg-sand/90`).
- **Bottom Spinner:** Zobrazuje se, když je `isSaving === true` (což je stav během analýzy). Má `z-index: 50`.
- **Konflikt:** Protože `isUploading` je `true` i během analýzy, **Overlay Spinner překrývá celou obrazovku**, včetně nahrané fotky a Bottom Spinneru. Uživatel tak nevidí "Modern Concierge" flow, ale jen dlouho trvající nahrávací obrazovku.

### 1.3 Zobrazení bodů (Markers)
- Podmínka pro zobrazení: `analysisResult && !isGenerating && !isUploading`.
- Protože `isUploading` je `true` až do konce, body se nemohou zobrazit dříve.
- Pokud analýza selže nebo nevrátí data, body se nezobrazí vůbec.

## 2. Zjištěné nedostatky

1.  **Blokující Overlay:** Celá myšlenka "okamžitého zobrazení fotky" je negována tím, že `isUploading` zůstává aktivní během analýzy.
2.  **Neviditelný Bottom Loader:** Je technicky vyrenderován, ale skryt pod overlayem.
3.  **Matoucí UX:** Uživatel vidí "Připravujeme prostor..." (text pro upload) místo "Studujeme architekturu..." (text pro analýzu).

## 3. Doporučení a Oprava

1.  **Upravit `handleUpload` v `HomeClient.tsx`:**
    - Nastavit `setIsUploading(false)` **okamžitě** po úspěšném nahrání obrázku a získání URL.
    - Teprve poté spustit `handleAnalyze`.
2.  **Ověřit stavy:**
    - Upload (cca 1-2s): Zobrazí se Overlay Spinner.
    - Analýza (cca 15-20s): Overlay zmizí, zobrazí se fotka a Bottom Spinner (`isSaving`).
    - Hotovo: Bottom Spinner zmizí, zobrazí se body (`analysisResult`).

## 4. Implementace a Oprava (Provedeno)

### 4.1 Oprava v `HomeClient.tsx`
Byla provedena úprava funkce `handleUpload`.
**Původní stav:**
```typescript
// ... upload logic ...
await handleAnalyze(data.sessionId); // isUploading stále true
// ...
finally { setIsUploading(false); }
```

**Nový stav:**
```typescript
// ... upload logic ...
setIsUploading(false); // Okamžité ukončení upload fáze -> Overlay zmizí
await handleAnalyze(data.sessionId); // Spuštění analýzy -> Bottom Spinner se objeví
```

### 4.2 Oprava v `AnalysisSpinner.tsx`
Sjednoceny klíče pro lokalizaci fází analýzy.
- Původně: `dict.analysis.phase_1` (neodpovídalo slovníku)
- Nově: `dict.analysis.phase1` (odpovídá `cs.json`)

## 5. Závěr
Audit potvrdil, že "Modern Concierge" flow bylo technicky implementováno, ale vizuálně blokováno překryvnou vrstvou nahrávání. Po provedených úpravách by měl uživatel vidět:
1. Krátký overlay při nahrávání fotky.
2. Okamžité zobrazení nahrané fotky.
3. Spodní lištu (Bottom Spinner) indikující průběh analýzy ("Studujeme architekturu...").
4. Po dokončení analýzy zobrazení interaktivních bodů (markers).
