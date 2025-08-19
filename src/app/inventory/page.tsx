"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Download, Trash2, GripVertical, Eye, EyeOff, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from '@/components/ui/toast'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'
import { AddItemModal } from '@/components/ui/add-item-modal'
import { useAdminSettings } from '@/hooks/useAdminSettings'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

interface Item {
  id: string
  name: string
  description?: string | null
  cost: number
  quantity: number
  totalValue: number | null
  status: string
  sku?: string | null
  manufacturer?: string | null
  category?: { id: string; name: string } | null
  fandom?: { id: string; name: string } | null
  updatedAt: string
  whatnotPrice?: number | null
  discordPrice?: number | null
  ebayPrice?: number | null
  otherPrice?: number | null
  imageUrl?: string | null
  // Additional fields that might be returned by the API
  notes?: string | null
  location?: string | null
  itemType?: string | null
  packsPerBox?: number | null
  marketPrice?: number | null
  retailPrice?: number | null
  packPrice?: number | null
  packGroupPrice?: number | null
  ebayNetPrice?: number | null
  whatnotNetPrice?: number | null
  categoryId?: string | null
  fandomId?: string | null
  createdAt?: string
  packSales?: Array<{
    id: string
    soldPrice: number
    netProfit: number | null
    saleDate: string
  }>
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
  { key: 'manufacturer', label: 'Manufacturer', visible: false, sortable: true },
  { key: 'fandom', label: 'Fandom', visible: true, sortable: true },
  { key: 'cost', label: 'Cost', visible: true, sortable: true },
  { key: 'quantity', label: 'Quantity', visible: true, sortable: true },
  { key: 'retailPrice', label: 'Retail Price', visible: false, sortable: true },
  { key: 'netRevenue', label: 'Net Revenue / Investment', visible: true, sortable: true },
  { key: 'totalValue', label: 'Total Value', visible: false, sortable: true },
  { key: 'status', label: 'Status', visible: true, sortable: true },
  { key: 'updatedAt', label: 'Last Updated', visible: false, sortable: true },
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
  const [addItemModal, setAddItemModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    fandom: '',
    minCost: '',
    maxCost: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  
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

  // Export functionality
  const handleExport = () => {
    try {
      // Convert items to CSV format
      const headers = [
        'Name', 'Description', 'SKU', 'Manufacturer', 'Category', 'Fandom',
        'Cost', 'Quantity', 'Status', 'WhatNot Price', 'Discord Price', 
        'eBay Price', 'Other Price', 'Total Value', 'Image URL', 'Notes',
        'Location', 'Item Type', 'Packs Per Box', 'Created At', 'Updated At'
      ]
      
      const csvData = [
        headers.join(','),
        ...items.map(item => [
          `"${item.name || ''}"`,
          `"${item.description || ''}"`,
          `"${item.sku || ''}"`,
          `"${item.manufacturer || ''}"`,
          `"${item.category?.name || ''}"`,
          `"${item.fandom?.name || ''}"`,
          item.cost || 0,
          item.quantity || 0,
          `"${item.status || ''}"`,
          item.whatnotPrice || '',
          item.discordPrice || '',
          item.ebayPrice || '',
          item.otherPrice || '',
          item.totalValue || 0,
          `"${item.imageUrl || ''}"`,
          `"${item.notes || ''}"`,
          `"${item.location || ''}"`,
          `"${item.itemType || ''}"`,
          item.packsPerBox || '',
          `"${item.createdAt || ''}"`,
          `"${item.updatedAt || ''}"`
        ].join(','))
      ].join('\n')

      // Create and download CSV file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `inventory-export-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      addToast({
        type: 'success',
        title: 'Export successful',
        message: `Exported ${items.length} items to CSV`,
        duration: 3000
      })
    } catch (error) {
      console.error('Export failed:', error)
      addToast({
        type: 'error',
        title: 'Export failed',
        message: 'There was an error exporting your inventory',
        duration: 5000
      })
    }
  }

  // WhatNot-specific export functionality
  const handleWhatNotExport = () => {
    try {
      // WhatNot required headers
      const headers = [
        'Category', 'Sub Category', 'Title', 'Description', 'Quantity', 'Type', 'Price',
        'Shipping Profile', 'Offerable', 'Hazmat', 'Condition', 'Cost Per Item', 'SKU',
        'Image URL 1', 'Image URL 2', 'Image URL 3', 'Image URL 4', 'Image URL 5',
        'Image URL 6', 'Image URL 7', 'Image URL 8'
      ]
      
      const csvData = [
        headers.join('\t'), // WhatNot uses tab-separated values
        ...items.map(item => [
          // Category - use our category or default to Trading Card Games
          item.category?.name || 'Trading Card Games',
          // Sub Category - use fandom or manufacturer or default
          item.fandom?.name || item.manufacturer || 'General',
          // Title - item name
          item.name || '',
          // Description 
          item.description || item.name || '',
          // Quantity
          item.quantity || 0,
          // Type - default to Buy it Now
          'Buy it Now',
          // Price - use WhatNot price or calculated retail price
          item.whatnotPrice || getRetailPrice(item) || 0,
          // Shipping Profile - default
          '4-7 oz',
          // Offerable - default to FALSE
          'FALSE',
          // Hazmat - default to Not Hazmat
          'Not Hazmat',
          // Condition - determine from status or default to New
          getWhatNotCondition(item.status),
          // Cost Per Item
          item.cost || '',
          // SKU
          item.sku || '',
          // Image URLs (up to 8) - split imageUrl by comma or use single URL
          ...getImageUrls(item.imageUrl).slice(0, 8).concat(Array(8).fill('')).slice(0, 8)
        ].join('\t'))
      ].join('\n')

      // Create and download TSV file (tab-separated for WhatNot)
      const blob = new Blob([csvData], { type: 'text/tab-separated-values;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `whatnot-import-${new Date().toISOString().split('T')[0]}.tsv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      addToast({
        type: 'success',
        title: 'WhatNot export successful',
        message: `Exported ${items.length} items for WhatNot import`,
        duration: 3000
      })
    } catch (error) {
      console.error('WhatNot export failed:', error)
      addToast({
        type: 'error',
        title: 'WhatNot export failed',
        message: 'There was an error exporting for WhatNot',
        duration: 5000
      })
    }
  }

  // Helper function to determine WhatNot condition from status
  const getWhatNotCondition = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
      case 'LOW_STOCK':
        return 'New'
      case 'OUT_OF_STOCK':
        return 'New'
      case 'SOLD':
        return 'Used'
      default:
        return 'New'
    }
  }

  // Helper function to parse image URLs
  const getImageUrls = (imageUrl: string | null | undefined): string[] => {
    if (!imageUrl) return []
    // Split by comma, semicolon, or pipe and clean up
    return imageUrl.split(/[,;|]/).map(url => url.trim()).filter(url => url.length > 0)
  }

  // Filter functionality
  const clearFilters = () => {
    setFilters({
      status: '',
      category: '',
      fandom: '',
      minCost: '',
      maxCost: ''
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  // Get unique values for filter dropdowns
  const uniqueStatuses = [...new Set(items.map(item => item.status))].filter(Boolean)
  const uniqueCategories = [...new Set(items.map(item => item.category?.name))].filter(Boolean)
  const uniqueFandoms = [...new Set(items.map(item => item.fandom?.name))].filter(Boolean)

  // Bulk selection functionality
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev)
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId)
      } else {
        newSelection.add(itemId)
      }
      return newSelection
    })
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === sortedItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(sortedItems.map(item => item.id)))
    }
  }

  const clearSelection = () => {
    setSelectedItems(new Set())
  }

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedItems.size} selected items? This action cannot be undone.`)) {
      return
    }

    try {
      const deletePromises = Array.from(selectedItems).map(itemId =>
        fetch(`/api/inventory/${itemId}`, { method: 'DELETE' })
      )
      
      await Promise.all(deletePromises)
      
      addToast({
        type: 'success',
        title: 'Bulk delete successful',
        message: `Deleted ${selectedItems.size} items`,
        duration: 3000
      })
      
      setSelectedItems(new Set())
      await fetchItems()
    } catch (error) {
      console.error('Bulk delete failed:', error)
      addToast({
        type: 'error',
        title: 'Bulk delete failed',
        message: 'Some items could not be deleted',
        duration: 5000
      })
    }
  }

  // Helper functions for data processing
  const getCellValue = (item: Item, columnKey: string): any => {
    switch (columnKey) {
      case 'name': return item.name || ''
      case 'manufacturer': return item.manufacturer || ''
      case 'fandom': return item.fandom?.name || ''
      case 'cost': return item.cost || 0
      case 'quantity': return item.quantity || 0
      case 'retailPrice': return getRetailPrice(item)
      case 'netRevenue': return getNetRevenue(item)
      case 'totalValue': return item.totalValue || 0
      case 'status': return item.status || ''
      case 'updatedAt': return item.updatedAt || ''
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
    const netRevenuePerUnit = retailPrice - platformFee - item.cost
    const projectedNetRevenue = netRevenuePerUnit * item.quantity // Multiply by quantity for total inventory net revenue
    
    // Add actual pack sales profits/losses if any
    const packSalesProfit = item.packSales?.reduce((sum, sale) => sum + (sale.netProfit || 0), 0) || 0
    
    return projectedNetRevenue + packSalesProfit
  }

  // Data processing
  const filteredItems = items.filter(item => {
    // Text search
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.manufacturer && item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Status filter
    const matchesStatus = !filters.status || item.status === filters.status
    
    // Category filter
    const matchesCategory = !filters.category || item.category?.name === filters.category
    
    // Fandom filter
    const matchesFandom = !filters.fandom || item.fandom?.name === filters.fandom
    
    // Cost filters
    const matchesMinCost = !filters.minCost || item.cost >= parseFloat(filters.minCost)
    const matchesMaxCost = !filters.maxCost || item.cost <= parseFloat(filters.maxCost)
    
    return matchesSearch && matchesStatus && matchesCategory && matchesFandom && matchesMinCost && matchesMaxCost
  })

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortConfig) return 0

    const aValue = getCellValue(a, sortConfig.key)
    const bValue = getCellValue(b, sortConfig.key)

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const renderCellContent = (item: Item, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return (
          <div className="font-medium min-w-0">
            <Link href={`/inventory/${item.id}`} className="text-blue-600 hover:text-blue-800 block truncate">
              {item.name}
            </Link>
            {item.description && (
              <div className="text-sm text-gray-500 truncate max-w-[200px]">
                {item.description}
              </div>
            )}
          </div>
        )
      case 'manufacturer':
        return <span className="truncate block max-w-[120px]" title={item.manufacturer || '-'}>{item.manufacturer || '-'}</span>
      case 'fandom':
        return <span className="truncate block max-w-[120px]" title={item.fandom?.name || '-'}>{item.fandom?.name || '-'}</span>
      case 'cost':
        return <span className="font-mono text-sm">{formatCurrency(item.cost)}</span>
      case 'quantity':
        return <span className="font-mono text-sm">{item.quantity}</span>
      case 'retailPrice':
        return <span className="font-mono text-sm">{formatCurrency(getRetailPrice(item))}</span>
      case 'netRevenue':
        const netRevenue = getNetRevenue(item)
        const totalInvestment = item.cost * item.quantity
        return (
          <div className="text-right min-w-0">
            <div className={`font-medium font-mono text-sm ${netRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netRevenue)}
            </div>
            <div className="text-xs text-gray-500 font-mono">
              inv: {formatCurrency(totalInvestment)}
            </div>
          </div>
        )
      case 'totalValue':
        return <span className="font-mono text-sm">{formatCurrency(item.totalValue || 0)}</span>
      case 'status':
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusColor(item.status)}`}>
            {formatStatus(item.status)}
          </span>
        )
      case 'updatedAt':
        return <span className="text-sm text-gray-600 whitespace-nowrap">{formatDate(item.updatedAt)}</span>
      case 'sku':
        return <span className="font-mono text-sm truncate block max-w-[100px]" title={item.sku || '-'}>{item.sku || '-'}</span>
      case 'category':
        return <span className="truncate block max-w-[120px]" title={item.category?.name || '-'}>{item.category?.name || '-'}</span>
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
    <div className="p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-1">Manage your collectible items</p>
        </div>
        <Button 
          className="flex items-center gap-2 w-full sm:w-auto justify-center"
          onClick={() => setAddItemModal(true)}
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {formatCurrency(items.reduce((sum, item) => sum + (item.cost * item.quantity), 0))}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Cost of all inventory
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Net Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {formatCurrency(items.reduce((sum, item) => sum + getNetRevenue(item), 0))}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {(() => {
                const totalInvestment = items.reduce((sum, item) => sum + (item.cost * item.quantity), 0)
                const totalNetRevenue = items.reduce((sum, item) => sum + getNetRevenue(item), 0)
                const profitMargin = totalInvestment > 0 ? (totalNetRevenue / totalInvestment) * 100 : 0
                return `${profitMargin.toFixed(1)}% profit margin`
              })()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {items.filter(item => item.status === 'IN_STOCK').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {items.filter(item => item.status === 'LOW_STOCK').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search bar - full width on mobile */}
            <div className="w-full">
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
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant={hasActiveFilters ? "default" : "outline"} 
                className="flex items-center gap-2 justify-center sm:justify-start"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                Filter
                {hasActiveFilters && (
                  <span className="ml-1 bg-white text-blue-600 text-xs px-1.5 py-0.5 rounded-full">
                    {Object.values(filters).filter(v => v !== '').length}
                  </span>
                )}
              </Button>
              
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 justify-center sm:justify-start">
                    <Download className="h-4 w-4" />
                    Export
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleExport}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleWhatNotExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export for WhatNot
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filters</CardTitle>
              <div className="flex gap-2">
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowFilters(false)}>
                  Close
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {uniqueCategories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fandom Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fandom</label>
                <select
                  value={filters.fandom}
                  onChange={(e) => setFilters(prev => ({ ...prev, fandom: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Fandoms</option>
                  {uniqueFandoms.map(fandom => (
                    <option key={fandom} value={fandom}>
                      {fandom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Cost Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Cost</label>
                <input
                  type="number"
                  value={filters.minCost}
                  onChange={(e) => setFilters(prev => ({ ...prev, minCost: e.target.value }))}
                  placeholder="$0.00"
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Max Cost Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Cost</label>
                <input
                  type="number"
                  value={filters.maxCost}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxCost: e.target.value }))}
                  placeholder="$999.99"
                  className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredItems.length} of {items.length} items
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions Bar */}
      {selectedItems.size > 0 && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                </span>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear Selection
                </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]"> {/* Ensure minimum width for table */}
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={sortedItems.length > 0 && selectedItems.size === sortedItems.length}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    {visibleColumns.map((column) => (
                      <th key={column.key} className="px-3 sm:px-6 py-3 text-left">
                        <div className="flex items-center justify-between group">
                          <div className="flex items-center gap-2">
                            {column.sortable ? (
                              <button
                                onClick={() => handleSort(column.key)}
                                className="flex items-center gap-1 font-medium text-gray-900 hover:text-gray-700 text-sm"
                              >
                                {column.label}
                                {getSortIcon(column.key)}
                              </button>
                            ) : (
                              <span className="font-medium text-gray-900 text-sm">{column.label}</span>
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
                            <DropdownMenuContent align="end" className="w-56 max-h-96 overflow-y-auto z-50 bg-white border border-gray-200 shadow-lg rounded-md">
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
                              <DropdownMenuLabel className="bg-gray-50 font-semibold text-gray-700">Show/Hide Columns</DropdownMenuLabel>
                              <div className="max-h-48 overflow-y-auto bg-white">
                                {columns.map((col) => (
                                  <DropdownMenuCheckboxItem
                                    key={col.key}
                                    checked={col.visible}
                                    onCheckedChange={() => toggleColumnVisibility(col.key)}
                                    className="cursor-pointer text-sm font-medium text-gray-900 hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100 px-3 py-2 mx-1 rounded bg-white"
                                  >
                                    <span className="flex items-center gap-3">
                                      <span className={`h-4 w-4 border-2 rounded flex items-center justify-center transition-colors ${
                                        col.visible 
                                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                                          : 'border-gray-400 bg-gray-50 hover:bg-gray-100'
                                      }`}>
                                        {col.visible && (
                                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        )}
                                      </span>
                                      <span className="text-gray-900">{col.label}</span>
                                    </span>
                                  </DropdownMenuCheckboxItem>
                                ))}
                              </div>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={resetColumns}>
                                Reset Columns
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </th>
                    ))}
                    <th className="px-3 sm:px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedItems.map((item) => (
                    <tr key={item.id} className={`hover:bg-gray-50 ${selectedItems.has(item.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap w-12">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      {visibleColumns.map((column) => (
                        <td key={column.key} className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          {renderCellContent(item, column.key)}
                        </td>
                      ))}
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <Link href={`/inventory/${item.id}/edit`}>
                            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(item)}
                            disabled={deleteLoading === item.id}
                            className="text-xs sm:text-sm"
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
                
                {/* Summary Footer */}
                {sortedItems.length > 0 && (
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr className="font-medium">
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-600">
                        Summary ({sortedItems.length} items)
                      </td>
                      {visibleColumns.map((column) => {
                        if (column.key === 'quantity') {
                          return (
                            <td key={column.key} className="px-3 sm:px-6 py-4 text-sm font-bold">
                              {sortedItems.reduce((sum, item) => sum + item.quantity, 0)}
                            </td>
                          )
                        } else if (column.key === 'cost') {
                          return (
                            <td key={column.key} className="px-3 sm:px-6 py-4 text-sm font-bold text-orange-600">
                              {formatCurrency(sortedItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0))}
                            </td>
                          )
                        } else if (column.key === 'netRevenue') {
                          const totalNetRevenue = sortedItems.reduce((sum, item) => sum + getNetRevenue(item), 0)
                          const totalInvestment = sortedItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0)
                          return (
                            <td key={column.key} className="px-3 sm:px-6 py-4 text-right">
                              <div className={`text-sm font-bold ${totalNetRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(totalNetRevenue)}
                              </div>
                              <div className="text-xs text-gray-500">
                                inv: {formatCurrency(totalInvestment)}
                              </div>
                            </td>
                          )
                        } else if (column.key === 'totalValue') {
                          return (
                            <td key={column.key} className="px-3 sm:px-6 py-4 text-sm font-bold">
                              {formatCurrency(sortedItems.reduce((sum, item) => sum + (item.totalValue || 0), 0))}
                            </td>
                          )
                        } else {
                          return <td key={column.key} className="px-3 sm:px-6 py-4"></td>
                        }
                      })}
                      <td className="px-3 sm:px-6 py-4"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            
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

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={addItemModal}
        onClose={() => setAddItemModal(false)}
        onSuccess={fetchItems}
      />
    </div>
  )
}
