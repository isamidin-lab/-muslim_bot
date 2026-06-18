'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

interface DialogProps { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode; }
interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> { onClose?: () => void; }

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/80" onClick={() => onOpenChange(false)} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, onClose, ...props }, ref) => (
    <div ref={ref} className={cn('relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg', className)} {...props}>
      {children}
      {onClose && <button onClick={onClose} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 text-xl">&times;</button>}
    </div>
  ));
DialogContent.displayName = 'DialogContent';

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />;
}
