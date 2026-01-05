"use client";

import React, { useEffect, useState } from "react";
import { BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisSpinnerProps {
  isUploading?: boolean;
  isSaving?: boolean;
  variant?: "overlay" | "bottom";
  label?: string;
  className?: string;
  dict?: any;
}

export function AnalysisSpinner({ isUploading, isSaving, variant = "overlay", label, className, dict }: AnalysisSpinnerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Texty pro jednotlivé stavy - upřímně komunikujeme co se děje
  const statusText = isUploading 
    ? dict?.upload?.uploading || "Nahráváme fotku..."
    : dict?.analysis?.waiting_for_ai || "Čekáme na AI odpověď...";

  useEffect(() => {
    setElapsedTime(0);

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 0.1);
    }, 100);

    return () => clearInterval(interval);
  }, [isUploading, isSaving]);

  if (variant === "bottom") {
    return (
      <div className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal text-white py-4 px-6 rounded-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-500 z-[100] shadow-2xl min-w-[320px]",
        className
      )}>
        {/* Pulsující ikona AI */}
        <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
          <div className="absolute inset-0 bg-sage/30 rounded-full animate-ping" />
          <div className="relative w-10 h-10 bg-sage rounded-full flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">
            {statusText}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {/* Indeterminovaná animace - tři pulzující tečky */}
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" />
            </div>
            <span className="text-xs text-white/60">
              {dict?.analysis?.ai_processing || "AI analyzuje váš prostor"}
            </span>
          </div>
        </div>

        {/* Skutečný elapsed time */}
        <div className="flex flex-col items-end justify-center pl-3 border-l border-white/20">
          <span className="text-lg font-mono font-bold leading-none">{elapsedTime.toFixed(1)}s</span>
          <span className="text-[10px] text-white/50 uppercase tracking-wider">{dict?.common?.elapsed || "Uplynulo"}</span>
        </div>
      </div>
    );
  }

  // Overlay variant - pro upload fázi
  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] bg-charcoal/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-500",
        className
      )}
    >
      <div className="flex flex-col items-center gap-8 max-w-md text-center px-6">
        {/* Pulsující AI ikona */}
        <div className="relative">
          <div className="absolute inset-0 w-32 h-32 bg-sage/20 rounded-full animate-ping" />
          <div className="absolute inset-4 w-24 h-24 bg-sage/30 rounded-full animate-pulse" />
          <div className="relative w-32 h-32 bg-sage rounded-full flex items-center justify-center shadow-2xl">
            <BrainCircuit className="w-16 h-16 text-white" />
          </div>
        </div>

        {/* Status Text */}
        <div className="space-y-3 text-white">
          <h2 className="text-2xl font-bold">
            {isUploading ? (dict?.upload?.uploading_title || "Nahráváme fotku") : (dict?.analysis?.waiting_title || "Čekáme na AI")}
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            {isUploading 
              ? (dict?.upload?.uploading_desc || "Připravujeme váš prostor pro analýzu...")
              : (dict?.analysis?.waiting_desc || "Gemini AI právě analyzuje váš interiér. Skutečný čas závisí na složitosti místnosti.")}
          </p>
        </div>

        {/* Elapsed Time - velké a jasné */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-4 border border-white/20">
          <span className="text-4xl font-mono font-bold text-white">{elapsedTime.toFixed(1)}</span>
          <span className="text-lg text-white/60 ml-2">sekund</span>
        </div>

        {/* Animované tečky */}
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-3 h-3 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-3 h-3 bg-white/40 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}
