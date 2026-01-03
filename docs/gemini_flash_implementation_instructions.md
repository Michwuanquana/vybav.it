# Implementace Gemini 3 Flash pro Vybaveno

Tento dokument popisuje technickou implementaci modelu **Gemini 3 Flash** (`gemini-3-flash-preview`) pro účely aplikace Vybaveno. Zaměřuje se na využití jeho multimodálních schopností pro analýzu interiéru a fotorealistický inpainting nábytku.

## 1. Konfigurace klienta

Pro komunikaci s Gemini API použijeme Google AI SDK. Gemini 3 Flash vyžaduje specifické nastavení pro optimální výsledky v oblasti vizuálních úprav.

### Instalace
```bash
npm install @google/generative-ai
```

### Inicializace
```typescript
// lib/gemini-client.ts
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiFlash = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  generationConfig: {
    temperature: 0.4,        // Nižší teplota pro větší adherenci k realitě
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  },
});
```

## 2. Krok 1: Analýza geometrie (The Anchor)

Před jakoukoliv úpravou musíme získat "kotvu" - pochopení prostoru. Tím zajistíme, že AI nebude halucinovat nová okna nebo měnit perspektivu.

### Prompt Strategy
Využijeme **Structured Output** (JSON schema), který Gemini 3 nativně podporuje.

```typescript
// lib/prompts/analysis.ts

const analysisSchema = {
  type: SchemaType.OBJECT,
  properties: {
    room_type: { type: SchemaType.STRING },
    geometry: {
      type: SchemaType.OBJECT,
      properties: {
        shape: { type: SchemaType.STRING },
        ceiling_height_estimate: { type: SchemaType.STRING },
      }
    },
    architectural_features: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "List of fixed elements like windows, doors, columns that MUST be preserved"
    },
    lighting: {
      type: SchemaType.OBJECT,
      properties: {
        source_direction: { type: SchemaType.STRING },
        intensity: { type: SchemaType.STRING },
        color_temperature: { type: SchemaType.STRING }
      }
    },
    surfaces: {
      type: SchemaType.OBJECT,
      properties: {
        floor_material: { type: SchemaType.STRING },
        wall_color: { type: SchemaType.STRING }
      }
    }
  },
  required: ["geometry", "architectural_features", "lighting"]
};

export async function analyzeRoomGeometry(imageBase64: string) {
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: analysisSchema
    }
  });

  const prompt = `
    Analyze this room image for an interior design application.
    Your task is to identify the FIXED architectural shell that must be preserved.
    Identify lighting direction precisely so inserted objects cast correct shadows.
  `;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
  ]);

  return JSON.parse(result.response.text());
}
```

## 3. Krok 2: Generování / Inpainting

Zde dochází k "magii". Gemini 3 Flash použijeme v režimu, kdy mu předáme originální obrázek a instrukce k úpravě.

**Klíčová technika:** "Visual Anchoring" + "Reference Injection".
Do promptu vložíme textový popis produktu A TAKÉ (pokud to API dovolí v daném endpointu) vizuální referenci produktu.

### Prompt Template

```typescript
// lib/prompts/inpainting.ts

export function buildInpaintingPrompt(
  analysis: any, // Výsledek z kroku 1
  product: Product,
  userInstruction: string // např. "pod okno"
) {
  return `
    ACT AS: Expert Interior Visualizer & Photo Editor.
    TASK: Edit the provided room image to include a new piece of furniture.

    --- CONTEXT: ROOM GEOMETRY (DO NOT CHANGE) ---
    Lighting: ${analysis.lighting.source_direction}, ${analysis.lighting.color_temperature}
    Fixed Features: ${analysis.architectural_features.join(", ")}
    Floor: ${analysis.surfaces.floor_material}
    
    --- OBJECT TO INSERT ---
    Product: ${product.name}
    Visual Description: ${product.description_visual}
    Dimensions: ${product.dimensions.w}x${product.dimensions.h}x${product.dimensions.d} cm
    
    --- PLACEMENT INSTRUCTION ---
    ${userInstruction}
    
    --- CRITICAL CONSTRAINTS ---
    1. PRESERVE the original room architecture, windows, and perspective EXACTLY.
    2. CAST SHADOWS consistent with the identified lighting source (${analysis.lighting.source_direction}).
    3. SCALE the object correctly relative to the room height (${analysis.geometry.ceiling_height_estimate}).
    4. OUTPUT a photorealistic image.
  `;
}
```

### Implementace volání

```typescript
export async function generateDesign(
  roomImageBase64: string,
  productImageBase64: string | null, // Volitelně referenční fotka produktu
  prompt: string
) {
  const parts: any[] = [
    { text: prompt },
    { inlineData: { data: roomImageBase64, mimeType: "image/jpeg" } }
  ];

  // Pokud máme fotku produktu, přidáme ji jako referenci
  if (productImageBase64) {
    parts.push({ text: "Reference image of the furniture to insert:" });
    parts.push({ inlineData: { data: productImageBase64, mimeType: "image/jpeg" } });
  }

  const result = await geminiFlash.generateContent(parts);
  
  // Získání obrázku z odpovědi (záleží na formátu odpovědi modelu, 
  // Gemini 3 může vracet base64 v parts nebo odkaz)
  // Poznámka: V preview verzi může být potřeba specifický handling pro image output
  return result.response; 
}
```

## 4. Optimalizace nákladů a výkonu

Gemini 3 Flash je levný, ale při práci s obrázky se tokeny sčítají.

1.  **Rozlišení:** Pro analýzu (Krok 1) stačí nižší rozlišení (`media_resolution: "low"`), což šetří tokeny. Pro generování (Krok 2) potřebujeme `high`.
2.  **Context Caching:** Pokud uživatel dělá více úprav v jedné místnosti (např. mění pohovky), můžeme cachovat kontext (obrázek místnosti + analýzu), abychom neplatili za opakované zpracování vstupního obrázku.

### Příklad Context Caching (Pseudokód)

```typescript
// Pokud uživatel pokračuje v session
let chatSession;

if (cachedSessionId) {
  chatSession = geminiFlash.getChatSession(cachedSessionId);
} else {
  // První upload - vytvoříme cache
  const cache = await cacheManager.create({
    model: 'models/gemini-3-flash-preview',
    contents: [roomImage],
    ttlSeconds: 300, // 5 minut cache
  });
  chatSession = geminiFlash.startChat({ cachedContent: cache.name });
}
```

## 5. Řešení problémů (Troubleshooting)

| Problém | Příčina | Řešení |
|---------|---------|--------|
| **Změna oken/dveří** | Model "vylepšuje" architekturu | Zpřísnit prompt v sekci "CRITICAL CONSTRAINTS", použít výstup z analýzy jako "kotvu". |
| **Halucinace produktu** | Model nezná přesný produkt | Vložit referenční fotku produktu (multimodal input) + detailní textový popis. |
| **Špatné měřítko** | Model neodhadl výšku stropu | V promptu explicitně uvést odhadovanou výšku stropu (z analýzy). |
| **Pomalá odezva** | Velké obrázky | Resize na klientovi před odesláním (max 1536px delší strana). |

## 6. Další kroky

1.  Vytvořit testovací sadu 10 fotek pokojů (různé úhly, světlo).
2.  Vytvořit sadu 5 produktů s perfektními popisy.
3.  Spustit evaluační skript, který vygeneruje kombinace a umožní manuální hodnocení kvality (zachování architektury vs. realističnost nábytku).
