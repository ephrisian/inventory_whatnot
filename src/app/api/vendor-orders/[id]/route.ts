import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateOrderSchema = z.object({
  status: z.enum(['ORDERED', 'IN_TRANSIT', 'ARRIVED', 'CANCELLED']).optional(),
  orderNumber: z.string().optional(),
  totalCost: z.number().positive().optional(),
  notes: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const order = await prisma.vendorOrder.findUnique({
      where: { id: resolvedParams.id },
      include: {
        vendor: true,
        items: {
          include: {
            item: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Vendor order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching vendor order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendor order' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const validatedData = updateOrderSchema.parse(body)

    // Get existing order to check current status
    const existingOrder = await prisma.vendorOrder.findUnique({
      where: { id: resolvedParams.id },
      include: {
        items: {
          include: {
            item: true
          }
        }
      }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Vendor order not found' },
        { status: 404 }
      )
    }

    // Update the order
    const updatedOrder = await prisma.vendorOrder.update({
      where: { id: resolvedParams.id },
      data: {
        ...validatedData,
        updatedAt: new Date()
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

    // If status changed from non-ARRIVED to ARRIVED, update inventory
    if (validatedData.status === 'ARRIVED' && existingOrder.status !== 'ARRIVED') {
      console.log('🚚 Order marked as ARRIVED, updating inventory...')
      
      // Update inventory quantities for each item
      for (const orderItem of existingOrder.items) {
        await prisma.item.update({
          where: { id: orderItem.itemId },
          data: {
            quantity: {
              increment: orderItem.quantity
            },
            cost: orderItem.costPerUnit, // Update cost to latest purchase price
            status: 'IN_STOCK' // Ensure item is back in stock
          }
        })

        console.log(`📦 Updated item ${orderItem.item.name}: +${orderItem.quantity} quantity, cost: $${orderItem.costPerUnit}`)
      }

      // Update total values for affected items
      for (const orderItem of existingOrder.items) {
        const updatedItem = await prisma.item.findUnique({
          where: { id: orderItem.itemId }
        })
        
        if (updatedItem) {
          await prisma.item.update({
            where: { id: orderItem.itemId },
            data: {
              totalValue: updatedItem.quantity * updatedItem.cost
            }
          })
        }
      }

      console.log('✅ Inventory update completed')
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating vendor order:', error)
    return NextResponse.json(
      { error: 'Failed to update vendor order' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    
    // Delete order items first due to foreign key constraints
    await prisma.vendorOrderItem.deleteMany({
      where: { orderId: resolvedParams.id }
    })

    // Delete the order
    await prisma.vendorOrder.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting vendor order:', error)
    return NextResponse.json(
      { error: 'Failed to delete vendor order' },
      { status: 500 }
    )
  }
}
