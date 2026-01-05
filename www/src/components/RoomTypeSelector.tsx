"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Sofa, Bed, Baby, Briefcase, Home } from "lucide-react";

interface RoomTypeSelectorProps {
  selected: string | null;
  onSelect: (roomType: string) => void;
  probabilities?: Record<string, number>;
  dict: any;
}

export function RoomTypeSelector({ selected, onSelect, probabilities, dict }: RoomTypeSelectorProps) {
  const ROOM_TYPES = {
    living: { label: dict.room_types.living, icon: Sofa },
    bedroom: { label: dict.room_types.bedroom, icon: Bed },
    kids: { label: dict.room_types.kids, icon: Baby },
    office: { label: dict.room_types.office, icon: Briefcase },
    other: { label: dict.room_types.other, icon: Home },
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3">
      {Object.entries(ROOM_TYPES).map(([id, { label, icon: Icon }]) => {
        const isSelected = selected === id;
        const probability = probabilities?.[id];

        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={cn(
              "relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 transition-all duration-200",
              isSelected
                ? "border-sage bg-sage text-white shadow-lg scale-[1.02]"
                : "border-sage/10 bg-white text-charcoal hover:border-sage/30 hover:bg-sand/10"
            )}
          >
            <Icon className={cn("w-6 h-6 sm:w-8 sm:h-8 mb-2", isSelected ? "text-white" : "text-sage")} />
            <span className="text-xs sm:text-sm font-medium text-center">{label}</span>
            
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
