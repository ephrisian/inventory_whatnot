"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, DollarSign } from 'lucide-react'

interface PackSaleModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PackSaleData) => void
  parentItem: {
    id: string
    name: string
    cost: number
    packsPerBox?: number
  }
  packNumber?: number
  editingSale?: PackSaleData & { id: string } // Add support for editing
}

interface PackSaleData {
  soldPrice: number
  platform: string
  shippingCost: number
  materialsCost: number
  platformFeePercent: number
  platformFeeFlat?: number  // Add flat fee
  notes: string
  packNumber?: number
}

export function PackSaleModal({ isOpen, onClose, onSubmit, parentItem, packNumber, editingSale }: PackSaleModalProps) {
  const [formData, setFormData] = useState({
    soldPrice: editingSale?.soldPrice?.toString() || '',
    platform: editingSale?.platform || 'WHATNOT',
    shippingCost: editingSale?.shippingCost?.toString() || '0',
    materialsCost: editingSale?.materialsCost?.toString() || '0',
    platformFeePercent: editingSale?.platformFeePercent?.toString() || '15',
    notes: editingSale?.notes || '',
  })
  
  const [loading, setLoading] = useState(false)

  // Get platform defaults
  const getPlatformDefaults = (platform: string) => {
    switch (platform) {
      case 'WHATNOT':
        return { feePercent: '11', feeFlat: '0.30' }
      case 'EBAY':
        return { feePercent: '13', feeFlat: '0.30' }
      case 'PAYPAL':
        return { feePercent: '3.49', feeFlat: '0.49' }
      default:
        return { feePercent: '0', feeFlat: '0' }
    }
  }

  // Update form when editingSale changes
  useEffect(() => {
    if (editingSale) {
      setFormData({
        soldPrice: editingSale.soldPrice?.toString() || '',
        platform: editingSale.platform || 'WHATNOT',
        shippingCost: editingSale.shippingCost?.toString() || '0',
        materialsCost: editingSale.materialsCost?.toString() || '0',
        platformFeePercent: editingSale.platformFeePercent?.toString() || getPlatformDefaults(editingSale.platform || 'WHATNOT').feePercent,
        notes: editingSale.notes || '',
      })
    } else {
      // Reset to defaults when not editing
      const defaults = getPlatformDefaults('WHATNOT')
      setFormData({
        soldPrice: '',
        platform: 'WHATNOT',
        shippingCost: '0',
        materialsCost: '0',
        platformFeePercent: defaults.feePercent,
        notes: '',
      })
    }
  }, [editingSale])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data: PackSaleData = {
        soldPrice: parseFloat(formData.soldPrice),
        platform: formData.platform,
        shippingCost: parseFloat(formData.shippingCost) || 0,
        materialsCost: parseFloat(formData.materialsCost) || 0,
        platformFeePercent: parseFloat(formData.platformFeePercent) || 0,
        platformFeeFlat: platformFeeFlat,
        notes: formData.notes,
        packNumber: editingSale?.packNumber || packNumber,
      }

      await onSubmit(data)
      
      // Reset form only if not editing
      if (!editingSale) {
        const defaults = getPlatformDefaults('WHATNOT')
        setFormData({
          soldPrice: '',
          platform: 'WHATNOT',
          shippingCost: '0',
          materialsCost: '0',
          platformFeePercent: defaults.feePercent,
          notes: '',
        })
      }
      
      onClose()
    } catch (error) {
      console.error('Error submitting pack sale:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Auto-update platform fees when platform changes
      if (field === 'platform') {
        const defaults = getPlatformDefaults(value)
        newData.platformFeePercent = defaults.feePercent
      }
      
      return newData
    })
  }

  const costPerPack = parentItem.cost / (parentItem.packsPerBox || 1)
  const soldPrice = parseFloat(formData.soldPrice) || 0
  const platformFeePercent = parseFloat(formData.platformFeePercent) || 0
  const platformFeeFlat = formData.platform === 'WHATNOT' ? 0.30 : 
                          formData.platform === 'EBAY' ? 0.30 :
                          formData.platform === 'PAYPAL' ? 0.49 : 0
  const platformFee = (soldPrice * platformFeePercent / 100) + platformFeeFlat
  const shippingCost = parseFloat(formData.shippingCost) || 0
  const materialsCost = parseFloat(formData.materialsCost) || 0
  const netProfit = soldPrice - costPerPack - platformFee - shippingCost - materialsCost

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {editingSale ? 'Edit Pack Sale' : 'Record Pack Sale'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            <div>Item: {parentItem.name}</div>
            <div>Pack #{editingSale?.packNumber || packNumber || 'Auto-assigned'}</div>
            <div>Cost per pack: ${costPerPack.toFixed(2)}</div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sold Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sold Price *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.soldPrice}
                onChange={(e) => handleChange('soldPrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            {/* Platform */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform
              </label>
              <select
                value={formData.platform}
                onChange={(e) => handleChange('platform', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="WHATNOT">WhatNot</option>
                <option value="EBAY">eBay</option>
                <option value="DISCORD">Discord</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Platform Fee Percent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Fee (%) - Auto-calculated
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.platformFeePercent}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                placeholder="15"
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.platform === 'WHATNOT' && 'WhatNot: 11% + $0.30'}
                {formData.platform === 'EBAY' && 'eBay: 13% + $0.30'}
                {formData.platform === 'PAYPAL' && 'PayPal: 3.49% + $0.49'}
                {!['WHATNOT', 'EBAY', 'PAYPAL'].includes(formData.platform) && 'Custom platform fees'}
              </div>
            </div>

            {/* Additional Costs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.shippingCost}
                  onChange={(e) => handleChange('shippingCost', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Materials Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.materialsCost}
                  onChange={(e) => handleChange('materialsCost', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional notes about this sale"
              />
            </div>

            {/* Profit Preview */}
            {soldPrice > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Profit Calculation</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Sold Price:</span>
                    <span>${soldPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Cost per Pack:</span>
                    <span>-${costPerPack.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Platform Fee ({formData.platformFeePercent}% + ${platformFeeFlat.toFixed(2)}):</span>
                    <span>-${platformFee.toFixed(2)}</span>
                  </div>
                  {shippingCost > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Shipping:</span>
                      <span>-${shippingCost.toFixed(2)}</span>
                    </div>
                  )}
                  {materialsCost > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Materials:</span>
                      <span>-${materialsCost.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-1 flex justify-between font-medium">
                    <span>Net Profit:</span>
                    <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${netProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading || !formData.soldPrice}>
                {loading ? (editingSale ? 'Updating...' : 'Recording...') : (editingSale ? 'Update Pack Sale' : 'Record Pack Sale')}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
