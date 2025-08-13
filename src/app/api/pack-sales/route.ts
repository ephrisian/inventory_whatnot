import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const packSaleSchema = z.object({
  parentItemId: z.string(),
  platform: z.enum(['WHATNOT', 'EBAY', 'PAYPAL', 'DISCORD', 'INSTAGRAM', 'OTHER']),
  soldPrice: z.number().min(0),
  shippingCost: z.number().min(0).optional().default(0),
  materialsCost: z.number().min(0).optional().default(0),
  platformFeePercent: z.number().min(0).max(100).optional().default(0),
  platformFeeFlat: z.number().min(0).optional().default(0),
  notes: z.string().optional(),
  packNumber: z.number().int().min(1).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentItemId = searchParams.get('parentItemId')
    
    const where = parentItemId ? { parentItemId } : {}
    
    const packSales = await prisma.packSale.findMany({
      where,
      include: {
        parentItem: {
          select: {
            id: true,
            name: true,
            cost: true,
            packsPerBox: true,
            itemType: true,
          }
        }
      },
      orderBy: { saleDate: 'desc' }
    })

    // Add calculated fields
    const packSalesWithCalculations = packSales.map((sale: any) => {
      const costPerPack = sale.parentItem.cost / (sale.parentItem.packsPerBox || 1)
      const platformFeeTotal = (sale.soldPrice * sale.platformFeePercent / 100) + sale.platformFeeFlat
      const breakEvenPrice = costPerPack + sale.materialsCost + sale.shippingCost + platformFeeTotal
      const netProfit = sale.soldPrice - costPerPack - sale.materialsCost - sale.shippingCost - platformFeeTotal
      
      return {
        ...sale,
        costPerPack,
        platformFeeTotal,
        breakEvenPrice,
        netProfit,
      }
    })

    return NextResponse.json(packSalesWithCalculations)
  } catch (error) {
    console.error('Error fetching pack sales:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pack sales' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = packSaleSchema.parse(body)

    // Verify parent item exists and is a box
    const parentItem = await prisma.item.findUnique({
      where: { id: validatedData.parentItemId },
    })

    if (!parentItem) {
      return NextResponse.json(
        { error: 'Parent item not found' },
        { status: 404 }
      )
    }

    if (parentItem.itemType !== 'box') {
      return NextResponse.json(
        { error: 'Can only create pack sales for box items' },
        { status: 400 }
      )
    }

    // Calculate pack-specific values
    const costPerPack = parentItem.cost / (parentItem.packsPerBox || 1)
    
    // Auto-calculate platform fee flat based on platform
    let platformFeeFlat = validatedData.platformFeeFlat
    if (validatedData.platform === 'WHATNOT') {
      platformFeeFlat = 0.30
    } else if (validatedData.platform === 'EBAY') {
      platformFeeFlat = 0.30
    } else if (validatedData.platform === 'PAYPAL') {
      platformFeeFlat = 0.49
    }
    
    const platformFeeTotal = (validatedData.soldPrice * validatedData.platformFeePercent / 100) + platformFeeFlat
    const breakEvenPrice = costPerPack + validatedData.materialsCost + validatedData.shippingCost + platformFeeTotal
    const netProfit = validatedData.soldPrice - costPerPack - validatedData.materialsCost - validatedData.shippingCost - platformFeeTotal

    // Auto-assign pack number if not provided
    let packNumber = validatedData.packNumber
    if (!packNumber) {
      const existingPackSales = await prisma.packSale.count({
        where: { parentItemId: validatedData.parentItemId }
      })
      packNumber = existingPackSales + 1
    }

    const packSale = await prisma.packSale.create({
      data: {
        ...validatedData,
        packNumber,
        costPerPack,
        platformFeeTotal,
        breakEvenPrice,
        netProfit,
      },
      include: {
        parentItem: {
          select: {
            id: true,
            name: true,
            cost: true,
            packsPerBox: true,
            itemType: true,
          }
        }
      }
    })

  // Update parent item pack tracking fields (TODO: Enable when schema supports these fields)
  // await updateParentItemPackTracking(validatedData.parentItemId)    return NextResponse.json(packSale)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating pack sale:', error)
    return NextResponse.json(
      { error: 'Failed to create pack sale' },
      { status: 500 }
    )
  }
}

// Helper function to update parent item pack tracking
// TODO: Enable when schema supports pack tracking fields
/*
async function updateParentItemPackTracking(parentItemId: string) {
  const packSales = await prisma.packSale.findMany({
    where: { parentItemId },
    select: {
      soldPrice: true,
    }
  })

  const parentItem = await prisma.item.findUnique({
    where: { id: parentItemId },
    select: { packsPerBox: true }
  })

  if (!parentItem) return

  const packsSold = packSales.length
  const packsRemaining = (parentItem.packsPerBox || 0) - packsSold
  const totalPackRevenue = packSales.reduce((sum: number, sale: any) => sum + sale.soldPrice, 0)
  const avgPackPrice = packsSold > 0 ? totalPackRevenue / packsSold : 0
  const projectedRevenue = avgPackPrice * (parentItem.packsPerBox || 0)

  await prisma.item.update({
    where: { id: parentItemId },
    data: {
      packsSold,
      packsRemaining,
      totalPackRevenue,
      avgPackPrice,
      projectedRevenue,
    }
  })
}
*/
