# Backend Engineer - Cart & Checkout System Tasks

## Overview
This document provides detailed, phase-by-phase tasks for the Backend Engineer to implement the cart and checkout system for Bigg Buzz marketplace.

---

# Phase 1: Database & API Foundation (Week 1-2)

## Week 1: Database Schema Implementation

### Task 1.1: Analyze Current Database Schema (Day 1)
**Priority: High | Estimated Time: 4 hours**

**Objectives:**
- Review existing Prisma schema in `prisma/schema.prisma`
- Understand current User/Subscriber model relationships
- Document existing authentication and token systems
- Identify integration points for cart/order models

**Deliverables:**
- Schema analysis document
- Integration plan for new models
- Backup strategy for current database

**Technical Requirements:**
```bash
# Commands to run
npx prisma db pull
npx prisma generate
npx prisma studio --port 5656
```

**Acceptance Criteria:**
- [ ] Current schema documented with relationships
- [ ] Integration points identified for new models
- [ ] Database backup created
- [ ] No disruption to existing functionality

---

### Task 1.2: Design Product Model Schema (Day 1-2)
**Priority: High | Estimated Time: 6 hours**

**Objectives:**
- Design comprehensive Product model for cannabis marketplace
- Include cannabis-specific fields (THC, CBD, strain types)
- Plan for inventory management and vendor relationships
- Design for compliance and audit requirements

**Deliverables:**
```prisma
model Product {
  id            String   @id @default(cuid())
  name          String
  description   String   @db.Text
  price         Float
  category      ProductCategory
  strain        StrainType?
  thcContent    Float?   // Percentage 0-100
  cbdContent    Float?   // Percentage 0-100
  weight        Float?   // In grams
  inStock       Boolean  @default(true)
  stockQuantity Int      @default(0)
  images        String[] // Array of image URLs
  vendorId      String
  sku           String   @unique
  compliance    Json?    // Compliance data as JSON
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  cartItems     CartItem[]
  orderItems    OrderItem[]
  vendor        Vendor   @relation(fields: [vendorId], references: [id])

  // Indexes for performance
  @@index([inStock, stockQuantity])
  @@index([category, thcContent])
  @@index([vendorId])
}

model Vendor {
  id          String    @id @default(cuid())
  name        String
  email       String    @unique
  phone       String?
  address     String?
  isActive    Boolean   @default(true)
  licenseNumber String  @unique
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  products    Product[]
}

enum ProductCategory {
  FLOWER
  CONCENTRATES
  EDIBLES
  ACCESSORIES
  WELLNESS
  SEEDS
  CLONES
  TOPICALS
  TINCTURES
  VAPES
}

enum StrainType {
  INDICA
  SATIVA
  HYBRID
}
```

**Technical Requirements:**
- Use proper Prisma types for cannabis data
- Include performance indexes
- Plan for future extensibility
- Consider regulatory compliance fields

**Acceptance Criteria:**
- [ ] Product model supports all cannabis product types
- [ ] Proper relationships with vendors
- [ ] Performance indexes implemented
- [ ] Compliance fields included
- [ ] Schema validation passes

---

### Task 1.3: Design Cart Model Schema (Day 2)
**Priority: High | Estimated Time: 4 hours**

**Objectives:**
- Design Cart and CartItem models
- Integrate with existing Subscriber model
- Plan for cart persistence and expiration
- Design for performance with proper indexes

**Deliverables:**
```prisma
model Cart {
  id              String     @id @default(cuid())
  subscriberId    String     @unique
  lastActivityAt  DateTime   @default(now()) @updatedAt
  items           CartItem[]
  createdAt       DateTime   @default(now())

  // Relations
  subscriber      Subscriber @relation(fields: [subscriberId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([lastActivityAt])
  @@index([subscriberId])
}

model CartItem {
  id          String    @id @default(cuid())
  cartId      String
  productId   String
  quantity    Int
  priceAtAdd  Float     // Store price when added to cart
  variant     Json?     // Store product variants (size, etc.)
  addedAt     DateTime  @default(now())

  // Relations
  cart        Cart      @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product     Product   @relation(fields: [productId], references: [id])

  // Constraints
  @@unique([cartId, productId, variant]) // Prevent duplicate items
  @@index([cartId])
}
```

