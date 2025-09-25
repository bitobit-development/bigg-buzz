#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestSubscriber() {
  try {
    console.log('Creating test subscriber...')

    const testPhone = '0823292438'
    const testSaId = '8408186222185'

    // Check if subscriber already exists
    const existingSubscriber = await prisma.subscriber.findUnique({
      where: { phone: testPhone }
    })

    if (existingSubscriber) {
      console.log('Test subscriber already exists:', existingSubscriber.id)
      return existingSubscriber
    }

    // Create the test subscriber
    const subscriber = await prisma.subscriber.create({
      data: {
        saId: testSaId,
        phone: testPhone,
        email: 'test@biggbuzz.com',
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: new Date('1984-08-18'),
        isActive: true,
        phoneVerified: true,
        emailVerified: false,
        isAdult: true,
        marketingConsent: false,
        termsAccepted: true,
        termsAcceptedDate: new Date(),
        privacyAccepted: true,
        privacyAcceptedDate: new Date(),

        // Create token balance
        tokenBalance: 50.0, // R50 welcome bonus

        // Profile data
        profile: {
          create: {
            preferredName: 'Test User',
            bio: 'Test account for SMS testing',
            preferences: {
              notifications: {
                sms: true,
                email: false,
                push: true
              },
              privacy: {
                showProfile: false,
                showPurchases: false
              }
            }
          }
        }
      },
      include: {
        profile: true
      }
    })

    // Create a token transaction for the welcome bonus
    await prisma.tokenTransaction.create({
      data: {
        subscriberId: subscriber.id,
        type: 'BONUS',
        amount: 50.0,
        balance: 50.0,
        description: 'Welcome bonus for test account',
        metadata: JSON.stringify({
          type: 'signup_bonus',
          automated: true,
          testAccount: true
        })
      }
    })

    console.log('Test subscriber created successfully!')
    console.log('ID:', subscriber.id)
    console.log('Phone:', subscriber.phone)
    console.log('SA ID:', subscriber.saId)
    console.log('Token Balance:', subscriber.tokenBalance)

    return subscriber

  } catch (error) {
    console.error('Error creating test subscriber:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  createTestSubscriber()
    .then(() => {
      console.log('Test subscriber setup completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Failed to create test subscriber:', error)
      process.exit(1)
    })
}

module.exports = { createTestSubscriber }