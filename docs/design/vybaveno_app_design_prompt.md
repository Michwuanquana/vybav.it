# Prompt na design mobilní aplikace Vybaveno

Design mobilní aplikace pro službu "vybaveno" - Czech home interior concierge service pro mladé rodiče.

---

## PŘEHLED PROJEKTU

**Co je Vybaveno:**
- Služba typu "Do-It-For-Me" (DIFM) pro zařizování dětských pokojů
- Uživatel nahraje fotku místnosti → dostane návrh designu + nákupní seznam + montáž
- Koncept "Modern Concierge" - transformace chaosu v klid
- Cílová skupina: Česká rodiče s malými dětmi, časově vytížení, hledají jednoduchá řešení

---

## USER FLOW (hlavní cesta aplikací)

```
1. ONBOARDING
   ↓
2. UPLOAD FOTKY POKOJE
   ↓
3. SPECIFIKACE (rozpočet, styl, požadavky)
   ↓
4. ČEKÁNÍ NA NÁVRH (AI/Concierge zpracovává)
   ↓
5. PREVIEW NÁVRHU (2D vizualizace - overlay PNG)
   ↓
6. NÁKUPNÍ SEZNAM (produkty s cenami a odkazy)
   ↓
7. OBJEDNÁVKA (volitelně + montáž)
   ↓
8. STATUS TRACKOVÁNÍ
```

---

## KLÍČOVÉ OBRAZOVKY (mockupy k navržení)

### 1. **Landing / Onboarding**
- **Účel:** První dojem, vysvětlit co Vybaveno dělá
- **Obsah:**
  - Hero heading: "Zařídíme vám pokojíček. Vy budete mít klid."
  - Podtitulek: "Vyfotíte pokoj → My navrhněte design → Zařídíme dopravu i montáž"
  - 3 benefit bubbles:
    - 🏠 "Design na míru" (ikona domu)
    - ⏱️ "Hotovo za 48 hodin" (ikona hodin)
    - 🔧 "Včetně montáže" (ikona klíče/nářadí)
  - CTA tlačítko: "Začít projekt" (Terracotta barva)
  - Před/po ukázka (before/after slider) v pozadí

### 2. **Upload Screen**
- **Účel:** Nahrát fotku místnosti
- **Obsah:**
  - Velká upload zone (drag & drop area):
    - Placeholder ikona (fotoaparát nebo dům)
    - Text: "Vyfotíte místnost z rohu / ze dveří"
  - Tipy pod upload area (malý text):
    - "✓ Foťte při denním světle"
    - "✓ Zachyťte celou místnost včetně oken"
    - "✓ Nevadí nepořádek - řešíme to!"
  - Tlačítko: "Nahrát fotku" (Terracotta)
  - Progress bar: krok 1/3

### 3. **Specifikace / Preferences**
- **Účel:** Zadat rozpočet, styl, speciální požadavky
- **Obsah:**
  - **Rozpočet** (segmented control nebo slider):
    - "Do 15 000 Kč" | "Do 30 000 Kč" | "Do 50 000 Kč" | "Flexibilní"
  - **Styl** (image picker - karty s obrázky):
    - Scandi (světlé dřevo, bílá)
    - Barevný (pastely, hravý)
    - Industrial (šedá, kov)
    - Montessori (nízko, přírodní)
  - **Typ místnosti** (dropdown):
    - Dětský pokoj (0-3 roky)
    - Dětský pokoj (4-10 let)
    - Společný prostor (obývák)
  - **Checkboxy:**
    - [ ] "Chci montáž na klíč"
    - [ ] "Chci i malování stěn"
  - Textové pole: "Něco důležitého?" (placeholder: "Např. Postel nesmí zakrývat okno")
  - CTA: "Vytvořit návrh" (Terracotta)
  - Progress bar: krok 2/3