**Technical Requirements:**
- One cart per subscriber (unique constraint)
- Cascade delete for cart cleanup
- Store price at time of adding to cart
- Support for product variants
- Efficient queries with proper indexes

**Acceptance Criteria:**
- [ ] Cart model integrates with existing Subscriber
- [ ] CartItem supports variants and price history
- [ ] Proper cascade delete implemented
- [ ] Unique constraints prevent duplicates
- [ ] Performance indexes in place

---

### Task 1.4: Design Order Management Schema (Day 3)
**Priority: High | Estimated Time: 6 hours**

**Objectives:**
- Design Order and OrderItem models
- Integrate with token transaction system
- Plan for order status tracking and updates
- Design for compliance and audit trails

**Deliverables:**
```prisma
model Order {
  id              String      @id @default(cuid())
  orderNumber     String      @unique
  subscriberId    String
  status          OrderStatus @default(PENDING)
  total           Float
  subtotal        Float
  tax             Float       @default(0)
  deliveryAddress Json        // Store address as JSON
  deliveryMethod  DeliveryMethod @default(STANDARD)
  estimatedDelivery DateTime?
  actualDelivery  DateTime?
  notes           String?     @db.Text
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Relations
  subscriber      Subscriber  @relation(fields: [subscriberId], references: [id])
  items           OrderItem[]
  tokenTransactions TokenTransaction[]
  statusHistory   OrderStatusHistory[]

  // Indexes
  @@index([orderNumber])
  @@index([subscriberId, createdAt])
  @@index([status, createdAt])
}

model OrderItem {
  id            String  @id @default(cuid())
  orderId       String
  productId     String
  quantity      Int
  priceAtOrder  Float   // Store price at time of order
  variant       Json?   // Store selected variant
  compliance    Json?   // Cannabis compliance data

  // Relations
  order         Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product       Product @relation(fields: [productId], references: [id])

  @@index([orderId])
}

model OrderStatusHistory {
  id        String      @id @default(cuid())
  orderId   String
  status    OrderStatus
  notes     String?
  createdAt DateTime    @default(now())
  createdBy String?     // Admin user who changed status

  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId, createdAt])
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  PACKED
  SHIPPED
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
  REFUNDED
}

enum DeliveryMethod {
  STANDARD
  EXPRESS
  PICKUP
  DRONE
}
```

**Technical Requirements:**
- Generate unique order numbers
- Complete audit trail with status history
- Support for delivery tracking
- Cannabis compliance data storage
- Performance optimized queries

**Acceptance Criteria:**
- [ ] Order model supports full order lifecycle
- [ ] Status history provides complete audit trail
- [ ] Delivery tracking and estimation supported
- [ ] Compliance data properly stored
- [ ] Order numbers are unique and trackable

---

### Task 1.5: Design Token Transaction Integration (Day 3-4)
**Priority: High | Estimated Time: 4 hours**

**Objectives:**
- Enhance existing token system for order payments
- Design atomic transaction processing
- Plan for refunds and partial payments
- Integrate with order management

**Deliverables:**
```prisma
model TokenTransaction {
  id           String                @id @default(cuid())
  subscriberId String
  orderId      String?
  type         TokenTransactionType
  amount       Float                 // Positive for credits, negative for debits
  balance      Float                 // Balance after transaction
  reference    String?               // External reference (payment gateway, etc.)
  description  String?
  metadata     Json?                 // Additional transaction data
  createdAt    DateTime              @default(now())
  processedAt  DateTime?             // When transaction was processed
  status       TransactionStatus     @default(PENDING)

  // Relations
  subscriber   Subscriber            @relation(fields: [subscriberId], references: [id])
  order        Order?                @relation(fields: [orderId], references: [id])

  // Indexes
  @@index([subscriberId, createdAt])
  @@index([orderId])
  @@index([type, status])
}

enum TokenTransactionType {
  PURCHASE
  REFUND
  DEPOSIT
  WITHDRAWAL
  BONUS
  PENALTY
  ADJUSTMENT
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
  REFUNDED
}
```

