import React, { useState, useEffect, useRef } from "react";
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
  Wand,
  Loader2,
  Download,
  Edit3,
  Layout,
  ThumbsUp,
  ThumbsDown,
  X,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StudioEditor } from "./StudioEditor";
import { Input } from "@/components/ui/input";

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
  category?: string;
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
  furnishing_level?: {
    percentage: number;
    category: 'empty' | 'sparse' | 'furnished';
    detected_items: string[];
    missing_essentials: string[];
  };
  no_points_reason?: string | null;
  recommendations: Array<{
    item: string;
    reason: string;
    suggested_style: string;
    suggested_color: string;
    priority?: number;
    size_category?: 'large' | 'medium' | 'small';
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
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  activeCategory?: string | null;
  budget?: number;
  roomType?: string | null;
  dict: any;
  selections?: Record<number, any>;
  onToggleSelection?: (recIndex: number, product: any) => void;
  onClearFilter?: () => void;
  onSelectCategory?: (category: string | null) => void;
}

export function ResultsView({ 
  sessionId, 
  roomImageUrl, 
  analysis, 
  products, 
  onBack,
  onLoadMore,
  isLoadingMore,
  activeCategory,
  budget = 25000,
  roomType,
  onToggleSelection,
  onClearFilter,
  onSelectCategory,
  selections = {},
  dict
}: ResultsViewProps) {
  const [showStudio, setShowStudio] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [feedbackSent, setFeedbackSent] = useState<'up' | 'down' | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Get index of recommendation by active category
  const activeRecIndex = analysis?.recommendations.findIndex(r => r.item === activeCategory);
  const isCurrentCategorySelected = activeRecIndex !== undefined && activeRecIndex !== -1 && !!selections[activeRecIndex];
  
  const nextRec = analysis?.recommendations.find((r, idx) => 
    !selections[idx] && r.item !== activeCategory
  );

  const handleFeedback = async (type: 'up' | 'down', comment?: string) => {
    if (isSubmittingFeedback) return;
    
    setIsSubmittingFeedback(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          type,
          comment,
          target: 'analysis'
        }),
      });
      setFeedbackSent(type);
      setShowFeedbackDialog(false);
    } catch (error) {
      console.error("Feedback error:", error);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const selectedProductIds = new Set(Object.values(selections).map(p => p.id));

  // Toggle product selection for budget calculation
  const toggleProductSelection = (product: Product) => {
    if (!onToggleSelection) return;
    
    // 1. Najít recIndex pro tento produkt
    let recIndex = activeRecIndex !== undefined && activeRecIndex !== -1 ? activeRecIndex : -1;
    
    // 2. Pokud není aktivní kategorie, zkusíme najít první doporučení, kam by produkt mohl sedět
    if (recIndex === -1 && analysis?.recommendations) {
      recIndex = analysis.recommendations.findIndex(rec => {
        const kw = rec.item.toLowerCase();
        const productName = product.name.toLowerCase();
        return productName.includes(kw) || 
               (kw === 'pohovka' && productName.includes('sofa')) ||
               (kw === 'sofa' && productName.includes('pohovka')) ||
               (kw === 'stůl' && (productName.includes('stolek') || productName.includes('desk') || productName.includes('table'))) ||
               (kw === 'židle' && (productName.includes('chair') || productName.includes('křeslo'))) ||
               (kw === 'postel' && productName.includes('bed')) ||
               (kw === 'lampa' && (productName.includes('lamp') || productName.includes('svítidlo'))) ||
               (kw === 'koberec' && productName.includes('rug'));
      });
    }

    if (recIndex !== -1) {
      onToggleSelection(recIndex, product);
    }
  };

  // Calculate total price of selected products
  const totalPrice = Object.values(selections).reduce((sum, p) => sum + p.price_czk, 0);

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

    const match = products.find(p => 
      p.name.toLowerCase().includes(searchKw) || 
      p.name.toLowerCase().includes(kw)
    );

    if (!match && products.length > 0) {
      console.log(`ResultsView: No specific match for "${itemKeyword}". Total products: ${products.length}`);
    }

    return match || null;
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
      
      // KROK 1: Mapování AI markers → DB categories (primární filtr)
      const categoryMap: Record<string, string[]> = {
        // Osvětlení
        'stropní lampa': ['lamp', 'ceiling-light', 'pendant-light', 'chandelier'],
        'lustr': ['lamp', 'chandelier'],
        'stojací lampa': ['lamp', 'floor-lamp'],
        'stolní lampa': ['lamp', 'table-lamp', 'desk-lamp'],
        'nástěnné světlo': ['lamp', 'wall-light'],
        'lampa': ['lamp'],
        'lamp': ['lamp'],
        'světlo': ['lamp'],
        'osvětlení': ['lamp'],
        
        // Sedací nábytek
        'pohovka': ['sofa', 'couch'],
        'sofa': ['sofa', 'couch'],
        'gauč': ['sofa', 'couch'],
        'křeslo': ['armchair', 'chair'],
        'židle': ['chair'],
        'chair': ['chair'],
        'armchair': ['armchair'],
        
        // Stoly
        'stůl': ['table', 'desk', 'coffee-table'],
        'stolek': ['table', 'coffee-table', 'side-table'],
        'konferenční stolek': ['coffee-table', 'table'],
        'coffee table': ['coffee-table', 'table'],
        'jídelní stůl': ['dining-table', 'table'],
        'psací stůl': ['desk', 'table'],
        'desk': ['desk', 'table'],
        'table': ['table'],
        
        // Lůžka
        'postel': ['bed'],
        'bed': ['bed'],
        'matrace': ['bed', 'mattress'],
        
        // Úložné prostory
        'police': ['shelving', 'shelf'],
        'polička': ['shelving', 'shelf'],
        'knihovna': ['bookshelf', 'shelving'],
        'skříň': ['wardrobe', 'cabinet'],
        'komoda': ['cabinet', 'drawer'],
        'wardrobe': ['wardrobe'],
        
        // Dekorace
        'koberec': ['rug', 'carpet'],
        'rug': ['rug', 'carpet'],
        'obraz': ['art', 'painting', 'frame'],
        'zrcadlo': ['mirror'],
        'váza': ['vase', 'decoration'],
        'rostlina': ['plant', 'decoration'],
        'květina': ['plant', 'decoration'],
        'dekorace': ['decoration'],
      };
      
      const dbCategories = categoryMap[kw] || [];
      
      // KROK 2: Filtrování podle DB category (pokud existuje mapování)
      if (dbCategories.length > 0) {
        list = list.filter(p => {
          // Primární: category match
          if (p.category && dbCategories.includes(p.category.toLowerCase())) {
            return true;
          }
          
          // Sekundární: název produktu obsahuje keyword
          return p.name.toLowerCase().includes(kw);
        });
      } else {
        // KROK 3: Fallback - fuzzy matching s tokenizací
        const categoryWords = kw.split(/[\s-]+/).filter(w => w.length > 3);
        
        list = list.filter(p => {
          const productName = p.name.toLowerCase();
          const productWords = productName.split(/[\s-]+/);
          
          // Hledáme, zda některé slovo z kategorie matchuje slovo v produktu
          return categoryWords.some(catWord => 
            productWords.some(prodWord => 
              prodWord.includes(catWord) || catWord.includes(prodWord)
            )
          ) || productName.includes(kw); // Nebo celý string jako fallback
        });
      }
      
      console.log(`[Filter] Category: "${kw}" → Found ${list.length} products (from ${products.length} total)`);
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

  const totalZones = analysis?.recommendations.length || 0;
  const completedZones = Object.keys(selections).length;
  const completionPercentage = totalZones > 0 ? (completedZones / totalZones) * 100 : 0;

  return (
    <div className="flex flex-col relative">
      <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between pt-2">
          {totalZones > 0 && (
            <div className="flex-1 mr-8">
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest">
                  Vybavenost projektu: <span className={cn("transition-colors duration-500", completionPercentage === 100 ? "text-terracotta" : "text-sage")}>
                    {completedZones}/{totalZones}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  {completionPercentage === 100 && (
                    <span className="text-[10px] font-bold text-terracotta animate-pulse uppercase tracking-tighter">
                      Vše hotovo!
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-sage">{Math.round(completionPercentage)}%</span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-sage/10 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={cn(
                    "h-full transition-all duration-1000 ease-out",
                    completionPercentage === 100 ? "bg-terracotta" : "bg-sage"
                  )} 
                  style={{ width: `${completionPercentage}%` }} 
                />
              </div>
            </div>
          )}
          <Button variant="ghost" onClick={onBack} className="text-sage hover:text-sage/80 p-0 h-auto text-xs">
            <ArrowLeft className="w-3 h-3 mr-1.5" />
            {dict.common.back}
          </Button>
        </div>

        {/* No Points Warning */}
        {analysis?.no_points_reason && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-900">{dict.results.no_points_title || "Upozornění analýzy"}</p>
              <p className="text-xs text-amber-800 leading-relaxed">
                {analysis.no_points_reason}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Analýza místnosti - Expanded */}
          {analysis ? (
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-sage/5 overflow-hidden">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest">{dict.results.analysis_title}</h3>
                  <div className="flex gap-2">
                    {analysis.furnishing_level && (
                      <Badge variant="outline" className="bg-sage/5 text-sage border-sage/10 text-[9px] px-2">
                        {analysis.furnishing_level.percentage}% {dict.results[`${analysis.furnishing_level.category}_room` as keyof typeof dict.results] || analysis.furnishing_level.category}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-sage/10 text-sage border-none text-[9px] px-2">
                      {analysis.detected_style}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] text-charcoal/40 uppercase font-bold">{dict.results.dimensions}</p>
                    <p className="text-xs font-bold text-charcoal">
                      {analysis.estimated_dimensions.width_m} × {analysis.estimated_dimensions.length_m} m
                      <span className="text-charcoal/40 font-normal ml-1">(v. {analysis.estimated_dimensions.height_m}m)</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-charcoal/40 uppercase font-bold">{dict.results.palette}</p>
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
                  <p className="text-[9px] text-charcoal/40 uppercase font-bold mb-1">{dict.results.style_char}</p>
                  <p className="text-[11px] text-charcoal/70 leading-relaxed italic">
                    "{dict.results.style_desc
                      .replace('{style}', analysis.detected_style)
                      .replace('{walls}', analysis.architecture.walls.toLowerCase())
                      .replace('{floor}', analysis.architecture.floor_material.toLowerCase())}"
                  </p>
                </div>
              </div>

              {/* Feedback Section */}
              <div className="px-4 pb-4 flex items-center justify-between border-t border-sage/5 pt-3">
                <p className="text-[10px] font-bold text-charcoal/30 uppercase tracking-widest">
                  {feedbackSent ? dict.results.feedback_thanks : dict.results.feedback_title}
                </p>
                <div className="flex gap-2">
                  {!feedbackSent || feedbackSent === 'up' ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleFeedback('up')}
                      disabled={!!feedbackSent || isSubmittingFeedback}
                      className={cn(
                        "h-7 w-7 p-0 rounded-full transition-all",
                        feedbackSent === 'up' ? "bg-sage/10 text-sage" : "text-charcoal/20 hover:text-sage hover:bg-sage/5"
                      )}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </Button>
                  ) : null}
                  {!feedbackSent || feedbackSent === 'down' ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowFeedbackDialog(true)}
                      disabled={!!feedbackSent || isSubmittingFeedback}
                      className={cn(
                        "h-7 w-7 p-0 rounded-full transition-all",
                        feedbackSent === 'down' ? "bg-terracotta/10 text-terracotta" : "text-charcoal/20 hover:text-terracotta hover:bg-terracotta/5"
                      )}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-sage/5 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-sage/10 rounded-full flex items-center justify-center">
                  <Wand className="w-4 h-4 text-sage" />
                </div>
                <div>
                  <h3 className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest">{dict.results.discovery_mode}</h3>
                  <p className="text-[11px] text-charcoal/60">{dict.results.discovery_text.replace('{roomType}', roomType === 'living' ? 'obývací pokoj' : roomType || '')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Katalog produktů */}
          <div className="space-y-6">
            {activeCategory && (
              <div className="bg-sage/5 border border-sage/10 rounded-2xl p-4 flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sage/10 rounded-full flex items-center justify-center">
                    {activeCategory && React.createElement(Wand, { className: "w-4 h-4 text-sage" })}
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest leading-none">Průzkum zóny</h3>
                    <p className="text-sm font-bold text-charcoal">{activeCategory}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onClearFilter && (
                    <Button variant="ghost" size="sm" onClick={onClearFilter} className="h-8 px-3 text-xs text-sage hover:bg-sage/10 rounded-full">
                      <X className="w-3.5 h-3.5 mr-1.5" />
                      Zrušit filtr
                    </Button>
                  )}
                </div>
              </div>
            )}

            {activeCategory && isCurrentCategorySelected && nextRec && (
              <div className="bg-terracotta/5 border border-terracotta/10 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-terracotta/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-terracotta" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-terracotta uppercase tracking-[0.15em] leading-none mb-1">Skvělá volba!</p>
                    <p className="text-xs font-medium text-charcoal/60">Co dál? Zkuste <span className="font-bold text-charcoal">{nextRec.item}</span></p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => {
                    if (onSelectCategory && nextRec) {
                      onSelectCategory(nextRec.item);
                    }
                  }}
                  className="bg-terracotta hover:bg-terracotta/90 text-white rounded-full px-4 text-xs h-8"
                >
                  Pokračovat
                </Button>
              </div>
            )}
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 bg-white/40 backdrop-blur-sm rounded-3xl border border-dashed border-sage/20">
                  <div className="w-12 h-12 bg-sage/5 rounded-full flex items-center justify-center shadow-sm">
                    <Wand className="w-6 h-6 text-sage/30" />
                  </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-charcoal">{dict.results.no_products}</p>
                  <p className="text-[11px] text-stone-500 max-w-[200px] mx-auto">{dict.results.no_products_text}</p>
                </div>
              </div>
            ) : (
              Object.entries(processedProducts.grouped).map(([category, categoryProducts]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-charcoal/40 flex items-center gap-2 uppercase tracking-widest">
                      <span className="w-1 h-3 bg-sage/30 rounded-full" />
                      {category === "Ostatní" ? dict.results.other : category}
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
                      
                      const canFitBudget = (totalPrice - (selections[activeRecIndex || -1]?.price_czk || 0) + product.price_czk) <= budget;

                      const currentZoneSelection = activeRecIndex !== undefined && activeRecIndex !== -1 ? selections[activeRecIndex] : null;
                      const isBetterPrice = currentZoneSelection && product.price_czk < currentZoneSelection.price_czk * 0.85;

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
                                onClick={() => toggleProductSelection(product)}
                                className={cn(
                                  "absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center transition-all shadow-sm z-20",
                                  isSelected ? "bg-sage text-white scale-110" : "bg-white/90 text-charcoal/20 hover:text-sage hover:scale-110"
                                )}
                              >
                                {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              </button>
                              {isHovered && !isSelected && (
                                <div className="absolute inset-0 bg-terracotta/10 flex items-center justify-center pointer-events-none">
                                  <div className="bg-white/90 px-2 py-1 rounded-full shadow-sm flex items-center gap-1 scale-75">
                                    <Wand className="w-3 h-3 text-terracotta" />
                                    <span className="text-[8px] font-bold text-terracotta uppercase tracking-tighter">
                                      {isCurrentCategorySelected ? "Nahradit" : "Vybrat"}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {isBetterPrice && !isSelected && (
                                <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-terracotta text-[7px] text-white font-bold rounded-full shadow-sm z-10 animate-in fade-in zoom-in duration-300 flex items-center gap-1">
                                  <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                                  Výhodnější
                                </div>
                              )}
                              {canFitBudget && !isSelected && !isBetterPrice && (
                                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-sage/80 backdrop-blur-sm text-[7px] text-white font-bold rounded uppercase tracking-tighter">
                                  V rozpočtu
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
                                <span className={cn(
                                  "text-xs font-bold whitespace-nowrap",
                                  canFitBudget ? "text-sage" : "text-terracotta"
                                )}>
                                  {product.price_czk.toLocaleString('cs-CZ')} Kč
                                </span>
                              </div>
                              
                              <div className="flex gap-1.5 align-center">
                                <Button 
                                  variant="ghost"
                                  size="sm" 
                                  onClick={() => toggleProductSelection(product)}
                                  className={cn(
                                    "h-6 rounded-full px-3 text-[9px] flex-1 border border-sage/20",
                                    isSelected ? "bg-sage/10 text-sage border-sage" : "text-sage hover:bg-sage/5"
                                  )}
                                >
                                  {isSelected ? "Odebrat" : (isCurrentCategorySelected ? "Nahradit" : "Vybrat")}
                                </Button>
                                <Button size="sm" className={cn(
                                  "h-6 rounded-full px-3 text-[9px] flex-1",
                                  isHovered ? "bg-terracotta hover:bg-terracotta/90" : "bg-charcoal/5 text-charcoal/40 hover:bg-charcoal/10"
                                )} asChild>
                                  <a href={product.affiliate_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-2.5 h-2.5 mr-1" />
                                    Web
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
                dict.results.load_more
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="max-w-[400px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-charcoal">{dict.results.feedback_not_helpful}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input 
              placeholder={dict.results.feedback_placeholder}
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              className="bg-stone-50 border-stone-100 focus:ring-sage/20 rounded-xl"
            />
            <Button 
              onClick={() => handleFeedback('down', feedbackComment)}
              disabled={isSubmittingFeedback}
              className="w-full bg-sage hover:bg-sage/90 text-white rounded-xl font-bold"
            >
              {isSubmittingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : dict.results.feedback_submit}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                    label: r.item,
                    productType: 'other' as const
                  }))
              : []
            }
            onClose={() => setShowStudio(false)}
            onSave={(markers) => {
              console.log("Saving markers from studio:", markers);
              setShowStudio(false);
            }}
            dict={dict}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