### 4. **Processing / Waiting Screen**
- **Účel:** Uklidnit uživatele během čekání na zpracování
- **Obsah:**
  - Animace (lottie nebo gif): Domeček se skládá / checklist items se odškrtávají
  - Headline: "Analyzujeme váš prostor..."
  - Subheadings (fade-in sequence s Success Green checkmarky):
    - ✓ "Měříme rozměry" (checkmark #6B9B7C)
    - ✓ "Vybíráme nábytek" (checkmark #6B9B7C)
    - ✓ "Počítáme rozpočet" (checkmark #6B9B7C)
  - Odhad času: "Obvykle hotovo za 24-48 hodin. Pošleme vám notifikaci."
  - Humor (optional): "Mezitím můžete dát děti spát 😉"

### 5. **Design Preview** (👑 Nejdůležitější obrazovka)
- **Účel:** Ukázat vizualizaci (2D overlay) výsledného pokoje
- **Obsah:**
  - **Velký obrázek** (fullscreen / Bento grid karta):
    - Původní fotka + overlay PNG s nábytkem
    - Pinch-to-zoom funkce
  - **Slider Before/After** (optional):
    - Posuvník pro porovnání původního stavu vs. návrhu
  - **Popis** (pod obrázkem):
    - "Váš pokoj v stylu Scandi. Rozpočet: 28 450 Kč"
  - **CTA tlačítka**:
    - Primární: "Zobrazit produkty" (Terracotta)
    - Sekundární: "Změnit rozpočet" / "Upravit styl" (outline button)
  - Badge/tag: "Skladem - dodání 5-7 dní"

### 6. **Product List / Shopping Cart**
- **Účel:** Zobrazit seznam produktů z návrhu s cenami
- **Obsah:**
  - **Bento Grid Layout** - karty produktů:
    - Obrázek produktu
    - Název: "Postel SUNDVIK (IKEA)"
    - Cena: "4 990 Kč"
    - Rozměry: "60x120 cm"
    - Barva/materiál: "Bílá, masiv"
    - CTA: "Detail" (link na e-shop)
  - **Sticky footer:**
    - "Celkem: 28 450 Kč"
    - "Montáž: +3 500 Kč" (checkbox)
    - CTA: "Objednat vše" (Terracotta, full-width)
  - Toggle: "Zobrazit alternativy" (levnější/dražší produkty)

### 7. **Checkout / Order Form**
- **Účel:** Shromáždit údaje pro objednávku a montáž
- **Obsah:**
  - **Dodací údaje:**
    - Jméno, Telefon, E-mail
    - Adresa (autofill)
  - **Termín montáže** (date picker):
    - Kalendář s dostupnými termíny
    - Radio buttons: Dopoledne / Odpoledne
  - **Platba:**
    - Radio: "Při převzetí (hotově/kartou)" | "Bankovní převod"
  - **Souhrn objednávky:**
    - Produkty: 28 450 Kč
    - Montáž: 3 500 Kč
    - Doprava: ZDARMA
    - **CELKEM: 31 950 Kč**
  - CTA: "Potvrdit objednávku" (Terracotta)
  - Drobný text: "Zašleme vám potvrzení e-mailem. Platba při převzetí."

### 8. **Order Tracking / Status**
- **Účel:** Trackovat stav objednávky po odeslání
- **Obsah:**
  - **Progress stepper:**
    - ✅ Objednávka přijata (2.1.2026) — Success Green
    - 🚚 Zboží se připravuje (odhadovaně 5.1.) — Muted Blue
    - 📦 Odesláno (-) — šedá
    - 🏠 Dodáno (-) — šedá
    - 🔧 Montáž naplánována: 8.1. dopoledne — Terracotta
  - **Kontakt na montážníka** (zobrazí se 24h před montáží):
    - Jméno: "Petr N."
    - Telefon: "+420 777 XXX XXX"
    - Tlačítko: "Zavolat"
  - **Helpdesk:**
    - "Potřebujete změnit termín?" → CTA: "Napište nám"

---

## DESIGN SPECIFIKACE

### **Barvy (Brand Palette)**
- **Sage Green** `#7C8F80` → Logo, hlavní prvky, headery karet (VELKÉ plochy pouze)
- **Dark Sage** `#5A6B5E` → Text/ikony v Sage tónu (lepší kontrast)
- **Warm Sand** `#F0E8D9` → Pozadí aplikace (místo bílé)
- **Terracotta** `#C87F69` → CTA tlačítka, akcenty, aktivní stavy
- **Deep Charcoal** `#2D2D2D` → Hlavní text, ikony
- **Success Green** `#6B9B7C` → Checkmarky, úspěšné akce, "Hotovo" stavy
- **Muted Blue** `#6B8E9B` → Info zprávy, statusy
- **Mustard** `#D8A658` → Hodnocení, tipy

### **Typografie**
- **Headlines:** Plus Jakarta Sans (Bold/SemiBold)
  - H1: 32px
  - H2: 24px
  - H3: 20px
- **Body:** Figtree (Regular)
  - Body text: 16px
  - Captions: 12-14px (Medium)
- **Všechny fonty s plnou podporou češtiny** (ř, š, ž, ů, ě, č, ť, ň)

### **UI Komponenty**

**Tlačítka:**
```css
/* Primární CTA */
background: #C87F69; /* Terracotta */
color: #FFFFFF;
border-radius: 12px;
padding: 16px 32px;
font: Plus Jakarta Sans SemiBold 16px;
box-shadow: 0 4px 12px rgba(200, 127, 105, 0.3);

/* Sekundární */
background: transparent;
border: 2px solid #7C8F80; /* Sage Green */
color: #7C8F80;
```

**Karty (Bento Grid):**
```css
background: #FFFFFF;
border-radius: 16px;
padding: 20px;
box-shadow: 0 2px 8px rgba(0,0,0,0.08);
gap: 16px; /* mezi kartami */

/* Header karty */
.card-header {
  background: #7C8F80; /* Sage Green - OK pro velkou plochu */
  color: #FFFFFF;
  font: Plus Jakarta Sans SemiBold 18px;
}

/* Text v kartě */
.card-body {
  color: #2D2D2D; /* Deep Charcoal - hlavní text */
}

/* Metadata/captions */
.card-caption {
  color: #5A6B5E; /* Dark Sage - doplňkový text */
  font: Figtree Regular 14px;
}
```

**Input fieldy:**
```css
background: #FFFFFF;
border: 1px solid #E0E0E0;
border-radius: 8px;
padding: 14px;
font: Figtree Regular 16px;
color: #2D2D2D;

/* Focus state */
border-color: #7C8F80;
```

**Ikony:**
- Styl: Outline (ne solid)
- Knihovna: Lucide Icons nebo Heroicons
- Barva: Deep Charcoal `#2D2D2D` (standardní)
- Barva akcent: Dark Sage `#5A6B5E` (doplňkové ikony)
- Barva success: Success Green `#6B9B7C` (checkmarky, potvrzení)
- Velikost: 24px (standardní), 32px (velké akce)

**Success states:**
```css
/* Checkmark po úspěšné akci */
.success-icon {
  color: #6B9B7C; /* Success Green */
  animation: scale-in 0.3s ease-out;
}

/* Úspěšná zpráva */
.success-message {
  background: rgba(107, 155, 124, 0.1);
  border-left: 4px solid #6B9B7C;
  color: #2D2D2D;
  padding: 12px 16px;
  border-radius: 8px;
}
```

### **Spacing & Layout**
- **Grid:** 8px base unit
- **Margins:**
  - Screen edges: 20px (mobile), 40px (tablet)
  - Between sections: 32px
  - Between cards: 16px
- **Responsive:**
  - Mobile-first (320px - 480px)
  - Tablet breakpoint: 768px
  - Desktop: 1024px+

### **Animace & Interactions**
- **Smooth transitions:** 200ms ease-in-out
- **Button hover:** scale(1.02) + shadow enhance
- **Card hover (desktop):** translateY(-2px)
- **Loading states:** Skeleton screens (ne spinnery)
- **Micro-interactions:**
  - Checkmarky se "zaškrtávají" s animací
  - Progress bar plynule roste
  - Upload button pulzuje při drag-over

---

## BRAND VOICE & COPY PŘÍKLADY

### Tone of Voice:
- Uklidňující, přímý, mírně neformální
- Hlas "zkušenějšího kamaráda" nebo architekta s nadhledem
- Aktivní slovesa: "Zařídíme", "Vyřešíme", "Přivezeme", "Smontujeme"

### Copy pravidla:
| ❌ Nepsat | ✅ Psát |
|-----------|---------|
| "Odeslat", "Submit" | "Zařiďte pokoj", "Začít projekt" |
| "MDF deska 18mm" | "Odolný stůl na dětské hry" |
| "Error 404" | "Něco se pokazilo, hned to opravíme" |
| "Spěchejte!" | "Hotovo", "Klid", "Vyřešeno" |

### Příklady real copy:
- **Empty state upload:** "Ještě nemáte žádný projekt. Začněte nahráním fotky pokoje."
- **Po nahrání fotky:** "Skvělé! Teď potřebujeme vědět, jak to máte rádi..."
- **Error při nahrávání:** "Fotka se nenahrála. Zkuste to prosím znovu, nebo nám napište."
- **Úspěšná objednávka:** "Hotovo! Potvrzení najdete v e-mailu. Teď se můžete vrátit ke kávě ☕"

---

## TECHNICKÉ POZNÁMKY

### Platforma:
- **Mobile App (PWA)** postavená na **Glide Apps**
- Funguje jako webová aplikace, ale vypadá jako nativní app
- Offline mode: Ne (vyžaduje internet pro upload)

### Obrazové formáty:
- Uživatelské fotky: JPEG (max 5MB, auto-resize na 1920px wide)
- Produktové obrázky: PNG s transparentním pozadím (pro overlay)
- Vizualizace výstup: PNG (high-res pro zoom)

### Accessibility:
- Kontrast textu: min. WCAG AA (4.5:1)
- Touch targets: min. 44x44px
- Font size: min. 16px (body), možnost zvětšit
- Alt texty u všech obrázků

---

## REFERENCE & MOOD

### Vizuální inspirace (pro designéra):
- **Aesthetic:** Organic Modern, Japandi, Bento UI
- **Apps:** Airbnb (čisté karty), Notion (minimalistické), Headspace (uklidňující barvy)
- **Avoid:** Chatbot UI, příliš "tech" vzhled, studené barvy

### Nálada (mood):
- Teplá, domácká, důvěryhodná
- Profesionální, ale ne korporátní
- Jednoduché, ale ne primitivní
- "High-end IKEA" feel

---

## DELIVERABLES (co chceme dostat)

1. **High-fidelity mockupy** všech 8 klíčových obrazovek (mobile portrait)
2. **Design system:** Component library (buttons, cards, inputs, icons)
3. **Interactive prototype** (Figma/Adobe XD) s klikatelným flow
4. **Desktop/tablet varianty** minimálně pro obrazovky 5 & 6 (preview a product list)
5. **Dark mode** (optional, ale welcome)

---

## PRIORITY FEATURES

**Must-have pro MVP:**
- ✅ Upload fotky (drag & drop)
- ✅ Specifikace (rozpočet, styl)
- ✅ Preview návrhu (2D overlay)
- ✅ Nákupní seznam produktů
- ✅ Objednávkový formulář

**Nice-to-have (future):**
- 🔮 Before/After slider
- 🔮 AR preview (umístit nábytek přes kameru)
- 🔮 Social share (sdílet návrh s partnerem)
- 🔮 Wishlist (uložit produkty)

---

**Cíl:** Ukázat klientce (rodičce), jak bude vypadat hotová služba - profesionálně, jednoduše, uklidňujícím dojmem. Design má působit jako "tohle funguje" a "tohle mi ušetří čas".
