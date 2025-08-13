import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const vendorOrderSchema = z.object({
  vendorId: z.string(),
  orderNumber: z.string().optional(),
  orderDate: z.string().datetime().optional(),
  status: z.enum(['ORDERED', 'IN_TRANSIT', 'ARRIVED', 'CANCELLED']).default('ORDERED'),
  totalCost: z.number().positive().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().int().positive(),
    costPerUnit: z.number().positive(),
  }))
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (vendorId) where.vendorId = vendorId
    if (status) where.status = status

    const orders = await prisma.vendorOrder.findMany({
      where,
      include: {
        vendor: true,
        items: {
          include: {
            item: true
          }
        }
      },
      orderBy: {
        orderDate: 'desc'
      }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching vendor orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendor orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = vendorOrderSchema.parse(body)

    // Calculate total cost from items if not provided
    const itemsWithTotalCost = validatedData.items.map(item => ({
      ...item,
      totalCost: item.quantity * item.costPerUnit
    }))

    const calculatedTotalCost = itemsWithTotalCost.reduce(
      (sum, item) => sum + item.totalCost, 
      0
    )

    const order = await prisma.vendorOrder.create({
      data: {
        vendorId: validatedData.vendorId,
        orderNumber: validatedData.orderNumber || null,
        orderDate: validatedData.orderDate ? new Date(validatedData.orderDate) : new Date(),
        status: validatedData.status,
        totalCost: validatedData.totalCost || calculatedTotalCost,
        notes: validatedData.notes || null,
        items: {
          create: itemsWithTotalCost
        }
      },
      include: {
        vendor: true,
        items: {
          include: {
            item: true
          }
        }
      }
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating vendor order:', error)
    return NextResponse.json(
      { error: 'Failed to create vendor order' },
      { status: 500 }
    )
  }
}
