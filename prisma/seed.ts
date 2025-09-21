import { PrismaClient, UserRole, ProductCategory, VendorStatus, SubscriptionStatus } from '@prisma/client'
import { hashPassword, encrypt } from '../src/lib/security'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clean existing data in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...')
    await prisma.complianceEvent.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.productReview.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.order.deleteMany()
    await prisma.product.deleteMany()
    await prisma.vendor.deleteMany()
    await prisma.userToken.deleteMany()
    await prisma.userSubscription.deleteMany()
    await prisma.subscriptionPlan.deleteMany()
    await prisma.paymentMethod.deleteMany()
    await prisma.session.deleteMany()
    await prisma.account.deleteMany()
    await prisma.user.deleteMany()
    await prisma.systemConfig.deleteMany()
  }

  // Create system configuration
  console.log('⚙️ Creating system configuration...')
  await prisma.systemConfig.createMany({
    data: [
      {
        key: 'minimum_age',
        value: 18,
        description: 'Minimum age for cannabis purchases',
      },
      {
        key: 'delivery_radius',
        value: 50,
        description: 'Maximum delivery radius in kilometers',
      },
      {
        key: 'max_order_amount',
        value: 5000,
        description: 'Maximum order amount in ZAR',
      },
      {
        key: 'maintenance_mode',
        value: false,
        description: 'Enable maintenance mode',
      },
      {
        key: 'verification_required',
        value: true,
        description: 'Require SA ID verification',
      },
    ],
  })

  // Create subscription plans
  console.log('💳 Creating subscription plans...')
  const basicPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Basic',
      description: 'Basic access to the marketplace',
      price: 0,
      duration: 30,
      features: {
        maxOrders: 5,
        supportLevel: 'basic',
        features: ['product_browsing', 'basic_support'],
      },
    },
  })

  const premiumPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Premium',
      description: 'Premium features and priority support',
      price: 99,
      duration: 30,
      features: {
        maxOrders: 50,
        supportLevel: 'priority',
        features: ['product_browsing', 'priority_support', 'early_access', 'discounts'],
      },
    },
  })

  const vendorPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Vendor',
      description: 'Vendor access with selling capabilities',
      price: 299,
      duration: 30,
      features: {
        maxProducts: 100,
        supportLevel: 'premium',
        features: ['selling', 'analytics', 'marketing_tools', 'premium_support'],
      },
    },
  })

  // Create admin user
  console.log('👑 Creating admin user...')
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@biggbuzz.co.za',
      emailVerified: new Date(),
      phone: '+27123456789',
      phoneVerified: new Date(),
      saId: await encrypt('8001015009087'), // Fake SA ID for demo
      saIdVerified: new Date(),
      firstName: 'Admin',
      lastName: 'User',
      dateOfBirth: new Date('1980-01-01'),
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      address: {
        street: '123 Admin Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        country: 'South Africa',
      },
    },
  })

  // Create admin subscription
  await prisma.userSubscription.create({
    data: {
      userId: adminUser.id,
      planId: premiumPlan.id,
      status: SubscriptionStatus.ACTIVE,
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      autoRenew: false,
    },
  })

  // Create test customers
  console.log('👥 Creating test customers...')
  const customer1 = await prisma.user.create({
    data: {
      email: 'customer1@example.com',
      emailVerified: new Date(),
      phone: '+27821234567',
      phoneVerified: new Date(),
      saId: await encrypt('9001015009088'), // Fake SA ID for demo
      saIdVerified: new Date(),
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: new Date('1990-01-01'),
      role: UserRole.CUSTOMER,
      isActive: true,
      address: {
        street: '456 Customer Lane',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '2000',
        country: 'South Africa',
      },
    },
  })

  const customer2 = await prisma.user.create({
    data: {
      email: 'customer2@example.com',
      phone: '+27834567890',
      phoneVerified: new Date(),
      saId: await encrypt('8506235009089'), // Fake SA ID for demo
      saIdVerified: new Date(),
      firstName: 'Sarah',
      lastName: 'Johnson',
      dateOfBirth: new Date('1985-06-23'),
      role: UserRole.CUSTOMER,
      isActive: true,
      address: {
        street: '789 User Avenue',
        city: 'Durban',
        province: 'KwaZulu-Natal',
        postalCode: '4000',
        country: 'South Africa',
      },
    },
  })

  // Create customer subscriptions
  await prisma.userSubscription.createMany({
    data: [
      {
        userId: customer1.id,
        planId: basicPlan.id,
        status: SubscriptionStatus.ACTIVE,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      {
        userId: customer2.id,
        planId: premiumPlan.id,
        status: SubscriptionStatus.ACTIVE,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    ],
  })

  // Create test vendor
  console.log('🏪 Creating test vendor...')
  const vendorUser = await prisma.user.create({
    data: {
      email: 'vendor@greenleaf.co.za',
      emailVerified: new Date(),
      phone: '+27812345678',
      phoneVerified: new Date(),
      saId: await encrypt('7512115009090'), // Fake SA ID for demo
      saIdVerified: new Date(),
      firstName: 'Mike',
      lastName: 'Green',
      dateOfBirth: new Date('1975-12-11'),
      role: UserRole.VENDOR,
      isActive: true,
      address: {
        street: '321 Business Road',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        country: 'South Africa',
      },
    },
  })

  const vendor = await prisma.vendor.create({
    data: {
      userId: vendorUser.id,
      businessName: 'Green Leaf Dispensary',
      businessRegistration: 'CK2023/123456/23',
      businessType: 'DISPENSARY',
      description: 'Premium quality cannabis products for medical and recreational use',
      website: 'https://greenleaf.co.za',
      socialMedia: {
        instagram: '@greenleaf_sa',
        facebook: 'GreenLeafSA',
        twitter: '@greenleaf_za',
      },
      address: {
        street: '123 High Street',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        country: 'South Africa',
        latitude: -33.9249,
        longitude: 18.4241,
      },
      contactEmail: 'info@greenleaf.co.za',
      contactPhone: '+27216541234',
      status: VendorStatus.APPROVED,
      verifiedAt: new Date(),
      rating: 4.8,
      totalOrders: 156,
      totalRevenue: 78500.50,
    },
  })

  // Create vendor subscription
  await prisma.userSubscription.create({
    data: {
      userId: vendorUser.id,
      planId: vendorPlan.id,
      status: SubscriptionStatus.ACTIVE,
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  })

  // Create test products
  console.log('🌿 Creating test products...')
  const products = await prisma.product.createMany({
    data: [
      {
        vendorId: vendor.id,
        name: 'Purple Haze',
        description: 'Classic sativa-dominant strain with uplifting effects and berry aroma',
        category: ProductCategory.FLOWER,
        subCategory: 'Sativa',
        strain: 'Purple Haze',
        thcContent: 18.5,
        cbdContent: 0.8,
        indica: 20,
        sativa: 80,
        hybrid: 0,
        price: 150.00,
        stockQuantity: 100,
        unit: 'gram',
        minimumOrder: 1,
        images: [
          'https://example.com/images/purple-haze-1.jpg',
          'https://example.com/images/purple-haze-2.jpg',
        ],
        tags: ['sativa', 'uplifting', 'creative', 'energetic'],
        sku: 'GLD-PH-001',
        isActive: true,
        isVerified: true,
      },
      {
        vendorId: vendor.id,
        name: 'Northern Lights',
        description: 'Renowned indica strain perfect for relaxation and sleep',
        category: ProductCategory.FLOWER,
        subCategory: 'Indica',
        strain: 'Northern Lights',
        thcContent: 22.3,
        cbdContent: 1.2,
        indica: 95,
        sativa: 5,
        hybrid: 0,
        price: 180.00,
        stockQuantity: 75,
        unit: 'gram',
        minimumOrder: 1,
        images: [
          'https://example.com/images/northern-lights-1.jpg',
          'https://example.com/images/northern-lights-2.jpg',
        ],
        tags: ['indica', 'relaxing', 'sleep', 'pain-relief'],
        sku: 'GLD-NL-002',
        isActive: true,
        isVerified: true,
      },
      {
        vendorId: vendor.id,
        name: 'Space Cookies',
        description: 'Delicious cannabis-infused cookies with precise dosing',
        category: ProductCategory.EDIBLES,
        subCategory: 'Cookies',
        thcContent: 10.0,
        cbdContent: 2.0,
        price: 35.00,
        stockQuantity: 200,
        unit: 'piece',
        minimumOrder: 1,
        images: [
          'https://example.com/images/space-cookies-1.jpg',
        ],
        tags: ['edibles', 'cookies', 'long-lasting', 'precise-dosing'],
        sku: 'GLD-SC-003',
        isActive: true,
        isVerified: true,
      },
      {
        vendorId: vendor.id,
        name: 'CBD Pain Relief Balm',
        description: 'Topical balm for localized pain and inflammation relief',
        category: ProductCategory.TOPICALS,
        subCategory: 'Balm',
        thcContent: 0.0,
        cbdContent: 250.0,
        price: 120.00,
        stockQuantity: 50,
        unit: 'tube',
        minimumOrder: 1,
        images: [
          'https://example.com/images/cbd-balm-1.jpg',
        ],
        tags: ['topical', 'pain-relief', 'cbd', 'non-psychoactive'],
        sku: 'GLD-CBB-004',
        isActive: true,
        isVerified: true,
      },
    ],
  })

  // Get created products for reviews
  const createdProducts = await prisma.product.findMany({
    where: { vendorId: vendor.id },
  })

  // Create product reviews
  console.log('⭐ Creating product reviews...')
  await prisma.productReview.createMany({
    data: [
      {
        productId: createdProducts[0].id,
        userId: customer1.id,
        rating: 5,
        comment: 'Amazing quality and fast delivery. Highly recommended!',
        isVerified: true,
      },
      {
        productId: createdProducts[0].id,
        userId: customer2.id,
        rating: 4,
        comment: 'Good product, lived up to expectations.',
        isVerified: true,
      },
      {
        productId: createdProducts[1].id,
        userId: customer1.id,
        rating: 5,
        comment: 'Perfect for evening relaxation. Great potency.',
        isVerified: true,
      },
    ],
  })

  // Create compliance events
  console.log('📋 Creating compliance events...')
  await prisma.complianceEvent.createMany({
    data: [
      {
        userId: customer1.id,
        eventType: 'USER_REGISTRATION',
        description: 'User registered with SA ID verification',
        metadata: {
          registrationMethod: 'SA_ID',
          ageVerified: true,
        },
      },
      {
        userId: customer1.id,
        eventType: 'ID_VERIFICATION',
        description: 'SA ID verified successfully',
        metadata: {
          verificationMethod: 'SA_ID',
          ageConfirmed: true,
        },
      },
      {
        userId: vendorUser.id,
        eventType: 'USER_REGISTRATION',
        description: 'Vendor registered and verified',
        metadata: {
          businessType: 'DISPENSARY',
          verificationStatus: 'APPROVED',
        },
      },
    ],
  })

  console.log('✅ Database seeding completed successfully!')
  console.log('\n📊 Created:')
  console.log('- 1 Super Admin user')
  console.log('- 2 Customer users')
  console.log('- 1 Vendor user')
  console.log('- 3 Subscription plans')
  console.log('- 4 Products')
  console.log('- 3 Product reviews')
  console.log('- 5 System configurations')
  console.log('- 3 Compliance events')
  console.log('\n🔐 Admin Login:')
  console.log('Email: admin@biggbuzz.co.za')
  console.log('Phone: +27123456789')
  console.log('\n🛒 Test Customer:')
  console.log('Email: customer1@example.com')
  console.log('Phone: +27821234567')
  console.log('\n🏪 Test Vendor:')
  console.log('Email: vendor@greenleaf.co.za')
  console.log('Phone: +27812345678')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })