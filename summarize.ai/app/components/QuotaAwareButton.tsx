'use client';

import React from 'react';
import { Button, ButtonProps } from '@/app/components/ui/Button';
import { useQuotaCheck } from '@/app/components/QuotaExceededToast';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/app/redux/store';
import { incrementUserQuota } from '@/app/redux/features/quotaSlice';
import { useAuth } from '@/app/context/AuthContext';
import { Tooltip } from '@/app/components/ui/Tooltip';

interface QuotaAwareButtonProps extends ButtonProps {
  quotaAction?: () => void;
}

/**
 * A button that is aware of the user's quota and disables itself when the quota is exceeded
 */
const QuotaAwareButton = React.forwardRef<HTMLButtonElement, QuotaAwareButtonProps>(
  ({ children, quotaAction, onClick, className, ...props }, ref) => {
    const { checkQuota, isQuotaAvailable } = useQuotaCheck();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useAuth();
    
    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isQuotaAvailable) {
        e.preventDefault();
        return;
      }
      
      // Perform custom quota action if provided (for more complex flows)
      if (quotaAction) {
        quotaAction();
      } else if (user?.uid) {
        // Otherwise, just increment quota
        dispatch(incrementUserQuota(user.uid));
      }
      
      // Call the original onClick handler if it exists
      if (onClick) {
        onClick(e);
      }
    };
    
    const buttonContent = (
      <Button
        ref={ref}
        onClick={handleClick}
        disabled={!isQuotaAvailable || props.disabled}
        className={className}
        {...props}
      >
        {children}
      </Button>
    );
    
    if (!isQuotaAvailable) {
      return (
        <Tooltip 
          content="Daily quota reached. Upgrade for unlimited or come back tomorrow for 10 more."
          side="top"
        >
          {buttonContent}
        </Tooltip>
      );
    }
    
    return buttonContent;
  }
);

QuotaAwareButton.displayName = "QuotaAwareButton";

export { QuotaAwareButton }; 