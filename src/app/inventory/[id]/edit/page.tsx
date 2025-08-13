"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from '@/components/ui/toast'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'
import { useAdminSettings } from '@/hooks/useAdminSettings'

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
  location?: string
  categoryId?: string
  fandomId?: string
  manufacturer?: string
  itemType?: string
  packsPerBox?: number
  marketPrice?: number
  ebayPrice?: number
  whatnotPrice?: number
  discordPrice?: number
  otherPrice?: number
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

export default function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [fandoms, setFandoms] = useState<Fandom[]>([])
  const [item, setItem] = useState<Item | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAdditionalPlatforms, setShowAdditionalPlatforms] = useState(false)
  
  const { addToast } = useToast()
  const { settings } = useAdminSettings()
  
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    cost: "",
    quantity: "",
    categoryId: "",
    fandomId: "",
    manufacturer: "",
    description: "",
    notes: "",
    location: "",
    ebayPrice: "",
    whatnotPrice: "",
    discordPrice: "",
    otherPrice: "",
    itemType: "single",
    packsPerBox: "1",
    marketPrice: "",
    status: "IN_STOCK",
  })

  const fetchItem = useCallback(async () => {
    try {
      const response = await fetch(`/api/inventory/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setItem(data)
        setFormData({
          name: data.name,
          sku: data.sku || "",
          cost: data.cost.toString(),
          quantity: data.quantity.toString(),
          categoryId: data.categoryId || "",
          fandomId: data.fandomId || "",
          manufacturer: data.manufacturer || "",
          description: data.description || "",
          notes: data.notes || "",
          location: data.location || "",
          ebayPrice: data.ebayPrice ? data.ebayPrice.toString() : "",
          whatnotPrice: data.whatnotPrice ? data.whatnotPrice.toString() : "",
          discordPrice: data.discordPrice ? data.discordPrice.toString() : "",
          otherPrice: data.otherPrice ? data.otherPrice.toString() : "",
          itemType: data.itemType || "single",
          packsPerBox: data.packsPerBox ? data.packsPerBox.toString() : "1",
          marketPrice: data.marketPrice ? data.marketPrice.toString() : "",
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
  }, [resolvedParams.id, router])

  useEffect(() => {
    fetchItem()
    fetchCategories()
    fetchFandoms()
  }, [fetchItem])

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
    console.log('🚀 Form submission started')
    console.log('📝 Form data:', JSON.stringify(formData, null, 2))
    setLoading(true)

    try {
      const payload = {
        name: formData.name,
        sku: formData.sku || null,
        cost: parseFloat(formData.cost),
        quantity: parseInt(formData.quantity),
        categoryId: formData.categoryId || null,
        fandomId: formData.fandomId || null,
        manufacturer: formData.manufacturer || null,
        description: formData.description || null,
        notes: formData.notes || null,
        location: formData.location || null,
        itemType: formData.itemType,
        packsPerBox: parseInt(formData.packsPerBox) || 1,
        marketPrice: formData.marketPrice ? parseFloat(formData.marketPrice) : null,
        ebayPrice: formData.ebayPrice ? parseFloat(formData.ebayPrice) : null,
        whatnotPrice: formData.whatnotPrice ? parseFloat(formData.whatnotPrice) : null,
        discordPrice: formData.discordPrice ? parseFloat(formData.discordPrice) : null,
        otherPrice: formData.otherPrice ? parseFloat(formData.otherPrice) : null,
        status: formData.status,
      }

      console.log('📦 Payload to API:', JSON.stringify(payload, null, 2))

      const response = await fetch(`/api/inventory/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      console.log('📡 API Response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Item updated successfully:', result)
        addToast({
          type: 'success',
          title: 'Item Updated',
          message: `${formData.name} has been updated successfully.`,
          duration: 3000
        })
        console.log('🔄 Redirecting to inventory page...')
        router.push('/inventory')
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Unknown error occurred'
        
        console.error('API Error:', errorData)
        addToast({
          type: 'error',
          title: 'Update Failed',
          message: `Error updating item: ${errorMessage}`,
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error updating item:', error)
      const errorMessage = error instanceof Error ? error.message : 'Network or connection error'
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: `Error updating item: ${errorMessage}`,
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/inventory/${resolvedParams.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const result = await response.json()
        
        // Show toast notification if enabled in admin settings
        if (settings?.enableDeletionNotifications) {
          addToast({
            type: 'success',
            title: 'Item Deleted',
            message: `${item?.name || 'Item'} has been deleted successfully.`,
            duration: settings.deletionNotificationDuration || 5000
          })
        }
        
        console.log('✅ Item deleted successfully:', result)
        router.push('/inventory')
      } else {
        const error = await response.json()
        addToast({
          type: 'error',
          title: 'Delete Failed',
          message: `Error deleting item: ${error.error}`,
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Error deleting item. Please try again.',
        duration: 5000
      })
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Auto-calculate WhatNot price when cost changes
      if (field === 'cost' && value && parseFloat(value) > 0) {
        const cost = parseFloat(value)
        const retailPrice = cost * 1.3 // 30% markup
        // Set WhatNot price to retail price by default
        updated.whatnotPrice = retailPrice.toFixed(2)
      }
      
      return updated
    })
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
            <h1 className="text-3xl font-bold text-foreground">Loading...</h1>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
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
          <div className="text-muted-foreground text-lg mb-2">Item not found</div>
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
            <h1 className="text-3xl font-bold text-foreground">Edit Item</h1>
            <p className="text-muted-foreground">Update item details</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/inventory/${resolvedParams.id}`}>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>
          <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
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
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter item name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => handleChange('sku', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Auto-generated if left empty"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
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
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Item Type
                    </label>
                    <select
                      value={formData.itemType}
                      onChange={(e) => handleChange('itemType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="single">Single Item</option>
                      <option value="pack">Pack</option>
                      <option value="box">Box</option>
                    </select>
                  </div>

                  {formData.itemType === 'box' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Packs per Box
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.packsPerBox}
                        onChange={(e) => handleChange('packsPerBox', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
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

                  {/* Auto-calculated pricing preview */}
                  {formData.cost && parseFloat(formData.cost) > 0 && (
                    <div className="bg-accent/20 p-4 rounded-lg">
                      <h4 className="font-medium text-accent-foreground mb-2">Auto-calculated Pricing (30% markup)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Retail: </span>
                          <span className="font-medium">${(parseFloat(formData.cost) * 1.3).toFixed(2)}</span>
                        </div>
                        {formData.itemType === 'pack' && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Pack Price: </span>
                              <span className="font-medium">${(parseFloat(formData.cost) * 1.3).toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Group (5+): </span>
                              <span className="font-medium">${(parseFloat(formData.cost) * 1.3 * 0.9).toFixed(2)}</span>
                            </div>
                          </>
                        )}
                        {formData.itemType === 'box' && formData.packsPerBox && parseInt(formData.packsPerBox) > 1 && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Pack Price: </span>
                              <span className="font-medium">${(parseFloat(formData.cost) / parseInt(formData.packsPerBox) * 1.3).toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Group (5+): </span>
                              <span className="font-medium">${(parseFloat(formData.cost) / parseInt(formData.packsPerBox) * 1.3 * 0.9).toFixed(2)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Platform Pricing Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-foreground border-b pb-2">Platform Pricing</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAdditionalPlatforms(!showAdditionalPlatforms)}
                    >
                      {showAdditionalPlatforms ? 'Hide' : 'Show'} Additional Platforms
                    </Button>
                  </div>
                  
                  {/* Primary WhatNot Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        WhatNot Price (before 11% fee)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.whatnotPrice}
                        onChange={(e) => handleChange('whatnotPrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Auto-calculated from cost + 30% markup"
                      />
                      {formData.whatnotPrice && formData.cost && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Net profit: ${(parseFloat(formData.whatnotPrice) * 0.89 - parseFloat(formData.cost)).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Additional Platforms (Hidden by default) */}
                  {showAdditionalPlatforms && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          eBay Price (before 13% fee)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.ebayPrice}
                          onChange={(e) => handleChange('ebayPrice', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                        {formData.ebayPrice && formData.cost && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Net profit: ${(parseFloat(formData.ebayPrice) * 0.87 - parseFloat(formData.cost)).toFixed(2)}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Discord/Direct Sale Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.discordPrice}
                          onChange={(e) => handleChange('discordPrice', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                        {formData.discordPrice && formData.cost && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Net profit: ${(parseFloat(formData.discordPrice) - parseFloat(formData.cost)).toFixed(2)}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Other Platform Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.otherPrice}
                          onChange={(e) => handleChange('otherPrice', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                        {formData.otherPrice && formData.cost && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Net profit: ${(parseFloat(formData.otherPrice) - parseFloat(formData.cost)).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.quantity}
                      onChange={(e) => handleChange('quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
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
                    <label className="block text-sm font-medium text-foreground mb-2">
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

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      value={formData.manufacturer}
                      onChange={(e) => handleChange('manufacturer', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Kayou, Kakawow, Lorcana, Aniplex"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter item description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes"
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
                <span className="text-muted-foreground">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {item.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Value:</span>
                <span className="font-medium">{formatCurrency(item.totalValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span className="text-sm">{formatDate(item.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated:</span>
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
                        <div className="text-xs text-muted-foreground">{formatDate(sale.saleDate)}</div>
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
                      <div className="text-xs text-muted-foreground">
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        itemName={item?.name || 'this item'}
      />
    </div>
  )
}
