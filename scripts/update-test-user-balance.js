const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateTestUserBalance() {
  try {
    // Find the existing test subscriber with the test phone number
    const testSubscriber = await prisma.subscriber.findFirst({
      where: {
        phone: '0823292438' // Test user phone
      }
    });

    if (!testSubscriber) {
      console.log('Test subscriber not found');
      return;
    }

    console.log(`Found test subscriber: ${testSubscriber.firstName} ${testSubscriber.lastName}`);
    console.log(`Current balance: R${testSubscriber.tokenBalance}`);

    // Check if they already have a signup bonus transaction
    const existingBonus = await prisma.tokenTransaction.findFirst({
      where: {
        subscriberId: testSubscriber.id,
        type: 'BONUS',
        description: 'Welcome bonus for new subscribers'
      }
    });

    if (existingBonus) {
      console.log('Test subscriber already has signup bonus');
      return;
    }

    // Add R50 signup bonus
    const SIGNUP_BONUS = 50.00;
    const newBalance = testSubscriber.tokenBalance + SIGNUP_BONUS;

    // Update subscriber balance
    const updatedSubscriber = await prisma.subscriber.update({
      where: { id: testSubscriber.id },
      data: {
        tokenBalance: newBalance
      }
    });

    // Create token transaction record
    await prisma.tokenTransaction.create({
      data: {
        subscriberId: testSubscriber.id,
        type: 'BONUS',
        amount: SIGNUP_BONUS,
        balance: newBalance,
        description: 'Welcome bonus for new subscribers',
        status: 'COMPLETED',
        processedAt: new Date(),
        metadata: JSON.stringify({
          bonusType: 'SIGNUP_BONUS',
          amount: SIGNUP_BONUS,
          grantedAt: new Date().toISOString(),
          retroactive: true
        })
      }
    });

    console.log(`Updated test subscriber balance: R${newBalance}`);
    console.log('Signup bonus added successfully!');

  } catch (error) {
    console.error('Error updating test user balance:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTestUserBalance();