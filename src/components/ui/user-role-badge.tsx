import React from 'react';
import { CheckCircle, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserRoleBadgeProps {
  accountType: 'user' | 'listener' | 'doctor' | 'admin';
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Visual badge to differentiate users, listeners, doctors, and admins
 * - Users: No badge (default)
 * - Listeners (verified): Checkmark icon (verified professional)
 * - Listeners (unverified): Stethoscope icon without checkmark
 * - Doctors: Stethoscope icon with special styling
 * - Admins: Shield icon
 */
export function UserRoleBadge({ 
  accountType, 
  isVerified = false,
  size = 'sm',
  showLabel = false,
  className 
}: UserRoleBadgeProps) {
  // Regular users don't get a badge
  if (accountType === 'user') {
    return null;
  }

  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const iconSize = sizeClasses[size];

  // Render listener badge
  if (accountType === 'listener') {
    if (isVerified) {
      return (
        <span 
          className={cn(
            'inline-flex items-center gap-1 text-green-600 dark:text-green-400',
            className
          )}
          title="Verified Listener"
        >
          <CheckCircle className={cn(iconSize, 'fill-current')} />
          {showLabel && <span className="text-xs font-medium">Verified Listener</span>}
        </span>
      );
    } else {
      return (
        <span 
          className={cn(
            'inline-flex items-center gap-1 text-blue-600 dark:text-blue-400',
            className
          )}
          title="Listener"
        >
          <Stethoscope className={iconSize} />
          {showLabel && <span className="text-xs font-medium">Listener</span>}
        </span>
      );
    }
  }

  // Render doctor badge
  if (accountType === 'doctor') {
    return (
      <span 
        className={cn(
          'inline-flex items-center gap-1 text-purple-600 dark:text-purple-400',
          className
        )}
        title="Doctor"
      >
        <Stethoscope className={cn(iconSize, 'fill-current')} />
        {showLabel && <span className="text-xs font-medium">Doctor</span>}
      </span>
    );
  }

  // Render admin badge
  if (accountType === 'admin') {
    return (
      <span 
        className={cn(
          'inline-flex items-center gap-1 text-red-600 dark:text-red-400',
          className
        )}
        title="Admin"
      >
        <CheckCircle className={cn(iconSize, 'fill-current')} />
        {showLabel && <span className="text-xs font-medium">Admin</span>}
      </span>
    );
  }

  return null;
}

/**
 * Helper function to get the appropriate badge component
 */
export function getUserRoleBadge(
  accountType: string | undefined | null, 
  isVerified?: boolean
): React.ReactNode {
  if (!accountType || accountType === 'user') return null;
  
  return (
    <UserRoleBadge 
      accountType={accountType as any}
      isVerified={isVerified}
    />
  );
}
