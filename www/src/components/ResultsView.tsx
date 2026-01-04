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
  Download,
  Edit3,
  Layout
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StudioEditor } from "./StudioEditor";

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
    placement_coordinates?: {
      x: number;
      y: number;
      note?: string;
    };
  }>;
}

interface ResultsViewProps {
  sessionId: string;
  roomImageUrl: string;
  analysis?: AnalysisResult;
  products: Product[];
  onBack: () => void;
  onGenerateFullDesign?: () => void;
  isGenerating?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  activeCategory?: string | null;
  budget?: number;
  roomType?: string | null;
}

export function ResultsView({ 
  sessionId, 
  roomImageUrl, 
  analysis, 
  products, 
  onBack,
  onGenerateFullDesign,
  isGenerating: externalIsGenerating,
  onLoadMore,
  isLoadingMore,
  activeCategory,
  budget = 25000,
  roomType
}: ResultsViewProps) {
  const [showStudio, setShowStudio] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  const activeIsGenerating = externalIsGenerating;

  // Toggle product selection for budget calculation
  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProductIds);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProductIds(newSelection);
  };

  // Calculate total price of selected products
  const totalPrice = products
    .filter(p => selectedProductIds.has(p.id))
    .reduce((sum, p) => sum + p.price_czk, 0);

  const budgetPercentage = Math.min(100, (totalPrice / budget) * 100);

  // Najde nejvhodnější produkt pro dané doporučení
  const findProductForRecommendation = (itemKeyword: string) => {
    if (!products || products.length === 0) return null;
    const kw = itemKeyword.toLowerCase();
    
    // Mapování pro lepší shodu
    const translations: Record<string, string> = {
      'sofa': 'pohovka',
      'couch': 'pohovka',
      'table': 'stůl',
      'coffee table': 'stolek',
      'chair': 'židle',
      'bed': 'postel',
      'desk': 'stůl',
      'lamp': 'lampa',
      'rug': 'koberec'
    };
    const searchKw = translations[kw] || kw;

    return products.find(p => 
      p.name.toLowerCase().includes(searchKw) || 
      p.name.toLowerCase().includes(kw)
    ) || products[0];
  };

  // Rozdělení produktů na přímé shody a ostatní
  const directMatchIds = new Set(
    analysis?.recommendations
      ? analysis.recommendations
          .map(rec => findProductForRecommendation(rec.item)?.id)
          .filter(Boolean)
      : []
  );

  // Dynamické filtrování a řazení podle aktivní kategorie (hover na fotce)
  const processedProducts = React.useMemo(() => {
    let list = [...products];
    
    if (activeCategory) {
      const kw = activeCategory.toLowerCase();
      const translations: Record<string, string> = {
        'sofa': 'pohovka',
        'couch': 'pohovka',
        'table': 'stůl',
        'coffee table': 'stolek',
        'chair': 'židle',
        'bed': 'postel',
        'desk': 'stůl',
        'lamp': 'lampa',
        'rug': 'koberec'
      };
      const searchKw = translations[kw] || kw;
      
      // Pokud je aktivní kategorie, filtrujeme jen na relevantní
      list = list.filter(p => 
        p.name.toLowerCase().includes(searchKw) || 
        p.name.toLowerCase().includes(kw)
      );
    }

    // Seskupení podle kategorií (pokud není aktivní filtr)
    const groups: Record<string, Product[]> = {};
    list.forEach(p => {
      const cat = p.style_tags?.[0] || "Ostatní";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });

    return {
      flat: list,
      grouped: groups
    };
  }, [products, activeCategory]);

  const allVisibleProducts = processedProducts.flat.slice(0, visibleCount);
  const hasMore = products.length > visibleCount;

  const handleLoadMore = () => {
    if (hasMore) {
      setVisibleCount(prev => prev + 12);
    } else if (onLoadMore) {
      onLoadMore();
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700 pr-2">
        <div className="flex items-center justify-between pt-2">
          <img src="/logo.svg" alt="Vybaveno" className="h-6" />
          <Button variant="ghost" onClick={onBack} className="text-sage hover:text-sage/80 p-0 h-auto text-xs">
            <ArrowLeft className="w-3 h-3 mr-1.5" />
            Zpět
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowStudio(true)}
              className="border-sage/20 text-sage hover:bg-sage/5 h-7 text-[10px] px-3"
            >
              <Edit3 className="w-3 h-3 mr-1.5" />
              Upravit pozice
            </Button>
            <Badge variant="outline" className="bg-sage/5 text-sage border-sage/20 px-2 py-0 text-[9px]">
              Dokončit návrh
            </Badge>
          </div>
        </div>

        {/* Budget Tracker */}
        <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-sage/10 space-y-2">
          <div className="flex justify-between items-end">
            <h3 className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest">Rozpočet</h3>
            <p className="text-xs font-bold text-charcoal">
              {totalPrice.toLocaleString('cs-CZ')} / {budget.toLocaleString('cs-CZ')} Kč
            </p>
          </div>
          <div className="h-1.5 w-full bg-sand rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                budgetPercentage > 90 ? "bg-terracotta" : "bg-sage"
              )}
              style={{ width: `${budgetPercentage}%` }}
            />
          </div>
        </div>

        <div className="space-y-4">
          {/* Analýza místnosti - Expanded */}
          {analysis ? (
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-sage/5 overflow-hidden">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest">Analýza prostoru</h3>
                  <Badge variant="secondary" className="bg-sage/10 text-sage border-none text-[9px] px-2">
                    {analysis.detected_style}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] text-charcoal/40 uppercase font-bold">Odhadované rozměry</p>
                    <p className="text-xs font-bold text-charcoal">
                      {analysis.estimated_dimensions.width_m} × {analysis.estimated_dimensions.length_m} m
                      <span className="text-charcoal/40 font-normal ml-1">(v. {analysis.estimated_dimensions.height_m}m)</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-charcoal/40 uppercase font-bold">Barevná paleta</p>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: analysis.color_palette.primary }} />
                        <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: analysis.color_palette.secondary }} />
                        <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: analysis.color_palette.accent }} />
                      </div>
                      <p className="text-[9px] text-charcoal/60 truncate">{analysis.color_palette.description}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-sage/5">
                  <p className="text-[9px] text-charcoal/40 uppercase font-bold mb-1">Charakteristika stylu</p>
                  <p className="text-[11px] text-charcoal/70 leading-relaxed italic">
                    "Tento prostor vykazuje prvky {analysis.detected_style.toLowerCase()}ho stylu s důrazem na {analysis.architecture.walls.toLowerCase()} a {analysis.architecture.floor_material.toLowerCase()}."
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-sage/5 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-sage/10 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-sage" />
                </div>
                <div>
                  <h3 className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest">Discovery Mode</h3>
                  <p className="text-[11px] text-charcoal/60">Zobrazujeme nejlepší kousky pro {roomType === 'living' ? 'obývací pokoj' : roomType}. Nahrajte fotku pro personalizovaný výběr.</p>
                </div>
              </div>
            </div>
          )}

          {/* Katalog produktů */}
          <div className="space-y-6">
            {processedProducts.flat.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 bg-white/40 backdrop-blur-sm rounded-3xl border border-dashed border-sage/20">
                <div className="w-12 h-12 bg-sage/5 rounded-full flex items-center justify-center shadow-sm">
                  <Sparkles className="w-6 h-6 text-sage/30" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-charcoal">Žádné produkty nenalezeny</p>
                  <p className="text-[11px] text-stone-500 max-w-[200px] mx-auto">Zkuste změnit typ místnosti nebo rozpočet pro více výsledků.</p>
                </div>
              </div>
            ) : (
              Object.entries(processedProducts.grouped).map(([category, categoryProducts]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-charcoal/40 flex items-center gap-2 uppercase tracking-widest">
                      <span className="w-1 h-3 bg-sage/30 rounded-full" />
                      {category}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {categoryProducts.slice(0, activeCategory ? 100 : 6).map((product) => {
                      const isDirect = directMatchIds.has(product.id);
                      const isSelected = selectedProductIds.has(product.id);
                      const isHovered = activeCategory && (
                        product.name.toLowerCase().includes(activeCategory.toLowerCase()) ||
                        (activeCategory.toLowerCase() === 'bed' && product.name.toLowerCase().includes('postel')) ||
                        (activeCategory.toLowerCase() === 'sofa' && product.name.toLowerCase().includes('pohovka')) ||
                        (activeCategory.toLowerCase() === 'table' && product.name.toLowerCase().includes('stůl'))
                      );

                      return (
                        <Card key={product.id} className={cn(
                          "group overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white",
                          isDirect && "ring-1 ring-sage/20",
                          isHovered && "ring-2 ring-terracotta shadow-lg scale-[1.02] z-10",
                          isSelected && "ring-1 ring-sage bg-sage/5"
                        )}>
                          <div className="flex h-24">
                            <div className="relative w-24 flex-shrink-0 overflow-hidden bg-sand/20">
                              <img 
                                src={product.image_url} 
                                alt={product.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <button 
                                onClick={() => toggleProductSelection(product.id)}
                                className={cn(
                                  "absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center transition-all",
                                  isSelected ? "bg-sage text-white" : "bg-white/80 text-charcoal/20 hover:text-sage"
                                )}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              {isHovered && (
                                <div className="absolute inset-0 bg-terracotta/10 flex items-center justify-center pointer-events-none">
                                  <Sparkles className="w-6 h-6 text-terracotta animate-pulse" />
                                </div>
                              )}
                            </div>
                            <CardContent className="p-3 flex-1 flex flex-col justify-between min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                  <h4 className="font-bold text-charcoal text-[11px] line-clamp-1 group-hover:text-sage transition-colors">
                                    {product.name}
                                  </h4>
                                  <p className="text-[9px] text-charcoal/40 font-medium uppercase">{product.brand}</p>
                                </div>
                                <span className="text-xs font-bold text-sage whitespace-nowrap">
                                  {product.price_czk.toLocaleString('cs-CZ')} Kč
                                </span>
                              </div>
                              
                              <div className="flex gap-1.5">
                                <Button size="sm" className={cn(
                                  "h-6 rounded-full px-4 text-[9px] flex-1",
                                  isHovered ? "bg-terracotta hover:bg-terracotta/90" : "bg-sage hover:bg-sage/90"
                                )} asChild>
                                  <a href={product.affiliate_url} target="_blank" rel="noopener noreferrer">
                                    <ShoppingCart className="w-2.5 h-2.5 mr-1.5" />
                                    Koupit
                                  </a>
                                </Button>
                              </div>
                            </CardContent>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {(hasMore || onLoadMore) && (
            <Button 
              variant="ghost" 
              className="w-full py-4 text-sage hover:bg-sage/5 text-xs font-bold uppercase tracking-widest"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Načíst další produkty"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Sticky CTA Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-sand via-sand/95 to-transparent pt-8">
        <Button 
          className="w-full bg-terracotta hover:bg-terracotta/90 text-white font-bold py-6 rounded-2xl shadow-xl shadow-terracotta/20 flex items-center justify-center gap-3 group transition-all hover:scale-[1.02] active:scale-[0.98]"
          onClick={onGenerateFullDesign}
          disabled={activeIsGenerating || selectedProductIds.size === 0}
        >
          {activeIsGenerating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span className="text-base">✨ Vygenerovat návrh</span>
            </>
          )}
        </Button>
        {selectedProductIds.size === 0 && (
          <p className="text-[10px] text-center text-charcoal/40 mt-2">Vyberte alespoň jeden produkt pro generování návrhu</p>
        )}
      </div>

      {/* Studio Editor Dialog */}
      <Dialog open={showStudio} onOpenChange={setShowStudio}>
        <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] p-0 overflow-hidden border-none">
          <StudioEditor 
            roomImageUrl={roomImageUrl}
            initialMarkers={analysis?.recommendations
              ? analysis.recommendations
                  .filter((r: any) => r.placement_coordinates)
                  .map((r: any, i: number) => ({
                    id: `ai-${i}`,
                    x: r.placement_coordinates!.x / 10,
                    y: r.placement_coordinates!.y / 10,
                    label: r.item
                  }))
              : []
            }
            onClose={() => setShowStudio(false)}
            onSave={(markers) => {
              console.log("Saving markers from studio:", markers);
              setShowStudio(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
