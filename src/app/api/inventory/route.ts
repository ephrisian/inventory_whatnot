import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const itemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  cost: z.number().positive(),
  quantity: z.number().int().min(0),
  categoryId: z.string().optional(),
  fandomId: z.string().optional(),
  sku: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { sku: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(category && { categoryId: category }),
      ...(status && { status: status as any }),
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          category: true,
          fandom: true,
          sales: {
            orderBy: { saleDate: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.item.count({ where }),
    ])

    // Calculate total value for each item
    const itemsWithValue = items.map(item => ({
      ...item,
      totalValue: item.cost * item.quantity,
    }))

    return NextResponse.json({
      items: itemsWithValue,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = itemSchema.parse(body)

    // Generate SKU if not provided
    if (!validatedData.sku) {
      const category = validatedData.categoryId 
        ? await prisma.category.findUnique({ where: { id: validatedData.categoryId } })
        : null
      
      const baseSku = `${category?.name.substring(0, 3).toUpperCase() || 'GEN'}-${validatedData.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase()}`
      let sku = baseSku
      let counter = 1
      
      // Ensure SKU is unique
      while (await prisma.item.findUnique({ where: { sku } })) {
        sku = `${baseSku}-${counter.toString().padStart(3, '0')}`
        counter++
      }
      
      validatedData.sku = sku
    }

    const item = await prisma.item.create({
      data: {
        ...validatedData,
        totalValue: validatedData.cost * validatedData.quantity,
      },
      include: {
        category: true,
        fandom: true,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating item:', error)
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    )
  }
}
