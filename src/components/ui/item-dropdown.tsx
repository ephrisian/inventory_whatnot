"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, X, Check, ChevronDown } from "lucide-react"
import { useToast } from "@/components/ui/toast"

interface ItemOption {
  id: string
  name: string
  sku: string | null
  cost: number
  quantity: number
  category?: { id: string; name: string }
  fandom?: { id: string; name: string }
}

interface CategoryOption {
  id: string
  name: string
}

interface FandomOption {
  id: string
  name: string
}

interface ItemDropdownProps {
  label: string
  value: string
  onChange: (value: string) => void
  items: ItemOption[]
  categories: CategoryOption[]
  fandoms: FandomOption[]
  onRefresh: () => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function ItemDropdown({
  label,
  value,
  onChange,
  items,
  categories,
  fandoms,
  onRefresh,
  placeholder = "Select an item",
  required = false,
  disabled = false,
  className = ""
}: ItemDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  const [newItemData, setNewItemData] = useState({
    name: "",
    cost: "",
    quantity: "1",
    categoryId: "",
    fandomId: "",
    sku: "",
  })
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsCreating(false)
        setSearchTerm("")
        resetNewItemForm()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus input when creating
  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isCreating])

  const selectedItem = items.find(item => item.id === value)

  const filteredItems = items.filter(item => {
    if (!searchTerm) return true
    return (
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.category?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.fandom?.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })

  const resetNewItemForm = () => {
    setNewItemData({
      name: "",
      cost: "",
      quantity: "1",
      categoryId: "",
      fandomId: "",
      sku: "",
    })
  }

  const handleCreateNew = async () => {
    if (!newItemData.name.trim() || !newItemData.cost) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in item name and cost',
        duration: 5000
      })
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: newItemData.name.trim(),
        cost: parseFloat(newItemData.cost),
        quantity: parseInt(newItemData.quantity) || 1,
        categoryId: newItemData.categoryId || null,
        fandomId: newItemData.fandomId || null,
        sku: newItemData.sku.trim() || null,
        status: 'IN_STOCK'
      }

      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const newItem = await response.json()
        addToast({
          type: 'success',
          title: 'Item created',
          message: `"${newItemData.name}" has been created`,
          duration: 3000
        })
        
        // Refresh the items
        await onRefresh()
        
        // Select the new item
        onChange(newItem.id)
        
        // Reset state
        resetNewItemForm()
        setIsCreating(false)
        setIsOpen(false)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create item')
      }
    } catch (error) {
      console.error('Error creating item:', error)
      addToast({
        type: 'error',
        title: 'Failed to create item',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNewItemChange = (field: string, value: string) => {
    setNewItemData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-left flex items-center justify-between ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
        }`}
      >
        <span className={selectedItem ? 'text-gray-900' : 'text-gray-500'}>
          {selectedItem ? (
            <span>
              {selectedItem.name} 
              {selectedItem.sku && ` (${selectedItem.sku})`}
              <span className="text-gray-500 ml-2">- Stock: {selectedItem.quantity}</span>
            </span>
          ) : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {/* Clear selection option */}
            {!required && (
              <button
                type="button"
                onClick={() => {
                  onChange("")
                  setIsOpen(false)
                  setSearchTerm("")
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-gray-500"
              >
                <em>Clear selection</em>
              </button>
            )}

            {/* Existing items */}
            {filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item.id)
                  setIsOpen(false)
                  setSearchTerm("")
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between ${
                  item.id === value ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">
                    {item.sku && `SKU: ${item.sku} • `}
                    Stock: {item.quantity} • Cost: ${item.cost.toFixed(2)}
                    {item.category && ` • ${item.category.name}`}
                    {item.fandom && ` • ${item.fandom.name}`}
                  </div>
                </div>
                {item.id === value && <Check className="h-4 w-4 ml-2" />}
              </button>
            ))}

            {filteredItems.length === 0 && searchTerm && (
              <div className="px-3 py-2 text-sm text-gray-500 italic">
                No items found matching "{searchTerm}"
              </div>
            )}
          </div>

          {/* Add new section */}
          <div className="border-t bg-gray-50">
            {isCreating ? (
              <div className="p-3 space-y-3">
                <div className="text-sm font-medium text-gray-700">Create New Item</div>
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newItemData.name}
                    onChange={(e) => handleNewItemChange('name', e.target.value)}
                    placeholder="Item name *"
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={newItemData.sku}
                    onChange={(e) => handleNewItemChange('sku', e.target.value)}
                    placeholder="SKU (optional)"
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItemData.cost}
                    onChange={(e) => handleNewItemChange('cost', e.target.value)}
                    placeholder="Cost *"
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    min="1"
                    value={newItemData.quantity}
                    onChange={(e) => handleNewItemChange('quantity', e.target.value)}
                    placeholder="Quantity"
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newItemData.categoryId}
                    onChange={(e) => handleNewItemChange('categoryId', e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newItemData.fandomId}
                    onChange={(e) => handleNewItemChange('fandomId', e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select fandom</option>
                    {fandoms.map((fandom) => (
                      <option key={fandom.id} value={fandom.id}>
                        {fandom.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsCreating(false)
                      resetNewItemForm()
                    }}
                    className="h-7 px-2"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateNew}
                    disabled={!newItemData.name.trim() || !newItemData.cost || loading}
                    className="h-7 px-2"
                  >
                    {loading ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent mr-1" />
                    ) : (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    Create
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
              >
                <Plus className="h-3 w-3" />
                Add new item
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
