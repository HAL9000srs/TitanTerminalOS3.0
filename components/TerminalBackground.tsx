import React, { useState, useEffect } from 'react';

// Using the same Unsplash images to simulate the attached photos context
const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1611974765270-ca1258634369?q=80&w=1920&auto=format&fit=crop", // Stock floor
  "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?q=80&w=1920&auto=format&fit=crop", // Coins
  "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=1920&auto=format&fit=crop", // Digital graph
  "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1920&auto=format&fit=crop", // Chart
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1920&auto=format&fit=crop"  // Skyscraper
];

interface TerminalBackgroundProps {
  children: React.ReactNode;
}

export const TerminalBackground: React.FC<TerminalBackgroundProps> = ({ children }) => {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 4000); // Change photo every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen font-sans selection:bg-terminal-accent selection:text-terminal-bg overflow-hidden relative">
      
      {/* Dynamic Background Layer */}
      <div className="fixed inset-0 z-0 bg-black">
        {BACKGROUND_IMAGES.map((img, index) => (
          <div
            key={img}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out`}
            style={{ 
              backgroundImage: `url(${img})`,
              opacity: index === currentBgIndex ? 0.4 : 0 // 40% opacity as requested
            }}
          />
        ))}
      </div>

      {/* FX Layers */}
      <div className="fixed inset-0 z-[1] crt-overlay pointer-events-none" />
      <div className="fixed inset-0 z-[2] vignette pointer-events-none" />

      {/* App Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};