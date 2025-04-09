'use client';

import React from 'react';

interface IllustrationProps {
  className?: string;
  width?: number;
  height?: number;
}

export const WebScraperIllustration: React.FC<IllustrationProps> = ({ 
  className = "", 
  width = 200, 
  height = 160 
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="browser-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7F9EF" />
          <stop offset="100%" stopColor="#E5EDCD" />
        </linearGradient>
        <linearGradient id="button-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7CAA38" />
          <stop offset="100%" stopColor="#5F8729" />
        </linearGradient>
        <filter id="shadow" x="-2" y="0" width="115%" height="115%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.15"/>
        </filter>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor="#5F8729" floodOpacity="0.3" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="glow"/>
          <feComposite in="SourceGraphic" in2="glow" operator="over"/>
        </filter>
        <pattern id="dots-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="1.5" fill="#E5E7EB" opacity="0.4" />
        </pattern>
      </defs>
      
      {/* Background texture */}
      <rect x="0" y="0" width="200" height="160" fill="url(#dots-pattern)" opacity="0.3" />
      
      {/* Main browser window with shadow */}
      <g filter="url(#shadow)">
        <rect x="30" y="30" width="140" height="100" rx="10" fill="url(#browser-gradient)" />
        <rect x="30" y="30" width="140" height="22" rx="10 10 0 0" fill="#5F8729" fillOpacity="0.15" />
      </g>
      
      {/* Browser buttons */}
      <circle cx="42" cy="41" r="3" fill="#EF4444" />
      <circle cx="52" cy="41" r="3" fill="#F59E0B" />
      <circle cx="62" cy="41" r="3" fill="#5F8729" />
      
      {/* Browser address bar */}
      <rect x="75" y="36" width="80" height="10" rx="5" fill="white" fillOpacity="0.8" />
      <g transform="translate(78, 38.5)">
        <circle cx="3" cy="3" r="3" fill="#5F8729" />
        <rect x="9" y="1" width="40" height="4" rx="2" fill="#94A3B8" />
      </g>
      
      {/* Content loading animation */}
      <g>
        <rect x="40" y="60" width="120" height="8" rx="4" fill="#94A3B8" fillOpacity="0.3">
          <animate attributeName="fillOpacity" values="0.2;0.3;0.2" dur="2s" repeatCount="indefinite" />
        </rect>
        <rect x="40" y="75" width="90" height="6" rx="3" fill="#94A3B8" fillOpacity="0.25">
          <animate attributeName="fillOpacity" values="0.15;0.25;0.15" dur="2s" repeatCount="indefinite" begin="0.2s" />
        </rect>
        <rect x="40" y="87" width="110" height="6" rx="3" fill="#94A3B8" fillOpacity="0.25">
          <animate attributeName="fillOpacity" values="0.15;0.25;0.15" dur="2s" repeatCount="indefinite" begin="0.4s" />
        </rect>
        <rect x="40" y="99" width="70" height="6" rx="3" fill="#94A3B8" fillOpacity="0.25">
          <animate attributeName="fillOpacity" values="0.15;0.25;0.15" dur="2s" repeatCount="indefinite" begin="0.6s" />
        </rect>
      </g>
      
      {/* Animated cursor */}
      <g>
        <rect x="40" y="115" width="2" height="10" fill="#5F8729">
          <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" />
        </rect>
      </g>
      
      {/* Animated scan line */}
      <rect x="30" y="65" width="140" height="1" fill="#5F8729" opacity="0.6">
        <animate attributeName="y" values="65;120;65" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.6;0" dur="4s" repeatCount="indefinite" />
      </rect>
      
      {/* Floating icons around the browser */}
      <g transform="translate(10, 55)">
        <circle cx="0" cy="0" r="6" fill="#F5FAE5" fillOpacity="0.8" />
        <path d="M-3 0H3M0 -3V3" stroke="#5F8729" strokeWidth="1.5" strokeLinecap="round" />
        <animateMotion path="M0,0 Q10,15 0,30 Q-10,15 0,0" dur="6s" repeatCount="indefinite" />
      </g>
      
      <g transform="translate(190, 80)">
        <circle cx="0" cy="0" r="6" fill="#F5FAE5" fillOpacity="0.8" />
        <path d="M-3 0H3" stroke="#5F8729" strokeWidth="1.5" strokeLinecap="round" />
        <animateMotion path="M0,0 Q-10,15 0,30 Q10,15 0,0" dur="7s" repeatCount="indefinite" />
      </g>
      
      <g transform="translate(180, 40)">
        <circle cx="0" cy="0" r="5" fill="#F5FAE5" fillOpacity="0.7" />
        <path d="M-2 0L0 2L2 -2" stroke="#5F8729" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <animateMotion path="M0,0 Q-5,10 0,20 Q5,10 0,0" dur="5s" repeatCount="indefinite" />
      </g>
      
      {/* Summarize button with glow effect */}
      <g filter="url(#glow)">
        <circle cx="155" cy="110" r="12" fill="url(#button-gradient)">
          <animate attributeName="r" values="12;13;12" dur="2s" repeatCount="indefinite" />
        </circle>
        <g transform="translate(155, 110)">
          <line x1="-5" y1="0" x2="5" y2="0" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1="-5" x2="0" y2="5" stroke="white" strokeWidth="2" strokeLinecap="round">
            <animate attributeName="y2" values="5;3;5" dur="2s" repeatCount="indefinite" />
          </line>
        </g>
      </g>
      
      {/* Data extraction visualization */}
      <g>
        <line x1="155" y1="98" x2="170" y2="80" stroke="#5F8729" strokeWidth="1.5" strokeDasharray="2 2">
          <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" begin="1s" />
        </line>
        <line x1="155" y1="98" x2="175" y2="90" stroke="#5F8729" strokeWidth="1.5" strokeDasharray="2 2">
          <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" begin="2s" />
        </line>
        <line x1="155" y1="98" x2="172" y2="100" stroke="#5F8729" strokeWidth="1.5" strokeDasharray="2 2">
          <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" begin="3s" />
        </line>
      </g>
    </svg>
  );
};

