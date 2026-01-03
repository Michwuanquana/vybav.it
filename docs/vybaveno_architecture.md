# Vybaveno — Architektura aplikace (AI-First MVP)

## Přehled systému

Aplikace se posouvá od manuálního editoru k **AI-first řešení** využívajícímu **Gemini 3 Flash**. Cílem je "Do-It-For-Me" (DIFM) zážitek, kde uživatel vyfotí pokoj a AI do něj fotorealisticky vloží vybraný nábytek při zachování původní architektury.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                               USER FLOW                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   1. UPLOAD        2. ANALYZE & MASK      3. SELECT        4. GENERATE  │
│   ┌───────┐       ┌────────────────┐    ┌───────────┐    ┌───────────┐  │
│   │ Fotka │──────▶│ Gemini 3 Flash │───▶│  Katalog  │───▶│  Gemini   │  │
│   │ .jpg  │       │   Analýza +    │    │  Výběr    │    │ Inpaint   │  │
│   └───────┘       │   Segmentace   │    │  nábytku  │    │ (Render)  │  │
│                   └────────────────┘    └───────────┘    └───────────┘  │
│                            │                  │                │        │
│                            ▼                  ▼                ▼        │
│                       room_data           product_id      final_image   │
│                     (geom, light)           (ctx)            .png       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Tech Stack

| Komponenta | Technologie | Důvod |
|------------|-------------|-------|
| Frontend | **Next.js 14 (App Router)** | Server components, API routes, Vercel deploy |
| UI/UX | **Tailwind CSS + Shadcn/ui** | Rychlý, čistý design, mobile-first |
| State | **Zustand** | Jednoduchý state management pro výběr produktů |
| AI Core | **Google Gemini 3 Flash** | SOTA model, levný, rychlý, nativní multimodalita |
| Local Vision | **Transformers.js (DETR)** | Lokální kontrola obsahu (bezpečnost, soukromí) |
| Storage | **Local File System** | Rychlé, bezplatné, plná kontrola (optimalizace přes `sharp`) |
| Database | **SQLite** | Jednoduchost, přenositelnost, nulová latence pro lokální vývoj |
| Hosting | **Vercel / Self-host** | Flexibilní nasazení |

---

## 2. Adresářová struktura

```
vybaveno/
├── app/
│   ├── page.tsx                    # Landing / Upload
│   ├── studio/
│   │   └── [sessionId]/
│   │       ├── page.tsx            # Hlavní AI Studio interface
│   │       └── layout.tsx
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.ts            # POST: Gemini Vision analýza
│   │   ├── generate/
│   │   │   └── route.ts            # POST: Gemini Inpainting
│   │   └── products/
│   │       └── route.ts            # GET: Katalog (Supabase)
│   └── layout.tsx
├── components/
│   ├── studio/
│   │   ├── ImageCanvas.tsx         # Zobrazení fotky + interaktivní masky
│   │   ├── ProductSelector.tsx     # Bottom sheet/Sidebar s produkty
│   │   ├── ChatInterface.tsx       # "Concierge" chat s AI (volitelné)
│   │   └── ComparisonSlider.tsx    # Before/After zobrazení
│   └── ui/                         # Shadcn komponenty
├── lib/
│   ├── gemini-client.ts            # Gemini 3 Flash wrapper
│   ├── prompts/
│   │   ├── analysis-prompt.ts      # Prompt pro pochopení geometrie
│   │   └── inpainting-prompt.ts    # Prompt pro vložení nábytku
│   └── storage.ts                  # R2 helpery
├── types/
│   └── index.ts                    # TypeScript definice
└── public/
    └── uploads/                    # Lokální úložiště nahraných fotek (hash-based)
    └── products/                   # Obrázky produktů (reference)
```

---

## 2.1 Local-First & Caching Strategy

Pro maximalizaci rychlosti a minimalizaci nákladů na AI API využíváme následující mechanismy:

1.  **Content-Based Addressing (SHA-256):**
    *   Každý nahraný soubor je zahashován.
    *   Název souboru v `/public/uploads` je jeho hash (např. `a1b2c3...jpg`).
    *   To automaticky řeší deduplikaci na úrovni disku.

