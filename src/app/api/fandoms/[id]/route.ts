import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if fandom exists
    const existingFandom = await prisma.fandom.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            items: true
          }
        }
      }
    })

    if (!existingFandom) {
      return NextResponse.json(
        { error: 'Fandom not found' },
        { status: 404 }
      )
    }

    // Check if fandom has associated items
    if (existingFandom._count.items > 0) {
      return NextResponse.json(
        { error: 'Cannot delete fandom with associated items' },
        { status: 400 }
      )
    }

    // Delete the fandom
    await prisma.fandom.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting fandom:', error)
    return NextResponse.json(
      { error: 'Failed to delete fandom' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
