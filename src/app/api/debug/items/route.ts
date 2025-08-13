import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  console.log('🔧 DEBUG: Checking database directly...')
  try {
    // Get count of all items
    const totalCount = await prisma.item.count()
    console.log(`🔢 Total items in database: ${totalCount}`)
    
    // Get all items with minimal data
    const items = await prisma.item.findMany({
      select: {
        id: true,
        name: true,
        cost: true,
        quantity: true,
        createdAt: true,
        // manufacturer: true,
        // retailPrice: true,
        // itemType: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Only get last 10 items
    })
    
    console.log('🗃️ Recent items from database:', JSON.stringify(items, null, 2))
    
    return NextResponse.json({
      totalCount,
      recentItems: items,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ DEBUG: Error checking database:', error)
    return NextResponse.json(
      { error: 'Failed to check database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
