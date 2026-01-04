export const ANALYSIS_PROMPT = `
Analyze this photograph of a room for interior design purposes. 
Return a JSON object with the following structure:

{
  "room_type": "living_room" | "bedroom" | "office" | "dining_room" | "other",
  "detected_style": "scandinavian" | "industrial" | "minimalist" | "traditional" | "modern",
  "color_palette": {
    "primary": "hex_color",
    "secondary": "hex_color",
    "accent": "hex_color",
    "description": "e.g. warm earthy tones with sage green accents"
  },
  "architecture": {
    "walls": "description of walls and layout",
    "floor_material": "e.g. oak parquet, grey concrete",
    "windows": "description of windows and light sources"
  },
  "estimated_dimensions": {
    "width_m": number,
    "length_m": number,
    "height_m": number
  },
  "recommendations": [
    {
      "item": "stojací lampa",
      "search_query": "černá kovová stojací lampa industriální styl",
      "reason": "Doplnění osvětlení pro čtení v rohu u křesla",
      "suggested_style": "industrial",
      "suggested_color": "black",
      "placement_coordinates": {
        "x": 500,
        "y": 700,
        "note": "CRITICAL: Use 0-1000 scale. x:0 is left, x:1000 is right. y:0 is top, y:1000 is bottom."
      }
    }
  ],
  "contextual_queries": [
    "dekorativní polštáře pro šedou pohovku",
    "minimalistická stojací lampa černá",
    "velká zelená pokojová rostlina"
  ]
}

CRITICAL INSTRUCTIONS:
1. Provide AT LEAST 10-15 recommendations to fully furnish the space.
2. For each recommendation, include a "search_query" that is a HIGHLY SPECIFIC descriptive string in CZECH (e.g., "dubový jídelní stůl pro 6 osob", "černá kovová stojací lampa industriální"). This query is used for Full-Text Search to find the perfect match.
3. If the room is empty or sparsely furnished, prioritize ESSENTIAL furniture.
4. Also include secondary items: lighting, rugs, wall art, plants, and storage.
5. The "item" field should be a specific but concise name in CZECH (e.g., "stojací lampa", "křeslo", "pohovka", "postel", "psací stůl", "koberec"). This is used for UI tooltips and icons.
6. Include "contextual_queries" for items that might not have a specific placement on the photo but would complement the design (e.g., accessories, textiles).
7. DIVERSIFY: Suggest a mix of different furniture types.
8. Use 0-1000 scale for placement_coordinates.
9. The "search_query" should be optimized to find high-quality products in a furniture database (IKEA, JYSK style).
10. All text fields (reason, item, search_query) MUST be in CZECH.
`;
