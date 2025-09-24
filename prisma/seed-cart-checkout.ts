import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCartCheckoutData() {
  console.log('🌱 Starting cart and checkout seed data...');

  try {
    // Create vendors
    console.log('Creating vendors...');
    const vendor1 = await prisma.vendor.upsert({
      where: { email: 'contact@greenvalley.com' },
      update: {},
      create: {
        name: "Green Valley Farms",
        email: "contact@greenvalley.com",
        phone: "+27-11-555-0123",
        address: "123 Cannabis St, Cape Town, South Africa",
        licenseNumber: "GVF-2024-001",
        isActive: true
      }
    });

    const vendor2 = await prisma.vendor.upsert({
      where: { email: 'orders@mountainhigh.com' },
      update: {},
      create: {
        name: "Mountain High Cannabis",
        email: "orders@mountainhigh.com",
        phone: "+27-21-555-0456",
        address: "456 High St, Durban, South Africa",
        licenseNumber: "MHC-2024-002",
        isActive: true
      }
    });

    console.log('✅ Vendors created');

    // Create products
    console.log('Creating products...');
    const products = await Promise.all([
      // Flower products
      prisma.product.upsert({
        where: { sku: 'BD-3.5G-001' },
        update: {},
        create: {
          name: "Blue Dream",
          description: "A balanced hybrid strain with sweet berry aroma and relaxing effects. Perfect for both day and evening use.",
          price: 250.00,
          category: "FLOWER",
          strain: "HYBRID",
          thcContent: 18.5,
          cbdContent: 0.5,
          weight: 3.5,
          stockQuantity: 50,
          sku: "BD-3.5G-001",
          vendorId: vendor1.id,
          images: JSON.stringify(["/images/blue-dream.jpg", "/images/blue-dream-2.jpg"]),
          compliance: JSON.stringify({
            tested: true,
            batchNumber: "BD240901",
            harvestDate: "2024-08-15",
            testResults: {
              pesticides: "pass",
              heavyMetals: "pass",
              microbials: "pass"
            }
          }),
          inStock: true
        }
      }),

      prisma.product.upsert({
        where: { sku: 'WW-7G-002' },
        update: {},
        create: {
          name: "White Widow",
          description: "Classic indica-dominant strain known for its potent effects and white crystalline appearance. Great for relaxation.",
          price: 480.00,
          category: "FLOWER",
          strain: "INDICA",
          thcContent: 22.0,
          cbdContent: 1.0,
          weight: 7.0,
          stockQuantity: 30,
          sku: "WW-7G-002",
          vendorId: vendor1.id,
          images: JSON.stringify(["/images/white-widow.jpg"]),
          compliance: JSON.stringify({
            tested: true,
            batchNumber: "WW240902",
            harvestDate: "2024-08-20"
          }),
          inStock: true
        }
      }),

      prisma.product.upsert({
        where: { sku: 'SH-1G-003' },
        update: {},
        create: {
          name: "Sour Haze",
          description: "Energizing sativa strain with citrus notes. Perfect for creative activities and social gatherings.",
          price: 180.00,
          category: "FLOWER",
          strain: "SATIVA",
          thcContent: 20.5,
          cbdContent: 0.3,
          weight: 1.0,
          stockQuantity: 75,
          sku: "SH-1G-003",
          vendorId: vendor2.id,
          images: JSON.stringify(["/images/sour-haze.jpg"]),
          compliance: JSON.stringify({
            tested: true,
            batchNumber: "SH240903"
          }),
          inStock: true
        }
      }),

      // Edibles
      prisma.product.upsert({
        where: { sku: 'GUM-10MG-004' },
        update: {},
        create: {
          name: "Strawberry Gummies",
          description: "Delicious strawberry-flavored gummies infused with premium cannabis extract. 10mg THC per piece.",
          price: 120.00,
          category: "EDIBLES",
          thcContent: 10.0,
          cbdContent: 2.0,
          stockQuantity: 100,
          sku: "GUM-10MG-004",
          vendorId: vendor1.id,
          images: JSON.stringify(["/images/strawberry-gummies.jpg"]),
          compliance: JSON.stringify({
            tested: true,
            batchNumber: "SG240904",
            dosage: "10mg THC per gummy"
          }),
          inStock: true
        }
      }),

      prisma.product.upsert({
        where: { sku: 'CHOC-25MG-005' },
        update: {},
        create: {
          name: "Dark Chocolate Bar",
          description: "Premium dark chocolate infused with cannabis. Rich, smooth taste with 25mg THC per piece.",
          price: 200.00,
          category: "EDIBLES",
          thcContent: 25.0,
          cbdContent: 5.0,
          stockQuantity: 40,
          sku: "CHOC-25MG-005",
          vendorId: vendor2.id,
          images: JSON.stringify(["/images/dark-chocolate.jpg"]),
          compliance: JSON.stringify({
            tested: true,
            batchNumber: "DC240905"
          }),
          inStock: true
        }
      }),

      // Concentrates
      prisma.product.upsert({
        where: { sku: 'WAX-1G-006' },
        update: {},
        create: {
          name: "Live Resin Wax",
          description: "High-quality live resin wax with exceptional flavor and potency. Extracted using premium methods.",
          price: 600.00,
          category: "CONCENTRATES",
          strain: "HYBRID",
          thcContent: 85.0,
          cbdContent: 2.0,
          weight: 1.0,
          stockQuantity: 15,
          sku: "WAX-1G-006",
          vendorId: vendor1.id,
          images: JSON.stringify(["/images/live-resin-wax.jpg"]),
          compliance: JSON.stringify({
            tested: true,
            batchNumber: "LRW240906",
            extractionMethod: "butane"
          }),
          inStock: true
        }
      }),

      // Accessories
      prisma.product.upsert({
        where: { sku: 'GRIND-MED-007' },
        update: {},
        create: {
          name: "Premium Grinder",
          description: "High-quality aluminum grinder with magnetic closure and pollen catcher. Perfect for consistent grinding.",
          price: 350.00,
          category: "ACCESSORIES",
          stockQuantity: 25,
          sku: "GRIND-MED-007",
          vendorId: vendor2.id,
          images: JSON.stringify(["/images/premium-grinder.jpg"]),
          compliance: JSON.stringify({
            material: "aluminum",
            size: "medium"
          }),
          inStock: true
        }
      }),

      // CBD Wellness products
      prisma.product.upsert({
        where: { sku: 'CBD-OIL-008' },
        update: {},
        create: {
          name: "CBD Relief Oil",
          description: "Pure CBD oil for wellness and relaxation. Third-party tested for quality and purity.",
          price: 450.00,
          category: "WELLNESS",
          thcContent: 0.3,
          cbdContent: 15.0,
          stockQuantity: 60,
          sku: "CBD-OIL-008",
          vendorId: vendor1.id,
          images: JSON.stringify(["/images/cbd-oil.jpg"]),
          compliance: JSON.stringify({
            tested: true,
            batchNumber: "CBD240907",
            volume: "30ml"
          }),
          inStock: true
        }
      })
    ]);

    console.log('✅ Products created');

    // Create test subscriber with token balance
    console.log('Creating test subscriber...');
    const testSubscriber = await prisma.subscriber.upsert({
      where: { email: 'test@biggbuzz.com' },
      update: {},
      create: {
        email: 'test@biggbuzz.com',
        emailVerified: new Date(),
        phone: '+27-83-555-1234',
        phoneVerified: new Date(),
        saId: 'encrypted_test_id_123',
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: new Date('1990-01-01'),
        isActive: true,
        marketingConsent: true,
        termsAccepted: true,
        privacyAccepted: true,
        tokenBalance: 1000.00 // Give test user 1000 tokens
      }
    });

    console.log('✅ Test subscriber created');

    // Create initial token transaction for the test subscriber
    console.log('Creating initial token transaction...');
    await prisma.tokenTransaction.create({
      data: {
        subscriberId: testSubscriber.id,
        type: 'DEPOSIT',
        amount: 1000.00,
        balance: 1000.00,
        description: 'Initial token deposit for testing',
        status: 'COMPLETED',
        processedAt: new Date()
      }
    });

    console.log('✅ Initial token transaction created');

    // Create a test cart with some items
    console.log('Creating test cart...');
    const testCart = await prisma.cart.create({
      data: {
        subscriberId: testSubscriber.id,
        items: {
          create: [
            {
              productId: products[0].id, // Blue Dream
              quantity: 2,
              priceAtAdd: products[0].price,
              variant: JSON.stringify({ size: '3.5g' })
            },
            {
              productId: products[3].id, // Strawberry Gummies
              quantity: 1,
              priceAtAdd: products[3].price
            }
          ]
        }
      }
    });

    console.log('✅ Test cart created');

    // Create a test order
    console.log('Creating test order...');
    const testOrder = await prisma.order.create({
      data: {
        orderNumber: `BZ${Date.now()}TEST`,
        subscriberId: testSubscriber.id,
        status: 'DELIVERED',
        subtotal: 370.00,
        tax: 37.00,
        total: 407.00,
        deliveryAddress: JSON.stringify({
          street: '123 Test Street',
          city: 'Cape Town',
          province: 'Western Cape',
          postalCode: '8001',
          country: 'South Africa'
        }),
        deliveryMethod: 'STANDARD',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        actualDelivery: new Date(),
        notes: 'Test order for development',
        items: {
          create: [
            {
              productId: products[0].id,
              quantity: 1,
              priceAtOrder: products[0].price,
              variant: JSON.stringify({ size: '3.5g' })
            },
            {
              productId: products[3].id,
              quantity: 1,
              priceAtOrder: products[3].price
            }
          ]
        },
        statusHistory: {
          create: [
            {
              status: 'PENDING',
              notes: 'Order created'
            },
            {
              status: 'CONFIRMED',
              notes: 'Payment processed'
            },
            {
              status: 'SHIPPED',
              notes: 'Order shipped'
            },
            {
              status: 'DELIVERED',
              notes: 'Order delivered successfully'
            }
          ]
        }
      }
    });

    // Create token transaction for the order
    await prisma.tokenTransaction.create({
      data: {
        subscriberId: testSubscriber.id,
        orderId: testOrder.id,
        type: 'PURCHASE',
        amount: -407.00,
        balance: 593.00,
        description: `Purchase order ${testOrder.orderNumber}`,
        status: 'COMPLETED',
        processedAt: new Date()
      }
    });

    // Update subscriber balance
    await prisma.subscriber.update({
      where: { id: testSubscriber.id },
      data: { tokenBalance: 593.00 }
    });

    console.log('✅ Test order created');

    console.log('🎉 Cart and checkout seed data completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Created ${await prisma.vendor.count()} vendors`);
    console.log(`- Created ${await prisma.product.count()} products`);
    console.log(`- Created ${await prisma.subscriber.count()} subscribers`);
    console.log(`- Created ${await prisma.cart.count()} carts`);
    console.log(`- Created ${await prisma.order.count()} orders`);
    console.log(`- Created ${await prisma.tokenTransaction.count()} token transactions`);

  } catch (error) {
    console.error('❌ Error seeding cart and checkout data:', error);
    throw error;
  }
}

// Run the seed function
seedCartCheckoutData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });