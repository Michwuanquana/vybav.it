# Vybaveno — Brand Guidelines
**Verze 1.0 | Leden 2026**

---

## 1. Brand DNA

### Archetyp
**"The Modern Concierge"** — hybridní pozice mezi:
- **Opatrovník (Caregiver)**: empatie, bezpečí, péče
- **Kouzelník (Magician)**: transformace, "kouzlo" vizualizace

### Mise
Osvobodit rodiče od břemene zařizování domova a vrátit jim čas na rodinu.

### Hodnoty
| Hodnota | Projev |
|---------|--------|
| **Empatie** | Nesoudíme nepořádek na fotkách, řešíme ho |
| **Pragmatičnost** | Reálné produkty skladem, ne vzdušné zámky |
| **Transparentnost** | Jasná cena, žádné skryté poplatky |
| **Funkční estetika** | Design, který přežije batole |

### Positioning
```
"Dostupný kouzelník" — transformace jako architekt, 
jednoduchost jako mobilní appka. 
Nejsme e-shop, jsme služba.
```

---

## 2. Barvy

### Primární paleta

| Název | Hex | Použití |
|-------|-----|---------|
| **Sage Green** | `#7C8F80` | Logo, hlavní prvky, headery karet (VELKÉ plochy) |
| **Dark Sage** | `#5A6B5E` | Text/ikony kdy potřebujete Sage barvu (lepší kontrast) |
| **Warm Sand** | `#F0E8D9` | Pozadí aplikace (náhrada za bílou) |
| **Terracotta** | `#C87F69` | CTA tlačítka, akcenty, notifikace |
| **Deep Charcoal** | `#2D2D2D` | Text, ikony (ne čistá černá!) |
| **Success Green** | `#6B9B7C` | Úspěšné akce, checkmarky, potvrzení |

### Sekundární paleta

| Název | Hex | Použití |
|-------|-----|---------|
| **Muted Blue** | `#6B8E9B` | Info zprávy, statusy |
| **Mustard** | `#D8A658` | Hodnocení, tipy, hvězdičky |
| **Muted Grey** | `#4A4A4A` | Delší odstavce, metadata |

### Accessibility & Kontrast

**WCAG AA pravidla (4.5:1 pro normální text):**

| Kombinace | Kontrast | Status |
|-----------|----------|--------|
| Deep Charcoal na Warm Sand | 12.8:1 | ✅ Perfektní |
| Dark Sage na Warm Sand | 6.2:1 | ✅ Používat pro text |
| Sage Green na Warm Sand | 2.8:1 | ⚠️ JEN velké prvky |
| Terracotta na bílé | 3.9:1 | ⚠️ JEN tlačítka s boldem |
| Warm Sand na Deep Charcoal | 12.8:1 | ✅ Dark mode OK |

