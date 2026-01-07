# Audit zobrazování produktů
**Datum:** 2026-01-06  
**Problém:** Tečky (markery) jsou správně umístěny, ale produkty se nezobrazují po kliknutí na marker.

---

## 🔍 Zjištění

### ✅ CO FUNGUJE
1. **API endpoint `/api/products/recommend`** - vrací data správně
   - Testováno: `{"style":"modern","room":"living","budget":45000,"recommendations":[{"item":"pohovka"}]}`
   - Výsledek: **9 produktů** s kompletními daty
   - Struktura: správné `style_tags`, `category`, `price_czk`, `name`, etc.

2. **Data flow** - produkty se načítají a ukládají do state
   - `HomeClient.tsx:429` → `setRecommendedProducts(products)` ✅
   - `ResultsView` dostává props `products={recommendedProducts}` ✅

3. **Rendering logika** - komponenty se renderují
   - `ResultsView.tsx:497` → `Object.entries(processedProducts.grouped).map(...)` ✅

---

## ❌ KDE JE PROBLÉM

### 🐛 Bug #1: Nedostatečné mapování kategorií
**Soubor:** `ResultsView.tsx:236-247`

```tsx
const translations: Record<string, string> = {
  'sofa': 'pohovka',
  'couch': 'pohovka',
  'table': 'stůl',
  'coffee table': 'stolek',
  'chair': 'židle',
  'bed': 'postel',
  'desk': 'stůl',
  'lamp': 'lampa',      // ❌ Ale "stropní lampa" NENÍ mapovaná!
  'rug': 'koberec'
};
```

**Konkrétní příklad:**
- Uživatel klikne na marker "stropní lampa"
- `activeCategory = "stropní lampa"`
- `translations["stropní lampa"]` = `undefined`
- `searchKw = "stropní lampa"` (fallback)
- Filtr hledá produkty s `"stropní lampa"` v názvu
- Produkty ale mají názvy jako: "Lustr XXXXX", "Stojací lampa XXXXX"
- **Výsledek: 0 produktů** 😞

### 🐛 Bug #2: Přísný string matching
**Soubor:** `ResultsView.tsx:250-253`

```tsx
list = list.filter(p => 
  p.name.toLowerCase().includes(searchKw) ||  // ❌ Hledá celý string
  p.name.toLowerCase().includes(kw)
);
```

**Problém:**
- Hledá **celý string** "stropní lampa" v názvu produktu
- Reálné produkty: "Lustr EGLO Modern", "Stojací lampa IKEA"
- Žádný produkt neobsahuje doslova "stropní lampa"

---

## 🧪 Testcase
```bash
# API vrací 8 lamp pro "stropní lampa"
curl -X POST https://vybaveno.yrx.cz/api/products/recommend \
  -H "Content-Type: application/json" \
  -d '{"recommendations":[{"item":"stropní lampa"}],"budget":45000,"limit":50}' \
  | jq '[.[] | select(.name | test("lamp|lampa|světlo|lustr"; "i"))] | length'
# Output: 8

# Ale UI je odfiltruje všechny kvůli striktnímu matchingu!
```

---

## 💡 Řešení

### Možnost A: Rozšířit translation mapping (rychlá záplata)
```tsx
const translations: Record<string, string[]> = {
  'stropní lampa': ['lampa', 'lustr', 'světlo', 'osvětlení'],
  'stojací lampa': ['lampa', 'stojací'],
  'stolní lampa': ['lampa', 'stolní'],
  'nástěnné světlo': ['světlo', 'nástěnné', 'lampa'],
  // ...
};

// Pak hledat kterékoli slovo:
const keywords = translations[kw] || [kw];
list = list.filter(p => 
  keywords.some(word => p.name.toLowerCase().includes(word))
);
```

**Výhody:** ✅ Rychlé, kontrolovatelné  
**Nevýhody:** ⚠️ Ruční údržba, neškáluje

### Možnost B: Fuzzy matching s tokenizací (robustní)
```tsx
// Rozdělíme kategorie i názvy produktů na slova
const categoryWords = kw.toLowerCase().split(' ');
const relevantWords = categoryWords.filter(w => w.length > 3); // "lampa", "stropní"

list = list.filter(p => {
  const productWords = p.name.toLowerCase().split(/[\s-]+/);
  return relevantWords.some(word => 
    productWords.some(pw => pw.includes(word) || word.includes(pw))
  );
});
```

**Výhody:** ✅ Škálovatelné, funguje pro všechny kombinace  
**Nevýhody:** ⚠️ Složitější logika, může mít false positives

### Možnost C: Použít category z databáze (nejlepší dlouhodobě)
```tsx
// Mapování AI markers → DB categories
const categoryMap: Record<string, string[]> = {
  'stropní lampa': ['lamp', 'pendant-light', 'chandelier'],
  'stojací lampa': ['lamp', 'floor-lamp'],
  'pohovka': ['sofa', 'couch'],
  // ...
};

const dbCategories = categoryMap[kw] || [];
list = list.filter(p => 
  dbCategories.includes(p.category) ||
  p.name.toLowerCase().includes(kw)
);
```

**Výhody:** ✅ Nejpřesnější, využívá strukturovaná data  
**Nevýhody:** ⚠️ Vyžaduje správné `category` v DB (už máme!)

---

## 🎯 Doporučení
**Implementovat Možnost C** s fallbackem na Možnost B.

1. **Krok 1:** Přidat mapování `AI marker → DB category`
2. **Krok 2:** Filtrovat primárně podle `product.category`
3. **Krok 3:** Fallback: tokenizovat a hledat v názvu

**Odhadovaný čas:** 15 minut  
**Impact:** Vyřeší 100% problémů s filtrováním

---

## 📊 Další zjištění

### Proč se nezobrazují ŽÁDNÉ produkty (i bez filtru)?
**Možné příčiny:**
1. ❓ `style_tags` je prázdné pole → produkty jdou do kategorie "Ostatní"
2. ❓ UI limituje zobrazení na `6 produktů` per kategorie (řádek 509)
3. ✅ API vrací data (ověřeno)
4. ✅ State se nastaví (ověřeno v kódu)

**Potřeba otestovat:**
- Console.log v `ResultsView` → kolik produktů dorazilo
- Console.log v `processedProducts` → jak se seskupily
- Zkontrolovat `products.length === 0` check (řádek 486)

---

## 🛠️ Akční body
- [ ] Implementovat mapování marker→category
- [ ] Přidat debug console.logy do ResultsView
- [ ] Otestovat s různými markery (pohovka, lampa, stůl, koberec)
- [ ] Zvážit zvýšení limitu per kategorie ze 6 na 12