2.  **Image Optimization (`sharp`):**
    *   Všechny uploady jsou automaticky zmenšeny na max 2000px (delší strana).
    *   Konverze do JPEG s 85% kvalitou pro úsporu místa při zachování detailů pro AI.

3.  **AI Result Caching:**
    *   Před voláním Gemini API systém zkontroluje v SQLite tabulce `sessions`, zda již existuje úspěšná analýza pro daný hash obrázku.
    *   Pokud ano, analýza se přeskočí a použijí se uložená data. To šetří peníze i čas (latence API).

4.  **Local Safety Layer (Transformers.js):**
    *   Před odesláním do cloudu (Gemini) proběhne lokální detekce objektů.
    *   Model `detr-resnet-50` identifikuje osoby, zvířata nebo nevhodné objekty.
    *   Zajišťuje soukromí uživatele a čistotu vstupních dat pro design.

---

## 3. Datové typy

```typescript
// types/index.ts

export interface RoomAnalysis {
  camera: {
    angle: string;           // "eye level, front-left corner"
    lens: string;            // "wide-angle 16-20mm"
    orientation: "landscape" | "portrait";
  };
  dimensions: {
    width: number;           // metry
    depth: number;
    height: number;
    confidence: "high" | "medium" | "low";
  };
  architecture: {
    walls: string[];         // ["left wall with door opening", "back wall with window"...]
    windows: Window[];
    doors: Door[];
    features: string[];      // ["structural column on right", "corner visible floor to ceiling"]
  };
  lighting: {
    primary_source: string;  // "direct sunlight from right windows"
    shadow_direction: string; // "right to left"
    shadow_description: string;
  };
  surfaces: {
    walls: string;           // "raw gypsum plaster, blotchy white/grey"
    floor: string;           // "raw cement screed, grey"
  };
  raw_description: string;   // Celý text od Gemini pro kontext
}

export interface Window {
  position: string;          // "back wall, center"
  type: string;              // "double-casement"
  size_cm: { width: number; height: number };
  frame_color: string;
}

export interface Door {
  position: string;
  type: string;              // "opening without frame"
  size_cm: { width: number; height: number };
  leads_to: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: "sofa" | "table" | "chair" | "storage" | "rug" | "curtain" | "decor";
  dimensions_cm: {
    width: number;
    depth: number;
    height: number;
  };
  color: string;
  material: string;
  price_czk: number;
  image_url: string;         // Produktová fotka
  affiliate_url: string;     // Odkaz na e-shop
  marker_color: string;      // Barva značky na canvas (#FF0000)
}

export interface PlacedProduct {
  product: Product;
  position: {
    x: number;               // % of canvas width (0-100)
    y: number;               // % of canvas height (0-100)
  };
  scale: number;             // 1.0 = default
  rotation: number;          // stupně
}

export interface DesignSession {
  id: string;
  original_image_url: string;
  analysis: RoomAnalysis;
  placed_products: PlacedProduct[];
  marked_image_url?: string;
  rendered_image_url?: string;
  created_at: Date;
}
```

---

## 4. Katalog produktů (MVP)

