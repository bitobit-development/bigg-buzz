# Bigg Buzz Backend Infrastructure

## Overview

Complete backend infrastructure for the Bigg Buzz Cannabis Marketplace, featuring authentication, payment processing, compliance tracking, and comprehensive API routes.

## 🏗️ Architecture

### Database Schema
- **PostgreSQL** with Prisma ORM
- **Comprehensive schema** covering users, vendors, products, orders, payments, and compliance
- **Soft deletes** for compliance requirements
- **Performance indexes** for optimal query performance
- **Audit trail** with compliance events

### Authentication System
- **NextAuth.js** with custom providers
- **SA ID validation** using Luhn algorithm
- **Mobile OTP verification** via Clickatel/Twilio
- **Role-based access control** (Customer, Vendor, Admin, Super Admin)
- **JWT tokens** with 90-day expiration
- **Session management** with security best practices

### Security Features
- **Data encryption** for sensitive information (SA ID numbers)
- **Rate limiting** with configurable windows
- **CORS protection** with origin validation
- **Input validation** and sanitization
- **Security headers** (CSP, HSTS, etc.)
- **Audit logging** for compliance

## 📁 Project Structure

```
src/
├── app/
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/
│       │   ├── register/
│       │   ├── send-otp/
│       │   └── verify-otp/
│       ├── products/
│       └── users/
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Database client
│   ├── validation.ts     # SA ID validation & schemas
│   ├── sms.ts           # SMS/OTP services
│   ├── security.ts      # Encryption & JWT utils
│   ├── rate-limit.ts    # Rate limiting logic
│   ├── logger.ts        # Structured logging
│   └── error-handler.ts # Error handling
├── middleware.ts        # Global middleware
└── types/              # TypeScript types

prisma/
├── schema.prisma       # Database schema
└── seed.ts            # Development seed data
```

## 🚀 Quick Start

### 1. Run Setup Script
```bash
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh
```

### 2. Configure Environment Variables
Update `.env.local` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/bigg_buzz"

# Authentication
NEXTAUTH_SECRET="your-generated-secret"
JWT_SECRET="your-generated-secret"
ENCRYPTION_KEY="your-generated-key"

# Payment Gateways
PEACH_ENTITY_ID="your-peach-entity-id"
PAYFAST_MERCHANT_ID="your-payfast-merchant-id"
OZOW_SITE_CODE="your-ozow-site-code"

# SMS Services
CLICKATEL_API_KEY="your-clickatel-key"
TWILIO_ACCOUNT_SID="your-twilio-sid"

# Other Services
RESEND_API_KEY="your-resend-key"
CLOUDINARY_API_KEY="your-cloudinary-key"
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```

## 🔐 Authentication Flow

### SA ID + Mobile Registration
1. User enters SA ID number and mobile number
2. System validates SA ID using Luhn algorithm
3. Extracts age/gender from SA ID (compliance requirement)
4. Sends OTP to mobile number
5. User verifies OTP to complete registration

### Login Process
1. User enters SA ID and mobile number
2. System validates credentials
3. Sends OTP for verification
4. User enters OTP to authenticate
5. JWT token issued with 90-day expiration

### Role-Based Access
- **Customer**: Basic marketplace access
- **Vendor**: Product management and sales
- **Admin**: User and vendor management
- **Super Admin**: Full system access

## 📊 Database Schema

### Core Tables
- **users**: User accounts with encrypted SA ID
- **vendors**: Business information and verification
- **products**: Cannabis products with strain information
- **orders**: Order management with compliance tracking
- **payments**: Multi-gateway payment processing
- **compliance_events**: Audit trail for regulatory compliance

### Key Features
- **Soft deletes** for data retention compliance
- **Encrypted sensitive data** (SA ID numbers)
- **Audit trails** for all critical operations
- **Performance indexes** on frequently queried fields

## 🛡️ Security Implementation

### Data Protection
- **AES-256-GCM encryption** for sensitive data
- **bcrypt hashing** for passwords
- **JWT tokens** with secure signing
- **Input sanitization** for XSS prevention

### Rate Limiting
- **Tiered rate limiting** (per minute/hour/day)
- **Action-specific limits** (registration, OTP, API calls)
- **IP-based tracking** with user-agent fingerprinting

### Compliance Tracking
- **Audit logs** for all user actions
- **Compliance events** for regulatory reporting
- **Data retention** policies
- **Age verification** enforcement

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/register     # User registration
POST /api/auth/send-otp     # Send OTP code
POST /api/auth/verify-otp   # Verify OTP code
GET  /api/auth/session      # Get current session
```

