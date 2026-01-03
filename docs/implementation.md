# Vybaveno — Implementační Roadmapa

## Přehled

Tento dokument definuje fáze implementace MVP aplikace Vybaveno. Cílem je vytvořit funkční AI-powered nástroj pro virtuální staging interiérů s napojením na reálný katalog nábytku.

**Zodpovědný model:** Gemini 3 Flash (`gemini-3-flash-preview`)

---

## Fáze 0: Příprava prostředí (Sprint 0)

**Cíl:** Funkční dev prostředí s Next.js a Gemini API.
**Thinking Level:** LOW (scaffolding, konfigurace)

### 0.1 Next.js 14 Setup
```bash
cd /home/vybaveno/project
npx create-next-app@latest www --typescript --tailwind --app --src-dir --import-alias "@/*"
```

**Konfigurace:**
- TypeScript: strict mode
- ESLint + Prettier
- App Router (ne Pages)
- `/www/src/app/` struktura

### 0.2 Závislosti
```bash
cd www
npm install @google/generative-ai zustand clsx tailwind-merge
npm install -D @types/node
npx shadcn-ui@latest init
```

**Shadcn komponenty k instalaci:**
- button, input, slider, card, separator, dialog

### 0.3 Gemini Client Setup

**Soubor:** `www/src/lib/gemini-client.ts`
```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY není nastaven");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const geminiFlash = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  generationConfig: {
    temperature: 0.4,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  },
});
```

### 0.4 Cloudflare R2 Setup

**Soubor:** `www/src/lib/storage.ts`
```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadImage(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
```

### 0.5 Supabase Setup

**Soubor:** `www/src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**Schema:** `supabase/schema.sql`
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_image_url TEXT NOT NULL,
  analysis JSONB,
  user_preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  dimensions_cm JSONB NOT NULL,
  color TEXT,
  material TEXT,
  price_czk INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,
  description_visual TEXT
);

CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  image_url TEXT NOT NULL,
  prompt_used TEXT,
  products_used TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 0.6 Docker Compose

**Soubor:** `docker-compose.yml`
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: vybaveno_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 0.7 Environment Variables

**Soubor:** `.env.example`
```bash
# Gemini AI
GEMINI_API_KEY=your_key_here

# Cloudflare R2
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET_NAME=vybaveno
R2_PUBLIC_URL=https://vybaveno.r2.dev

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Deliverables:**
- ✅ `www/` - funkční Next.js app
- ✅ `docker-compose.yml` - lokální PostgreSQL
- ✅ `.env.example` - kompletní šablona
- ✅ `lib/gemini-client.ts` - ready to use
- ✅ `lib/storage.ts` - R2 upload funkce
- ✅ `lib/supabase.ts` - DB klient

---

## Fáze 1: Onboarding Flow (Sprint 1)

**Cíl:** Uživatel může nahrát fotku a nakonfigurovat preference.
**Thinking Level:** MEDIUM (UI komponenty s business logikou)

### 1.1 UploadZone komponenta

**Soubor:** `www/src/components/UploadZone.tsx`

**Props:**
```typescript
interface UploadZoneProps {
  onUpload: (imageDataUrl: string, file: File) => void;
  uploadedImage: string | null;
}
```

**Funkce:**
- Drag & drop pro desktop
- File input fallback
- Camera capture pro mobil (HTML5 `capture="environment"`)
- Detekce mobilního zařízení (`window.innerWidth < 768` nebo User-Agent)
- Preview nahraného obrázku
- Tlačítko pro smazání a opětovný upload

**Styling:**
- Brand colors: `#F0E8D9` (sand) pozadí, `#7C8F80` (sage) border
- Border-dashed při drag over
- Min height 280px
- Responzivní: Stack buttons vertikálně na mobilu

**Instrukce pro uživatele (zobrazit v komponentě):**
> "Foťte **z rohu místnosti** – zachytíte tak co nejvíce stěn.  
> Držte telefon **vodorovně** a ve výšce očí.  
> Ideálně při **denním světle**, bez záblesku."

### 1.2 Mobilní detekce

**Soubor:** `www/src/lib/device.ts`
```typescript
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth < 768 ||
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  );
}
```

### 1.3 Upload API endpoint

**Soubor:** `www/src/app/api/upload/route.ts`

**Input:**
```typescript
// FormData s:
// - file: File (image/*)
```

**Output:**
```typescript
{
  sessionId: string;
  imageUrl: string;
}
```

**Logika:**
1. Validace: je to obrázek? max 10MB?
2. Generuj `sessionId` (nanoid)
3. Upload do R2: `sessions/${sessionId}/original.jpg`
4. Vytvoř záznam v `sessions` tabulce
5. Vrať sessionId a public URL

**Error handling:**
- 400 Bad Request: Není obrázek / příliš velký
- 500 Internal: Upload failed

### 1.4 RoomTypeSelector komponenta

**Soubor:** `www/src/components/RoomTypeSelector.tsx`

**Props:**
```typescript
interface RoomTypeSelectorProps {
  selected: string | null;
  onSelect: (roomType: string) => void;
  probabilities?: Record<string, number>; // AI predikce
}
```

**Typy pokojů:**
```typescript
const ROOM_TYPES = {
  living: { label: 'Obývací pokoj', icon: '🛋️' },
  bedroom: { label: 'Ložnice', icon: '🛏️' },
  kids: { label: 'Dětský pokojíček', icon: '🧸' },
  office: { label: 'Pracovna', icon: '💼' },
  other: { label: 'Jiné', icon: '🏠' },
};
```

