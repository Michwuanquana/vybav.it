# Vybaveno — UX & Interakční proces (Detailní analýza)

Tento dokument popisuje aktuální stav uživatelského zážitku (UX) a technickou implementaci kontrolního toku v aplikaci Vybaveno.cz.

## 1. Vstupní fáze: První dojem a Upload
*   **Vizuální kotva:** Uživatel přistupuje k čistému rozhraní se "Stage" (vlevo) a "Sidebar" (vpravo).
*   **Zero-friction upload:** Hlavní CTA je nahrání fotky. Podporováno je přetažení (Drag & Drop) nebo výběr z galerie.
*   **Heuristika:** Okamžitě po nahrání probíhá lokální analýza (`detectEmptyRoom`), která uživateli poskytne zpětnou vazbu (např. "Detekována prázdná místnost"), čímž potvrzuje, že systém obrazu rozumí ještě před voláním drahého AI.
*   **Demo režim:** Pro nerozhodné uživatele je k dispozici demo fotka, která projde celým procesem automaticky.

## 2. Fáze Analýzy (AI Magic)
*   **Multimodální vstup:** Fotka se posílá na `/api/analyze` spolu s kontextem (jazyk, zvolený typ pokoje).
*   **Vizuální kontinuita:** Během analýzy se zobrazují `AnalysisSpinner` komponenty. 
    *   *Při uploadu:* Celoobrazovkový overlay.
    *   *Při AI výpočtu:* Decentní spodní pill-spinner, který nezakrývá nahranou fotku.
*   **Výstup:** Gemini 3 Flash vrací strukturovaný JSON s:
    *   Detekovaným stylem a barevnou paletou.
    *   Pravděpodobnostmi pro typy pokojů (využito pro auto-switch).
    *   Doporučením produktů s **souřadnicemi [X, Y]** pro umístění do prostoru.

## 3. Konfigurace a Průzkum (Guided Flow)
*   **Smart Room Switch:** Pokud uživatel před analýzou pokoj nevybral, UI se automaticky přepne na typ s nejvyšší pravděpodobností (např. "Ložnice", 85%).
*   **Dynamický volič pokojů:** `RoomTypeSelector` řadí kategorie podle pravděpodobnosti. Nejpravděpodobnější jsou první. Obsahuje horizontální scroll (swipe na mobilu), aby se ušetřilo místo na výšku.
*   **Interaktivní fotka (The Stage):** 
    *   Na fotce se objeví pulzující markery.
    *   **Kliknutí na marker:** Automaticky přefiltruje katalog v sidebaru na danou kategorii (např. "Pohovka") a "zamkne" ho.
    *   **Zpětná vazba:** Po výběru produktu se marker změní na náhled vybraného kousku s checkmarkem.

## 4. Práce s Katalogem a Produkty
*   **Seamless Replacement:** Kliknutí na jiný produkt v sidebaru okamžitě nahradí ten stávající ve zvolené zóně. Žádné mazání a nové vybírání.
*   **Smart Labels:** Produkty mají štítky "V rozpočtu" nebo "Výhodnější" (pokud jsou levnější než aktuální výběr), což pomáhá uživateli v rozhodování.
*   **Auto-scroll:** Při změně aktivní kategorie (kliknutím na jiný marker) se katalog v sidebaru vyroluje zpět nahoru.

## 5. Finanční kontrola (Budget Management)
*   **PriceSlider:** Logaritmický slider pro nastavení rozpočtu.
*   **Spending Progress:** Obsahuje vizuální "metr" utracených peněz. 
    *   Zelená: Vše v pořádku.
    *   Červená: Překročili jste stanovený limit.
*   **Real-time validace:** Změna rozpočtu okamžitě ovlivňuje viditelnost produktů v katalogu přes API filtry.

## 6. Uzavření a Progress
*   **Project Progress Bar:** V hlavičce sidebaru je vidět 0-100 %. Každá vyřešená zóna posouvá ukazatel dál.
*   **Completion State:** Při 100 % se bar změní na terracottu a zobrazí "Vše hotovo!", což dává uživateli signál k finální akci (přechod do Studia nebo Uložení).

## 7. Technické UX detaily (Edge Cases)
*   **Sticky Header:** Filtry a rozpočet zůstávají nahoře při scrollování katalogem.
*   **Error Handling:** Pokud analýza selže (např. špatná fotka), systém nabídne jasné vysvětlení a možnost zkusit to znovu.
*   **Session Persistence:** Analýza se cachuje v SQLite přes `sessionId`, takže obnovení stránky neznamená ztrátu drahého AI volání.
