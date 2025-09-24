# Product Requirements Document (PRD)
## Bigg Buzz Marketplace: Cart and Checkout System Extension

**Document Version:** 1.0
**Date:** September 22, 2025
**Author:** Product Team
**Stakeholders:** Development Team, UX/UI Team, Business Team, Compliance Team

---

## Executive Summary

This PRD outlines the extension of the Bigg Buzz cannabis marketplace with a comprehensive cart and checkout system for subscribers. The system will enable users to add products to a cart, review orders, and complete purchases using the existing token-based payment system. This enhancement will transform the current product browsing experience into a complete e-commerce platform while maintaining compliance with cannabis regulations.

The implementation will focus on UI/UX excellence while designing for future database integration, ensuring a seamless user experience from product discovery to order completion.

---

## Problem Statement and User Needs

### Current State
- Users can browse cannabis products but cannot purchase them
- No cart functionality exists for accumulating multiple items
- No checkout process for order completion
- Limited order management capabilities
- Existing token system is underutilized

### User Pain Points
1. **Inefficient Shopping Experience**: Users cannot add multiple items and review them before purchasing
2. **No Order Planning**: Cannot calculate total costs or plan purchases effectively
3. **Incomplete Purchasing Flow**: Missing critical e-commerce functionality for a marketplace
4. **Limited Order Tracking**: Basic order history without detailed management

### Target Users
- **Primary**: Cannabis subscribers aged 21+ with verified accounts
- **Secondary**: Admin users managing orders and inventory
- **Tertiary**: Compliance teams monitoring transactions

---

## Success Metrics and KPIs

### Primary Metrics
- **Cart Conversion Rate**: Target 65% of cart additions result in checkout
- **Average Order Value**: Target increase of 25% from R 483 baseline
- **Cart Abandonment Rate**: Target <30% abandonment rate
- **Time to Checkout**: Target <3 minutes from cart to order completion

### Secondary Metrics
- **Items per Cart**: Target average of 2.5 items per cart
- **Repeat Purchase Rate**: Target 40% within 30 days
- **Customer Satisfaction**: Target >4.5/5 rating for checkout experience
- **Order Accuracy**: Target >99% order fulfillment accuracy

### Business Metrics
- **Monthly Revenue Growth**: Target 15% increase post-implementation
- **Token Utilization**: Target 80% of purchases using existing tokens
- **Operational Efficiency**: Target 20% reduction in customer support tickets

---

## Functional Requirements

### 1. Cart Management System

#### 1.1 Add to Cart Functionality
**User Story**: As a subscriber, I want to add products to my cart so that I can purchase multiple items together.

**Acceptance Criteria**:
- Users can add any in-stock product to cart with a single click
- System validates product availability before adding
- Visual feedback confirms successful addition (toast notification)
- Cart icon displays current item count
- Duplicate products increase quantity instead of creating new entries
- Out-of-stock products display disabled "Add to Cart" button

**Priority**: Must Have

#### 1.2 Cart Item Management
**User Story**: As a subscriber, I want to modify cart contents so that I can adjust my order before checkout.

**Acceptance Criteria**:
- Users can increase/decrease item quantities using +/- buttons
- Users can remove items completely from cart
- Quantity changes reflect immediately in cart total
- Minimum quantity is 1 (removing below 1 deletes item)
- Maximum quantity per item is 10
- Running cart total updates in real-time

**Priority**: Must Have

#### 1.3 Cart Persistence
**User Story**: As a subscriber, I want my cart to persist across sessions so that I don't lose my selections.

**Acceptance Criteria**:
- Cart contents saved in browser localStorage
- Cart restored when user returns to marketplace
- Cart expires after 7 days of inactivity
- Cart cleared after successful checkout
- Cart synced with database when user is authenticated

**Priority**: Should Have

#### 1.4 Cart Summary Display
**User Story**: As a subscriber, I want to see my cart summary so that I can track what I'm purchasing.

**Acceptance Criteria**:
- Persistent cart summary visible on browse tab when items present
- Shows total item count and total price
- Displays prominently with emerald green styling
- Updates in real-time as cart changes
- One-click access to full cart view

**Priority**: Must Have

### 2. Checkout Process

#### 2.1 Cart Review Page
**User Story**: As a subscriber, I want to review my entire order before completing purchase so that I can verify my selections.

