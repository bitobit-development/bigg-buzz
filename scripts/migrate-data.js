const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

// PostgreSQL Production Database
const pgPrisma = new PrismaClient({
  datasourceUrl: "postgresql://neondb_owner:npg_0uvMgpKtXib1@ep-spring-feather-adff5uk4-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

// SQLite Database Connection
const sqliteDb = new sqlite3.Database('./prisma/dev.db');
const sqliteAll = promisify(sqliteDb.all.bind(sqliteDb));

async function migrateData() {
  try {
    console.log('🚀 Starting Data Migration from SQLite to PostgreSQL');
    console.log('=====================================================\n');

    // 1. Test connections
    console.log('1. Testing database connections...');
    await pgPrisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ PostgreSQL connection successful');

    const sqliteTest = await sqliteAll('SELECT 1 as test');
    console.log('✅ SQLite connection successful\n');

    // 2. Migrate Vendors
    console.log('2. Migrating vendors...');
    const sqliteVendors = await sqliteAll('SELECT * FROM vendors');
    console.log(`Found ${sqliteVendors.length} vendors in SQLite`);

    for (const vendor of sqliteVendors) {
      try {
        const existingVendor = await pgPrisma.vendor.findUnique({
          where: { licenseNumber: vendor.licenseNumber }
        });

        if (!existingVendor) {
          await pgPrisma.vendor.create({
            data: {
              id: vendor.id,
              name: vendor.name,
              email: vendor.email,
              phone: vendor.phone,
              address: vendor.address,
              isActive: Boolean(vendor.isActive),
              licenseNumber: vendor.licenseNumber,
              createdAt: new Date(vendor.createdAt),
              updatedAt: new Date(vendor.updatedAt)
            }
          });
          console.log(`✅ Migrated vendor: ${vendor.name}`);
        } else {
          console.log(`⏭️  Vendor already exists: ${vendor.name}`);
        }
      } catch (error) {
        console.log(`❌ Failed to migrate vendor ${vendor.name}:`, error.message);
      }
    }

    // 3. Migrate Products
    console.log('\\n3. Migrating products...');
    const sqliteProducts = await sqliteAll('SELECT * FROM products');
    console.log(`Found ${sqliteProducts.length} products in SQLite`);

    for (const product of sqliteProducts) {
      try {
        const existingProduct = await pgPrisma.product.findUnique({
          where: { sku: product.sku }
        });

        if (!existingProduct) {
          await pgPrisma.product.create({
            data: {
              id: product.id,
              name: product.name,
              description: product.description,
              price: product.price,
              category: product.category,
              strain: product.strain,
              thcContent: product.thcContent,
              cbdContent: product.cbdContent,
              weight: product.weight,
              inStock: Boolean(product.inStock),
              stockQuantity: product.stockQuantity,
              images: product.images,
              vendorId: product.vendorId,
              sku: product.sku,
              compliance: product.compliance,
              createdAt: new Date(product.createdAt),
              updatedAt: new Date(product.updatedAt)
            }
          });
          console.log(`✅ Migrated product: ${product.name}`);
        } else {
          console.log(`⏭️  Product already exists: ${product.name}`);
        }
      } catch (error) {
        console.log(`❌ Failed to migrate product ${product.name}:`, error.message);
      }
    }

    // 4. Migrate Subscribers
    console.log('\\n4. Migrating subscribers...');
    const sqliteSubscribers = await sqliteAll('SELECT * FROM subscribers');
    console.log(`Found ${sqliteSubscribers.length} subscribers in SQLite`);

    for (const subscriber of sqliteSubscribers) {
      try {
        const existingSubscriber = await pgPrisma.subscriber.findUnique({
          where: { phone: subscriber.phone }
        });

        if (!existingSubscriber) {
          await pgPrisma.subscriber.create({
            data: {
              id: subscriber.id,
              email: subscriber.email,
              emailVerified: subscriber.emailVerified ? new Date(subscriber.emailVerified) : null,
              phone: subscriber.phone,
              phoneVerified: subscriber.phoneVerified ? new Date(subscriber.phoneVerified) : null,
              saId: subscriber.saId,
              firstName: subscriber.firstName,
              lastName: subscriber.lastName,
              dateOfBirth: subscriber.dateOfBirth ? new Date(subscriber.dateOfBirth) : null,
              isActive: Boolean(subscriber.isActive),
              marketingConsent: Boolean(subscriber.marketingConsent),
              marketingConsentDate: subscriber.marketingConsentDate ? new Date(subscriber.marketingConsentDate) : null,
              termsAccepted: Boolean(subscriber.termsAccepted),
              termsAcceptedDate: subscriber.termsAcceptedDate ? new Date(subscriber.termsAcceptedDate) : null,
              privacyAccepted: Boolean(subscriber.privacyAccepted),
              privacyAcceptedDate: subscriber.privacyAcceptedDate ? new Date(subscriber.privacyAcceptedDate) : null,
              tokenBalance: subscriber.tokenBalance,
              createdAt: new Date(subscriber.createdAt),
              updatedAt: new Date(subscriber.updatedAt)
            }
          });
          console.log(`✅ Migrated subscriber: ${subscriber.firstName} ${subscriber.lastName}`);
        } else {
          console.log(`⏭️  Subscriber already exists: ${subscriber.firstName} ${subscriber.lastName}`);
        }
      } catch (error) {
        console.log(`❌ Failed to migrate subscriber ${subscriber.firstName} ${subscriber.lastName}:`, error.message);
      }
    }

    // 5. Migrate Token Transactions
    console.log('\\n5. Migrating token transactions...');
    const sqliteTransactions = await sqliteAll('SELECT * FROM token_transactions');
    console.log(`Found ${sqliteTransactions.length} token transactions in SQLite`);

    for (const transaction of sqliteTransactions) {
      try {
        const existingTransaction = await pgPrisma.tokenTransaction.findFirst({
          where: {
            subscriberId: transaction.subscriberId,
            amount: transaction.amount,
            createdAt: new Date(transaction.createdAt)
          }
        });

        if (!existingTransaction) {
          await pgPrisma.tokenTransaction.create({
            data: {
              id: transaction.id,
              subscriberId: transaction.subscriberId,
              orderId: transaction.orderId,
              type: transaction.type,
              amount: transaction.amount,
              balance: transaction.balance,
              reference: transaction.reference,
              description: transaction.description,
              metadata: transaction.metadata,
              createdAt: new Date(transaction.createdAt),
              processedAt: transaction.processedAt ? new Date(transaction.processedAt) : null,
              status: transaction.status
            }
          });
          console.log(`✅ Migrated transaction: ${transaction.type} - R${transaction.amount}`);
        } else {
          console.log(`⏭️  Transaction already exists: ${transaction.type} - R${transaction.amount}`);
        }
      } catch (error) {
        console.log(`❌ Failed to migrate transaction ${transaction.id}:`, error.message);
      }
    }

    // 6. Migrate Orders
    console.log('\\n6. Migrating orders...');
    const sqliteOrders = await sqliteAll('SELECT * FROM orders');
    console.log(`Found ${sqliteOrders.length} orders in SQLite`);

    for (const order of sqliteOrders) {
      try {
        const existingOrder = await pgPrisma.order.findUnique({
          where: { orderNumber: order.orderNumber }
        });

        if (!existingOrder) {
          await pgPrisma.order.create({
            data: {
              id: order.id,
              orderNumber: order.orderNumber,
              subscriberId: order.subscriberId,
              status: order.status,
              total: order.total,
              subtotal: order.subtotal,
              tax: order.tax,
              deliveryAddress: order.deliveryAddress,
              deliveryMethod: order.deliveryMethod,
              estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery) : null,
              actualDelivery: order.actualDelivery ? new Date(order.actualDelivery) : null,
              notes: order.notes,
              createdAt: new Date(order.createdAt),
              updatedAt: new Date(order.updatedAt)
            }
          });
          console.log(`✅ Migrated order: ${order.orderNumber}`);
        } else {
          console.log(`⏭️  Order already exists: ${order.orderNumber}`);
        }
      } catch (error) {
        console.log(`❌ Failed to migrate order ${order.orderNumber}:`, error.message);
      }
    }

    // 7. Migration Summary
    console.log('\\n7. Migration Summary');
    console.log('===================');

    const postMigrationCounts = {
      vendors: await pgPrisma.vendor.count(),
      products: await pgPrisma.product.count(),
      subscribers: await pgPrisma.subscriber.count(),
      orders: await pgPrisma.order.count(),
      tokenTransactions: await pgPrisma.tokenTransaction.count()
    };

    console.table(postMigrationCounts);

    console.log('\\n🎉 Data migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pgPrisma.$disconnect();
    sqliteDb.close();
  }
}

// Check if sqlite3 module is available
try {
  require('sqlite3');
  migrateData();
} catch (error) {
  console.error('❌ sqlite3 module not found. Installing...');
  console.log('Run: npm install sqlite3');
  console.log('Then run this script again.');
}