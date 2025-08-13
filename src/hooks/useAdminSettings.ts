'use client'

import { useState, useEffect } from 'react'

export interface AdminSettings {
  enableDeletionNotifications: boolean
  deletionNotificationDuration: number
}

export const useAdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettings>({
    enableDeletionNotifications: true,
    deletionNotificationDuration: 5000
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          enableDeletionNotifications: data.enableDeletionNotifications === 'true',
          deletionNotificationDuration: parseInt(data.deletionNotificationDuration) || 5000
        })
      }
    } catch (error) {
      console.error('Error fetching admin settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings: Partial<AdminSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings }
      
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enableDeletionNotifications: String(updatedSettings.enableDeletionNotifications),
          deletionNotificationDuration: String(updatedSettings.deletionNotificationDuration)
        }),
      })

      if (response.ok) {
        setSettings(updatedSettings)
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating admin settings:', error)
      return false
    }
  }

  return {
    settings,
    loading,
    updateSettings,
    refreshSettings: fetchSettings
  }
}