**Acceptance Criteria**:
- Dedicated cart/checkout page accessible from cart summary
- Lists all items with product images, names, quantities, and prices
- Shows individual item totals and grand total
- Displays estimated delivery timeframe
- Allows final quantity adjustments
- Shows available token balance
- Clear navigation back to browse products

**Priority**: Must Have

#### 2.2 Order Summary and Confirmation
**User Story**: As a subscriber, I want to see a complete order summary before finalizing purchase so that I can confirm all details are correct.

**Acceptance Criteria**:
- Displays itemized order breakdown
- Shows delivery address from user profile
- Displays payment method (tokens)
- Shows order total and remaining token balance after purchase
- Includes estimated delivery date
- Requires explicit confirmation before processing
- Generates unique order ID

**Priority**: Must Have

#### 2.3 Payment Processing
**User Story**: As a subscriber, I want to pay using my token balance so that I can complete my purchase.

**Acceptance Criteria**:
- Validates sufficient token balance before processing
- Deducts order total from user token balance
- Prevents checkout if insufficient funds
- Provides clear messaging about payment status
- Processes payment atomically (all-or-nothing)
- Generates payment transaction record

**Priority**: Must Have

#### 2.4 Order Completion
**User Story**: As a subscriber, I want confirmation of my successful order so that I know my purchase was processed.

**Acceptance Criteria**:
- Displays order confirmation page with order details
- Shows order number and estimated delivery
- Includes order tracking information
- Sends confirmation via email/SMS (if enabled)
- Clears cart after successful order
- Updates user's order history immediately

**Priority**: Must Have

### 3. Cart User Interface Components

#### 3.1 Enhanced Product Cards
**User Story**: As a subscriber, I want intuitive product interaction so that I can easily manage cart items.

**Acceptance Criteria**:
- Products not in cart show "Add to Cart" button
- Products in cart show quantity controls (+/- buttons)
- Current cart quantity displayed clearly
- "Remove from Cart" option for cart items
- Consistent styling with marketplace theme
- Proper loading states and error handling

**Priority**: Must Have

#### 3.2 Cart Sidebar/Modal
**User Story**: As a subscriber, I want quick access to my cart contents so that I can review items without leaving the current page.

**Acceptance Criteria**:
- Slide-out cart panel accessible from cart icon
- Shows all cart items with thumbnails
- Allows quantity adjustments within panel
- Displays running total
- Quick remove item functionality
- "Proceed to Checkout" button
- Responsive design for mobile devices

**Priority**: Should Have

#### 3.3 Dedicated Cart Page
**User Story**: As a subscriber, I want a full cart view so that I can thoroughly review my order.

**Acceptance Criteria**:
- Full-page cart view with detailed item display
- Large product images and complete descriptions
- Advanced quantity controls
- Item removal with confirmation
- Order calculations breakdown
- Prominent checkout button
- Breadcrumb navigation

**Priority**: Must Have

### 4. Integration Requirements

#### 4.1 Token System Integration
**User Story**: As a subscriber, I want seamless payment using my existing tokens so that checkout is convenient.

**Acceptance Criteria**:
- Real-time token balance validation
- Clear display of available vs. required tokens
- Prevents checkout with insufficient balance
- Token deduction happens atomically with order creation
- Updates token transaction history
- Maintains token balance accuracy

**Priority**: Must Have

#### 4.2 Order History Integration
**User Story**: As a subscriber, I want new orders to appear in my order history so that I can track all purchases.

**Acceptance Criteria**:
- New orders immediately visible in order history
- Consistent order status workflow
- Proper order details and tracking information
- Integration with existing order management system
- Maintains order history pagination
- Supports order status updates

**Priority**: Must Have

### 5. Cart Tab Enhancement

#### 5.1 New Cart Tab
**User Story**: As a subscriber, I want a dedicated cart tab so that I can easily access and manage my cart.

**Acceptance Criteria**:
- New "Cart" tab added to marketplace navigation
- Tab shows item count badge when cart has items
- Full cart management interface within tab
- Seamless integration with existing tab system
- Consistent styling with other tabs
- Keyboard navigation support

**Priority**: Should Have

#### 5.2 Checkout Flow Integration
**User Story**: As a subscriber, I want checkout to integrate seamlessly with the tab interface so that the experience feels cohesive.

