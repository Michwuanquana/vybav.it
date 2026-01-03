import React, { useState, useRef, useEffect } from 'react';

// Brand Colors
const colors = {
  sage: '#7C8F80',
  sageMuted: '#9BA89F',
  sand: '#F0E8D9',
  terracotta: '#C87F69',
  charcoal: '#2D2D2D',
  mutedGray: '#9A9A9A',
  white: '#FEFEFE',
};

// Room type configurations with default color palettes
const roomTypes = {
  living: { 
    label: 'Obývací pokoj', 
    icon: '🛋️',
    colors: [
      { primary: '#7C8F80', secondary: '#C87F69' },
      { primary: '#E8DDD4', secondary: '#8B7355' },
      { primary: '#D4E6E1', secondary: '#5C6B73' },
    ]
  },
  bedroom: { 
    label: 'Ložnice', 
    icon: '🛏️',
    colors: [
      { primary: '#E6E2DD', secondary: '#9B8B7A' },
      { primary: '#D8E2DC', secondary: '#7C8F80' },
      { primary: '#F5EBE0', secondary: '#A68A64' },
    ]
  },
  kids: { 
    label: 'Dětský pokojíček', 
    icon: '🧸',
    colors: [
      { primary: '#E8F4EA', secondary: '#F4A460' },
      { primary: '#FFF5E6', secondary: '#87CEEB' },
      { primary: '#F0E6FA', secondary: '#98D8C8' },
    ]
  },
  office: { 
    label: 'Pracovna', 
    icon: '💼',
    colors: [
      { primary: '#F5F5F0', secondary: '#4A5568' },
      { primary: '#E8E4DF', secondary: '#7C8F80' },
      { primary: '#FFFFFF', secondary: '#2D3748' },
    ]
  },
  other: { 
    label: 'Jiné', 
    icon: '🏠',
    colors: [
      { primary: '#F0E8D9', secondary: '#7C8F80' },
      { primary: '#FFFFFF', secondary: '#C87F69' },
      { primary: '#E8E8E8', secondary: '#6B7280' },
    ]
  },
};

