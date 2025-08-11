"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Trash2, DollarSign, TrendingUp, Users } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Item {
  id: string
  name: string
  description?: string
  cost: number
  quantity: number
  totalValue: number
  status: string
  sku?: string
  notes?: string
  category?: { name: string }
  fandom?: { name: string }
  sales: Array<{
    id: string
    platform: string
    soldPrice: number
    netProfit: number
    saleDate: string
    notes?: string
  }>
  customerInterests: Array<{
    id: string
    customerName: string
    username?: string
    platform: string
    interestLevel: string
    followupStatus: string
    dateRequested: string
    notes?: string
  }>
  createdAt: string
  updatedAt: string
}

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchItem()
  }, [])

  const fetchItem = async () => {
    try {
      const response = await fetch(`/api/inventory/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setItem(data)
      } else {
        console.error('Item not found')
      }
    } catch (error) {
      console.error('Error fetching item:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return 'bg-green-100 text-green-800'
      case 'SOLD':
        return 'bg-gray-100 text-gray-800'
      case 'RESERVED':
        return 'bg-yellow-100 text-yellow-800'
      case 'NEEDS_RESTOCK':
        return 'bg-red-100 text-red-800'
      case 'DISCONTINUED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getInterestLevelColor = (level: string) => {
    switch (level) {
      case 'HOT':
        return 'bg-red-100 text-red-800'
      case 'WARM':
        return 'bg-yellow-100 text-yellow-800'
      case 'COLD':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getFollowupStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING':
        return 'bg-yellow-100 text-yellow-800'
      case 'RESPONDED':
        return 'bg-blue-100 text-blue-800'
      case 'ORDERED':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const totalSalesValue = item?.sales.reduce((sum, sale) => sum + sale.soldPrice, 0) || 0
  const totalProfit = item?.sales.reduce((sum, sale) => sum + sale.netProfit, 0) || 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/inventory">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Loading...</h1>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">Item not found</div>
          <Link href="/inventory">
            <Button>Back to Inventory</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/inventory">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{item.name}</h1>
            <div className="flex items-center space-x-4 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {formatStatus(item.status)}
              </span>
              {item.sku && (
                <span className="text-sm text-gray-500">SKU: {item.sku}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/inventory/${params.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.description && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Cost</div>
                  <div className="text-lg font-semibold">{formatCurrency(item.cost)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Quantity</div>
                  <div className="text-lg font-semibold">{item.quantity}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Value</div>
                  <div className="text-lg font-semibold">{formatCurrency(item.totalValue)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Sales Count</div>
                  <div className="text-lg font-semibold">{item.sales.length}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {item.category && (
                  <div>
                    <div className="text-sm text-gray-500">Category</div>
                    <div className="font-medium">{item.category.name}</div>
                  </div>
                )}
                {item.fandom && (
                  <div>
                    <div className="text-sm text-gray-500">Fandom</div>
                    <div className="font-medium">{item.fandom.name}</div>
                  </div>
                )}
              </div>

              {item.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <p className="text-gray-600">{item.notes}</p>
                </div>
              )}

              <div className="text-sm text-gray-500 border-t pt-4">
                Created: {formatDate(item.createdAt)} • Updated: {formatDate(item.updatedAt)}
              </div>
            </CardContent>
          </Card>

          {/* Sales History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Sales History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {item.sales.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No sales recorded for this item
                </div>
              ) : (
                <div className="space-y-4">
                  {item.sales.map((sale) => (
                    <div key={sale.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{sale.platform}</div>
                          <div className="text-sm text-gray-500">{formatDate(sale.saleDate)}</div>
                          {sale.notes && (
                            <div className="text-sm text-gray-600 mt-1">{sale.notes}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(sale.soldPrice)}</div>
                          <div className={`text-sm ${
                            sale.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            Profit: {formatCurrency(sale.netProfit)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Interests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Customer Interest</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {item.customerInterests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No customer interest recorded
                </div>
              ) : (
                <div className="space-y-4">
                  {item.customerInterests.map((interest) => (
                    <div key={interest.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{interest.customerName}</div>
                          {interest.username && (
                            <div className="text-sm text-gray-500">@{interest.username}</div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getInterestLevelColor(interest.interestLevel)}`}>
                            {interest.interestLevel}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFollowupStatusColor(interest.followupStatus)}`}>
                            {formatStatus(interest.followupStatus)}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {interest.platform} • {formatDate(interest.dateRequested)}
                      </div>
                      {interest.notes && (
                        <div className="text-sm text-gray-600 mt-2">{interest.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalProfit)}</div>
                <div className="text-sm text-gray-500">Total Profit</div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Sales Value:</span>
                <span className="font-medium">{formatCurrency(totalSalesValue)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Sale Price:</span>
                <span className="font-medium">
                  {item.sales.length > 0 
                    ? formatCurrency(totalSalesValue / item.sales.length)
                    : formatCurrency(0)
                  }
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Interest Level:</span>
                <span className="font-medium">{item.customerInterests.length} customers</span>
              </div>

              {item.quantity <= 5 && item.quantity > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-sm text-yellow-800">
                    ⚠️ Low stock alert!
                  </div>
                </div>
              )}

              {item.quantity === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-sm text-red-800">
                    🚨 Out of stock!
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/sales/new?item=${params.id}`}>
                <Button className="w-full" variant="outline">
                  Record Sale
                </Button>
              </Link>
              <Link href={`/interests/new?item=${params.id}`}>
                <Button className="w-full" variant="outline">
                  Add Customer Interest
                </Button>
              </Link>
              <Link href={`/inventory/${params.id}/edit`}>
                <Button className="w-full" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Item
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
