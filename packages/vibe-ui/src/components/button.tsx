import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText = 'Loading...',
  icon,
  children,
  disabled,
  className = '',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantStyles = {
    primary: 'btn-liquid hover-lift bg-brand-accent hover:bg-yellow-400 active:bg-yellow-500 text-brand-primary shadow-lg hover:shadow-xl active:scale-95 focus:ring-brand-accent dark:bg-yellow-400 dark:hover:bg-yellow-300 dark:active:bg-yellow-500 dark:text-zinc-900',
    secondary: 'btn-liquid hover-lift bg-brand-primary hover:bg-teal-800 active:bg-teal-900 text-white shadow-md hover:shadow-lg active:scale-95 focus:ring-brand-primary dark:bg-teal-600 dark:hover:bg-teal-500 dark:active:bg-teal-700',
    outline: 'hover-lift border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 focus:ring-gray-300 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:border-zinc-600 dark:active:bg-zinc-700',
    ghost: 'text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-300 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:active:bg-zinc-700',
    danger: 'btn-liquid hover-lift bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-md hover:shadow-lg active:scale-95 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-500 dark:active:bg-red-700',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';
