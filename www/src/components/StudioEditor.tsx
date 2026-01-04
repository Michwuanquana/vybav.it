import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Trash2, 
  Save, 
  Undo, 
  MousePointer2,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Marker {
  id: string;
  x: number; // 0-100
  y: number; // 0-100
  label: string;
  productId?: string;
}

interface StudioEditorProps {
  roomImageUrl: string;
  initialMarkers?: Marker[];
  onSave: (markers: Marker[]) => void;
  onClose: () => void;
}

export function StudioEditor({ roomImageUrl, initialMarkers = [], onSave, onClose }: StudioEditorProps) {
  const [markers, setMarkers] = useState<Marker[]>(initialMarkers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newMarker: Marker = {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      label: "Nový bod",
    };

    setMarkers([...markers, newMarker]);
    setSelectedId(newMarker.id);
  };

  const removeMarker = (id: string) => {
    setMarkers(markers.filter(m => m.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Studio Editor</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Zrušit</Button>
          <Button size="sm" onClick={() => onSave(markers)}>
            <Save className="w-4 h-4 mr-2" />
            Uložit návrh
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
            
            {markers.map((marker) => (
              <div
                key={marker.id}
                className={cn(
                  "absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-2 flex items-center justify-center transition-all",
                  selectedId === marker.id 
                    ? "bg-primary text-primary-foreground border-white scale-110 z-20" 
                    : "bg-white/80 text-primary border-primary hover:bg-white z-10"
                )}
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(marker.id);
                }}
              >
                <Plus className="w-4 h-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Boční panel s detaily */}
        <div className="w-80 border-l bg-card p-4 overflow-y-auto">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <MousePointer2 className="w-4 h-4" />
            Prvky v místnosti
          </h3>
          
          <div className="space-y-3">
            {markers.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                Klikněte do fotky pro přidání nového prvku.
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
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex flex-col">
                    <input 
                      className="text-sm font-medium bg-transparent border-none focus:ring-0 p-0"
                      value={marker.label}
                      onChange={(e) => {
                        const newMarkers = markers.map(m => 
                          m.id === marker.id ? { ...m, label: e.target.value } : m
                        );
                        setMarkers(newMarkers);
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      Pozice: {Math.round(marker.x)}%, {Math.round(marker.y)}%
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMarker(marker.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
