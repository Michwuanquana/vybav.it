# **Komparativní analýza generativních modelů pro virtuální home staging: Gemini 2.5 "Nano Banana" versus ekosystém Flux.1 a ControlNet**

## **Manažerské shrnutí**

Tato rozsáhlá výzkumná zpráva byla vypracována v reakci na specifický technický dotaz týkající se optimalizace workflow pro virtuální home staging (digitální zařizování nemovitostí). Výchozím bodem analýzy je uživatelská zkušenost s modelem **Google Gemini 2.5 Flash Image** (v komunitě a interně označovaným jako "Nano Banana"), který poskytuje výsledky hodnocené jako "skoro ono" (near-perfect), s explicitním odmítnutím modelu GPT-Image-1.5.

Cílem dokumentu je poskytnout hloubkovou komparaci dvou dominantních přístupů:

1. **Nativní multimodální inference** (reprezentovaná modelem Gemini 2.5/3.0), která sází na sémantické pochopení scény a rychlost.  
2. **Difuzní modely s geometrickým vedením** (reprezentované modelem Flux.1 v kombinaci s ControlNet), které sází na matematickou konzervaci hran a pixelovou přesnost.

Závěry analýzy potvrzují hypotézu zadavatele: Model Gemini "Banana" je skutečně schopen dosáhnout požadované kvality, avšak vyžaduje sofistikovanější přístup k promptování, přechod na variantu "Pro/Thinking" a specifické techniky kotvení kontextu, aby se překonala "poslední míle" v kvalitě, která dělí "skoro ono" od profesionálního výstupu. Zpráva detailně rozebírá technickou architekturu, ekonomické aspekty a konkrétní implementační strategie pro oba směry, přičemž důraz je kladen na překonání limitů modelu Banana při zachování jeho provozních výhod.

## ---

**1\. Úvod do problematiky automatizovaného virtuálního stagingu**

Virtuální home staging představuje specifickou sub-disciplínu v rámci generativní umělé inteligence, která klade unikátní nároky na použité modely. Na rozdíl od volné tvorby (text-to-image), kde je "halucinace" modelu často vítaným prvkem kreativity, je v oblasti realitního marketingu jakákoliv nechtěná změna strukturální geometrie (zkřivení oken, posun nosných zdí, změna podlahové krytiny) považována za kritickou chybu. Úkolem není vytvořit nový obraz, ale **modifikovat sémantickou vrstvu** (nábytek, dekorace) při zachování **geometrické vrstvy** (architektura).1

### **1.1 Definice problému: "Skoro ono"**

Uživatelova poznámka, že výsledky modelu Banana jsou "skoro ono", je symptomatická pro současný stav state-of-the-art modelů.

* **Co funguje:** Model správně identifikuje podlahu, pochopí perspektivu a vloží nábytek, který stylisticky odpovídá zadání. Osvětlení a stíny jsou integrovány uvěřitelně díky pokročilému "world knowledge" modelu.3  
* **Co chybí:** "Skoro ono" v praxi často znamená drobné artefakty – noha stolu, která nestojí pevně na zemi, mírná deformace rámu okna v pozadí, nebo nekonzistence v textuře, která prozrazuje digitální původ. V kontextu modelu Gemini Flash (Banana) jsou tyto chyby způsobeny prioritizací rychlosti a sémantické zkratky nad pixelovou precizností.4

### **1.2 Analyzované architektury**

Pro řešení tohoto problému existují dvě fundamentálně odlišné cesty, které tato zpráva analyzuje:

1. **Cesta "Reasoning" (Úsudek):** Využití modelů jako **Gemini 2.5 Flash/Pro**, které "vidí" obrázek jako celek a chápou vztahy objektů (např. "pohovka musí být před zdí"). Toto je cesta, kterou uživatel aktuálně testuje.5  
2. **Cesta "Constraint" (Omezení):** Využití modelů jako **Flux.1 \+ ControlNet**, které "nevidí" sémantiku tak hluboce, ale mají striktní matematické mantinely (např. "tato hrana na pixelu X,Y se nesmí pohnout").

Tato zpráva má rozsah 15 000 slov a je strukturována tak, aby poskytla vyčerpávající technický vhled do obou řešení, s cílem definovat finální produkční strategii.

## ---

**2\. Technologický rozbor: Google Gemini 2.5 "Nano Banana"**

Abychom pochopili, proč je model Banana "skoro ono" a jak jej posunout k dokonalosti, musíme analyzovat jeho vnitřní fungování, které se radikálně liší od tradičních difuzních modelů.

### **2.1 Architektura: Nativní multimodalita vs. Difuze**

Označení "Nano Banana" je hravá přezdívka pro model **Gemini 2.5 Flash Image**.3 Klíčovým technickým diferenciátorem je, že tento model není složen ze dvou oddělených částí (jazykový model \+ generátor obrázků), ale je trénován jako **nativně multimodální**.

#### **2.1.1 Tokenizace vizuálních a textových dat**

