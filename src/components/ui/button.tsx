import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
}

export function Button({ className, variant = 'primary', disabled, ...props }: ButtonProps) {
  const base =
    'px-4 py-2 rounded-xl font-medium transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  const variants: Record<string, string> = {
    primary: disabled 
      ? 'bg-gray-400 text-white' 
      : 'bg-blue-600 text-white hover:bg-blue-700',
    outline: disabled
      ? 'border border-gray-300 text-gray-400 bg-gray-50'
      : 'border border-gray-300 text-gray-700 hover:bg-gray-100',
    ghost: disabled
      ? 'text-gray-400 bg-transparent'
      : 'text-gray-700 hover:bg-gray-100',
  };

  return (
    <button 
      className={cn(base, variants[variant], className)} 
      disabled={disabled}
      {...props} 
    />
  );
}
