"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Package, Clock, Truck, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from '@/components/ui/toast'

interface OrderItem {
  id: string
  quantity: number
  costPerUnit: number
  totalCost: number
  item: {
    id: string
    name: string
    sku: string | null
    quantity: number
  }
}

interface VendorOrder {
  id: string
  orderNumber: string | null
  orderDate: string
  status: 'ORDERED' | 'IN_TRANSIT' | 'ARRIVED' | 'CANCELLED'
  totalCost: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
  vendor: {
    id: string
    name: string
    contactInfo: string | null
    website: string | null
  }
  items: OrderItem[]
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ORDERED':
      return <Clock className="h-5 w-5" />
    case 'IN_TRANSIT':
      return <Truck className="h-5 w-5" />
    case 'ARRIVED':
      return <CheckCircle className="h-5 w-5" />
    case 'CANCELLED':
      return <XCircle className="h-5 w-5" />
    default:
      return <Clock className="h-5 w-5" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ORDERED':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'IN_TRANSIT':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'ARRIVED':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [order, setOrder] = useState<VendorOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  
  const { addToast } = useToast()

  useEffect(() => {
    fetchOrder()
  }, [])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/vendor-orders/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
      } else {
        addToast({
          type: 'error',
          title: 'Order not found',
          message: 'The requested order could not be found',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      addToast({
        type: 'error',
        title: 'Failed to load order',
        message: 'There was an error loading the order details',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return
    
    setUpdating(true)
    
    try {
      const response = await fetch(`/api/vendor-orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      addToast({
        type: 'success',
        title: 'Order updated',
        message: `Order status changed to ${newStatus.toLowerCase().replace('_', ' ')}`,
        duration: 3000
      })

      if (newStatus === 'ARRIVED') {
        addToast({
          type: 'success',
          title: 'Inventory updated',
          message: 'Item quantities have been automatically incremented',
          duration: 5000
        })
      }

      await fetchOrder()
    } catch (error) {
      console.error('Error updating order status:', error)
      addToast({
        type: 'error',
        title: 'Failed to update order',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 5000
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading order details...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-lg font-medium">Order not found</div>
        <Link href="/orders" className="mt-4">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {order.orderNumber || `Order #${order.id.slice(-8)}`}
            </h1>
            <p className="text-muted-foreground">
              Order placed on {formatDate(order.orderDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/orders/${order.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="font-medium">
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                
                {order.status !== 'ARRIVED' && order.status !== 'CANCELLED' && (
                  <div className="flex gap-2">
                    {order.status === 'ORDERED' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusUpdate('IN_TRANSIT')}
                        disabled={updating}
                      >
                        Mark In Transit
                      </Button>
                    )}
                    {(order.status === 'ORDERED' || order.status === 'IN_TRANSIT') && (
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusUpdate('ARRIVED')}
                        disabled={updating}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Mark Arrived
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              {order.status === 'ARRIVED' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Order completed - Inventory quantities have been updated
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <Link 
                        href={`/inventory/${item.item.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {item.item.name}
                      </Link>
                      {item.item.sku && (
                        <div className="text-sm text-gray-500">
                          SKU: {item.item.sku}
                        </div>
                      )}
                      <div className="text-sm text-gray-500">
                        Current stock: {item.item.quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {item.quantity} × {formatCurrency(item.costPerUnit)}
                      </div>
                      <div className="text-sm text-gray-500">
                        = {formatCurrency(item.totalCost)}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Cost:</span>
                    <span>{formatCurrency(order.totalCost || 0)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Vendor Info */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Link 
                  href={`/vendors/${order.vendor.id}`}
                  className="text-lg font-medium text-blue-600 hover:text-blue-800"
                >
                  {order.vendor.name}
                </Link>
              </div>
              
              {order.vendor.contactInfo && (
                <div>
                  <div className="text-sm font-medium text-gray-700">Contact</div>
                  <div className="text-sm text-gray-600">{order.vendor.contactInfo}</div>
                </div>
              )}
              
              {order.vendor.website && (
                <div>
                  <a 
                    href={order.vendor.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Visit Website
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Items:</span>
                <span className="text-sm font-medium">{order.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Quantity:</span>
                <span className="text-sm font-medium">
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Order Date:</span>
                <span className="text-sm font-medium">{formatDate(order.orderDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Last Updated:</span>
                <span className="text-sm font-medium">{formatDate(order.updatedAt)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-medium">Total Cost:</span>
                  <span className="font-medium">{formatCurrency(order.totalCost || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