export const PDFIllustration: React.FC<IllustrationProps> = ({ 
  className = "", 
  width = 200, 
  height = 160 
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="pdf-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F0FDF4" />
          <stop offset="100%" stopColor="#DCFCE7" />
        </linearGradient>
        <linearGradient id="pdf-header-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
        <linearGradient id="pdf-button-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
        <filter id="pdf-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.2"/>
        </filter>
        <filter id="pdf-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor="#22C55E" floodOpacity="0.3" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="glow"/>
          <feComposite in="SourceGraphic" in2="glow" operator="over"/>
        </filter>
      </defs>
      
      {/* Background grid */}
      <rect x="0" y="0" width="200" height="160" fill="url(#pdf-grid)" />
      
      {/* Main PDF document with shadow */}
      <g filter="url(#pdf-shadow)">
        <rect x="50" y="24" width="100" height="112" rx="6" fill="url(#pdf-gradient)" />
        
        {/* PDF header */}
        <rect x="50" y="24" width="100" height="16" rx="6 6 0 0" fill="url(#pdf-header-gradient)" />
        
        {/* PDF header icons */}
        <circle cx="58" cy="32" r="3" fill="white" fillOpacity="0.8" />
        <circle cx="68" cy="32" r="3" fill="white" fillOpacity="0.8" />
        <rect x="80" y="30" width="60" height="4" rx="2" fill="white" fillOpacity="0.6" />
      </g>
      
      {/* PDF content with animation */}
      <g>
        {/* Title */}
        <rect x="60" y="48" width="80" height="6" rx="3" fill="#22C55E" opacity="0.8">
          <animate attributeName="width" values="70;80;70" dur="4s" repeatCount="indefinite" />
        </rect>
        
        {/* Text lines */}
        <rect x="60" y="62" width="80" height="4" rx="2" fill="#22C55E" opacity="0.6">
          <animate attributeName="width" values="80;75;80" dur="4s" repeatCount="indefinite" begin="0.2s" />
        </rect>
        <rect x="60" y="70" width="70" height="4" rx="2" fill="#22C55E" opacity="0.5">
          <animate attributeName="width" values="70;65;70" dur="4s" repeatCount="indefinite" begin="0.4s" />
        </rect>
        <rect x="60" y="78" width="75" height="4" rx="2" fill="#22C55E" opacity="0.4">
          <animate attributeName="width" values="75;70;75" dur="4s" repeatCount="indefinite" begin="0.6s" />
        </rect>
        <rect x="60" y="86" width="60" height="4" rx="2" fill="#22C55E" opacity="0.3">
          <animate attributeName="width" values="60;65;60" dur="4s" repeatCount="indefinite" begin="0.8s" />
        </rect>
      </g>
      
      {/* PDF pages with flipping animation */}
      <g transform="translate(100, 80)">
        <g transform="rotate(0)">
          <animate attributeName="transform" attributeType="XML" type="rotate" from="0" to="-5" dur="3s" values="0;-5;0" repeatCount="indefinite" />
          <rect x="-40" y="-5" width="30" height="40" rx="2" fill="#BBF7D0" />
          <rect x="-35" y="0" width="20" height="2" rx="1" fill="#22C55E" opacity="0.3" />
          <rect x="-35" y="5" width="15" height="2" rx="1" fill="#22C55E" opacity="0.3" />
          <rect x="-35" y="10" width="20" height="2" rx="1" fill="#22C55E" opacity="0.3" />
        </g>
      </g>
      
      <g transform="translate(105, 80)">
        <g transform="rotate(0)">
          <animate attributeName="transform" attributeType="XML" type="rotate" from="0" to="8" dur="4s" values="0;8;0" repeatCount="indefinite" begin="1s" />
          <rect x="-40" y="-5" width="30" height="40" rx="2" fill="#DCFCE7" />
          <rect x="-35" y="0" width="20" height="2" rx="1" fill="#22C55E" opacity="0.3" />
          <rect x="-35" y="5" width="15" height="2" rx="1" fill="#22C55E" opacity="0.3" />
          <rect x="-35" y="10" width="20" height="2" rx="1" fill="#22C55E" opacity="0.3" />
        </g>
      </g>
      
      {/* Magnifying glass moving over document */}
      <g filter="url(#pdf-glow)" transform="translate(120, 70)">
        <animateMotion path="M0,0 Q15,10 0,20 Q-15,10 0,0" dur="6s" repeatCount="indefinite" />
        <circle cx="0" cy="0" r="8" fill="white" opacity="0.8" stroke="#22C55E" strokeWidth="1.5" />
        <path d="M5 5L12 12" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      
      {/* Search highlighting pulse effect */}
      <g transform="translate(85, 80)">
        <rect x="-15" y="-2" width="30" height="4" rx="2" fill="#86EFAC" opacity="0.0">
          <animate attributeName="opacity" values="0;0.8;0" dur="3s" repeatCount="indefinite" begin="0.5s" />
        </rect>
      </g>
      
      {/* Progress indicators */}
      <g transform="translate(130, 110)">
        <circle cx="0" cy="0" r="5" fill="#BBF7D0">
          <animate attributeName="fill" values="#BBF7D0;#86EFAC;#BBF7D0" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="12" cy="0" r="5" fill="#BBF7D0">
          <animate attributeName="fill" values="#BBF7D0;#86EFAC;#BBF7D0" dur="2s" repeatCount="indefinite" begin="0.7s" />
        </circle>
        <circle cx="24" cy="0" r="5" fill="#BBF7D0">
          <animate attributeName="fill" values="#BBF7D0;#86EFAC;#BBF7D0" dur="2s" repeatCount="indefinite" begin="1.4s" />
        </circle>
      </g>
      
      {/* PDF extract button with pulsing effect */}
      <g filter="url(#pdf-glow)" transform="translate(100, 120)">
        <rect x="-20" y="-10" width="40" height="20" rx="10" fill="url(#pdf-button-gradient)">
          <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite" />
        </rect>
        <text x="0" y="1.5" fontFamily="Arial" fontSize="7" fontWeight="bold" fill="white" textAnchor="middle" alignmentBaseline="middle">EXTRACT</text>
      </g>
      
      {/* Floating text elements */}
      <g transform="translate(40, 60)">
        <text x="0" y="0" fontFamily="monospace" fontSize="6" fill="#22C55E" opacity="0.7">PDF</text>
        <animateMotion path="M0,0 Q-5,10 0,20 Q5,10 0,0" dur="5s" repeatCount="indefinite" />
      </g>
      
      <g transform="translate(160, 60)">
        <text x="0" y="0" fontFamily="monospace" fontSize="6" fill="#22C55E" opacity="0.7">txt</text>
        <animateMotion path="M0,0 Q5,10 0,20 Q-5,10 0,0" dur="5s" repeatCount="indefinite" begin="1s" />
      </g>
      
      <g transform="translate(35, 100)">
        <text x="0" y="0" fontFamily="monospace" fontSize="6" fill="#22C55E" opacity="0.7">A4</text>
        <animateMotion path="M0,0 Q-5,5 0,10 Q5,5 0,0" dur="4s" repeatCount="indefinite" begin="2s" />
      </g>
      
      <g transform="translate(165, 100)">
        <text x="0" y="0" fontFamily="monospace" fontSize="6" fill="#22C55E" opacity="0.7">Doc</text>
        <animateMotion path="M0,0 Q5,5 0,10 Q-5,5 0,0" dur="4s" repeatCount="indefinite" begin="3s" />
      </g>
    </svg>
  );
};

