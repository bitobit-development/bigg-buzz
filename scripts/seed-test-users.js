const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedTestUsers() {
  console.log('🌱 Seeding test users...')

  try {
    // Create test users
    const testUsers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+27123456789',
        saId: '9001015009087',
        dateOfBirth: new Date('1990-01-01'),
        role: 'CUSTOMER',
        isActive: true,
        phoneVerified: new Date(),
        emailVerified: new Date(),
        termsAccepted: true,
        marketingConsent: true
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+27987654321',
        saId: '8505135009088',
        dateOfBirth: new Date('1985-05-13'),
        role: 'CUSTOMER',
        isActive: true,
        phoneVerified: null,
        emailVerified: null,
        termsAccepted: true,
        marketingConsent: false
      },
      {
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@example.com',
        phone: '+27555123456',
        saId: '7803085009089',
        dateOfBirth: new Date('1978-03-08'),
        role: 'VENDOR',
        isActive: false,
        phoneVerified: new Date(),
        emailVerified: new Date(),
        termsAccepted: true,
        marketingConsent: true
      },
      {
        firstName: 'Alice',
        lastName: 'Williams',
        email: 'alice.williams@example.com',
        phone: '+27444789123',
        saId: '9207125009090',
        dateOfBirth: new Date('1992-07-12'),
        role: 'CUSTOMER',
        isActive: true,
        phoneVerified: new Date(),
        emailVerified: null,
        termsAccepted: false,
        marketingConsent: true
      },
      {
        firstName: 'Charlie',
        lastName: 'Brown',
        email: 'charlie.brown@example.com',
        phone: '+27333456789',
        saId: '8810205009091',
        dateOfBirth: new Date('1988-10-20'),
        role: 'CUSTOMER',
        isActive: true,
        phoneVerified: null,
        emailVerified: new Date(),
        termsAccepted: true,
        marketingConsent: false
      }
    ]

    for (const userData of testUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      if (!existingUser) {
        const user = await prisma.user.create({
          data: userData
        })
        console.log(`✅ Created user: ${user.firstName} ${user.lastName} (${user.email})`)
      } else {
        console.log(`⏭️  User already exists: ${userData.email}`)
      }
    }

    console.log('🎉 Test users seeded successfully!')

    // Show summary
    const totalUsers = await prisma.user.count()
    const verifiedUsers = await prisma.user.count({
      where: { phoneVerified: { not: null } }
    })
    const activeUsers = await prisma.user.count({
      where: { isActive: true }
    })

    console.log(`📊 Database Summary:`)
    console.log(`   Total Users: ${totalUsers}`)
    console.log(`   Verified Users: ${verifiedUsers}`)
    console.log(`   Active Users: ${activeUsers}`)

  } catch (error) {
    console.error('❌ Error seeding test users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedTestUsers()