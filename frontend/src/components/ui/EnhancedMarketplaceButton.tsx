/**
 * 🎯 Enhanced Marketplace Ready Button Component
 * 
 * Makes the marketplace access even more prominent and engaging:
 * - Animated pulse effect when ready
 * - Dynamic messaging based on progress
 * - Clear value proposition
 * - Encouraging call-to-action
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  ShoppingBag, 
  ArrowRight, 
  Target, 
  TrendingUp, 
  Zap,
  Star,
  Award,
  CheckCircle,
  Shield
} from 'lucide-react'

interface MarketplaceButtonProps {
  progress: number
  verified: boolean
  onAction: () => void
  className?: string
}

export function EnhancedMarketplaceButton({ 
  progress, 
  verified, 
  onAction, 
  className = '' 
}: MarketplaceButtonProps) {
  
  const getButtonConfig = () => {
    if (verified) {
      return {
        level: 'Full Access',
        description: 'All features unlocked',
        buttonText: 'Browse Marketplace',
        buttonIcon: ShoppingBag,
        className: 'bg-green-600 hover:bg-green-700 border-green-500 shadow-green-500/25',
        glowEffect: true,
        showStars: true
      }
    } else if (progress >= 75) {
      return {
        level: 'Ready for Verification',
        description: 'Submit documents to unlock trading',
        buttonText: 'Submit for Verification',
        buttonIcon: Shield,
        className: 'bg-blue-600 hover:bg-blue-700 border-blue-500 shadow-blue-500/25',
        glowEffect: true,
        showStars: false
      }
    } else if (progress >= 50) {
      return {
        level: 'Marketplace Ready',
        description: 'Start browsing and creating listings',
        buttonText: 'Explore Marketplace',
        buttonIcon: ShoppingBag,
        className: 'bg-pharmacy-green hover:bg-pharmacy-green/90 border-pharmacy-green shadow-pharmacy-green/25',
        glowEffect: true,
        showStars: false
      }
    } else if (progress >= 30) {
      return {
        level: 'Getting Close',
        description: `${50 - progress}% more to unlock marketplace`,
        buttonText: 'Continue Setup',
        buttonIcon: TrendingUp,
        className: 'bg-orange-600 hover:bg-orange-700 border-orange-500',
        glowEffect: false,
        showStars: false
      }
    } else {
      return {
        level: 'Getting Started',
        description: 'Complete your profile to access features',
        buttonText: 'Complete Profile',
        buttonIcon: Target,
        className: 'bg-gray-600 hover:bg-gray-700 border-gray-500',
        glowEffect: false,
        showStars: false
      }
    }
  }

  const config = getButtonConfig()
  const ButtonIcon = config.buttonIcon

  return (
    <div className={`relative ${className}`}>
      {/* Glow effect for ready states */}
      {config.glowEffect && (
        <div className="absolute inset-0 bg-gradient-to-r from-pharmacy-green/20 to-blue-500/20 rounded-lg blur-lg animate-pulse" />
      )}
      
      {/* Main button container */}
      <div className={`relative p-4 rounded-lg border-2 ${config.className} ${config.glowEffect ? 'shadow-lg' : ''}`}>
        {/* Stars for verified status */}
        {config.showStars && (
          <div className="absolute -top-2 -right-2 flex space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-bounce" style={{ animationDelay: '200ms' }} />
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-bounce" style={{ animationDelay: '400ms' }} />
          </div>
        )}

        {/* Content */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-1">
              {verified && <CheckCircle className="w-4 h-4 text-white mr-2" />}
              {progress >= 50 && !verified && <Award className="w-4 h-4 text-white mr-2" />}
              {progress >= 30 && progress < 50 && <Zap className="w-4 h-4 text-white mr-2" />}
              <h4 className="font-semibold text-white text-sm">
                {config.level}
              </h4>
            </div>
            <p className="text-white/90 text-xs leading-tight">
              {config.description}
            </p>
          </div>
          
          <Button
            onClick={onAction}
            size="sm"
            className="ml-4 bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 backdrop-blur-sm"
          >
            <ButtonIcon className="w-4 h-4 mr-1" />
            {config.buttonText}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>

        {/* Progress indicator for incomplete profiles */}
        {progress < 100 && progress >= 30 && (
          <div className="mt-3 bg-white/20 rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${Math.max(progress, 10)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Optional: Usage example for integration
export function MarketplaceButtonExample() {
  const handleAction = () => {
    console.log('Marketplace action clicked!')
  }

  return (
    <div className="space-y-4 p-6">
      {/* Different states */}
      <EnhancedMarketplaceButton 
        progress={100} 
        verified={true} 
        onAction={handleAction}
      />
      
      <EnhancedMarketplaceButton 
        progress={85} 
        verified={false} 
        onAction={handleAction}
      />
      
      <EnhancedMarketplaceButton 
        progress={65} 
        verified={false} 
        onAction={handleAction}
      />
      
      <EnhancedMarketplaceButton 
        progress={40} 
        verified={false} 
        onAction={handleAction}
      />
      
      <EnhancedMarketplaceButton 
        progress={20} 
        verified={false} 
        onAction={handleAction}
      />
    </div>
  )
}