```json
// data/catalog.json
{
  "products": [
    {
      "id": "jattebo-sofa-blue",
      "name": "JÄTTEBO 4-místná pohovka s lenoškou",
      "brand": "IKEA",
      "category": "sofa",
      "dimensions_cm": { "width": 290, "depth": 95, "height": 80 },
      "color": "dark blue (Samsala)",
      "material": "fabric upholstery",
      "price_czk": 44990,
      "image_url": "/products/jattebo-blue.png",
      "affiliate_url": "https://www.ikea.com/cz/cs/p/jaettebo-4mistny-pohovka-s-lenoskou-samsala-tmave-modra-s59429039/",
      "marker_color": "#1E3A5F"
    },
    {
      "id": "stockholm-2025-table",
      "name": "STOCKHOLM 2025 konferenční stolek",
      "brand": "IKEA",
      "category": "table",
      "dimensions_cm": { "width": 120, "depth": 60, "height": 40 },
      "color": "dark brown oak veneer",
      "material": "oak veneer, solid oak",
      "price_czk": 4990,
      "image_url": "/products/stockholm-table.png",
      "affiliate_url": "https://www.ikea.com/cz/cs/p/stockholm-2025-konferencni-stolek-dyha-dub-tmave-hneda-70573829/",
      "marker_color": "#5C4033"
    },
    {
      "id": "havberg-armchair",
      "name": "HAVBERG otočné křeslo",
      "brand": "IKEA",
      "category": "chair",
      "dimensions_cm": { "width": 79, "depth": 79, "height": 90 },
      "color": "golden brown leather",
      "material": "grain leather",
      "price_czk": 11990,
      "image_url": "/products/havberg.png",
      "affiliate_url": "https://www.ikea.com/cz/cs/p/havberg-otocne-kreslo-grann-bomstad-zlatohneda-50499452/",
      "marker_color": "#8B4513"
    },
    {
      "id": "stockholm-2025-cabinet",
      "name": "STOCKHOLM 2025 skříňka",
      "brand": "IKEA",
      "category": "storage",
      "dimensions_cm": { "width": 80, "depth": 40, "height": 126 },
      "color": "dark brown oak veneer",
      "material": "oak veneer",
      "price_czk": 9990,
      "image_url": "/products/stockholm-cabinet.png",
      "affiliate_url": "https://www.ikea.com/cz/cs/p/stockholm-2025-skrinka-2-dvere-dyha-dub-tmave-hneda-80573857/",
      "marker_color": "#4A3728"
    },
    {
      "id": "stockholm-2025-rug",
      "name": "STOCKHOLM 2025 koberec",
      "brand": "IKEA",
      "category": "rug",
      "dimensions_cm": { "width": 240, "depth": 350, "height": 1 },
      "color": "white/brown/light blue",
      "material": "handwoven wool",
      "price_czk": 9990,
      "image_url": "/products/stockholm-rug.png",
      "affiliate_url": "https://www.ikea.com/cz/cs/p/stockholm-2025-koberec-hladce-tkany-bila-hneda-sv-modra-rucne-tkane-30572974/",
      "marker_color": "#D4C4B0"
    },
    {
      "id": "stenfro-curtains",
      "name": "STENFRÖ záclony",
      "brand": "IKEA",
      "category": "curtain",
      "dimensions_cm": { "width": 145, "depth": 1, "height": 300 },
      "color": "white sheer",
      "material": "polyester",
      "price_czk": 399,
      "image_url": "/products/stenfro.png",
      "affiliate_url": "https://www.ikea.com/cz/cs/p/stenfroe-zaclony-1-par-bila-s-tunylkem-80540212/",
      "marker_color": "#FFFFFF"
    }
  ]
}
```

---

## 4. Doporučovací algoritmus (Recommendation Engine)

Algoritmus pracuje ve třech vrstvách, které kombinují vizuální analýzu s předem vypočítanými metadaty z katalogu.

### 4.1 Vrstva 1: Styl a Estetika (Metadata-driven)
Místo odvozování stylu z obrázků v reálném čase využívá algoritmus **předem vygenerované `style_tags`** z importní fáze:
- **Vstup:** Detekovaný styl místnosti z Gemini analýzy (např. "Scandinavian").
- **Match:** SQL dotaz `SELECT * FROM products WHERE 'scandinavian' = ANY(style_tags)`.
- **Výhoda:** Okamžitá odezva bez nutnosti další AI inference.

### 4.2 Vrstva 2: Materiálová a barevná harmonie
Algoritmus páruje produkty na základě hierarchie materiálů:
- **Solid Wood Match:** Pokud je v místnosti dubová podlaha, prioritizuje `solid_wood (oak)`.
- **Color Complement:** Využívá `color` pole pro ladění k primární/sekundární barvě navržené AI.

### 4.3 Vrstva 3: Prostorová validace
- **Rozměry:** Kontrola `dimensions_cm` proti odhadovaným rozměrům volného prostoru z analýzy geometrie.
- **Kategorie:** Automatický výběr kategorií podle typu místnosti (např. pro `bedroom` prioritizuje `bed`, `nightstand`, `wardrobe`).