**Acceptance Criteria**:
- Checkout process can be initiated from cart tab
- Multi-step checkout within tab interface
- Progress indicators for checkout steps
- Ability to return to cart for modifications
- Maintains tab state throughout process
- Responsive design for all screen sizes

**Priority**: Should Have

---

## Non-Functional Requirements

### Performance Requirements
- **Page Load Time**: Cart operations must complete within 200ms
- **Real-time Updates**: Cart changes reflected within 100ms
- **Database Queries**: Cart-related queries optimized for <50ms response
- **Concurrent Users**: System must handle 100 concurrent cart operations

### Security Requirements
- **Authentication**: All cart operations require valid subscriber authentication
- **Data Validation**: All input sanitized and validated server-side
- **Token Security**: Payment processing uses secure token validation
- **Session Security**: Cart data encrypted in storage
- **HTTPS**: All cart/checkout operations over secure connections

### Accessibility Requirements
- **WCAG 2.1 AA Compliance**: All cart interfaces meet accessibility standards
- **Keyboard Navigation**: Full cart functionality accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Minimum 4.5:1 contrast ratio for all text
- **Focus Management**: Clear focus indicators throughout cart flow

### Compatibility Requirements
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Responsive**: Full functionality on devices 320px width and up
- **Touch Interface**: Optimized for touch interactions on mobile
- **Progressive Enhancement**: Core functionality works without JavaScript

### Scalability Requirements
- **Database Design**: Cart tables designed for millions of records
- **Caching Strategy**: Implement Redis caching for cart data
- **API Design**: RESTful APIs designed for horizontal scaling
- **State Management**: Efficient client-side state management with Zustand

---

## Technical Considerations

### Architecture Decisions

#### Frontend Architecture
- **State Management**: Zustand for cart state management
- **Component Design**: Reusable cart components with TypeScript
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Performance**: React.memo for cart components to prevent unnecessary re-renders

#### API Design
- **RESTful Endpoints**: Consistent API design for cart operations
- **Error Handling**: Comprehensive error responses with appropriate HTTP status codes
- **Rate Limiting**: Prevent cart manipulation abuse
- **Validation**: Server-side validation for all cart operations

#### Integration Points
- **Existing Token System**: Seamless integration with current token management
- **Order Management**: Integration with existing order processing workflow
- **User Authentication**: Leverage existing subscriber authentication
- **Compliance Logging**: Integration with existing compliance event system

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production)
- **State Management**: Zustand
- **Styling**: Tailwind CSS, Radix UI components
- **Icons**: Lucide React

---

## Database Schema Design

### New Tables Required

#### Cart Table
```sql
model Cart {
  id          String   @id @default(cuid())
  subscriberId String   @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  expiresAt   DateTime // Auto-expire after 7 days

  subscriber  Subscriber @relation(fields: [subscriberId], references: [id], onDelete: Cascade)
  items       CartItem[]

  @@map("carts")
}
```

#### CartItem Table
```sql
model CartItem {
  id        String   @id @default(cuid())
  cartId    String
  productId String
  quantity  Int      @default(1)
  priceAtTime Float  // Price when added to cart
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  cart      Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])

  @@unique([cartId, productId])
  @@map("cart_items")
}
```

#### Product Table (Enhanced)
```sql
model Product {
  id          String   @id @default(cuid())
  name        String
  description String
  category    ProductCategory
  price       Float
  weight      String
  thc         String?
  cbd         String?
  strain      String?
  vendor      String
  imageUrl    String?
  inStock     Boolean  @default(true)
  stockQuantity Int    @default(0)
  rating      Float    @default(0)
  reviewCount Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  cartItems   CartItem[]
  orderItems  OrderItem[]

  @@map("products")
}

enum ProductCategory {
  FLOWER
  CONCENTRATES
  EDIBLES
  ACCESSORIES
  WELLNESS
}
```

#### Order Table (Enhanced)
```sql
model Order {
  id              String      @id @default(cuid())
  orderNumber     String      @unique
  subscriberId    String
  status          OrderStatus @default(PENDING)
  subtotal        Float
  tax             Float       @default(0)
  shipping        Float       @default(0)
  total           Float
  tokenAmount     Float       // Amount paid in tokens
  deliveryAddress String
  estimatedDelivery DateTime?
  trackingNumber  String?
  notes           String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  subscriber      Subscriber   @relation(fields: [subscriberId], references: [id])
  items           OrderItem[]
  transactions    TokenTransaction[]

  @@map("orders")
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  PACKED
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}
```