**Styling:**
- Grid 2 sloupce (mobil) / 5 sloupců (desktop)
- Selected: sage (#7C8F80) pozadí, bílý text, shadow
- Unselected: bílé pozadí, charcoal text
- Pokud `probabilities` > 0.3, zobrazit badge s %

### 1.5 ColorPicker komponenta

**Soubor:** `www/src/components/ColorPicker.tsx`

**Props:**
```typescript
interface ColorPickerProps {
  color: string; // hex
  onChange: (newColor: string) => void;
  label: string; // "Primární" / "Doplňková"
}
```

**Funkce:**
- Barevný obdélník (16×16 mobil, 20×20 desktop)
- Glossy efekt: `linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)`
- Box shadow: `0 4px 12px ${color}40`
- Hex hodnota v rohu: 8px font, opacity 0.5, textShadow
- Při kliku: zobrazit native `<input type="color">`
- Option: Editovat hex ručně (validace `/^#[0-9A-Fa-f]{6}$/`)

**Preset palety (volitelně):**
```typescript
const PRESETS = [
  { primary: '#E8DDD4', secondary: '#7C8F80' },
  { primary: '#F5EBE0', secondary: '#C87F69' },
];
```

### 1.6 PriceSlider s logaritmickou škálou

**Soubor:** `www/src/components/PriceSlider.tsx`

**Props:**
```typescript
interface PriceSliderProps {
  value: number; // Kč
  onChange: (newValue: number) => void;
}
```

**Rozsah:** 5 000 Kč - 150 000 Kč

**Logaritmická konverze:**
```typescript
const MIN = 5000, MAX = 150000;
const logMin = Math.log(MIN);
const logMax = Math.log(MAX);

const sliderToPrice = (s: number) => {
  const log = logMin + (s / 100) * (logMax - logMin);
  return Math.round(Math.exp(log) / 1000) * 1000; // zaokrouhlit na tisíce
};

const priceToSlider = (p: number) => {
  return ((Math.log(p) - logMin) / (logMax - logMin)) * 100;
};
```

**Styling:**
- Gradient track: `linear-gradient(to right, sage 0%, sage ${percent}%, sand ${percent}%, sand 100%)`
- Thumb: terracotta (#C87F69), 24px, box-shadow
- Zobrazit cenu: `new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' })`

### 1.7 Session persistence

**Soubor:** `www/src/app/page.tsx` (Landing page)

**State management:**
```typescript
const [sessionId, setSessionId] = useState<string | null>(null);
const [uploadedImage, setUploadedImage] = useState<string | null>(null);
const [roomType, setRoomType] = useState<string | null>(null);
const [colors, setColors] = useState({ primary: '#F0E8D9', secondary: '#7C8F80' });
const [budget, setBudget] = useState(25000);
```

**Uložení do Supabase:**
```typescript
await supabase.from('sessions').update({
  user_preferences: { roomType, colors, budget }
}).eq('id', sessionId);
```

**Deliverables:**
- ✅ Funkční landing page s uploadem
- ✅ Konfigurační panel (typ, barvy, rozpočet)
- ✅ Session ID + persistence
- ✅ Mobile-first, responzivní design

---

## Fáze 2: AI Analýza (Sprint 2)

**Cíl:** Gemini 3 Flash analyzuje fotku a vrací strukturovaná data.
**Thinking Level:** HIGH (komplexní AI reasoning, prompt engineering)

### 2.1 Gemini Client (již v Fázi 0)

Pokud ještě není, doplnit do `www/src/lib/gemini-client.ts`

### 2.2 Analysis Prompt

**Soubor:** `www/src/lib/prompts/analysis.ts`

**Thinking Level pro tento prompt:** HIGH

```typescript
import { SchemaType } from "@google/generative-ai";

export const ANALYSIS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    room_type_probabilities: {
      type: SchemaType.OBJECT,
      properties: {
        living: { type: SchemaType.NUMBER },
        bedroom: { type: SchemaType.NUMBER },
        kids: { type: SchemaType.NUMBER },
        office: { type: SchemaType.NUMBER },
        other: { type: SchemaType.NUMBER },
      },
      required: ["living", "bedroom", "kids", "office", "other"],
    },
    geometry: {
      type: SchemaType.OBJECT,
      properties: {
        shape: { type: SchemaType.STRING },
        estimated_dimensions: {
          type: SchemaType.OBJECT,
          properties: {
            width_m: { type: SchemaType.NUMBER },
            depth_m: { type: SchemaType.NUMBER },
            height_m: { type: SchemaType.NUMBER },
          },
        },
        confidence: {
          type: SchemaType.STRING,
          enum: ["high", "medium", "low"],
        },
      },
      required: ["shape", "estimated_dimensions", "confidence"],
    },
    architectural_features: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Windows, doors, columns - exact positions",
    },
    lighting: {
      type: SchemaType.OBJECT,
      properties: {
        source_direction: { type: SchemaType.STRING },
        intensity: { type: SchemaType.STRING },
        color_temperature: { type: SchemaType.STRING },
      },
    },
    surfaces: {
      type: SchemaType.OBJECT,
      properties: {
        floor_material: { type: SchemaType.STRING },
        floor_color: { type: SchemaType.STRING },
        wall_color: { type: SchemaType.STRING },
        wall_condition: { type: SchemaType.STRING },
      },
    },
    suggested_colors: {
      type: SchemaType.OBJECT,
      properties: {
        primary: { type: SchemaType.STRING, description: "Hex color" },
        secondary: { type: SchemaType.STRING, description: "Hex color" },
        reasoning: { type: SchemaType.STRING },
      },
    },
  },
  required: [
    "room_type_probabilities",
    "geometry",
    "architectural_features",
    "lighting",
    "surfaces",
    "suggested_colors",
  ],
};

export const ANALYSIS_PROMPT = `
You are an expert interior designer and architectural analyst.

Analyze this room photograph in extreme detail for a virtual staging application.
Your analysis will be used to:
1. Determine room type and purpose
2. Understand spatial geometry for furniture placement
3. Identify lighting conditions for realistic rendering
4. Suggest color palette that complements the space

## CRITICAL REQUIREMENTS:

### Room Type Classification
Estimate probability (0.0-1.0) for each category:
- **living**: Living room, sitting area
- **bedroom**: Adult bedroom, master bedroom
- **kids**: Children's room, nursery
- **office**: Home office, study
- **other**: Kitchen, bathroom, hallway, etc.

Base on: furniture (if any), size, windows, flooring.

### Geometry Analysis
- Estimate dimensions using reference objects (windows ~120-150cm, doors ~80-90cm, ceiling ~260-280cm)
- Identify room shape (rectangular, L-shaped, irregular)
- Note camera angle and perspective

### Architectural Features (PRESERVE IN FUTURE EDITS)
List EXACT positions of:
- Windows (which wall, approximate center position)
- Doors (which wall, leading where)
- Built-in features (columns, alcoves, radiators)

Example: "Large window on right wall, centered, ~150cm wide"

### Lighting Analysis
- Identify primary light source (natural/artificial, direction)
- Shadow direction and intensity
- Color temperature (warm/neutral/cool)

### Color Suggestions
Based on:
- Existing wall/floor colors
- Room type and purpose
- Lighting conditions

Suggest:
- Primary color (dominant, for walls/large furniture)
- Secondary color (accent, for textiles/decor)
- Both as HEX codes (#RRGGBB)
- Brief reasoning (1 sentence)

## OUTPUT FORMAT:
Return valid JSON matching the schema exactly.
Be precise with measurements and positions - they will guide AI furniture placement.
`;
```

### 2.3 Analyze API endpoint

**Soubor:** `www/src/app/api/analyze/route.ts`

**Input:**
```typescript
// Query params:
// - sessionId: string
```

**Process:**
1. Načti session z Supabase (`sessions` tabulka)
2. Stáhni obrázek z R2 (nebo čti z Supabase pole `original_image_url`)
3. Převeď na base64
4. Volej Gemini s `ANALYSIS_PROMPT` a `ANALYSIS_SCHEMA`
5. Parsuj JSON odpověď
6. Ulož do `sessions.analysis` (JSONB)
7. Vrať analýzu klientovi

**Gemini konfigurace pro analýzu:**
```typescript
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  generationConfig: {
    temperature: 0.3, // Nižší než default - chceme konzistentní analýzu
    responseMimeType: "application/json",
    responseSchema: ANALYSIS_SCHEMA,
  },
});

const result = await model.generateContent([
  ANALYSIS_PROMPT,
  {
    inlineData: {
      mimeType: "image/jpeg",
      data: imageBase64,
    },
  },
]);
```

**Output:**
```typescript
{
  success: true;
  analysis: {
    room_type_probabilities: { ... };
    geometry: { ... };
    // ... celý objekt podle schématu
  };
}
```

**Error handling:**
- 404: Session not found
- 400: Invalid image
- 500: Gemini API error
- 503: Rate limit (retry za 1s)

### 2.4-2.7 Integrace do UI

**Soubor:** `www/src/app/page.tsx`

**Flow po uploadu:**
```typescript
const handleImageUpload = async (imageDataUrl: string, file: File) => {
  setIsAnalyzing(true);
  
  // 1. Upload
  const uploadRes = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  const { sessionId, imageUrl } = await uploadRes.json();
  setSessionId(sessionId);
  setUploadedImage(imageUrl);
  
  // 2. Analyze
  const analyzeRes = await fetch(`/api/analyze?sessionId=${sessionId}`);
  const { analysis } = await analyzeRes.json();
  
  // 3. Apply AI suggestions
  const topRoomType = Object.entries(analysis.room_type_probabilities)
    .sort(([,a], [,b]) => b - a)[0][0];
  setRoomType(topRoomType);
  setRoomProbabilities(analysis.room_type_probabilities);
  
  setColors({
    primary: analysis.suggested_colors.primary,
    secondary: analysis.suggested_colors.secondary,
  });
  
  setIsAnalyzing(false);
  setStep('configure');
};
```

**Loading state:**
- Zobrazit spinner + "Analyzuji místnost..."
- Typicky 3-5 sekund

**Deliverables:**
- ✅ Funkční Gemini analýza
- ✅ Strukturovaný JSON output
- ✅ Auto-fill konfigurace (typ pokoje, barvy)
- ✅ Uložená analýza v session

---

## Fáze 3: Katalog produktů (Sprint 3)

**Cíl:** Funkční katalog IKEA produktů s vyhledáváním.
**Thinking Level:** MEDIUM (business logika, komponenty)

### 3.1 Supabase schema (již v Fázi 0)

Tabulka `products` již definována.

### 3.2 Seed data - IKEA produkty

**Soubor:** `supabase/seed-products.sql`

**Minimální sada (20+ produktů):**
- 4× Pohovky (různé velikosti, barvy)
- 3× Křesla
- 3× Konferenční stolky
- 2× Skříňky/komody
- 2× Koberce
- 2× Závěsy
- 2× Lampy (stojanové)
- 2× Dekorace (polštáře, rostliny)

**Klíčová pole pro každý produkt:**
```sql
INSERT INTO products VALUES (
  'jattebo-4seat-blue',
  'JÄTTEBO 4-místná pohovka s lenoškou',
  'IKEA',
  'sofa',
  '{"width": 290, "depth": 95, "height": 80}'::jsonb,
  'dark blue velvet',
  'velvet upholstery, solid wood frame',
  44990,
  'https://www.ikea.com/cz/cs/images/products/jattebo-4mistna-pohovka__xxx.jpg',
  'https://www.ikea.com/cz/cs/p/jaettebo-4mistny-pohovka-s-lenoskou-samsala-tmave-modra-s59429039/',
  'Dark blue modular sofa with low profile, plush velvet texture, visible wooden legs in natural oak finish. Modern Scandinavian design.'
);
```

**description_visual je KRITICKÉ** - Gemini ho použije pro accurate rendering.

Formát: `[Color] [material] [furniture type] with [distinctive features]. [Style].`

### 3.3 Products API

**Soubor:** `www/src/app/api/products/route.ts`

**Query params:**
```typescript
{
  category?: 'sofa' | 'table' | 'chair' | 'storage' | 'rug' | 'curtain' | 'decor' | 'lamp';
  search?: string;
  budget?: number; // max cena v Kč
  limit?: number; // default 50
}
```

**SQL Query (Supabase):**
```typescript
let query = supabase.from('products').select('*');

if (category) {
  query = query.eq('category', category);
}

if (search) {
  query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%`);
}

if (budget) {
  query = query.lte('price_czk', budget);
}

query = query.limit(limit || 50).order('price_czk', { ascending: true });

const { data, error } = await query;
```

**Output:**
```typescript
{
  products: Product[];
  total: number;
}
```

### 3.4 ProductCatalog komponenta

**Soubor:** `www/src/components/ProductCatalog.tsx`

**Props:**
```typescript
interface ProductCatalogProps {
  budget: number;
  onProductSelect?: (product: Product) => void;
  mode: 'browse' | 'select'; // browse: jen zobrazit, select: kliknutelné
}
```

**Layout:**
```
┌─────────────────────────────────────────┐
│ [🔍 Hledat...]  [Kategorie ▼]         │
├─────────────────────────────────────────┤
│                                         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│  │ 🛋️ │ │ 🪑 │ │ 🛏️ │ │ 💡 │ ...     │
│  └────┘ └────┘ └────┘ └────┘          │
│                                         │
│  Grid produktů (responsive)             │
│  ┌─────┐ ┌─────┐ ┌─────┐              │
│  │ IMG │ │ IMG │ │ IMG │              │
│  │Name │ │Name │ │Name │              │
│  │Price│ │Price│ │Price│              │
│  └─────┘ └─────┘ └─────┘              │
│                                         │
└─────────────────────────────────────────┘
```

**State:**
```typescript
const [category, setCategory] = useState<string | null>(null);
const [search, setSearch] = useState('');
const [products, setProducts] = useState<Product[]>([]);
```

**Fetch produkty:**
```typescript
useEffect(() => {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (search) params.set('search', search);
  params.set('budget', String(budget));
  
  fetch(`/api/products?${params}`)
    .then(r => r.json())
    .then(data => setProducts(data.products));
}, [category, search, budget]);
```

**Kategorie tlačítka:**
- Emoji ikony (🛋️ sofa, 🪑 chair, etc.)
- Horizontální scroll na mobilu
- Active state: sage pozadí

### 3.5 ProductCard komponenta

**Soubor:** `www/src/components/ProductCard.tsx`

**Props:**
```typescript
interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  selectable?: boolean;
}
```

**Layout:**
```tsx
<div className="rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition">
  {/* Obrázek 1:1 ratio */}
  <div className="aspect-square relative">
    <img src={product.image_url} alt={product.name} className="object-cover" />
  </div>
  
  {/* Info */}
  <div className="p-3">
    <p className="text-xs text-gray-500">{product.brand}</p>
    <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
    <p className="text-lg font-semibold text-sage mt-1">
      {formatPrice(product.price_czk)}
    </p>
    <p className="text-xs text-gray-400">
      {product.dimensions_cm.width}×{product.dimensions_cm.depth} cm
    </p>
  </div>
