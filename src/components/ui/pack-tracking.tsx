"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Package, DollarSign, Edit2, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface PackSale {
  id: string
  soldPrice: number
  saleDate: string
  platform: string
  packNumber?: number
  notes?: string
  netProfit?: number
  costPerPack?: number
  shippingCost?: number
  materialsCost?: number
  platformFeePercent?: number
  platformFeeFlat?: number
}

interface Item {
  id: string
  name: string
  cost: number
  quantity: number
  packsPerBox?: number
  itemType?: string
}

interface PackTrackingProps {
  item: Item
  packSales: PackSale[]
  onAddPackSale: () => void
  onEditPackSale?: (packSale: PackSale) => void
  onDeletePackSale?: (packSaleId: string) => void
  onRefresh?: () => void
}

export function PackTracking({ item, packSales, onAddPackSale, onEditPackSale, onDeletePackSale, onRefresh }: PackTrackingProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (item.itemType !== 'box') {
    return null
  }

  const handleDeletePackSale = async (packSaleId: string) => {
    if (!onDeletePackSale) return
    
    try {
      setDeletingId(packSaleId)
      await onDeletePackSale(packSaleId)
      onRefresh?.()
    } catch (error) {
      console.error('Error deleting pack sale:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const totalPacksSold = packSales.length
  const totalPacksAvailable = (item.packsPerBox || 0) * item.quantity // Total packs from all boxes in stock
  const packsRemaining = totalPacksAvailable - totalPacksSold
  const totalRevenue = packSales.reduce((sum, sale) => sum + sale.soldPrice, 0)
  const avgPrice = totalPacksSold > 0 ? totalRevenue / totalPacksSold : 0
  const costPerPack = item.cost / (item.packsPerBox || 1)
  const totalCostOfSoldPacks = costPerPack * totalPacksSold
  const totalNetProfit = packSales.reduce((sum, sale) => sum + (sale.netProfit || 0), 0)
  const projectedTotalRevenue = avgPrice * totalPacksAvailable
  const projectedNetProfit = projectedTotalRevenue - (item.cost * item.quantity) // Total cost of all boxes

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pack Sales Tracking
          </CardTitle>
          <Button onClick={onAddPackSale} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Pack Sale
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Packs Sold</div>
            <div className="text-lg font-bold text-blue-900">
              {totalPacksSold} / {totalPacksAvailable}
            </div>
            <div className="text-xs text-gray-500">
              {item.quantity} boxes × {item.packsPerBox || 0} packs each
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Total Revenue</div>
            <div className="text-lg font-bold text-green-900">
              {formatCurrency(totalRevenue)}
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">Avg Pack Price</div>
            <div className="text-lg font-bold text-purple-900">
              {formatCurrency(avgPrice)}
            </div>
          </div>
          <div className={`p-3 rounded-lg ${totalNetProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <div className={`text-sm font-medium ${totalNetProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              Net Profit
            </div>
            <div className={`text-lg font-bold ${totalNetProfit >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
              {formatCurrency(totalNetProfit)}
            </div>
          </div>
        </div>

        {/* Projection */}
        {totalPacksSold > 0 && packsRemaining > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Projection (if remaining packs sell at avg price)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Projected Total Revenue: </span>
                <span className="font-medium">{formatCurrency(projectedTotalRevenue)}</span>
              </div>
              <div>
                <span className="text-gray-600">Projected Net Profit: </span>
                <span className={`font-medium ${projectedNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(projectedNetProfit)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Remaining Packs: </span>
                <span className="font-medium">{packsRemaining}</span>
              </div>
            </div>
          </div>
        )}

        {/* Pack Sales List */}
        {packSales.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Individual Pack Sales</h4>
            <div className="space-y-2">
              {packSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                      Pack #{sale.packNumber || '?'}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{formatCurrency(sale.soldPrice)}</div>
                      <div className="text-gray-500">{formatDate(sale.saleDate)} • {sale.platform}</div>
                      {sale.notes && (
                        <div className="text-gray-400 text-xs mt-1">{sale.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm">
                      <div className={`font-medium ${(sale.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {sale.netProfit ? formatCurrency(sale.netProfit) : 'N/A'}
                      </div>
                      <div className="text-gray-500">net profit</div>
                    </div>
                    <div className="flex gap-1">
                      {onEditPackSale && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditPackSale(sale)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                      {onDeletePackSale && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePackSale(sale.id)}
                          disabled={deletingId === sale.id}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {packSales.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div>No pack sales recorded yet</div>
            <div className="text-sm">Start tracking individual pack sales from this box</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
