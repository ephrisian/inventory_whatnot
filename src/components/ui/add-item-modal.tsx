"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Save, X } from "lucide-react"

interface Category {
  id: string
  name: string
}

interface Fandom {
  id: string
  name: string
}

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddItemModal({ isOpen, onClose, onSuccess }: AddItemModalProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [fandoms, setFandoms] = useState<Fandom[]>([])
  const [showAdditionalPlatforms, setShowAdditionalPlatforms] = useState(false)
  
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
    marketPrice: ""
  })

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      fetchFandoms()
    }
  }, [isOpen])

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
      }

      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      if (response.ok) {
        // Reset form
        setFormData({
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
          marketPrice: ""
        })
        setShowAdditionalPlatforms(false)
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Unknown error occurred'
        alert(`Error creating item: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Error creating item:', error)
      const errorMessage = error instanceof Error ? error.message : 'Network or connection error'
      alert(`Error creating item: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Auto-calculate WhatNot price when cost changes
      if (field === 'cost' && value && parseFloat(value) > 0) {
        const cost = parseFloat(value)
        const retailPrice = cost * 1.3 // 30% markup
        updated.whatnotPrice = retailPrice.toFixed(2)
      }
      
      return updated
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-semibold text-gray-900">Add New Item</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="platform-switch" className="text-sm font-medium text-gray-700">
                  More Platforms
                </label>
                <Switch
                  id="platform-switch"
                  checked={showAdditionalPlatforms}
                  onCheckedChange={setShowAdditionalPlatforms}
                />
              </div>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter item name"
                />
              </div>

              {/* Cost, Quantity, Item Type, WhatNot Price, Packs Per Box in one row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.cost}
                    onChange={(e) => handleChange('cost', e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    required
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Type
                  </label>
                  <select
                    value={formData.itemType}
                    onChange={(e) => handleChange('itemType', e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="single">Single</option>
                    <option value="pack">Pack</option>
                    <option value="box">Box</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatNot Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="999"
                    value={formData.whatnotPrice}
                    onChange={(e) => handleChange('whatnotPrice', e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Auto"
                  />
                </div>

                {formData.itemType === 'box' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Packs/Box
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={formData.packsPerBox}
                      onChange={(e) => handleChange('packsPerBox', e.target.value)}
                      className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="1"
                    />
                  </div>
                ) : (
                  <div></div>
                )}
              </div>

              {/* SKU, Category, Fandom, Manufacturer in one row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => handleChange('sku', e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Auto-generated"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => handleChange('categoryId', e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fandom
                  </label>
                  <select
                    value={formData.fandomId}
                    onChange={(e) => handleChange('fandomId', e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select fandom</option>
                    {fandoms.map((fandom) => (
                      <option key={fandom.id} value={fandom.id}>
                        {fandom.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => handleChange('manufacturer', e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="e.g., Kayou, Kakawow"
                  />
                </div>
              </div>

              {/* Auto-calculated pricing preview */}
              {formData.cost && parseFloat(formData.cost) > 0 && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-2 text-sm">Auto-calculated Pricing (30% markup)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-blue-700">Retail: </span>
                      <span className="font-medium">${(parseFloat(formData.cost) * 1.3).toFixed(2)}</span>
                    </div>
                    {formData.itemType === 'pack' && (
                      <>
                        <div>
                          <span className="text-blue-700">Pack Price: </span>
                          <span className="font-medium">${(parseFloat(formData.cost) * 1.3).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Group (5+): </span>
                          <span className="font-medium">${(parseFloat(formData.cost) * 1.3 * 0.9).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    {formData.itemType === 'box' && formData.packsPerBox && parseInt(formData.packsPerBox) > 1 && (
                      <>
                        <div>
                          <span className="text-blue-700">Pack Price: </span>
                          <span className="font-medium">${(parseFloat(formData.cost) / parseInt(formData.packsPerBox) * 1.3).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Group (5+): </span>
                          <span className="font-medium">${(parseFloat(formData.cost) / parseInt(formData.packsPerBox) * 1.3 * 0.9).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Platform Pricing Section - only show if toggle is enabled */}
            {showAdditionalPlatforms && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Platform Pricing
                </h3>
              
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      eBay Price (before 13% fee)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="999"
                      value={formData.ebayPrice}
                      onChange={(e) => handleChange('ebayPrice', e.target.value)}
                      className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="0.00"
                    />
                    {formData.ebayPrice && formData.cost && (
                      <p className="text-xs text-gray-500 mt-1">
                        Net profit: ${(parseFloat(formData.ebayPrice) * 0.87 - parseFloat(formData.cost)).toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discord/Direct Sale Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="999"
                      value={formData.discordPrice}
                      onChange={(e) => handleChange('discordPrice', e.target.value)}
                      className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="0.00"
                    />
                    {formData.discordPrice && formData.cost && (
                      <p className="text-xs text-gray-500 mt-1">
                        Net profit: ${(parseFloat(formData.discordPrice) - parseFloat(formData.cost)).toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Other Platform Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="999"
                      value={formData.otherPrice}
                      onChange={(e) => handleChange('otherPrice', e.target.value)}
                      className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="0.00"
                    />
                    {formData.otherPrice && formData.cost && (
                      <p className="text-xs text-gray-500 mt-1">
                        Net profit: ${(parseFloat(formData.otherPrice) - parseFloat(formData.cost)).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter item description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Additional notes"
                />
              </div>
            </div>

            <div className="flex space-x-4 pt-4 border-t">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Item'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
