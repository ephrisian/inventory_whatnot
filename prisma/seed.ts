import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Trading Cards' },
      update: {},
      create: {
        name: 'Trading Cards',
        description: 'TCG cards, sports cards, etc.',
        color: '#3B82F6'
      }
    }),
    prisma.category.upsert({
      where: { name: 'Collectible Pins' },
      update: {},
      create: {
        name: 'Collectible Pins',
        description: 'Enamel pins, badges, etc.',
        color: '#EF4444'
      }
    }),
    prisma.category.upsert({
      where: { name: 'Action Figures' },
      update: {},
      create: {
        name: 'Action Figures',
        description: 'Figurines, collectible toys',
        color: '#10B981'
      }
    })
  ])

  // Create fandoms
  const fandoms = await Promise.all([
    prisma.fandom.upsert({
      where: { name: 'Pokemon' },
      update: {},
      create: {
        name: 'Pokemon',
        description: 'Pokemon franchise collectibles',
        color: '#FBBF24'
      }
    }),
    prisma.fandom.upsert({
      where: { name: 'Marvel' },
      update: {},
      create: {
        name: 'Marvel',
        description: 'Marvel Comics and MCU',
        color: '#DC2626'
      }
    }),
    prisma.fandom.upsert({
      where: { name: 'Star Wars' },
      update: {},
      create: {
        name: 'Star Wars',
        description: 'Star Wars universe',
        color: '#1F2937'
      }
    })
  ])

  // Create vendors
  const vendors = await Promise.all([
    prisma.vendor.upsert({
      where: { name: 'Card Central' },
      update: {},
      create: {
        name: 'Card Central',
        contactInfo: 'sales@cardcentral.com',
        website: 'https://cardcentral.com',
        notes: 'Reliable TCG supplier'
      }
    }),
    prisma.vendor.upsert({
      where: { name: 'Collectors Haven' },
      update: {},
      create: {
        name: 'Collectors Haven',
        contactInfo: 'orders@collectorshaven.com',
        website: 'https://collectorshaven.com',
        notes: 'Great for vintage items'
      }
    })
  ])

  // Create sample inventory items
  const items = await Promise.all([
    prisma.item.create({
      data: {
        name: 'Charizard Base Set Holo',
        description: 'First edition Charizard holographic card from Base Set',
        cost: 50.00,
        quantity: 3,
        totalValue: 150.00,
        status: 'IN_STOCK',
        sku: 'TCG-CHARIZARD-001',
        categoryId: categories[0].id,
        fandomId: fandoms[0].id,
        notes: 'Near mint condition'
      }
    }),
    prisma.item.create({
      data: {
        name: 'Pokemon Booster Pack - Evolving Skies',
        description: 'Sealed booster pack from Evolving Skies set',
        cost: 4.50,
        quantity: 24,
        totalValue: 108.00,
        status: 'IN_STOCK',
        sku: 'TCG-EVOSKIES-002',
        categoryId: categories[0].id,
        fandomId: fandoms[0].id
      }
    }),
    prisma.item.create({
      data: {
        name: 'Spider-Man Funko Pop',
        description: 'Marvel Spider-Man Funko Pop figure #03',
        cost: 12.00,
        quantity: 1,
        totalValue: 12.00,
        status: 'IN_STOCK',
        sku: 'FIG-SPIDERMAN-003',
        categoryId: categories[2].id,
        fandomId: fandoms[1].id
      }
    }),
    prisma.item.create({
      data: {
        name: 'Vintage Star Wars Pin Set',
        description: 'Set of 5 vintage Star Wars enamel pins',
        cost: 25.00,
        quantity: 0,
        totalValue: 0.00,
        status: 'NEEDS_RESTOCK',
        sku: 'PIN-STARWARS-004',
        categoryId: categories[1].id,
        fandomId: fandoms[2].id,
        notes: 'Very popular item - restock ASAP'
      }
    }),
    prisma.item.create({
      data: {
        name: 'Pokemon Card Binder',
        description: 'Ultra Pro 9-pocket binder with Pokemon design',
        cost: 8.00,
        quantity: 2,
        totalValue: 16.00,
        status: 'IN_STOCK',
        sku: 'ACC-BINDER-005',
        categoryId: categories[0].id,
        fandomId: fandoms[0].id
      }
    })
  ])

  // Create some sales records
  const sales = await Promise.all([
    prisma.sale.create({
      data: {
        platform: 'WHATNOT',
        soldPrice: 125.00,
        shippingCost: 5.00,
        materialsCost: 2.50,
        platformFeePercent: 12.0,
        platformFeeFlat: 0.30,
        saleDate: new Date('2024-01-15'),
        itemId: items[0].id,
        platformFeeTotal: 15.30, // (125 * 0.12) + 0.30
        breakEvenPrice: 72.80,   // 50 + 5 + 2.5 + 15.30
        netProfit: 52.20         // 125 - 50 - 5 - 2.5 - 15.30
      }
    }),
    prisma.sale.create({
      data: {
        platform: 'EBAY',
        soldPrice: 18.00,
        shippingCost: 1.50,
        materialsCost: 1.00,
        platformFeePercent: 10.0,
        platformFeeFlat: 0.30,
        saleDate: new Date('2024-01-14'),
        itemId: items[2].id,
        platformFeeTotal: 2.10,  // (18 * 0.10) + 0.30
        breakEvenPrice: 16.60,   // 12 + 1.5 + 1 + 2.10
        netProfit: 1.40          // 18 - 12 - 1.5 - 1 - 2.10
      }
    })
  ])

  // Update item quantities after sales
  await prisma.item.update({
    where: { id: items[0].id },
    data: { 
      quantity: 2,
      totalValue: 100.00
    }
  })

  await prisma.item.update({
    where: { id: items[2].id },
    data: { 
      quantity: 0,
      totalValue: 0.00,
      status: 'NEEDS_RESTOCK'
    }
  })

  // Create customer interests
  await Promise.all([
    prisma.customerInterest.create({
      data: {
        customerName: 'John Collector',
        username: 'johncollects',
        platform: 'WHATNOT',
        interestLevel: 'HOT',
        restockNeeded: true,
        followupStatus: 'WAITING',
        notes: 'Looking for mint condition Charizard',
        itemId: items[0].id
      }
    }),
    prisma.customerInterest.create({
      data: {
        customerName: 'Sarah Pokemon',
        username: 'pokemonsarah',
        platform: 'DISCORD',
        interestLevel: 'WARM',
        restockNeeded: false,
        followupStatus: 'RESPONDED',
        notes: 'Interested in booster packs',
        itemId: items[1].id
      }
    }),
    prisma.customerInterest.create({
      data: {
        customerName: 'Mike Vintage',
        username: 'vintagemike',
        platform: 'INSTAGRAM',
        interestLevel: 'HOT',
        restockNeeded: true,
        followupStatus: 'WAITING',
        notes: 'Wants the Star Wars pin set when back in stock',
        itemId: items[3].id
      }
    })
  ])

  console.log('✅ Database seeding completed!')
  console.log(`📦 Created ${categories.length} categories`)
  console.log(`🎯 Created ${fandoms.length} fandoms`)
  console.log(`🏪 Created ${vendors.length} vendors`)
  console.log(`📋 Created ${items.length} inventory items`)
  console.log(`💰 Created ${sales.length} sales records`)
  console.log(`❤️ Created 3 customer interests`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
