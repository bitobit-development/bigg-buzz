const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugOTPTokens() {
  try {
    console.log('🔍 Checking recent OTP tokens...\n');

    // Check subscriber tokens
    const subscriberTokens = await prisma.subscriberToken.findMany({
      where: {
        type: 'OTP_VERIFICATION',
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        subscriber: {
          select: {
            phone: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log('📱 Recent Subscriber OTP Tokens:');
    subscriberTokens.forEach((token, index) => {
      const phone = token.subscriber?.phone || 'Unknown';
      const name = token.subscriber ? `${token.subscriber.firstName} ${token.subscriber.lastName}` : 'Unknown';
      const expired = new Date() > new Date(token.expiresAt);

      console.log(`${index + 1}. Token: "${token.token}"`);
      console.log(`   Phone: ${phone}`);
      console.log(`   User: ${name}`);
      console.log(`   Created: ${token.createdAt}`);
      console.log(`   Expires: ${token.expiresAt}`);
      console.log(`   Used: ${token.isUsed}`);
      console.log(`   Expired: ${expired}`);
      console.log('');
    });

    // Check user tokens as fallback
    const userTokens = await prisma.userToken.findMany({
      where: {
        type: 'OTP_VERIFICATION',
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      include: {
        user: {
          select: {
            phone: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log('👤 Recent User OTP Tokens:');
    userTokens.forEach((token, index) => {
      const phone = token.user?.phone || 'Unknown';
      const name = token.user ? `${token.user.firstName} ${token.user.lastName}` : 'Unknown';
      const expired = new Date() > new Date(token.expiresAt);

      console.log(`${index + 1}. Token: "${token.token}"`);
      console.log(`   Phone: ${phone}`);
      console.log(`   User: ${name}`);
      console.log(`   Created: ${token.createdAt}`);
      console.log(`   Expires: ${token.expiresAt}`);
      console.log(`   Used: ${token.isUsed}`);
      console.log(`   Expired: ${expired}`);
      console.log('');
    });

    // Check if the specific test user exists
    const testUser = await prisma.subscriber.findUnique({
      where: { phone: '+27823292438' },
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
        isActive: true,
        phoneVerified: true
      }
    });

    console.log('🧪 Test User Status:');
    if (testUser) {
      console.log(`   Found: ${testUser.firstName} ${testUser.lastName}`);
      console.log(`   Phone: ${testUser.phone}`);
      console.log(`   Active: ${testUser.isActive}`);
      console.log(`   Phone Verified: ${testUser.phoneVerified}`);
      console.log(`   ID: ${testUser.id}`);
    } else {
      console.log('   ❌ Test user not found with phone +27823292438');

      // Check with other formats
      const variations = ['0823292438', '27823292438', '+27823292438'];
      for (const phone of variations) {
        const user = await prisma.subscriber.findUnique({
          where: { phone },
          select: { id: true, phone: true, firstName: true, lastName: true }
        });
        if (user) {
          console.log(`   ✅ Found with format "${phone}": ${user.firstName} ${user.lastName}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugOTPTokens();