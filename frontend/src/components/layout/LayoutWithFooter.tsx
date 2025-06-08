'use client'

import { Footer } from '@/components/layout/Footer'

interface LayoutWithFooterProps {
  children: React.ReactNode
}

export default function LayoutWithFooter({ children }: LayoutWithFooterProps) {
  // Pages that should not show footer (if any)
  const hideFooterPaths: string[] = [
    // Add any specific paths where footer should be hidden
    // Currently we want footer on all pages, so this array is empty
  ]

  // For now, show footer on all pages
  const shouldShowFooter = true
  
  // Use minimal footer for ALL pages - clean, professional design
  const footerVariant = 'minimal' as const

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content area - takes up available space */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer - automatically applied to all pages */}
      {shouldShowFooter && (
        <Footer variant={footerVariant} />
      )}
    </div>
  )
}