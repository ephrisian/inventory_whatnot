 import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateIntelligentPricing } from '@/lib/pricing'

export async function GET() {
  console.log('🔍 GET /api/inventory - Fetching items...')
  try {
    const items = await prisma.item.findMany({
      include: {
        category: true,
        packSales: {
          select: {
            id: true,
            soldPrice: true,
            netProfit: true,
            saleDate: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    console.log(`✅ GET /api/inventory - Found ${items.length} items`)
    console.log('📊 Items preview:', items.slice(0, 2).map(item => ({ id: item.id, name: item.name, cost: item.cost })))
    return NextResponse.json(items)
  } catch (error) {
    console.error('❌ GET /api/inventory - Error fetching items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/inventory - Creating new item...')
  try {
    const data = await request.json()
    console.log('📝 Request data:', JSON.stringify(data, null, 2))
    
    // Calculate pricing automatically if cost is provided
    let calculatedPricing = {}
    if (data.cost && data.cost > 0) {
      console.log('💰 Calculating pricing for cost:', data.cost)
      const pricingResult = calculateIntelligentPricing({
        cost: data.cost,
        itemType: data.itemType || 'single',
        packsPerBox: data.packsPerBox || 1,
        marketPrice: data.marketPrice,
        categoryConfig: {
          baseMarkupPercent: 30,
          packMarkupPercent: 25,
          packGroupSize: 5,
          useMarketPricing: false
        },
        platformFees: {
          whatnot: 12,
          ebay: 13,
          discord: 0
        }
      })
      
      calculatedPricing = {
        retailPrice: pricingResult.retailPrice,
        packPrice: pricingResult.packPrice,
        packGroupPrice: pricingResult.packGroupPrice
      }
      console.log('📊 Calculated pricing:', calculatedPricing)
    }

    console.log('🗃️ Creating item in database...')
    const item = await prisma.item.create({
      data: {
        name: data.name,
        description: data.description,
        manufacturer: data.manufacturer || null,
        category: data.categoryId ? {
          connect: { id: data.categoryId }
        } : undefined,
        fandom: data.fandomId ? {
          connect: { id: data.fandomId }
        } : undefined,
        cost: data.cost || 0,
        quantity: data.quantity || 0,
        location: data.location || null,
        notes: data.notes || null,
        status: data.status || 'IN_STOCK',
        imageUrl: data.imageUrl || null,
        itemType: data.itemType || 'single',
        packsPerBox: data.packsPerBox || 1,
        marketPrice: data.marketPrice || null,
        // Auto-calculated pricing
        ...calculatedPricing
      },
      include: {
        category: true,
        fandom: true,
      }
    })
    
    console.log('✅ Item created successfully:', { 
      id: item.id, 
      name: item.name, 
      cost: item.cost,
      retailPrice: item.retailPrice,
      quantity: item.quantity 
    })
    return NextResponse.json(item)
  } catch (error) {
    console.error('Error creating item:', error)
    
    // Provide more detailed error messages
    let errorMessage = 'Failed to create item'
    let statusCode = 500
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Handle specific Prisma errors
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'An item with this SKU already exists'
        statusCode = 400
      } else if (error.message.includes('Foreign key constraint')) {
        errorMessage = 'Invalid category or fandom selected'
        statusCode = 400
      } else if (error.message.includes('manufacturer')) {
        errorMessage = 'Manufacturer field issue: ' + error.message
        statusCode = 400
      } else if (error.message.includes('itemType')) {
        errorMessage = 'Invalid item type. Must be single, pack, or box'
        statusCode = 400
      } else if (error.message.includes('retailPrice') || error.message.includes('packPrice')) {
        errorMessage = 'Pricing calculation error: ' + error.message
        statusCode = 400
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: statusCode }
    )
  }
}