</div>
```

**Styling:**
- Hover: scale-102, shadow-md
- Active/selected: border-2 border-terracotta

### 3.6 Horizontal Slider (pro Studio režim)

**Soubor:** `www/src/components/ProductSlider.tsx`

**Props:**
```typescript
interface ProductSliderProps {
  products: Product[];
  onDragStart: (product: Product, e: React.DragEvent) => void;
}
```

**Layout:**
- Horizontální scroll (overflow-x-auto)
- Drag & drop support (HTML5 Drag API)
- Touch-friendly: min 60px výška na mobilu

**Drag implementation:**
```typescript
const handleDragStart = (product: Product, e: React.DragEvent) => {
  e.dataTransfer.setData('application/json', JSON.stringify(product));
  e.dataTransfer.effectAllowed = 'copy';
};
```

**Deliverables:**
- ✅ 20+ IKEA produktů v DB
- ✅ Funkční API s filtrací
- ✅ ProductCatalog komponenta
- ✅ ProductCard komponenta
- ✅ Horizontální slider pro drag & drop

---

## Fáze 4: AI Generování (Sprint 4)

**Cíl:** Gemini 3 Flash vloží nábytek do fotky.
**Thinking Level:** HIGH (komplexní multimodální AI, kritický pro kvalitu)

### 4.1 Inpainting Prompt

**Soubor:** `www/src/lib/prompts/inpainting.ts`

**Thinking Level:** HIGH + `thinkingLevel: "high"` v Gemini config

```typescript
export function buildInpaintingPrompt(
  analysis: RoomAnalysis,
  products: Array<{ product: Product; instruction: string }>,
  preferences?: UserPreferences
): string {
  const styleContext = preferences
    ? `Room type: ${preferences.roomType}. Preferred color palette: ${preferences.colors.primary} and ${preferences.colors.secondary}.`
    : "";

  const productList = products
    .map((p, i) => {
      return `
${i + 1}. ${p.product.name}
   - Visual: ${p.product.description_visual}
   - Dimensions: ${p.product.dimensions_cm.width}×${p.product.dimensions_cm.depth}×${p.product.dimensions_cm.height} cm
   - Placement: ${p.instruction}
      `;
    })
    .join("\n");

  return `
You are an expert photo editor specializing in architectural visualization and interior staging.

## TASK: SURGICAL PHOTO EDITING

Edit the provided room photograph by inserting specific furniture items.
This is a MODIFICATION task, NOT a full regeneration.

---

## ROOM CONTEXT (from previous analysis)

**Geometry:**
- Shape: ${analysis.geometry.shape}
- Dimensions: ${analysis.geometry.estimated_dimensions.width_m}m × ${analysis.geometry.estimated_dimensions.depth_m}m
- Height: ${analysis.geometry.estimated_dimensions.height_m}m

**Architecture (DO NOT MODIFY):**
${analysis.architectural_features.map((f) => `- ${f}`).join("\n")}

**Lighting:**
- Source: ${analysis.lighting.source_direction}
- Intensity: ${analysis.lighting.intensity}
- Temperature: ${analysis.lighting.color_temperature}

**Surfaces:**
- Floor: ${analysis.surfaces.floor_material}, ${analysis.surfaces.floor_color}
- Walls: ${analysis.surfaces.wall_color}, ${analysis.surfaces.wall_condition}

**Design Context:**
${styleContext}

---

## FURNITURE TO INSERT

${productList}

---

## CRITICAL CONSTRAINTS

### PRESERVE EXACTLY:
1. **Camera angle and perspective** - Do not change viewpoint
2. **All architectural features** - Windows, doors, walls, columns stay in EXACT positions
3. **Floor and wall surfaces** - Keep existing materials and colors
4. **Lighting direction** - Shadows must match ${analysis.lighting.source_direction}

### MODIFY:
1. **Insert furniture** at specified locations
2. **Cast realistic shadows** consistent with room lighting
3. **Scale furniture** correctly based on room dimensions
4. **Blend furniture** naturally into the photograph (match lighting, color temperature)

### QUALITY REQUIREMENTS:
1. **Photorealistic** - Output must look like a real photograph, not a 3D render
2. **Accurate scale** - Use room height (${analysis.geometry.estimated_dimensions.height_m}m) as reference
3. **Consistent perspective** - Furniture must match camera angle
4. **Natural integration** - No cut-and-paste appearance, smooth blending

---

## OUTPUT:
A single edited photograph with furniture naturally integrated into the scene.
The room's architecture must remain completely unchanged.
`;
}
```

### 4.2 Generate API endpoint

**Soubor:** `www/src/app/api/generate/route.ts`

**Input:**
```typescript
{
  sessionId: string;
  products: Array<{
    productId: string;
    instruction: string; // "place near the window", "center of the room", etc.
  }>;
  mode?: 'auto' | 'manual'; // auto = AI decides placement, manual = user specified
}
```

**Process:**
1. Načti session (analýza, původní obrázek, preferences)
2. Načti produkty z DB
3. Stáhni původní obrázek z R2
4. Převeď na base64
5. Pro každý produkt: stáhni referenční obrázek (product.image_url)
6. Build prompt
7. Volej Gemini s multimodálním vstupem
8. Ulož výsledek do R2
9. Vytvoř záznam v `generations` tabulce
10. Vrať URL

**Gemini konfigurace pro generování:**
```typescript
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  generationConfig: {
    temperature: 0.4, // Balance mezi kreativitou a přesností
    topP: 0.95,
    maxOutputTokens: 8192,
  },
});

