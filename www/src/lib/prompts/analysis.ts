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
      "item": "sofa",
      "reason": "why this item fits the room",
      "suggested_style": "minimalist",
      "suggested_color": "dark grey"
    }
  ]
}

Be precise and objective. If the room is empty, focus on the potential. If it's furnished, analyze the current state.
`;
