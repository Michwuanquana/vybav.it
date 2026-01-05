# Vybaveno.cz - Testovací Protokol

**Status:** MANDATORY před každým deploymentem

## 📋 Pre-deployment Checklist

### Build & Deployment
- [ ] `make deploy-dev` bez chyb
- [ ] TypeScript kompilace OK
- [ ] Docker běží
- [ ] Health check: 200 OK

### Kritické Funkce
- [ ] Upload obrázku
- [ ] AI analýza
- [ ] Zobrazení markerů
- [ ] Produkty
- [ ] Feedback

## 🧪 Testovací Scénáře

### 1. Upload & Analýza

#### Test 1.1: Lokální Upload
1. Otevři https://vybaveno.yrx.cz/cs
2. Nahraj JPEG
3. Zkontroluj: markery, produkty, analýza, feedback tlačítka

#### Test 1.2: Demo Flow
1. "Demo fotka"
2. Auto-retry při chybě (max 3×)

#### Test 1.3: Prázdná Místnost
1. Nahraj prázdnou místnost
2. `furnishing_level.percentage` < 30
3. První doporučení: velký nábytek

#### Test 1.4: Plná Místnost
1. Nahraj plně vybavenou
2. `furnishing_level.percentage` > 70
3. První doporučení: doplňky

### 2. Jazyková Konzistence

#### Test 2.1: Čeština
- `item`: "pohovka" (česky)
- `architecture`: česky
- `search_query`: česky

#### Test 2.2: Angličtina (/en)
- `item`: "sofa" (anglicky)
- `architecture`: anglicky
- `search_query`: ČESKY (pro DB)

### 3. Produkty

#### Test 3.1: Relevance
- První produkt odpovídá doporučení
- Styl odpovídá

#### Test 3.2: Fallback
- Rozpočet 500 Kč
- Stále zobrazit něco

### 4. Tooltips

#### Test 4.1: Levá strana (x < 55%)
- Tooltip vpravo

#### Test 4.2: Pravá strana (x > 55%)
- Tooltip vlevo

### 5. Feedback

#### Test 5.1: Thumbs Up
- POST /api/feedback
- Response 200
- UI: "Děkujeme"

#### Test 5.2: Thumbs Down + komentář
- Dialog se otevře
- Komentář se uloží

#### Test 5.3: Thumbs Down bez komentáře
- Stále funguje

### 6. Edge Cases

#### Test 6.1: Špatný formát
- PDF → error

#### Test 6.2: AI selhání
- Graceful error

#### Test 6.3: no_points_reason
- Fotka "ne-místnosti"
- Amber warning

### 7. Performance

#### Test 7.1: Rychlost
- Upload < 2s
- Analýza < 10s
- Produkty < 2s

#### Test 7.2: Mobile
- 375px šířka
- Všechno klikatelné

## 🚨 Post-deploy Smoke Test

```bash
curl -s -o /dev/null -w "%{http_code}" "https://vybaveno.yrx.cz/cs"
# Expected: 200
```

## ✅ Sign-off Template

```
- [ ] Všechny testy PROŠLY
- [ ] TypeScript OK
- [ ] Smoke test 200
- [ ] Mobile OK
- [ ] Performance < 15s

Podpis: _____ Datum: _____
```
