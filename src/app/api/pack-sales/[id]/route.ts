import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updatePackSaleSchema = z.object({
  platform: z.enum(['WHATNOT', 'EBAY', 'PAYPAL', 'DISCORD', 'INSTAGRAM', 'OTHER']).optional(),
  soldPrice: z.number().min(0).optional(),
  shippingCost: z.number().min(0).optional(),
  materialsCost: z.number().min(0).optional(),
  platformFeePercent: z.number().min(0).max(100).optional(),
  platformFeeFlat: z.number().min(0).optional(),
  notes: z.string().optional(),
  packNumber: z.number().int().min(1).optional(),
})

// GET single pack sale
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const packSale = await prisma.packSale.findUnique({
      where: { id: params.id },
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

    if (!packSale) {
      return NextResponse.json(
        { error: 'Pack sale not found' },
        { status: 404 }
      )
    }

    // Add calculated fields
    const costPerPack = packSale.parentItem.cost / (packSale.parentItem.packsPerBox || 1)
    const platformFeeTotal = (packSale.soldPrice * packSale.platformFeePercent / 100) + packSale.platformFeeFlat
    const breakEvenPrice = costPerPack + packSale.materialsCost + packSale.shippingCost + platformFeeTotal
    const netProfit = packSale.soldPrice - costPerPack - packSale.materialsCost - packSale.shippingCost - platformFeeTotal

    return NextResponse.json({
      ...packSale,
      costPerPack,
      platformFeeTotal,
      breakEvenPrice,
      netProfit,
    })
  } catch (error) {
    console.error('Error fetching pack sale:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pack sale' },
      { status: 500 }
    )
  }
}

// UPDATE pack sale
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updatePackSaleSchema.parse(body)

    // Get existing pack sale to access parent item
    const existingPackSale = await prisma.packSale.findUnique({
      where: { id: params.id },
      include: {
        parentItem: {
          select: {
            id: true,
            cost: true,
            packsPerBox: true,
          }
        }
      }
    })

    if (!existingPackSale) {
      return NextResponse.json(
        { error: 'Pack sale not found' },
        { status: 404 }
      )
    }

    // Recalculate values if price or costs changed
    const soldPrice = validatedData.soldPrice ?? existingPackSale.soldPrice
    const shippingCost = validatedData.shippingCost ?? existingPackSale.shippingCost
    const materialsCost = validatedData.materialsCost ?? existingPackSale.materialsCost
    const platformFeePercent = validatedData.platformFeePercent ?? existingPackSale.platformFeePercent
    const platformFeeFlat = validatedData.platformFeeFlat ?? existingPackSale.platformFeeFlat

    const costPerPack = existingPackSale.parentItem.cost / (existingPackSale.parentItem.packsPerBox || 1)
    const platformFeeTotal = (soldPrice * platformFeePercent / 100) + platformFeeFlat
    const breakEvenPrice = costPerPack + materialsCost + shippingCost + platformFeeTotal
    const netProfit = soldPrice - costPerPack - materialsCost - shippingCost - platformFeeTotal

    const updatedPackSale = await prisma.packSale.update({
      where: { id: params.id },
      data: {
        ...validatedData,
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

    return NextResponse.json(updatedPackSale)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating pack sale:', error)
    return NextResponse.json(
      { error: 'Failed to update pack sale' },
      { status: 500 }
    )
  }
}

// DELETE pack sale
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const packSale = await prisma.packSale.findUnique({
      where: { id: params.id }
    })

    if (!packSale) {
      return NextResponse.json(
        { error: 'Pack sale not found' },
        { status: 404 }
      )
    }

    await prisma.packSale.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting pack sale:', error)
    return NextResponse.json(
      { error: 'Failed to delete pack sale' },
      { status: 500 }
    )
  }
}