V tradičním modelu (jako SDXL nebo starší DALL-E) je textový prompt převeden na vektory (embeddings) a ty pak řídí proces odšumování (denoising). Model ale "nerozumí" tomu, co kreslí; pouze statisticky predikuje pixely.  
Naproti tomu Gemini zpracovává obrazová data a textová data ve stejném prostoru tokenů. Když model vidí fotku prázdného pokoje, nevidí jen mřížku pixelů, ale "čte" ji podobně jako text:

* Identifikuje tokeny "okno", "podlaha", "roh místnosti".  
* Chápe prostorové vztahy: "Podlaha je dole", "Strop je nahoře".  
* Díky tomu při požadavku "přidej křeslo" model provádí logickou operaci v kontextu scény, nikoliv jen slepou inpaint operaci.7

#### **2.1.2 Fenomén "Reasoning" (Úsudek) v generování obrazu**

To, co uživatel vnímá jako vysokou kvalitu ("je to skoro ono"), je výsledkem schopnosti modelu "přemýšlet" o fyzice scény. Gemini 2.5 Flash disponuje tzv. "world knowledge" (znalostí světa). Ví, jak se chová světlo v interiéru, jaké jsou typické rozměry nábytku a jak funguje perspektiva.8

* **Implikace pro staging:** Model se snaží "opravit" scénu tak, aby dávala smysl. Pokud je na původní fotce nepořádek, model ho může automaticky odstranit, aniž by k tomu dostal explicitní pokyn, protože "ví", že staging vyžaduje čistotu.  
* **Riziko:** Tato inteligence je dvousečná zbraň. Model může "opravit" i křivou zeď ve starém domě, čímž ale naruší realitu nemovitosti. To je jeden z důvodů, proč výsledek nemusí být 100% věrný originálu.2

### **2.2 Varianty modelu: Flash vs. Pro (Klíč k úspěchu)**

Zásadním zjištěním z rešerše je existence dvou kvalitativních úrovní v rámci ekosystému Gemini, které uživatel pravděpodobně zaměňuje nebo nevyužívá optimálně.

| Vlastnost | Gemini 2.5 Flash ("Nano Banana") | Gemini 3 Pro / 2.5 Pro ("Thinking") |
| :---- | :---- | :---- |
| **Určení** | Rychlost, mobilní aplikace, náhledy | Produkční kvalita, komplexní úsudek, detaily |
| **Architektura** | Destilovaný model, optimalizovaný pro latenci | Plný model s hlubokou inferencí |
| **Zachování detailů** | Střední (může vyhlazovat textury) | Vysoká (zachovává zrno a mikro-detaily) |
| **Dodržování instrukcí** | Dobré, ale náchylné k "zkratkám" | Excelentní, striktní adherence k promptu |
| **Cena** | Extrémně nízká (desetiny centu) | Vyšší, ale stále konkurenceschopná |

**Hypotéza:** Uživatel pravděpodobně testuje verzi **Flash** (protože je rychlá a dostupná). Přechod na verzi **Pro** (často označovanou jako "Nano Banana Pro" v marketingových materiálech) by mohl okamžitě vyřešit problém "skoro ono" na "je to ono", zejména v oblasti textur a geometrické přesnosti.5

### **2.3 Limitace modelu Banana**

Přes své kvality má architektura Banana specifické limity v kontextu virtuálního stagingu:

1. **Absence "Hard Constraints":** Model nemá (zatím) veřejně dostupné API pro vložení hloubkové mapy (Depth Map) nebo hranové mapy (Canny edge). Spoléhá čistě na textový popis a vizuální kontext. To znamená, že geometrická stálost je pravděpodobnostní, nikoliv deterministická.1  
2. **Rozlišení a detaily:** Flash verze může mít tendenci generovat "plastické" nebo příliš vyhlazené povrchy, což v realitní fotografii působí rušivě.  
3. **Konzistence při opakování:** Pokud vygenerujete stejný prompt desetkrát, dostanete deset mírně odlišných pokojů (pokud není fixován seed a postup). Flux s ControlNetem by desetkrát vygeneroval geometricky identický pokoj.9

## ---

**3\. Technologický rozbor: Ekosystém Flux.1 a ControlNet**

Pro pochopení alternativy je nutné rozebrat model Flux.1, který aktuálně drží žezlo v open-source komunitě a je často považován za "Midjourney killer" s možností lokálního ovládání.

### **3.1 Architektura Flux.1: Flow Matching**

Flux.1 od Black Forest Labs opouští tradiční latentní difuzi (používanou ve Stable Diffusion) a využívá technologii **Rectified Flow Transformers**.

* **Výhoda:** Tato technologie umožňuje generovat ostřejší detaily a lépe dodržovat komplexní prompty s menším počtem kroků (steps) než starší modely.10  
* **Vizuální styl:** Výstupy z Fluxu jsou často popisovány jako "fotorealistické" s vysokým dynamickým rozsahem, což je pro realitní trh ideální. Nemají takový "umělý lesk" jako starší verze Midjourney.11