const parts = [
  { text: inpaintingPrompt },
  {
    inlineData: {
      mimeType: "image/jpeg",
      data: roomImageBase64,
    },
  },
];

// Přidat referenční obrázky produktů
for (const product of products) {
  parts.push({ text: `Reference image for ${product.name}:` });
  parts.push({
    inlineData: {
      mimeType: "image/jpeg",
      data: productImageBase64,
    },
  });
}

const result = await model.generateContent(parts);
```

**KRITICKÉ:** Gemini 3 Flash vrací text, NE obrázek přímo.
Pro image editing potřebujeme jiný přístup:

**Alternativa (pokud Gemini nevrací obrázek):**
1. Použij Gemini pro generování podrobného textového popisu editů
2. Případně volej externí image editing API (např. Stability AI, nebo použij Imagen 3)

**NEBO:**
Použij Gemini Imagen API (pokud je dostupný v Gemini 3 Flash):
```typescript
const result = await model.generateImage({
  prompt: inpaintingPrompt,
  referenceImages: [roomImage, ...productImages],
});
```

**⚠️ Poznámka pro Gemini 3 Flash (implementátor):**
Pokud model nepodporuje přímé generování obrázků, implementuj fallback:
- Použij Gemini pro analýzu a popis požadovaných změn
- Volej Imagen 3 nebo jiný image generation model
- Případně navrhni alternativní workflow

### 4.3 Multimodální vstup (implementováno v 4.2)

### 4.4 Context Caching

**Použití:**
Pokud uživatel generuje více variant (jiný nábytek, jiné umístění), cachuj:
- Původní obrázek
- Analýzu místnosti

```typescript
const cache = await cacheManager.create({
  model: 'gemini-3-flash-preview',
  contents: [
    { text: `Room context:\n${JSON.stringify(analysis)}` },
    { inlineData: { mimeType: 'image/jpeg', data: roomImageBase64 } },
  ],
  ttlSeconds: 300, // 5 minut
});

