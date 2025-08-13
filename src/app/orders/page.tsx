"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Edit, Trash2, Package, Truck, CheckCircle, XCircle, Clock, Filter } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from '@/components/ui/toast'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'
import { useSearchParams } from "next/navigation"

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
  }
  items: Array<{
    id: string
    quantity: number
    costPerUnit: number
    totalCost: number
    item: {
      id: string
      name: string
      sku: string | null
    }
  }>
}

interface Vendor {
  id: string
  name: string
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ORDERED':
      return <Clock className="h-4 w-4" />
    case 'IN_TRANSIT':
      return <Truck className="h-4 w-4" />
    case 'ARRIVED':
      return <CheckCircle className="h-4 w-4" />
    case 'CANCELLED':
      return <XCircle className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ORDERED':
      return 'bg-blue-100 text-blue-800'
    case 'IN_TRANSIT':
      return 'bg-yellow-100 text-yellow-800'
    case 'ARRIVED':
      return 'bg-green-100 text-green-800'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<VendorOrder[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [vendorFilter, setVendorFilter] = useState("")
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    order: VendorOrder | null
  }>({ isOpen: false, order: null })
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  
  const { addToast } = useToast()
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchOrders()
    fetchVendors()
    
    // Set vendor filter from URL params
    const vendorParam = searchParams.get('vendor')
    if (vendorParam) {
      setVendorFilter(vendorParam)
    }
  }, [searchParams])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/vendor-orders')
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
      addToast({
        type: 'error',
        title: 'Failed to load orders',
        message: 'There was an error loading order data',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors')
      if (response.ok) {
        const data = await response.json()
        setVendors(data)
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/vendor-orders/${orderId}`, {
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
          message: 'Item quantities have been automatically updated',
          duration: 5000
        })
      }

      await fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      addToast({
        type: 'error',
        title: 'Failed to update order',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 5000
      })
    }
  }

  const handleDeleteClick = (order: VendorOrder) => {
    setDeleteModal({ isOpen: true, order })
  }

  const handleDeleteConfirm = async () => {
    const order = deleteModal.order
    if (!order) return

    setDeleteLoading(order.id)
    
    try {
      const response = await fetch(`/api/vendor-orders/${order.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      addToast({
        type: 'success',
        title: 'Order deleted successfully',
        message: `Order ${order.orderNumber || order.id} has been removed`,
        duration: 3000
      })
      
      await fetchOrders()
    } catch (error) {
      console.error('Failed to delete order:', error)
      addToast({
        type: 'error',
        title: 'Failed to delete order',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 5000
      })
    } finally {
      setDeleteLoading(null)
      setDeleteModal({ isOpen: false, order: null })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, order: null })
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.orderNumber && order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.items.some(item => item.item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = !statusFilter || order.status === statusFilter
    const matchesVendor = !vendorFilter || order.vendor.id === vendorFilter
    
    return matchesSearch && matchesStatus && matchesVendor
  })

  const clearFilters = () => {
    setStatusFilter("")
    setVendorFilter("")
    setSearchTerm("")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading vendor orders...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Orders</h1>
          <p className="text-muted-foreground">
            Manage purchase orders and track inventory restocks
          </p>
        </div>
        <Link href="/orders/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Order
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status === 'IN_TRANSIT').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arrived</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status === 'ARRIVED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(orders.reduce((sum, order) => sum + (order.totalCost || 0), 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search orders, vendors, or items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="ORDERED">Ordered</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="ARRIVED">Arrived</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Vendors</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
              {(statusFilter || vendorFilter || searchTerm) && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order List</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {orders.length === 0 ? 'No orders found. Create your first order to get started.' : 'No orders match your current filters.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Order</th>
                    <th className="text-left p-4">Vendor</th>
                    <th className="text-left p-4">Items</th>
                    <th className="text-left p-4">Total Cost</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium">
                          {order.orderNumber || `Order #${order.id.slice(-8)}`}
                        </div>
                        {order.notes && (
                          <div className="text-sm text-gray-500 mt-1">
                            {order.notes}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <Link 
                          href={`/vendors/${order.vendor.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {order.vendor.name}
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {order.items.slice(0, 2).map((item) => (
                            <div key={item.id} className="text-sm">
                              <Link 
                                href={`/inventory/${item.item.id}`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {item.item.name}
                              </Link>
                              <span className="text-gray-500 ml-2">
                                × {item.quantity} @ {formatCurrency(item.costPerUnit)}
                              </span>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className="text-sm text-gray-500">
                              +{order.items.length - 2} more items
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">
                          {order.totalCost ? formatCurrency(order.totalCost) : '-'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {order.status.replace('_', ' ')}
                          </span>
                          {order.status !== 'ARRIVED' && order.status !== 'CANCELLED' && (
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                              className="text-xs border rounded px-2 py-1"
                            >
                              <option value="ORDERED">Ordered</option>
                              <option value="IN_TRANSIT">In Transit</option>
                              <option value="ARRIVED">Arrived</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {formatDate(order.orderDate)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                          <Link href={`/orders/${order.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(order)}
                            disabled={deleteLoading === order.id}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
        itemName={deleteModal.order?.orderNumber || 'this order'}
        isLoading={deleteLoading !== null}
      />
    </div>
  )
}