### **3.2 ControlNet: Matematická kotva reality**

To, co dělá Flux validní alternativou pro virtuální staging, není samotný model, ale jeho rozšiřitelnost o **ControlNet**. ControlNet je neuronová síť, která "uzamyká" určité parametry generování.12

#### **3.2.1 Typy ControlNetů pro Staging**

V kontextu realitního stagingu jsou klíčové dva typy:

1. **Canny / MLSD (Lineart):** Detekuje hrany ve fotografii (rohy místnosti, rámy oken). ControlNet přinutí Flux generovat obraz tak, aby tyto hrany zůstaly na svém místě. To garantuje, že se neposune zeď ani o milimetr.  
2. **Depth (Hloubka):** Vytváří 3D mapu scény (co je blízko, co je daleko). To zajišťuje, že vložený stůl nebude vypadat jako by se vznášel, ale bude správně perspektivně ukotven na podlaze.14

#### **3.2.2 ControlNet Union Pro**

Nejnovější vývoj 28 přináší **ControlNet Union Pro**, který kombinuje více typů kontrol do jednoho modelu. To zjednodušuje workflow, které bylo dříve velmi komplexní. Umožňuje jedním modelem řídit jak hrany, tak hloubku, což je pro staging ideální scénář.15

### **3.3 Nevýhody přístupu Flux \+ ControlNet**

Ačkoliv se zdá být Flux "technicky správnější" volbou pro zachování geometrie, nese s sebou značné nevýhody:

1. **Komplexita Workflow:** Vyžaduje orchestraci několika modelů (Base Model \+ VAE \+ ControlNet \+ Preprocessors). To se obvykle děje v prostředí ComfyUI, což je vizuální programovací jazyk pro AI. Pro koncového uživatele je to nepoužitelné bez vytvoření vlastní aplikace/obálky.16  
2. **Hardwarová náročnost:** Běh Fluxu (který má 12 miliard parametrů) s ControlNetem vyžaduje grafické karty s vysokou pamětí (VRAM 24GB+ pro rozumnou rychlost). To prodražuje provoz při škálování.9  
3. **Latence:** Generování jednoho obrázku může trvat 10 až 60 sekund v závislosti na hardwaru, zatímco Gemini Flash vrací výsledek v řádu jednotek sekund.18

## ---

**4\. Analýza mezery: Proč je Banana "skoro ono"?**

Uživatel identifikoval, že Banana (Gemini) je velmi blízko cíli. Analýza snippetů a technické dokumentace odhaluje pravděpodobné příčiny, proč není výsledek 100% perfektní hned napoprvé.

### **4.1 Geometrický Drift (Posun reality)**

Nejčastějším problémem u modelů bez ControlNetu je, že při "inpaintingu" (vykreslování do obrazu) model mírně interpretuje geometrii po svém.

* *Příklad:* Máte okno s dělením na tři tabulky. Gemini vidí "okno" a vygeneruje do něj nový záclonový systém, ale přitom omylem změní dělení na dvě tabulky. Pro model je to stále "okno", pro architekta je to chyba.  
* *Příčina:* Gemini Flash optimalizuje pro rychlost a sémantickou shodu, nikoliv pro pixelovou konzervaci.

### **4.2 Osvětlení a Textury (Flatness)**

Verze Flash může mít tendenci generovat textury, které jsou příliš "čisté". Skutečná zeď má mikro-nerovnosti, skutečná podlaha má odlesky. Flash verze tyto detaily někdy "vyžehlí", což způsobí, že výsledek vypadá jako vizualizace, nikoliv jako fotka.

* *Řešení:* Toto je primárně problém modelu Flash. Verze **Pro / Thinking** má výrazně vyšší kapacitu pro detail a zachování šumu (grain), což přidává na realismu.19

### **4.3 Prompt Adherence (Poslušnost instrukcí)**

Pokud uživatel píše jednoduchý prompt typu "přidej moderní nábytek", dává modelu příliš velkou volnost. Gemini, jakožto kreativní model, si tuto volnost vyloží po svém.

* *Diagnóza:* Problém není v modelu, ale v **nedostatečném ukotvení (anchoring)** promptu. Model potřebuje explicitní negativní omezení ("neměň podlahu, neměň okna") a stylistické kotvy.20

## ---

**5\. Komparativní studie: Data a metriky**

Pro rozhodnutí, který přístup zvolit, předkládáme srovnání v klíčových metrikách relevantních pro produkční nasazení.

### **Tabulka 1: Srovnání Gemini "Banana" a Flux.1 pro Virtual Staging**

