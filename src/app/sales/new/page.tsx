"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Calculator } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

interface Item {
  id: string
  name: string
  cost: number
  quantity: number
}

const PLATFORMS = [
  { value: 'WHATNOT', label: 'Whatnot', feePercent: 12.0, feeFlat: 0.30 },
  { value: 'EBAY', label: 'eBay', feePercent: 10.0, feeFlat: 0.30 },
  { value: 'PAYPAL', label: 'PayPal G&S', feePercent: 3.49, feeFlat: 0.49 },
  { value: 'DISCORD', label: 'Discord', feePercent: 0, feeFlat: 0 },
  { value: 'INSTAGRAM', label: 'Instagram', feePercent: 0, feeFlat: 0 },
  { value: 'OTHER', label: 'Other', feePercent: 0, feeFlat: 0 },
]

export default function NewSalePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  
  const [formData, setFormData] = useState({
    itemId: "",
    platform: "",
    soldPrice: "",
    shippingCost: "0",
    materialsCost: "0",
    platformFeePercent: "0",
    platformFeeFlat: "0",
    notes: "",
  })

  const [calculations, setCalculations] = useState({
    platformFeeTotal: 0,
    breakEvenPrice: 0,
    netProfit: 0,
  })

  useEffect(() => {
    fetchItems()
  }, [])

  useEffect(() => {
    calculateProfits()
  }, [formData, selectedItem])

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/inventory?limit=100')
      if (response.ok) {
        const data = await response.json()
        setItems(data.items.filter((item: Item) => item.quantity > 0))
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const calculateProfits = () => {
    if (!selectedItem) return

    const soldPrice = parseFloat(formData.soldPrice) || 0
    const shippingCost = parseFloat(formData.shippingCost) || 0
    const materialsCost = parseFloat(formData.materialsCost) || 0
    const platformFeePercent = parseFloat(formData.platformFeePercent) || 0
    const platformFeeFlat = parseFloat(formData.platformFeeFlat) || 0

    const platformFeeTotal = (soldPrice * platformFeePercent / 100) + platformFeeFlat
    const breakEvenPrice = selectedItem.cost + shippingCost + materialsCost + platformFeeTotal
    const netProfit = soldPrice - selectedItem.cost - shippingCost - materialsCost - platformFeeTotal

    setCalculations({
      platformFeeTotal,
      breakEvenPrice,
      netProfit,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return

    setLoading(true)

    try {
      const payload = {
        itemId: formData.itemId,
        platform: formData.platform,
        soldPrice: parseFloat(formData.soldPrice),
        shippingCost: parseFloat(formData.shippingCost),
        materialsCost: parseFloat(formData.materialsCost),
        platformFeePercent: parseFloat(formData.platformFeePercent),
        platformFeeFlat: parseFloat(formData.platformFeeFlat),
        notes: formData.notes || undefined,
        saleDate: new Date().toISOString(),
        platformFeeTotal: calculations.platformFeeTotal,
        breakEvenPrice: calculations.breakEvenPrice,
        netProfit: calculations.netProfit,
      }

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push('/sales')
      } else {
        const error = await response.json()
        alert(`Error recording sale: ${error.error}`)
      }
    } catch (error) {
      console.error('Error recording sale:', error)
      alert('Error recording sale')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (field === 'itemId') {
      const item = items.find(i => i.id === value)
      setSelectedItem(item || null)
    }

    if (field === 'platform') {
      const platform = PLATFORMS.find(p => p.value === value)
      if (platform) {
        setFormData(prev => ({
          ...prev,
          platformFeePercent: platform.feePercent.toString(),
          platformFeeFlat: platform.feeFlat.toString(),
        }))
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/sales">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sales
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Record New Sale</h1>
          <p className="text-gray-600">Log a sale and calculate profit</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Sale Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Sold *
                    </label>
                    <select
                      required
                      value={formData.itemId}
                      onChange={(e) => handleChange('itemId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select an item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Qty: {item.quantity}, Cost: {formatCurrency(item.cost)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform *
                    </label>
                    <select
                      required
                      value={formData.platform}
                      onChange={(e) => handleChange('platform', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select platform</option>
                      {PLATFORMS.map((platform) => (
                        <option key={platform.value} value={platform.value}>
                          {platform.label} ({platform.feePercent}% + {formatCurrency(platform.feeFlat)})
                        </option>
                      ))}
                    </select>
                  </div>

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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform Fee %
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.platformFeePercent}
                      onChange={(e) => handleChange('platformFeePercent', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform Flat Fee
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.platformFeeFlat}
                      onChange={(e) => handleChange('platformFeeFlat', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes about the sale"
                  />
                </div>

                <div className="flex space-x-4">
                  <Button type="submit" disabled={loading || !selectedItem}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Recording...' : 'Record Sale'}
                  </Button>
                  <Link href="/sales">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Profit Calculator</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedItem ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Item: {selectedItem.name}</h4>
                    <div className="text-sm text-gray-600">
                      Cost: {formatCurrency(selectedItem.cost)}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Platform Fee Total:</span>
                      <span className="font-medium">{formatCurrency(calculations.platformFeeTotal)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Break-even Price:</span>
                      <span className="font-medium">{formatCurrency(calculations.breakEvenPrice)}</span>
                    </div>
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">Net Profit:</span>
                        <span className={`font-bold text-lg ${
                          calculations.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(calculations.netProfit)}
                        </span>
                      </div>
                    </div>

                    {calculations.netProfit < 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-700">
                          ⚠️ This sale would result in a loss!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Select an item to see profit calculations
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
