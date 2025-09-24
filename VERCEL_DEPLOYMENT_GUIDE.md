# 🚀 Bigg Buzz - Vercel Deployment Guide

## Overview
This guide walks you through deploying your Bigg Buzz cannabis marketplace to Vercel. Follow each step carefully to ensure a successful production deployment.

---

## ✅ Prerequisites Checklist

Before starting, ensure you have:
- [ ] Git repository pushed to GitHub
- [ ] Vercel account (free tier is fine)
- [ ] Production Clickatel API credentials
- [ ] Access to create a PostgreSQL database

---

## 📋 Step-by-Step Deployment

### **Step 1: Generate Secure Keys**

First, generate the required security keys. Run these commands in your terminal:

```bash
# Generate NextAuth secret (64 characters)
node -e "console.log('NEXTAUTH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT secret (64 characters)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption key (32 characters)
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(16).toString('hex'))"
```

**📝 Save these keys** - you'll need them in Step 4.

---

### **Step 2: Create Vercel Project**

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Repository**
   - Click "**New Project**"
   - Select "**Import Git Repository**"
   - Choose your `bigg-buzz` repository
   - Click "**Import**"

3. **Configure Project Settings**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm ci` (default)

4. **Don't deploy yet** - Click "**Skip deployment**" for now

---

### **Step 3: Set Up Database**

Choose **Option A** (recommended) or **Option B**:

#### **Option A: Vercel Postgres (Recommended)**

1. In your Vercel project dashboard:
   - Go to "**Storage**" tab
   - Click "**Create Database**"
   - Select "**Postgres**"
   - Choose a database name (e.g., `bigg-buzz-db`)
   - Select region: **Washington D.C.** (closest to South Africa)

2. **Copy Connection Details**
   - After creation, go to "**Settings**" tab in database
   - Copy the `DATABASE_URL` connection string
   - Save this for Step 4

#### **Option B: External Database Provider**

Use one of these providers:
- **Supabase**: [supabase.com](https://supabase.com) (free tier available)
- **Railway**: [railway.app](https://railway.app) (free tier available)
- **Neon**: [neon.tech](https://neon.tech) (free tier available)

Get your PostgreSQL connection string in this format:
```
postgresql://username:password@host:port/database?sslmode=require
```

---

### **Step 4: Configure Environment Variables**

1. **In Vercel Project Dashboard**:
   - Go to "**Settings**" → "**Environment Variables**"

2. **Add the following variables** (one by one):

```bash
# Database
DATABASE_URL=your-postgresql-connection-string-from-step-3

# Security Keys (from Step 1)
NEXTAUTH_SECRET=your-generated-nextauth-secret
JWT_SECRET=your-generated-jwt-secret
ENCRYPTION_KEY=your-generated-encryption-key

# URLs (replace with your actual Vercel domain)
NEXTAUTH_URL=https://your-project-name.vercel.app
NEXT_PUBLIC_APP_URL=https://your-project-name.vercel.app

# Clickatel SMS (Production credentials)
CLICKATEL_API_KEY=your-production-clickatel-api-key
CLICKATEL_FROM_NUMBER=+27123456789

# App Configuration
NEXT_PUBLIC_APP_NAME=Bigg Buzz
NEXT_PUBLIC_ENABLE_PWA=true
MINIMUM_AGE=18
REQUIRE_SA_ID_VERIFICATION=true

# Admin Configuration (optional)
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PHONE=+27123456789
```

3. **Set Environment** for each variable:
   - Select "**Production**", "**Preview**", and "**Development**"
   - Click "**Save**"

---

### **Step 5: Deploy to Vercel**

1. **Trigger Deployment**:
   - Go to "**Deployments**" tab
   - Click "**Create Deployment**"
   - Select "**main**" branch
   - Click "**Deploy**"

2. **Monitor Build Process**:
   - Watch the build logs for any errors
   - Build should complete in 2-5 minutes

3. **Get Your URL**:
   - Once successful, you'll get a URL like: `https://your-project-name.vercel.app`
   - **Save this URL** - you'll need it for the next step

---

### **Step 6: Update Environment URLs**

1. **Update URL Variables**:
   - Go back to "**Settings**" → "**Environment Variables**"
   - Update these variables with your actual Vercel URL:
     - `NEXTAUTH_URL` = `https://your-actual-domain.vercel.app`
     - `NEXT_PUBLIC_APP_URL` = `https://your-actual-domain.vercel.app`

2. **Redeploy**:
   - Go to "**Deployments**"
   - Click "**Redeploy**" on the latest deployment

---

### **Step 7: Set Up Production Database**

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Pull Environment Variables**:
   ```bash
   # In your project directory
   vercel login
   vercel link
   vercel env pull .env.local
   ```

3. **Run Database Migrations**:
   ```bash
   # Deploy database schema
   npx prisma migrate deploy

   # Generate Prisma client
   npx prisma generate
   ```

