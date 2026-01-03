"use client";

import React from "react";
import { cn } from "@/lib/utils";

const ROOM_TYPES = {
  living: { label: "Obývací pokoj", icon: "🛋️" },
  bedroom: { label: "Ložnice", icon: "🛏️" },
  kids: { label: "Dětský pokojíček", icon: "🧸" },
  office: { label: "Pracovna", icon: "💼" },
  other: { label: "Jiné", icon: "🏠" },
};

interface RoomTypeSelectorProps {
  selected: string | null;
  onSelect: (roomType: string) => void;
  probabilities?: Record<string, number>;
}

export function RoomTypeSelector({ selected, onSelect, probabilities }: RoomTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {Object.entries(ROOM_TYPES).map(([id, { label, icon }]) => {
        const isSelected = selected === id;
        const probability = probabilities?.[id];

        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={cn(
              "relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200",
              isSelected
                ? "border-sage bg-sage text-white shadow-lg scale-[1.02]"
                : "border-sage/10 bg-white text-charcoal hover:border-sage/30 hover:bg-sand/10"
            )}
          >
            <span className="text-3xl mb-2">{icon}</span>
            <span className="text-sm font-medium">{label}</span>
            
            {probability !== undefined && probability > 0.3 && !isSelected && (
              <span className="absolute -top-2 -right-2 bg-terracotta text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                {Math.round(probability * 100)}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