**Technical Requirements:**
- Atomic transaction processing
- Balance tracking with every transaction
- Support for various transaction types
- Comprehensive audit trail
- Integration with existing Subscriber model

**Acceptance Criteria:**
- [ ] Token transactions are atomic and consistent
- [ ] Balance tracking is accurate
- [ ] All transaction types supported
- [ ] Proper audit trail maintained
- [ ] Integration with orders works correctly

---

### Task 1.6: Create and Run Database Migration (Day 4-5)
**Priority: High | Estimated Time: 6 hours**

**Objectives:**
- Create Prisma migration for all new models
- Safely migrate existing database
- Create seed data for testing
- Verify migration success

**Deliverables:**
```bash
# Migration commands
npx prisma migrate dev --name "add-cart-checkout-system"
npx prisma generate
npx prisma db seed
```

**Seed Data Script:**
```typescript
// prisma/seed-cart-checkout.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCartCheckoutData() {
  // Create vendors
  const vendor1 = await prisma.vendor.create({
    data: {
      name: "Green Valley Farms",
      email: "contact@greenvalley.com",
      phone: "+1-555-0123",
      licenseNumber: "GVF-2024-001",
      address: "123 Cannabis St, Denver, CO"
    }
  });

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Blue Dream",
        description: "A balanced hybrid strain with sweet berry aroma",
        price: 25.00,
        category: "FLOWER",
        strain: "HYBRID",
        thcContent: 18.5,
        cbdContent: 0.5,
        weight: 3.5,
        stockQuantity: 50,
        sku: "BD-3.5G-001",
        vendorId: vendor1.id,
        images: ["/images/blue-dream.jpg"]
      }
    }),
    // Add more products...
  ]);

  console.log('Cart and checkout seed data created');
}

seedCartCheckoutData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Technical Requirements:**
- Zero-downtime migration strategy
- Comprehensive seed data for testing
- Migration rollback plan
- Data integrity verification

**Acceptance Criteria:**
- [ ] Migration runs successfully without errors
- [ ] All new models created with proper relationships
- [ ] Seed data provides realistic test scenarios
- [ ] Existing data remains intact
- [ ] Database performance is maintained

---

## Week 2: API Development

### Task 2.1: Create Product API Endpoints (Day 6-7)
**Priority: High | Estimated Time: 8 hours**

**Objectives:**
- Implement CRUD operations for products
- Add search and filtering capabilities
- Integrate with existing authentication
- Optimize for performance

**Deliverables:**
```typescript
// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { ProductFilterSchema } from '@/lib/validations/product';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = ProductFilterSchema.parse({
      category: searchParams.get('category'),
      strain: searchParams.get('strain'),
      minPrice: searchParams.get('minPrice'),
      maxPrice: searchParams.get('maxPrice'),
      inStock: searchParams.get('inStock') === 'true',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    });

    const products = await prisma.product.findMany({
      where: {
        ...(filters.category && { category: filters.category }),
        ...(filters.strain && { strain: filters.strain }),
        ...(filters.minPrice && { price: { gte: filters.minPrice } }),
        ...(filters.maxPrice && { price: { lte: filters.maxPrice } }),
        ...(filters.inStock && { inStock: true, stockQuantity: { gt: 0 } })
      },
      include: {
        vendor: {
          select: { id: true, name: true }
        }
      },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.product.count({
      where: {
        // Same where conditions
      }
    });

    return NextResponse.json({
      products,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// Additional endpoints: POST, PUT, DELETE
```

**API Endpoints to Implement:**
- `GET /api/products` - List products with filtering
- `GET /api/products/[id]` - Get single product
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/[id]` - Update product (admin only)
- `DELETE /api/products/[id]` - Delete product (admin only)
- `GET /api/products/search` - Search products
- `GET /api/products/categories` - Get categories

**Technical Requirements:**
- Zod validation for all inputs
- Proper error handling and responses
- Performance optimization with indexes
- Rate limiting for search endpoints
- Admin authentication for write operations

**Acceptance Criteria:**
- [ ] All CRUD operations work correctly
- [ ] Filtering and search functionality implemented
- [ ] Proper validation and error handling
- [ ] Performance optimized queries
- [ ] Admin authentication enforced

---

### Task 2.2: Create Cart API Endpoints (Day 7-8)
**Priority: High | Estimated Time: 8 hours**

**Objectives:**
- Implement cart operations (add, update, remove, clear)
- Ensure thread-safe operations
- Integrate with authentication
- Handle inventory validation

**Deliverables:**
```typescript
// src/app/api/cart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { CartItemSchema } from '@/lib/validations/cart';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { subscriberId: user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                inStock: true,
                stockQuantity: true,
                vendor: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      }
    });

    if (!cart) {
      // Create empty cart if doesn't exist
      const newCart = await prisma.cart.create({
        data: { subscriberId: user.id },
        include: { items: true }
      });
      return NextResponse.json(newCart);
    }

    // Calculate totals
    const subtotal = cart.items.reduce((total, item) =>
      total + (item.priceAtAdd * item.quantity), 0
    );

    return NextResponse.json({
      ...cart,
      summary: {
        itemCount: cart.items.reduce((count, item) => count + item.quantity, 0),
        subtotal,
        tax: subtotal * 0.1, // 10% tax
        total: subtotal * 1.1
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json();
    const { productId, quantity, variant } = CartItemSchema.parse(body);

    // Validate product exists and is in stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, price: true, inStock: true, stockQuantity: true }
    });

    if (!product || !product.inStock || product.stockQuantity < quantity) {
      return NextResponse.json(
        { error: 'Product not available in requested quantity' },
        { status: 400 }
      );
    }

    // Use transaction for thread safety
    const result = await prisma.$transaction(async (tx) => {
      // Get or create cart
      let cart = await tx.cart.findUnique({
        where: { subscriberId: user.id }
      });

      if (!cart) {
        cart = await tx.cart.create({
          data: { subscriberId: user.id }
        });
      }

      // Check if item already exists in cart
      const existingItem = await tx.cartItem.findUnique({
        where: {
          cartId_productId_variant: {
            cartId: cart.id,
            productId,
            variant: variant || {}
          }
        }
      });

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;

        // Validate total quantity against stock
        if (newQuantity > product.stockQuantity) {
          throw new Error('Not enough stock available');
        }

        return tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
          include: { product: true }
        });
      } else {
        // Add new item
        return tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
            priceAtAdd: product.price,
            variant: variant || {}
          },
          include: { product: true }
        });
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to add item to cart' },
      { status: 400 }
    );
  }
});
```

**API Endpoints to Implement:**
- `GET /api/cart` - Get user's cart with items
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/items/[id]` - Update cart item quantity
- `DELETE /api/cart/items/[id]` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart
- `POST /api/cart/sync` - Sync cart with current prices

**Technical Requirements:**
- Atomic operations using Prisma transactions
- Stock validation before adding items
- Price preservation (store price at time of adding)
- Proper error handling for edge cases
- Rate limiting to prevent abuse

**Acceptance Criteria:**
- [ ] All cart operations are thread-safe
- [ ] Stock validation prevents overselling
- [ ] Price preservation works correctly
- [ ] Error handling covers all edge cases
- [ ] Performance is optimized for concurrent users

---

### Task 2.3: Create Order Processing API (Day 8-9)
**Priority: High | Estimated Time: 10 hours**

**Objectives:**
- Implement secure checkout process
- Handle token payment processing
- Create order confirmation system
- Manage inventory updates

**Deliverables:**
```typescript
// src/app/api/orders/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware/auth';
import { CheckoutSchema } from '@/lib/validations/checkout';

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json();
    const { deliveryAddress, deliveryMethod } = CheckoutSchema.parse(body);

    // Use transaction for atomic checkout process
    const order = await prisma.$transaction(async (tx) => {
      // Get user's cart
      const cart = await tx.cart.findUnique({
        where: { subscriberId: user.id },
        include: {
          items: {
            include: { product: true }
          }
        }
      });

      if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Validate stock availability
      for (const item of cart.items) {
        if (!item.product.inStock || item.product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.product.name}`);
        }
      }

      // Calculate totals
      const subtotal = cart.items.reduce((total, item) =>
        total + (item.priceAtAdd * item.quantity), 0
      );
      const tax = subtotal * 0.1; // 10% tax
      const total = subtotal + tax;

      // Check user token balance
      const subscriber = await tx.subscriber.findUnique({
        where: { id: user.id },
        select: { tokenBalance: true }
      });

      if (!subscriber || subscriber.tokenBalance < total) {
        throw new Error('Insufficient token balance');
      }

      // Generate order number
      const orderNumber = `BZ${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          subscriberId: user.id,
          status: 'CONFIRMED',
          subtotal,
          tax,
          total,
          deliveryAddress,
          deliveryMethod,
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
          items: {
            create: cart.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtOrder: item.priceAtAdd,
              variant: item.variant
            }))
          }
        },
        include: {
          items: {
            include: { product: true }
          }
        }
      });

      // Deduct tokens from user balance
      await tx.subscriber.update({
        where: { id: user.id },
        data: { tokenBalance: { decrement: total } }
      });

      // Create token transaction record
      await tx.tokenTransaction.create({
        data: {
          subscriberId: user.id,
          orderId: order.id,
          type: 'PURCHASE',
          amount: -total,
          balance: subscriber.tokenBalance - total,
          description: `Purchase order ${orderNumber}`,
          status: 'COMPLETED'
        }
      });

      // Update product stock quantities
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } }
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      // Create order status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'CONFIRMED',
          notes: 'Order confirmed and payment processed'
        }
      });

      return order;
    });

    // Send confirmation email (async, don't wait)
    // sendOrderConfirmationEmail(order, user.email);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        estimatedDelivery: order.estimatedDelivery
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Checkout failed' },
      { status: 400 }
    );
  }
});
```

**API Endpoints to Implement:**
- `POST /api/orders/checkout` - Process checkout
- `GET /api/orders` - Get user's orders
- `GET /api/orders/[id]` - Get specific order details
- `POST /api/orders/[id]/cancel` - Cancel order (if allowed)
- `GET /api/orders/[id]/status` - Get order status and tracking

**Technical Requirements:**
- Atomic checkout process using database transactions
- Stock validation and reservation
- Token balance verification and deduction
- Order number generation
- Inventory management integration
- Email notification system

**Acceptance Criteria:**
- [ ] Checkout process is completely atomic
- [ ] Stock is properly validated and updated
- [ ] Token transactions are recorded accurately
- [ ] Order confirmation works correctly
- [ ] Error handling covers all failure scenarios

---

### Task 2.4: Implement Authentication Integration (Day 9-10)
**Priority: High | Estimated Time: 6 hours**

**Objectives:**
- Integrate cart/order APIs with existing JWT authentication
- Implement proper authorization checks
- Add rate limiting and security measures
- Create admin-only endpoints

**Deliverables:**
```typescript
// src/lib/middleware/cart-auth.ts
import { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import { rateLimit } from '@/lib/middleware/rate-limit';

export function withCartAuth(handler: Function) {
  return async (request: NextRequest) => {
    try {
      // Apply rate limiting
      const rateLimitResult = await rateLimit(request, {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 requests per window
        keyGenerator: (req) => req.ip || 'anonymous'
      });

      if (!rateLimitResult.success) {
        return new Response('Too many requests', { status: 429 });
      }

      // Verify JWT token
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (!token) {
        return new Response('Unauthorized', { status: 401 });
      }

      const user = await verifyJWT(token);
      if (!user) {
        return new Response('Invalid token', { status: 401 });
      }

      // Add user to request context
      return handler(request, { user });
    } catch (error) {
      return new Response('Authentication failed', { status: 401 });
    }
  };
}

export function withAdminAuth(handler: Function) {
  return withCartAuth(async (request: NextRequest, context: any) => {
    const { user } = context;

    // Check admin role
    if (user.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    return handler(request, context);
  });
}
```

**Security Features to Implement:**
- JWT token validation on all endpoints
- Rate limiting by IP and user
- Admin role verification for management endpoints
- Input sanitization and validation
- CORS configuration for API endpoints

**Technical Requirements:**
- Consistent authentication middleware usage
- Proper error responses for auth failures
- Rate limiting configuration
- Security headers implementation
- Audit logging for sensitive operations

**Acceptance Criteria:**
- [ ] All endpoints properly authenticate users
- [ ] Admin endpoints restricted to admin users only
- [ ] Rate limiting prevents abuse
- [ ] Security headers are properly set
- [ ] Authentication errors are handled gracefully

---

### Task 2.5: Create Input Validation and Error Handling (Day 10)
**Priority: High | Estimated Time: 4 hours**

**Objectives:**
- Implement comprehensive Zod validation schemas
- Create consistent error response format
- Add proper logging for debugging
- Handle edge cases and error scenarios

**Deliverables:**
```typescript
// src/lib/validations/cart.ts
import { z } from 'zod';

export const ProductVariantSchema = z.object({
  size: z.enum(['1g', '3.5g', '7g', '14g', '28g']).optional(),
  strain: z.enum(['indica', 'sativa', 'hybrid']).optional(),
  thc: z.number().min(0).max(100).optional(),
  cbd: z.number().min(0).max(100).optional()
});

export const CartItemSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  quantity: z.number().int().min(1).max(50, 'Maximum 50 items per product'),
  variant: ProductVariantSchema.optional()
});

