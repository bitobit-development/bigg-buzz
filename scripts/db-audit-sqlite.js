const { PrismaClient } = require('@prisma/client');

// Initialize Prisma with SQLite development database
const prisma = new PrismaClient({
  datasourceUrl: "file:./prisma/dev.db"
});

async function auditSQLiteDatabase() {
  try {
    console.log('🔍 Database Migration Audit - SQLite Development Database');
    console.log('===========================================================\n');

    // Test database connection
    console.log('1. Testing database connection...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful\n');

    // Get table counts
    console.log('2. Checking table record counts...');
    const tables = [
      'subscribers',
      'users',
      'vendors',
      'products',
      'carts',
      'cart_items',
      'orders',
      'order_items',
      'token_transactions',
      'subscriber_tokens',
      'user_tokens',
      'compliance_events',
      'pending_admin_registrations',
      'order_status_history'
    ];

    const counts = {};
    for (const table of tables) {
      try {
        const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${table}`);
        counts[table] = parseInt(result[0].count);
      } catch (error) {
        counts[table] = `Error: ${error.message}`;
      }
    }

    console.table(counts);

    // Check specific data
    console.log('\n3. Detailed data inspection...');

    const subscribers = await prisma.subscriber.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        tokenBalance: true,
        createdAt: true
      }
    });
    console.log('\nSubscribers:');
    subscribers.forEach((sub, i) => {
      console.log(`  ${i + 1}. ${sub.firstName} ${sub.lastName} (${sub.phone}) - Balance: R${sub.tokenBalance}`);
    });

    const vendors = await prisma.vendor.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        licenseNumber: true,
        createdAt: true
      }
    });
    console.log('\nVendors:');
    vendors.forEach((vendor, i) => {
      console.log(`  ${i + 1}. ${vendor.name} (${vendor.email}) - License: ${vendor.licenseNumber}`);
    });

    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        sku: true,
        inStock: true,
        stockQuantity: true
      }
    });
    console.log('\nProducts:');
    products.forEach((product, i) => {
      console.log(`  ${i + 1}. ${product.name} - R${product.price} (${product.category}) - Stock: ${product.stockQuantity}`);
    });

    const orders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        subscriber: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    console.log('\nOrders:');
    orders.forEach((order, i) => {
      console.log(`  ${i + 1}. ${order.orderNumber} - R${order.total} (${order.status}) by ${order.subscriber.firstName} ${order.subscriber.lastName}`);
    });

    const tokenTransactions = await prisma.tokenTransaction.findMany({
      select: {
        id: true,
        type: true,
        amount: true,
        balance: true,
        status: true,
        createdAt: true,
        subscriber: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    console.log('\nToken Transactions:');
    tokenTransactions.forEach((tx, i) => {
      console.log(`  ${i + 1}. ${tx.type} - R${tx.amount} (Balance: R${tx.balance}) - ${tx.subscriber.firstName} ${tx.subscriber.lastName}`);
    });

    // Check carts
    const carts = await prisma.cart.findMany({
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                price: true
              }
            }
          }
        },
        subscriber: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    console.log('\nCarts:');
    carts.forEach((cart, i) => {
      console.log(`  ${i + 1}. ${cart.subscriber.firstName} ${cart.subscriber.lastName}'s cart (${cart.items.length} items)`);
      cart.items.forEach((item, j) => {
        console.log(`    - ${item.product.name} x${item.quantity} @ R${item.priceAtAdd}`);
      });
    });

  } catch (error) {
    console.error('❌ Database audit error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditSQLiteDatabase();