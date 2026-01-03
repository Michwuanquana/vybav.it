/**
 * Parser Utilities
 * Helper functions for parsing product data from CSV
 */

import { createHash } from 'crypto';

/**
 * Generate unique product ID from brand and name
 */
export function generateProductId(brand: string, series: string, name: string): string {
  // Create a stable hash-based ID
  const input = `${brand}-${series}-${name}`.toLowerCase();
  const hash = createHash('md5').update(input).digest('hex').substring(0, 12);
  return `${brand.toLowerCase()}-${hash}`;
}

/**
 * Extract dimensions from product name
 * Supports formats: 70x160, Ø50, 40×60, ŠxDxV, D500, 40x60x0,4
 */
export function extractDimensions(name: string): object | null {
  // Normalize name for easier matching
  const n = name.replace(/\s+/g, ' ');
  const dims: any = { unit: 'cm' };
  let found = false;

  // 1. Try diameter (Ø) with optional height/length
  // Format: Ø7xV16, Ø30, Ø 25 x V 2
  const diameterMatch = n.match(/Ø\s*(\d+(?:[.,]\d+)?)(?:\s*[x×*]\s*V\s*(\d+(?:[.,]\d+)?))?/i);
  if (diameterMatch) {
    dims.diameter = parseFloat(diameterMatch[1].replace(',', '.'));
    if (diameterMatch[2]) {
      dims.height = parseFloat(diameterMatch[2].replace(',', '.'));
    }
    found = true;
  }
  
  // 2. Try WxHxD format (Š x D x V or similar)
  // Handle decimals with [.,] and various separators
  // Format: 70x160, 40x60x0,4, 33x42
  if (!found) {
    const dimensionMatch = n.match(/(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)(?:\s*[x×*]\s*(\d+(?:[.,]\d+)?))?/i);
    if (dimensionMatch) {
      dims.width = parseFloat(dimensionMatch[1].replace(',', '.'));
      dims.height = parseFloat(dimensionMatch[2].replace(',', '.'));
      if (dimensionMatch[3]) {
        dims.depth = parseFloat(dimensionMatch[3].replace(',', '.'));
      }
      found = true;
    }
  }
  
  // 3. Try ŠxDxV format (Š33×D33, Š10×D10×V76)
  if (!found) {
    const sdvMatch = n.match(/Š\s*(\d+(?:[.,]\d+)?)\s*[x×*]\s*D\s*(\d+(?:[.,]\d+)?)(?:\s*[x×*]\s*V\s*(\d+(?:[.,]\d+)?))?(?:\s*(cm|m))?/i);
    if (sdvMatch) {
      let multiplier = 1;
      if (sdvMatch[4] && sdvMatch[4].toLowerCase() === 'm') multiplier = 100;

      dims.width = parseFloat(sdvMatch[1].replace(',', '.')) * multiplier;
      dims.length = parseFloat(sdvMatch[2].replace(',', '.')) * multiplier;
      if (sdvMatch[3]) dims.height = parseFloat(sdvMatch[3].replace(',', '.')) * multiplier;
      found = true;
    }
  }

  // 4. Try individual D, Š, V prefixes if not found yet
  if (!found) {
    const lengthMatch = n.match(/D\s*(\d+(?:[.,]\d+)?)(?:\s*(cm|m)(?:\s|$))?/i);
    const widthMatch = n.match(/Š\s*(\d+(?:[.,]\d+)?)(?:\s*(cm|m)(?:\s|$))?/i);
    const heightMatch = n.match(/V\s*(\d+(?:[.,]\d+)?)(?:\s*(cm|m)(?:\s|$))?/i);
    
    if (lengthMatch) {
      let val = parseFloat(lengthMatch[1].replace(',', '.'));
      if (lengthMatch[2] && lengthMatch[2].toLowerCase() === 'm') val *= 100;
      dims.length = val;
      found = true;
    }
    if (widthMatch) {
      let val = parseFloat(widthMatch[1].replace(',', '.'));
      if (widthMatch[2] && widthMatch[2].toLowerCase() === 'm') val *= 100;
      dims.width = val;
      found = true;
    }
    if (heightMatch) {
      let val = parseFloat(heightMatch[1].replace(',', '.'));
      if (heightMatch[2] && heightMatch[2].toLowerCase() === 'm') val *= 100;
      dims.height = val;
      found = true;
    }
  }

  // 5. Special case for tablecloths (Ubrus ... 140)
  if (!found && n.toLowerCase().includes('ubrus')) {
    const ubrusMatch = n.match(/(\d{2,3})(?:\s|$)/);
    if (ubrusMatch) {
      dims.diameter = parseFloat(ubrusMatch[1]);
      found = true;
    }
  }

  // 6. Try single dimension with unit (V33 cm, 60 cm)
  if (!found) {
    const singleDimMatch = n.match(/(\d+(?:[.,]\d+)?)\s*cm/i);
    if (singleDimMatch) {
      dims.height = parseFloat(singleDimMatch[1].replace(',', '.'));
      found = true;
    }
  }
  
  return found ? dims : null;
}

