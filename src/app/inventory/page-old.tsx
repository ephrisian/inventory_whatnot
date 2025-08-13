"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Download, Trash2, Settings, GripVertical, Eye, EyeOff, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from '@/components/ui/toast'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'
import { useAdminSettings } from '@/hooks/useAdminSettings'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"

interface Item {
  id: string
  name: string
  description?: string
  cost: number
  quantity: number
  totalValue: number
  status: string
  sku?: string
  manufacturer?: string
  category?: { name: string }
  fandom?: { name: string }
  updatedAt: string
}

interface ColumnConfig {
  key: string
  label: string
  visible: boolean
  order: number
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'item', label: 'Item', visible: true, order: 0 },
  { key: 'cost', label: 'Cost', visible: true, order: 1 },
  { key: 'retailPrice', label: 'Retail Price', visible: true, order: 2 },
  { key: 'netRevenue', label: 'Net Revenue', visible: true, order: 3 },
  { key: 'packPrice', label: 'Pack Price', visible: true, order: 4 },
  { key: 'quantity', label: 'Quantity', visible: true, order: 5 },
  { key: 'manufacturer', label: 'Manufacturer', visible: true, order: 6 },
  { key: 'status', label: 'Status', visible: true, order: 7 },
  { key: 'sku', label: 'SKU', visible: false, order: 8 },
  { key: 'category', label: 'Category', visible: false, order: 9 },
  { key: 'actions', label: 'Actions', visible: true, order: 10 }
]

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    item: Item | null
  }>({ isOpen: false, item: null })
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    // Load from localStorage or use defaults
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('inventory-columns')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse saved columns:', e)
        }
      }
    }
    return DEFAULT_COLUMNS
  })
  
  const { addToast } = useToast()
  const { settings: adminSettings } = useAdminSettings()

  // Save columns to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('inventory-columns', JSON.stringify(columns))
    }
  }, [columns])

  // Get visible columns in order
  const visibleColumns = columns
    .filter(col => col.visible)
    .sort((a, b) => a.order - b.order)

  // Column management functions
  const toggleColumnVisibility = (columnKey: string) => {
    setColumns(prev => prev.map(col => 
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    ))
  }

  const moveColumn = (columnKey: string, direction: 'up' | 'down') => {
    setColumns(prev => {
      const newColumns = [...prev]
      const colIndex = newColumns.findIndex(col => col.key === columnKey)
      if (colIndex === -1) return prev

      if (direction === 'up' && colIndex > 0) {
        const temp = newColumns[colIndex].order
        newColumns[colIndex].order = newColumns[colIndex - 1].order
        newColumns[colIndex - 1].order = temp
      } else if (direction === 'down' && colIndex < newColumns.length - 1) {
        const temp = newColumns[colIndex].order
        newColumns[colIndex].order = newColumns[colIndex + 1].order
        newColumns[colIndex + 1].order = temp
      }

      return newColumns
    })
  }

  const resetColumns = () => {
    setColumns(DEFAULT_COLUMNS)
  }

  // Calculate net revenue (WhatNot price after fees minus cost)
  const calculateNetRevenue = (item: Item) => {
    const whatnotPrice = (item as any).whatnotPrice
    if (!whatnotPrice || !item.cost) return 0
    return (whatnotPrice * 0.89) - item.cost // 11% WhatNot fee
  }

  // Render cell content based on column key
  const renderCell = (item: Item, columnKey: string) => {
    switch (columnKey) {
      case 'item':
        return (
          <div>
            <div className="font-medium text-gray-900">{item.name}</div>
            {item.description && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {item.description}
              </div>
            )}
          </div>
        )
      case 'sku':
        return <span className="text-sm text-gray-600">{item.sku || '-'}</span>
      case 'category':
        return (
          <div className="text-sm text-gray-600">
            {item.category?.name || '-'}
            {item.fandom && (
              <div className="text-xs text-gray-400">{item.fandom.name}</div>
            )}
          </div>
        )
      case 'manufacturer':
        return <span className="text-sm text-gray-600">{item.manufacturer || '-'}</span>
      case 'cost':
        return <span className="text-sm text-gray-900">{formatCurrency(item.cost)}</span>
      case 'retailPrice':
        return <span className="text-sm text-gray-900">{(item as any).retailPrice ? formatCurrency((item as any).retailPrice) : formatCurrency(item.cost * 1.3)}</span>
      case 'netRevenue':
        const netRevenue = calculateNetRevenue(item)
        return <span className={`text-sm font-medium ${netRevenue > 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netRevenue)}</span>
      case 'packPrice':
        return <span className="text-sm text-gray-900">{(item as any).packPrice ? formatCurrency((item as any).packPrice) : '-'}</span>
      case 'quantity':
        return <span className="text-sm text-gray-900">{item.quantity}</span>
      case 'status':
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
            {formatStatus(item.status)}
          </span>
        )
      case 'actions':
        return (
          <div className="flex space-x-2">
            <Link href={`/inventory/${item.id}`}>
              <Button size="sm" variant="outline">View</Button>
            </Link>
            <Link href={`/inventory/${item.id}/edit`}>
              <Button size="sm" variant="outline">Edit</Button>
            </Link>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleDeleteClick(item)}
              disabled={deleteLoading === item.id}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      default:
        return '-'
    }
  }

  useEffect(() => {
    console.log('🏗️ Inventory page mounted, fetching items...')
    fetchItems()
  }, [])

    const fetchItems = async () => {
    console.log('🔄 Fetching items from API...')
    try {
      setLoading(true)
      const response = await fetch('/api/inventory')
      console.log('📡 Fetch response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Received ${data.length} items from API`)
        console.log('📊 Items data preview:', data.slice(0, 3).map((item: any) => ({ 
          id: item.id, 
          name: item.name, 
          cost: item.cost,
          quantity: item.quantity,
          createdAt: item.createdAt
        })))
        setItems(data)
      } else {
        console.error('❌ Failed to fetch items, status:', response.status)
        const errorText = await response.text()
        console.error('❌ Error response:', errorText)
      }
    } catch (error) {
      console.error('❌ Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

    const handleDeleteClick = (item: Item) => {
    setDeleteModal({ isOpen: true, item })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.item) return
    
    const item = deleteModal.item
    console.log('🗑️ Deleting item:', item.name)
    
    setDeleteLoading(item.id)
    
    try {
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      // Show success toast if notifications are enabled
      if (adminSettings.enableDeletionNotifications) {
        addToast({
          type: 'success',
          title: 'Item deleted successfully',
          message: `"${item.name}" has been removed from inventory`,
          duration: adminSettings.deletionNotificationDuration
        })
      }

      console.log('✅ Item deleted successfully')
      
      // Refresh the items list
      await fetchItems()
    } catch (error) {
      console.error('❌ Failed to delete item:', error)
      
      // Always show error toasts regardless of settings
      addToast({
        type: 'error',
        title: 'Failed to delete item',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 5000
      })
    } finally {
      setDeleteLoading(null)
      setDeleteModal({ isOpen: false, item: null })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, item: null })
  }

  const filteredItems = (items || []).filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  console.log('🔍 Rendering inventory page with:', {
    totalItems: items?.length || 0,
    filteredItems: filteredItems.length,
    searchTerm,
    loading
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return 'bg-green-100 text-green-800'
      case 'LOW_STOCK':
        return 'bg-yellow-100 text-yellow-800'
      case 'OUT_OF_STOCK':
        return 'bg-red-100 text-red-800'
      case 'SOLD':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading inventory...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-1">Manage your collectible items</p>
        </div>
        <Link href="/inventory/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(items || []).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency((items || []).reduce((sum, item) => sum + (item.totalValue || 0), 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(items || []).filter(item => item.status === 'IN_STOCK').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(items || []).filter(item => item.status === 'LOW_STOCK').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => setShowColumnSettings(!showColumnSettings)}
              >
                <Settings className="h-4 w-4" />
                Columns
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Column Settings Panel */}
      {showColumnSettings && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Column Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Customize Columns</h4>
                <Button variant="outline" size="sm" onClick={resetColumns}>
                  Reset to Default
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {columns.sort((a, b) => a.order - b.order).map((column) => (
                  <div key={column.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleColumnVisibility(column.key)}
                        className="flex items-center gap-2"
                      >
                        {column.visible ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={column.visible ? 'text-gray-900' : 'text-gray-400'}>
                          {column.label}
                        </span>
                      </button>
                    </div>
                    
                    {column.key !== 'actions' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveColumn(column.key, 'up')}
                          disabled={column.order === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveColumn(column.key, 'down')}
                          disabled={column.order === columns.length - 1}
                        >
                          ↓
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="text-sm text-gray-600">
                Click the eye icon to show/hide columns. Use arrows to reorder columns.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {visibleColumns.map((column) => (
                    <th key={column.key} className="text-left py-3 px-4 font-medium text-gray-900">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    {visibleColumns.map((column) => (
                      <td key={column.key} className="py-3 px-4">
                        {renderCell(item, column.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No items found matching your search.' : 'No items found. Add some items to get started.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone. If this item has sales or customer interests, they will also be removed."
        itemName={deleteModal.item?.name}
        isLoading={deleteLoading !== null}
      />
    </div>
  )
}
