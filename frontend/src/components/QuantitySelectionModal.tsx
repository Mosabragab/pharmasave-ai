// ===============================================
// QUANTITY SELECTION MODAL
// Allows users to choose how many units to buy
// ===============================================

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { platformFeeService } from '@/lib/platformFeeService'
import type { FeeCalculation } from '@/lib/platformFeeService'
import { 
  Package, 
  Plus, 
  Minus, 
  ShoppingCart, 
  DollarSign,
  Calendar,
  AlertTriangle,
  X,
  Calculator,
  Loader2
} from 'lucide-react'

interface QuantitySelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (quantity: number, notes?: string) => void
  listing: {
    id: string
    medicine_name: string
    medicine_details?: string
    unit_price: number
    available_quantity: number
    expiry_date: string
    listing_type: 'sale' | 'trade' | 'both'
    seller_name?: string
  }
  isLoading?: boolean
}

export default function QuantitySelectionModal({
  isOpen,
  onClose,
  onConfirm,
  listing,
  isLoading = false
}: QuantitySelectionModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [feeCalculation, setFeeCalculation] = useState<FeeCalculation | null>(null)
  const [isCalculatingFees, setIsCalculatingFees] = useState(false)

  const maxQuantity = Math.min(listing.available_quantity, 50) // Cap at 50 for UI
  const totalAmount = quantity * listing.unit_price

  // Calculate fees when quantity or price changes
  useEffect(() => {
    const calculateFees = async () => {
      if (totalAmount > 0) {
        setIsCalculatingFees(true)
        try {
          const calculation = await platformFeeService.calculateTransactionFees(
            totalAmount,
            listing.listing_type === 'trade' ? 'trade' : 'purchase'
          )
          setFeeCalculation(calculation)
        } catch (error) {
          console.error('Error calculating fees:', error)
          // Fallback to simple calculation with SPLIT fees
          const buyerFee = totalAmount * 0.03;  // 3% buyer fee
          const sellerFee = totalAmount * 0.03; // 3% seller fee
          const buyerTotal = totalAmount + buyerFee; // What buyer pays
          const sellerNet = totalAmount - sellerFee; // What seller receives
          
          setFeeCalculation({
            transaction_amount: totalAmount,
            platform_fee_rate: 0.06,
            platform_fee: buyerFee + sellerFee, // Total platform collects
            buyer_fee: buyerFee,
            seller_fee: sellerFee,
            total_fees: buyerFee + sellerFee,
            net_amount: sellerNet, // What seller receives
            buyer_total: buyerTotal, // What buyer pays
            currency: 'EGP'
          })
        }
        setIsCalculatingFees(false)
      }
    }

    calculateFees()
  }, [quantity, listing.unit_price, listing.listing_type, totalAmount])

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity)
    }
  }

  const handleConfirm = () => {
    onConfirm(quantity, notes.trim() || undefined)
  }

  const getDaysUntilExpiry = () => {
    const today = new Date()
    const expiry = new Date(listing.expiry_date)
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getExpiryUrgency = () => {
    const days = getDaysUntilExpiry()
    if (days <= 30) return { color: 'text-red-600 dark:text-red-400', label: 'Urgent', bg: 'bg-red-50 dark:bg-red-900/20' }
    if (days <= 60) return { color: 'text-orange-600 dark:text-orange-400', label: 'Soon', bg: 'bg-orange-50 dark:bg-orange-900/20' }
    if (days <= 90) return { color: 'text-yellow-600 dark:text-yellow-400', label: 'Moderate', bg: 'bg-yellow-50 dark:bg-yellow-900/20' }
    return { color: 'text-green-600 dark:text-green-400', label: 'Good', bg: 'bg-green-50 dark:bg-green-900/20' }
  }

  const formatCurrency = (amount: number) => {
    return platformFeeService.formatCurrency(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!isOpen) return null

  const urgency = getExpiryUrgency()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-gray-900 dark:text-white">
              Purchase Request
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Medicine Information */}
          <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {listing.medicine_name}
                </h3>
                {listing.medicine_details && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">{listing.medicine_details}</p>
                )}
                {listing.seller_name && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    From: {listing.seller_name}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-pharmacy-green">
                  {formatCurrency(listing.unit_price)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">per unit</p>
              </div>
            </div>

            {/* Expiry Warning */}
            <div className={`flex items-center space-x-2 p-3 rounded-lg ${urgency.bg}`}>
              <Calendar className={`w-4 h-4 ${urgency.color}`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${urgency.color}`}>
                  Expires: {formatDate(listing.expiry_date)} ({getDaysUntilExpiry()} days)
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Urgency: {urgency.label}
                </p>
              </div>
            </div>
          </div>

          {/* Quantity Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">Select Quantity</h4>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Available: {listing.available_quantity} units
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1 || isLoading}
              >
                <Minus className="w-4 h-4" />
              </Button>

              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  disabled={isLoading}
                  className="w-20 px-3 py-2 text-center border border-gray-300 dark:border-slate-600 rounded-md focus:ring-pharmacy-green focus:border-pharmacy-green bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
                <span className="text-gray-600 dark:text-gray-300">units</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= maxQuantity || isLoading}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Quantity Buttons */}
            <div className="flex justify-center space-x-2">
              {[5, 10, 25, maxQuantity].filter(val => val <= maxQuantity && val !== quantity).map((quickQty) => (
                <Button
                  key={quickQty}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quickQty)}
                  disabled={isLoading}
                  className="text-xs"
                >
                  {quickQty === maxQuantity ? 'Max' : quickQty}
                </Button>
              ))}
            </div>

            {/* Quantity Slider */}
            <div className="px-2">
              <input
                type="range"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                disabled={isLoading}
                className="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>1</span>
                <span>{maxQuantity}</span>
              </div>
            </div>
          </div>

          {/* Cost Breakdown - Dynamic Fees */}
          <div className="bg-pharmacy-green/5 dark:bg-pharmacy-green/10 p-4 rounded-lg space-y-3">
            <div className="flex items-center space-x-2 mb-3">
              <Calculator className="w-5 h-5 text-pharmacy-green" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">Cost Breakdown</h4>
              {isCalculatingFees && (
                <Loader2 className="w-4 h-4 animate-spin text-pharmacy-green" />
              )}
            </div>

            {feeCalculation ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    {quantity} × {formatCurrency(listing.unit_price)}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(feeCalculation.transaction_amount)}</span>
                </div>
                
                <div className="flex justify-between text-orange-600">
                  <span className="text-gray-600 dark:text-gray-300">
                    Your fee ({(feeCalculation.buyer_fee / feeCalculation.transaction_amount * 100).toFixed(1)}%)
                  </span>
                  <span className="font-medium">+{formatCurrency(feeCalculation.buyer_fee)}</span>
                </div>
                
                <div className="border-t border-gray-200 dark:border-slate-600 pt-2 flex justify-between text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">Total (From Your Wallet)</span>
                  <span className="text-pharmacy-green">
                    {formatCurrency((feeCalculation.buyer_total || feeCalculation.transaction_amount + feeCalculation.buyer_fee))}
                  </span>
                </div>

                {/* Fee Breakdown Details */}
                {showAdvanced && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="bg-blue-50 p-2 rounded text-blue-800">
                        <p className="font-medium mb-1">💰 Wallet Transaction Breakdown:</p>
                        <div className="flex justify-between">
                          <span>From your wallet:</span>
                          <span>-{formatCurrency((feeCalculation.buyer_total || feeCalculation.transaction_amount + feeCalculation.buyer_fee))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Seller receives:</span>
                          <span>+{formatCurrency(feeCalculation.transaction_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fee from seller wallet:</span>
                          <span>-{formatCurrency(feeCalculation.seller_fee)}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-1 mt-1">
                          <span>Seller's final amount:</span>
                          <span>{formatCurrency(feeCalculation.net_amount)}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Platform collects total:</span>
                          <span>{formatCurrency(feeCalculation.platform_fee)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-pharmacy-green mr-2" />
                <span className="text-gray-600 dark:text-gray-300">Calculating fees...</span>
              </div>
            )}

            {/* Savings Indicator */}
            {urgency.label === 'Urgent' && (
              <div className="flex items-start space-x-2 mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded border-l-4 border-l-green-500 dark:border-l-green-400">
              <AlertTriangle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="text-xs text-green-700 dark:text-green-300">
                  <p className="font-medium">Great Deal!</p>
                  <p>This medication expires soon, offering significant savings over regular pharmacy prices.</p>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Options */}
          <div className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              disabled={isLoading}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Button>

            {showAdvanced && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isLoading}
                    placeholder="Any special instructions or requests for the seller..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-pharmacy-green focus:border-pharmacy-green bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {notes.length}/500 characters
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || !feeCalculation}
              className="flex-1 bg-pharmacy-green hover:bg-pharmacy-green/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating Request...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {listing.listing_type === 'trade' ? 'Request Trade' : 'Send Purchase Request'}
                </>
              )}
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-slate-600 pt-4">
            <p>
              • This is a purchase request. The seller must approve before the transaction is processed.
            </p>
            <p>
              • Platform fees are calculated dynamically based on current rates.
            </p>
            <p>
              • You can cancel this request before seller approval.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}