### Products
```
GET  /api/products          # List products (public)
POST /api/products          # Create product (vendor)
GET  /api/products/[id]     # Get product details
PUT  /api/products/[id]     # Update product (vendor)
```

### Users
```
GET  /api/users/profile     # Get user profile
PUT  /api/users/profile     # Update user profile
```

## 🏪 Vendor Management

### Vendor Registration
1. User creates account as customer
2. Applies for vendor status
3. Submits business documentation
4. Admin reviews and approves/rejects
5. Vendor gains product management access

### Product Management
- **Cannabis-specific attributes** (THC/CBD content, strain info)
- **Image and document uploads**
- **Inventory management**
- **Pricing and stock tracking**

## 💳 Payment Integration

### Supported Gateways
- **Peach Payments** (Primary SA gateway)
- **PayFast** (Backup SA gateway)
- **Ozow** (Instant EFT)
- **Stripe** (International backup)

### Payment Flow
1. Order created with pending payment
2. Customer selects payment method
3. Redirected to payment gateway
4. Webhook confirms payment status
5. Order status updated automatically

## 📱 SMS Integration

### Clickatel (Primary)
- **South African focused** SMS provider
- **High delivery rates** in SA
- **Cost-effective** for local numbers

### Twilio (Backup)
- **International coverage**
- **Reliable delivery**
- **Fallback for Clickatel failures**

## 📧 Email Services

### Resend Integration
- **Email verification** for accounts
- **Order confirmations** and updates
- **Marketing communications** (with consent)
- **Admin notifications**

## 🔍 Logging and Monitoring

### Structured Logging
- **Winston logger** with multiple transports
- **Log levels**: error, warn, info, debug
- **Sensitive data masking**
- **Performance metrics**

### Error Handling
- **Custom error classes** for different scenarios
- **Global error handler** for API routes
- **Error reporting** to external services
- **User-friendly error messages**

## 🧪 Development Tools

### Database Management
```bash
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Run migrations
npm run db:reset     # Reset and seed database
```

### Testing
- **Test accounts** provided by seed script
- **Mock OTP codes** in development
- **Local payment testing** with sandbox modes

## 🚦 Environment Configuration

### Development
- **Local PostgreSQL** or cloud database
- **Console OTP logging** for testing
- **Detailed error messages**
- **Debug logging enabled**

### Production Checklist
- [ ] Configure production database
- [ ] Set up payment gateway credentials
- [ ] Configure SMS service
- [ ] Set up email service
- [ ] Configure file upload service
- [ ] Set up monitoring and alerting
- [ ] Enable security headers
- [ ] Configure rate limiting
- [ ] Set up backup strategy

## 🔧 Maintenance

### Regular Tasks
- **Token cleanup** (expired tokens)
- **Log rotation** (prevent disk filling)
- **Database optimization** (VACUUM, ANALYZE)
- **Compliance reporting** (audit trails)

### Monitoring
- **Database performance** (query times, connections)
- **API response times** (endpoint performance)
- **Error rates** (4xx/5xx responses)
- **Security events** (failed auth, rate limits)

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Guide](https://next-auth.js.org)
- [South African ID Validation](https://en.wikipedia.org/wiki/South_African_identity_document)
- [Cannabis Regulations (SA)](https://www.gov.za/about-government/government-programmes/cannabis-legalisation)

---

For support or questions, please refer to the development team or check the project repository for updates.