'use client'

import React from 'react'
import Header from './Header'

interface LayoutProps {
  children: React.ReactNode
  variant?: 'landing' | 'auth' | 'dashboard' | 'app'
  className?: string
  
  // Header props that get passed through
  showBackButton?: boolean
  backButtonText?: string
  backButtonHref?: string
  title?: string
  subtitle?: string
  pharmacyName?: string
  pharmacyId?: string
  userRole?: string
  isVerified?: boolean
  showSettings?: boolean
  showSignOut?: boolean
  showProfileButton?: boolean
  showDashboardButton?: boolean
  showWalletButton?: boolean
  onSignOut?: () => void
}

export default function Layout({
  children,
  variant = 'landing',
  className = '',
  // Header props
  showBackButton,
  backButtonText,
  backButtonHref,
  title,
  subtitle,
  pharmacyName,
  pharmacyId,
  userRole,
  isVerified,
  showSettings,
  showSignOut,
  showProfileButton,
  showDashboardButton,
  showWalletButton,
  onSignOut
}: LayoutProps) {
  // Landing page has fixed header, others have normal flow
  const isLandingPage = variant === 'landing'
  
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-slate-900 ${className}`}>
      <Header
        variant={variant}
        showBackButton={showBackButton}
        backButtonText={backButtonText}
        backButtonHref={backButtonHref}
        title={title}
        subtitle={subtitle}
        pharmacyName={pharmacyName}
        pharmacyId={pharmacyId}
        userRole={userRole}
        isVerified={isVerified}
        showSettings={showSettings}
        showSignOut={showSignOut}
        showProfileButton={showProfileButton}
        showDashboardButton={showDashboardButton}
        showWalletButton={showWalletButton}
        onSignOut={onSignOut}
      />
      
      {/* Main content */}
      <main className={isLandingPage ? 'pt-16' : ''}>
        {children}
      </main>
    </div>
  )
}