// Při dalším generování:
const result = await model.generateContent({
  cachedContent: cache.name,
  contents: [{ text: newInpaintingPrompt }],
});
```

**Úspora:** až 90% vstupních tokenů

### 4.5 Ukládání výsledků

```typescript
// Upload do R2
const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
const imageUrl = await uploadImage(
  `sessions/${sessionId}/generation-${Date.now()}.png`,
  imageBuffer,
  'image/png'
);

// Záznam do DB
await supabase.from('generations').insert({
  session_id: sessionId,
  image_url: imageUrl,
  prompt_used: inpaintingPrompt,
  products_used: products.map(p => p.product.id),
});
```

### 4.6 GenerationResult komponenta

**Soubor:** `www/src/components/GenerationResult.tsx`

**Props:**
```typescript
interface GenerationResultProps {
  originalImage: string;
  generatedImage: string;
  products: Product[];
  onAccept?: () => void;
  onEdit?: () => void;
  onRegenerate?: () => void;
}
```

**Layout:**
```tsx
<div className="space-y-4">
  {/* Before/After Slider */}
  <div className="relative aspect-video rounded-xl overflow-hidden">
    <img src={originalImage} className="absolute inset-0" />
    <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100-sliderPos}% 0 0)` }}>
      <img src={generatedImage} />
    </div>
    <input
      type="range"
      min="0"
      max="100"
      value={sliderPos}
      onChange={(e) => setSliderPos(Number(e.target.value))}
      className="absolute bottom-4 left-4 right-4"
    />
  </div>
  
  {/* Action buttons */}
  <div className="flex gap-2">
    <button onClick={onAccept}>✓ Líbí se mi</button>
    <button onClick={onEdit}>✏️ Upravit</button>
    <button onClick={onRegenerate}>🔄 Znovu</button>
  </div>
  
  {/* Products list */}
  <div className="space-y-2">
    <h3>Použitý nábytek:</h3>
    {products.map(p => (
      <ProductCard key={p.id} product={p} />
    ))}
  </div>
</div>
```