#### OrderItem Table
```sql
model OrderItem {
  id          String   @id @default(cuid())
  orderId     String
  productId   String
  quantity    Int
  priceAtTime Float
  createdAt   DateTime @default(now())

  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product     Product @relation(fields: [productId], references: [id])

  @@map("order_items")
}
```

#### TokenTransaction Table (Enhanced)
```sql
model TokenTransaction {
  id          String              @id @default(cuid())
  subscriberId String
  orderId     String?
  type        TokenTransactionType
  amount      Float               // Positive for credits, negative for debits
  balance     Float               // Balance after transaction
  description String
  metadata    String?             // JSON metadata
  createdAt   DateTime            @default(now())

  subscriber  Subscriber @relation(fields: [subscriberId], references: [id])
  order       Order?     @relation(fields: [orderId], references: [id])

  @@map("token_transactions")
}

enum TokenTransactionType {
  PURCHASE
  REFUND
  TOPUP
  ADJUSTMENT
  BONUS
}
```

### Enhanced Subscriber Table
```sql
model Subscriber {
  // ... existing fields ...

  // Add new relations
  cart            Cart?
  orders          Order[]
  tokenTransactions TokenTransaction[]

  // Add delivery information
  deliveryAddress String?
  deliveryCity    String?
  deliveryPostalCode String?
  deliveryProvince String?

  @@map("subscribers")
}
```

### Database Indexes
```sql
-- Performance optimization indexes
CREATE INDEX idx_cart_subscriber ON carts(subscriberId);
CREATE INDEX idx_cart_item_cart ON cart_items(cartId);
CREATE INDEX idx_cart_item_product ON cart_items(productId);
CREATE INDEX idx_order_subscriber ON orders(subscriberId);
CREATE INDEX idx_order_status ON orders(status);
CREATE INDEX idx_order_created ON orders(createdAt);
CREATE INDEX idx_product_category ON products(category);
CREATE INDEX idx_product_active ON products(isActive);
CREATE INDEX idx_token_transaction_subscriber ON token_transactions(subscriberId);
```

---

## User Journey and Wireframes

### Primary User Journey: Complete Purchase Flow

#### Step 1: Product Discovery
- User browses products on "Browse Products" tab
- Filters by category, price, or search terms
- Views product details (THC/CBD levels, reviews, vendor)

#### Step 2: Add to Cart
- User clicks "Add to Cart" on desired product
- Toast notification confirms addition
- Cart summary appears showing item count and total
- Product card updates to show quantity controls

#### Step 3: Cart Management
- User continues browsing and adding products
- Uses +/- buttons to adjust quantities
- Removes unwanted items
- Cart summary updates in real-time

#### Step 4: Cart Review
- User clicks on cart summary or accesses cart tab
- Reviews all cart items with full details
- Makes final adjustments to quantities
- Verifies total cost against token balance

#### Step 5: Checkout Initiation
- User clicks "Proceed to Checkout"
- System validates cart contents and token balance
- Displays comprehensive order summary

#### Step 6: Order Confirmation
- User reviews final order details
- Confirms delivery address
- Sees estimated delivery date
- Clicks "Place Order" to confirm

#### Step 7: Payment Processing
- System deducts tokens from user balance
- Creates order record in database
- Generates order number and tracking info

#### Step 8: Order Completion
- User sees order confirmation page
- Receives order number and estimated delivery
- Cart is cleared automatically
- Order appears in order history

### Error Scenarios

#### Insufficient Token Balance
- User proceeds to checkout with insufficient tokens
- Clear error message displayed
- Options to reduce order or add more tokens
- Cart preserved for user to modify

#### Product Becomes Unavailable
- Product goes out of stock while in cart
- User notified of availability change
- Option to remove item or wait for restock
- Cart total updates accordingly

#### Session Expiration
- User's session expires during checkout
- Cart contents preserved in localStorage
- User redirected to login
- Cart restored after authentication

---

## Dependencies and Assumptions