export const AudioIllustration: React.FC<IllustrationProps> = ({ 
  className = "", 
  width = 250, 
  height = 160 
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="audio-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7F9EF" />
          <stop offset="100%" stopColor="#E5EDCD" />
        </linearGradient>
        <linearGradient id="audio-header-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8EB454" />
          <stop offset="100%" stopColor="#5F8729" />
        </linearGradient>
        <linearGradient id="audio-button-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5F8729" />
          <stop offset="100%" stopColor="#4A6C1E" />
        </linearGradient>
        <filter id="audio-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.2"/>
        </filter>
        <filter id="audio-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor="#5F8729" floodOpacity="0.3" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="glow"/>
          <feComposite in="SourceGraphic" in2="glow" operator="over"/>
        </filter>
      </defs>
      
      {/* Main audio device with shadow */}
      <g filter="url(#audio-shadow)">
        <rect x="45" y="20" width="110" height="120" rx="6" fill="url(#audio-gradient)" />
        
        {/* Audio player header */}
        <rect x="45" y="20" width="110" height="16" rx="6 6 0 0" fill="url(#audio-header-gradient)" />
        
        {/* Audio player header icons */}
        <circle cx="54" cy="28" r="3" fill="white" fillOpacity="0.8" />
        <circle cx="64" cy="28" r="3" fill="white" fillOpacity="0.8" />
        <rect x="80" y="26" width="65" height="4" rx="2" fill="white" fillOpacity="0.6" />
      </g>
      
      {/* Audio visualization with animation */}
      <g transform="translate(100, 70)">
        {/* Central waveform bars */}
        <rect x="-35" y="-12" width="4" height="24" rx="2" fill="#5F8729" opacity="0.7">
          <animate attributeName="height" values="10;24;10" dur="1.5s" repeatCount="indefinite" />
        </rect>
        <rect x="-28" y="-15" width="4" height="30" rx="2" fill="#5F8729" opacity="0.8">
          <animate attributeName="height" values="30;15;30" dur="1.7s" repeatCount="indefinite" />
        </rect>
        <rect x="-21" y="-17" width="4" height="34" rx="2" fill="#5F8729" opacity="0.9">
          <animate attributeName="height" values="25;34;25" dur="1.3s" repeatCount="indefinite" />
        </rect>
        <rect x="-14" y="-20" width="4" height="40" rx="2" fill="#5F8729">
          <animate attributeName="height" values="40;20;40" dur="1.1s" repeatCount="indefinite" />
        </rect>
        <rect x="-7" y="-14" width="4" height="28" rx="2" fill="#5F8729" opacity="0.9">
          <animate attributeName="height" values="15;28;15" dur="1.6s" repeatCount="indefinite" />
        </rect>
        <rect x="0" y="-22" width="4" height="44" rx="2" fill="#5F8729">
          <animate attributeName="height" values="25;44;25" dur="1.2s" repeatCount="indefinite" />
        </rect>
        <rect x="7" y="-14" width="4" height="28" rx="2" fill="#5F8729" opacity="0.9">
          <animate attributeName="height" values="28;14;28" dur="1.8s" repeatCount="indefinite" />
        </rect>
        <rect x="14" y="-20" width="4" height="40" rx="2" fill="#5F8729">
          <animate attributeName="height" values="30;40;30" dur="1.4s" repeatCount="indefinite" />
        </rect>
        <rect x="21" y="-17" width="4" height="34" rx="2" fill="#5F8729" opacity="0.9">
          <animate attributeName="height" values="34;20;34" dur="1.6s" repeatCount="indefinite" />
        </rect>
        <rect x="28" y="-15" width="4" height="30" rx="2" fill="#5F8729" opacity="0.8">
          <animate attributeName="height" values="20;30;20" dur="1.5s" repeatCount="indefinite" />
        </rect>
        <rect x="35" y="-12" width="4" height="24" rx="2" fill="#5F8729" opacity="0.7">
          <animate attributeName="height" values="24;12;24" dur="1.3s" repeatCount="indefinite" />
        </rect>
      </g>
      
      {/* Circular sound waves */}
      <g transform="translate(100, 70)" opacity="0.6">
        <circle cx="0" cy="0" r="36" stroke="#5F8729" strokeWidth="1.5" strokeDasharray="4 4" fill="none">
          <animate attributeName="r" values="30;36;30" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="0" cy="0" r="42" stroke="#5F8729" strokeWidth="1.5" strokeDasharray="4 4" fill="none">
          <animate attributeName="r" values="42;36;42" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite" />
        </circle>
      </g>
      
      {/* Mic icon */}
      <g transform="translate(100, 70)" filter="url(#audio-glow)">
        <circle cx="0" cy="0" r="15" fill="#5F8729" />
        <path d="M0 -7 V7 M-4 -4 H4 M-4 0 H4 M-4 4 H4" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </g>
      
      {/* Playback controls */}
      <g transform="translate(100, 110)">
        <circle cx="-18" cy="0" r="4" fill="#D0DEAE">
          <animate attributeName="fill" values="#D0DEAE;#8EB454;#D0DEAE" dur="2s" repeatCount="indefinite" />
        </circle>
        <path d="M-20 0 L-16 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        
        <circle cx="0" cy="0" r="6" fill="#5F8729">
          <animate attributeName="fill" values="#5F8729;#4A6C1E;#5F8729" dur="2s" repeatCount="indefinite" begin="0.7s" />
        </circle>
        <path d="M-2 -2 L-2 2 M2 -2 L2 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        
        <circle cx="18" cy="0" r="4" fill="#D0DEAE">
          <animate attributeName="fill" values="#D0DEAE;#8EB454;#D0DEAE" dur="2s" repeatCount="indefinite" begin="1.4s" />
        </circle>
        <path d="M16 0 L20 0 M18 -2 L18 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      
      {/* Progress bar */}
      <g transform="translate(100, 95)">
        <rect x="-35" y="-2" width="70" height="4" rx="2" fill="#D0DEAE" />
        <rect x="-35" y="-2" width="25" height="4" rx="2" fill="#5F8729">
          <animate attributeName="width" values="15;25;40;25;15" dur="8s" repeatCount="indefinite" />
        </rect>
        <circle cx="-10" cy="0" r="3" fill="white" stroke="#5F8729" strokeWidth="1">
          <animate attributeName="cx" values="-20;-10;5;-10;-20" dur="8s" repeatCount="indefinite" />
        </circle>
      </g>
      
      {/* Voice to text button */}
      <g filter="url(#audio-glow)" transform="translate(75, 120)">
        <rect x="-25" y="-10" width="50" height="20" rx="10" fill="url(#audio-button-gradient)">
          <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite" />
        </rect>
        <text x="0" y="1.5" fontFamily="Arial" fontSize="7" fontWeight="bold" fill="white" textAnchor="middle" alignmentBaseline="middle">TRANSCRIBE</text>
      </g>
      
      {/* Floating elements */}
      <g transform="translate(40, 60)">
        <text x="0" y="0" fontFamily="monospace" fontSize="6" fill="#5F8729" opacity="0.7">MP3</text>
        <animateMotion path="M0,0 Q-5,10 0,20 Q5,10 0,0" dur="5s" repeatCount="indefinite" />
      </g>
      
      <g transform="translate(160, 60)">
        <text x="0" y="0" fontFamily="monospace" fontSize="6" fill="#5F8729" opacity="0.7">WAV</text>
        <animateMotion path="M0,0 Q5,10 0,20 Q-5,10 0,0" dur="5s" repeatCount="indefinite" begin="1s" />
      </g>
      
      <g transform="translate(35, 100)">
        <text x="0" y="0" fontFamily="monospace" fontSize="6" fill="#5F8729" opacity="0.7">M4A</text>
        <animateMotion path="M0,0 Q-5,5 0,10 Q5,5 0,0" dur="4s" repeatCount="indefinite" begin="2s" />
      </g>
      
      <g transform="translate(165, 100)">
        <text x="0" y="0" fontFamily="monospace" fontSize="6" fill="#5F8729" opacity="0.7">OGG</text>
        <animateMotion path="M0,0 Q5,5 0,10 Q-5,5 0,0" dur="4s" repeatCount="indefinite" begin="3s" />
      </g>
      
      {/* Sound notes */}
      <g transform="translate(140, 45)" opacity="0.5">
        <path d="M0,0 Q3,-6 6,0" stroke="#5F8729" strokeWidth="1.5" fill="none" />
        <circle cx="8" cy="0" r="2" fill="#5F8729" />
        <animateMotion path="M0,0 Q5,10 0,20 Q-5,10 0,0" dur="7s" repeatCount="indefinite" />
      </g>
      
      <g transform="translate(50, 85)" opacity="0.5">
        <path d="M0,0 Q3,-6 6,0" stroke="#5F8729" strokeWidth="1.5" fill="none" />
        <circle cx="8" cy="0" r="2" fill="#5F8729" />
        <animateMotion path="M0,0 Q-5,10 0,20 Q5,10 0,0" dur="6s" repeatCount="indefinite" begin="2s" />
      </g>
      
      {/* Scanning effect */}
      <rect x="45" y="40" width="110" height="1" fill="#5F8729" opacity="0.7">
        <animate attributeName="y" values="40;120;40" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.7;0" dur="4s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
};

export const TextIllustration: React.FC<IllustrationProps> = ({ 
  className = "", 
  width = 200, 
  height = 160 
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="text-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7F9EF" />
          <stop offset="100%" stopColor="#E5EDCD" />
        </linearGradient>
        <linearGradient id="text-header-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8EB454" />
          <stop offset="100%" stopColor="#5F8729" />
        </linearGradient>
        <linearGradient id="text-button-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5F8729" />
          <stop offset="100%" stopColor="#4A6C1E" />
        </linearGradient>
        <filter id="text-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.2"/>
        </filter>
        <filter id="text-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor="#5F8729" floodOpacity="0.3" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="glow"/>
          <feComposite in="SourceGraphic" in2="glow" operator="over"/>
        </filter>
      </defs>
      
      {/* Main document with shadow */}
      <g filter="url(#text-shadow)">
        <rect x="45" y="20" width="110" height="120" rx="6" fill="url(#text-gradient)" />
        
        {/* Document header */}
        <rect x="45" y="20" width="110" height="16" rx="6 6 0 0" fill="url(#text-header-gradient)" />
        
        {/* Document header icons */}
        <circle cx="54" cy="28" r="3" fill="white" fillOpacity="0.8" />
        <circle cx="64" cy="28" r="3" fill="white" fillOpacity="0.8" />
        <rect x="80" y="26" width="65" height="4" rx="2" fill="white" fillOpacity="0.6" />
      </g>
      
      {/* Document content with animation */}
      <g>
        {/* Title */}
        <rect x="55" y="46" width="90" height="8" rx="4" fill="#5F8729" opacity="0.9">
          <animate attributeName="width" values="80;90;80" dur="4s" repeatCount="indefinite" />
        </rect>
        
        {/* Text lines */}
        <rect x="55" y="62" width="90" height="5" rx="2.5" fill="#5F8729" opacity="0.7">
          <animate attributeName="width" values="90;85;90" dur="4s" repeatCount="indefinite" begin="0.2s" />
        </rect>
        <rect x="55" y="72" width="75" height="5" rx="2.5" fill="#5F8729" opacity="0.6">
          <animate attributeName="width" values="75;70;75" dur="4s" repeatCount="indefinite" begin="0.4s" />
        </rect>
        <rect x="55" y="82" width="85" height="5" rx="2.5" fill="#5F8729" opacity="0.7">
          <animate attributeName="width" values="85;80;85" dur="4s" repeatCount="indefinite" begin="0.6s" />
        </rect>
        <rect x="55" y="92" width="60" height="5" rx="2.5" fill="#5F8729" opacity="0.6">
          <animate attributeName="width" values="60;65;60" dur="4s" repeatCount="indefinite" begin="0.8s" />
        </rect>
        
        {/* Bullet points */}
        <circle cx="58" cy="105" r="2" fill="#5F8729" opacity="0.8" />
        <rect x="65" y="103" width="70" height="5" rx="2.5" fill="#5F8729" opacity="0.7">
          <animate attributeName="width" values="70;65;70" dur="4s" repeatCount="indefinite" begin="1s" />
        </rect>
        
        <circle cx="58" cy="115" r="2" fill="#5F8729" opacity="0.8" />
        <rect x="65" y="113" width="60" height="5" rx="2.5" fill="#5F8729" opacity="0.7">
          <animate attributeName="width" values="60;55;60" dur="4s" repeatCount="indefinite" begin="1.2s" />
        </rect>
      </g>
      
      {/* Text editing cursor animation */}
      <g transform="translate(130, 75)">
        <rect x="0" y="-8" width="1" height="16" fill="#5F8729" opacity="0.8">
          <animate attributeName="opacity" values="0;0.8;0" dur="1.2s" repeatCount="indefinite" />
        </rect>
      </g>
      
      {/* Page numbers and indicators */}
      <g transform="translate(100, 130)">
        <circle cx="-12" cy="0" r="4" fill="#D0DEAE">
          <animate attributeName="fill" values="#D0DEAE;#8EB454;#D0DEAE" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="0" cy="0" r="4" fill="#5F8729">
          <animate attributeName="fill" values="#5F8729;#4A6C1E;#5F8729" dur="2s" repeatCount="indefinite" begin="0.7s" />
        </circle>
        <circle cx="12" cy="0" r="4" fill="#D0DEAE">
          <animate attributeName="fill" values="#D0DEAE;#8EB454;#D0DEAE" dur="2s" repeatCount="indefinite" begin="1.4s" />
        </circle>
      </g>
      
      {/* Summarize button with pulsing effect */}
      <g filter="url(#text-glow)" transform="translate(100, 120)">
        <rect x="-25" y="-10" width="50" height="20" rx="10" fill="url(#text-button-gradient)">
          <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite" />
        </rect>
        <text x="0" y="1.5" fontFamily="Arial" fontSize="7" fontWeight="bold" fill="white" textAnchor="middle" alignmentBaseline="middle">SUMMARIZE</text>
      </g>
      
      {/* Floating elements */}
      <g transform="translate(35, 45)">
        <text x="0" y="0" fontFamily="monospace" fontSize="6" fill="#5F8729" opacity="0.7">TXT</text>
        <animateMotion path="M0,0 Q-5,10 0,20 Q5,10 0,0" dur="5s" repeatCount="indefinite" />
      </g>
      
      <g transform="translate(165, 45)">
        <text x="0" y="0" fontFamily="monospace" fontSize="6" fill="#5F8729" opacity="0.7">DOC</text>
        <animateMotion path="M0,0 Q5,10 0,20 Q-5,10 0,0" dur="5s" repeatCount="indefinite" begin="1s" />
      </g>
      
      <g transform="translate(35, 100)">
        <text x="0" y="0" fontFamily="monospace" fontSize="6" fill="#5F8729" opacity="0.7">RTF</text>
        <animateMotion path="M0,0 Q-5,5 0,10 Q5,5 0,0" dur="4s" repeatCount="indefinite" begin="2s" />
      </g>
      
      <g transform="translate(165, 100)">
        <text x="0" y="0" fontFamily="monospace" fontSize="6" fill="#5F8729" opacity="0.7">MD</text>
        <animateMotion path="M0,0 Q5,5 0,10 Q-5,5 0,0" dur="4s" repeatCount="indefinite" begin="3s" />
      </g>
      
      {/* Scanning effect */}
      <rect x="45" y="40" width="110" height="1" fill="#5F8729" opacity="0.7">
        <animate attributeName="y" values="40;120;40" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.7;0" dur="4s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
};

export const TranslateIllustration: React.FC<IllustrationProps> = ({ 
  className = "", 
  width = 200, 
  height = 160 
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="translate-gradient-left" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7F9EF" />
          <stop offset="100%" stopColor="#E5EDCD" />
        </linearGradient>
        <linearGradient id="translate-gradient-right" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F4F9EC" />
          <stop offset="100%" stopColor="#D0DEAE" />
        </linearGradient>
        <linearGradient id="translate-header-gradient-left" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8EB454" />
          <stop offset="100%" stopColor="#5F8729" />
        </linearGradient>
        <linearGradient id="translate-header-gradient-right" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5F8729" />
          <stop offset="100%" stopColor="#4A6C1E" />
        </linearGradient>
        <linearGradient id="translate-button-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5F8729" />
          <stop offset="100%" stopColor="#4A6C1E" />
        </linearGradient>
        <filter id="translate-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.2"/>
        </filter>
        <filter id="translate-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor="#5F8729" floodOpacity="0.3" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="glow"/>
          <feComposite in="SourceGraphic" in2="glow" operator="over"/>
        </filter>
      </defs>
      
      {/* Left document with shadow */}
      <g filter="url(#translate-shadow)">
        <rect x="40" y="30" width="55" height="100" rx="6" fill="url(#translate-gradient-left)" />
        
        {/* Left document header */}
        <rect x="40" y="30" width="55" height="16" rx="6 6 0 0" fill="url(#translate-header-gradient-left)" />
        
        {/* Left document header icons */}
        <circle cx="48" cy="38" r="3" fill="white" fillOpacity="0.8" />
        <circle cx="58" cy="38" r="3" fill="white" fillOpacity="0.8" />
      </g>
      
      {/* Right document with shadow */}
      <g filter="url(#translate-shadow)">
        <rect x="105" y="30" width="55" height="100" rx="6" fill="url(#translate-gradient-right)" />
        
        {/* Right document header */}
        <rect x="105" y="30" width="55" height="16" rx="6 6 0 0" fill="url(#translate-header-gradient-right)" />
        
        {/* Right document header icons */}
        <circle cx="113" cy="38" r="3" fill="white" fillOpacity="0.8" />
        <circle cx="123" cy="38" r="3" fill="white" fillOpacity="0.8" />
      </g>
      
      {/* Left document content with animation */}
      <g>
        {/* Text lines */}
        <rect x="47" y="55" width="41" height="4" rx="2" fill="#5F8729" opacity="0.8">
          <animate attributeName="width" values="35;41;35" dur="4s" repeatCount="indefinite" />
        </rect>
        <rect x="47" y="65" width="32" height="4" rx="2" fill="#5F8729" opacity="0.7">
          <animate attributeName="width" values="32;28;32" dur="4s" repeatCount="indefinite" begin="0.2s" />
        </rect>
        <rect x="47" y="75" width="38" height="4" rx="2" fill="#5F8729" opacity="0.8">
          <animate attributeName="width" values="38;42;38" dur="4s" repeatCount="indefinite" begin="0.4s" />
        </rect>
        <rect x="47" y="85" width="30" height="4" rx="2" fill="#5F8729" opacity="0.7">
          <animate attributeName="width" values="30;35;30" dur="4s" repeatCount="indefinite" begin="0.6s" />
        </rect>
        <rect x="47" y="95" width="41" height="4" rx="2" fill="#5F8729" opacity="0.8">
          <animate attributeName="width" values="41;37;41" dur="4s" repeatCount="indefinite" begin="0.8s" />
        </rect>
        <rect x="47" y="105" width="35" height="4" rx="2" fill="#5F8729" opacity="0.7">
          <animate attributeName="width" values="35;40;35" dur="4s" repeatCount="indefinite" begin="1s" />
        </rect>
        <rect x="47" y="115" width="25" height="4" rx="2" fill="#5F8729" opacity="0.6">
          <animate attributeName="width" values="25;30;25" dur="4s" repeatCount="indefinite" begin="1.2s" />
        </rect>
      </g>
      
      {/* Right document content with animation */}
      <g>
        {/* Text lines */}
        <rect x="112" y="55" width="41" height="4" rx="2" fill="#5F8729" opacity="0.8">
          <animate attributeName="width" values="41;38;41" dur="4s" repeatCount="indefinite" begin="0.1s" />
        </rect>
        <rect x="112" y="65" width="35" height="4" rx="2" fill="#5F8729" opacity="0.7">
          <animate attributeName="width" values="35;40;35" dur="4s" repeatCount="indefinite" begin="0.3s" />
        </rect>
        <rect x="112" y="75" width="37" height="4" rx="2" fill="#5F8729" opacity="0.8">
          <animate attributeName="width" values="37;33;37" dur="4s" repeatCount="indefinite" begin="0.5s" />
        </rect>
        <rect x="112" y="85" width="41" height="4" rx="2" fill="#5F8729" opacity="0.7">
          <animate attributeName="width" values="41;38;41" dur="4s" repeatCount="indefinite" begin="0.7s" />
        </rect>
        <rect x="112" y="95" width="32" height="4" rx="2" fill="#5F8729" opacity="0.8">
          <animate attributeName="width" values="32;36;32" dur="4s" repeatCount="indefinite" begin="0.9s" />
        </rect>
        <rect x="112" y="105" width="38" height="4" rx="2" fill="#5F8729" opacity="0.7">
          <animate attributeName="width" values="38;34;38" dur="4s" repeatCount="indefinite" begin="1.1s" />
        </rect>
        <rect x="112" y="115" width="28" height="4" rx="2" fill="#5F8729" opacity="0.6">
          <animate attributeName="width" values="28;33;28" dur="4s" repeatCount="indefinite" begin="1.3s" />
        </rect>
      </g>
      
      {/* Translation connection circle */}
      <g filter="url(#translate-glow)">
        <circle cx="100" cy="80" r="12" fill="#5F8729">
          <animate attributeName="r" values="12;13;12" dur="2s" repeatCount="indefinite" />
        </circle>
        <path d="M94 80H106M100 74V86" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </g>
      
      {/* Connection lines */}
      <g>
        <path d="M75 60L90 70" stroke="#8EB454" strokeWidth="1" strokeDasharray="2 2">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M75 80L90 80" stroke="#8EB454" strokeWidth="1" strokeDasharray="2 2">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" begin="0.5s" />
        </path>
        <path d="M75 100L90 90" stroke="#8EB454" strokeWidth="1" strokeDasharray="2 2">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" begin="1s" />
        </path>
        
        <path d="M110 70L125 60" stroke="#5F8729" strokeWidth="1" strokeDasharray="2 2">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" begin="0.2s" />
        </path>
        <path d="M110 80L125 80" stroke="#5F8729" strokeWidth="1" strokeDasharray="2 2">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" begin="0.7s" />
        </path>
        <path d="M110 90L125 100" stroke="#5F8729" strokeWidth="1" strokeDasharray="2 2">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" begin="1.2s" />
        </path>
      </g>
      
      {/* Translate button */}
      <g filter="url(#translate-glow)" transform="translate(100, 130)">
        <rect x="-25" y="-10" width="50" height="20" rx="10" fill="url(#translate-button-gradient)">
          <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite" />
        </rect>
        <text x="0" y="1.5" fontFamily="Arial" fontSize="7" fontWeight="bold" fill="white" textAnchor="middle" alignmentBaseline="middle">TRANSLATE</text>
      </g>
      
      {/* Language indicators */}
      <g transform="translate(67, 25)">
        <text x="0" y="0" fontFamily="Arial" fontSize="6" fontWeight="bold" fill="#5F8729">EN</text>
      </g>
      
      <g transform="translate(133, 25)">
        <text x="0" y="0" fontFamily="Arial" fontSize="6" fontWeight="bold" fill="#4A6C1E">ES</text>
      </g>
      
      {/* Floating language elements */}
      <g transform="translate(35, 50)">
        <text x="0" y="0" fontFamily="monospace" fontSize="6" fill="#5F8729" opacity="0.7">EN</text>
        <animateMotion path="M0,0 Q-5,10 0,20 Q5,10 0,0" dur="5s" repeatCount="indefinite" />
      </g>
      
      <g transform="translate(165, 50)">
        <text x="0" y="0" fontFamily="monospace" fontSize="6" fill="#5F8729" opacity="0.7">ES</text>
        <animateMotion path="M0,0 Q5,10 0,20 Q-5,10 0,0" dur="5s" repeatCount="indefinite" begin="1s" />
      </g>
      
      <g transform="translate(30, 95)">
        <text x="0" y="0" fontFamily="monospace" fontSize="6" fill="#5F8729" opacity="0.7">FR</text>
        <animateMotion path="M0,0 Q-5,5 0,10 Q5,5 0,0" dur="4s" repeatCount="indefinite" begin="2s" />
      </g>
      
      <g transform="translate(170, 95)">
        <text x="0" y="0" fontFamily="monospace" fontSize="6" fill="#5F8729" opacity="0.7">DE</text>
        <animateMotion path="M0,0 Q5,5 0,10 Q-5,5 0,0" dur="4s" repeatCount="indefinite" begin="3s" />
      </g>
      
      {/* Scanning effect - left document */}
      <rect x="40" y="50" width="55" height="1" fill="#5F8729" opacity="0.6">
        <animate attributeName="y" values="50;120;50" dur="5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.6;0" dur="5s" repeatCount="indefinite" />
      </rect>
      
      {/* Scanning effect - right document */}
      <rect x="105" y="60" width="55" height="1" fill="#5F8729" opacity="0.6">
        <animate attributeName="y" values="60;130;60" dur="5s" repeatCount="indefinite" begin="0.5s" />
        <animate attributeName="opacity" values="0;0.6;0" dur="5s" repeatCount="indefinite" begin="0.5s" />
      </rect>
    </svg>
  );
};

export const HistoryIllustration: React.FC<IllustrationProps> = ({ 
  className = "", 
  width = 200, 
  height = 160 
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="40" y="40" width="120" height="80" rx="8" fill="#F3F4F6" />
      <circle cx="65" cy="60" r="10" fill="#9CA3AF" />
      <rect x="85" y="55" width="60" height="4" rx="2" fill="#D1D5DB" />
      <rect x="85" y="63" width="40" height="4" rx="2" fill="#9CA3AF" />
      <circle cx="65" cy="90" r="10" fill="#9CA3AF" />
      <rect x="85" y="85" width="60" height="4" rx="2" fill="#D1D5DB" />
      <rect x="85" y="93" width="40" height="4" rx="2" fill="#9CA3AF" />
      <circle cx="65" cy="120" r="10" fill="#9CA3AF" />
      <rect x="85" y="115" width="60" height="4" rx="2" fill="#D1D5DB" />
      <rect x="85" y="123" width="40" height="4" rx="2" fill="#9CA3AF" />
      <path d="M65 58L67 61L70 56" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M65 88L67 91L70 86" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M65 118L67 121L70 116" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M150 45C154 48 155 50 155 50C155 50 154 52 150 55" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M50 105C46 102 45 100 45 100C45 100 46 98 50 95" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}; 