### 4.7 Error Handling

**Retry logika:**
```typescript
async function generateWithRetry(sessionId, products, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({ sessionId, products }),
      });
      
      if (res.ok) return await res.json();
      
      if (res.status === 503) {
        // Rate limit - wait exponentially
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        continue;
      }
      
      throw new Error(`Generation failed: ${res.status}`);
    } catch (err) {
      if (i === maxRetries - 1) throw err;
    }
  }
}
```

**User-facing errors:**
- "Generování se nezdařilo. Zkuste to prosím znovu."
- "Server je přetížený. Zkusím to znovu za chvíli..."
- "Obrázek je příliš složitý. Zkuste jednodušší fotku."

**Deliverables:**
- ✅ Funkční AI generování s multimodálním vstupem
- ✅ Before/After porovnání
- ✅ Retry logika a error handling
- ✅ Context caching pro úsporu nákladů

---

## Fáze 5: Studio Editor (Sprint 5)

**Cíl:** Interaktivní editor pro manuální umístění nábytku.
**Thinking Level:** MEDIUM (interaktivní komponenty, drag & drop)

### 5.1 Studio Route

**Soubor:** `www/src/app/studio/[sessionId]/page.tsx`

**Layout:**
```tsx
export default async function StudioPage({ params }: { params: { sessionId: string } }) {
  const session = await getSession(params.sessionId);
  
  if (!session) notFound();
  
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-lg">Vybaveno Studio</h1>
          <button>💾 Uložit</button>
        </div>
      </header>
      
      {/* Main area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Desktop: Katalog vlevo, Canvas vpravo */}
        {/* Mobile: Katalog nahoře (sticky), Canvas dole */}
        <div className="md:w-80 border-r overflow-y-auto">
          <ProductCatalog mode="select" budget={session.user_preferences?.budget} />
        </div>
        
        <div className="flex-1 relative">
          <ImageCanvas 
            imageUrl={session.original_image_url}
            analysis={session.analysis}
          />
        </div>
      </main>
      
      {/* Bottom bar */}
      <footer className="p-4 border-t bg-white">
        <button className="w-full py-3 bg-terracotta text-white rounded-xl">
          ✨ Vygenerovat návrh
        </button>
      </footer>
    </div>
  );
}
```

### 5.2 ImageCanvas komponenta

**Soubor:** `www/src/components/studio/ImageCanvas.tsx`

**Props:**
```typescript
interface ImageCanvasProps {
  imageUrl: string;
  analysis: RoomAnalysis;
}
```

**State:**
```typescript
const [placedProducts, setPlacedProducts] = useState<PlacedProduct[]>([]);
const [selectedPin, setSelectedPin] = useState<string | null>(null);

interface PlacedProduct {
  id: string; // unique ID for this placement
  product: Product;
  position: { x: number; y: number }; // % of canvas (0-100)
  instruction: string; // auto-generated from position
}
```

**Layout:**
```tsx
<div className="relative w-full h-full">
  {/* Background image */}
  <img 
    src={imageUrl} 
    alt="Room" 
    className="w-full h-full object-contain"
  />
  
  {/* Drop zone overlay */}
  <div 
    className="absolute inset-0"
    onDrop={handleDrop}
    onDragOver={handleDragOver}
  >
    {/* Product pins */}
    {placedProducts.map(pp => (
      <ProductPin
        key={pp.id}
        product={pp.product}
        position={pp.position}
        isSelected={selectedPin === pp.id}
        onSelect={() => setSelectedPin(pp.id)}
        onMove={(newPos) => updatePosition(pp.id, newPos)}
        onRemove={() => removeProduct(pp.id)}
      />
    ))}
  </div>
</div>
```

**Drop handler:**
```typescript
const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  const data = e.dataTransfer.getData('application/json');
  const product: Product = JSON.parse(data);
  
  // Calculate position as % of canvas
  const rect = e.currentTarget.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  
  // Generate instruction from position
  const instruction = generateInstruction(x, y, analysis);
  
  setPlacedProducts(prev => [...prev, {
    id: nanoid(),
    product,
    position: { x, y },
    instruction,
  }]);
};
```

**Instruction generator:**
```typescript
function generateInstruction(x: number, y: number, analysis: RoomAnalysis): string {
  // Simple heuristic based on position
  const horizontal = x < 30 ? 'left side' : x > 70 ? 'right side' : 'center';
  const vertical = y < 30 ? 'near top wall' : y > 70 ? 'near front' : 'middle of room';
  
  // TODO: Smarter logic based on architectural_features
  // e.g., if near window position, say "near the window"
  
  return `Place in ${horizontal}, ${vertical}`;
}
```

### 5.3 ProductPin komponenta

**Soubor:** `www/src/components/studio/ProductPin.tsx`

