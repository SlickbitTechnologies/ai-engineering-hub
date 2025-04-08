import React from 'react';
import { motion } from 'framer-motion';

interface IllustrationProps {
  className?: string;
  width?: number;
  height?: number;
}

export const LoginIllustration: React.FC<IllustrationProps> = ({ 
  className = "", 
  width = 400, 
  height = 300 
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="login-gradient-primary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8EB454" />
          <stop offset="100%" stopColor="#5F8729" />
        </linearGradient>
        <linearGradient id="login-gradient-secondary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5F8729" />
          <stop offset="100%" stopColor="#4A6C1E" />
        </linearGradient>
        <linearGradient id="login-gradient-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7F9EF" />
          <stop offset="100%" stopColor="#E5EDCD" />
        </linearGradient>
        <filter id="login-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.2"/>
        </filter>
        <filter id="login-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor="#5F8729" floodOpacity="0.3" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="glow"/>
          <feComposite in="SourceGraphic" in2="glow" operator="over"/>
        </filter>
      </defs>
      
      {/* Background Elements */}
      <circle cx="200" cy="150" r="130" fill="url(#login-gradient-bg)" opacity="0.8"/>
      <motion.circle 
        cx="320" 
        cy="100" 
        r="40" 
        fill="url(#login-gradient-primary)" 
        opacity="0.2"
        animate={{ 
          y: [0, -10, 0],
          scale: [1, 1.05, 1] 
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse" 
        }}
      />
      <motion.circle 
        cx="80" 
        cy="220" 
        r="30" 
        fill="url(#login-gradient-secondary)" 
        opacity="0.15"
        animate={{ 
          y: [0, 10, 0],
          scale: [1, 1.05, 1] 
        }}
        transition={{ 
          duration: 5,
          repeat: Infinity,
          repeatType: "reverse" 
        }}
      />

      {/* Secure Login Device */}
      <g filter="url(#login-shadow)">
        <rect x="120" y="80" width="160" height="140" rx="12" fill="white" />
        <rect x="135" y="110" width="130" height="20" rx="4" fill="#F3F4F6" />
        <rect x="135" y="145" width="130" height="20" rx="4" fill="#F3F4F6" />
        
        {/* Lock Icon */}
        <motion.g
          animate={{ 
            y: [0, -3, 0],
            rotate: [0, 2, 0, -2, 0],
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        >
          <rect x="170" y="40" width="60" height="50" rx="25" fill="url(#login-gradient-primary)" filter="url(#login-glow)" />
          <path d="M195 65 L205 65 L205 75 L195 75 Z" fill="white" />
          <path d="M188 65 L212 65 L212 85 C212 89.4183 208.418 93 204 93 L196 93 C191.582 93 188 89.4183 188 85 L188 65 Z" fill="white" />
          <circle cx="200" cy="78" r="5" fill="url(#login-gradient-primary)" />
          <rect x="198" y="78" width="4" height="8" rx="2" fill="url(#login-gradient-primary)" />
        </motion.g>
        
        {/* Login Button */}
        <motion.rect 
          x="160" 
          y="180" 
          width="80" 
          height="25" 
          rx="12.5" 
          fill="url(#login-gradient-primary)"
          animate={{ 
            scale: [1, 1.04, 1],
            filter: [
              "brightness(1)",
              "brightness(1.1)", 
              "brightness(1)"
            ]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
      </g>
      
      {/* Decorative Elements */}
      <motion.path 
        d="M80,150 C100,130 120,170 140,150 C160,130 180,170 200,150 C220,130 240,170 260,150 C280,130 300,170 320,150" 
        stroke="url(#login-gradient-primary)" 
        strokeWidth="2" 
        strokeLinecap="round" 
        fill="none"
        strokeDasharray="320"
        strokeDashoffset="320"
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
      />
      
      {/* Animated Circles */}
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.circle
          key={i}
          cx={100 + i * 40}
          cy={240}
          r={4}
          fill="url(#login-gradient-primary)"
          animate={{ 
            y: [0, -10, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{ 
            duration: 2,
            delay: i * 0.2,
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
      ))}
    </svg>
  );
};

export const SignUpIllustration: React.FC<IllustrationProps> = ({ 
  className = "", 
  width = 400, 
  height = 300 
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="signup-gradient-primary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8EB454" />
          <stop offset="100%" stopColor="#5F8729" />
        </linearGradient>
        <linearGradient id="signup-gradient-secondary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5F8729" />
          <stop offset="100%" stopColor="#4A6C1E" />
        </linearGradient>
        <linearGradient id="signup-gradient-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7F9EF" />
          <stop offset="100%" stopColor="#E5EDCD" />
        </linearGradient>
        <filter id="signup-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.2"/>
        </filter>
        <filter id="signup-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor="#5F8729" floodOpacity="0.3" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="glow"/>
          <feComposite in="SourceGraphic" in2="glow" operator="over"/>
        </filter>
      </defs>
      
      {/* Background Elements */}
      <rect x="100" y="60" width="200" height="180" rx="20" fill="url(#signup-gradient-bg)" opacity="0.8"/>
      <motion.circle 
        cx="310" 
        cy="120" 
        r="40" 
        fill="url(#signup-gradient-primary)" 
        opacity="0.2"
        animate={{ 
          y: [0, -10, 0],
          scale: [1, 1.05, 1] 
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse" 
        }}
      />
      <motion.circle 
        cx="90" 
        cy="200" 
        r="30" 
        fill="url(#signup-gradient-secondary)" 
        opacity="0.15"
        animate={{ 
          y: [0, 10, 0],
          scale: [1, 1.05, 1] 
        }}
        transition={{ 
          duration: 5,
          repeat: Infinity,
          repeatType: "reverse" 
        }}
      />

      {/* User Profile Card */}
      <g filter="url(#signup-shadow)">
        <rect x="140" y="80" width="120" height="160" rx="12" fill="white" />
        
        {/* Profile Image */}
        <circle cx="200" cy="120" r="30" fill="#F3F4F6" />
        <motion.path 
          d="M200,100 C208,100 215,107 215,115 C215,123 208,130 200,130 C192,130 185,123 185,115 C185,107 192,100 200,100"
          fill="url(#signup-gradient-primary)"
          animate={{ 
            scale: [1, 1.05, 1],
            y: [0, -1, 0],
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
        <path d="M180,155 C180,140 190,135 200,135 C210,135 220,140 220,155 L220,170 L180,170 L180,155 Z" fill="#F3F4F6" />

        {/* Input Fields */}
        <rect x="155" y="160" width="90" height="12" rx="4" fill="#F3F4F6" />
        <rect x="155" y="180" width="90" height="12" rx="4" fill="#F3F4F6" />
        <rect x="155" y="200" width="90" height="12" rx="4" fill="#F3F4F6" />
        
        {/* Signup Button */}
        <motion.rect 
          x="165" 
          y="220" 
          width="70" 
          height="12" 
          rx="6" 
          fill="url(#signup-gradient-primary)"
          animate={{ 
            scale: [1, 1.04, 1],
            filter: [
              "brightness(1)",
              "brightness(1.1)", 
              "brightness(1)"
            ]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
      </g>
      
      {/* Plus Sign */}
      <motion.g 
        filter="url(#signup-glow)"
        animate={{ 
          rotate: [0, 360],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          rotate: { duration: 8, repeat: Infinity, ease: "linear" },
          scale: { duration: 2, repeat: Infinity, repeatType: "reverse" }
        }}
      >
        <circle cx="270" cy="70" r="20" fill="url(#signup-gradient-primary)" />
        <path d="M270 60 L270 80 M260 70 L280 70" stroke="white" strokeWidth="3" strokeLinecap="round" />
      </motion.g>
      
      {/* Decorative Dots */}
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.circle
          key={i}
          cx={120 + i * 40}
          cy={250}
          r={3}
          fill="url(#signup-gradient-primary)"
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{ 
            duration: 2,
            delay: i * 0.3,
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
      ))}
      
      {/* Animated Path */}
      <motion.path 
        d="M110,50 C140,30 170,70 200,50 C230,30 260,70 290,50" 
        stroke="url(#signup-gradient-primary)" 
        strokeWidth="2" 
        strokeLinecap="round" 
        fill="none"
        strokeDasharray="240"
        strokeDashoffset="240"
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
      />
    </svg>
  );
}; 