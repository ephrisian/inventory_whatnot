"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Category {
  id: string
  name: string
}

interface Fandom {
  id: string
  name: string
}

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
  categoryId?: string
  fandomId?: string
  category?: Category
  fandom?: Fandom
  sales: Array<{
    id: string
    platform: string
    soldPrice: number
    saleDate: string
  }>
  customerInterests: Array<{
    id: string
    customerName: string
    platform: string
    dateRequested: string
  }>
  createdAt: string
  updatedAt: string
}

export default function EditItemPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [fandoms, setFandoms] = useState<Fandom[]>([])
  const [item, setItem] = useState<Item | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cost: "",
    quantity: "",
    categoryId: "",
    fandomId: "",
    sku: "",
    notes: "",
    status: "IN_STOCK",
  })

  useEffect(() => {
    fetchItem()
    fetchCategories()
    fetchFandoms()
  }, [])

  const fetchItem = async () => {
    try {
      const response = await fetch(`/api/inventory/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setItem(data)
        setFormData({
          name: data.name,
          description: data.description || "",
          cost: data.cost.toString(),
          quantity: data.quantity.toString(),
          categoryId: data.categoryId || "",
          fandomId: data.fandomId || "",
          sku: data.sku || "",
          notes: data.notes || "",
          status: data.status,
        })
      } else {
        alert('Item not found')
        router.push('/inventory')
      }
    } catch (error) {
      console.error('Error fetching item:', error)
      alert('Error loading item')
    } finally {
      setFetching(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        cost: parseFloat(formData.cost),
        quantity: parseInt(formData.quantity),
        categoryId: formData.categoryId || undefined,
        fandomId: formData.fandomId || undefined,
        sku: formData.sku || undefined,
        notes: formData.notes || undefined,
        description: formData.description || undefined,
      }

      const response = await fetch(`/api/inventory/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push('/inventory')
      } else {
        const error = await response.json()
        alert(`Error updating item: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating item:', error)
      alert('Error updating item')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/inventory/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        router.push('/inventory')
      } else {
        const error = await response.json()
        alert(`Error deleting item: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Error deleting item')
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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

  if (fetching) {
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
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Item</h1>
            <p className="text-gray-600">Update item details</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/inventory/${params.id}`}>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => handleChange('sku', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.cost}
                      onChange={(e) => handleChange('cost', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.quantity}
                      onChange={(e) => handleChange('quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="IN_STOCK">In Stock</option>
                      <option value="RESERVED">Reserved</option>
                      <option value="NEEDS_RESTOCK">Needs Restock</option>
                      <option value="DISCONTINUED">Discontinued</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => handleChange('categoryId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fandom
                    </label>
                    <select
                      value={formData.fandomId}
                      onChange={(e) => handleChange('fandomId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a fandom</option>
                      {fandoms.map((fandom) => (
                        <option key={fandom.id} value={fandom.id}>
                          {fandom.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex space-x-4">
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Updating...' : 'Update Item'}
                  </Button>
                  <Link href="/inventory">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Item Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Current Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {item.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Value:</span>
                <span className="font-medium">{formatCurrency(item.totalValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="text-sm">{formatDate(item.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Updated:</span>
                <span className="text-sm">{formatDate(item.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Sales */}
          {item.sales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {item.sales.map((sale) => (
                    <div key={sale.id} className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium">{sale.platform}</div>
                        <div className="text-xs text-gray-500">{formatDate(sale.saleDate)}</div>
                      </div>
                      <div className="text-sm font-medium">{formatCurrency(sale.soldPrice)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Interests */}
          {item.customerInterests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Interest</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {item.customerInterests.map((interest) => (
                    <div key={interest.id} className="border-b pb-2 last:border-b-0">
                      <div className="text-sm font-medium">{interest.customerName}</div>
                      <div className="text-xs text-gray-500">
                        {interest.platform} • {formatDate(interest.dateRequested)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
