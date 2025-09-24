import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import { validateSAID } from '@/lib/validation'
import { sendOTP, verifyOTP } from '@/lib/sms'
import bcrypt from 'bcryptjs'
import { User, UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email?: string | null
      phone?: string | null
      firstName?: string | null
      lastName?: string | null
      role: UserRole
      isActive: boolean
      saIdVerified: boolean
      phoneVerified: boolean
      emailVerified: boolean
    }
  }

  interface User {
    id: string
    email?: string | null
    phone?: string | null
    firstName?: string | null
    lastName?: string | null
    role: UserRole
    isActive: boolean
    saIdVerified: boolean
    phoneVerified: boolean
    emailVerified: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    isActive: boolean
    saIdVerified: boolean
    phoneVerified: boolean
    emailVerified: boolean
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // SA ID + Mobile OTP Provider
    CredentialsProvider({
      id: 'sa-mobile',
      name: 'SA ID + Mobile',
      credentials: {
        saId: { label: 'SA ID Number', type: 'text' },
        phone: { label: 'Mobile Number', type: 'tel' },
        otp: { label: 'OTP Code', type: 'text' },
        firstName: { label: 'First Name', type: 'text' },
        lastName: { label: 'Last Name', type: 'text' },
        action: { label: 'Action', type: 'text' }, // 'register', 'login', 'verify'
      },
      async authorize(credentials) {
        if (!credentials) return null

        const { saId, phone, otp, firstName, lastName, action } = credentials

        try {
          // Validate SA ID format
          if (!validateSAID(saId)) {
            throw new Error('Invalid South African ID number')
          }

          // Handle different actions
          switch (action) {
            case 'register':
              return await handleRegistration({
                saId,
                phone,
                firstName,
                lastName,
              })

            case 'login':
              return await handleLogin({ saId, phone })

            case 'verify':
              return await handleOTPVerification({ saId, phone, otp })

            default:
              throw new Error('Invalid action')
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),

    // Email + Password Provider (for admin/vendor accounts)
    CredentialsProvider({
      id: 'email-password',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user || !user.isActive) return null

          // Check if user has a password (admin/vendor accounts)
          // Note: Regular customers use SA ID + OTP, not passwords
          if (user.role === 'CUSTOMER') {
            throw new Error('Customers must use SA ID + Mobile verification')
          }

          // For demo purposes, we'll assume password is stored
          // In production, you'd have a separate password field
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.email || '' // Placeholder - implement proper password storage
          )

          if (!isValidPassword) return null

          return {
            id: user.id,
            email: user.email,
            phone: user.phone,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            saIdVerified: !!user.saId,
            phoneVerified: !!user.phoneVerified,
            emailVerified: !!user.emailVerified,
          }
        } catch (error) {
          console.error('Email auth error:', error)
          return null
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.isActive = user.isActive
        token.saIdVerified = !!(user as any).saId
        token.phoneVerified = !!(user as any).phoneVerified
        token.emailVerified = !!(user as any).emailVerified
      }

      // Log compliance event
      if (account) {
        await logComplianceEvent({
          userId: token.id,
          eventType: 'LOGIN_ATTEMPT',
          description: `User logged in via ${account.provider}`,
          metadata: {
            provider: account.provider,
            timestamp: new Date().toISOString(),
          },
        })
      }

      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.isActive = token.isActive
        session.user.saIdVerified = token.saIdVerified
        session.user.phoneVerified = token.phoneVerified
        session.user.emailVerified = token.emailVerified
      }

      return session
    },

    async signIn({ user, account, profile }) {
      // Check if user is active
      if (!user.isActive) {
        return false
      }

      // For Google sign-in, link to existing SA ID verified account if possible
      if (account?.provider === 'google' && profile?.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email },
        })

        if (existingUser && !existingUser.isActive) {
          return false
        }
      }

      return true
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      await logComplianceEvent({
        userId: user.id,
        eventType: 'LOGIN_ATTEMPT',
        description: `Successful sign in via ${account?.provider}`,
        metadata: {
          provider: account?.provider,
          isNewUser,
          timestamp: new Date().toISOString(),
        },
      })
    },

    async signOut({ session, token }) {
      if (token?.id) {
        await logComplianceEvent({
          userId: token.id,
          eventType: 'LOGIN_ATTEMPT',
          description: 'User signed out',
          metadata: {
            timestamp: new Date().toISOString(),
          },
        })
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
}

// Helper functions
async function handleRegistration({
  saId,
  phone,
  firstName,
  lastName,
}: {
  saId: string
  phone: string
  firstName: string
  lastName: string
}) {
  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ saId }, { phone }],
    },
  })

  if (existingUser) {
    throw new Error('User with this SA ID or phone number already exists')
  }

  // Create new user
  const newUser = await prisma.user.create({
    data: {
      saId,
      phone,
      firstName,
      lastName,
      role: 'CUSTOMER',
      isActive: true,
    },
  })

  // Send OTP for phone verification
  await sendOTP(phone)

  // Log compliance event
  await logComplianceEvent({
    userId: newUser.id,
    eventType: 'USER_REGISTRATION',
    description: 'New user registered with SA ID',
    metadata: {
      saId: saId.substring(0, 6) + '****', // Mask SA ID for privacy
      phone: phone.substring(0, 3) + '***' + phone.substring(phone.length - 2),
    },
  })

  return {
    id: newUser.id,
    email: newUser.email,
    phone: newUser.phone,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    role: newUser.role,
    isActive: newUser.isActive,
    saIdVerified: false,
    phoneVerified: false,
    emailVerified: false,
  }
}

async function handleLogin({ saId, phone }: { saId: string; phone: string }) {
  const user = await prisma.user.findFirst({
    where: {
      AND: [{ saId }, { phone }, { isActive: true }],
    },
  })

  if (!user) {
    throw new Error('User not found or inactive')
  }

  // Send OTP for login verification
  await sendOTP(phone)

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    saIdVerified: !!user.saId,
    phoneVerified: false, // Will be verified after OTP
    emailVerified: !!user.emailVerified,
  }
}

async function handleOTPVerification({
  saId,
  phone,
  otp,
}: {
  saId: string
  phone: string
  otp: string
}) {
  // Verify OTP
  const isValidOTP = await verifyOTP(phone, otp)

  if (!isValidOTP) {
    throw new Error('Invalid or expired OTP')
  }

  // Find and update user
  const user = await prisma.user.findFirst({
    where: {
      AND: [{ saId }, { phone }],
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Update phone verification status
  await prisma.user.update({
    where: { id: user.id },
    data: {
      phoneVerified: new Date(),
    },
  })

  // Log compliance event
  await logComplianceEvent({
    userId: user.id,
    eventType: 'LOGIN_ATTEMPT',
    description: 'Phone number verified via OTP',
    metadata: {
      phone: phone.substring(0, 3) + '***' + phone.substring(phone.length - 2),
    },
  })

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    saIdVerified: !!user.saId,
    phoneVerified: true,
    emailVerified: !!user.emailVerified,
  }
}

async function logComplianceEvent({
  userId,
  eventType,
  description,
  metadata = {},
}: {
  userId: string
  eventType: any
  description: string
  metadata?: any
}) {
  try {
    await prisma.complianceEvent.create({
      data: {
        userId,
        eventType,
        description,
        metadata,
      },
    })
  } catch (error) {
    console.error('Failed to log compliance event:', error)
  }
}