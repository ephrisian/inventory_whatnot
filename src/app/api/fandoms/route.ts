import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
