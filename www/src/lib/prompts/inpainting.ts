import { ParsedProduct } from "../../../../scripts/types";

export function buildInpaintingPrompt(
  analysis: any,
  product: ParsedProduct,
  userInstruction: string = "placed naturally in the room",
  coordinates?: { x: number; y: number }
) {
  const placementText = coordinates 
    ? `Place the object exactly at the normalized coordinates [y: ${coordinates.y}, x: ${coordinates.x}] (on a 0-1000 scale).`
    : userInstruction;

  return `
    ACT AS: Expert Interior Visualizer & Photo Editor.
    TASK: Edit the provided room image to include a new piece of furniture.

    --- CONTEXT: ROOM GEOMETRY (DO NOT CHANGE) ---
    Lighting: ${analysis.lighting?.source_direction || "natural"}, ${analysis.lighting?.color_temperature || "neutral"}
    Fixed Features: ${analysis.architectural_features?.join(", ") || "walls, floor, ceiling"}
    Floor: ${analysis.surfaces?.floor_material || "unknown"}
    
    --- OBJECT TO INSERT ---
    Product: ${product.name}
    Visual Description: ${product.description_visual}
    Price: ${product.price_czk} CZK
    
    --- PLACEMENT INSTRUCTION ---
    ${placementText}
    
    --- CRITICAL CONSTRAINTS ---
    1. PRESERVE the original room architecture, windows, and perspective EXACTLY.
    2. CAST SHADOWS consistent with the identified lighting source (${analysis.lighting?.source_direction || "natural"}).
    3. SCALE the object correctly relative to the room.
    4. OUTPUT a photorealistic image.
  `;
}
