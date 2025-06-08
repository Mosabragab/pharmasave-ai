// 💰 PLATFORM FEE SERVICE
// =======================
// Centralized fee management for frontend

import { supabase } from './supabase'

interface FeeCalculation {
  transaction_amount: number
  platform_fee_rate: number
  platform_fee: number
  buyer_fee: number
  seller_fee: number
  total_fees: number
  net_amount: number
  buyer_total?: number  // What buyer pays (transaction + buyer fee)
  currency: string
}

interface PlatformConfig {
  config_key: string
  config_value: any
  config_type: string
  description: string
}

class PlatformFeeService {
  private configCache: Map<string, any> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * Get platform configuration value
   */
  async getConfig(configKey: string): Promise<any> {
    // Check cache first
    const cachedValue = this.configCache.get(configKey)
    const expiry = this.cacheExpiry.get(configKey)
    
    if (cachedValue !== undefined && expiry && Date.now() < expiry) {
      return cachedValue
    }

    try {
      // Call the database function
      const { data, error } = await supabase.rpc('get_platform_config', {
        p_config_key: configKey
      })

      if (error) {
        console.error(`Error fetching config ${configKey}:`, error)
        return this.getDefaultValue(configKey)
      }

      // Cache the result
      this.configCache.set(configKey, data)
      this.cacheExpiry.set(configKey, Date.now() + this.CACHE_DURATION)

      return data
    } catch (error) {
      console.error(`Network error fetching config ${configKey}:`, error)
      return this.getDefaultValue(configKey)
    }
  }

  /**
   * Get default values as fallback
   */
  private getDefaultValue(configKey: string): any {
    const defaults: Record<string, any> = {
      'platform_fee_percentage': 0.06,
      'buyer_fee_percentage': 0.03,
      'seller_fee_percentage': 0.03,
      'withdrawal_fee_fixed': 10,
      'monthly_subscription_fee': 999,
      'minimum_transaction_amount': 50,
      'maximum_transaction_amount': 50000
    }
    
    return defaults[configKey] || 0
  }

  /**
   * Calculate transaction fees using database function
   */
  async calculateTransactionFees(
    transactionAmount: number, 
    transactionType: string = 'purchase'
  ): Promise<FeeCalculation> {
    try {
      const { data, error } = await supabase.rpc('calculate_transaction_fees', {
        p_transaction_amount: transactionAmount,
        p_transaction_type: transactionType
      })

      if (error) {
        console.error('Error calculating fees:', error)
        return this.calculateFeesLocally(transactionAmount)
      }

      return data as FeeCalculation
    } catch (error) {
      console.error('Network error calculating fees:', error)
      return this.calculateFeesLocally(transactionAmount)
    }
  }

  /**
   * Local fee calculation as fallback
   */
  private async calculateFeesLocally(transactionAmount: number): Promise<FeeCalculation> {
    const platformFeeRate = await this.getConfig('platform_fee_percentage')
    const buyerFeeRate = await this.getConfig('buyer_fee_percentage')
    const sellerFeeRate = await this.getConfig('seller_fee_percentage')

    const buyerFee = Math.round(transactionAmount * buyerFeeRate * 100) / 100
    const sellerFee = Math.round(transactionAmount * sellerFeeRate * 100) / 100
    const platformFee = buyerFee + sellerFee  // Total collected by platform
    const totalFees = platformFee
    const buyerTotal = transactionAmount + buyerFee  // What buyer pays
    const netAmount = transactionAmount - sellerFee  // What seller receives

    return {
      transaction_amount: transactionAmount,
      platform_fee_rate: platformFeeRate,
      platform_fee: platformFee,
      buyer_fee: buyerFee,
      seller_fee: sellerFee,
      total_fees: totalFees,
      net_amount: netAmount,
      buyer_total: buyerTotal,
      currency: 'EGP'
    }
  }

  /**
   * Get platform fee percentage
   */
  async getPlatformFeePercentage(): Promise<number> {
    return await this.getConfig('platform_fee_percentage')
  }

  /**
   * Get withdrawal fee
   */
  async getWithdrawalFee(): Promise<number> {
    return await this.getConfig('withdrawal_fee_fixed')
  }

  /**
   * Get subscription fee
   */
  async getSubscriptionFee(): Promise<number> {
    return await this.getConfig('monthly_subscription_fee')
  }

  /**
   * Get minimum transaction amount
   */
  async getMinimumTransactionAmount(): Promise<number> {
    return await this.getConfig('minimum_transaction_amount')
  }

  /**
   * Get maximum transaction amount
   */
  async getMaximumTransactionAmount(): Promise<number> {
    return await this.getConfig('maximum_transaction_amount')
  }

  /**
   * Clear cache (useful for admin updates)
   */
  clearCache(): void {
    this.configCache.clear()
    this.cacheExpiry.clear()
  }

  /**
   * Update platform configuration (admin only)
   */
  async updateConfig(configKey: string, configValue: any): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('update_platform_config', {
        p_config_key: configKey,
        p_config_value: configValue
      })

      if (error) {
        console.error(`Error updating config ${configKey}:`, error)
        return false
      }

      // Clear cache to force refresh
      this.configCache.delete(configKey)
      this.cacheExpiry.delete(configKey)

      return data
    } catch (error) {
      console.error(`Network error updating config ${configKey}:`, error)
      return false
    }
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number, currency: string = 'EGP'): string {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '0.00 EGP'
    }
    return `${amount.toFixed(2)} ${currency}`
  }

  /**
   * Validate transaction amount against limits
   */
  async validateTransactionAmount(amount: number): Promise<{
    isValid: boolean
    error?: string
    minAmount?: number
    maxAmount?: number
  }> {
    const minAmount = await this.getMinimumTransactionAmount()
    const maxAmount = await this.getMaximumTransactionAmount()

    if (amount < minAmount) {
      return {
        isValid: false,
        error: `Minimum transaction amount is ${this.formatCurrency(minAmount)}`,
        minAmount,
        maxAmount
      }
    }

    if (amount > maxAmount) {
      return {
        isValid: false,
        error: `Maximum transaction amount is ${this.formatCurrency(maxAmount)}`,
        minAmount,
        maxAmount
      }
    }

    return {
      isValid: true,
      minAmount,
      maxAmount
    }
  }
}

// Create singleton instance
export const platformFeeService = new PlatformFeeService()

// Export types
export type { FeeCalculation, PlatformConfig }
