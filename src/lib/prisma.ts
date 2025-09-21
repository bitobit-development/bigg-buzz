import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Utility function to handle database connections
export async function connectToDatabase() {
  try {
    await prisma.$connect()
    console.log('Successfully connected to database')
  } catch (error) {
    console.error('Failed to connect to database:', error)
    throw error
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