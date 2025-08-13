"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"

interface AddVendorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddVendorModal({ isOpen, onClose, onSuccess }: AddVendorModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    contactInfo: "",
    website: "",
    notes: "",
    isActive: true,
  })

  const { addToast } = useToast()

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      contactInfo: "",
      website: "",
      notes: "",
      isActive: true,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        name: formData.name,
        contactInfo: formData.contactInfo || null,
        website: formData.website || null,
        notes: formData.notes || null,
        isActive: formData.isActive,
      }

      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Vendor created',
          message: 'New vendor has been added successfully',
          duration: 3000
        })
        resetForm()
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create vendor')
      }
    } catch (error) {
      console.error('Error creating vendor:', error)
      addToast({
        type: 'error',
        title: 'Failed to create vendor',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Add New Vendor</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter vendor name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Information
            </label>
            <input
              type="text"
              value={formData.contactInfo}
              onChange={(e) => handleChange('contactInfo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Email, phone, or other contact info"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://vendor-website.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes about this vendor..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active vendor
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Vendor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
