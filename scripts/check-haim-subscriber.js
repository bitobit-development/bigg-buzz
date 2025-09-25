#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkHaimSubscriber() {
  try {
    console.log('🔍 Looking for Haim Derazon subscriber...')

    // Search for subscribers with name containing "Haim"
    const subscribers = await prisma.subscriber.findMany({
      where: {
        OR: [
          { firstName: { contains: 'Haim', mode: 'insensitive' } },
          { lastName: { contains: 'Derazon', mode: 'insensitive' } },
          { firstName: { contains: 'haim', mode: 'insensitive' } },
          { lastName: { contains: 'derazon', mode: 'insensitive' } }
        ]
      }
    })

    console.log(`📊 Found ${subscribers.length} matching subscribers:`)

    subscribers.forEach((subscriber, index) => {
      console.log(`\n👤 Subscriber ${index + 1}:`)
      console.log(`   ID: ${subscriber.id}`)
      console.log(`   Name: ${subscriber.firstName} ${subscriber.lastName}`)
      console.log(`   Phone: ${subscriber.phone}`)
      console.log(`   Email: ${subscriber.email}`)
      console.log(`   SA ID: ${subscriber.saId}`)
      console.log(`   Active: ${subscriber.isActive}`)
      console.log(`   Phone Verified: ${subscriber.phoneVerified}`)
      console.log(`   Email Verified: ${subscriber.emailVerified}`)
      console.log(`   Terms Accepted: ${subscriber.termsAccepted}`)
      console.log(`   Token Balance: R${subscriber.tokenBalance}`)
      console.log(`   Created: ${subscriber.createdAt}`)
      console.log(`   Updated: ${subscriber.updatedAt}`)

      // Profile info not available in this query
    })

    // Also check all subscribers to see the complete list
    const allSubscribers = await prisma.subscriber.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        isActive: true,
        phoneVerified: true
      }
    })

    console.log(`\n📋 All subscribers in database (${allSubscribers.length} total):`)
    allSubscribers.forEach((sub, index) => {
      console.log(`   ${index + 1}. ${sub.firstName} ${sub.lastName} (${sub.phone}) - Active: ${sub.isActive}, Phone Verified: ${sub.phoneVerified}`)
    })

    return subscribers

  } catch (error) {
    console.error('❌ Error checking subscriber:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  checkHaimSubscriber()
    .then((subscribers) => {
      if (subscribers.length === 0) {
        console.log('\n⚠️  No matching subscribers found for "Haim Derazon"')
      }
      process.exit(0)
    })
    .catch((error) => {
      console.error('Failed to check subscriber:', error)
      process.exit(1)
    })
}

module.exports = { checkHaimSubscriber }