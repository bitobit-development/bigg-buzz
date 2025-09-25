import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // Only enable query logging in development
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],

  // Vercel-specific optimizations
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },

  // Enhanced connection configuration for serverless
  __internal: undefined, // Remove any internal config that might cause issues
})

// Only cache Prisma client in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Add connection error handling
prisma.$on('error' as never, (e: any) => {
  console.error('Prisma Client Error:', e)
})

// Utility function to handle database connections with retry logic
export async function connectToDatabase(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect()
      console.log('Successfully connected to database')
      return
    } catch (error) {
      console.error(`Failed to connect to database (attempt ${i + 1}/${retries}):`, error)

      if (i === retries - 1) {
        throw error
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }
}

// Utility function to disconnect from database
export async function disconnectFromDatabase() {
  try {
    await prisma.$disconnect()
    console.log('Successfully disconnected from database')
  } catch (error) {
    console.error('Failed to disconnect from database:', error)
    throw error
  }
}

// Robust database operation wrapper with retry logic
export async function withDatabase<T>(
  operation: () => Promise<T>,
  retries = 2
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await operation()
      return result
    } catch (error: any) {
      console.error(`Database operation failed (attempt ${i + 1}/${retries}):`, error)

      // If it's a connection error, try to reconnect
      if (error?.code === 'P1001' || error?.code === 'P1008' || error?.message?.includes('connection')) {
        try {
          await prisma.$disconnect()
          await connectToDatabase(1)
        } catch (reconnectError) {
          console.error('Failed to reconnect:', reconnectError)
        }
      }

      if (i === retries - 1) {
        throw error
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }

  throw new Error('Database operation failed after all retries')
}