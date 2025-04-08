'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/app/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary-dark btn-modern",
        secondary: "bg-secondary text-white hover:bg-secondary-dark btn-modern",
        outline: "border border-input bg-transparent hover:bg-muted hover:text-foreground",
        ghost: "hover:bg-muted hover:text-foreground",
        destructive: "bg-danger text-white hover:bg-danger/90 btn-modern",
        success: "bg-success text-white hover:bg-success/90 btn-modern",
      },
      size: {
        default: "h-10 py-2 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    isLoading, 
    leftIcon, 
    rightIcon, 
    asChild = false,
    children, 
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size }), className)}
          ref={ref}
          disabled={isLoading}
          {...props}
        >
          {children}
        </Comp>
      );
    }
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2 transition-transform group-hover:translate-x-0.5">{leftIcon}</span>}
        <span className="relative z-10">{children}</span>
        {!isLoading && rightIcon && <span className="ml-2 transition-transform group-hover:translate-x-0.5">{rightIcon}</span>}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants }; 