// Color Picker Component
const ColorPicker = ({ color, onChange, label }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [editHex, setEditHex] = useState(false);
  const [hexInput, setHexInput] = useState(color);
  const pickerRef = useRef(null);

  useEffect(() => {
    setHexInput(color);
  }, [color]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
        setEditHex(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHexSubmit = () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(hexInput)) {
      onChange(hexInput);
    }
    setEditHex(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <p className="text-xs mb-1 opacity-60" style={{ color: colors.charcoal }}>{label}</p>
      <div
        onClick={() => setShowPicker(!showPicker)}
        className="w-16 h-16 md:w-20 md:h-20 rounded-xl cursor-pointer relative overflow-hidden transition-transform hover:scale-105"
        style={{
          backgroundColor: color,
          boxShadow: `0 4px 12px ${color}40, inset 0 1px 2px rgba(255,255,255,0.3)`,
        }}
      >
        {/* Subtle glossy effect */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
          }}
        />
        {/* Hex value - very muted, bottom right */}
        <span 
          className="absolute bottom-1 right-1 text-xs font-mono cursor-pointer"
          style={{ 
            color: 'rgba(255,255,255,0.5)', 
            fontSize: '8px',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}
          onClick={(e) => {
            e.stopPropagation();
            setEditHex(true);
            setShowPicker(true);
          }}
        >
          {color.toUpperCase()}
        </span>
      </div>
      
      {showPicker && (
        <div 
          className="absolute top-full left-0 mt-2 p-3 rounded-xl shadow-xl z-50"
          style={{ backgroundColor: colors.white }}
        >
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-32 h-32 cursor-pointer rounded-lg"
            style={{ border: 'none' }}
          />
          {editHex ? (
            <div className="mt-2 flex gap-1">
              <input
                type="text"
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                className="flex-1 px-2 py-1 text-xs font-mono rounded border"
                style={{ borderColor: colors.sageMuted }}
                placeholder="#000000"
                maxLength={7}
              />
              <button
                onClick={handleHexSubmit}
                className="px-2 py-1 text-xs rounded"
                style={{ backgroundColor: colors.sage, color: colors.white }}
              >
                OK
              </button>
            </div>
          ) : (
            <p 
              className="mt-2 text-center text-xs font-mono cursor-pointer opacity-50 hover:opacity-100"
              onClick={() => setEditHex(true)}
            >
              {color.toUpperCase()}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Logarithmic Price Slider
const PriceSlider = ({ value, onChange }) => {
  const minPrice = 5000;
  const maxPrice = 150000;
  
  // Logarithmic scale conversion
  const logMin = Math.log(minPrice);
  const logMax = Math.log(maxPrice);
  
  const sliderToPrice = (sliderVal) => {
    const logValue = logMin + (sliderVal / 100) * (logMax - logMin);
    return Math.round(Math.exp(logValue) / 1000) * 1000;
  };
  
  const priceToSlider = (price) => {
    return ((Math.log(price) - logMin) / (logMax - logMin)) * 100;
  };

  const handleChange = (e) => {
    onChange(sliderToPrice(parseFloat(e.target.value)));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('cs-CZ', { 
      style: 'currency', 
      currency: 'CZK',
      maximumFractionDigits: 0 
    }).format(price);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm" style={{ color: colors.charcoal }}>Rozpočet</span>
        <span 
          className="text-lg font-semibold px-3 py-1 rounded-lg"
          style={{ backgroundColor: colors.sage + '20', color: colors.sage }}
        >
          {formatPrice(value)}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={priceToSlider(value)}
        onChange={handleChange}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${colors.sage} 0%, ${colors.sage} ${priceToSlider(value)}%, ${colors.sand} ${priceToSlider(value)}%, ${colors.sand} 100%)`,
        }}
      />
      <div className="flex justify-between text-xs mt-1" style={{ color: colors.mutedGray }}>
        <span>{formatPrice(minPrice)}</span>
        <span>{formatPrice(maxPrice)}</span>
      </div>
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          background: ${colors.terracotta};
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: ${colors.terracotta};
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

// Upload Zone Component
const UploadZone = ({ onUpload, uploadedImage }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => onUpload(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  if (uploadedImage) {
    return (
      <div className="relative rounded-2xl overflow-hidden" style={{ maxHeight: '400px' }}>
        <img 
          src={uploadedImage} 
          alt="Nahraný pokoj" 
          className="w-full h-full object-contain"
          style={{ backgroundColor: colors.charcoal + '10' }}
        />
        <button
          onClick={() => onUpload(null)}
          className="absolute top-3 right-3 p-2 rounded-full transition-all hover:scale-110"
          style={{ backgroundColor: colors.white, color: colors.charcoal }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        relative rounded-2xl border-2 border-dashed p-6 md:p-10 
        transition-all duration-300 cursor-pointer
        ${isDragging ? 'scale-[1.02]' : ''}
      `}
      style={{
        borderColor: isDragging ? colors.terracotta : colors.sage,
        backgroundColor: isDragging ? colors.terracotta + '10' : colors.sand,
        minHeight: '280px',
      }}
    >
      {/* Instructions */}
      <div className="text-center mb-6">
        <div 
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: colors.sage + '20' }}
        >
          <svg className="w-8 h-8" style={{ color: colors.sage }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        
        <h3 className="text-lg md:text-xl font-semibold mb-2" style={{ color: colors.charcoal }}>
          Nahrajte fotografii místnosti
        </h3>
        
        <div className="space-y-2 text-sm md:text-base" style={{ color: colors.mutedGray }}>
          <p>
            Foťte <strong>z rohu místnosti</strong> – zachytíte tak co nejvíce stěn
          </p>
          <p>
            Držte telefon <strong>vodorovně</strong> a ve výšce očí
          </p>
          <p>
            Ideálně při <strong>denním světle</strong>, bez záblesku
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {isMobile && (
          <>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
              style={{ backgroundColor: colors.terracotta, color: colors.white }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Vyfotit
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </>
        )}
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
          style={{ 
            backgroundColor: isMobile ? colors.sage : colors.terracotta, 
            color: colors.white 
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Nahrát z galerie
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {!isMobile && (
        <p className="text-center mt-4 text-sm" style={{ color: colors.mutedGray }}>
          nebo přetáhněte fotografii sem
        </p>
      )}
    </div>
  );
};

// Room Type Selector
const RoomTypeSelector = ({ selected, onSelect, probabilities }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 md:gap-3">
      {Object.entries(roomTypes).map(([key, { label, icon }]) => {
        const isSelected = selected === key;
        const probability = probabilities?.[key];
        
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`
              relative p-3 md:p-4 rounded-xl transition-all duration-200
              ${isSelected ? 'scale-105' : 'hover:scale-102'}
            `}
            style={{
              backgroundColor: isSelected ? colors.sage : colors.white,
              color: isSelected ? colors.white : colors.charcoal,
              boxShadow: isSelected ? `0 4px 12px ${colors.sage}40` : '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <span className="text-2xl block mb-1">{icon}</span>
            <span className="text-xs md:text-sm font-medium">{label}</span>
            {probability && probability > 0.3 && (
              <span 
                className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: colors.terracotta, 
                  color: colors.white,
                  fontSize: '10px'
                }}
              >
                {Math.round(probability * 100)}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// Color Palette Suggestions
const ColorPaletteSuggestions = ({ roomType, onSelect, selectedPrimary, selectedSecondary }) => {
  const palettes = roomTypes[roomType]?.colors || roomTypes.other.colors;
  
  return (
    <div className="flex gap-3 flex-wrap">
      {palettes.map((palette, index) => (
        <button
          key={index}
          onClick={() => onSelect(palette)}
          className={`
            flex rounded-xl overflow-hidden transition-all duration-200 hover:scale-105
            ${selectedPrimary === palette.primary && selectedSecondary === palette.secondary 
              ? 'ring-2 ring-offset-2' 
              : ''
            }
          `}
          style={{ 
            ringColor: colors.terracotta,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <div className="w-10 h-10 md:w-12 md:h-12" style={{ backgroundColor: palette.primary }} />
          <div className="w-10 h-10 md:w-12 md:h-12" style={{ backgroundColor: palette.secondary }} />
        </button>
      ))}
    </div>
  );
};

// Main App Component
export default function VybavenoApp() {
  const [step, setStep] = useState('upload'); // upload, configure, result
  const [uploadedImage, setUploadedImage] = useState(null);
  const [roomType, setRoomType] = useState(null);
  const [roomProbabilities, setRoomProbabilities] = useState(null);
  const [primaryColor, setPrimaryColor] = useState('#F0E8D9');
  const [secondaryColor, setSecondaryColor] = useState('#7C8F80');
  const [budget, setBudget] = useState(25000);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageUpload = async (image) => {
    setUploadedImage(image);
    
    if (image) {
      setIsAnalyzing(true);
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock AI response - in real app this would call Gemini API
      const mockAnalysis = {
        roomType: 'living',
        probabilities: {
          living: 0.75,
          bedroom: 0.15,
          kids: 0.05,
          office: 0.03,
          other: 0.02,
        },
        suggestedColors: {
          primary: '#E8DDD4',
          secondary: '#7C8F80',
        }
      };
      
      setRoomType(mockAnalysis.roomType);
      setRoomProbabilities(mockAnalysis.probabilities);
      setPrimaryColor(mockAnalysis.suggestedColors.primary);
      setSecondaryColor(mockAnalysis.suggestedColors.secondary);
      setIsAnalyzing(false);
      setStep('configure');
    } else {
      setStep('upload');
      setRoomType(null);
      setRoomProbabilities(null);
    }
  };

  const handlePaletteSelect = (palette) => {
    setPrimaryColor(palette.primary);
    setSecondaryColor(palette.secondary);
  };

  const handleRoomTypeChange = (type) => {
    setRoomType(type);
    // Set default colors for room type
    const defaultPalette = roomTypes[type]?.colors[0];
    if (defaultPalette) {
      setPrimaryColor(defaultPalette.primary);
      setSecondaryColor(defaultPalette.secondary);
    }
  };

  return (
    <div 
      className="min-h-screen py-6 px-4 md:py-12 md:px-6"
      style={{ backgroundColor: colors.sand }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8 md:mb-12">
          <h1 
            className="text-3xl md:text-4xl font-bold mb-2"
            style={{ color: colors.charcoal, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            vybaveno
          </h1>
          <p className="text-sm md:text-base" style={{ color: colors.mutedGray }}>
            Váš pokoj, vaše vize – my to zařídíme
          </p>
        </header>

        {/* Main Content */}
        <main className="space-y-6 md:space-y-8">
          {/* Upload Section */}
          <section>
            <UploadZone 
              onUpload={handleImageUpload} 
              uploadedImage={uploadedImage}
            />
          </section>

          {/* Analysis Loading */}
          {isAnalyzing && (
            <div 
              className="flex items-center justify-center gap-3 p-6 rounded-xl"
              style={{ backgroundColor: colors.white }}
            >
              <div 
                className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: colors.sage, borderTopColor: 'transparent' }}
              />
              <span style={{ color: colors.charcoal }}>Analyzuji místnost...</span>
            </div>
          )}

          {/* Configuration Section - shows after upload */}
          {step === 'configure' && uploadedImage && !isAnalyzing && (
            <div className="space-y-6 md:space-y-8">
              {/* Room Type */}
              <section 
                className="p-5 md:p-6 rounded-2xl"
                style={{ backgroundColor: colors.white }}
              >
                <h2 
                  className="text-lg font-semibold mb-4"
                  style={{ color: colors.charcoal }}
                >
                  Typ místnosti
                </h2>
                <RoomTypeSelector 
                  selected={roomType}
                  onSelect={handleRoomTypeChange}
                  probabilities={roomProbabilities}
                />
              </section>

              {/* Colors */}
              <section 
                className="p-5 md:p-6 rounded-2xl"
                style={{ backgroundColor: colors.white }}
              >
                <h2 
                  className="text-lg font-semibold mb-4"
                  style={{ color: colors.charcoal }}
                >
                  Barevná paleta
                </h2>
                
                {/* Selected Colors */}
                <div className="flex items-center gap-4 mb-4">
                  <ColorPicker 
                    color={primaryColor}
                    onChange={setPrimaryColor}
                    label="Primární"
                  />
                  <ColorPicker 
                    color={secondaryColor}
                    onChange={setSecondaryColor}
                    label="Doplňková"
                  />
                </div>

                {/* Suggested Palettes */}
                <div>
                  <p className="text-xs mb-2" style={{ color: colors.mutedGray }}>
                    Doporučené kombinace
                  </p>
                  <ColorPaletteSuggestions 
                    roomType={roomType || 'living'}
                    onSelect={handlePaletteSelect}
                    selectedPrimary={primaryColor}
                    selectedSecondary={secondaryColor}
                  />
                </div>
              </section>

              {/* Budget */}
              <section 
                className="p-5 md:p-6 rounded-2xl"
                style={{ backgroundColor: colors.white }}
              >
                <PriceSlider value={budget} onChange={setBudget} />
              </section>

              {/* Action Buttons */}
              <section className="space-y-3">
                <button
                  className="w-full py-4 rounded-xl font-semibold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ 
                    backgroundColor: colors.terracotta, 
                    color: colors.white,
                    boxShadow: `0 4px 16px ${colors.terracotta}40`
                  }}
                >
                  ✨ Nechte to na nás
                </button>
                <p 
                  className="text-center text-xs px-4"
                  style={{ color: colors.mutedGray }}
                >
                  Navrhneme sestavu nábytku přesně pro váš prostor a rozpočet
                </p>
                
                <div className="relative py-3">
                  <div 
                    className="absolute inset-0 flex items-center"
                    aria-hidden="true"
                  >
                    <div 
                      className="w-full border-t"
                      style={{ borderColor: colors.sage + '30' }}
                    />
                  </div>
                  <div className="relative flex justify-center">
                    <span 
                      className="px-3 text-sm"
                      style={{ backgroundColor: colors.sand, color: colors.mutedGray }}
                    >
                      nebo
                    </span>
                  </div>
                </div>

                <button
                  className="w-full py-4 rounded-xl font-semibold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] border-2"
                  style={{ 
                    backgroundColor: 'transparent',
                    borderColor: colors.sage,
                    color: colors.sage,
                  }}
                >
                  🎨 Navrhnu si sám
                </button>
                <p 
                  className="text-center text-xs px-4"
                  style={{ color: colors.mutedGray }}
                >
                  Vyberte nábytek z katalogu a umístěte jej do fotky
                </p>
              </section>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-xs" style={{ color: colors.mutedGray }}>
            © 2026 Vybaveno · Od chaosu ke klidu
          </p>
        </footer>
      </div>
    </div>
  );
}