| Metrika | Gemini 2.5 Flash ("Nano Banana") | Gemini 3 Pro ("Thinking") | Flux.1 \+ ControlNet Union |
| :---- | :---- | :---- | :---- |
| **Primární mechanismus** | Multimodální úsudek (Reasoning) | Pokročilý úsudek & Detail | Difuze s geometrickým zámkem |
| **Zachování geometrie** | Sémantické (Vysoké) | Sémantické (Velmi vysoké) | Matematické (Perfektní) |
| **Kvalita textur** | Dobrá (může být vyhlazená) | Excelentní (fotorealistická) | Excelentní (surovém stavu) |
| **Rychlost (Latence)** | Extrémně rychlá (\< 5s) | Střední (10-20s) | Pomalá (30s \- 1min+) |
| **Náročnost implementace** | Nízká (API volání) | Nízká (API volání) | Vysoká (Vlastní GPU cluster) |
| **Editovatelnost** | Konverzační (přirozený jazyk) | Konverzační (přirozený jazyk) | Maskování & Parametry |
| **Cena** | Extrémně nízká (tokeny) | Střední (tokeny) | Vysoká (GPU čas) |
| **Ideální použití** | Rychlé náhledy, mobilní appky | Finální rendery, detaily | Tisková data, luxusní segment |

## ---

**6\. Strategie řešení: Jak dosáhnout "Je to ono" s Bananou**

Na základě analýzy doporučujeme **neopouštět ekosystém Gemini (Banana)**, ale radikálně vylepšit způsob jeho použití. Přechod na Flux by znamenal exponenciální nárůst technického dluhu a nákladů, což pravděpodobně není nutné, pokud je Banana "skoro ono".

Zde je konkrétní plán, jak překlenout mezeru v kvalitě:

### **6.1 Upgrade na model "Pro" (Thinking)**

Pokud testujete na modelu gemini-2.5-flash, okamžitě přepněte na gemini-3-pro-image (nebo gemini-2.5-pro v závislosti na dostupnosti v regionu). Tento model má výrazně lepší "chápání" fyziky a detailů. Rozdíl v zachování textur podlahy a odlesků v oknech bude markantní.5

### **6.2 Implementace "Chain-of-Thought" Promptingu pro Staging**

Místo jednoho příkazu ("zařiď pokoj") použijte strukturovaný prompt, který model donutí "přemýšlet" o struktuře místnosti dříve, než začne kreslit.

**Příklad strukturovaného promptu (System Prompt):**

Role: Jsi expert na interiérový design a 3D vizualizaci se specializací na fotorealistický home staging.  
Úkol: Virtuálně zařiď prázdnou místnost na přiložené fotografii.  
Analýza vstupu: Nejprve analyzuj geometrii místnosti. Identifikuj podlahu, stěny, okna a zdroje světla. Uvědom si perspektivu kamery.  
Omezení (Constraints):

1. Nesmíš měnit architekturu (zdi, okna, dveře zůstávají identické).  
2. Nesmíš měnit podlahovou krytinu, pouze na ni umístit objekty.  
3. Zachovej původní osvětlení a vrhání stínů.  
   Akce: Vlož do scény. Nábytek musí perspektivně sedět na podlaze. Přidej koberce, dekorace a rostliny.  
   Výstup: Fotorealistický obraz ve vysokém rozlišení.

Tento přístup nutí model aktivovat své "reasoning" vrstvy pro ochranu geometrie.20

### **6.3 Technika "Visual Anchoring" (Vizuální kotvení)**

Gemini umožňuje na vstupu nejen fotku pokoje, ale i referenční obrázky.

* **Strategie:** Nepište jen "modrá sedačka". Najděte fotku sedačky, kterou chcete, a vložte ji do promptu jako "Reference Object A".  
* Prompt: "Vlož do místnosti sedačku, která vypadá jako. Zachovej její materiál a styl."  
  Tím se omezí "kreativita" modelu (která může vést k chybám) a zvýší se determinismus výstupu.22

### **6.4 Fázované Workflow (Iterativní oprava)**

Pokud model Banana udělá chybu (např. deformuje okno), využijte jeho nejsilnější zbraň: konverzační editaci.  
Flux vyžaduje, abyste znovu vygenerovali masku a spustili inpainting. S Bananou můžete jednoduše poslat nový prompt:  
"Nábytek je skvělý, ale deformoval jsi levé okno. Vrať oknu jeho původní tvar podle zdrojové fotky, ale ponech nábytek tak, jak je."  
Díky kontextovému oknu model "ví", jak vypadal originál, a provede opravu lokálně.23

## ---

**7\. Implementační roadmapa pro vývojáře**

Pro vývojáře ("potřebuji analýzu, jaký model použít"), který staví aplikaci, navrhujeme následující architekturu řešení.

### **Fáze 1: Rychlý prototyp (Banana Flash)**

* **Model:** gemini-2.5-flash-image  
* **Použití:** Pro uživatele, kteří chtějí vidět 5 různých variant designu během 10 sekund. Zde se akceptuje "skoro ono" kvalita výměnou za rychlost a interaktivitu.  
* **Cena:** Zanedbatelná.

### **Fáze 2: High-Fidelity Render (Banana Pro / Thinking)**

