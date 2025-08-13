"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, X, Check, ChevronDown } from "lucide-react"
import { useToast } from "@/components/ui/toast"

interface Option {
  id: string
  name: string
  [key: string]: any
}

interface DynamicDropdownProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  onRefresh: () => void
  placeholder?: string
  required?: boolean
  createApiEndpoint: string
  deleteApiEndpoint?: string
  displayField?: string
  searchFields?: string[]
  disabled?: boolean
  className?: string
  allowDelete?: boolean
}

export function DynamicDropdown({
  label,
  value,
  onChange,
  options,
  onRefresh,
  placeholder = "Select an option",
  required = false,
  createApiEndpoint,
  deleteApiEndpoint,
  displayField = "name",
  searchFields = ["name"],
  disabled = false,
  className = "",
  allowDelete = false
}: DynamicDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newItemName, setNewItemName] = useState("")
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
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

  const selectedOption = options.find(option => option.id === value)

  const filteredOptions = options.filter(option => {
    if (!searchTerm) return true
    return searchFields.some(field => 
      option[field]?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleCreateNew = async () => {
    if (!newItemName.trim()) return

    setLoading(true)
    try {
      const response = await fetch(createApiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [displayField]: newItemName.trim() }),
      })

      if (response.ok) {
        const newItem = await response.json()
        addToast({
          type: 'success',
          title: 'Created successfully',
          message: `"${newItemName}" has been created`,
          duration: 3000
        })
        
        // Refresh the options
        await onRefresh()
        
        // Select the new item
        onChange(newItem.id)
        
        // Reset state
        setNewItemName("")
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
        title: 'Failed to create',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (optionId: string, optionName: string) => {
    if (!deleteApiEndpoint || !allowDelete) return

    const confirmed = window.confirm(`Are you sure you want to delete "${optionName}"?`)
    if (!confirmed) return

    setLoading(true)
    try {
      const response = await fetch(`${deleteApiEndpoint}/${optionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Deleted successfully',
          message: `"${optionName}" has been deleted`,
          duration: 3000
        })
        
        // If the deleted item was selected, clear the selection
        if (value === optionId) {
          onChange("")
        }
        
        // Refresh the options
        await onRefresh()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete item')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      addToast({
        type: 'error',
        title: 'Failed to delete',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreateNew()
    } else if (e.key === 'Escape') {
      setIsCreating(false)
      setNewItemName("")
    }
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
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption[displayField] : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="max-h-40 overflow-y-auto">
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

            {/* Existing options */}
            {filteredOptions.map((option) => (
              <div
                key={option.id}
                className={`flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 ${
                  option.id === value ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.id)
                    setIsOpen(false)
                    setSearchTerm("")
                  }}
                  className="flex-1 text-left flex items-center justify-between"
                >
                  <span>{option[displayField]}</span>
                  {option.id === value && <Check className="h-4 w-4" />}
                </button>
                
                {allowDelete && deleteApiEndpoint && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(option.id, option[displayField])
                    }}
                    className="ml-2 p-1 rounded hover:bg-red-100 text-red-600 opacity-70 hover:opacity-100"
                    title={`Delete ${option[displayField]}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}

            {filteredOptions.length === 0 && searchTerm && (
              <div className="px-3 py-2 text-sm text-gray-500 italic">
                No options found matching "{searchTerm}"
              </div>
            )}
          </div>

          {/* Add new section */}
          <div className="border-t bg-gray-50">
            {isCreating ? (
              <div className="p-2 flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`New ${label.toLowerCase()}...`}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateNew}
                  disabled={!newItemName.trim() || loading}
                  className="h-7 px-2"
                >
                  {loading ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreating(false)
                    setNewItemName("")
                  }}
                  className="h-7 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
              >
                <Plus className="h-3 w-3" />
                Add new {label.toLowerCase()}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