4. **Seed Production Data** (optional):
   ```bash
   # Run the production seed script
   npx tsx prisma/seed.prod.ts
   ```

---

### **Step 8: Test Your Deployment**

1. **Health Check**:
   - Visit: `https://your-domain.vercel.app/api/health`
   - Should return `{"status":"ok","timestamp":"..."}`

2. **Authentication Flow**:
   - Visit: `https://your-domain.vercel.app/register`
   - Test registration with SA ID: `8408186222185`
   - Test phone: `0823292438`

3. **Get Test OTP**:
   - Visit: `https://your-domain.vercel.app/api/auth/get-test-otp?phone=0823292438`
   - Use the returned OTP code

4. **Test Login**:
   - Visit: `https://your-domain.vercel.app/sign-in`
   - Login with phone + OTP from above

5. **Test Marketplace**:
   - After login, should redirect to `/marketplace`
   - Products should load correctly
   - Cart functionality should work

---

## 🧪 Production Testing Checklist

Test these critical features:

### **Authentication & Registration**
- [ ] Registration page loads
- [ ] SA ID validation works
- [ ] SMS OTP is sent (check phone)
- [ ] OTP verification completes registration
- [ ] R50 signup bonus is credited
- [ ] User profile is created

### **Login Process**
- [ ] Login page loads
- [ ] Phone number validation
- [ ] SMS OTP is sent
- [ ] OTP verification logs in user
- [ ] JWT session cookie is created
- [ ] Redirect to marketplace works

### **Marketplace Features**
- [ ] Marketplace page loads after login
- [ ] Products display correctly
- [ ] Product images load
- [ ] Add to cart functionality
- [ ] Cart updates correctly
- [ ] Token balance displays

### **Admin Features**
- [ ] Admin login works
- [ ] Dashboard displays stats
- [ ] User management functions
- [ ] Export functionality works

---

## 🚨 Troubleshooting Common Issues

### **Build Failures**

**Issue**: Build fails with Prisma errors
```bash
# Solution: Regenerate Prisma client
npx prisma generate
```

**Issue**: TypeScript compilation errors
```bash
# Solution: Check types
npm run type-check
```

### **Database Connection Issues**

**Issue**: "Can't reach database server"
- Verify `DATABASE_URL` format
- Ensure database is running
- Check firewall settings
- Confirm SSL mode if required

**Issue**: Migration failures
```bash
# Reset and redeploy migrations
npx prisma migrate reset --force
npx prisma migrate deploy
```

### **SMS/OTP Issues**

**Issue**: SMS not sending
- Verify `CLICKATEL_API_KEY` is production key
- Check phone number format (+27 for South Africa)
- Confirm Clickatel account has credits
- Test with: `/api/auth/get-test-otp?phone=0823292438`

### **Authentication Issues**

**Issue**: Login fails after successful OTP
- Check `JWT_SECRET` is set correctly
- Verify `NEXTAUTH_SECRET` is configured
- Ensure cookies are enabled in browser
- Check browser console for errors

### **Environment Variable Issues**

**Issue**: App not finding environment variables
- Verify all required variables are set
- Check they're set for "Production" environment
- Redeploy after adding new variables
- Use Vercel dashboard to verify values

---

## 📊 Performance Monitoring

### **Key URLs to Monitor**
- **Main App**: `https://your-domain.vercel.app`
- **Health Check**: `https://your-domain.vercel.app/api/health`
- **Auth Status**: `https://your-domain.vercel.app/api/auth/status`
- **Marketplace**: `https://your-domain.vercel.app/marketplace`

### **Vercel Dashboard Monitoring**
- **Functions**: Monitor API response times
- **Analytics**: Track user visits and performance
- **Logs**: Check for runtime errors

---

## ✨ Success! Your Cannabis Marketplace is Live

### **What You've Achieved**
✅ **Secure Authentication** - SA ID verification + SMS OTP
✅ **Real Database** - PostgreSQL with Prisma ORM
✅ **Production SMS** - Clickatel integration for South Africa
✅ **JWT Sessions** - Secure authentication with HTTP-only cookies
✅ **Complete Marketplace** - Product browsing and cart functionality
✅ **Admin Dashboard** - User management and analytics
✅ **R50 Signup Bonus** - Automatic token rewards
✅ **Mobile Optimized** - Responsive design for all devices

### **Share Your Live App**
Your Bigg Buzz cannabis marketplace is now live at:
**`https://your-domain.vercel.app`**

### **Test Credentials for Demo**
- **SA ID**: `8408186222185`
- **Phone**: `0823292438`
- **Test OTP**: Get via `/api/auth/get-test-otp?phone=0823292438`

---

## 🆘 Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Review this troubleshooting section
3. Test locally first with `npm run dev`
4. Verify environment variables are set correctly

**Your Bigg Buzz marketplace is ready for users!** 🎉