/**
 * Check if an image URL is valid and matches the expected brand format
 */
export function isValidImageUrl(url: string, brand: 'IKEA' | 'JYSK'): boolean {
  if (!url) return false;
  
  // First check for placeholders
  if (isPlaceholderImage(url)) return false;

  // Brand specific format validation
  if (brand === 'IKEA') {
    // IKEA images usually follow this pattern:
    // https://www.ikea.com/cz/cs/images/products/name__1234567_pe123456_s5.jpg
    // or similar on ikea.com/images/
    return url.includes('ikea.com') && 
           (url.includes('/images/products/') || url.includes('/images/')) &&
           (url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.webp') || url.includes('?'));
  }

  if (brand === 'JYSK') {
    // JYSK images usually follow this pattern:
    // https://cdn1.jysk.com/getimage/wd3.medium/123456
    return url.includes('jysk.com') && url.includes('/getimage/');
  }

  return false;
}

/**
 * Check if an image URL is a placeholder
 */
export function isPlaceholderImage(url: string): boolean {
  if (!url) return true;
  
  const placeholderPatterns = [
    /placeholder/i,
    /no-image/i,
    /noimage/i,
    /default/i,
    /empty/i,
    /pixel/i,
    /transparent/i,
    /dummy/i,
    /example\.com/i,
    /test\.com/i,
    /ikea\.com\/.*\/placeholder/i,
    /jysk\.com\/.*\/placeholder/i,
    /jysk\.cz\/.*\/placeholder/i,
    /static\.ikea\.com\/.*\/noimage/i,
    /assets\.jysk\.com\/.*\/default/i
  ];

  return placeholderPatterns.some(pattern => pattern.test(url));
}

/**
 * Extract color from product name
 */
export function extractColor(name: string): string | null {
  const colorMap: Record<string, string> = {
    'bílá': 'white',
    'bílý': 'white',
    'černá': 'black',
    'černý': 'black',
    'šedá': 'gray',
    'šedý': 'gray',
    'zlatá': 'gold',
    'zlatý': 'gold',
    'stříbrná': 'silver',
    'stříbrný': 'silver',
    'hnědá': 'brown',
    'hnědý': 'brown',
    'červená': 'red',
    'červený': 'red',
    'modrá': 'blue',
    'modrý': 'blue',
    'zelená': 'green',
    'zelený': 'green',
    'žlutá': 'yellow',
    'žlutý': 'yellow',
    'růžová': 'pink',
    'růžový': 'pink',
    'béžová': 'beige',
    'béžový': 'beige',
    'přírodní': 'natural',
    'písková': 'sand',
    'tmavě': 'dark',
    'světle': 'light',
    'tm.růžová': 'dark_pink',
    'tm.zelená': 'dark_green',
    'šedotyrkysová': 'gray_turquoise',
    'černohnědá': 'black_brown',
    'antracit': 'anthracite',
    'tyrkysová': 'turquoise',
    'oranžová': 'orange',
    'fialová': 'purple',
    'krémová': 'cream',
    'vícebarevná': 'multicolor',
    'přírodní': 'natural',
  };
  
  const lower = name.toLowerCase();
  for (const [czech, english] of Object.entries(colorMap)) {
    if (lower.includes(czech)) {
      return english;
    }
  }
  
  return null;
}

/**
 * Extract material from product name
 */
export function extractMaterial(name: string): string | null {
  const lower = name.toLowerCase();

  // 1. Define specific wood types
  const woodTypes: Record<string, string> = {
    'dub': 'oak',
    'borovic': 'pine',
    'buk': 'beech',
    'bříz': 'birch',
    'březov': 'birch',
    'jasan': 'ash',
    'akáci': 'acacia',
    'ořech': 'walnut',
    'smrk': 'spruce',
    'bambus': 'bamboo',
  };

  let woodType = '';
  for (const [czech, english] of Object.entries(woodTypes)) {
    if (lower.includes(czech)) {
      woodType = english;
      break;
    }
  }

  // 2. Modifiers
  const isSolid = lower.includes('masiv') || lower.includes('masív') || lower.includes('masive');
  const isVeneer = lower.includes('dýha') || lower.includes('dýhov') || lower.includes('dyha') || lower.includes('dyhov');
  
  // 3. Logic for wood combinations
  if (isSolid) {
    return woodType ? `solid_wood (${woodType})` : 'solid_wood';
  }
  if (isVeneer) {
    const veneerTerm = 'veneer';
    return woodType ? `engineered_wood (${veneerTerm} - ${woodType})` : `engineered_wood (${veneerTerm})`;
  }
  
  // 4. Specific engineered wood types
  if (lower.includes('dřevotříska') || lower.includes('dřevotřískov') || lower.includes('drevotriska')) 
    return 'engineered_wood (particle_board)';
  if (lower.includes('mdf')) return 'engineered_wood (mdf)';
  if (lower.includes('hdf')) return 'engineered_wood (hdf)';
  if (lower.includes('lamino')) return 'engineered_wood (lamino)';
  if (lower.includes('překližka') || lower.includes('překližkov') || lower.includes('preklizka')) 
    return 'engineered_wood (plywood)';
  if (lower.includes('sololit') || lower.includes('dřevovláknit') || lower.includes('drevovlaknit')) 
    return 'engineered_wood (fiberboard)';

  // 5. Other materials
  const otherMaterials: Record<string, string> = {
    'ocel': 'steel',
    'nerezavějící ocel': 'stainless_steel',
    'hliník': 'aluminum',
    'mosaz': 'brass',
    'měď': 'copper',
    'kov': 'metal',
    'sklo': 'glass',
    'kamenina': 'stoneware',
    'keramika': 'ceramic',
    'porcelán': 'ceramic',
    'plast': 'plastic',
    'textil': 'textile',
    'látka': 'fabric',
    'koberec': 'carpet',
    'koženka': 'faux_leather',
    'mramor': 'marble',
    'samet': 'velvet',
    'kůže': 'leather',
    'ratan': 'rattan',
    'juta': 'jute',
    'vlna': 'wool',
    'bavlna': 'cotton',
    'polyester': 'polyester',
    'smalt': 'metal',
    'litina': 'metal',
    'papír': 'paper',
    'korek': 'cork',
    'beton': 'concrete',
    'travertin': 'travertine',
  };

  for (const [czech, english] of Object.entries(otherMaterials)) {
    if (czech === 'papír' && lower.includes('toaletní papír')) continue;
    if (lower.includes(czech)) {
      return english;
    }
  }

  // Fallback to just wood type if found but no solid/veneer modifier
  if (woodType) return woodType;

  // Last resort: general wood
  if (lower.includes('dřevo') || lower.includes('dřevěn') || lower.includes('drevo')) return 'wood';

  return null;
}

/**
 * Detect product style from name, series and material
 */
export function detectStyle(name: string, series: string | null, material: string | null): string[] {
  const styles = new Set<string>();
  const lowerName = name.toLowerCase();
  const lowerSeries = (series || '').toLowerCase();
  const lowerMaterial = (material || '').toLowerCase();

  // 1. Scandinavian (Default for many IKEA/JYSK items)
  const scandiSeries = [
    'hemnes', 'malm', 'billy', 'kallax', 'lack', 'ivar', 'poäng', 'nordli', 'tarva', 'lisabo',
    'ekedalen', 'ingatorp', 'abildro', 'agerby', 'billund', 'gentofte', 'jels', 'kalby', 'ry',
    'rav', 'modi', 'vestervig', 'plovstrup', 'skals', 'vinderup'
  ];
  const scandiKeywords = ['světlý dub', 'bříza', 'borovice', 'přírodní', 'bílá', 'jednoduchý'];
  
  if (scandiSeries.includes(lowerSeries) || scandiKeywords.some(k => lowerName.includes(k))) {
    styles.add('scandinavian');
  }

  // 2. Industrial
  const industrialSeries = [
    'fjällbo', 'vittsjö', 'bror', 'hyllis', 'kullaberg', 'enhet', 'omar',
    'trappedal', 'vandsted', 'vedde'
  ];
  const industrialKeywords = ['kov', 'ocel', 'černá', 'industriální', 'loft', 'beton', 'nerez'];
  
  if (industrialSeries.includes(lowerSeries) || 
      (industrialKeywords.some(k => lowerName.includes(k)) && lowerMaterial.includes('metal'))) {
    styles.add('industrial');
  }

  // 3. Minimalist
  const minimalistSeries = ['bestå', 'pax', 'eket', 'platsa', 'malm', 'lack'];
  const minimalistKeywords = ['minimalistický', 'čisté linie', 'bez úchytek', 'vysoký lesk', 'hladký'];
  
  if (minimalistSeries.includes(lowerSeries) || minimalistKeywords.some(k => lowerName.includes(k))) {
    styles.add('minimalist');
  }

  // 4. Traditional / Rustic
  const traditionalSeries = [
    'liatorp', 'ingolf', 'lommarp', 'idanäs', 'havsta', 'tyssedal', 'strandmon',
    'fredericia', 'markskel'
  ];
  const traditionalKeywords = ['tradiční', 'rustikální', 'ozdobný', 'venkovský', 'klasický', 'masiv'];
  
  if (traditionalSeries.includes(lowerSeries) || traditionalKeywords.some(k => lowerName.includes(k))) {
    styles.add('traditional');
  }

  // 5. Modern
  const modernSeries = [
    'bestå', 'alex', 'micke', 'pax', 'platsa', 'eket', 'vimle', 'kivik', 'morabo',
    'tyssa', 'leirkup', 'holda', 'limfjorden', 'favrbo'
  ];
  const modernKeywords = ['moderní', 'sklo', 'chrom', 'lesk', 'futuristický'];
  if (modernSeries.includes(lowerSeries) || modernKeywords.some(k => lowerName.includes(k)) || lowerMaterial.includes('glass')) {
    styles.add('modern');
  }

  // Default to scandinavian if no style detected for IKEA/JYSK
  if (styles.size === 0) {
    styles.add('scandinavian');
  }

  return Array.from(styles);
}

/**
 * Detect product category from name
 */
export function detectCategory(name: string): string {
  const lower = name.toLowerCase();
  
  // Furniture
  if (lower.includes('stolek') || lower.includes('stůl')) {
    if (lower.includes('konferenční')) return 'coffee_table';
    if (lower.includes('jídelní')) return 'dining_table';
    if (lower.includes('psací')) return 'desk';
    if (lower.includes('noční')) return 'nightstand';
    return 'table';
  }
  
  if (lower.includes('židle') || lower.includes('křeslo')) return 'chair';
  if (lower.includes('pohovka') || lower.includes('sedačka')) return 'sofa';
  if (lower.includes('postel') || lower.includes('lůžko')) return 'bed';
  if (lower.includes('skříň')) return 'wardrobe';
  if (lower.includes('komoda')) return 'dresser';
  if (lower.includes('police') || lower.includes('regál')) return 'shelf';
  if (lower.includes('botník')) return 'shoe_cabinet';
  
  // Lighting
  if (lower.includes('lampa') || lower.includes('světlo') || lower.includes('svítidlo')) {
    if (lower.includes('stojací')) return 'floor_lamp';
    if (lower.includes('stolní')) return 'table_lamp';
    if (lower.includes('stropní')) return 'ceiling_light';
    return 'lighting';
  }
  
  if (lower.includes('lustr')) return 'chandelier';
  if (lower.includes('svíčka') || lower.includes('svícen')) return 'candle';
  
  // Textile
  if (lower.includes('koberec')) return 'rug';
  if (lower.includes('závěs') || lower.includes('záclona')) return 'curtain';
  if (lower.includes('povlečení')) return 'bedding';
  if (lower.includes('polštář')) return 'pillow';
  if (lower.includes('deka') || lower.includes('přehoz')) return 'blanket';
  if (lower.includes('prostírání') || lower.includes('ubrus')) return 'table_textile';
  
  // Decoration
  if (lower.includes('zrcadlo')) return 'mirror';
  if (lower.includes('obraz') || lower.includes('rám')) return 'picture_frame';
  if (lower.includes('váza') || lower.includes('květináč')) return 'vase';
  if (lower.includes('hodiny')) return 'clock';
  if (lower.includes('dekorace') || lower.includes('ozdoba')) return 'decoration';
  
  // Storage
  if (lower.includes('box') || lower.includes('koš')) return 'storage_box';
  
  // Default
  return 'other';
}

/**
 * Clean and parse price from string
 */
export function cleanPrice(priceStr: string): number | null {
  if (!priceStr) return null;
  
  // Remove non-digit characters except comma and dot
  const cleaned = priceStr.replace(/[^\d,.-]/g, '');
  
  // Replace comma with dot for decimal
  const normalized = cleaned.replace(',', '.');
  
  const parsed = parseFloat(normalized);
  
  return isNaN(parsed) ? null : Math.round(parsed);
}

/**
 * Detect shape from name and dimensions
 */
export function detectShape(name: string, dimensions: any): string {
  const lower = name.toLowerCase();
  
  if (dimensions?.diameter) return 'circular';
  if (lower.includes('kulatý') || lower.includes('Ø')) return 'circular';
  if (lower.includes('oválný')) return 'oval';
  if (lower.includes('přirozený tvar')) return 'irregular';
  if (lower.includes('l-shaped') || lower.includes('rohová')) return 'l-shaped';
  
  return 'rectangular';
}

/**
 * Extract product series/collection from name
 */
export function extractSeries(name: string, brand: 'IKEA' | 'JYSK'): string | null {
  // For IKEA, series is usually in ALL CAPS at the beginning
  if (brand === 'IKEA') {
    const match = name.match(/^([A-ZÅÄÖ]+)\s/);
    return match ? match[1] : null;
  }
  
  // For JYSK, similar pattern
  const match = name.match(/^([A-ZÅÄÖ]+)\s/);
  return match ? match[1] : null;
}