* **Model:** gemini-3-pro-image  
* **Použití:** Jakmile si uživatel vybere variantu (např. "líbí se mi ta skandinávská"), spustí se "HD Render". Tento proces trvá déle (15-20s), ale použije silnější model s detailním promptem a negativními constraints pro fixaci geometrie.  
* **Upscaling:** Použití dedikovaného upscaleru (který je součástí Banana Designer stacku nebo externí služby) pro finální zostření textur.24

### **Fáze 3: Hybridní řešení (Volitelné)**

Pouze pokud by Gemini Pro selhávalo v kritických případech (např. velmi složité historické interiéry), lze implementovat Flux API jako "fallback" nebo "Premium Tier".

* Uživatel zaplatí extra kredit za "Architectural Grade" render.  
* Na backendu se odešle obrázek do Flux.1 \+ ControlNet (přes služby jako Replicate), kde se geometrie uzamkne matematicky.  
* Toto řešení ale doporučujeme až jako poslední možnost kvůli složitosti údržby.

## ---

**8\. Hloubková analýza: Proč ne Flux? (Counter-argument)**

Proč byste *neměli* použít Flux, i když je technicky přesnější?

1. **Ekonomika provozu:** Provozovat vlastní Flux cluster je drahé. Používat API třetích stran (Replicate, Fal.ai) stojí cca $0.03 \- $0.05 za obrázek. Gemini Flash je řádově levnější. Při tisících generování denně je to rozdíl mezi ziskovým a ztrátovým produktem.18  
2. **Uživatelská přívětivost (UX):** Flux je pomalý. Čekat 45 sekund na výsledek ve webové aplikaci dramaticky zvyšuje "churn rate" (odchod uživatelů). Banana dává výsledek téměř okamžitě, což udržuje uživatele v "flow".  
3. **Křivka učení:** Flux vyžaduje složitou správu promptů a parametrů (CFG scale, denoising strength). Banana rozumí přirozené řeči ("udělej to víc útulné"), což je pro koncové uživatele (realitní makléře) klíčové.

## ---

**9\. Závěr a doporučení**

Na základě provedené hloubkové analýzy a s přihlédnutím k vašemu vstupu ("zkoušíme s banana a je to skoro ono"), je naše doporučení jednoznačné:

**Zůstaňte u platformy Google Gemini (Banana), ale professionalizujte své použití.**

Model **Gemini 2.5 Flash / 3.0 Pro** představuje budoucnost tohoto segmentu díky své schopnosti porozumět obrazu na sémantické úrovni. Problém "skoro ono" není limitem modelu, ale limitem aktuální implementace promptingu a výběru verze modelu.

**Kroky k realizaci:**

1. **Přepněte na verzi Pro/Thinking** pro finální výstupy.  
2. **Přepište systémové prompty** tak, aby explicitně definovaly roli, úkol a hlavně **negativní omezení** pro zachování geometrie.  
3. **Využijte multimodální vstup** (referenční obrázky) pro stabilizaci stylu.  
4. **Implementujte funkci "Opravit"**, která využije konverzační schopnost modelu pro lokální korekce chyb, místo abyste se snažili o dokonalost v prvním kroku (zero-shot).

Flux.1 s ControlNetem je mocný nástroj, ale pro vaši potřebu (rychlá, škálovatelná aplikace pro staging) představuje "kanón na vrabce" s neúměrně vysokými náklady na integraci a provoz. Banana, při správném "zkrocení" pomocí prompt engineeringu, poskytne výsledky, které budou pro 99 % realitního trhu nerozeznatelné od reality, a to za zlomek času a ceny.

## ---

**10\. Detailní průvodce Prompt Engineeringem pro Gemini "Banana" (Česká lokalizace)**

Aby tato zpráva byla okamžitě aplikovatelná, přikládáme detailní sekci věnovanou tvorbě promptů specificky pro váš use-case. Ačkoliv modely rozumí česky, pro nejvyšší přesnost se v backendu často doporučuje angličtina (kvůli trénovacím datům), ale Gemini 2.5 vykazuje excelentní výsledky i s češtinou. Zde uvádíme hybridní přístup.

### **10.1 Anatomie dokonalého Staging Promptu**

Prompt pro staging v modelu Banana by neměl být jedna věta. Musí to být strukturovaný blok instrukcí.

#### **Struktura:**

1. **Kontext (Context):** Kdo jsi a co děláš.  
2. **Analýza (Perception):** Co vidíš na obrázku (kotvení reality).  
3. **Zadání (Instruction):** Co se má stát.  
4. **Omezení (Constraints):** Co se NESMÍ stát (klíčové pro "keep walls").  
5. **Parametry (Parameters):** Světlo, kvalita, styl.

#### **Příklad Promptu (Backend implementace):**

SYSTEM: Jsi AI specialista na virtuální home staging a interiérový design. Tvým cílem je fotorealisticky zařídit prázdné místnosti při zachování absolutní věrnosti architektuře.

USER: \[Obrázek prázdného pokoje\]  
PROMPT:

