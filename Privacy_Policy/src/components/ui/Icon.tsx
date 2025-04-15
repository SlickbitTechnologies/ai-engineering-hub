import React from 'react';
import { LucideIcon } from 'lucide-react';
import { theme } from '../../styles/theme';

type IconVariant = 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'error' | 'info';
type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IconProps {
  icon: LucideIcon;
  variant?: IconVariant;
  size?: IconSize;
  className?: string;
  filled?: boolean;
  strokeWidth?: number;
}

const sizeMap: Record<IconSize, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
};

export default function Icon({
  icon: IconComponent,
  variant = 'primary',
  size = 'md',
  className = '',
  filled = false,
  strokeWidth = 2
}: IconProps) {
  const iconSize = sizeMap[size];
  
  let color;
  switch (variant) {
    case 'primary':
      color = theme.colors.primary[500];
      break;
    case 'secondary':
      color = theme.colors.secondary[500];
      break;
    case 'neutral':
      color = theme.colors.neutral[500];
      break;
    case 'success':
      color = theme.colors.success;
      break;
    case 'warning':
      color = theme.colors.warning;
      break;
    case 'error':
      color = theme.colors.error;
      break;
    case 'info':
      color = theme.colors.info;
      break;
    default:
      color = theme.colors.primary[500];
  }

  return (
    <IconComponent
      color={color}
      size={iconSize}
      className={className}
      strokeWidth={strokeWidth}
      fill={filled ? color : 'none'}
    />
  );
} 