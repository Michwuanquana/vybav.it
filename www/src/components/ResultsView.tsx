import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  CheckCircle2, 
  Info, 
  Palette, 
  Maximize2, 
  ShoppingCart, 
  ExternalLink,
  ArrowLeft,
  Sparkles,
  Loader2,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  brand: string;
  price_czk: number;
  image_url: string;
  affiliate_url: string;
  style_tags: string[];
  material: string;
  color: string;
}

interface AnalysisResult {
  room_type: string;
  detected_style: string;
  color_palette: {
    primary: string;
    secondary: string;
    accent: string;
    description: string;
  };
  architecture: {
    walls: string;
    floor_material: string;
    windows: string;
  };
  estimated_dimensions: {
    width_m: number;
    length_m: number;
    height_m: number;
  };
  recommendations: Array<{
    item: string;
    reason: string;
    suggested_style: string;
    suggested_color: string;
  }>;
}

interface ResultsViewProps {
  sessionId: string;
  roomImageUrl: string;
  analysis: AnalysisResult;
  products: Product[];
  onBack: () => void;
}

export function ResultsView({ sessionId, roomImageUrl, analysis, products, onBack }: ResultsViewProps) {
  const [visualizingId, setVisualizingId] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const [placement, setPlacement] = useState<{ x: number; y: number } | null>(null);

  const handleVisualize = async (product: Product, coords?: { x: number; y: number }) => {
    setIsGenerating(true);
    setGeneratedImage(null);
    setGenerationStatus("Odesílám data ke zpracování...");

    try {
      console.log("Frontend: Starting visualization for", product.id);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      // Simulace fází pro lepší UX
      const statusInterval = setInterval(() => {
        setGenerationStatus(prev => {
          if (prev.includes("Odesílám")) return "Systém analyzuje scénu...";
          if (prev.includes("analyzuje")) return "Vkládám nábytek do prostoru...";
          if (prev.includes("Vkládám")) return "Ladím stíny a osvětlení...";
          return prev;
        });
      }, 5000);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          sessionId,
          productId: product.id,
          coordinates: coords,
          userInstruction: coords 
            ? `Place the ${product.name} exactly at the marked location [y:${coords.y}, x:${coords.x}].`
            : `Place the ${product.name} naturally in the room.`
        }),
      });

      clearInterval(statusInterval);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server error");
      }

      const data = await response.json();
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      } else {
        throw new Error("No image URL returned");
      }
    } catch (error: any) {
      console.error("Visualization error:", error);
      alert(error.name === 'AbortError' 
        ? "Generování trvá příliš dlouho. Zkuste to prosím znovu nebo s jiným produktem." 
        : `Chyba při generování: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isGenerating || generatedImage) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000);
    
    setPlacement({ x, y });
  };

  const startGeneration = () => {
    const product = products.find(p => p.id === visualizingId);
    if (product && placement) {
      handleVisualize(product, placement);
    }
  };

  const resetVisualization = () => {
    setVisualizingId(null);
    setGeneratedImage(null);
    setPlacement(null);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-sage hover:text-sage/80">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zpět na nastavení
        </Button>
        <Badge variant="outline" className="bg-sage/5 text-sage border-sage/20 px-4 py-1">
          Analýza prostoru dokončena
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Levý sloupec: Analýza místnosti */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm overflow-hidden">
            <div className="bg-sage p-4 text-white">
              <h3 className="font-heading font-bold flex items-center gap-2">
                <Info className="w-4 h-4" />
                Analýza prostoru
              </h3>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-charcoal/40 tracking-wider">Styl a typ</label>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-terracotta/10 text-terracotta hover:bg-terracotta/10 border-none capitalize">
                    {analysis.room_type.replace('_', ' ')}
                  </Badge>
                  <Badge className="bg-sage/10 text-sage hover:bg-sage/10 border-none capitalize">
                    {analysis.detected_style}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-charcoal/40 tracking-wider">Barevná paleta</label>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: analysis.color_palette.primary }} title="Primární" />
                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: analysis.color_palette.secondary }} title="Sekundární" />
                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: analysis.color_palette.accent }} title="Akcent" />
                  </div>
                  <p className="text-sm text-charcoal/70 italic">{analysis.color_palette.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-charcoal/40 tracking-wider">Architektura</label>
                <ul className="space-y-2 text-sm text-charcoal/70">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sage shrink-0" />
                    <span>{analysis.architecture.walls}</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sage shrink-0" />
                    <span>Podlaha: {analysis.architecture.floor_material}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-sage/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-charcoal/50 flex items-center gap-1">
                    <Maximize2 className="w-3 h-3" /> Odhadované rozměry:
                  </span>
                  <span className="font-mono font-bold text-sage">
                    {analysis.estimated_dimensions.width_m}m × {analysis.estimated_dimensions.length_m}m
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-terracotta/5 p-6 rounded-3xl border border-terracotta/10 space-y-4">
            <h4 className="font-semibold text-terracotta flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Doporučení designéra
            </h4>
            <div className="space-y-4">
              {analysis.recommendations.map((rec, i) => (
                <div key={i} className="text-sm space-y-1">
                  <p className="font-bold text-charcoal capitalize">{rec.item}</p>
                  <p className="text-charcoal/70 leading-relaxed">{rec.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pravý sloupec: Katalog produktů */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-heading font-bold text-charcoal">Navržený nábytek</h3>
            <p className="text-sm text-charcoal/50">{products.length} nalezených kousků</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="group overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <div className="relative aspect-square overflow-hidden bg-sand/20">
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-white/90 text-charcoal hover:bg-white border-none shadow-sm">
                      {product.brand}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <h4 className="font-bold text-charcoal line-clamp-1 group-hover:text-sage transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-sm text-charcoal/50 capitalize">{product.material} • {product.color}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-sage">
                      {product.price_czk.toLocaleString('cs-CZ')} Kč
                    </span>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-full border-sage/20 text-sage hover:bg-sage/5"
                        onClick={() => {
                          setVisualizingId(product.id);
                          setGeneratedImage(null);
                          setPlacement(null);
                        }}
                        disabled={isGenerating}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Vizualizovat
                      </Button>
                      <Button size="sm" className="bg-sage hover:bg-sage/90 text-white rounded-full px-4" asChild>
                        <a href={product.affiliate_url} target="_blank" rel="noopener noreferrer">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Koupit
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-20 bg-sand/10 rounded-3xl border-2 border-dashed border-sage/20">
              <p className="text-sage font-medium">Pro tento styl jsme zatím nenašli přesné shody.</p>
              <Button variant="link" className="text-terracotta" onClick={onBack}>Zkusit upravit preference</Button>
            </div>
          )}
        </div>
      </div>

      {/* Dialog pro zobrazení vizualizace */}
      <Dialog open={!!visualizingId} onOpenChange={(open) => !open && resetVisualization()}>
        <DialogContent className="max-w-4xl bg-white/95 backdrop-blur-md border-none shadow-2xl rounded-3xl overflow-hidden p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-heading font-bold text-charcoal flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-terracotta" />
              {generatedImage ? "Váš návrh je připraven" : "Umístěte nábytek v místnosti"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            <div 
              className={cn(
                "relative aspect-video rounded-2xl overflow-hidden bg-sand/20 border border-sage/10 shadow-inner",
                !generatedImage && !isGenerating && "cursor-crosshair"
              )}
              onClick={handleImageClick}
            >
              {isGenerating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-white/60 backdrop-blur-sm z-20">
                  <Loader2 className="w-12 h-12 text-sage animate-spin" />
                  <div className="text-center">
                    <p className="font-bold text-charcoal">{generationStatus}</p>
                    <p className="text-sm text-charcoal/50">Náš systém právě vkládá nábytek do vaší fotky.</p>
                  </div>
                </div>
              ) : generatedImage ? (
                <img 
                  src={generatedImage} 
                  alt="Vizualizace návrhu" 
                  className="w-full h-full object-contain animate-in fade-in zoom-in-95 duration-500"
                />
              ) : (
                <>
                  <img 
                    src={roomImageUrl} 
                    alt="Původní místnost" 
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                    {!placement && (
                      <div className="bg-white/90 px-4 py-2 rounded-full shadow-lg text-sage font-medium animate-bounce">
                        Klikněte kamkoliv pro umístění
                      </div>
                    )}
                  </div>
                  {placement && (
                    <div 
                      className="absolute w-8 h-8 -ml-4 -mt-4 bg-terracotta rounded-full border-4 border-white shadow-xl animate-pulse flex items-center justify-center"
                      style={{ left: `${placement.x / 10}%`, top: `${placement.y / 10}%` }}
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-between bg-sage/5 p-4 rounded-2xl border border-sage/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-white shadow-sm">
                  <img 
                    src={products.find(p => p.id === visualizingId)?.image_url} 
                    alt="Produkt" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-bold text-charcoal">{products.find(p => p.id === visualizingId)?.name}</p>
                  <p className="text-xs text-charcoal/50">
                    {generatedImage ? "Vizualizováno inteligentním systémem" : "Vyberte místo na fotce"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {!generatedImage && !isGenerating && (
                  <Button 
                    className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-8 shadow-lg shadow-terracotta/20"
                    onClick={startGeneration}
                    disabled={!placement}
                  >
                    Potvrdit umístění
                  </Button>
                )}
                {generatedImage && (
                  <Button variant="outline" className="rounded-full border-sage/20 text-sage" asChild>
                    <a href={generatedImage} download="vybaveno-navrh.jpg">
                      <Download className="w-4 h-4 mr-2" />
                      Stáhnout
                    </a>
                  </Button>
                )}
                <Button variant="ghost" className="rounded-full px-6" onClick={resetVisualization}>
                  Zavřít
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