**Pravidla použití:**
- ❌ NIKDY Sage Green (#7C8F80) pro běžný text
- ✅ Sage jen: logo, headery karet, velké ikony 32px+
- ✅ Pro text v Sage barvě vždy Dark Sage (#5A6B5E)
- ✅ Všechen běžný text: Deep Charcoal (#2D2D2D)

### Dark Mode
- Pozadí: `#1A1A1A` (nikdy `#000000`)
- Text: `#F0E8D9` (Warm Sand)
- Sage Green → `#90A494` (zesvětlená o 15%)
- Dark Sage → `#7C8F80` (původní Sage)
- Terracotta beze změny: `#C87F69`

---

## 3. Typografie

### Font Stack
```css
/* Headlines */
font-family: 'Plus Jakarta Sans', sans-serif;

/* Body */
font-family: 'Figtree', sans-serif;
```

### Hierarchie

| Prvek | Font | Váha | Velikost |
|-------|------|------|----------|
| H1 | Plus Jakarta Sans | Bold | 32px |
| H2 | Plus Jakarta Sans | SemiBold | 24px |
| H3 | Plus Jakarta Sans | Medium | 20px |
| Body | Figtree | Regular | 16px |
| Popisky | Figtree | Medium | 12-14px |

### Pravidla
- ✅ Plná podpora češtiny (ř, š, ž, ů, ě, č, ť, ň)
- ✅ Google Fonts (optimalizace, licence)
- ❌ Nepsat VERZÁLKAMI (kromě zkratek)

---

## 4. Tone of Voice

### Charakter
Uklidňující, přímý, mírně neformální, s autoritou experta.
Hlas "zkušenějšího kamaráda" nebo architekta s nadhledem.

### Pravidla copywritingu

| ❌ Nepsat | ✅ Psát |
|-----------|---------|
| "Spěchejte", "Poslední šance" | "Hotovo", "Vyřešeno", "Klid" |
| "MDF deska 18mm" | "Odolný stůl na dětské hry" |
| "Odeslat" | "Zařiďte pokoj" |
| "Error" | "Něco se pokazilo, hned to opravíme" |

### Aktivní slovesa přebírající odpovědnost
`Zařídíme` · `Smontujeme` · `Vyřešíme` · `Přivezeme`

### Humor
Povolený — jemně o rodičovském chaosu (lego, fixky na zdi).
Buduje sounáležitost.

---

## 5. Logo

### Struktura
- **Symbol**: Stylizovaný dům + check-mark (transformace hotova)
- **Logotyp**: `vybaveno` v Plus Jakarta Sans Bold, lowercase

### Barvy loga
- Primární: Sage Green `#7C8F80`
- Akcent (check): Terracotta `#C87F69`
- Inverzní: na tmavém pozadí Warm Sand `#F0E8D9`

### Clear space
Minimální prostor kolem loga = výška písmene "v"

### Zakázáno
- ❌ Rotovat
- ❌ Měnit barvy mimo paletu
- ❌ Přidávat stíny/efekty
- ❌ Deformovat proporce

---

## 6. UI Specifikace (Glide Apps)

### Design jazyk
**Bento Grid** — modulární, čisté bloky jako japonská krabička.

### Komponenty

**Karty (Cards)**
```css
border-radius: 16px;
box-shadow: 0 2px 8px rgba(0,0,0,0.08);
background: #FFFFFF; /* nebo Warm Sand */
```

**Tlačítka CTA**
```css
background: #C87F69; /* Terracotta */
color: #FFFFFF;
border-radius: 12px;
font-family: 'Plus Jakarta Sans';
font-weight: 600;
```

**Navigace (Bottom Bar)**
- Max 4 položky: Domů, Projekty, Chat, Profil
- Aktivní: Sage Green
- Neaktivní: Muted Grey

**Ikony**
- Styl: Rounded/Soft (ne ostré hrany)
- Tloušťka: Medium stroke
- Zdroj: Heroicons nebo Material Icons

### FAB (Floating Action Button)
- Barva: Terracotta
- Pozice: Pravý dolní roh
- Funkce: "Nahrát pokoj" nebo "Potřebuji pomoc"

---

## 7. Fotografie & Vizuály

### Styl
**Organic Modern** — čistota modernismu + teplo přírodních materiálů

### Pravidla pro marketing
- "Před a Po" vizuály jsou hlavní USP
- Split screen: chaos vlevo → klid vpravo
- Denní světlo, žádné přeexponované blesky
- Reálné prostory, ne renderované vizualizace

### AI generované vizuály
Při použití Gemini/Banana:
- Prompt vždy obsahuje CONSTRAINTS pro zachování geometrie
- Verze Pro pro finální výstupy
- Flash jen pro rychlé náhledy

---

## 8. Messaging Framework

### Tagline
```
"Od chaosu ke klidu jedním kliknutím"
```

### Elevator Pitch (10 sekund)
```
Vybaveno je služba pro rodiče, kteří chtějí hezký 
dětský pokoj, ale nemají čas ani nervy ho zařizovat. 
Vyfotíte místnost, my navrhneme, objednáme i smontujeme.
```

### Hodnotová propozice
```
Neprodáváme nábytek. 
Prodáváme volný víkend a duševní pohodu.
```

---

## 9. Konkurenční diferenciace

| Konkurent | Jejich pozice | Naše výhoda |
|-----------|---------------|-------------|
| Favi/Biano | "10 000 židlí" | Kurace, ne katalog |
| IKEA | DIY montáž | Full-service, na klíč |
| Bonami | Inspirace | Realizace včetně montáže |
| Architekti | Drahé, dlouhé | Rychlé, dostupné |

---

## 10. Quick Reference Card

```
╔══════════════════════════════════════════╗
║  VYBAVENO BRAND CHEAT SHEET              ║
╠══════════════════════════════════════════╣
║  Sage Green     #7C8F80  — brand         ║
║  Warm Sand      #F0E8D9  — pozadí        ║
║  Terracotta     #C87F69  — CTA           ║
║  Deep Charcoal  #2D2D2D  — text          ║
╠══════════════════════════════════════════╣
║  Headlines:  Plus Jakarta Sans Bold      ║
║  Body:       Figtree Regular             ║
╠══════════════════════════════════════════╣
║  Tón: Uklidňující, přímý, empatický      ║
║  Archetyp: Modern Concierge              ║
╚══════════════════════════════════════════╝
```

---

*Dokument vytvořen: Leden 2026*  
*Další revize: Po validaci MVP*