---

## 5. Gemini API Wrapper

```typescript
// lib/gemini-client.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Inicializace modelu Gemini 3 Flash
export const geminiFlash = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  generationConfig: {
    temperature: 0.4,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  },
});

export async function analyzeRoom(imageBase64: string): Promise<RoomAnalysis> {
  // Použití strukturovaného výstupu pro analýzu
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
      responseMimeType: "application/json",
    }
  });
  
  const prompt = ROOM_ANALYSIS_PROMPT;
  
  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64,
      },
    },
  ]);
  
  return JSON.parse(result.response.text());
}

export async function generateInpainting(
  originalImageBase64: string,
  product: Product,
  analysis: RoomAnalysis,
  userInstruction: string,
  preferences?: Session['userPreferences']
): Promise<string> {
  const prompt = buildInpaintingPrompt(analysis, product, userInstruction, preferences);
  
  const result = await geminiFlash.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: originalImageBase64,
      },
    },
    // Zde bychom ideálně přidali i obrázek produktu jako referenci
  ]);
  
  // Zpracování odpovědi (base64 image)
  const imageData = result.response.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData
  )?.inlineData?.data;
  
  return imageData || "";
}
```

---

## 6. Prompt šablony

```typescript
// lib/prompts/inpainting-prompt.ts

export function buildInpaintingPrompt(
  analysis: RoomAnalysis,
  product: Product,
  instruction: string,
  preferences?: Session['userPreferences']
): string {
  const styleContext = preferences 
    ? `STYLE GUIDE: Room type is ${preferences.roomType}. Preferred colors: ${preferences.colors.primary} and ${preferences.colors.secondary}.`
    : "";

  return `
    ACT AS: Expert Interior Visualizer & Photo Editor.
    TASK: Edit the provided room image to include a new piece of furniture.

    --- CONTEXT: ROOM GEOMETRY (DO NOT CHANGE) ---
    Lighting: ${analysis.lighting.primary_source}, ${analysis.lighting.shadow_direction}
    Fixed Features: ${analysis.architecture.walls.join(", ")}
    Floor: ${analysis.surfaces.floor}
    
    --- DESIGN CONTEXT ---
    ${styleContext}
    
    --- OBJECT TO INSERT ---
    Product: ${product.name}
    Visual Description: ${product.color}, ${product.material}, ${product.dimensions_cm.width}x${product.dimensions_cm.height}cm
    
    --- PLACEMENT INSTRUCTION ---
    ${instruction}
    
    --- CRITICAL CONSTRAINTS ---
    1. PRESERVE the original room architecture, windows, and perspective EXACTLY.
    2. CAST SHADOWS consistent with the identified lighting source.
    3. SCALE the object correctly relative to the room height.
    4. OUTPUT a photorealistic image.
  `;
}
```

---

## 7. API Routes

### POST /api/analyze

```typescript
// app/api/analyze/route.ts

import { NextRequest, NextResponse } from "next/server";
import { analyzeRoom } from "@/lib/gemini";
import { uploadToStorage } from "@/lib/storage";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    
    // Convert to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    
    // Upload original image
    const sessionId = nanoid();
    const imageUrl = await uploadToStorage(
      `sessions/${sessionId}/original.jpg`,
      bytes
    );
    
    // Analyze with Gemini
    const analysis = await analyzeRoom(base64);
    
    // Validate room (not a cat photo etc.)
    if (!analysis.dimensions || analysis.dimensions.confidence === "low") {
      return NextResponse.json(
        { error: "Could not identify room. Please upload a clear interior photo." },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      sessionId,
      imageUrl,
      analysis,
    });
    
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
```

### POST /api/render

