import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'tertiary' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles with brand guidelines
          "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pharmacy-green focus-visible:ring-offset-2 disabled:pointer-events-none",
          // Border radius: 4px as per brand guidelines
          "rounded",
          // Variants following brand guidelines
          {
            // Primary: Pharmacy Green background, white text, 4px border radius
            'bg-pharmacy-green text-white hover:bg-pharmacy-green/90 disabled:bg-gray-400 disabled:text-gray-200': variant === 'default',
            
            // Secondary: White background, Trust Blue border and text, 4px border radius  
            'bg-white border border-trust-blue text-trust-blue hover:bg-trust-blue/10 dark:bg-slate-800 dark:border-white dark:text-white dark:hover:bg-white/10 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400': variant === 'secondary' || variant === 'outline',
            
            // Tertiary: Text only in Trust Blue with no background
            'text-trust-blue hover:text-trust-blue/80 hover:bg-trust-blue/5 dark:text-white dark:hover:text-white/80 dark:hover:bg-white/10 disabled:text-gray-400': variant === 'tertiary' || variant === 'ghost',
            
            // Destructive
            'bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400': variant === 'destructive'
          },
          // Sizes
          {
            'h-10 px-4 py-2 text-sm': size === 'default',
            'h-9 px-3 text-sm': size === 'sm', 
            'h-11 px-6 text-base': size === 'lg',
            'h-10 w-10 text-sm': size === 'icon'
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }