import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const itemUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  cost: z.number().min(0).optional(),
  quantity: z.number().int().min(0).optional(),
  categoryId: z.string().nullable().optional(),
  fandomId: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  manufacturer: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  itemType: z.string().optional(),
  packsPerBox: z.number().int().min(1).optional(),
  marketPrice: z.number().min(0).nullable().optional(),
  ebayPrice: z.number().min(0).nullable().optional(),
  whatnotPrice: z.number().min(0).nullable().optional(),
  discordPrice: z.number().min(0).nullable().optional(),
  otherPrice: z.number().min(0).nullable().optional(),
  status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'SOLD', 'RESERVED', 'NEEDS_RESTOCK', 'DISCONTINUED']).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        category: true,
        fandom: true,
        sales: {
          orderBy: { saleDate: 'desc' },
          take: 5,
        },
        customerInterests: {
          orderBy: { dateRequested: 'desc' },
          take: 5,
        },
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...item,
      totalValue: item.cost * item.quantity,
    })
  } catch (error) {
    console.error('Error fetching item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = itemUpdateSchema.parse(body)

    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    // Check for SKU uniqueness if updating SKU
    if (validatedData.sku && validatedData.sku !== existingItem.sku) {
      const existingSku = await prisma.item.findUnique({
        where: { sku: validatedData.sku },
      })
      
      if (existingSku) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 400 }
        )
      }
    }

    // Calculate new total value if cost or quantity changed
    const newCost = validatedData.cost ?? existingItem.cost
    const newQuantity = validatedData.quantity ?? existingItem.quantity
    const totalValue = newCost * newQuantity

    // Prepare update data with proper relationship handling
    const updateData: Record<string, unknown> = {
      ...validatedData,
      totalValue,
      // Calculate net prices after platform fees
      ...(validatedData.ebayPrice && { ebayNetPrice: validatedData.ebayPrice * 0.87 }),
      ...(validatedData.whatnotPrice && { whatnotNetPrice: validatedData.whatnotPrice * 0.89 }),
    }

    // Handle category relationship
    if (validatedData.categoryId !== undefined) {
      if (validatedData.categoryId === null) {
        updateData.category = { disconnect: true }
        delete updateData.categoryId
      } else {
        updateData.category = { connect: { id: validatedData.categoryId } }
        delete updateData.categoryId
      }
    }

    // Handle fandom relationship
    if (validatedData.fandomId !== undefined) {
      if (validatedData.fandomId === null) {
        updateData.fandom = { disconnect: true }
        delete updateData.fandomId
      } else {
        updateData.fandom = { connect: { id: validatedData.fandomId } }
        delete updateData.fandomId
      }
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        fandom: true,
      },
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating item:', error)
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id },
      include: {
        sales: true,
        customerInterests: true,
      },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    // Check if item has sales or customer interests
    if (existingItem.sales.length > 0 || existingItem.customerInterests.length > 0) {
      // Soft delete - mark as discontinued instead of hard delete
      const updatedItem = await prisma.item.update({
        where: { id },
        data: {
          status: 'DISCONTINUED',
          quantity: 0,
          totalValue: 0,
        },
      })

      return NextResponse.json({
        message: 'Item marked as discontinued due to existing sales/interests',
        item: updatedItem,
      })
    } else {
      // Hard delete if no dependencies
      await prisma.item.delete({
        where: { id },
      })

      return NextResponse.json({
        message: 'Item deleted successfully',
      })
    }
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    )
  }
}
