"use client";

import React, { useState, useRef, useCallback } from "react";
import { Upload, Camera, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface UploadZoneProps {
  onUpload: (imageDataUrl: string, file: File) => void;
  uploadedImage: string | null;
  onClear: () => void;
}

export function UploadZone({ onUpload, uploadedImage, onClear }: UploadZoneProps) {
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
          : "border-sage/40 bg-sand/30 hover:bg-sand/50 hover:border-sage/60"
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

      <div className="flex flex-col items-center p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-sage/10 flex items-center justify-center text-sage">
          <Upload className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-heading font-semibold text-charcoal">
            Nahrajte fotku svého pokoje
          </h3>
          <p className="text-charcoal/60 max-w-xs mx-auto text-sm">
            Přetáhněte fotku sem nebo klikněte pro výběr z galerie
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <Button variant="outline" className="border-sage text-sage hover:bg-sage hover:text-white rounded-xl">
            <ImageIcon className="w-4 h-4 mr-2" />
            Galerie
          </Button>
          <Button className="bg-sage hover:bg-sage/90 text-white rounded-xl md:hidden">
            <Camera className="w-4 h-4 mr-2" />
            Vyfotit
          </Button>
        </div>

        <div className="pt-6 text-left bg-white/50 p-4 rounded-2xl border border-sage/10 max-w-sm">
          <p className="text-xs font-semibold text-sage uppercase tracking-wider mb-2">Tipy pro nejlepší výsledek:</p>
          <ul className="text-xs text-charcoal/70 space-y-1 list-disc pl-4">
            <li>Foťte z rohu místnosti pro maximální záběr</li>
            <li>Držte telefon vodorovně a ve výšce očí</li>
            <li>Ideálně při denním světle, bez blesku</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
