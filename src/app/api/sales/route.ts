import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const saleSchema = z.object({
  itemId: z.string(),
  platform: z.enum(['WHATNOT', 'EBAY', 'PAYPAL', 'DISCORD', 'INSTAGRAM', 'OTHER']),
  soldPrice: z.number().positive(),
  shippingCost: z.number().min(0).default(0),
  materialsCost: z.number().min(0).default(0),
  platformFeePercent: z.number().min(0).default(0),
  platformFeeFlat: z.number().min(0).default(0),
  saleDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  platformFeeTotal: z.number().optional(),
  breakEvenPrice: z.number().optional(),
  netProfit: z.number().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const skip = (page - 1) * limit

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        include: {
          item: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { saleDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.sale.count(),
    ])

    return NextResponse.json({
      sales: sales.map(sale => ({
        ...sale,
        itemName: sale.item.name,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = saleSchema.parse(body)

    // Check if item exists and has sufficient quantity
    const item = await prisma.item.findUnique({
      where: { id: validatedData.itemId },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    if (item.quantity < 1) {
      return NextResponse.json(
        { error: 'Insufficient quantity in stock' },
        { status: 400 }
      )
    }

    // Create the sale
    const sale = await prisma.sale.create({
      data: {
        ...validatedData,
        saleDate: validatedData.saleDate ? new Date(validatedData.saleDate) : new Date(),
      },
      include: {
        item: {
          select: {
            name: true,
          },
        },
      },
    })

    // Update item quantity and total value
    const newQuantity = item.quantity - 1
    await prisma.item.update({
      where: { id: validatedData.itemId },
      data: {
        quantity: newQuantity,
        totalValue: item.cost * newQuantity,
        status: newQuantity === 0 ? 'NEEDS_RESTOCK' : item.status,
      },
    })

    return NextResponse.json({
      ...sale,
      itemName: sale.item.name,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating sale:', error)
    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    )
  }
}
