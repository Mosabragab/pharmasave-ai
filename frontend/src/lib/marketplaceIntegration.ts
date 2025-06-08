// Simple marketplace integration function
// Call this from your marketplace when a transaction occurs

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

export interface MarketplaceTransactionResult {
  success: boolean
  buyerTotal: number
  sellerReceived: number
  platformRevenue: number
  error?: string
}

// Call this function from your marketplace when a transaction occurs
export async function recordMarketplaceTransaction(
  transactionAmount: number,
  buyerPharmacyId: string,
  sellerPharmacyId: string,
  marketplaceTransactionId?: string
): Promise<MarketplaceTransactionResult> {
  try {
    // Call your database function that we just created
    const { data, error } = await supabase.rpc(
      'calculate_transaction_fees_with_financial_integration',
      {
        transaction_amount: transactionAmount,
        transaction_type: 'purchase',
        buyer_pharmacy_id: buyerPharmacyId,
        seller_pharmacy_id: sellerPharmacyId,
        marketplace_transaction_id: marketplaceTransactionId
      }
    )

    if (error) {
      console.error('Error recording marketplace transaction:', error)
      return {
        success: false,
        buyerTotal: transactionAmount,
        sellerReceived: transactionAmount,
        platformRevenue: 0,
        error: error.message
      }
    }

    if (data && data.length > 0) {
      const result = data[0]
      return {
        success: result.financial_entries_created,
        buyerTotal: parseFloat(result.buyer_total_amount),
        sellerReceived: parseFloat(result.seller_received_amount),
        platformRevenue: parseFloat(result.platform_total_revenue)
      }
    }

    return {
      success: false,
      buyerTotal: transactionAmount,
      sellerReceived: transactionAmount,
      platformRevenue: 0,
      error: 'No data returned from fee calculation'
    }

  } catch (error) {
    console.error('Marketplace transaction recording failed:', error)
    return {
      success: false,
      buyerTotal: transactionAmount,
      sellerReceived: transactionAmount,
      platformRevenue: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Record subscription payment
export async function recordSubscriptionPayment(
  pharmacyId: string,
  pharmacyName: string,
  amount: number = 999
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('record_subscription_revenue', {
      pharmacy_id: pharmacyId,
      pharmacy_name: pharmacyName,
      subscription_amount: amount
    })

    if (error) {
      console.error('Error recording subscription:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Subscription recording failed:', error)
    return false
  }
}

// Record withdrawal fee
export async function recordWithdrawalFee(
  pharmacyId: string,
  pharmacyName: string,
  withdrawalAmount: number,
  feeAmount: number = 5
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('record_withdrawal_fee', {
      pharmacy_id: pharmacyId,
      pharmacy_name: pharmacyName,
      withdrawal_amount: withdrawalAmount,
      fee_amount: feeAmount
    })

    if (error) {
      console.error('Error recording withdrawal fee:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Withdrawal fee recording failed:', error)
    return false
  }
}