"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { 
  Sofa, 
  Bed, 
  Baby, 
  Briefcase, 
  GraduationCap, 
  UtensilsCrossed, 
  ChefHat, 
  DoorOpen, 
  Bath, 
  TreePalm, 
  Home,
  ChevronLeft,
  ChevronRight,
  MousePointer2
} from "lucide-react";

interface RoomTypeSelectorProps {
  selected: string | null;
  onSelect: (roomType: string) => void;
  probabilities?: Record<string, number> | null;
  dict: any;
}

export function RoomTypeSelector({ selected, onSelect, probabilities, dict }: RoomTypeSelectorProps) {
  const [showHint, setShowHint] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Detect touch device
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    // Show hint once after 2 seconds if no interaction
    const timer = setTimeout(() => {
      if (!hasInteracted) setShowHint(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [hasInteracted]);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      // Convert vertical scroll to horizontal
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        scrollRef.current.scrollLeft += e.deltaY;
        handleInteraction();
      }
    }
  };

  const scrollBy = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
      handleInteraction();
    }
  };

  const handleInteraction = () => {
    setHasInteracted(true);
    setShowHint(false);
    checkScroll();
  };

  const handleItemClick = (id: string, e: React.MouseEvent) => {
    onSelect(id);
    handleInteraction();
    
    // Center the clicked item
    const target = e.currentTarget as HTMLElement;
    target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const ROOM_TYPES = {
    living: { label: dict.room_types.living, icon: Sofa },
    bedroom: { label: dict.room_types.bedroom, icon: Bed },
    kids: { label: dict.room_types.kids, icon: Baby },
    office: { label: dict.room_types.office, icon: Briefcase },
    student: { label: dict.room_types.student, icon: GraduationCap },
    dining: { label: dict.room_types.dining, icon: UtensilsCrossed },
    kitchen: { label: dict.room_types.kitchen, icon: ChefHat },
    hallway: { label: dict.room_types.hallway, icon: DoorOpen },
    bathroom: { label: dict.room_types.bathroom, icon: Bath },
    terrace: { label: dict.room_types.terrace, icon: TreePalm },
    other: { label: dict.room_types.other, icon: Home },
  };

  const sortedRoomTypes = Object.entries(ROOM_TYPES).sort((a, b) => {
    const probA = probabilities?.[a[0]] ?? 0;
    const probB = probabilities?.[b[0]] ?? 0;
    return probB - probA;
  });

  return (
    <div className="relative -mx-1 group/selector">
      {/* Navigation Arrows (PC only) */}
      {!isTouchDevice && (
        <>
          {canScrollLeft && (
            <button 
              onClick={() => scrollBy(-200)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white text-charcoal p-2 rounded-full shadow-lg border border-stone-100 transition-all hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {canScrollRight && (
            <button 
              onClick={() => scrollBy(200)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white text-charcoal p-2 rounded-full shadow-lg border border-stone-100 transition-all hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </>
      )}

      {/* Scrollable Container */}
      <div 
        ref={scrollRef}
        onWheel={handleWheel}
        onScroll={checkScroll}
        className="flex gap-2 sm:gap-3 overflow-x-auto pb-4 pt-2 px-1 no-scrollbar snap-x touch-pan-x scroll-smooth"
        onTouchStart={handleInteraction}
      >
        {sortedRoomTypes.map(([id, { label, icon: Icon }]) => {
          const isSelected = selected === id;
          const probability = probabilities?.[id];

          return (
            <button
              key={id}
              onClick={(e) => handleItemClick(id, e)}
              className={cn(
                "relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 transition-all duration-300 snap-center shrink-0 min-w-[100px] sm:min-w-[120px]",
                isSelected
                  ? "border-sage bg-sage text-white shadow-md scale-[1.02]"
                  : "border-sage/10 bg-white text-charcoal hover:border-sage/30 hover:bg-sand/10"
              )}
            >
              <Icon className={cn("w-6 h-6 sm:w-8 sm:h-8 mb-2 transition-transform duration-300", isSelected ? "text-white scale-110" : "text-sage")} />
              <span className="text-[11px] sm:text-sm font-medium text-center leading-tight">{label}</span>
              
              {probability !== undefined && probability > 0.15 && (
                <span className={cn(
                  "absolute -top-1 -right-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm z-10 animate-in zoom-in duration-500",
                  isSelected
                    ? "bg-white text-sage"
                    : "bg-terracotta text-white"
                )}>
                  {Math.round(probability * 100)}%
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Scroll/Swipe Hint Overlay */}
      {showHint && !hasInteracted && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-40 animate-in fade-in zoom-in duration-500">
          <div className="bg-charcoal/90 backdrop-blur-md text-white px-5 py-2.5 rounded-full flex items-center gap-3 shadow-2xl border border-white/10">
            {isTouchDevice ? (
              <>
                <ChevronLeft className="w-4 h-4 animate-pulse text-sage" />
                <span className="text-xs font-semibold tracking-wide uppercase">Swipe</span>
                <ChevronRight className="w-4 h-4 animate-pulse text-sage" />
              </>
            ) : (
              <>
                <MousePointer2 className="w-4 h-4 text-sage" />
                <span className="text-xs font-semibold tracking-wide uppercase">Scroll</span>
                <ChevronRight className="w-4 h-4 animate-bounce-x text-sage" />
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Fade indicators */}
      <div className={cn(
        "absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-sand/60 to-transparent pointer-events-none z-20 transition-opacity duration-300",
        canScrollLeft ? "opacity-100" : "opacity-0"
      )} />
      <div className={cn(
        "absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-sand/60 to-transparent pointer-events-none z-20 transition-opacity duration-300",
        canScrollRight ? "opacity-100" : "opacity-0"
      )} />
    </div>
  );
}
