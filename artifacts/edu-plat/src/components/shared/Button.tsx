// ============================================================================
// src/components/shared/Button.tsx
// ============================================================================

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const baseStyles =
    'font-semibold rounded-lg transition-all duration-200 font-sans flex items-center justify-center gap-2 cursor-pointer select-none';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  };

  const variantStyles = {
    primary:
      'bg-[#002045] text-white hover:bg-[#006b5f] shadow-sm hover:shadow-md active:scale-[0.98]',
    secondary:
      'bg-[#006b5f] text-white hover:bg-[#005148] shadow-sm hover:shadow-md active:scale-[0.98]',
    outline:
      'border-2 border-[#006b5f] text-[#006b5f] bg-white hover:bg-[#e0f3f0] active:scale-[0.98]',
    ghost: 'text-[#006b5f] hover:bg-[#eff4ff] active:scale-[0.98]',
    danger:
      'bg-[#ba1a1a] text-white hover:bg-[#93000a] shadow-sm hover:shadow-md active:scale-[0.98]',
  };

  return (
    <motion.button
      whileHover={disabled || loading ? {} : { scale: 1.02 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      disabled={disabled || loading}
      className={[
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
      )}
      {children}
    </motion.button>
  );
}
