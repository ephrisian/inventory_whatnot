"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Package, ShoppingCart } from "lucide-react"
import { useEffect, useState } from "react"

interface Alert {
  id: string
  type: "low_stock" | "restock_needed" | "high_interest"
  message: string
  itemName: string
  quantity?: number
  priority: "high" | "medium" | "low"
}

export function InventoryAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('/api/dashboard')
        if (response.ok) {
          const data = await response.json()
          setAlerts(data.alerts || [])
        } else {
          console.error('Failed to fetch inventory alerts')
          setAlerts([])
        }
      } catch (error) {
        console.error('Error fetching inventory alerts:', error)
        setAlerts([])
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
  }, [])

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "low_stock":
      case "restock_needed":
        return Package
      case "high_interest":
        return ShoppingCart
      default:
        return AlertTriangle
    }
  }

  const getAlertColor = (priority: Alert["priority"]) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200"
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-3 rounded-lg border animate-pulse">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <span>Inventory Alerts</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = getAlertIcon(alert.type)
            return (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${getAlertColor(alert.priority)}`}
              >
                <div className="flex items-start space-x-3">
                  <Icon className="h-5 w-5 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {alert.itemName}
                    </p>
                    <p className="text-sm opacity-75">
                      {alert.message}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs">
                    Action
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" className="w-full">
            View All Alerts
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
