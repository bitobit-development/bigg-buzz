const { PrismaClient } = require('@prisma/client');

// Initialize Prisma with PostgreSQL production database
const prisma = new PrismaClient({
  datasourceUrl: "postgresql://neondb_owner:npg_0uvMgpKtXib1@ep-spring-feather-adff5uk4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function auditDatabase() {
  try {
    console.log('🔍 Database Migration Audit - PostgreSQL Production Database');
    console.log('==============================================================\n');

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
    console.log('\n3. Checking critical data...');

    const subscribers = await prisma.subscriber.findMany({
      select: { id: true, firstName: true, lastName: true, phone: true, tokenBalance: true, createdAt: true }
    });
    console.log('Subscribers:', subscribers);

    const vendors = await prisma.vendor.findMany({
      select: { id: true, name: true, email: true, licenseNumber: true, createdAt: true }
    });
    console.log('Vendors:', vendors);

    const products = await prisma.product.findMany({
      select: { id: true, name: true, category: true, price: true, sku: true, inStock: true, stockQuantity: true }
    });
    console.log('Products:', products);

    const orders = await prisma.order.findMany({
      select: { id: true, orderNumber: true, status: true, total: true, createdAt: true }
    });
    console.log('Orders:', orders);

    const tokenTransactions = await prisma.tokenTransaction.findMany({
      select: { id: true, type: true, amount: true, balance: true, status: true, createdAt: true }
    });
    console.log('Token Transactions:', tokenTransactions);

  } catch (error) {
    console.error('❌ Database audit error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditDatabase();