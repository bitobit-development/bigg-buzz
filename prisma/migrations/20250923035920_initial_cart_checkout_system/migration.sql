-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "emailVerified" DATETIME,
    "phone" TEXT,
    "phoneVerified" DATETIME,
    "saId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "dateOfBirth" DATETIME,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsentDate" DATETIME,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedDate" DATETIME,
    "privacyAccepted" BOOLEAN NOT NULL DEFAULT false,
    "privacyAcceptedDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "subscribers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "emailVerified" DATETIME,
    "phone" TEXT,
    "phoneVerified" DATETIME,
    "saId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "dateOfBirth" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsentDate" DATETIME,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedDate" DATETIME,
    "privacyAccepted" BOOLEAN NOT NULL DEFAULT false,
    "privacyAcceptedDate" DATETIME,
    "tokenBalance" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subscriber_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriberId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscriber_tokens_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "subscribers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "compliance_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "subscriberId" TEXT,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "compliance_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "compliance_events_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "subscribers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pending_admin_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "saId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT true,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "adminUserId" TEXT NOT NULL,
    "otpSent" BOOLEAN NOT NULL DEFAULT false,
    "otpVerified" BOOLEAN NOT NULL DEFAULT false,
    "otpAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastOtpSentAt" DATETIME,
    "otpVerifiedAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "licenseNumber" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "category" TEXT NOT NULL,
    "strain" TEXT,
    "thcContent" REAL,
    "cbdContent" REAL,
    "weight" REAL,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "compliance" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "products_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriberId" TEXT NOT NULL,
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "carts_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "subscribers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priceAtAdd" REAL NOT NULL,
    "variant" TEXT,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "total" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "tax" REAL NOT NULL DEFAULT 0,
    "deliveryAddress" TEXT NOT NULL,
    "deliveryMethod" TEXT NOT NULL DEFAULT 'STANDARD',
    "estimatedDelivery" DATETIME,
    "actualDelivery" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "orders_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "subscribers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priceAtOrder" REAL NOT NULL,
    "variant" TEXT,
    "compliance" TEXT,
    CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    CONSTRAINT "order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "token_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriberId" TEXT NOT NULL,
    "orderId" TEXT,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "balance" REAL NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "token_transactions_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "subscribers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "token_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_saId_key" ON "users"("saId");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_email_key" ON "subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_phone_key" ON "subscribers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_saId_key" ON "subscribers"("saId");

-- CreateIndex
CREATE UNIQUE INDEX "user_tokens_token_key" ON "user_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "subscriber_tokens_token_key" ON "subscriber_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_email_key" ON "vendors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_licenseNumber_key" ON "vendors"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_inStock_stockQuantity_idx" ON "products"("inStock", "stockQuantity");

-- CreateIndex
CREATE INDEX "products_category_thcContent_idx" ON "products"("category", "thcContent");

-- CreateIndex
CREATE INDEX "products_vendorId_idx" ON "products"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "carts_subscriberId_key" ON "carts"("subscriberId");

-- CreateIndex
CREATE INDEX "carts_lastActivityAt_idx" ON "carts"("lastActivityAt");

-- CreateIndex
CREATE INDEX "carts_subscriberId_idx" ON "carts"("subscriberId");

-- CreateIndex
CREATE INDEX "cart_items_cartId_idx" ON "cart_items"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cartId_productId_key" ON "cart_items"("cartId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_orderNumber_idx" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_subscriberId_createdAt_idx" ON "orders"("subscriberId", "createdAt");

-- CreateIndex
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_status_history_orderId_createdAt_idx" ON "order_status_history"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "token_transactions_subscriberId_createdAt_idx" ON "token_transactions"("subscriberId", "createdAt");

-- CreateIndex
CREATE INDEX "token_transactions_orderId_idx" ON "token_transactions"("orderId");

-- CreateIndex
CREATE INDEX "token_transactions_type_status_idx" ON "token_transactions"("type", "status");
