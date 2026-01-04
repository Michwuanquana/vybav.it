"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/UploadZone";
import { RoomTypeSelector } from "@/components/RoomTypeSelector";
import { ColorPicker } from "@/components/ColorPicker";
import { PriceSlider } from "@/components/PriceSlider";
import { ResultsView } from "@/components/ResultsView";
import { 
  Loader2, 
  Sparkles, 
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
  Plus
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
  return Sparkles;
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
  recommendations: [
    { 
      item: "Pohovka", 
      reason: "Pro zútulnění prostoru a vytvoření centra místnosti.", 
      suggested_style: "Moderní", 
      suggested_color: "Šedá",
      placement_coordinates: { x: 500, y: 600 }
    },
    { 
      item: "Konferenční stolek", 
      reason: "Doplnění sedací soupravy přírodním prvkem.", 
      suggested_style: "Minimalistický", 
      suggested_color: "Dub",
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

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAlreadyAnalyzed, setIsAlreadyAnalyzed] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Results state
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Visualization state
  const [visualizingId, setVisualizingId] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<string | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [placement, setPlacement] = useState<{ x: number; y: number } | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);

  // Preferences state
  const [roomType, setRoomType] = useState<string | null>("living");
  const [colors, setColors] = useState({ primary: "#F0E8D9", secondary: "#7C8F80" });
  const [budget, setBudget] = useState(25000);
  const [showAllMarkers, setShowAllMarkers] = useState(false);

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

    return recommendedProducts[0];
  };

  const handleVisualize = async (product: any, coords: { x: number; y: number }) => {
    if (!uploadedImage || isGenerating) return;
    
    setIsGenerating(true);
    setHasError(false);
    setGenerationPhase("Analyzujeme produkt...");
    setVisualizingId(product.id);
    setPlacement(coords);

    try {
      setTimeout(() => setGenerationPhase("Připravujeme scénu..."), 2000);
      setTimeout(() => setGenerationPhase("Vykreslujeme detaily..."), 5000);
      setTimeout(() => setGenerationPhase("Ladíme osvětlení..."), 12000);
      
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId || "demo",
          productId: product.id,
          coordinates: coords,
          userInstruction: `Place the ${product.name} exactly at the marked location [y:${coords.y}, x:${coords.x}].`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setHasError(true);
        throw new Error(errorData.error || "Visualization failed");
      }
      
      const data = await response.json();
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setSliderPosition(50);
      } else {
        setHasError(true);
        throw new Error("No image URL returned");
      }
    } catch (error: any) {
      console.error("Visualization error:", error);
      setHasError(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFullDesign = async () => {
    if (!uploadedImage || isGenerating) return;
    
    setIsGenerating(true);
    setHasError(false);
    setGenerationPhase("Skládáme váš návrh...");
    try {
      setTimeout(() => setGenerationPhase("Optimalizujeme rozmístění..."), 3000);
      setTimeout(() => setGenerationPhase("Vykreslujeme celou místnost..."), 8000);
      setTimeout(() => setGenerationPhase("Ladíme osvětlení a stíny..."), 15000);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId || "demo",
          fullDesign: true,
          roomType,
          style: analysisResult?.detected_style
        }),
      });

      if (!response.ok) {
        setHasError(true);
        throw new Error("Full design generation failed");
      }
      
      const data = await response.json();
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setSliderPosition(50);
      }
    } catch (error) {
      console.error("Full design error:", error);
      setHasError(true);
    } finally {
      setIsGenerating(false);
    }
  };

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

  const handleUpload = async (imageDataUrl: string, file: File) => {
    setIsUploading(true);
    
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
      
      // Auto-start analysis after upload
      await handleAnalyze(data.sessionId);
      
    } catch (error: any) {
      console.error("Upload/Analysis error:", error);
      setHasError(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async (currentSessionId: string) => {
    setIsSaving(true);
    setHasError(false);
    try {
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: currentSessionId, roomType }),
      });

      if (!analyzeRes.ok) {
        setHasError(true);
        throw new Error("Analysis failed");
      }
      
      const analysis = await analyzeRes.json();
      setAnalysisResult(analysis);

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
          limit: 50
        }),
      });
      
      if (recommendRes.ok) {
        const products = await recommendRes.json();
        setRecommendedProducts(products);
      }
    } catch (error) {
      console.error("Analysis error:", error);
      setHasError(true);
    } finally {
      setIsSaving(false);
    }
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
                {generatedImage ? (
                  <div className="relative overflow-hidden bg-charcoal/20">
                    {/* Original Image (Before) */}
                    <img 
                      src={uploadedImage} 
                      alt="Original" 
                      className="block max-w-full max-h-[85vh] w-auto h-auto" 
                    />
                    {/* Generated Image (After) */}
                    <div 
                      className="absolute inset-0 w-full h-full overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                      <img 
                        src={generatedImage} 
                        alt="Generated" 
                        className="block max-w-full max-h-[85vh] w-auto h-auto" 
                      />
                    </div>
                    
                    {/* Slider Handle */}
                    <div 
                      className="absolute inset-y-0 z-40 w-1 bg-white/50 backdrop-blur-sm cursor-ew-resize"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white/20 active:scale-110 transition-transform">
                        <div className="flex gap-1">
                          <div className="w-1 h-5 bg-sage/40 rounded-full" />
                          <div className="w-1 h-5 bg-sage/40 rounded-full" />
                        </div>
                      </div>
                      {/* Labels */}
                      <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest pointer-events-none">Původní</div>
                      <div className="absolute top-4 left-4 bg-terracotta/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest pointer-events-none">Návrh</div>
                    </div>
                    
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={sliderPosition} 
                      onChange={(e) => setSliderPosition(parseInt(e.target.value))}
                      className="absolute inset-0 z-50 opacity-0 cursor-ew-resize w-full h-full"
                    />
                  </div>
                ) : (
                  <img 
                    src={uploadedImage} 
                    alt="Room" 
                    className="block max-w-full max-h-[85vh] w-auto h-auto transition-all duration-500" 
                  />
                )}

                {/* AI Značky (Markers) - Now inside the same relative container as the image */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="relative w-full h-full">
                    {analysisResult && !isGenerating && !isUploading && analysisResult.recommendations
                      .slice(0, showAllMarkers ? 100 : 6)
                      .map((rec: any, i: number) => {
                        if (!rec.placement_coordinates) return null;
                        const product = findProductForRecommendation(rec.item);
                        if (!product) return null;
                        
                        // Hierarchie velikostí: hlavní nábytek je větší
                        const isMainFurniture = ["pohovka", "sofa", "stůl", "postel", "skříň"].some(kw => rec.item.toLowerCase().includes(kw));
                        
                        return (
                          <div 
                            key={i}
                            className={cn(
                              "absolute pointer-events-auto cursor-pointer transition-all duration-500 z-30 group/marker",
                              generatedImage ? "opacity-40 hover:opacity-100" : "opacity-100",
                              activeCategory === rec.item && "z-50 scale-110"
                            )}
                            style={{ 
                              left: `${rec.placement_coordinates.x / 10}%`, 
                              top: `${rec.placement_coordinates.y / 10}%` 
                            }}
                            onMouseEnter={() => setActiveCategory(rec.item)}
                            onMouseLeave={() => setActiveCategory(null)}
                            onClick={() => handleVisualize(product, rec.placement_coordinates!)}
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
                              
                              {/* Tooltip - Always visible on hover */}
                              <div className={cn(
                                "absolute bottom-full left-1/2 -translate-x-1/2 mb-3 transition-all duration-300 pointer-events-none z-40",
                                activeCategory === rec.item ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                              )}>
                                <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-2xl border border-sage/10 w-56 max-w-[70vw]">
                                  <p className="text-xs font-bold text-sage uppercase tracking-wider mb-1">Doporučení</p>
                                  <p className="text-sm font-bold text-charcoal mb-1 capitalize">{rec.item}</p>
                                  <p className="text-[10px] text-charcoal/60 leading-tight">{rec.reason}</p>
                                  <div className="mt-2 flex items-center gap-2 pt-2 border-t border-sage/10">
                                    <div className="w-8 h-8 rounded bg-sand overflow-hidden flex-shrink-0">
                                      <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-bold text-charcoal truncate">{product.name}</p>
                                      <span className="text-[10px] font-medium text-sage">Klikněte pro vizualizaci</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="w-2 h-2 bg-white rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-sage/10" />
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
                    Zobrazit více doporučení ({analysisResult.recommendations.length - 6})
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
                  setGeneratedImage(null);
                }}
              />
            )}

            {isGenerating && (
              <div className="absolute inset-0 z-50 bg-charcoal/20 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-500">
                <div className="bg-white p-8 rounded-3xl shadow-2xl border border-sage/10 flex flex-col items-center gap-6 max-w-sm text-center">
                  <div className="relative">
                    <div className="w-20 h-20 bg-terracotta/10 rounded-full flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-terracotta animate-pulse" />
                    </div>
                    <div className="absolute inset-0 border-4 border-terracotta/20 border-t-terracotta rounded-full animate-spin" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-charcoal">{generationPhase || "Generujeme návrh"}</p>
                    <div className="flex gap-1 justify-center">
                      <div className="w-1.5 h-1.5 bg-terracotta rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-terracotta rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-terracotta rounded-full animate-bounce" />
                    </div>
                    <p className="text-xs text-charcoal/40 mt-4 italic">Může to trvat až 30 sekund, ale výsledek bude stát za to.</p>
                  </div>
                </div>
              </div>
            )}

            {hasError && (
              <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="bg-white p-8 rounded-3xl shadow-2xl border border-red-100 flex flex-col items-center gap-6 max-w-sm text-center">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                    <BrainCircuit className="w-8 h-8 text-red-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-charcoal">Něco se nepovedlo</p>
                    <p className="text-sm text-charcoal/60">Omlouváme se, ale AI model momentálně neodpovídá. Zkuste to prosím znovu.</p>
                  </div>
                  <Button 
                    onClick={() => {
                      setHasError(false);
                      if (!analysisResult && sessionId) handleAnalyze(sessionId);
                      else if (visualizingId) {
                        const product = recommendedProducts.find(p => p.id === visualizingId);
                        if (product && placement) handleVisualize(product, placement);
                      }
                    }}
                    className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-8"
                  >
                    Zkusit znovu
                  </Button>
                </div>
              </div>
            )}

            {generatedImage && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex gap-3">
                <Button 
                  onClick={() => {
                    setGeneratedImage(null);
                    setSliderPosition(50);
                  }}
                  className="bg-white/90 text-charcoal hover:bg-white shadow-xl rounded-full px-6 border border-sage/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Zpět
                </Button>
                
                <Button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = generatedImage;
                    link.download = `vybaveno-navrh-${sessionId}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="bg-sage text-white hover:bg-sage/90 shadow-xl rounded-full px-6"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Stáhnout
                </Button>

                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Odkaz na návrh byl zkopírován do schránky.");
                  }}
                  className="bg-terracotta text-white hover:bg-terracotta/90 shadow-xl rounded-full px-6"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Sdílet
                </Button>
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
                Rozpočet
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
                Typ místnosti
              </h2>
              <RoomTypeSelector 
                selected={roomType} 
                onSelect={(val) => {
                  setRoomType(val);
                  setTimeout(handleUpdateProducts, 150);
                }} 
              />
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-charcoal flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sage" />
                {analysisResult ? "Váš inteligentní návrh" : "Doporučené produkty"}
              </h2>
              {(isSaving || isUploading) && (
                <div className="flex items-center gap-2 text-sage animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest">Zpracovávám...</span>
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
                  setGeneratedImage(null);
                  handleUpdateProducts();
                }}
                onGenerateFullDesign={handleGenerateFullDesign}
                isGenerating={isGenerating}
                onLoadMore={handleLoadMore}
                isLoadingMore={isLoadingMore}
                activeCategory={activeCategory}
                budget={budget}
                roomType={roomType}
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
                  <p className="text-lg font-bold text-charcoal">Analyzuji váš prostor</p>
                  <p className="text-stone-500 max-w-xs mx-auto text-sm">
                    Naše inteligentní systémy právě studují rozložení místnosti a hledají nejvhodnější kousky nábytku...
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
                    <Sparkles className="w-4 h-4 text-terracotta/40" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-charcoal">Váš inteligentní návrh</p>
                  <p className="text-stone-500 max-w-xs mx-auto text-sm">
                    Nahrajte fotografii místnosti pro spuštění AI analýzy. Váš osobní návrh interiéru se zobrazí právě zde.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
