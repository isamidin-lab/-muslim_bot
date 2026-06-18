import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const vs: Record<string, string> = {
  default: 'bg-primary text-white hover:bg-primary-700 shadow-sm',
  secondary: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
  outline: 'border border-emerald-600 text-emerald-700 hover:bg-emerald-50',
  ghost: 'hover:bg-emerald-50 text-emerald-700',
  link: 'text-emerald-600 underline-offset-4 hover:underline',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
};
const ss: Record<string, string> = {
  default: 'h-11 px-6 py-2.5', sm: 'h-9 px-4 py-2', lg: 'h-13 px-8 py-3 text-base', icon: 'h-10 w-10',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button className={cn('inline-flex items-center justify-center rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50', vs[variant], ss[size], className)} ref={ref} {...props} />
  ));
Button.displayName = 'Button';
