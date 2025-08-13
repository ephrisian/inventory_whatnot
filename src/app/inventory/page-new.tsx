"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Download, Trash2, GripVertical, Eye, EyeOff, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
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
  whatnotPrice?: number
  discordPrice?: number
  ebayPrice?: number
  otherPrice?: number
}

interface ColumnConfig {
  key: string
  label: string
  visible: boolean
  sortable: boolean
  width?: number
}

type SortConfig = {
  key: string
  direction: 'asc' | 'desc'
} | null

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Name', visible: true, sortable: true },
  { key: 'manufacturer', label: 'Manufacturer', visible: true, sortable: true },
  { key: 'fandom', label: 'Fandom', visible: true, sortable: true },
  { key: 'cost', label: 'Cost', visible: true, sortable: true },
  { key: 'quantity', label: 'Quantity', visible: true, sortable: true },
  { key: 'retailPrice', label: 'Retail Price', visible: true, sortable: true },
  { key: 'netRevenue', label: 'Net Revenue', visible: true, sortable: true },
  { key: 'totalValue', label: 'Total Value', visible: true, sortable: true },
  { key: 'status', label: 'Status', visible: true, sortable: true },
  { key: 'updatedAt', label: 'Last Updated', visible: true, sortable: true },
  { key: 'sku', label: 'SKU', visible: false, sortable: true },
  { key: 'category', label: 'Category', visible: false, sortable: true },
]

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
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
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    item: Item | null
  }>({ isOpen: false, item: null })
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  
  const { addToast } = useToast()
  const { settings: adminSettings } = useAdminSettings()

  // Save columns to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('inventory-columns', JSON.stringify(columns))
    }
  }, [columns])

  // Fetch items
  const fetchItems = async () => {
    try {
      const response = await fetch('/api/inventory')
      if (!response.ok) {
        throw new Error('Failed to fetch items')
      }
      const data = await response.json()
      setItems(data)
    } catch (error) {
      console.error('Error fetching items:', error)
      addToast({
        type: 'error',
        title: 'Failed to load inventory',
        message: 'There was an error loading your inventory items',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  // Column management
  const toggleColumnVisibility = (columnKey: string) => {
    setColumns(prev => prev.map(col => 
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    ))
  }

  const resetColumns = () => {
    setColumns(DEFAULT_COLUMNS)
  }

  // Sorting
  const handleSort = (columnKey: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key: columnKey, direction })
  }

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />
  }

  // Delete functionality
  const handleDeleteClick = (item: Item) => {
    setDeleteModal({ isOpen: true, item })
  }

  const handleDeleteConfirm = async () => {
    const item = deleteModal.item
    if (!item) return

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

      if (adminSettings.enableDeletionNotifications) {
        addToast({
          type: 'success',
          title: 'Item deleted successfully',
          message: `"${item.name}" has been removed from inventory`,
          duration: adminSettings.deletionNotificationDuration
        })
      }
      
      await fetchItems()
    } catch (error) {
      console.error('Failed to delete item:', error)
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

  // Data processing
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.manufacturer && item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortConfig) return 0

    const aValue = getCellValue(a, sortConfig.key)
    const bValue = getCellValue(b, sortConfig.key)

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const getCellValue = (item: Item, columnKey: string): any => {
    switch (columnKey) {
      case 'name': return item.name
      case 'manufacturer': return item.manufacturer || ''
      case 'fandom': return item.fandom?.name || ''
      case 'cost': return item.cost
      case 'quantity': return item.quantity
      case 'retailPrice': return getRetailPrice(item)
      case 'netRevenue': return getNetRevenue(item)
      case 'totalValue': return item.totalValue
      case 'status': return item.status
      case 'updatedAt': return item.updatedAt
      case 'sku': return item.sku || ''
      case 'category': return item.category?.name || ''
      default: return ''
    }
  }

  const getRetailPrice = (item: Item): number => {
    return item.whatnotPrice || 0
  }

  const getNetRevenue = (item: Item): number => {
    const retailPrice = getRetailPrice(item)
    const platformFee = retailPrice * 0.15 // 15% WhatNot fee
    return retailPrice - platformFee - item.cost
  }

  const renderCellContent = (item: Item, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return (
          <div className="font-medium">
            <Link href={`/inventory/${item.id}`} className="text-blue-600 hover:text-blue-800">
              {item.name}
            </Link>
            {item.description && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {item.description}
              </div>
            )}
          </div>
        )
      case 'manufacturer':
        return item.manufacturer || '-'
      case 'fandom':
        return item.fandom?.name || '-'
      case 'cost':
        return formatCurrency(item.cost)
      case 'quantity':
        return item.quantity
      case 'retailPrice':
        return formatCurrency(getRetailPrice(item))
      case 'netRevenue':
        const netRevenue = getNetRevenue(item)
        return (
          <span className={netRevenue >= 0 ? 'text-green-600' : 'text-red-600'}>
            {formatCurrency(netRevenue)}
          </span>
        )
      case 'totalValue':
        return formatCurrency(item.totalValue)
      case 'status':
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
            {formatStatus(item.status)}
          </span>
        )
      case 'updatedAt':
        return formatDate(item.updatedAt)
      case 'sku':
        return item.sku || '-'
      case 'category':
        return item.category?.name || '-'
      default:
        return '-'
    }
  }

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

  const visibleColumns = columns.filter(col => col.visible)

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
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(items.reduce((sum, item) => sum + (item.totalValue || 0), 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {items.filter(item => item.status === 'IN_STOCK').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {items.filter(item => item.status === 'LOW_STOCK').length}
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {visibleColumns.map((column) => (
                    <th key={column.key} className="px-6 py-3 text-left">
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          {column.sortable ? (
                            <button
                              onClick={() => handleSort(column.key)}
                              className="flex items-center gap-1 font-medium text-gray-900 hover:text-gray-700"
                            >
                              {column.label}
                              {getSortIcon(column.key)}
                            </button>
                          ) : (
                            <span className="font-medium text-gray-900">{column.label}</span>
                          )}
                        </div>
                        
                        {/* Column Options Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {column.sortable && (
                              <>
                                <DropdownMenuItem onClick={() => handleSort(column.key)}>
                                  <ArrowUp className="h-4 w-4 mr-2" />
                                  Sort Ascending
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSort(column.key)}>
                                  <ArrowDown className="h-4 w-4 mr-2" />
                                  Sort Descending
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => toggleColumnVisibility(column.key)}>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Hide Column
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <div className="px-2 py-1 text-xs font-medium text-gray-500">Show/Hide Columns</div>
                            {columns.map((col) => (
                              <DropdownMenuCheckboxItem
                                key={col.key}
                                checked={col.visible}
                                onCheckedChange={() => toggleColumnVisibility(col.key)}
                              >
                                {col.label}
                              </DropdownMenuCheckboxItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={resetColumns}>
                              Reset Columns
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {visibleColumns.map((column) => (
                      <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                        {renderCellContent(item, column.key)}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/inventory/${item.id}/edit`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(item)}
                          disabled={deleteLoading === item.id}
                        >
                          {deleteLoading === item.id ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {sortedItems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">No items found</div>
                {searchTerm && (
                  <div className="text-gray-400 text-sm mt-1">
                    Try adjusting your search terms
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        itemName={deleteModal.item?.name}
        isLoading={deleteLoading !== null}
      />
    </div>
  )
}