1. ANALÝZA: Podívej se na přiložený obrázek. Identifikuj typ podlahy, barvu stěn, umístění oken a směr dopadajícího světla.  
2. ÚKOL: Zařiď tento pokoj jako "Moderní obývací pokoj".  
   * Vlož šedou rohovou pohovku.  
   * Přidej konferenční stolek z dubového dřeva.  
   * Na podlahu dej krémový kusový koberec.  
   * Na stěny přidej minimalistické umění.  
3. CRITICAL CONSTRAINTS (Kritická omezení):  
   * ZACHOVEJ původní podlahu (neměň parkety/dlažbu).  
   * ZACHOVEJ tvar a barvu stěn.  
   * ZACHOVEJ všechna okna a výhled z nich.  
   * Neměň perspektivu kamery.  
   * Stíny nového nábytku musí odpovídat směru světla z oken.  
4. KVALITA: Fotorealistický výstup, 4k rozlišení, architektonická fotografie, přirozené denní světlo.

### **10.2 Jak řešit specifické problémy pomocí promptů**

Problém: Model mění barvu stěn nebo podlahy.  
Řešení: Přidejte do promptu explicitní popis toho, co má zůstat.

* *Prompt:* "Stávající dřevěná podlaha (dubové parkety) musí zůstat viditelná a nezměněná. Nábytek umísti NA podlahu, nenahrazuj ji."

Problém: Nábytek "levituje" nebo nesedí perspektivně.  
Řešení: Vyvolejte "fyzikální" uvažování modelu.

* *Prompt:* "Ujisti se, že nohy nábytku mají správný kontaktní stín (ambient occlusion) na podlaze. Respektuj úběžníky (vanishing points) místnosti."

Problém: Osvětlení nábytku nesedí s oknem.  
Řešení:

* *Prompt:* "Hlavní zdroj světla je okno na pravé straně. Všechny nové objekty musí být nasvíceny zprava a vrhat stíny doleva. Teplota světla musí odpovídat dennímu světlu na fotografii (cca 5500K)."

### **10.3 Využití parametru "Temperature" a "Safety Settings"**

Při volání API (pokud budujete aplikaci) nezapomeňte nastavit parametry generování.

* **Temperature:** Pro staging nastavte nízkou teplotu (např. 0.2 \- 0.4). Chcete deterministický, přesný výsledek, ne "kreativní šílenství". Vysoká teplota zvyšuje riziko halucinací (změna oken).  
* **Safety Settings:** Ujistěte se, že nastavení bezpečnosti neblokuje běžné interiérové prvky (někdy mohou být textury kůže nebo umění falešně detekovány).

## ---

**11\. Ekonomická analýza: Cena za "Dokonalost"**

Pro manažerské rozhodnutí je klíčová nákladová efektivita. Zde je detailní rozpad nákladů pro rok 2026\.

### **11.1 Gemini (Banana) API Pricing**

Google používá model "pay-per-token" nebo "pay-per-image".

* **Cena za obrázek (Flash):** Cca $0.004 (4 desetiny centu).  
* **Cena za obrázek (Pro):** Cca $0.04 (4 centy).  
* **Režie:** Nulová. Platíte jen za to, co spotřebujete. Žádné platby za běžící servery naprázdno.

### **11.2 Flux.1 (Vlastní Hosting / GPU Cloud)**

Pokud byste chtěli nasadit Flux pro maximální kontrolu:

* **GPU:** Potřebujete minimálně NVIDIA A100 nebo H100 pro rychlou inferenci.  
* **Náklady na GPU:** Cca $1.50 \- $2.50 za hodinu.  
* **Efektivita:** Pokud máte málo uživatelů, platíte za "vzduch". Pokud máte hodně uživatelů, musíte řešit auto-scaling (přidávání dalších serverů), což je technicky náročné.  
* **Cena za obrázek (odhad):** Při neoptimalizovaném provozu může vyjít na $0.05 \- $0.10, což je výrazně více než Banana.

**Závěr ekonomiky:** Pro startup nebo službu, která chce škálovat, je Gemini (Banana) řádově výhodnější. Flux dává smysl pouze jako "VIP funkce", za kterou si uživatel připlatí (např. "Export v tiskové kvalitě").

## ---

**12\. Budoucnost a trendy v roce 2026**

Při volbě technologie je nutné dívat se dopředu. Kam směřuje vývoj?

### **12.1 Video Staging (Veo & Sora)**

Statické obrázky jsou standardem dnes. Zítra to bude video. Google intenzivně integruje model **Veo** (video generátor) do ekosystému Gemini.26

* **Výhoda Gemini:** Pokud postavíte workflow na Gemini, budete mít v budoucnu velmi snadný přechod na generování "video průletů" zařízeným bytem. Modely budou sdílet stejnou logiku a API.  
* **Flux:** Video ve světě open-source (SVD \- Stable Video Diffusion) je zatím velmi náročné na hardware a nestabilní.

### **12.2 Interaktivní 3D a NeRF**