### Internal Dependencies
- **Existing Token System**: Cart functionality depends on current token balance management
- **User Authentication**: Requires existing subscriber authentication system
- **Product Catalog**: Depends on current product browsing functionality
- **Order Management**: Integration with existing order history system

### External Dependencies
- **Payment Gateway**: Future integration with external payment processors
- **Inventory Management**: Integration with vendor inventory systems
- **Shipping APIs**: Integration with delivery service providers
- **Email/SMS Services**: For order confirmation notifications

### Technical Assumptions
- **Database Performance**: Current SQLite setup adequate for initial load
- **Browser Compatibility**: Users have modern browsers with localStorage support
- **Network Connectivity**: Reliable internet connection for real-time updates
- **Mobile Usage**: Significant portion of users access via mobile devices

### Business Assumptions
- **Token Adoption**: Users will continue using token-based payment system
- **Order Volume**: Expect 20-30% increase in transaction volume
- **User Behavior**: Users prefer multi-item purchases over single-item orders
- **Compliance**: Current regulatory framework remains stable

---

## Timeline and Milestones

### Phase 1: Foundation (Weeks 1-2)
**Milestone**: Basic cart functionality implemented

**Deliverables**:
- Database schema updates
- Basic cart state management
- Add to cart functionality
- Cart item management (add/remove/update)
- Cart persistence in localStorage

**Acceptance Criteria**:
- Users can add products to cart
- Cart contents persist across sessions
- Real-time cart updates function correctly

### Phase 2: User Interface (Weeks 3-4)
**Milestone**: Complete cart UI implementation

**Deliverables**:
- Enhanced product cards with cart controls
- Cart summary component
- Cart tab/page interface
- Responsive design implementation
- Accessibility compliance

**Acceptance Criteria**:
- Cart interface matches design specifications
- All interactions work on mobile and desktop
- Accessibility standards met (WCAG 2.1 AA)

### Phase 3: Checkout Process (Weeks 5-6)
**Milestone**: End-to-end checkout functionality

**Deliverables**:
- Order review interface
- Payment processing integration
- Order confirmation flow
- Token balance validation
- Error handling implementation

**Acceptance Criteria**:
- Users can complete full purchase flow
- Payment processing works correctly
- Order confirmation provides all necessary information

### Phase 4: Integration and Testing (Weeks 7-8)
**Milestone**: System integration and quality assurance

**Deliverables**:
- Order history integration
- Performance optimization
- Comprehensive testing
- Bug fixes and refinements
- Documentation updates

**Acceptance Criteria**:
- All systems integrate seamlessly
- Performance meets specified requirements
- All edge cases handled appropriately

### Phase 5: Launch Preparation (Week 9)
**Milestone**: Production readiness

**Deliverables**:
- Production deployment
- User acceptance testing
- Staff training materials
- Monitoring and analytics setup
- Launch communication

**Acceptance Criteria**:
- System performs well under expected load
- All stakeholders trained on new functionality
- Monitoring systems operational

---

## Risk Assessment

### High Risk Items

#### 1. Token Balance Synchronization
**Risk**: Inconsistencies between cart calculations and actual token deductions
**Impact**: High - Could result in overcharges or payment failures
**Mitigation**:
- Implement atomic transactions
- Real-time balance validation
- Comprehensive testing of edge cases
- Rollback mechanisms for failed transactions

#### 2. Cart Data Loss
**Risk**: Users losing cart contents due to technical issues
**Impact**: Medium - Poor user experience and lost sales
**Mitigation**:
- Robust localStorage implementation
- Server-side cart backup for authenticated users
- Graceful error handling and recovery
- User notifications about cart persistence

#### 3. Performance Degradation
**Risk**: Cart operations causing system slowdowns
**Impact**: Medium - Reduced user experience and potential system instability
**Mitigation**:
- Database query optimization
- Implement caching strategies
- Load testing with realistic scenarios
- Performance monitoring and alerts

### Medium Risk Items

#### 4. Mobile User Experience
**Risk**: Cart functionality not working well on mobile devices
**Impact**: Medium - Lost mobile traffic and sales
**Mitigation**:
- Mobile-first design approach
- Extensive mobile testing
- Touch-optimized interface elements
- Progressive enhancement strategy

#### 5. Browser Compatibility
**Risk**: Cart not functioning in older browsers
**Impact**: Low-Medium - Limited user base affected
**Mitigation**:
- Progressive enhancement approach
- Feature detection and graceful degradation
- Clear browser requirement communication
- Fallback functionality for unsupported features

