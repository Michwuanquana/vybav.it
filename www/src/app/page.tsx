"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/UploadZone";
import { RoomTypeSelector } from "@/components/RoomTypeSelector";
import { ColorPicker } from "@/components/ColorPicker";
import { PriceSlider } from "@/components/PriceSlider";
import { ResultsView } from "@/components/ResultsView";
import { Loader2, Sparkles, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<"landing" | "upload" | "configure" | "analyzing" | "results">("landing");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAlreadyAnalyzed, setIsAlreadyAnalyzed] = useState(false);

  // Results state
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);

  // Preferences state
  const [roomType, setRoomType] = useState<string | null>(null);
  const [colors, setColors] = useState({ primary: "#F0E8D9", secondary: "#7C8F80" });
  const [budget, setBudget] = useState(25000);

  const handleUpload = async (imageDataUrl: string, file: File) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      setUploadedImage(data.imageUrl);
      setIsAlreadyAnalyzed(!!data.isAnalyzed);
      setStep("configure");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Nahrávání se nezdařilo. Zkuste to prosím znovu.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setUploadedImage(null);
    setSessionId(null);
    setStep("upload");
  };

  const handleContinue = async () => {
    if (!sessionId) return;
    
    setIsSaving(true);
    setStep("analyzing");
    
    try {
      // 1. Spuštění AI analýzy
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!analyzeRes.ok) throw new Error("Analýza selhala");
      const analysis = await analyzeRes.json();
      setAnalysisResult(analysis);

      // 2. Získání doporučených produktů na základě analýzy
      const style = analysis.detected_style;
      const recommendRes = await fetch(`/api/products/recommend?style=${style}&limit=6&max_price=${budget}`);
      
      if (recommendRes.ok) {
        const products = await recommendRes.json();
        setRecommendedProducts(products);
      }
      
      setStep("results");
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Chyba při analýze místnosti. Zkuste to prosím znovu.");
      setStep("configure");
    } finally {
      setIsSaving(false);
    }
  };
      console.error("Analysis error:", error);
      alert("Chyba při analýze místnosti. Zkuste to prosím znovu.");
      setStep("configure");
    } finally {
      setIsSaving(false);
    }
  };

  if (step === "landing") {
    return (
      <main className="min-h-screen bg-sand flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-sage tracking-tight">
            Vybaveno
          </h1>
          <p className="text-xl md:text-2xl text-charcoal/80 font-sans">
            Váš pokoj hotový bez práce. Od chaosu ke klidu.
          </p>
          <div className="pt-8">
            <Button 
              size="lg" 
              className="bg-terracotta hover:bg-terracotta/90 text-white px-8 py-6 text-lg rounded-2xl shadow-lg transition-all hover:scale-105"
              onClick={() => setStep("upload")}
            >
              Začít s návrhem
            </Button>
          </div>
        </div>
        
        <footer className="absolute bottom-8 text-sage/60 text-sm">
          © 2026 Vybaveno.cz – AI-powered interior staging
        </footer>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sand p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold text-sage">Vybaveno</h2>
          <div className="flex gap-2">
            <div className={cn("w-3 h-3 rounded-full", ["upload", "configure", "analyzing", "results"].includes(step) ? "bg-sage" : "bg-sage/20")} />
            <div className={cn("w-3 h-3 rounded-full", ["configure", "analyzing", "results"].includes(step) ? "bg-sage" : "bg-sage/20")} />
            <div className={cn("w-3 h-3 rounded-full", ["analyzing", "results"].includes(step) ? "bg-sage" : "bg-sage/20")} />
          </div>
        </header>

        <div className={cn(
          "bg-white/80 backdrop-blur-sm rounded-3xl p-6 md:p-10 shadow-xl border border-white",
          step === "results" && "max-w-6xl mx-auto bg-transparent shadow-none border-none p-0"
        )}>
          {step === "upload" ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-heading font-bold text-charcoal">Nahrajte fotku</h1>
                <p className="text-charcoal/60">Začněte tím, že nám ukážete prostor, který chcete vybavit.</p>
              </div>
              {isUploading ? (
                <div className="min-h-[320px] flex flex-col items-center justify-center space-y-4 bg-sand/20 rounded-3xl border-2 border-sage/20">
                  <Loader2 className="w-12 h-12 text-sage animate-spin" />
                  <p className="text-sage font-medium">Nahrávám fotku...</p>
                </div>
              ) : (
                <UploadZone 
                  onUpload={handleUpload} 
                  uploadedImage={uploadedImage} 
                  onClear={handleClear} 
                />
              )}
            </div>
          ) : step === "configure" ? (
            <div className="space-y-10">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-heading font-bold text-charcoal">Přizpůsobte si návrh</h1>
                <p className="text-charcoal/60">Pomozte AI pochopit vaše preference.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-charcoal flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-sage/10 text-sage flex items-center justify-center text-xs">1</span>
                      O jaký pokoj se jedná?
                    </h3>
                    <RoomTypeSelector selected={roomType} onSelect={setRoomType} />
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-charcoal flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-sage/10 text-sage flex items-center justify-center text-xs">2</span>
                      Preferované barvy
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <ColorPicker 
                        label="Primární (stěny, nábytek)" 
                        color={colors.primary} 
                        onChange={(c) => setColors(prev => ({ ...prev, primary: c }))} 
                      />
                      <ColorPicker 
                        label="Doplňková (textil, dekor)" 
                        color={colors.secondary} 
                        onChange={(c) => setColors(prev => ({ ...prev, secondary: c }))} 
                      />
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-charcoal flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-sage/10 text-sage flex items-center justify-center text-xs">3</span>
                      Rozpočet na vybavení
                    </h3>
                    <PriceSlider value={budget} onChange={setBudget} />
                  </section>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-charcoal">Náhled prostoru</h3>
                  {uploadedImage && (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-sage shadow-md group">
                      <img src={uploadedImage} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="bg-white/90 hover:bg-white"
                          onClick={() => setStep("upload")}
                        >
                          Změnit fotku
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-sand/30 p-6 rounded-2xl border border-sage/10 space-y-4">
                    <h4 className="font-semibold text-sage flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Co se bude dít dál?
                    </h4>
                    <p className="text-sm text-charcoal/70 leading-relaxed">
                      Naše AI analyzuje geometrii vašeho pokoje, světelné podmínky a architektonické prvky. 
                      Následně vybere nejvhodnější kousky z katalogu IKEA a vytvoří fotorealistický návrh.
                    </p>
                  </div>

                  <Button 
                    className="w-full bg-sage hover:bg-sage/90 text-white py-8 rounded-2xl text-xl shadow-lg shadow-sage/20 transition-all hover:scale-[1.02]"
                    onClick={handleContinue}
                    disabled={!roomType || isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : isAlreadyAnalyzed ? (
                      "Zobrazit hotový návrh"
                    ) : (
                      "Spustit AI analýzu"
                    )}
                  </Button>
                  {!roomType && (
                    <p className="text-center text-xs text-terracotta font-medium">
                      Pro pokračování prosím vyberte typ pokoje.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : step === "analyzing" ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center space-y-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-sage/20 rounded-full blur-3xl animate-pulse" />
                <BrainCircuit className="w-20 h-20 text-sage relative animate-bounce" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-heading font-bold text-charcoal">AI právě přemýšlí...</h2>
                <p className="text-charcoal/60 max-w-md mx-auto">
                  Analyzujeme vaši fotografii, detekujeme styl a vybíráme nejlepší kousky nábytku, které se k vám hodí.
                </p>
              </div>
              <div className="w-64 h-2 bg-sand rounded-full overflow-hidden">
                <div className="h-full bg-sage animate-progress-infinite" />
              </div>
            </div>
          ) : (
            <ResultsView 
              analysis={analysisResult} 
              products={recommendedProducts} 
              onBack={() => setStep("configure")} 
            />
          )}
        </div>
      </div>
    </main>
  );
}
      </div>
    </main>
  );
}
