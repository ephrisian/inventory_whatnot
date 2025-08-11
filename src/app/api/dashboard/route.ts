import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get total inventory value
    const inventoryStats = await prisma.item.aggregate({
      _sum: {
        totalValue: true,
      },
      _count: {
        id: true,
      },
      where: {
        status: 'IN_STOCK',
      },
    })

    // Get total profit from sales
    const salesStats = await prisma.sale.aggregate({
      _sum: {
        netProfit: true,
      },
    })

    // Get low stock alerts (items with quantity <= 5)
    const lowStockCount = await prisma.item.count({
      where: {
        quantity: {
          lte: 5,
        },
        status: 'IN_STOCK',
      },
    })

    // Get recent sales for dashboard
    const recentSales = await prisma.sale.findMany({
      take: 5,
      orderBy: {
        saleDate: 'desc',
      },
      include: {
        item: {
          select: {
            name: true,
          },
        },
      },
    })

    // Get inventory alerts
    const lowStockItems = await prisma.item.findMany({
      where: {
        quantity: {
          lte: 5,
        },
        status: 'IN_STOCK',
      },
      take: 10,
      orderBy: {
        quantity: 'asc',
      },
      select: {
        id: true,
        name: true,
        quantity: true,
      },
    })

    // Get high interest items (items with multiple customer interests)
    const highInterestItems = await prisma.customerInterest.groupBy({
      by: ['itemId'],
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gte: 2,
          },
        },
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    })

    const highInterestItemsDetails = await prisma.item.findMany({
      where: {
        id: {
          in: highInterestItems.map(item => item.itemId),
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            customerInterests: true,
          },
        },
      },
    })

    return NextResponse.json({
      stats: {
        totalInventoryValue: inventoryStats._sum.totalValue || 0,
        totalProfit: salesStats._sum.netProfit || 0,
        itemsInStock: inventoryStats._count.id || 0,
        lowStockAlerts: lowStockCount,
      },
      recentSales: recentSales.map(sale => ({
        id: sale.id,
        itemName: sale.item.name,
        platform: sale.platform,
        soldPrice: sale.soldPrice,
        netProfit: sale.netProfit,
        saleDate: sale.saleDate,
      })),
      alerts: [
        ...lowStockItems.map(item => ({
          id: item.id,
          type: item.quantity === 0 ? 'restock_needed' : 'low_stock',
          message: item.quantity === 0 ? 'Out of stock' : `Only ${item.quantity} units left`,
          itemName: item.name,
          quantity: item.quantity,
          priority: item.quantity === 0 ? 'high' : item.quantity <= 2 ? 'high' : 'medium',
        })),
        ...highInterestItemsDetails.map(item => ({
          id: item.id,
          type: 'high_interest',
          message: `${item._count.customerInterests} customers interested`,
          itemName: item.name,
          priority: item._count.customerInterests >= 3 ? 'medium' : 'low',
        })),
      ],
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
