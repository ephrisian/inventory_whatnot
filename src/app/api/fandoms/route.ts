import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const fandomSchema = z.object({
  name: z.string().min(1).max(255),
})

export async function GET() {
  try {
    const fandoms = await prisma.fandom.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(fandoms)
  } catch (error) {
    console.error('Error fetching fandoms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fandoms' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = fandomSchema.parse(body)

    const fandom = await prisma.fandom.create({
      data: {
        name: validatedData.name.trim(),
      },
    })

    return NextResponse.json(fandom, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    // Handle unique constraint errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A fandom with this name already exists' },
        { status: 400 }
      )
    }

    console.error('Error creating fandom:', error)
    return NextResponse.json(
      { error: 'Failed to create fandom' },
      { status: 500 }
    )
  }
}
