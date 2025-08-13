const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDelete() {
  try {
    // First, get an item count
    const count = await prisma.item.count();
    console.log(`Total items in database: ${count}`);
    
    // Get the first item
    const firstItem = await prisma.item.findFirst();
    if (firstItem) {
      console.log(`Found item: ${firstItem.name} (ID: ${firstItem.id})`);
      
      // Check if it has dependencies
      const itemWithDeps = await prisma.item.findUnique({
        where: { id: firstItem.id },
        include: {
          sales: true,
          customerInterests: true,
        }
      });
      
      console.log(`Sales: ${itemWithDeps.sales.length}, Interests: ${itemWithDeps.customerInterests.length}`);
      
      if (itemWithDeps.sales.length === 0 && itemWithDeps.customerInterests.length === 0) {
        console.log('Item has no dependencies - can test hard delete');
        // We won't actually delete, just test the query structure
        console.log('DELETE query would be: DELETE FROM Item WHERE id = ?', firstItem.id);
      } else {
        console.log('Item has dependencies - would do soft delete');
        console.log('UPDATE query would be: UPDATE Item SET status = "DISCONTINUED" WHERE id = ?', firstItem.id);
      }
    } else {
      console.log('No items found in database');
    }
    
  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDelete();
