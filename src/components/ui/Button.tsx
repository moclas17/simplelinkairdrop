import * as React from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'default', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50';
    
    const variantClasses = {
      primary: 'border border-primary/30 bg-gradient-to-b from-primary to-primary/80 text-primary-foreground hover:scale-105 hover:shadow-lg hover:shadow-primary/20',
      secondary: 'border border-white/10 bg-secondary text-secondary-foreground hover:bg-white/5',
      ghost: 'hover:bg-white/5 text-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-white/20 hover:bg-white/5 text-foreground',
    };

    const sizeClasses = {
      sm: 'h-8 px-3 text-xs',
      default: 'h-10 px-4 py-2',
      lg: 'h-12 px-8 py-3',
      icon: 'h-10 w-10',
    };

    const finalClassName = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    return (
      <button
        className={finalClassName}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };