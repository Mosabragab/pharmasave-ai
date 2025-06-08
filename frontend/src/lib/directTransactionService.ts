// ===============================================
// DIRECT TRANSACTION SERVICE FOR PHARMASAVE AI
// Calls your existing database functions directly
// ===============================================

import { supabase } from './supabase'

export interface TransactionRequest {
  buyer_pharmacy_id: string
  seller_pharmacy_id: string
  listing_id: string
  quantity: number
  transaction_type?: 'purchase' | 'trade'
}

export interface TransactionResponse {
  success: boolean
  transaction_id?: string
  amount?: number
  buyer_fee?: number
  seller_fee?: number
  fee_amount?: number
  status?: string
  error?: string
  message?: string
}

class DirectTransactionService {
  /**
   * Create transaction - calls your existing create_transaction function directly
   */
  async createTransaction(request: TransactionRequest): Promise<TransactionResponse> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return {
          success: false,
          error: 'Not authenticated'
        }
      }

      // Get pharmacist ID for the current user
      const { data: pharmacistData, error: pharmacistError } = await supabase
        .from('pharmacists')
        .select('id, pharmacy_id')
        .eq('auth_id', user.id)
        .eq('pharmacy_id', request.buyer_pharmacy_id)
        .eq('status', 'active')
        .single()

      if (pharmacistError || !pharmacistData) {
        return {
          success: false,
          error: 'You are not authorized to create transactions for this pharmacy'
        }
      }

      // Call YOUR existing create_transaction function directly
      const { data, error } = await supabase.rpc('create_transaction', {
        p_buyer_pharmacy_id: request.buyer_pharmacy_id,
        p_seller_pharmacy_id: request.seller_pharmacy_id,
        p_buyer_pharmacist_id: pharmacistData.id,
        p_listing_id: request.listing_id,
        p_quantity: request.quantity,
        p_transaction_type: request.transaction_type || 'purchase'
      })

      if (error) {
        console.error('Transaction creation error:', error)
        return {
          success: false,
          error: error.message || 'Failed to create transaction'
        }
      }

      // Your function returns the result directly
      return {
        success: true,
        ...data
      }
      
    } catch (error) {
      console.error('Transaction service error:', error)
      return {
        success: false,
        error: 'Network error while creating transaction'
      }
    }
  }

  /**
   * Approve transaction - calls your existing approve_transaction function
   */
  async approveTransaction(transactionId: string, notes?: string): Promise<TransactionResponse> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return {
          success: false,
          error: 'Not authenticated'
        }
      }

      // Get pharmacist ID for the current user
      const { data: pharmacistData, error: pharmacistError } = await supabase
        .from('pharmacists')
        .select('id, pharmacy_id')
        .eq('auth_id', user.id)
        .eq('status', 'active')
        .single()

      if (pharmacistError || !pharmacistData) {
        return {
          success: false,
          error: 'Pharmacist profile not found'
        }
      }

      // Call YOUR existing approve_transaction function
      const { data, error } = await supabase.rpc('approve_transaction', {
        p_transaction_id: transactionId,
        p_approving_pharmacist_id: pharmacistData.id,
        p_notes: notes || 'Transaction approved'
      })

      if (error) {
        console.error('Transaction approval error:', error)
        return {
          success: false,
          error: error.message || 'Failed to approve transaction'
        }
      }

      return {
        success: true,
        ...data
      }
      
    } catch (error) {
      console.error('Transaction approval error:', error)
      return {
        success: false,
        error: 'Network error while approving transaction'
      }
    }
  }

  /**
   * Reject transaction - calls your existing reject_transaction function
   */
  async rejectTransaction(transactionId: string, reason?: string): Promise<TransactionResponse> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return {
          success: false,
          error: 'Not authenticated'
        }
      }

      const { data: pharmacistData, error: pharmacistError } = await supabase
        .from('pharmacists')
        .select('id, pharmacy_id')
        .eq('auth_id', user.id)
        .eq('status', 'active')
        .single()

      if (pharmacistError || !pharmacistData) {
        return {
          success: false,
          error: 'Pharmacist profile not found'
        }
      }

      const { data, error } = await supabase.rpc('reject_transaction', {
        p_transaction_id: transactionId,
        p_rejecting_pharmacist_id: pharmacistData.id,
        p_reason: reason || 'Transaction rejected'
      })

      if (error) {
        console.error('Transaction rejection error:', error)
        return {
          success: false,
          error: error.message || 'Failed to reject transaction'
        }
      }

      return {
        success: true,
        ...data
      }
      
    } catch (error) {
      console.error('Transaction rejection error:', error)
      return {
        success: false,
        error: 'Network error while rejecting transaction'
      }
    }
  }

  /**
   * Get wallet summary - calls your existing get_wallet_summary function
   */
  async getWalletSummary(pharmacyId: string) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return {
          success: false,
          error: 'Not authenticated'
        }
      }

      // Verify user belongs to the pharmacy
      const { data: pharmacistData, error: pharmacistError } = await supabase
        .from('pharmacists')
        .select('pharmacy_id')
        .eq('auth_id', user.id)
        .eq('pharmacy_id', pharmacyId)
        .eq('status', 'active')
        .single()

      if (pharmacistError || !pharmacistData) {
        return {
          success: false,
          error: 'Unauthorized: Access denied to this pharmacy wallet'
        }
      }

      // Call YOUR existing get_wallet_summary function
      const { data, error } = await supabase.rpc('get_wallet_summary', {
        p_pharmacy_id: pharmacyId
      })

      if (error) {
        console.error('Wallet summary error:', error)
        return {
          success: false,
          error: error.message || 'Failed to get wallet summary'
        }
      }

      return {
        success: true,
        ...data
      }
      
    } catch (error) {
      console.error('Wallet service error:', error)
      return {
        success: false,
        error: 'Network error while fetching wallet summary'
      }
    }
  }

  /**
   * Get pharmacy transactions - queries your existing tables directly
   */
  async getPharmacyTransactions(
    pharmacyId: string, 
    type: 'sent' | 'received' | 'all' = 'all',
    status?: string,
    limit: number = 50
  ) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return {
          success: false,
          error: 'Not authenticated'
        }
      }

      // Verify user belongs to the pharmacy
      const { data: pharmacistData, error: pharmacistError } = await supabase
        .from('pharmacists')
        .select('pharmacy_id')
        .eq('auth_id', user.id)
        .eq('pharmacy_id', pharmacyId)
        .eq('status', 'active')
        .single()

      if (pharmacistError || !pharmacistData) {
        return {
          success: false,
          error: 'Unauthorized: Access denied to this pharmacy transactions'
        }
      }

      // Build query for your existing transaction tables with joins
      let query = supabase
        .from('txn')
        .select(`
          *,
          buyer_pharmacy:buyer_pharmacy_id(name, phone),
          seller_pharmacy:seller_pharmacy_id(name, phone),
          listing:lstng_id(
            *,
            medicine:med_id(name, form, strength)
          ),
          txn_items(*)
        `)

      // Apply filters based on type
      if (type === 'sent') {
        query = query.eq('buyer_pharmacy_id', pharmacyId)
      } else if (type === 'received') {
        query = query.eq('seller_pharmacy_id', pharmacyId)
      } else {
        // Show all transactions where pharmacy is either buyer or seller
        query = query.or(`buyer_pharmacy_id.eq.${pharmacyId},seller_pharmacy_id.eq.${pharmacyId}`)
      }

      // Apply status filter if provided
      if (status) {
        query = query.eq('status', status)
      }

      // Apply ordering and limit
      query = query
        .order('created_at', { ascending: false })
        .limit(limit)

      const { data, error } = await query

      if (error) {
        console.error('Transactions fetch error:', error)
        return {
          success: false,
          error: error.message || 'Failed to fetch transactions'
        }
      }

      return {
        success: true,
        data: data,
        count: data?.length || 0
      }
      
    } catch (error) {
      console.error('Transaction service error:', error)
      return {
        success: false,
        error: 'Network error while fetching transactions'
      }
    }
  }
}

export const directTransactionService = new DirectTransactionService()