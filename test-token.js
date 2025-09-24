const { SignJWT } = require('jose');

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-jwt-secret-key-32-characters-minimum-length');

async function createTestToken() {
  const subscriber = {
    id: 'cmfw5806n0000ripuj1qhs2cu',
    firstName: 'Haim',
    lastName: 'Test',
    phone: '+27823292438',
    email: 'test@example.com',
    isActive: true,
    phoneVerified: true,
    termsAccepted: true
  };

  const token = new SignJWT({
    id: subscriber.id,
    firstName: subscriber.firstName,
    lastName: subscriber.lastName,
    phone: subscriber.phone,
    email: subscriber.email,
    isActive: subscriber.isActive,
    phoneVerified: subscriber.phoneVerified,
    termsAccepted: subscriber.termsAccepted,
    type: 'subscriber',
    iat: Math.floor(Date.now() / 1000),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .setIssuedAt();

  const jwtToken = await token.sign(JWT_SECRET);
  console.log('Bearer ' + jwtToken);
}

createTestToken().catch(console.error);