"use client";

import React from "react";
import { Slider } from "@/components/ui/slider";

interface PriceSliderProps {
  value: number;
  onChange: (newValue: number) => void;
}

const MIN = 5000;
const MAX = 150000;
const logMin = Math.log(MIN);
const logMax = Math.log(MAX);

export function PriceSlider({ value, onChange }: PriceSliderProps) {
  const sliderToPrice = (s: number) => {
    const log = logMin + (s / 100) * (logMax - logMin);
    return Math.round(Math.exp(log) / 1000) * 1000;
  };

  const priceToSlider = (p: number) => {
    return ((Math.log(p) - logMin) / (logMax - logMin)) * 100;
  };

  const handleSliderChange = (val: number[]) => {
    onChange(sliderToPrice(val[0]));
  };

  const formattedPrice = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(value);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <label className="text-sm font-medium text-charcoal/70">Maximální rozpočet</label>
        <span className="text-2xl font-bold text-sage">{formattedPrice}</span>
      </div>
      
      <Slider
        value={[priceToSlider(value)]}
        min={0}
        max={100}
        step={1}
        onValueChange={handleSliderChange}
        className="py-4"
      />
      
      <div className="flex justify-between text-[10px] text-charcoal/40 font-medium uppercase tracking-wider">
        <span>5 000 Kč</span>
        <span>150 000 Kč</span>
      </div>
    </div>
  );
}
