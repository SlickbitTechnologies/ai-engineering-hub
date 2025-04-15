import React from 'react';
import { theme } from '../../styles/theme';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'monochrome' | 'white';
  className?: string;
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 48,
};

export default function Logo({ 
  size = 'md', 
  variant = 'default',
  className = '' 
}: LogoProps) {
  const dimension = sizeMap[size];
  
  // Define colors based on variant
  let primaryColor = theme.colors.primary[500];
  let secondaryColor = theme.colors.secondary[500];
  let textColor = theme.colors.neutral[800];
  
  if (variant === 'monochrome') {
    primaryColor = theme.colors.neutral[800];
    secondaryColor = theme.colors.neutral[500];
    textColor = theme.colors.neutral[800];
  } else if (variant === 'white') {
    primaryColor = '#ffffff';
    secondaryColor = 'rgba(255, 255, 255, 0.7)';
    textColor = '#ffffff';
  }

  return (
    <div className={`flex items-center ${className}`}>
      <svg 
        width={dimension} 
        height={dimension} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield base */}
        <path 
          d="M24 4L6 11V22.5C6 32.15 13.7 41.1 24 44C34.3 41.1 42 32.15 42 22.5V11L24 4Z" 
          fill={primaryColor}
          opacity="0.2"
        />
        
        {/* Shield border */}
        <path 
          d="M24 4L6 11V22.5C6 32.15 13.7 41.1 24 44C34.3 41.1 42 32.15 42 22.5V11L24 4Z" 
          stroke={primaryColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Checkmark */}
        <path 
          d="M18 24L22 28L30 20" 
          stroke={secondaryColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Eye */}
        <circle 
          cx="24" 
          cy="22" 
          r="5" 
          stroke={primaryColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      
      <span 
        className={`text-xl font-semibold ml-2`} 
        style={{ color: textColor }}
      >
        PrivacyPal
      </span>
    </div>
  );
} 