
import React from 'react';

interface LogoProps {
  className?: string;
  color?: string;
  showText?: boolean;
  horizontal?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  className = "w-16 h-16", 
  color = "#2563eb", 
  showText = false,
  horizontal = true
}) => {
  return (
    <div className={`flex ${horizontal ? 'flex-row' : 'flex-col'} items-center justify-center gap-4 ${className}`}>
      <div className="shrink-0 w-12 h-12 md:w-16 md:h-16">
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transform transition-transform hover:scale-105 duration-300">
          {/* Hexagon Outer Frame */}
          <path d="M100 50L300 50L380 200L300 350L100 350L20 200L100 50Z" stroke={color} strokeWidth="20" strokeLinejoin="round" />
          
          {/* Stylized M/L Logic */}
          <path d="M70 280V120L150 250L230 120V280" stroke={color} strokeWidth="25" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Microscope Element */}
          <g transform="translate(240, 100)">
            <path d="M10 160H90" stroke={color} strokeWidth="15" strokeLinecap="round" />
            <path d="M50 160V130C50 130 90 130 90 80C90 30 50 30 50 30" stroke={color} strokeWidth="15" strokeLinecap="round" />
            <path d="M20 20L70 110" stroke={color} strokeWidth="20" strokeLinecap="round" />
            <circle cx="50" cy="70" r="12" fill={color} />
          </g>
        </svg>
      </div>
      {showText && (
        <div className="text-right flex flex-col justify-center">
          <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none" style={{ color }}>معمل المستقبل</h1>
          <p className="text-[9px] md:text-[10px] font-bold tracking-[0.1em] md:tracking-[0.2em] uppercase opacity-70 mt-1" style={{ color }}>EL MOSTAQBAL LAB</p>
        </div>
      )}
    </div>
  );
};

export default Logo;
