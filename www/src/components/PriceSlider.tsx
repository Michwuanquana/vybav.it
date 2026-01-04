"use client";

import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface PriceSliderProps {
  value: number;
  onChange: (newValue: number) => void;
  onCommit?: (newValue: number) => void;
}

const MIN = 5000;
const MAX = 150000;
const logMin = Math.log(MIN);
const logMax = Math.log(MAX);

export function PriceSlider({ value, onChange, onCommit }: PriceSliderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    if (!isEditing) {
      setInputValue(value.toString());
    }
  }, [value, isEditing]);

  const sliderToPrice = (s: number) => {
    const log = logMin + (s / 100) * (logMax - logMin);
    return Math.round(Math.exp(log) / 1000) * 1000;
  };

  const priceToSlider = (p: number) => {
    const clamped = Math.max(MIN, Math.min(MAX, p));
    return ((Math.log(clamped) - logMin) / (logMax - logMin)) * 100;
  };

  const handleSliderChange = (val: number[]) => {
    onChange(sliderToPrice(val[0]));
  };

  const handleSliderCommit = (val: number[]) => {
    if (onCommit) {
      onCommit(sliderToPrice(val[0]));
    }
  };

  const handleManualSubmit = () => {
    let num = parseInt(inputValue.replace(/\s/g, ""));
    if (isNaN(num)) num = value;
    
    const clamped = Math.max(MIN, Math.min(MAX, num));
    onChange(clamped);
    if (onCommit) onCommit(clamped);
    setIsEditing(false);
  };

  const formattedPrice = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(value);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center h-8">
        <label className="text-sm font-medium text-charcoal/70">Maximální rozpočet</label>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleManualSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
              className="w-24 h-8 text-right font-bold text-sage border-sage/30 focus-visible:ring-sage/20"
              autoFocus
            />
            <span className="text-sm font-bold text-sage">Kč</span>
          </div>
        ) : (
          <span 
            onClick={() => setIsEditing(true)}
            className="text-2xl font-bold text-sage cursor-pointer hover:opacity-80 transition-opacity border-b border-dashed border-sage/30"
          >
            {formattedPrice}
          </span>
        )}
      </div>
      
      <Slider
        value={[priceToSlider(value)]}
        min={0}
        max={100}
        step={1}
        onValueChange={handleSliderChange}
        onValueCommit={handleSliderCommit}
        className="py-4"
      />
      
      <div className="flex justify-between text-[10px] text-charcoal/40 font-medium uppercase tracking-wider">
        <span>5 000 Kč</span>
        <span>150 000 Kč</span>
      </div>
    </div>
  );
}