```typescript
// app/api/render/route.ts

import { NextRequest, NextResponse } from "next/server";
import { renderDesign } from "@/lib/gemini";
import { uploadToStorage, getFromStorage } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, markedImageBase64, analysis, placedProducts } = body;
    
    if (!markedImageBase64 || !analysis || !placedProducts?.length) {
      return NextResponse.json(
        { error: "Missing required data" },
        { status: 400 }
      );
    }
    
    // Get original image for context
    const originalBase64 = await getFromStorage(
      `sessions/${sessionId}/original.jpg`
    );
    
    // Upload marked image
    await uploadToStorage(
      `sessions/${sessionId}/marked.png`,
      Buffer.from(markedImageBase64, "base64")
    );
    
    // Generate render
    const renderedBase64 = await renderDesign(
      originalBase64,
      markedImageBase64,
      analysis,
      placedProducts
    );
    
    if (!renderedBase64) {
      return NextResponse.json(
        { error: "Failed to generate render" },
        { status: 500 }
      );
    }
    
    // Upload rendered image
    const renderedUrl = await uploadToStorage(
      `sessions/${sessionId}/rendered.png`,
      Buffer.from(renderedBase64, "base64")
    );
    
    return NextResponse.json({
      renderedUrl,
      renderedBase64,
    });
    
  } catch (error) {
    console.error("Render error:", error);
    return NextResponse.json(
      { error: "Failed to render design" },
      { status: 500 }
    );
  }
}
```

---

## 8. Image Canvas komponenta (AI Studio)

```typescript
// components/studio/ImageCanvas.tsx

"use client";

import { useRef, useState } from "react";
import { Product } from "@/types";

interface Props {
  imageUrl: string;
  onMaskCreated: (maskBase64: string) => void;
}

export function ImageCanvas({ imageUrl, onMaskCreated }: Props) {
  // Zjednodušený canvas pro zobrazení a případné maskování
  // Místo Fabric.js stačí HTML5 Canvas nebo SVG overlay
  
  return (
    <div className="relative w-full h-full">
      <img src={imageUrl} alt="Room" className="w-full h-auto rounded-lg" />
      {/* Overlay pro interakci - např. kliknutí pro umístění */}
    </div>
  );
}
```

---

## 9. Hlavní stránka designu

```typescript
// app/studio/[sessionId]/page.tsx

import { ImageCanvas } from "@/components/studio/ImageCanvas";
import { ProductSelector } from "@/components/studio/ProductSelector";

export default async function StudioPage({ params }: Props) {
  // ...
  
  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 border-b">
        <h1 className="font-bold">Vybaveno Studio</h1>
      </header>
      
      <main className="flex-1 relative">
        <ImageCanvas imageUrl={session.imageUrl} />
        
        {/* Floating controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur">
           <ProductSelector />
        </div>
      </main>
    </div>
  );
}
```

---

## 10. Deployment checklist

### Environment variables:
```env
GEMINI_API_KEY=xxx
CLOUDFLARE_R2_ACCESS_KEY=xxx
CLOUDFLARE_R2_SECRET_KEY=xxx
CLOUDFLARE_R2_BUCKET=vybaveno
CLOUDFLARE_R2_ENDPOINT=xxx.r2.cloudflarestorage.com
```

### Vercel settings:
- Framework: Next.js
- Build command: `next build`
- Output directory: `.next`
- Node version: 20.x

### Estimated costs (1000 sessions/month):
| Service | Cost |
|---------|------|
| Gemini API (2 calls × 1000) | ~$5-10 |
| Cloudflare R2 (3 images × 1000 × 500KB) | ~$0.50 |
| Vercel (Hobby/Pro) | $0-20 |
| **Total** | **$5-30/month** |

---

## 11. Budoucí rozšíření

1. **Auto-place (varianta B):** Gemini navrhne pozice automaticky, user jen schválí
2. **XML feed parser:** Napojení na eHub/Bonami pro živý katalog
3. **Iterace:** "Posuň pohovku doleva" → re-render
4. **Sharing:** Unikátní URL pro sdílení návrhu
5. **Objednávka:** Košík s affiliate linky → checkout flow
6. **Montáž:** Napojení na SuperSoused/hodinový manžel7.  **Concierge Chat:** Chatbot, který pomáhá s výběrem ("Ukaž mi levnější variantu")