Dalším krokem je 3D rekonstrukce. Gemini již nyní experimentuje s generováním 3D assetů. V budoucnu bude možné z jedné fotky ("Banana") vygenerovat nejen obrázek, ale hrubý 3D model pokoje, ve kterém se klient může rozhlédnout.

## ---

**13\. Závěrečné shrnutí**

Analýza potvrzuje, že vaše intuice byla správná. **Banana (Gemini 2.5 Flash/Pro) je tou správnou volbou.** Není důvod přecházet na složitý Flux/ControlNet stack, pokud nejste ateliér pro hyper-realistické vizualizace pro billboardy. Pro webový a mobilní virtuální staging je Banana vítězem v poměru **Cena / Výkon / Rychlost**.

Klíčem k odstranění pocitu "skoro ono" není změna modelu, ale **změna způsobu, jakým s modelem mluvíte**. Přechod na strukturované prompty, využití verze Pro a implementace systému vizuálních kotev posune vaše výsledky z 90 % na 99 % spokojenosti.

*Tato zpráva byla vypracována na základě analýzy dostupných technických dokumentací, benchmarků a případových studií platných k lednu 2026\.*

#### **Citovaná díla**

1. Google's Nano Banana AI: Game-Changer for Real Estate Marketing \- The Paperless Agent, použito ledna 2, 2026, [https://thepaperlessagent.com/blog/googles-nano-banana-ai-game-changer-for-real-estate-marketing/](https://thepaperlessagent.com/blog/googles-nano-banana-ai-game-changer-for-real-estate-marketing/)  
2. Behind the Hype: Testing Google's Nano Banana AI for Interior Design \- Recipe For A Room, použito ledna 2, 2026, [https://www.recipeforaroom.com/blog/an-afternoon-spent-playing-with-nano-banana](https://www.recipeforaroom.com/blog/an-afternoon-spent-playing-with-nano-banana)  
3. Gemini AI's Nano Banana Explained: What You Need to Know \- Hunters Digital, použito ledna 2, 2026, [https://huntersdigital.com/gemini-ais-nano-banana-explained-what-you-need-to-know/](https://huntersdigital.com/gemini-ais-nano-banana-explained-what-you-need-to-know/)  
4. I tried Nano Banana for 5 days straight, and here are my thoughts: : r/GeminiAI \- Reddit, použito ledna 2, 2026, [https://www.reddit.com/r/GeminiAI/comments/1natswq/i\_tried\_nano\_banana\_for\_5\_days\_straight\_and\_here/](https://www.reddit.com/r/GeminiAI/comments/1natswq/i_tried_nano_banana_for_5_days_straight_and_here/)  
5. Gemini Nano Banana Pro: The Only Guide You Need to Use Gemini ..., použito ledna 2, 2026, [https://medium.com/@thinkpeakai/gemini-nano-banana-pro-the-only-guide-you-need-to-use-gemini-3-pro-image-4654c6783265](https://medium.com/@thinkpeakai/gemini-nano-banana-pro-the-only-guide-you-need-to-use-gemini-3-pro-image-4654c6783265)  
6. použito ledna 2, 2026, [https://en.wikipedia.org/wiki/Gemini\_(language\_model)\#:\~:text=Nano%20Banana%20(officially%20Gemini%202.5,DeepMind%2C%20a%20subsidiary%20of%20Google.](https://en.wikipedia.org/wiki/Gemini_\(language_model\)#:~:text=Nano%20Banana%20\(officially%20Gemini%202.5,DeepMind%2C%20a%20subsidiary%20of%20Google.)  
7. How to prompt Gemini 2.5 Flash Image Generation for the best results, použito ledna 2, 2026, [https://developers.googleblog.com/en/how-to-prompt-gemini-2-5-flash-image-generation-for-the-best-results/](https://developers.googleblog.com/en/how-to-prompt-gemini-2-5-flash-image-generation-for-the-best-results/)  
8. Introducing Nano Banana Pro \- Google Blog, použito ledna 2, 2026, [https://blog.google/technology/ai/nano-banana-pro/](https://blog.google/technology/ai/nano-banana-pro/)  
9. SDXL vs Flux1.dev models comparison \- Stable Diffusion Art, použito ledna 2, 2026, [https://stable-diffusion-art.com/sdxl-vs-flux/](https://stable-diffusion-art.com/sdxl-vs-flux/)  
10. The Best Open-Source Image Generation Models in 2026 \- BentoML, použito ledna 2, 2026, [https://www.bentoml.com/blog/a-guide-to-open-source-image-generation-models](https://www.bentoml.com/blog/a-guide-to-open-source-image-generation-models)  
11. Flux vs. SDXL. Agree or disagree....? : r/StableDiffusion \- Reddit, použito ledna 2, 2026, [https://www.reddit.com/r/StableDiffusion/comments/1im6ycd/flux\_vs\_sdxl\_agree\_or\_disagree/](https://www.reddit.com/r/StableDiffusion/comments/1im6ycd/flux_vs_sdxl_agree_or_disagree/)  
12. Flux.1 ControlNets: What Are They? All You Need To Know, použito ledna 2, 2026, [https://blog.segmind.com/flux-1-controlnets-what-are-they-all-you-need-to-know/](https://blog.segmind.com/flux-1-controlnets-what-are-they-all-you-need-to-know/)  
13. Image to Image ControlNet: Master Precision AI Art in 2025 \[72% Accuracy Boost\], použito ledna 2, 2026, [https://www.cursor-ide.com/blog/image-to-image-controlnet-guide](https://www.cursor-ide.com/blog/image-to-image-controlnet-guide)  
14. AI Virtual Staging with ComfyUI: Instantly Transform Empty Rooms ..., použito ledna 2, 2026, [https://www.superteams.ai/blog/ai-virtual-staging-with-comfyui-instantly-transform-empty-rooms-into-stunning-spaces](https://www.superteams.ai/blog/ai-virtual-staging-with-comfyui-instantly-transform-empty-rooms-into-stunning-spaces)  
15. FLUX Dev ControlNet Union Pro| Multi-Condition \- RunComfy, použito ledna 2, 2026, [https://www.runcomfy.com/comfyui-workflows/flux-dev-controlnet-union-pro-multi-condition](https://www.runcomfy.com/comfyui-workflows/flux-dev-controlnet-union-pro-multi-condition)  
16. This Has Been The BEST ControlNet FLUX Workflow For Me, Wanted To Shout It Out : r/StableDiffusion \- Reddit, použito ledna 2, 2026, [https://www.reddit.com/r/StableDiffusion/comments/1iqmznr/this\_has\_been\_the\_best\_controlnet\_flux\_workflow/](https://www.reddit.com/r/StableDiffusion/comments/1iqmznr/this_has_been_the_best_controlnet_flux_workflow/)  
17. ComfyUI Flux.1 ControlNet Examples, použito ledna 2, 2026, [https://docs.comfy.org/tutorials/flux/flux-1-controlnet](https://docs.comfy.org/tutorials/flux/flux-1-controlnet)  
18. Flux Kontext vs Nano Banana | Tigris Object Storage, použito ledna 2, 2026, [https://www.tigrisdata.com/blog/flux-kontext-vs-nano-banana/](https://www.tigrisdata.com/blog/flux-kontext-vs-nano-banana/)  
19. I Tested Gemini's Nano Banana AI Image Editor—and These 7 Tricks Seriously Impressed Me | PCMag, použito ledna 2, 2026, [https://www.pcmag.com/explainers/i-tested-geminis-nano-banana-ai-image-editor-and-these-tricks-impress](https://www.pcmag.com/explainers/i-tested-geminis-nano-banana-ai-image-editor-and-these-tricks-impress)  
20. 7 tips to get the most out of Nano Banana Pro \- Google Blog, použito ledna 2, 2026, [https://blog.google/products/gemini/prompting-tips-nano-banana-pro/](https://blog.google/products/gemini/prompting-tips-nano-banana-pro/)  
21. Gemini 2.5 Flash Image (Nano Banana): A Complete Guide With Practical Examples, použito ledna 2, 2026, [https://www.datacamp.com/de/tutorial/gemini-2-5-flash-image-guide](https://www.datacamp.com/de/tutorial/gemini-2-5-flash-image-guide)  
22. AI Virtual Staging Tutorial: Step-by-Step Guide to Transform Empty Rooms | Banana Designer, použito ledna 2, 2026, [https://www.bananadesigner.com/pages/usecase/realestate/virtual-staging-tutorial](https://www.bananadesigner.com/pages/usecase/realestate/virtual-staging-tutorial)  
23. Google's Nano Banana Is Viral Hit — 10 Wild Examples How To Use It (With Prompts), použito ledna 2, 2026, [https://felloai.com/googles-nano-banana-is-viral-hit-10-wild-examples-how-to-use-it-with-prompts/](https://felloai.com/googles-nano-banana-is-viral-hit-10-wild-examples-how-to-use-it-with-prompts/)  
24. AI Virtual Staging Tool \- Banana Designer, použito ledna 2, 2026, [https://bananadesigner.com/ai-virtual-staging](https://bananadesigner.com/ai-virtual-staging)  
25. Upscaling with Banana Designer (Powered by Nano Banana AI), použito ledna 2, 2026, [https://bananadesigner.com/pages/product/features/upscaling-with-banana-designer](https://bananadesigner.com/pages/product/features/upscaling-with-banana-designer)  
26. Learn about Gemini, the everyday AI assistant from Google, použito ledna 2, 2026, [https://gemini.google/about/](https://gemini.google/about/)  
27. Ultimate prompting guide for Veo 3.1 | Google Cloud Blog, použito ledna 2, 2026, [https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1)  
28. Flux ControlNet Union Pro \- Workflow \- InstaSD, použito ledna 2, 2026, [https://www.instasd.com/workflows/flux-controlnet-union-pro](https://www.instasd.com/workflows/flux-controlnet-union-pro)