export const CheckoutSchema = z.object({
  deliveryAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    province: z.string().min(1, 'Province is required'),
    postalCode: z.string().regex(/^[A-Z]\d[A-Z] \d[A-Z]\d$/, 'Invalid postal code'),
    country: z.string().default('Canada')
  }),
  deliveryMethod: z.enum(['STANDARD', 'EXPRESS', 'PICKUP']).default('STANDARD'),
  notes: z.string().max(500).optional()
});

// src/lib/errors/api-errors.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code: string = 'GENERIC_ERROR',
    public field?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR', field);
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class StockError extends APIError {
  constructor(message: string = 'Insufficient stock') {
    super(message, 400, 'INSUFFICIENT_STOCK');
  }
}

export class PaymentError extends APIError {
  constructor(message: string = 'Payment failed') {
    super(message, 402, 'PAYMENT_ERROR');
  }
}

// src/lib/middleware/error-handler.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { APIError } from '@/lib/errors/api-errors';

export function handleAPIError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          field: error.field
        }
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    const firstError = error.errors[0];
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: firstError.message,
          field: firstError.path.join('.')
        }
      },
      { status: 400 }
    );
  }

  // Database errors
  if (error.code === 'P2002') {
    return NextResponse.json(
      {
        error: {
          code: 'DUPLICATE_ERROR',
          message: 'Resource already exists'
        }
      },
      { status: 409 }
    );
  }

  // Generic error
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    },
    { status: 500 }
  );
}
```

**Validation Areas to Cover:**
- Cart item addition with quantity limits
- Product filtering and search parameters
- Checkout address and payment validation
- Order status updates and cancellations
- Admin product management operations

**Technical Requirements:**
- Comprehensive Zod schemas for all inputs
- Consistent error response format
- Proper HTTP status codes
- Detailed error messages for debugging
- Security-conscious error information

**Acceptance Criteria:**
- [ ] All API inputs are properly validated
- [ ] Error responses follow consistent format
- [ ] HTTP status codes are appropriate
- [ ] Error messages are helpful but secure
- [ ] Edge cases are handled gracefully

---

## Phase 1 Deliverables Summary

### Week 1 Deliverables:
- [ ] Complete database schema for products, cart, orders
- [ ] Migration scripts and seed data
- [ ] Database performance optimization with indexes
- [ ] Integration with existing Subscriber model

### Week 2 Deliverables:
- [ ] Product API with search and filtering
- [ ] Cart API with thread-safe operations
- [ ] Order processing API with atomic checkout
- [ ] Authentication and authorization integration
- [ ] Comprehensive validation and error handling

### Testing Requirements:
- [ ] Unit tests for all API endpoints
- [ ] Integration tests for checkout process
- [ ] Performance tests for concurrent operations
- [ ] Security tests for authentication and authorization

### Documentation:
- [ ] API documentation with examples
- [ ] Database schema documentation
- [ ] Security implementation guide
- [ ] Performance optimization notes

---

*Continue to Phase 2 tasks once Phase 1 is complete and tested.*