### Low Risk Items

#### 6. User Adoption
**Risk**: Users not utilizing cart functionality
**Impact**: Low - Existing single-item purchase flow still available
**Mitigation**:
- Clear user onboarding
- Highlight benefits of cart usage
- Analytics to track adoption
- Iterative improvements based on feedback

---

## Launch Strategy

### Soft Launch (Internal Testing)
- Deploy to staging environment
- Internal team testing with production-like data
- Admin user testing and feedback collection
- Performance testing under simulated load

### Beta Launch (Limited Users)
- Release to select group of trusted subscribers
- Monitor usage patterns and error rates
- Collect user feedback through in-app surveys
- Iterate based on beta user experiences

### Full Launch
- Deploy to production environment
- Gradual rollout to all subscribers
- Monitor system performance and user adoption
- Customer support prepared for cart-related inquiries

### Post-Launch
- Weekly performance reviews for first month
- Monthly feature usage analysis
- Quarterly user satisfaction surveys
- Continuous optimization based on data

---

## Success Definition

### Technical Success Criteria
- ✅ All functional requirements implemented and tested
- ✅ Performance meets specified benchmarks
- ✅ Zero critical bugs in production
- ✅ 99.9% uptime during first month

### User Experience Success Criteria
- ✅ Cart conversion rate >60% within first month
- ✅ Average checkout time <3 minutes
- ✅ User satisfaction rating >4.2/5
- ✅ <5% increase in support tickets

### Business Success Criteria
- ✅ 15% increase in average order value
- ✅ 20% increase in monthly revenue
- ✅ 30% of orders contain multiple items
- ✅ 10% improvement in customer retention

---

## Future Considerations

### Phase 2 Enhancements
- **Wishlist Functionality**: Save products for later purchase
- **Cart Sharing**: Share cart contents with others
- **Scheduled Orders**: Recurring purchase options
- **Advanced Filtering**: Enhanced product discovery

### Phase 3 Integrations
- **External Payments**: Credit card and bank transfer options
- **Loyalty Program**: Points and rewards integration
- **Inventory Sync**: Real-time stock level updates
- **Advanced Analytics**: Detailed cart abandonment analysis

### Scalability Planning
- **Multi-vendor Support**: Separate carts per vendor
- **Bulk Ordering**: Quantity discounts and wholesale options
- **International Shipping**: Multi-region support
- **API Ecosystem**: Third-party integration capabilities

---

## Appendices

### Appendix A: API Endpoint Specifications

#### Cart Management APIs
```
GET    /api/cart                    - Get current user's cart
POST   /api/cart/items              - Add item to cart
PUT    /api/cart/items/:id          - Update cart item quantity
DELETE /api/cart/items/:id          - Remove item from cart
DELETE /api/cart                    - Clear entire cart
```

#### Checkout APIs
```
POST   /api/checkout/validate       - Validate cart and token balance
POST   /api/checkout/process        - Process order and payment
GET    /api/checkout/confirmation/:orderId - Get order confirmation
```

### Appendix B: Error Code Reference

#### Cart Error Codes
- `CART_001`: Product not found
- `CART_002`: Product out of stock
- `CART_003`: Invalid quantity
- `CART_004`: Cart not found
- `CART_005`: Cart expired

#### Checkout Error Codes
- `CHECKOUT_001`: Insufficient token balance
- `CHECKOUT_002`: Cart empty
- `CHECKOUT_003`: Product price changed
- `CHECKOUT_004`: Payment processing failed
- `CHECKOUT_005`: Order creation failed

### Appendix C: Compliance Considerations

#### Cannabis Regulation Compliance
- Age verification maintained throughout purchase flow
- Purchase limits enforced at cart and checkout levels
- Delivery address validation for legal jurisdictions
- Transaction logging for regulatory reporting
- Product information accuracy requirements

#### Data Privacy Compliance
- Cart data handling per privacy policy
- User consent for data storage and processing
- Right to data deletion includes cart history
- Secure transmission of all cart and payment data

---

**Document End**

*This PRD serves as the definitive specification for the Bigg Buzz marketplace cart and checkout system. All implementation decisions should reference this document, and any changes should be formally documented and approved by stakeholders.*