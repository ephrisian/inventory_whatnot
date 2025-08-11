"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Package, TrendingUp, AlertTriangle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useEffect, useState } from "react"

interface Stats {
  totalInventoryValue: number
  totalProfit: number
  itemsInStock: number
  lowStockAlerts: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    totalInventoryValue: 0,
    totalProfit: 0,
    itemsInStock: 0,
    lowStockAlerts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard')
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
        } else {
          console.error('Failed to fetch dashboard stats')
          // Fallback to empty stats
          setStats({
            totalInventoryValue: 0,
            totalProfit: 0,
            itemsInStock: 0,
            lowStockAlerts: 0,
          })
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        // Fallback to empty stats
        setStats({
          totalInventoryValue: 0,
          totalProfit: 0,
          itemsInStock: 0,
          lowStockAlerts: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: "Total Inventory Value",
      value: formatCurrency(stats.totalInventoryValue),
      icon: Package,
      description: "Current inventory worth",
      color: "text-blue-600",
    },
    {
      title: "Total Profit",
      value: formatCurrency(stats.totalProfit),
      icon: DollarSign,
      description: "All-time profit",
      color: "text-green-600",
    },
    {
      title: "Items in Stock",
      value: stats.itemsInStock.toString(),
      icon: TrendingUp,
      description: "Available items",
      color: "text-purple-600",
    },
    {
      title: "Low Stock Alerts",
      value: stats.lowStockAlerts.toString(),
      icon: AlertTriangle,
      description: "Items need restocking",
      color: "text-red-600",
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
