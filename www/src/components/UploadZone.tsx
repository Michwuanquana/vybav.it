"use client";

import React, { useState, useRef, useCallback } from "react";
import { Upload, Camera, X, Image as ImageIcon, Loader2, Wand, Ruler, Smartphone, Sun, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface UploadZoneProps {
  onUpload: (imageDataUrl: string, file: File) => void;
  uploadedImage: string | null;
  onClear: () => void;
  className?: string;
  dict: any;
}

export function UploadZone({ onUpload, uploadedImage, onClear, className, dict }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [demoKeyword, setDemoKeyword] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      alert(dict.upload.error_only_images);
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

  // Pomocná funkce pro převod base64 dataUrl na Blob bez fetch
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const [header, base64Data] = dataUrl.split(',');
    const mimeMatch = header.match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new Blob([bytes], { type: mimeType });
  };

  const handleDemoClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoadingDemo(true);
    setDemoKeyword(null);
    
    try {
      // 1. Stáhneme náhodný obrázek ze serveru
      const response = await fetch('/api/demo/random');
      if (!response.ok) throw new Error('Failed to fetch demo image');
      
      const data = await response.json();
      if (!data.success || !data.dataUrl) throw new Error('No image data');
      
      setDemoKeyword(data.keyword);
      
      // 2. Převedeme dataUrl na File objekt (přímá konverze, bez fetch)
      const blob = dataUrlToBlob(data.dataUrl);
      const file = new File([blob], `demo-${Date.now()}.jpg`, { type: data.contentType || 'image/jpeg' });
      
      // 3. Předáme jako normální upload
      onUpload(data.dataUrl, file);
      
    } catch (error) {
      console.error('Demo image error:', error);
      alert(dict.upload?.demo_error || 'Nepodařilo se načíst testovací obrázek');
    } finally {
      setIsLoadingDemo(false);
    }
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
        {/* Před/Po Preview - Animovaný náhled transformace */}
        <div className="relative w-64 h-40 rounded-2xl overflow-hidden mb-2">
          {/* Blurred "Před" layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-sand/80 via-sand/60 to-sage/20 blur-sm">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-24 border-2 border-dashed border-charcoal/20 rounded-lg" />
            </div>
          </div>
          
          {/* Animated "Po" overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-terracotta/10 via-sage/20 to-terracotta/10 blur-sm animate-pulse opacity-50">
            <div className="absolute bottom-4 left-4 w-12 h-16 bg-sage/30 rounded" />
            <div className="absolute top-4 right-4 w-8 h-8 bg-terracotta/30 rounded-full" />
            <div className="absolute bottom-6 right-8 w-16 h-4 bg-charcoal/20 rounded" />
          </div>
          
          {/* Overlay text */}
          <div className="absolute inset-0 flex items-center justify-center bg-charcoal/5">
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-sage uppercase tracking-widest">Vaše transformace</p>
              <Zap className="w-8 h-8 text-terracotta/90 mx-auto" />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-heading font-semibold text-charcoal">
            {dict.upload.title}
          </h3>
          <p className="text-charcoal/60 max-w-xs mx-auto text-sm">
            {dict.upload.subtitle}
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
            {dict.upload.choose_file}
          </Button>
          <Button 
            className="bg-terracotta hover:bg-terracotta/90 text-white rounded-2xl px-8 py-6 text-base shadow-lg shadow-terracotta/20 md:hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={(e) => {
              e.stopPropagation();
              document.getElementById('camera-input')?.click();
            }}
          >
            <Camera className="w-5 h-5 mr-2" />
            {dict.upload.take_photo}
          </Button>
        </div>

        {/* Demo/Test Button */}
        <div className="pt-2">
          <Button 
            variant="outline"
            disabled={isLoadingDemo}
            className="border-sage/30 text-sage hover:bg-sage/5 rounded-xl px-6 py-4 text-sm transition-all"
            onClick={handleDemoClick}
          >
            {isLoadingDemo ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {demoKeyword ? `"${demoKeyword}"` : (dict.upload?.demo_loading || 'Stahuji...')}
              </>
            ) : (
              <>
                <Wand className="w-4 h-4 mr-2" />
                {dict.upload?.demo_button || 'Vyzkoušet s demo fotkou'}
              </>
            )}
          </Button>
        </div>

        {/* Tips - sbalitelné */}
        <div className="pt-4 w-full max-w-sm">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTips(!showTips);
            }}
            className="w-full text-left"
          >
            <div className="flex items-center justify-between px-2 py-2 hover:bg-sage/5 rounded-lg transition-colors">
              <p className="text-xs font-bold text-sage uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-3 bg-sage rounded-full" />
                {dict.upload.tips_title}
              </p>
              <span className={cn(
                "text-sage transition-transform duration-200",
                showTips && "rotate-180"
              )}>▼</span>
            </div>
          </button>
          
          {showTips && (
            <div className="mt-2 bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-sage/10 shadow-sm animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 gap-2 text-left">
                <div className="flex items-center gap-3 text-xs text-charcoal/70">
                  <Ruler className="w-3 h-3 text-charcoal/70" />
                  <span>{dict.upload.tip_corner}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-charcoal/70">
                  <Smartphone className="w-3 h-3 text-charcoal/70" />
                  <span>{dict.upload.tip_horizontal}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-charcoal/70">
                  <Sun className="w-3 h-3 text-charcoal/70" />
                  <span>{dict.upload.tip_daylight}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
