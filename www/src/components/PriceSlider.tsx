"use client";

import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PriceSliderProps {
  value: number;
  spentAmount?: number;
  onChange: (newValue: number) => void;
  onCommit?: (newValue: number) => void;
}

const MIN = 5000;
const MAX = 150000;
const logMin = Math.log(MIN);
const logMax = Math.log(MAX);

export function PriceSlider({ value, spentAmount = 0, onChange, onCommit }: PriceSliderProps) {
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

  const formattedSpent = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(spentAmount);

  const isOverBudget = spentAmount > value;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end h-12">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-charcoal/70">Rozpočet</label>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-sm font-bold transition-colors",
              isOverBudget ? "text-destructive" : "text-charcoal/50"
            )}>
              {formattedSpent}
            </span>
            <span className="text-xs text-charcoal/30">/</span>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={handleManualSubmit}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                  className="w-20 h-7 text-right p-1 font-bold text-sage border-sage/30 focus-visible:ring-sage/20"
                  autoFocus
                />
                <span className="text-xs font-bold text-sage">Kč</span>
              </div>
            ) : (
              <span 
                onClick={() => setIsEditing(true)}
                className="text-lg font-bold text-sage cursor-pointer hover:opacity-80 transition-opacity border-b border-dashed border-sage/30"
              >
                {formattedPrice}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="relative">
        <Slider
          value={[priceToSlider(value)]}
          min={0}
          max={100}
          step={1}
          onValueChange={handleSliderChange}
          onValueCommit={handleSliderCommit}
          className="relative z-10 py-4"
        />
        {/* Progress bar overlay (Spent) */}
        <div 
          className={cn(
            "absolute top-[calc(50%-3px)] left-0 h-1.5 rounded-full transition-all duration-300 pointer-events-none",
            isOverBudget ? "bg-destructive/60" : "bg-black/25"
          )}
          style={{ 
            width: `${priceToSlider(spentAmount)}%`,
            zIndex: 15
          }} 
        />
      </div>
      
      <div className="flex justify-between text-[10px] text-charcoal/40 font-medium uppercase tracking-wider">
        <span>5 000 Kč</span>
        <span>150 000 Kč</span>
      </div>
    </div>
  );
}
