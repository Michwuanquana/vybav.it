"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UploadZone } from "@/components/UploadZone";
import { RoomTypeSelector } from "@/components/RoomTypeSelector";
import { ColorPicker } from "@/components/ColorPicker";
import { PriceSlider } from "@/components/PriceSlider";
import { ResultsView } from "@/components/ResultsView";
import { AnalysisSpinner } from "@/components/AnalysisSpinner";
import { detectEmptyRoom } from "@/lib/image-heuristics";
import { 
  Loader2, 
  BrainCircuit, 
  Info, 
  ArrowLeft,
  Download,
  Share2,
  Sofa,
  Lamp,
  Table,
  Flower2,
  Armchair,
  Bed,
  Library,
  Image as ImageIcon,
  Maximize,
  Layout,
  Plus,
  CheckCircle2,
  Wand,
  RotateCcw,
  X,
  ShoppingCart,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

const getIconForItem = (item: string) => {
  const lowerItem = item.toLowerCase();
  if (lowerItem.includes("pohovka") || lowerItem.includes("sofa") || lowerItem.includes("gauč")) return Sofa;
  if (lowerItem.includes("lampa") || lowerItem.includes("světlo") || lowerItem.includes("osvětlení")) return Lamp;
  if (lowerItem.includes("stůl") || lowerItem.includes("stolek")) return Table;
  if (lowerItem.includes("rostlina") || lowerItem.includes("květina") || lowerItem.includes("váza")) return Flower2;
  if (lowerItem.includes("křeslo") || lowerItem.includes("židle")) return Armchair;
  if (lowerItem.includes("postel") || lowerItem.includes("matrace")) return Bed;
  if (lowerItem.includes("police") || lowerItem.includes("knihovna") || lowerItem.includes("skříň")) return Library;
  if (lowerItem.includes("obraz") || lowerItem.includes("umění") || lowerItem.includes("dekorace")) return ImageIcon;
  if (lowerItem.includes("zrcadlo")) return Maximize;
  if (lowerItem.includes("koberec")) return Layout;
  return Wand;
};

const DEMO_ANALYSIS = {
  room_type: "Obývací pokoj",
  detected_style: "Skandinávský",
  color_palette: {
    primary: "#F0E8D9",
    secondary: "#7C8F80",
    accent: "#D4A373",
    description: "Teplé neutrální tóny s přírodní zelenou."
  },
  architecture: {
    walls: "Bílá omítka",
    floor_material: "Světlý dub",
    windows: "Velké francouzské okno"
  },
  estimated_dimensions: { width_m: 4.5, length_m: 5.2, height_m: 2.6 },
  furnishing_level: {
    percentage: 20,
    category: "empty",
    detected_items: [],
    missing_essentials: ["pohovka", "stůl"]
  },
  recommendations: [
    { 
      item: "Pohovka", 
      reason: "Pro zútulnění prostoru a vytvoření centra místnosti.", 
      suggested_style: "Moderní", 
      suggested_color: "Šedá",
      priority: 1,
      size_category: "large",
      placement_coordinates: { x: 500, y: 600 }
    },
    { 
      item: "Konferenční stolek", 
      reason: "Doplnění sedací soupravy přírodním prvkem.", 
      suggested_style: "Minimalistický", 
      suggested_color: "Dub",
      priority: 2,
      size_category: "medium",
      placement_coordinates: { x: 500, y: 800 }
    }
  ]
};

const DEMO_PRODUCTS = [
  {
    id: "demo-1",
    name: "Pohovka LANDSKRONA",
    brand: "IKEA",
    price_czk: 14990,
    image_url: "https://www.ikea.com/cz/cs/images/products/landskrona-trojmistna-pohovka-gunnared-svetle-seda-kov__0602115_pe680184_s5.jpg",
    affiliate_url: "#",
    style_tags: ["skandinávský", "moderní"],
    material: "Textil",
    color: "Světle šedá"
  },
  {
    id: "demo-2",
    name: "Stolek LISTERBY",
    brand: "IKEA",
    price_czk: 3490,
    image_url: "https://www.ikea.com/cz/cs/images/products/listerby-konferencni-stolek-dubova-dyha__0720753_pe732835_s5.jpg",
    affiliate_url: "#",
    style_tags: ["skandinávský", "přírodní"],
    material: "Dub",
    color: "Přírodní"
  }
];

interface HomeClientProps {
  dict: any;
  lang: string;
  initialSessionId?: string;
  initialSessionData?: any;
}

export default function HomeClient({ dict, lang, initialSessionId, initialSessionData }: HomeClientProps) {
  const router = useRouter();
  const [uploadedImage, setUploadedImage] = useState<string | null>(initialSessionData?.imageUrl || null);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAlreadyAnalyzed, setIsAlreadyAnalyzed] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Results state
  const [analysisResult, setAnalysisResult] = useState<any>(initialSessionData?.analysis || null);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Product popup state
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<any | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);

  // Preferences state
  const [roomType, setRoomType] = useState<string | null>(initialSessionData?.room_type || "living");
  const [colors, setColors] = useState({ primary: "#F0E8D9", secondary: "#7C8F80" });
  const [budget, setBudget] = useState(() => {
    const sessionBudget = initialSessionData?.budget;
    return (sessionBudget && sessionBudget > 0) ? sessionBudget : 45000;
  });
  const [showAllMarkers, setShowAllMarkers] = useState(false);
  const [isEmptyRoom, setIsEmptyRoom] = useState(false);
  const [showAnalysisSuccess, setShowAnalysisSuccess] = useState(false);
  
  // Demo retry state
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoRetryCount, setDemoRetryCount] = useState(0);
  const MAX_DEMO_RETRIES = 3;

  const findProductForRecommendation = (itemKeyword: string) => {
    if (!recommendedProducts || recommendedProducts.length === 0) return null;
    const kw = itemKeyword.toLowerCase();
    
    // Mapování anglických klíčových slov na české pro lepší shodu v demo/produktech
    const translations: Record<string, string> = {
      'sofa': 'pohovka',
      'couch': 'pohovka',
      'table': 'stůl',
      'coffee table': 'stolek',
      'chair': 'židle',
      'bed': 'postel',
      'desk': 'stůl',
      'lamp': 'lampa',
      'shelf': 'police',
      'rug': 'koberec',
      'cabinet': 'skříň',
      'tv cabinet': 'tv stolek'
    };

    const translatedKw = translations[kw] || kw;

    // Prioritizujeme shodu v názvu, pak v kategoriích/tagách
    const matches = recommendedProducts.filter(p => 
      p.name.toLowerCase().includes(translatedKw) || 
      p.name.toLowerCase().includes(kw) ||
      (p.style_tags && p.style_tags.some((t: string) => t.toLowerCase().includes(translatedKw) || t.toLowerCase().includes(kw)))
    );

    if (matches.length > 0) {
      // Pokud máme více shod, zkusíme najít tu nejlepší (např. "stolek" vs "stůl")
      const bestMatch = matches.find(p => p.name.toLowerCase().includes(translatedKw)) || matches[0];
      return bestMatch;
    }

    // Pokud nenajdeme shodu, raději nevracet nic (user request: ať nenabízí špatné věci)
    if (recommendedProducts.length > 0) {
      console.log(`UI: No specific match found for "${itemKeyword}". Results: ${recommendedProducts.length}`);
    }
    return null;
  };

  const handleMarkerClick = (product: any, recommendation: any) => {
    setSelectedProduct(product);
    setSelectedRecommendation(recommendation);
  };

  // Note: Full design generation removed - will be implemented later

  // Debounce logic for updates
  const handleUpdateProducts = async () => {
    console.log("Updating products based on current filters...");
    try {
      const recommendRes = await fetch("/api/products/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style: analysisResult?.detected_style || "Modern",
          room: roomType,
          budget: budget,
          recommendations: analysisResult?.recommendations || [],
          contextual_queries: analysisResult?.contextual_queries || [],
          limit: 50
        }),
      });
      
      if (recommendRes.ok) {
        const products = await recommendRes.json();
        setRecommendedProducts(products);
      }
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  // Initial load
  useEffect(() => {
    handleUpdateProducts();
  }, []);

  // Auto-start analysis pokud je session načtena z URL ale ještě není analyzována
  useEffect(() => {
    if (initialSessionId && uploadedImage && !analysisResult && !isSaving && !isUploading) {
      console.log("Auto-starting analysis for session:", initialSessionId);
      handleAnalyze(initialSessionId);
    }
  }, [initialSessionId, uploadedImage, analysisResult]);

  const handleUpload = async (imageDataUrl: string, file: File) => {
    setIsUploading(true);
    setAnalysisResult(null);
    setRecommendedProducts([]);
    setIsEmptyRoom(false);
    
    // Detekce demo mode podle názvu souboru
    const isDemo = file.name.startsWith('demo-');
    setIsDemoMode(isDemo);
    if (isDemo) {
      setDemoRetryCount(0);
    }
    
    try {
      setHasError(false);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        setHasError(true);
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      setUploadedImage(data.imageUrl);
      setIsAlreadyAnalyzed(!!data.isAnalyzed);
      
      // Redirect na URL se session ID
      router.push(`/${lang}/room/${data.sessionId}`);
      
      // Lokální heuristika pro prázdnou místnost
      const empty = await detectEmptyRoom(imageDataUrl);
      setIsEmptyRoom(empty);
      
      // UKONČIT UPLOAD FÁZI ZDE - aby se zobrazila fotka a spodní loader
      setIsUploading(false);

      // Auto-start analysis po redirectu se provede v useEffect
      
    } catch (error: any) {
      console.error("Upload/Analysis error:", error);
      setHasError(true);
      setIsUploading(false);
    }
  };

  // Pomocná funkce pro převod dataUrl na File
  const dataUrlToFile = (dataUrl: string, filename: string): File => {
    const [header, base64Data] = dataUrl.split(',');
    const mimeMatch = header.match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new File([new Blob([bytes], { type: mimeType })], filename, { type: mimeType });
  };

  // Funkce pro automatické retry s novým demo obrázkem
  const retryWithNewDemo = async () => {
    console.log(`Demo retry: Attempt ${demoRetryCount + 1}/${MAX_DEMO_RETRIES}`);
    setDemoRetryCount(prev => prev + 1);
    setHasError(false);
    setIsSaving(true);
    
    try {
      // 1. Stáhneme nový náhodný obrázek
      const response = await fetch('/api/demo/random');
      if (!response.ok) throw new Error('Failed to fetch new demo image');
      
      const data = await response.json();
      if (!data.success || !data.dataUrl) throw new Error('No image data');
      
      console.log(`Demo retry: Got new image "${data.keyword}"`);
      
      // 2. Nahrajeme nový obrázek
      const file = dataUrlToFile(data.dataUrl, `demo-retry-${Date.now()}.jpg`);
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");

      const uploadData = await uploadResponse.json();
      setSessionId(uploadData.sessionId);
      setUploadedImage(uploadData.imageUrl);
      
      // 3. Spustíme analýzu
      await handleAnalyze(uploadData.sessionId);
      
    } catch (error) {
      console.error("Demo retry error:", error);
      
      // Pokud ještě máme pokusy, zkusíme znovu
      if (demoRetryCount + 1 < MAX_DEMO_RETRIES) {
        console.log("Retrying with another image...");
        await retryWithNewDemo();
      } else {
        console.error("All demo retries exhausted");
        setHasError(true);
        setIsSaving(false);
      }
    }
  };

  const handleAnalyze = async (currentSessionId: string) => {
    setIsSaving(true);
    setHasError(false);
    try {
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId: currentSessionId, 
          roomType,
          lang: lang 
        }),
      });

      if (!analyzeRes.ok) {
        throw new Error("Analysis failed");
      }
      
      const analysis = await analyzeRes.json();
      console.log("Analysis result from API:", JSON.stringify(analysis, null, 2));
      console.log("Recommendations with coordinates:", analysis.recommendations?.filter((r: any) => r.placement_coordinates));
      setAnalysisResult(analysis);
      
      // Reset demo retry count on success
      setDemoRetryCount(0);

      // Nový tříúrovňový algoritmus doporučování přes POST
      const recommendRes = await fetch("/api/products/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style: analysis.detected_style,
          room: roomType,
          budget: budget,
          recommendations: analysis.recommendations,
          contextual_queries: analysis.contextual_queries,
          furnishing_level: analysis.furnishing_level?.percentage || 50,
          focus_area: analysis.focus_area || 'full_room',
          limit: 50
        }),
      });
      
      if (recommendRes.ok) {
        const products = await recommendRes.json();
        setRecommendedProducts(products);
      }
      
      // Úspěšná analýza - zobrazíme notifikaci
      setShowAnalysisSuccess(true);
      setTimeout(() => setShowAnalysisSuccess(false), 3000);
      
    } catch (error) {
      console.error("Analysis error:", error);
      
      // V demo módu automaticky zkusíme nový obrázek
      if (isDemoMode && demoRetryCount < MAX_DEMO_RETRIES) {
        console.log("Demo mode: Auto-retrying with new image...");
        await retryWithNewDemo();
        return; // Neukončujeme isSaving, retryWithNewDemo to zvládne
      }
      
      setHasError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!sessionId) {
      // Pokud není session, jen redirect na homepage
      router.push(`/${lang}`);
      return;
    }

    try {
      // Smazání session z databáze
      await fetch(`/api/room/${sessionId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to delete session:", error);
    }

    // Redirect na homepage
    router.push(`/${lang}`);
  };

  // Znovu - funkce odstraněna (generování se dělá později)
  const handleRestartDesign = () => {
    // Placeholder - will be implemented with generation feature
    setHasError(false);
  };

  // Vyčistit - smaže všechno včetně cache a vrátí na titulní stránku
  const handleClearAll = async () => {
    if (sessionId) {
      try {
        await fetch(`/api/room/${sessionId}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Failed to delete session:", error);
      }
    }
    router.push(`/${lang}`);
  };

  const handleLoadMore = async () => {
    if (!analysisResult || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const recommendRes = await fetch("/api/products/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style: analysisResult.detected_style,
          room: roomType,
          budget: budget,
          recommendations: analysisResult.recommendations,
          contextual_queries: analysisResult.contextual_queries,
          furnishing_level: analysisResult.furnishing_level?.percentage || 50,
          focus_area: analysisResult.focus_area || 'full_room',
          limit: recommendedProducts.length + 24 // Načteme o 24 víc
        }),
      });
      
      if (recommendRes.ok) {
        const products = await recommendRes.json();
        setRecommendedProducts(products);
      }
    } catch (error) {
      console.error("Load more error:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <main className="flex flex-col lg:flex-row h-[100dvh] bg-sand/30 overflow-hidden">
      {/* Left Section: Main Stage (60% on PC, 50% on Mobile) */}
      <div className="h-[50vh] lg:h-full lg:w-[60%] relative group bg-charcoal/5 overflow-hidden border-b lg:border-b-0 lg:border-r border-stone-200">
        {/* Placeholder Background */}
        {!uploadedImage && (
          <>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-40 grayscale blur-sm transition-all duration-700" />
            <div className="absolute inset-0 bg-sand/40 backdrop-blur-[1px]" />
          </>
        )}

        {/* Interaction Area */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 overflow-hidden">
          <div className="relative max-w-full max-h-full flex items-center justify-center group/stage">
            {uploadedImage ? (
              <div className="relative shadow-2xl rounded-lg overflow-hidden group/image-container">
                {/* Floating Buttons - Reload & Vyčistit */}
                {analysisResult && (
                  <div className="absolute top-4 left-4 flex gap-2 z-50">
                    {/* Reload - spustí novou analýzu */}
                    <button
                      onClick={handleReset}
                      className="group/reload bg-white/90 hover:bg-white text-charcoal p-3 rounded-full shadow-lg backdrop-blur-md border border-white/20 transition-all duration-200 hover:scale-105 active:scale-95"
                      title="Nahrát znovu"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                )}
                {analysisResult && (
                  <div className="absolute top-4 right-4 flex gap-2 z-50">
                    {/* Vyčistit - smaže všechno */}
                    <button
                      onClick={handleClearAll}
                      className="group/clear bg-terracotta/90 hover:bg-terracotta text-white p-3 rounded-full shadow-lg backdrop-blur-md border border-white/20 transition-all duration-200 hover:scale-105 active:scale-95"
                      title={dict.common.clear_all}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
                
                {/* Room Image */}
                <div className="relative">
                  <img 
                    src={uploadedImage} 
                    alt="Room" 
                    className="block max-w-full max-h-[85vh] w-auto h-auto transition-all duration-500" 
                  />
                    
                    {/* Heuristická notifikace pro prázdnou místnost */}
                    {isEmptyRoom && !analysisResult && (
                      <div className="absolute top-6 left-6 right-6 animate-in slide-in-from-top-4 duration-500 z-30">
                        <div className="bg-white/90 backdrop-blur-md border border-sage/20 p-4 rounded-2xl shadow-xl flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center shrink-0">
                              <Wand className="w-5 h-5 text-sage" />
                            </div>
                          <div>
                            <p className="font-bold text-sm text-charcoal">{dict.home.empty_room_detected}</p>
                            <p className="text-xs text-stone-500">{dict.home.empty_room_desc}</p>
                          </div>
                        </div>
                      </div>
                    )}
                </div>

                {/* Success Notification after Analysis */}
                {showAnalysisSuccess && (
                  <div className="absolute top-6 left-6 right-6 animate-in slide-in-from-top-4 duration-500 z-40">
                    <div className="bg-sage text-white p-4 rounded-2xl shadow-xl flex items-center gap-4 border border-white/20">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{dict.analysis.success_title}</p>
                        <p className="text-xs opacity-90">{dict.analysis.success_desc}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Značky (Markers) - Now inside the same relative container as the image */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="relative w-full h-full">
                    {analysisResult && !isUploading && !isSaving && analysisResult.recommendations
                      ?.slice(0, showAllMarkers ? 100 : 6)
                      .map((rec: any, i: number) => {
                        if (!rec.placement_coordinates) {
                          console.log("Marker missing coordinates:", rec);
                          return null;
                        }
                        const product = findProductForRecommendation(rec.item);
                        
                        // Hierarchie velikostí: hlavní nábytek je větší
                        const isMainFurniture = ["pohovka", "sofa", "stůl", "postel", "skříň"].some(kw => rec.item.toLowerCase().includes(kw));
                        
                        // Inteligentní pozicování tooltipu - vlevo pokud je marker vpravo
                        const markerX = rec.placement_coordinates.x / 10; // 0-100%
                        const showTooltipLeft = markerX > 55; // Pokud marker je více než 55% vpravo, tooltip vlevo
                        
                        return (
                          <div 
                            key={i}
                            className={cn(
                              "absolute pointer-events-auto cursor-pointer transition-all duration-500 z-30 group/marker",
                              "opacity-100",
                              activeCategory === rec.item && "z-50 scale-110"
                            )}
                            style={{ 
                              left: `${rec.placement_coordinates.x / 10}%`, 
                              top: `${rec.placement_coordinates.y / 10}%` 
                            }}
                            onMouseEnter={() => setActiveCategory(rec.item)}
                            onMouseLeave={() => setActiveCategory(null)}
                            onClick={() => product && handleMarkerClick(product, rec)}
                          >
                            <div className="relative -translate-x-1/2 -translate-y-1/2">
                              <div className={cn(
                                "absolute -inset-4 bg-white/20 rounded-full",
                                activeCategory === rec.item ? "animate-ping bg-terracotta/30" : "bg-white/10"
                              )} />
                              <div className={cn(
                                "relative text-white rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-all duration-300",
                                isMainFurniture ? "w-12 h-12" : "w-10 h-10",
                                activeCategory === rec.item ? "bg-terracotta scale-125 rotate-12" : "bg-terracotta/80 hover:bg-terracotta"
                              )}>
                                {React.createElement(getIconForItem(rec.item), { className: isMainFurniture ? "w-6 h-6" : "w-5 h-5" })}
                              </div>
                              
                              {/* Tooltip - Inteligentní pozice: vlevo nebo vpravo podle pozice markeru */}
                              <div className={cn(
                                "absolute top-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-none z-50",
                                showTooltipLeft 
                                  ? "right-full mr-3" 
                                  : "left-full ml-3",
                                activeCategory === rec.item 
                                  ? "opacity-100" 
                                  : "opacity-0",
                                activeCategory === rec.item
                                  ? (showTooltipLeft ? "translate-x-0" : "translate-x-0")
                                  : (showTooltipLeft ? "translate-x-2" : "-translate-x-2")
                              )}>
                                <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-2xl border border-sage/10 w-52">
                                  <p className="text-xs font-bold text-sage uppercase tracking-wider mb-1">{dict.results.recommendation || "Doporučení"}</p>
                                  <p className="text-sm font-bold text-charcoal mb-1 capitalize">{rec.item}</p>
                                  <p className="text-[10px] text-charcoal/60 leading-tight line-clamp-2">{rec.reason}</p>
                                  {product && (
                                    <div className="mt-2 flex items-center gap-2 pt-2 border-t border-sage/10">
                                      <div className="w-8 h-8 rounded bg-sand overflow-hidden flex-shrink-0">
                                        <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-charcoal truncate">{product.name}</p>
                                        <span className="text-[10px] font-medium text-sage">{dict.common.click_to_visualize}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {/* Šipka - mění stranu podle pozice */}
                                <div className={cn(
                                  "w-2 h-2 bg-white rotate-45 absolute top-1/2 -translate-y-1/2 border-sage/10",
                                  showTooltipLeft 
                                    ? "-right-1 border-r border-t" 
                                    : "-left-1 border-l border-b"
                                )} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {analysisResult && analysisResult.recommendations.length > 6 && !showAllMarkers && (
                  <button 
                    onClick={() => setShowAllMarkers(true)}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-sage/10 text-sage text-xs font-bold hover:bg-white transition-all flex items-center gap-2 z-40"
                  >
                    <Plus className="w-3 h-3" />
                    {dict.common.show_more_recommendations} ({analysisResult.recommendations.length - 6})
                  </button>
                )}
              </div>
            ) : (
              <UploadZone 
                onUpload={handleUpload} 
                uploadedImage={uploadedImage}
                onClear={() => {
                  setUploadedImage(null);
                  setAnalysisResult(null);
                  setRecommendedProducts([]);
                }}
                dict={dict}
              />
            )}

            {/* Generation overlay removed - will be implemented later */}

            {hasError && (
              <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="bg-white p-8 rounded-3xl shadow-2xl border border-red-100 flex flex-col items-center gap-6 max-w-sm text-center">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                    <BrainCircuit className="w-8 h-8 text-red-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-charcoal">{dict.common.something_wrong}</p>
                    <p className="text-sm text-charcoal/60">{dict.common.error_message}</p>
                  </div>
                  <Button 
                    onClick={() => {
                      setHasError(false);
                      if (!analysisResult && sessionId) handleAnalyze(sessionId);
                    }}
                    className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-8"
                  >
                    {dict.common.try_again}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Section: Controls & Results (40% on PC, 55% on Mobile) */}
      <div className="flex-1 bg-white/60 backdrop-blur-md overflow-y-auto border-l border-white/20">
        <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
          {/* Settings Row - More compact */}
          <div className="flex flex-col xl:flex-row gap-6 pb-6 border-b border-stone-100 items-start xl:items-center justify-between">
            <div className="flex-1 w-full xl:w-auto space-y-2 xl:max-w-[240px]">
              <h2 className="text-[9px] font-bold text-charcoal/30 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-2.5 bg-terracotta rounded-full"/>
                {dict.home.budget_label}
              </h2>
              <PriceSlider 
                value={budget} 
                onChange={setBudget} 
                onCommit={(val) => {
                  setBudget(val);
                  setTimeout(handleUpdateProducts, 150);
                }}
              />
            </div>

            <div className="flex-1 w-full xl:w-auto space-y-2">
              <h2 className="text-[9px] font-bold text-charcoal/30 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-2.5 bg-sage rounded-full"/>
                {dict.home.room_type_label}
              </h2>
              <RoomTypeSelector 
                selected={roomType} 
                onSelect={(val) => {
                  setRoomType(val);
                  setTimeout(handleUpdateProducts, 150);
                }} 
                dict={dict}
              />
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-charcoal flex items-center gap-2">
                <Wand className="w-4 h-4 text-sage" />
                {analysisResult ? dict.results.title : dict.results.recommended_title}
              </h2>
              {(isSaving || isUploading) && (
                <div className="flex items-center gap-2 text-sage animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest">{dict.common.processing}</span>
                </div>
              )}
            </div>
            
            {analysisResult || recommendedProducts.length > 0 ? (
              <ResultsView 
                sessionId={sessionId || "demo"}
                roomImageUrl={uploadedImage || ""}
                analysis={analysisResult}
                products={recommendedProducts}
                onBack={() => {
                  setAnalysisResult(null);
                  setUploadedImage(null);
                  setRecommendedProducts([]);
                  handleUpdateProducts();
                }}
                onLoadMore={handleLoadMore}
                isLoadingMore={isLoadingMore}
                activeCategory={activeCategory}
                budget={budget}
                roomType={roomType}
                dict={dict}
              />
            ) : (isSaving || isUploading) ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-stone-50/50 rounded-3xl border border-stone-100 animate-in fade-in duration-500">
                <div className="relative">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <BrainCircuit className="w-8 h-8 text-sage animate-pulse" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Loader2 className="w-3 h-3 text-sage animate-spin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-charcoal">{dict.analysis.analyzing_title}</p>
                  <p className="text-stone-500 max-w-xs mx-auto text-sm">
                    {dict.analysis.analyzing_desc}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white/40 backdrop-blur-sm rounded-3xl border border-dashed border-sage/20">
                  <div className="relative">
                    <div className="w-20 h-20 bg-sage/5 rounded-full flex items-center justify-center">
                      <Sofa className="w-10 h-10 text-sage/20" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Wand className="w-4 h-4 text-terracotta/40" />
                    </div>
                  </div>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-charcoal">{dict.results.title}</p>
                  <p className="text-stone-500 max-w-xs mx-auto text-sm">
                    {dict.results.empty_desc}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Analysis Spinner (Overlay during upload) */}
      {isUploading && (
        <AnalysisSpinner 
          isUploading={true} 
          variant="overlay"
          dict={dict}
        />
      )}

      {/* Bottom Pill Spinner (During AI analysis) */}
      {isSaving && (
        <AnalysisSpinner 
          isSaving={true} 
          variant="bottom"
          dict={dict}
        />
      )}

      {/* Product Popup Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-charcoal">
              {selectedRecommendation?.item}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              {/* Product Image */}
              <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-50">
                <img 
                  src={selectedProduct.image_url} 
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-charcoal">{selectedProduct.name}</h3>
                    <p className="text-sm text-stone-500">{selectedProduct.brand}</p>
                  </div>
                  <p className="text-2xl font-bold text-terracotta whitespace-nowrap">
                    {selectedProduct.price_czk.toLocaleString('cs-CZ')} Kč
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.style_tags?.map((tag: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-sage/10 text-sage text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Recommendation Reason */}
                {selectedRecommendation?.reason && (
                  <div className="bg-stone-50 p-3 rounded-lg">
                    <p className="text-xs text-stone-600">
                      <span className="font-semibold">Proč doporučujeme:</span> {selectedRecommendation.reason}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <a 
                href={selectedProduct.affiliate_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="w-full bg-terracotta hover:bg-terracotta/90 text-white">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Zobrazit produkt
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
