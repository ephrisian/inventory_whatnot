import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const settings = await prisma.systemSettings.findMany()
    
    // Convert to key-value object for easier access
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)
    
    // Add default values for missing settings
    const defaultSettings = {
      enableDeletionNotifications: 'true',
      deletionNotificationDuration: '5000',
      ...settingsMap
    }
    
    return NextResponse.json(defaultSettings)
  } catch (error) {
    console.error('Error fetching admin settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Update or create each setting
    const updatePromises = Object.entries(data).map(([key, value]) =>
      prisma.systemSettings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { 
          key, 
          value: String(value),
          description: getSettingDescription(key)
        }
      })
    )
    
    await Promise.all(updatePromises)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating admin settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    enableDeletionNotifications: 'Show toast notifications when items are deleted',
    deletionNotificationDuration: 'Duration in milliseconds for deletion notifications'
  }
  return descriptions[key] || ''
}
