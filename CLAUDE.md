# Bigg Buzz - Cannabis Marketplace

## Project Overview
Bigg Buzz is a Next.js 15 cannabis marketplace platform for South Africa with comprehensive authentication, cart functionality, and admin management.

## Authentication System

### User Types
- **Subscribers**: End users who can browse products and make purchases
- **Admins**: Administrative users who can manage the platform

### Subscriber Authentication Flow
1. **Registration**: `/register` - SA ID verification with OTP
2. **Login**: `/sign-in` - Two-step process:
   - Enter SA ID + phone number
   - Verify SMS OTP code
   - JWT session created with secure cookies

### Test Credentials
- **SA ID**: 8408186222185
- **Phone**: 0823292438
- **Test OTP**: Available via `/api/auth/get-test-otp?phone=0823292438`

## Recent Fixes Completed (2025-09-23)

### 1. Authentication System Issues ✅
**Problem**: Sign-in page was non-functional, showing "development mode" message
**Solution**:
- Completely rewrote `/src/app/(auth)/sign-in/page.tsx` with proper OTP flow
- Fixed login endpoint `/src/app/api/auth/login/route.ts` to use existing OTP verification
- Integrated JWT token creation and secure cookie handling

### 2. Navigation Link Issues ✅
**Problem**: Header links pointed to `/login` (404) instead of `/sign-in`
**Solution**:
- Updated `src/components/layout/header.tsx:44` from `/login` → `/sign-in`
- Updated `src/app/(auth)/register/page.tsx:1082` from `/login` → `/sign-in`

### 3. Cart Store JSON Parsing Errors ✅
**Problem**: "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
**Solution**:
- Added try-catch blocks around all `response.json()` calls in `src/lib/stores/cart-store.ts`
- Graceful fallback for non-JSON error responses

### 4. Cart API 500 Errors ✅
**Problem**: Cart API returning 500 Internal Server Errors when adding items
**Solution**:
- Fixed JSON parsing issues in `src/app/api/cart/route.ts`
- Added proper error handling for malformed requests
- Fixed race conditions in cart item creation

## Current System Status

### ✅ Working Features
- User registration with SA ID verification
- SMS OTP verification via Clickatel
- JWT-based authentication with secure cookies
- User login with phone + OTP
- Cart functionality (add/remove/update items)
- Admin dashboard and user management
- Database operations with Prisma

### 🔧 Technical Stack
- **Framework**: Next.js 15 with App Router
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT tokens with HTTP-only cookies
- **SMS**: Clickatel integration for OTP
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand for cart and authentication

### 📁 Key Files
- **Authentication**:
  - `src/lib/auth/subscriber-auth.ts` - JWT token management
  - `src/app/api/auth/login/route.ts` - Login endpoint
  - `src/app/api/auth/send-otp/route.ts` - OTP sending
- **Cart System**:
  - `src/lib/stores/cart-store.ts` - Frontend cart state
  - `src/app/api/cart/route.ts` - Cart API endpoints
- **UI Components**:
  - `src/app/(auth)/sign-in/page.tsx` - Login page
  - `src/components/layout/header.tsx` - Navigation

## Development Commands

### Start Development Server
```bash
npm run dev
```

### Database Operations
```bash
npx prisma studio --port 5656    # Database GUI
npx prisma generate               # Regenerate client
npx prisma migrate dev            # Run migrations
```

### Testing Authentication
```bash
# Get test OTP for phone number
curl "http://localhost:3000/api/auth/get-test-otp?phone=0823292438"

# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0823292438","otp":"[OTP_CODE]"}'
```

## Next Development Notes
- All core authentication and cart functionality is working
- System is ready for product catalog implementation
- Admin system is functional for user management
- SMS integration is live and operational

---
*Last Updated: 2025-09-23 - Authentication & Cart System Fixes Complete*