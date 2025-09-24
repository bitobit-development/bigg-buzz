import { PrismaClient, UserRole } from '@prisma/client'
import { hashPassword, encrypt } from '../src/lib/security'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clean existing data in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...')
    await prisma.complianceEvent.deleteMany()
    await prisma.userToken.deleteMany()
    await prisma.user.deleteMany()
  }


  // Create admin user
  console.log('👑 Creating admin user...')
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@biggbuzz.co.za',
      emailVerified: new Date(),
      phone: '+27123456789',
      phoneVerified: new Date(),
      saId: await encrypt('8001015009087'), // Fake SA ID for demo
      firstName: 'Admin',
      lastName: 'User',
      dateOfBirth: new Date('1980-01-01'),
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      termsAccepted: true,
      termsAcceptedDate: new Date(),
      privacyAccepted: true,
      privacyAcceptedDate: new Date(),
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
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: new Date('1990-01-01'),
      role: UserRole.CUSTOMER,
      isActive: true,
      termsAccepted: true,
      termsAcceptedDate: new Date(),
      privacyAccepted: true,
      privacyAcceptedDate: new Date(),
    },
  })

  const customer2 = await prisma.user.create({
    data: {
      email: 'customer2@example.com',
      phone: '+27834567890',
      phoneVerified: new Date(),
      saId: await encrypt('8506235009089'), // Fake SA ID for demo
      firstName: 'Sarah',
      lastName: 'Johnson',
      dateOfBirth: new Date('1985-06-23'),
      role: UserRole.CUSTOMER,
      isActive: true,
      termsAccepted: true,
      termsAcceptedDate: new Date(),
      privacyAccepted: true,
      privacyAcceptedDate: new Date(),
    },
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
      firstName: 'Mike',
      lastName: 'Green',
      dateOfBirth: new Date('1975-12-11'),
      role: UserRole.VENDOR,
      isActive: true,
      termsAccepted: true,
      termsAcceptedDate: new Date(),
      privacyAccepted: true,
      privacyAcceptedDate: new Date(),
    },
  })

  // Create compliance events
  console.log('📋 Creating compliance events...')
  await prisma.complianceEvent.createMany({
    data: [
      {
        userId: customer1.id,
        eventType: 'USER_REGISTRATION',
        description: 'User registered with SA ID verification',
        metadata: JSON.stringify({
          registrationMethod: 'SA_ID',
          ageVerified: true,
        }),
      },
      {
        userId: customer1.id,
        eventType: 'ID_VERIFICATION',
        description: 'SA ID verified successfully',
        metadata: JSON.stringify({
          verificationMethod: 'SA_ID',
          ageConfirmed: true,
        }),
      },
      {
        userId: vendorUser.id,
        eventType: 'USER_REGISTRATION',
        description: 'Vendor registered and verified',
        metadata: JSON.stringify({
          businessType: 'DISPENSARY',
          verificationStatus: 'APPROVED',
        }),
      },
    ],
  })

  console.log('✅ Database seeding completed successfully!')
  console.log('\n📊 Created:')
  console.log('- 1 Super Admin user')
  console.log('- 2 Customer users')
  console.log('- 1 Vendor user')
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