**Props:**
```typescript
interface ProductPinProps {
  product: Product;
  position: { x: number; y: number };
  isSelected: boolean;
  onSelect: () => void;
  onMove: (newPosition: { x: number; y: number }) => void;
  onRemove: () => void;
}
```

**Layout (map-like marker):**
```tsx
<div
  className={`
    absolute cursor-pointer transition-transform
    ${isSelected ? 'scale-110 z-10' : 'hover:scale-105'}
  `}
  style={{
    left: `${position.x}%`,
    top: `${position.y}%`,
    transform: 'translate(-50%, -100%)', // Center horizontally, anchor at bottom
  }}
  onClick={onSelect}
  draggable
  onDragEnd={handleDragEnd}
>
  {/* Pin icon */}
  <div className="relative">
    {/* Marker body */}
    <div 
      className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
      style={{ backgroundColor: product.marker_color || '#C87F69' }}
    >
      <span className="text-xl">{getCategoryIcon(product.category)}</span>
    </div>
    
    {/* Pointer */}
    <div 
      className="absolute left-1/2 -bottom-1 w-0 h-0"
      style={{
        transform: 'translateX(-50%)',
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: `8px solid ${product.marker_color || '#C87F69'}`,
      }}
    />
    
    {/* Selected ring */}
    {isSelected && (
      <div className="absolute inset-0 -m-1 rounded-full border-2 border-white animate-pulse" />
    )}
  </div>
  
  {/* Label on hover/select */}
  {isSelected && (
    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs whitespace-nowrap">
      {product.name.split(' ').slice(0, 3).join(' ')}
      <button onClick={onRemove} className="ml-2 text-red-500">✕</button>
    </div>
  )}
</div>
```

**Category icons:**
```typescript
function getCategoryIcon(category: string): string {
  const icons = {
    sofa: '🛋️',
    chair: '🪑',
    table: '🪑', // or custom icon
    storage: '🗄️',
    rug: '⬜',
    curtain: '🪟',
    lamp: '💡',
    decor: '🌿',
  };
  return icons[category] || '📦';
}
```

### 5.4 Drag & Drop z katalogu

**Již implementováno v ProductSlider (Fáze 3.6)**

### 5.5 Touch events

**Pro tablet/mobil:**
```typescript
// V ProductPin komponentě
const [isDragging, setIsDragging] = useState(false);
const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

const handleTouchStart = (e: React.TouchEvent) => {
  setIsDragging(true);
  const touch = e.touches[0];
  const rect = e.currentTarget.getBoundingClientRect();
  setDragOffset({
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  });
};

const handleTouchMove = (e: React.TouchEvent) => {
  if (!isDragging) return;
  e.preventDefault();
  
  const touch = e.touches[0];
  const canvas = e.currentTarget.closest('.canvas-container');
  const rect = canvas.getBoundingClientRect();
  
  const newX = ((touch.clientX - rect.left - dragOffset.x) / rect.width) * 100;
  const newY = ((touch.clientY - rect.top - dragOffset.y) / rect.height) * 100;
  
  onMove({ x: newX, y: newY });
};

const handleTouchEnd = () => {
  setIsDragging(false);
};
```

### 5.6 Generate button

**Již v layout (5.1)**

**Akce:**
```typescript
const handleGenerate = async () => {
  setIsGenerating(true);
  
  const response = await fetch('/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      products: placedProducts.map(pp => ({
        productId: pp.product.id,
        instruction: pp.instruction,
      })),
      mode: 'manual',
    }),
  });
  
  const { imageUrl } = await response.json();
  
  // Navigate to result
  router.push(`/studio/${sessionId}/result`);
};
```

### 5.7 Historie návrhů

**Soubor:** `www/src/app/studio/[sessionId]/history/page.tsx`

**Layout:**
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
  {generations.map(gen => (
    <div key={gen.id} className="rounded-lg overflow-hidden shadow">
      <img src={gen.image_url} alt="Návrh" />
      <div className="p-2">
        <p className="text-xs text-gray-500">
          {new Date(gen.created_at).toLocaleString('cs-CZ')}
        </p>
        <button className="text-sm text-sage">Zobrazit</button>
      </div>
    </div>
  ))}
</div>
```

**Deliverables:**
- ✅ Funkční Studio editor s drag & drop
- ✅ ProductPin komponenta s Material Icons
- ✅ Touch support pro tablet/mobil
- ✅ Historie návrhů
- ✅ Generování z editoru

---

## Fáze 6: Polish & Launch (Sprint 6)

**Cíl:** Připravit MVP k prvnímu testování.
**Thinking Level:** LOW-MEDIUM (polish, optimalizace)

### 6.1 Error Boundaries & Loading States

**Soubor:** `www/src/app/error.tsx`
```tsx
'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-sand p-4">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-bold text-charcoal mb-4">Něco se pokazilo</h2>
        <p className="text-gray-600 mb-6">{error.message}</p>
        <button 
          onClick={reset}
          className="px-6 py-3 bg-sage text-white rounded-xl"
        >
          Zkusit znovu
        </button>
      </div>
    </div>
  );
}
```

**Loading states:**
- Upload: "Nahrávám fotku..."
- Analyze: "Analyzuji místnost..." (spinner + progress bar)
- Generate: "Vytvářím návrh..." (cca 5-10s, progress indikátor)

**Komponenta:** `www/src/components/LoadingSpinner.tsx`
```tsx
export function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div 
        className="w-12 h-12 border-4 border-sage border-t-transparent rounded-full animate-spin"
      />
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
}
```

### 6.2 SEO & Meta Tags

**Soubor:** `www/src/app/layout.tsx`
```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vybaveno – Váš pokoj hotový bez práce',
  description: 'Nahrajte fotku pokoje a AI vám navrhne kompletní zařízení včetně montáže. Od chaosu ke klidu.',
  keywords: ['nábytek', 'interiér', 'AI design', 'IKEA', 'montáž nábytku'],
  authors: [{ name: 'Vybaveno' }],
  openGraph: {
    title: 'Vybaveno – Váš pokoj hotový bez práce',
    description: 'AI navrhne váš pokoj za pár minut. Zkuste zdarma.',
    url: 'https://vybaveno.cz',
    siteName: 'Vybaveno',
    images: [
      {
        url: 'https://vybaveno.cz/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vybaveno',
      },
    ],
    locale: 'cs_CZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vybaveno – AI návrhy interiéru',
    description: 'Váš pokoj hotový za pár minut',
    images: ['https://vybaveno.cz/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

**OG Image:**
Vytvořit `public/og-image.png` (1200×630px)
- Logo + tagline
- Before/After příklad

### 6.3 Affiliate Linky

**Již implementováno v Product model (`affiliate_url`)**

**Tracking:**
```tsx
// V ProductCard komponentě
<a 
  href={product.affiliate_url}
  target="_blank"
  rel="noopener noreferrer"
  onClick={() => trackAffiliateClick(product.id)}
  className="text-sage hover:underline"
>
  Koupit na {product.brand}
</a>
```

**Analytics event:**
```typescript
function trackAffiliateClick(productId: string) {
  // Plausible / PostHog event
  if (window.plausible) {
    window.plausible('Affiliate Click', { props: { productId } });
  }
}
```

### 6.4 Share funkce

**Soubor:** `www/src/app/studio/[sessionId]/result/page.tsx`

```tsx
const handleShare = async () => {
  const shareUrl = `${window.location.origin}/share/${sessionId}`;
  
  if (navigator.share) {
    // Native share (mobile)
    await navigator.share({
      title: 'Můj návrh z Vybaveno',
      text: 'Podívej se na můj nový návrh pokoje!',
      url: shareUrl,
    });
  } else {
    // Fallback: Copy to clipboard
    await navigator.clipboard.writeText(shareUrl);
    toast('Odkaz zkopírován!');
  }
};
```

**Share route:**
`www/src/app/share/[sessionId]/page.tsx` - Veřejná stránka s návrhem

### 6.5 Analytics

**Instalace Plausible:**
```tsx
// www/src/app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script 
          defer 
          data-domain="vybaveno.cz" 
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Custom events:**
```typescript
// Upload complete
plausible('Upload Complete');

// Analysis done
plausible('Analysis Complete', { props: { roomType } });

// Generation start
plausible('Generation Start', { props: { productCount: products.length } });

// Generation complete
plausible('Generation Complete', { props: { duration: timeMs } });

// Affiliate click
plausible('Affiliate Click', { props: { productId, brand } });
```

### 6.6 Vercel Deploy

**Soubor:** `vercel.json`
```json
{
  "buildCommand": "cd www && npm run build",
  "outputDirectory": "www/.next",
  "framework": "nextjs",
  "env": {
    "GEMINI_API_KEY": "@gemini-api-key",
    "R2_ENDPOINT": "@r2-endpoint",
    "R2_ACCESS_KEY_ID": "@r2-access-key",
    "R2_SECRET_ACCESS_KEY": "@r2-secret-key",
    "R2_BUCKET_NAME": "@r2-bucket",
    "R2_PUBLIC_URL": "@r2-public-url",
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

**Nastavení secrets:**
```bash
vercel env add GEMINI_API_KEY
vercel env add R2_ENDPOINT
# ... další
```

**Deploy:**
```bash
cd www
vercel --prod
```

**Custom domain:**
- Nastavit `vybaveno.cz` v Vercel dashboard
- DNS: CNAME → `cname.vercel-dns.com`

### 6.7 User Testing

**Checklist:**
- [ ] 5 uživatelů (rodiče s dětmi)
- [ ] Testovat na mobilu + desktopu
- [ ] Měřit:
  - Čas od uploadu po generování
  - % úspěšných generování
  - % kliknutí na affiliate
  - Feedback na kvalitu vizualizací

**Test scénář:**
1. Vyfotit prázdný pokoj (nebo použít stock fotku)
2. Nahrát do aplikace
3. Vybrat typ pokoje a barvy
4. Zkusit "Nechte to na nás" flow
5. Zkusit "Navrhnu sám" flow
6. Hodnotit kvalitu výsledku (1-5 ⭐)
7. Zkusit affiliate link

**Sběr feedbacku:**
Formulář v aplikaci (Tally.so nebo Google Forms)

**Deliverables:**
- ✅ Production-ready aplikace
- ✅ SEO optimalizace
- ✅ Analytics tracking
- ✅ Deploy na vybaveno.cz
- ✅ 5 testovacích uživatelů + feedback

---

## Budoucí fáze (Post-MVP)

| Fáze | Popis |
|------|-------|
| 7 | Auto-place: AI navrhne umístění sama |
| 8 | Napojení na živé XML feedy (Bonami, eHub) |
| 9 | User accounts a uložené návrhy |
| 10 | Objednávkový flow s affiliate košíkem |
| 11 | Napojení na montážní služby (SuperSoused) |

---

## Technické poznámky

### Gemini 3 Flash konfigurace

```typescript
// Doporučené nastavení pro Vybaveno
const config = {
  model: "gemini-3-flash-preview",
  generationConfig: {
    temperature: 0.4,      // Nižší = konzistentnější výstupy
    topP: 0.95,
    maxOutputTokens: 8192,
  },
  thinkingLevel: "medium", // Balance mezi rychlostí a kvalitou
};
```

### Cenový odhad (1000 sessions/měsíc)

| Služba | Cena |
|--------|------|
| Gemini 3 Flash (analýza + 3 generování) | ~$15-25 |
| Cloudflare R2 (5 obrázků × 1000 × 500KB) | ~$0.50 |
| Supabase (Free tier) | $0 |
| Vercel (Pro) | $20 |
| **Celkem** | **~$35-50/měsíc** |

---

*Poslední aktualizace: 2. ledna 2026*
