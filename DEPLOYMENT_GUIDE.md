# Bigg Buzz - Vercel Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Prerequisites
- Vercel account
- GitHub repository access
- Clickatel SMS API key (production)
- PostgreSQL database (Vercel Postgres recommended)

### 2. Database Setup

#### Option A: Vercel Postgres (Recommended)
1. Go to your Vercel dashboard
2. Navigate to Storage > Create Database
3. Select PostgreSQL
4. Copy the connection string

#### Option B: External PostgreSQL
- Use any PostgreSQL provider (Railway, Supabase, AWS RDS, etc.)
- Ensure connection string is properly formatted

### 3. Vercel Environment Variables

Add these environment variables in your Vercel project settings:

```bash
# Database
DATABASE_URL="your-postgresql-connection-string"

# Authentication & Security (GENERATE NEW KEYS)
NEXTAUTH_SECRET="generate-a-64-character-random-string"
JWT_SECRET="generate-a-64-character-jwt-secret-key"
ENCRYPTION_KEY="generate-a-32-character-encryption-key"

# App URLs (Replace with your domain)
NEXTAUTH_URL="https://your-app-name.vercel.app"
NEXT_PUBLIC_APP_URL="https://your-app-name.vercel.app"
NEXT_PUBLIC_APP_NAME="Bigg Buzz"

# SMS Service - Clickatel (PRODUCTION KEYS)
CLICKATEL_API_KEY="your-production-clickatel-api-key"
CLICKATEL_FROM_NUMBER="+27123456789"

# Feature Flags
NEXT_PUBLIC_ENABLE_PWA="true"
NEXT_PUBLIC_ENABLE_NOTIFICATIONS="true"

# Application Settings
MINIMUM_AGE="18"
REQUIRE_SA_ID_VERIFICATION="true"
NODE_ENV="production"

# Security Configuration
CORS_ORIGIN="https://your-app-name.vercel.app"
SESSION_TIMEOUT="86400000"
TOKEN_EXPIRY="7776000"

# Logging
LOG_LEVEL="error"
```

### 4. Deploy to Vercel

#### Option A: GitHub Integration (Recommended)
1. Push your code to GitHub
2. Connect GitHub repository to Vercel
3. Vercel will auto-deploy on push

#### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 5. Post-Deployment Database Setup

After deployment, run database migrations:

```bash
# Option A: Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy
npx tsx prisma/seed.prod.ts

# Option B: Via Vercel Functions (if you have admin access)
# Call the API endpoint: /api/admin/setup-database
```

### 6. Domain Configuration (Optional)

1. In Vercel dashboard, go to Settings > Domains
2. Add your custom domain
3. Update environment variables with new domain:
   - `NEXTAUTH_URL`
   - `NEXT_PUBLIC_APP_URL`
   - `CORS_ORIGIN`

## 🔐 Security Checklist

### Required Secret Generation
```bash
# Generate secure secrets (use in terminal)
node -e "console.log('NEXTAUTH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(16).toString('hex'))"
```

### Environment Variable Security
- ✅ All secrets are properly generated and unique
- ✅ Production Clickatel API key is configured
- ✅ Database connection string is secure
- ✅ CORS origin is set to your domain only
- ✅ NextAuth URL matches your production domain

## 🧪 Testing Production Deployment

### 1. Authentication Flow
- [ ] User registration with SA ID
- [ ] SMS OTP verification
- [ ] Login with phone + OTP
- [ ] JWT session management

### 2. Core Features
- [ ] Marketplace product browsing
- [ ] Add to cart functionality
- [ ] Cart management
- [ ] Checkout process
- [ ] Admin dashboard access
- [ ] User management

### 3. API Endpoints
- [ ] `/api/auth/register` - User registration
- [ ] `/api/auth/send-otp` - OTP sending
- [ ] `/api/auth/verify-otp` - OTP verification
- [ ] `/api/cart` - Cart operations
- [ ] `/api/products` - Product listing
- [ ] `/api/admin/*` - Admin functions

## 🚨 Common Issues & Solutions

### Database Connection Issues
```bash
# Check if DATABASE_URL is correctly set
# Ensure PostgreSQL connection string format:
# postgresql://username:password@host:port/database
```

### Build Failures
```bash
# Prisma generation issues
npm run db:generate

# Type checking issues
npm run type-check
```

### SMS/OTP Issues
- Verify Clickatel API key is production-ready
- Check phone number format (+27 prefix for South Africa)
- Ensure sufficient Clickatel credits

## 📊 Production Monitoring

### Health Check Endpoints
- `/api/health` - Application health
- `/api/auth/status` - Authentication status
- `/marketplace` - Main application

### Logs & Debugging
- Vercel Function logs in dashboard
- Browser console for client-side issues
- Database query logs via Prisma

## 🔄 Continuous Deployment

### Auto-deploy Setup
1. Connect GitHub repository to Vercel
2. Enable auto-deploy on main branch
3. Set up branch previews for development

### Database Migrations
```bash
# Run migrations after code deployment
npx prisma migrate deploy

# Update production data if needed
npx tsx prisma/seed.prod.ts
```

---

## 📞 Support

If you encounter issues during deployment:
1. Check Vercel build logs
2. Verify all environment variables are set
3. Test database connectivity
4. Confirm SMS API credentials

**Production URL**: https://your-app-name.vercel.app