const { PrismaClient } = require('@prisma/client');

// PostgreSQL Production Database
const prisma = new PrismaClient({
  datasourceUrl: "postgresql://neondb_owner:npg_0uvMgpKtXib1@ep-spring-feather-adff5uk4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function testDatabaseOperations() {
  try {
    console.log('🧪 Testing PostgreSQL Database Operations');
    console.log('========================================\n');

    // 1. Test basic connectivity
    console.log('1. Testing database connectivity...');
    await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log('✅ Database connection successful\n');

    // 2. Test subscriber operations
    console.log('2. Testing subscriber operations...');

    // Find a subscriber
    const subscriber = await prisma.subscriber.findFirst({
      where: { phone: '+27823292438' }
    });
    console.log(`✅ Found subscriber: ${subscriber.firstName} ${subscriber.lastName} (Balance: R${subscriber.tokenBalance})`);

    // Test subscriber relationships
    const subscriberWithRelations = await prisma.subscriber.findUnique({
      where: { id: subscriber.id },
      include: {
        tokenTransactions: true,
        orders: true
      }
    });
    console.log(`✅ Subscriber has ${subscriberWithRelations.tokenTransactions.length} token transactions and ${subscriberWithRelations.orders.length} orders\n`);

    // 3. Test product operations
    console.log('3. Testing product operations...');

    const products = await prisma.product.findMany({
      where: { inStock: true },
      include: { vendor: true },
      take: 3
    });
    console.log(`✅ Found ${products.length} in-stock products:`);
    products.forEach((product, i) => {
      console.log(`   ${i + 1}. ${product.name} - R${product.price} (Stock: ${product.stockQuantity}) by ${product.vendor.name}`);
    });
    console.log();

    // 4. Test cart operations
    console.log('4. Testing cart operations...');

    // Create or find a test cart
    let testCart = await prisma.cart.findUnique({
      where: { subscriberId: subscriber.id }
    });

    if (!testCart) {
      testCart = await prisma.cart.create({
        data: {
          subscriberId: subscriber.id
        }
      });
      console.log(`✅ Created test cart: ${testCart.id}`);
    } else {
      console.log(`✅ Found existing cart: ${testCart.id}`);
    }

    // Add an item to cart (or update existing)
    let cartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: testCart.id,
          productId: products[0].id
        }
      }
    });

    if (!cartItem) {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: testCart.id,
          productId: products[0].id,
          quantity: 2,
          priceAtAdd: products[0].price,
          variant: null
        }
      });
      console.log(`✅ Added item to cart: ${products[0].name} x${cartItem.quantity}`);
    } else {
      cartItem = await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity: cartItem.quantity + 1 }
      });
      console.log(`✅ Updated cart item: ${products[0].name} x${cartItem.quantity}`);
    }

    // Get cart with items
    const cartWithItems = await prisma.cart.findUnique({
      where: { id: testCart.id },
      include: {
        items: {
          include: { product: true }
        }
      }
    });
    console.log(`✅ Cart contains ${cartWithItems.items.length} items\n`);

    // 5. Test order operations
    console.log('5. Testing order operations...');

    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        subscriber: {
          select: { firstName: true, lastName: true }
        }
      }
    });
    console.log(`✅ Found ${recentOrders.length} recent orders:`);
    recentOrders.forEach((order, i) => {
      console.log(`   ${i + 1}. ${order.orderNumber} - R${order.total} (${order.status}) by ${order.subscriber.firstName} ${order.subscriber.lastName}`);
    });
    console.log();

    // 6. Test token transaction operations
    console.log('6. Testing token transaction operations...');

    const tokenTransactions = await prisma.tokenTransaction.findMany({
      include: {
        subscriber: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`✅ Found ${tokenTransactions.length} token transactions:`);
    tokenTransactions.forEach((tx, i) => {
      console.log(`   ${i + 1}. ${tx.type}: R${tx.amount} (Balance: R${tx.balance}) - ${tx.subscriber.firstName} ${tx.subscriber.lastName}`);
    });
    console.log();

    // 7. Test complex queries
    console.log('7. Testing complex queries...');

    // Aggregation query
    const stats = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total_subscribers,
        COALESCE(SUM("tokenBalance"), 0) as total_token_balance,
        COUNT(CASE WHEN "isActive" = true THEN 1 END) as active_subscribers
      FROM subscribers
    `;
    console.log('✅ Database statistics:');
    console.log(`   - Total subscribers: ${stats[0].total_subscribers}`);
    console.log(`   - Total token balance: R${stats[0].total_token_balance}`);
    console.log(`   - Active subscribers: ${stats[0].active_subscribers}`);
    console.log();

    // Product category breakdown
    const categoryStats = await prisma.product.groupBy({
      by: ['category'],
      _count: { category: true },
      _avg: { price: true },
      _sum: { stockQuantity: true }
    });
    console.log('✅ Product category statistics:');
    categoryStats.forEach(stat => {
      console.log(`   - ${stat.category}: ${stat._count.category} products, Avg price: R${stat._avg.price?.toFixed(2)}, Total stock: ${stat._sum.stockQuantity}`);
    });
    console.log();

    // 8. Test performance with indexes
    console.log('8. Testing index performance...');

    const startTime = Date.now();
    await prisma.product.findMany({
      where: {
        inStock: true,
        stockQuantity: { gt: 10 }
      }
    });
    const queryTime = Date.now() - startTime;
    console.log(`✅ Index query completed in ${queryTime}ms`);
    console.log();

    // 9. Clean up test data
    console.log('9. Cleaning up test data...');
    if (cartItem) {
      await prisma.cartItem.delete({ where: { id: cartItem.id } });
      console.log('✅ Removed test cart item');
    }
    if (testCart) {
      // Only delete if cart is empty
      const remainingItems = await prisma.cartItem.count({
        where: { cartId: testCart.id }
      });
      if (remainingItems === 0) {
        await prisma.cart.delete({ where: { id: testCart.id } });
        console.log('✅ Removed empty test cart');
      } else {
        console.log('✅ Left cart with other items intact');
      }
    }
    console.log();

    // 10. Final health check
    console.log('10. Final database health check...');
    const healthCheck = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 5
    `;
    console.log('✅ Top 5 largest tables:');
    healthCheck.forEach((table, i) => {
      console.log(`   ${i + 1}. ${table.tablename}: ${table.size}`);
    });

    console.log('\n🎉 All database operations completed successfully!');
    console.log('✅ PostgreSQL production database is fully operational');

  } catch (error) {
    console.error('❌ Database operation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseOperations();