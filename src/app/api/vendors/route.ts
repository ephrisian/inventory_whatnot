import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const vendorSchema = z.object({
  name: z.string().min(1),
  contactInfo: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
})

export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        orders: {
          include: {
            items: {
              include: {
                item: true
              }
            }
          }
        },
        _count: {
          select: {
            orders: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(vendors)
  } catch (error) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = vendorSchema.parse(body)

    const vendor = await prisma.vendor.create({
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

    return NextResponse.json(vendor, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating vendor:', error)
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    )
  }
}
