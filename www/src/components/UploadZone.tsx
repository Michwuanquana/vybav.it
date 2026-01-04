"use client";

import React, { useState, useRef, useCallback } from "react";
import { Upload, Camera, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface UploadZoneProps {
  onUpload: (imageDataUrl: string, file: File) => void;
  uploadedImage: string | null;
  onClear: () => void;
  className?: string;
}

export function UploadZone({ onUpload, uploadedImage, onClear, className }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Prosím nahrajte pouze obrázky.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onUpload(result, file);
    };
    reader.readAsDataURL(file);
  }, [onUpload]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  if (uploadedImage) {
    return (
      <div className="relative w-full aspect-video md:aspect-[16/9] rounded-2xl overflow-hidden border-2 border-sage shadow-inner bg-sand/20">
        <img
          src={uploadedImage}
          alt="Uploaded room"
          className="w-full h-full object-cover"
        />
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-4 right-4 rounded-full shadow-lg"
          onClick={onClear}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full min-h-[320px] flex flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all duration-200 cursor-pointer",
        isDragging
          ? "border-terracotta bg-terracotta/5 scale-[1.01]"
          : "border-sage/40 bg-sand/30 hover:bg-sand/50 hover:border-sage/60",
        className
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={triggerUpload}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="image/*"
        className="hidden"
      />
      {/* Hidden input for camera on mobile */}
      <input
        type="file"
        onChange={onFileChange}
        accept="image/*"
        capture="environment"
        id="camera-input"
        className="hidden"
      />

      <div className="flex flex-col items-center p-8 text-center space-y-4">
        <div className="relative">
          <div className="absolute -inset-4 bg-sage/10 rounded-full animate-pulse" />
          <div className="relative w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center text-sage group-hover:scale-110 transition-transform duration-300">
            <Upload className="w-8 h-8 animate-bounce [animation-duration:3s]" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-heading font-semibold text-charcoal">
            Nahrajte fotku svého pokoje
          </h3>
          <p className="text-charcoal/60 max-w-xs mx-auto text-sm">
            Přetáhněte fotku sem nebo vyberte z galerie
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <Button 
            variant="default" 
            className="bg-sage hover:bg-sage/90 text-white rounded-2xl px-8 py-6 text-base shadow-lg shadow-sage/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={(e) => {
              e.stopPropagation();
              triggerUpload();
            }}
          >
            <ImageIcon className="w-5 h-5 mr-2" />
            Galerie
          </Button>
          <Button 
            className="bg-terracotta hover:bg-terracotta/90 text-white rounded-2xl px-8 py-6 text-base shadow-lg shadow-terracotta/20 md:hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={(e) => {
              e.stopPropagation();
              document.getElementById('camera-input')?.click();
            }}
          >
            <Camera className="w-5 h-5 mr-2" />
            Vyfotit
          </Button>
        </div>

        <div className="pt-6 w-full max-w-sm">
          <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-sage/10 shadow-sm">
            <p className="text-[10px] font-bold text-sage uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-1 h-3 bg-sage rounded-full" />
              Tipy pro nejlepší výsledek
            </p>
            <div className="grid grid-cols-1 gap-2 text-left">
              <div className="flex items-center gap-3 text-xs text-charcoal/70">
                <span className="text-base">📐</span>
                <span>Foťte z rohu místnosti pro maximální záběr</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-charcoal/70">
                <span className="text-base">📱</span>
                <span>Držte telefon vodorovně a ve výšce očí</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-charcoal/70">
                <span className="text-base">☀️</span>
                <span>Ideálně při denním světle, bez blesku</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
