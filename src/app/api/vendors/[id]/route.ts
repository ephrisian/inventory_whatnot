import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  contactInfo: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const vendor = await prisma.vendor.findUnique({
      where: { id: resolvedParams.id },
      include: {
        orders: {
          include: {
            items: {
              include: {
                item: true
              }
            }
          },
          orderBy: {
            orderDate: 'desc'
          }
        },
        _count: {
          select: {
            orders: true
          }
        }
      }
    })

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(vendor)
  } catch (error) {
    console.error('Error fetching vendor:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendor' },
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
    const validatedData = updateVendorSchema.parse(body)

    const vendor = await prisma.vendor.update({
      where: { id: resolvedParams.id },
      data: {
        ...validatedData,
        website: validatedData.website || null,
        contactInfo: validatedData.contactInfo || null,
        notes: validatedData.notes || null,
      },
      include: {
        _count: {
          select: {
            orders: true
          }
        }
      }
    })

    return NextResponse.json(vendor)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating vendor:', error)
    return NextResponse.json(
      { error: 'Failed to update vendor' },
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
    
    // Check if vendor has orders
    const vendor = await prisma.vendor.findUnique({
      where: { id: resolvedParams.id },
      include: {
        _count: {
          select: {
            orders: true
          }
        }
      }
    })

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      )
    }

    if (vendor._count.orders > 0) {
      return NextResponse.json(
        { error: 'Cannot delete vendor with existing orders' },
        { status: 400 }
      )
    }

    await prisma.vendor.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting vendor:', error)
    return NextResponse.json(
      { error: 'Failed to delete vendor' },
      { status: 500 }
    )
  }
}
