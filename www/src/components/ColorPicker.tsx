"use client";

import React, { useRef } from "react";

interface ColorPickerProps {
  color: string;
  onChange: (newColor: string) => void;
  label: string;
}

export function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-charcoal/70">{label}</label>
      <div 
        className="group relative flex items-center gap-3 p-2 rounded-xl border border-sage/20 bg-white cursor-pointer hover:border-sage/40 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <div 
          className="w-10 h-10 md:w-12 md:h-12 rounded-lg shadow-sm border border-black/5 overflow-hidden relative"
          style={{ 
            backgroundColor: color,
            backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)"
          }}
        >
          <div className="absolute inset-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" />
        </div>
        
        <div className="flex flex-col">
          <span className="text-xs font-mono text-charcoal/40 group-hover:text-charcoal/60 transition-colors">
            {color.toUpperCase()}
          </span>
        </div>

        <input
          ref={inputRef}
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
