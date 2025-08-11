"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp, DollarSign } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Sale {
  id: string
  itemName: string
  platform: string
  soldPrice: number
  shippingCost: number
  materialsCost: number
  platformFeeTotal: number
  netProfit: number
  saleDate: string
  notes?: string
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProfit: 0,
    averageProfit: 0,
  })

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales?limit=50')
      const data = await response.json()
      setSales(data.sales || [])
      
      // Calculate stats
      const totalSales = data.sales?.length || 0
      const totalProfit = data.sales?.reduce((sum: number, sale: Sale) => sum + (sale.netProfit || 0), 0) || 0
      const averageProfit = totalSales > 0 ? totalProfit / totalSales : 0
      
      setStats({
        totalSales,
        totalProfit,
        averageProfit,
      })
    } catch (error) {
      console.error('Error fetching sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'WHATNOT':
        return 'bg-purple-100 text-purple-800'
      case 'EBAY':
        return 'bg-blue-100 text-blue-800'
      case 'PAYPAL':
        return 'bg-yellow-100 text-yellow-800'
      case 'DISCORD':
        return 'bg-indigo-100 text-indigo-800'
      case 'INSTAGRAM':
        return 'bg-pink-100 text-pink-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPlatform = (platform: string) => {
    return platform.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
            <p className="text-gray-600">Track your sales and profits</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-600">Track your sales and profits</p>
        </div>
        <Link href="/sales/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Record Sale
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Sales
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalSales}</div>
            <p className="text-xs text-gray-500 mt-1">Total transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Profit
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalProfit)}</div>
            <p className="text-xs text-gray-500 mt-1">All-time profit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Average Profit
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageProfit)}</div>
            <p className="text-xs text-gray-500 mt-1">Per sale average</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No sales recorded yet</div>
              <p className="text-gray-500 mb-4">
                Start by recording your first sale
              </p>
              <Link href="/sales/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Record First Sale
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Item</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Platform</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Sold Price</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Fees</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Net Profit</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{sale.itemName}</div>
                        {sale.notes && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {sale.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(sale.platform)}`}>
                          {formatPlatform(sale.platform)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {formatCurrency(sale.soldPrice)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatCurrency(sale.platformFeeTotal + sale.shippingCost + sale.materialsCost)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm font-medium ${
                          sale.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(sale.netProfit)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDate(sale.saleDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
