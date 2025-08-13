"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { useToast } from '@/components/ui/toast'
import { DynamicDropdown } from '@/components/ui/dynamic-dropdown'
import { ItemDropdown } from '@/components/ui/item-dropdown'

interface Vendor {
  id: string
  name: string
}

interface Item {
  id: string
  name: string
  sku: string | null
  cost: number
  quantity: number
  category?: { id: string; name: string }
  fandom?: { id: string; name: string }
}

interface Category {
  id: string
  name: string
}

interface Fandom {
  id: string
  name: string
}

interface OrderItem {
  itemId: string
  quantity: number
  costPerUnit: number
  item?: Item
}

export default function NewOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [fandoms, setFandoms] = useState<Fandom[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  
  const [formData, setFormData] = useState({
    vendorId: "",
    orderNumber: "",
    notes: "",
  })

  const { addToast } = useToast()

  useEffect(() => {
    fetchVendors()
    fetchItems()
    fetchCategories()
    fetchFandoms()
  }, [])

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

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/inventory')
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchFandoms = async () => {
    try {
      const response = await fetch('/api/fandoms')
      if (response.ok) {
        const data = await response.json()
        setFandoms(data)
      }
    } catch (error) {
      console.error('Error fetching fandoms:', error)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addOrderItem = () => {
    setOrderItems(prev => [...prev, {
      itemId: "",
      quantity: 1,
      costPerUnit: 0
    }])
  }

  const removeOrderItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateOrderItem = (index: number, field: string, value: string | number) => {
    setOrderItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updated = { ...item, [field]: value }
        
        // Auto-populate cost when item is selected
        if (field === 'itemId' && value) {
          const selectedItem = items.find(item => item.id === value)
          if (selectedItem) {
            updated.costPerUnit = selectedItem.cost
            updated.item = selectedItem
          }
        }
        
        return updated
      }
      return item
    }))
  }

  const getTotalCost = () => {
    return orderItems.reduce((sum, item) => {
      return sum + (item.quantity * item.costPerUnit)
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.vendorId) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a vendor',
        duration: 5000
      })
      return
    }

    if (orderItems.length === 0) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please add at least one item',
        duration: 5000
      })
      return
    }

    if (orderItems.some(item => !item.itemId || item.quantity <= 0 || item.costPerUnit <= 0)) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all item details with valid values',
        duration: 5000
      })
      return
    }

    setLoading(true)

    try {
      const payload = {
        vendorId: formData.vendorId,
        orderNumber: formData.orderNumber || null,
        notes: formData.notes || null,
        orderDate: new Date().toISOString(),
        status: 'ORDERED',
        items: orderItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          costPerUnit: item.costPerUnit
        }))
      }

      const response = await fetch('/api/vendor-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Order created',
          message: 'Vendor order has been created successfully',
          duration: 3000
        })
        router.push('/orders')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create order')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      addToast({
        type: 'error',
        title: 'Failed to create order',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Vendor Order</h1>
          <p className="text-muted-foreground">
            Create a new purchase order for inventory restocking
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicDropdown
                label="Vendor"
                value={formData.vendorId}
                onChange={(value) => handleChange('vendorId', value)}
                options={vendors}
                onRefresh={fetchVendors}
                placeholder="Select a vendor"
                required
                createApiEndpoint="/api/vendors"
                deleteApiEndpoint="/api/vendors"
                displayField="name"
                searchFields={["name", "contactInfo"]}
                allowDelete={true}
              />

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Order Number
                </label>
                <input
                  type="text"
                  value={formData.orderNumber}
                  onChange={(e) => handleChange('orderNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional order reference"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Notes
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes about this order..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Order Items</CardTitle>
            <Button type="button" onClick={addOrderItem} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            {orderItems.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                    No items added yet. Click &quot;Add Item&quot; to get started.
                  </div>
            ) : (
              <div className="space-y-4">
                {orderItems.map((orderItem, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                      <div className="md:col-span-2">
                        <ItemDropdown
                          label="Item"
                          value={orderItem.itemId}
                          onChange={(value) => updateOrderItem(index, 'itemId', value)}
                          items={items}
                          onRefresh={fetchItems}
                          placeholder="Select or create an item"
                          categories={categories}
                          fandoms={fandoms}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={orderItem.quantity}
                          onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Cost Per Unit *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={orderItem.costPerUnit}
                          onChange={(e) => updateOrderItem(index, 'costPerUnit', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                          Total: {formatCurrency(orderItem.quantity * orderItem.costPerUnit)}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOrderItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Order Total:</span>
                    <span>{formatCurrency(getTotalCost())}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/orders">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading || orderItems.length === 0}>
            {loading ? 'Creating Order...' : 'Create Order'}
          </Button>
        </div>
      </form>
    </div>
  )
}
