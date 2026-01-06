import React, { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Trash2, 
  Save, 
  MousePointer2,
  Layers,
  GripVertical,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";

// Typy produktů pro select
const PRODUCT_TYPES = [
  'sofa', 'chair', 'table', 'bed', 'lamp', 
  'rug', 'shelf', 'wardrobe', 'desk', 'plant', 
  'mirror', 'curtain', 'other'
] as const;

type ProductType = typeof PRODUCT_TYPES[number];

interface Marker {
  id: string;
  x: number; // 0-100
  y: number; // 0-100
  label: string;
  productType: ProductType;
  productId?: string;
}

interface StudioEditorProps {
  roomImageUrl: string;
  initialMarkers?: Marker[];
  onSave: (markers: Marker[]) => void;
  onClose: () => void;
  dict: any;
}

export function StudioEditor({ roomImageUrl, initialMarkers = [], onSave, onClose, dict }: StudioEditorProps) {
  const [markers, setMarkers] = useState<Marker[]>(
    initialMarkers.map(m => ({ ...m, productType: m.productType || 'other' }))
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; markerX: number; markerY: number } | null>(null);

  // Najdi vybraný marker
  const selectedMarker = markers.find(m => m.id === selectedId);

  // Handler pro kliknutí na obrázek - přidá nový marker
  const handleImageClick = (e: React.MouseEvent) => {
    if (!containerRef.current || draggingId) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newMarker: Marker = {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      label: dict.studio.new_point,
      productType: 'other',
    };

    setMarkers([...markers, newMarker]);
    setSelectedId(newMarker.id);
  };

  // Drag handlers pro bubliny
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, markerId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    const marker = markers.find(m => m.id === markerId);
    if (!marker) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDraggingId(markerId);
    setSelectedId(markerId);
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      markerX: marker.x,
      markerY: marker.y,
    };
  }, [markers]);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!draggingId || !containerRef.current || !dragStartRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((clientX - dragStartRef.current.x) / rect.width) * 100;
    const deltaY = ((clientY - dragStartRef.current.y) / rect.height) * 100;

    const newX = Math.max(0, Math.min(100, dragStartRef.current.markerX + deltaX));
    const newY = Math.max(0, Math.min(100, dragStartRef.current.markerY + deltaY));

    setMarkers(prev => prev.map(m => 
      m.id === draggingId ? { ...m, x: newX, y: newY } : m
    ));
  }, [draggingId]);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    dragStartRef.current = null;
  }, []);

  // Event listeners pro drag
  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [draggingId, handleDragMove, handleDragEnd]);

  const removeMarker = (id: string) => {
    setMarkers(markers.filter(m => m.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateMarkerType = (id: string, productType: ProductType) => {
    setMarkers(markers.map(m => 
      m.id === id ? { ...m, productType, label: dict.studio.product_types?.[productType] || productType } : m
    ));
  };

  const updateMarkerLabel = (id: string, label: string) => {
    setMarkers(markers.map(m => 
      m.id === id ? { ...m, label } : m
    ));
  };

  // Získá přeložený název typu
  const getTypeName = (type: ProductType) => {
    return dict.studio.product_types?.[type] || type;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">{dict.studio.title}</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>{dict.common.cancel}</Button>
          <Button size="sm" onClick={() => onSave(markers)}>
            <Save className="w-4 h-4 mr-2" />
            {dict.studio.save_design}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Hlavní editační plocha */}
        <div className="flex-1 relative bg-muted/30 overflow-auto flex items-center justify-center p-8">
          <div 
            ref={containerRef}
            className="relative cursor-crosshair shadow-2xl max-w-full max-h-full"
            onClick={handleImageClick}
          >
            <img 
              src={roomImageUrl} 
              alt="Room" 
              className="block max-w-full h-auto rounded-lg select-none"
              draggable={false}
            />
            
            {/* Markery s draggable bublinami */}
            {markers.map((marker) => (
              <div
                key={marker.id}
                className={cn(
                  "absolute transition-transform",
                  draggingId === marker.id && "z-50"
                )}
                style={{ 
                  left: `${marker.x}%`, 
                  top: `${marker.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Hlavní marker bod */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-grab active:cursor-grabbing transition-all",
                    selectedId === marker.id 
                      ? "bg-primary text-primary-foreground border-white scale-110 shadow-lg" 
                      : "bg-white/90 text-primary border-primary hover:bg-white hover:scale-105",
                    draggingId === marker.id && "scale-125 shadow-xl"
                  )}
                  onMouseDown={(e) => handleDragStart(e, marker.id)}
                  onTouchStart={(e) => handleDragStart(e, marker.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!draggingId) setSelectedId(marker.id);
                  }}
                >
                  <Package className="w-4 h-4" />
                </div>

                {/* Draggable bublina s názvem - zobrazí se vždy */}
                <div
                  className={cn(
                    "absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap",
                    "bg-white rounded-lg shadow-lg border px-3 py-2 min-w-[120px]",
                    "flex items-center gap-2 cursor-grab active:cursor-grabbing",
                    selectedId === marker.id && "ring-2 ring-primary ring-offset-1",
                    draggingId === marker.id && "shadow-2xl scale-105"
                  )}
                  onMouseDown={(e) => handleDragStart(e, marker.id)}
                  onTouchStart={(e) => handleDragStart(e, marker.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!draggingId) setSelectedId(marker.id);
                  }}
                >
                  <GripVertical className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-charcoal truncate max-w-[100px]">
                      {marker.label}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {getTypeName(marker.productType)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Boční panel s detaily */}
        <div className="w-80 border-l bg-card p-4 overflow-y-auto">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <MousePointer2 className="w-4 h-4" />
            {dict.studio.marker_label}
          </h3>
          
          <div className="space-y-3">
            {markers.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                {dict.studio.click_to_add}
              </p>
            )}
            
            {markers.map((marker) => (
              <Card 
                key={marker.id}
                className={cn(
                  "transition-colors cursor-pointer",
                  selectedId === marker.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}
                onClick={() => setSelectedId(marker.id)}
              >
                <CardContent className="p-3 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      {/* Název prvku */}
                      <input 
                        className="text-sm font-medium bg-transparent border-none focus:ring-0 p-0 w-full outline-none"
                        value={marker.label}
                        onChange={(e) => updateMarkerLabel(marker.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      {/* Select pro typ produktu */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase font-medium">
                          {dict.studio.type}:
                        </span>
                        <select
                          className={cn(
                            "text-xs bg-muted/50 border border-muted rounded-md px-2 py-1 cursor-pointer",
                            "focus:outline-none focus:ring-1 focus:ring-primary"
                          )}
                          value={marker.productType}
                          onChange={(e) => updateMarkerType(marker.id, e.target.value as ProductType)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {PRODUCT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {getTypeName(type)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMarker(marker.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  
                  {/* Pozice */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-muted/50">
                    <span>{dict.studio.position}: {Math.round(marker.x)}%, {Math.round(marker.y)}%</span>
                    <span className="italic">{dict.studio.drag_hint}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
