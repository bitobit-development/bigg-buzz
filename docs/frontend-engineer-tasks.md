# Frontend Engineer - Cart & Checkout System Tasks

## Overview
This document provides detailed, phase-by-phase tasks for the Frontend Engineer to implement the cart and checkout system UI/UX for Bigg Buzz marketplace.

---

# Phase 2: Cart UI Enhancement (Week 3-4)

## Week 3: Cart Tab & Navigation

### Task 2.1: Analyze Current Cart Store Implementation (Day 11)
**Priority: High | Estimated Time: 4 hours**

**Objectives:**
- Review existing cart store in `src/lib/stores/cart-store.ts`
- Understand current cart item structure and methods
- Plan integration with new backend APIs
- Document current cart functionality

**Deliverables:**
```typescript
// Analysis of current cart store structure
interface CurrentCartAnalysis {
  // Existing cart item structure
  existingCartItem: {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    vendorId: string;
    vendorName: string;
    variant?: {
      size?: string;
      strain?: string;
      thc?: number;
      cbd?: number;
    };
  };

  // Existing store methods
  methods: [
    'addItem',
    'removeItem',
    'updateQuantity',
    'clearCart',
    'getCartTotal',
    'getCartCount'
  ];

  // Integration points needed
  integrationNeeds: [
    'API sync with backend',
    'Real-time price updates',
    'Stock validation',
    'User authentication integration'
  ];
}
```

**Research Areas:**
- Current cart store persistence mechanism
- Integration with existing marketplace page
- State management patterns used
- Performance considerations for cart operations

**Acceptance Criteria:**
- [ ] Complete understanding of existing cart implementation
- [ ] Integration plan documented
- [ ] Performance optimization opportunities identified
- [ ] Backward compatibility requirements understood

---

### Task 2.2: Enhance Cart Store with API Integration (Day 11-12)
**Priority: High | Estimated Time: 8 hours**

**Objectives:**
- Extend existing cart store with backend API integration
- Add real-time synchronization capabilities
- Implement optimistic updates for better UX
- Add error handling and retry logic

**Deliverables:**
```typescript
// src/lib/stores/enhanced-cart-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  vendorId: string;
  vendorName: string;
  priceAtAdd: number; // Track price when added
  variant?: ProductVariant;
  inStock: boolean;
  stockQuantity: number;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  lastSyncAt: Date | null;

  // Computed values
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;

  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  syncWithServer: () => Promise<void>;

  // Optimistic updates
  addItemOptimistic: (item: Omit<CartItem, 'id'>) => void;
  updateQuantityOptimistic: (itemId: string, quantity: number) => void;
  removeItemOptimistic: (itemId: string) => void;

  // Error handling
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    immer((set, get) => ({
      items: [],
      isLoading: false,
      error: null,
      lastSyncAt: null,

      get itemCount() {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      get subtotal() {
        return get().items.reduce((total, item) =>
          total + (item.priceAtAdd * item.quantity), 0
        );
      },

      get tax() {
        return get().subtotal * 0.1; // 10% tax
      },

      get total() {
        return get().subtotal + get().tax;
      },

      addItem: async (newItem) => {
        const state = get();

        // Optimistic update
        state.addItemOptimistic(newItem);

        try {
          state.setLoading(true);

          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
              productId: newItem.productId,
              quantity: newItem.quantity,
              variant: newItem.variant
            })
          });

          if (!response.ok) {
            throw new Error('Failed to add item to cart');
          }

          const updatedItem = await response.json();

          // Update with server response
          set((state) => {
            const existingIndex = state.items.findIndex(
              item => item.productId === newItem.productId
            );

            if (existingIndex >= 0) {
              state.items[existingIndex] = { ...newItem, ...updatedItem };
            }
          });

          state.setError(null);
        } catch (error) {
          // Revert optimistic update
          set((state) => {
            state.items = state.items.filter(
              item => item.productId !== newItem.productId
            );
          });

          state.setError(error.message);
          throw error;
        } finally {
          state.setLoading(false);
        }
      },

      updateQuantity: async (itemId, quantity) => {
        const state = get();
        const originalItem = state.items.find(item => item.id === itemId);

        if (!originalItem) return;

        // Optimistic update
        state.updateQuantityOptimistic(itemId, quantity);

        try {
          state.setLoading(true);

          const response = await fetch(`/api/cart/items/${itemId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ quantity })
          });

          if (!response.ok) {
            throw new Error('Failed to update quantity');
          }

          state.setError(null);
        } catch (error) {
          // Revert optimistic update
          state.updateQuantityOptimistic(itemId, originalItem.quantity);
          state.setError(error.message);
          throw error;
        } finally {
          state.setLoading(false);
        }
      },

      removeItem: async (itemId) => {
        const state = get();
        const originalItem = state.items.find(item => item.id === itemId);

        if (!originalItem) return;

        // Optimistic update
        state.removeItemOptimistic(itemId);

        try {
          state.setLoading(true);

          const response = await fetch(`/api/cart/items/${itemId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to remove item');
          }

          state.setError(null);
        } catch (error) {
          // Revert optimistic update
          set((state) => {
            state.items.push(originalItem);
          });

          state.setError(error.message);
          throw error;
        } finally {
          state.setLoading(false);
        }
      },

      syncWithServer: async () => {
        const state = get();

        try {
          state.setLoading(true);

          const response = await fetch('/api/cart', {
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to sync cart');
          }

          const serverCart = await response.json();

          set((state) => {
            state.items = serverCart.items || [];
            state.lastSyncAt = new Date();
          });

          state.setError(null);
        } catch (error) {
          state.setError(error.message);
        } finally {
          state.setLoading(false);
        }
      },

      // Optimistic update helpers
      addItemOptimistic: (newItem) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            item => item.productId === newItem.productId
          );

          if (existingIndex >= 0) {
            state.items[existingIndex].quantity += newItem.quantity;
          } else {
            state.items.push({
              ...newItem,
              id: `temp-${Date.now()}-${Math.random()}`
            });
          }
        });
      },

      updateQuantityOptimistic: (itemId, quantity) => {
        set((state) => {
          const item = state.items.find(item => item.id === itemId);
          if (item) {
            item.quantity = quantity;
          }
        });
      },

      removeItemOptimistic: (itemId) => {
        set((state) => {
          state.items = state.items.filter(item => item.id !== itemId);
        });
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },

      setLoading: (loading) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      clearCart: async () => {
        const state = get();
        const originalItems = [...state.items];

        // Optimistic update
        set((state) => {
          state.items = [];
        });

        try {
          state.setLoading(true);

          const response = await fetch('/api/cart', {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to clear cart');
          }

          state.setError(null);
        } catch (error) {
          // Revert optimistic update
          set((state) => {
            state.items = originalItems;
          });

          state.setError(error.message);
          throw error;
        } finally {
          state.setLoading(false);
        }
      }
    })),
    {
      name: 'bigg-buzz-cart',
      version: 1,
      partialize: (state) => ({
        items: state.items,
        lastSyncAt: state.lastSyncAt
      })
    }
  )
);

// Helper function to get auth token
function getAuthToken(): string {
  // Integration with existing auth store
  const authStore = useAuthStore.getState();
  return authStore.token || '';
}
```

**Technical Requirements:**
- Optimistic updates for smooth UX
- Error handling with rollback capability
- Real-time synchronization with backend
- Performance optimization with proper memoization
- Integration with existing authentication

**Acceptance Criteria:**
- [ ] Cart store integrates seamlessly with backend APIs
- [ ] Optimistic updates provide smooth user experience
- [ ] Error handling properly reverts failed operations
- [ ] Synchronization keeps cart up-to-date
- [ ] Performance is maintained with large cart sizes

---

### Task 2.3: Add Cart Tab to Marketplace Navigation (Day 12-13)
**Priority: High | Estimated Time: 6 hours**

**Objectives:**
- Add cart tab as 4th navigation option in marketplace
- Maintain existing design patterns and responsiveness
- Integrate cart count badge and visual indicators
- Ensure smooth tab transitions

**Deliverables:**
```tsx
// Updates to src/app/marketplace/page.tsx
const MarketplacePage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'browse' | 'cart'>('browse');
  const { itemCount } = useCartStore();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header with token balance - existing */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        {/* Existing header content */}
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="bg-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {/* Existing tabs */}
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Orders
            </button>

            <button
              onClick={() => setActiveTab('browse')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'browse'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Browse Products
            </button>

            {/* New Cart Tab */}
            <button
              onClick={() => setActiveTab('cart')}
              className={`relative py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cart'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Cart
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-emerald-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'browse' && <BrowseProductsTab />}
        {activeTab === 'cart' && <CartTab />}
      </div>
    </div>
  );
};
```

**Design Requirements:**
- Consistent with existing tab styling
- Cart badge shows item count (up to 99+)
- Smooth transitions between tabs
- Mobile-responsive navigation
- Proper keyboard navigation support

**Acceptance Criteria:**
- [ ] Cart tab integrates seamlessly with existing navigation
- [ ] Cart badge displays accurate item count
- [ ] Tab transitions are smooth and responsive
- [ ] Mobile navigation works correctly
- [ ] Accessibility standards are maintained

---

### Task 2.4: Create Cart Tab Component (Day 13-14)
**Priority: High | Estimated Time: 10 hours**

**Objectives:**
- Build comprehensive cart management interface
- Display cart items with quantity controls
- Show cart summary with pricing breakdown
- Implement empty cart state and loading states

**Deliverables:**
```tsx
// src/app/marketplace/components/cart-tab.tsx
'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCartStore } from '@/lib/stores/enhanced-cart-store';
import { useToast } from '@/lib/stores/toast-store';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

export function CartTab() {
  const {
    items,
    itemCount,
    subtotal,
    tax,
    total,
    isLoading,
    error,
    updateQuantity,
    removeItem,
    clearCart,
    syncWithServer
  } = useCartStore();

  const { addToast } = useToast();

  // Sync cart when tab loads
  useEffect(() => {
    syncWithServer().catch((error) => {
      addToast('Failed to sync cart', 'error');
    });
  }, []);

  if (isLoading && items.length === 0) {
    return <CartLoadingSkeleton />;
  }

  if (items.length === 0) {
    return <EmptyCartState />;
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Cart ({itemCount} items)</h2>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearCart()}
                className="text-gray-400 hover:text-red-400"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onQuantityChange={(quantity) => updateQuantity(item.id, quantity)}
                onRemove={() => removeItem(item.id)}
                isUpdating={isLoading}
              />
            ))}
          </div>
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <CartSummary
            subtotal={subtotal}
            tax={tax}
            total={total}
            itemCount={itemCount}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

function CartItemCard({
  item,
  onQuantityChange,
  onRemove,
  isUpdating
}: {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  isUpdating: boolean;
}) {
  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(item.stockQuantity, item.quantity + delta));
    if (newQuantity !== item.quantity) {
      onQuantityChange(newQuantity);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Product Image */}
          <div className="flex-shrink-0 w-20 h-20">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>

          {/* Product Details */}
          <div className="flex-grow min-w-0">
            <h3 className="font-medium text-white truncate">{item.name}</h3>
            <p className="text-sm text-gray-400">{item.vendorName}</p>

            {/* Variant Information */}
            {item.variant && (
              <div className="flex flex-wrap gap-1 mt-1">
                {item.variant.size && (
                  <Badge variant="secondary" className="text-xs">
                    {item.variant.size}
                  </Badge>
                )}
                {item.variant.strain && (
                  <Badge variant="secondary" className="text-xs">
                    {item.variant.strain}
                  </Badge>
                )}
                {item.variant.thc && (
                  <Badge variant="secondary" className="text-xs">
                    {item.variant.thc}% THC
                  </Badge>
                )}
              </div>
            )}

            {/* Stock Status */}
            {!item.inStock && (
              <Badge variant="destructive" className="mt-1 text-xs">
                Out of Stock
              </Badge>
            )}
            {item.inStock && item.stockQuantity < 5 && (
              <Badge variant="outline" className="mt-1 text-xs text-orange-400 border-orange-400">
                Only {item.stockQuantity} left
              </Badge>
            )}
          </div>

          {/* Price and Controls */}
          <div className="flex-shrink-0 text-right space-y-3">
            <div>
              <p className="font-semibold text-emerald-400">
                R {(item.priceAtAdd * item.quantity).toFixed(2)}
              </p>
              <p className="text-sm text-gray-400">
                R {item.priceAtAdd.toFixed(2)} each
              </p>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(-1)}
                disabled={isUpdating || item.quantity <= 1}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-3 w-3" />
              </Button>

              <span className="w-8 text-center text-sm font-medium">
                {item.quantity}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(1)}
                disabled={isUpdating || item.quantity >= item.stockQuantity}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Remove Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={isUpdating}
              className="text-gray-400 hover:text-red-400 p-1 h-auto"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CartSummary({
  subtotal,
  tax,
  total,
  itemCount,
  isLoading
}: {
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
  isLoading: boolean;
}) {
  return (
    <Card className="bg-gray-900 border-gray-700 sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Subtotal ({itemCount} items)</span>
            <span>R {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Tax (10%)</span>
            <span>R {tax.toFixed(2)}</span>
          </div>
          <Separator className="bg-gray-700" />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-emerald-400">R {total.toFixed(2)}</span>
          </div>
        </div>

        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          size="lg"
          disabled={isLoading || itemCount === 0}
        >
          {isLoading ? (
            'Processing...'
          ) : (
            <>
              Proceed to Checkout
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        {/* Continue Shopping */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            // Switch to browse tab
            const event = new CustomEvent('switchTab', { detail: 'browse' });
            window.dispatchEvent(event);
          }}
        >
          Continue Shopping
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyCartState() {
  return (
    <div className="text-center py-12">
      <ShoppingBag className="mx-auto h-24 w-24 text-gray-600 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
      <p className="text-gray-400 mb-6">
        Add some premium cannabis products to get started
      </p>
      <Button
        className="bg-emerald-600 hover:bg-emerald-700"
        onClick={() => {
          const event = new CustomEvent('switchTab', { detail: 'browse' });
          window.dispatchEvent(event);
        }}
      >
        Browse Products
      </Button>
    </div>
  );
}

function CartLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-48" />
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <Skeleton className="w-20 h-20 rounded-lg" />
                  <div className="flex-grow space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="lg:col-span-1">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

**Design Requirements:**
- Consistent with existing marketplace styling
- Responsive grid layout (2/3 cart items, 1/3 summary on desktop)
- Loading states and error handling
- Optimistic updates with visual feedback
- Empty state with clear call-to-action

**Acceptance Criteria:**
- [ ] Cart items display with complete product information
- [ ] Quantity controls work smoothly with validation
- [ ] Cart summary shows accurate calculations
- [ ] Loading and error states are properly handled
- [ ] Empty cart state encourages product browsing

---

## Week 4: Cart Sidebar & Product Integration

### Task 2.5: Create Cart Sidebar/Modal Component (Day 15-16)
**Priority: High | Estimated Time: 8 hours**

**Objectives:**
- Build quick-access cart sidebar using shadcn/ui Sheet component
- Provide cart overview without leaving current page
- Enable quick cart modifications and checkout initiation
- Integrate with existing product browsing flow

**Deliverables:**
```tsx
// src/components/cart/cart-sidebar.tsx
'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCartStore } from '@/lib/stores/enhanced-cart-store';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';

interface CartSidebarProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CartSidebar({ trigger, open, onOpenChange }: CartSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    items,
    itemCount,
    subtotal,
    tax,
    total,
    isLoading,
    updateQuantity,
    removeItem
  } = useCartStore();

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className="relative p-2"
      aria-label={`Cart with ${itemCount} items`}
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <Badge
          variant="default"
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-emerald-500"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      )}
    </Button>
  );

  return (
    <Sheet open={open ?? isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg bg-gray-950 border-gray-800">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Cart ({itemCount} items)
          </SheetTitle>
          <SheetDescription>
            Review your items and proceed to checkout
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full mt-6">
          {items.length === 0 ? (
            <CartSidebarEmpty onClose={() => handleOpenChange(false)} />
          ) : (
            <>
              {/* Cart Items */}
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4">
                  {items.map((item) => (
                    <CartSidebarItem
                      key={item.id}
                      item={item}
                      onQuantityChange={(quantity) => updateQuantity(item.id, quantity)}
                      onRemove={() => removeItem(item.id)}
                      isUpdating={isLoading}
                    />
                  ))}
                </div>
              </ScrollArea>

              <Separator className="bg-gray-800 my-4" />

              {/* Cart Summary */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Subtotal</span>
                    <span>R {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Tax</span>
                    <span>R {tax.toFixed(2)}</span>
                  </div>
                  <Separator className="bg-gray-800" />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-emerald-400">R {total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={isLoading}
                    onClick={() => {
                      // Navigate to cart tab for full checkout
                      handleOpenChange(false);
                      const event = new CustomEvent('switchTab', { detail: 'cart' });
                      window.dispatchEvent(event);
                    }}
                  >
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleOpenChange(false)}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CartSidebarItem({
  item,
  onQuantityChange,
  onRemove,
  isUpdating
}: {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  isUpdating: boolean;
}) {
  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(item.stockQuantity, item.quantity + delta));
    if (newQuantity !== item.quantity) {
      onQuantityChange(newQuantity);
    }
  };

  return (
    <div className="flex items-start space-x-3">
      {/* Product Image */}
      <div className="flex-shrink-0 w-16 h-16">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover rounded-lg"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{item.name}</h4>
        <p className="text-xs text-gray-400">{item.vendorName}</p>

        {/* Variant Info */}
        {item.variant?.size && (
          <Badge variant="secondary" className="text-xs mt-1">
            {item.variant.size}
          </Badge>
        )}

        {/* Price */}
        <p className="text-sm font-medium text-emerald-400 mt-1">
          R {(item.priceAtAdd * item.quantity).toFixed(2)}
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center space-x-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuantityChange(-1)}
            disabled={isUpdating || item.quantity <= 1}
            className="h-6 w-6 p-0"
          >
            <Minus className="h-3 w-3" />
          </Button>

          <span className="text-xs font-medium w-6 text-center">
            {item.quantity}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuantityChange(1)}
            disabled={isUpdating || item.quantity >= item.stockQuantity}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={isUpdating}
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 ml-auto"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CartSidebarEmpty({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-8">
      <ShoppingCart className="h-16 w-16 text-gray-600 mb-4" />
      <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
      <p className="text-gray-400 text-sm mb-6">
        Add some premium cannabis products to get started
      </p>
      <Button
        className="bg-emerald-600 hover:bg-emerald-700"
        onClick={() => {
          onClose();
          // Switch to browse products tab
          const event = new CustomEvent('switchTab', { detail: 'browse' });
          window.dispatchEvent(event);
        }}
      >
        Browse Products
      </Button>
    </div>
  );
}
```

**Integration Points:**
- Add cart sidebar trigger to marketplace header
- Integrate with product card "Add to Cart" buttons
- Connect with existing toast notification system
- Sync with main cart tab state

**Acceptance Criteria:**
- [ ] Cart sidebar provides quick access from anywhere
- [ ] Maintains state consistency with main cart tab
- [ ] Responsive design works on all screen sizes
- [ ] Smooth animations and transitions
- [ ] Proper keyboard navigation and accessibility

---

### Task 2.6: Enhance Product Cards with Cart Controls (Day 16-17)
**Priority: High | Estimated Time: 8 hours**

**Objectives:**
- Enhance existing product cards with improved cart functionality
- Add quantity selectors and variant options
- Implement real-time stock validation
- Improve visual feedback for cart operations

**Deliverables:**
```tsx
// Enhanced product card component for browse products tab
// Updates to existing product cards in src/app/marketplace/page.tsx

function EnhancedProductCard({ product }: { product: Product }) {
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const { addItem, items } = useCartStore();
  const { addToast } = useToast();

  // Check if product is already in cart
  const cartItem = items.find(item =>
    item.productId === product.id &&
    JSON.stringify(item.variant) === JSON.stringify(selectedVariant)
  );

  const handleAddToCart = async () => {
    if (!product.inStock || product.stockQuantity < selectedQuantity) {
      addToast('Not enough stock available', 'error');
      return;
    }

    setIsAddingToCart(true);

    try {
      await addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: selectedQuantity,
        image: product.images[0] || '/placeholder-product.jpg',
        vendorId: product.vendorId,
        vendorName: product.vendor?.name || 'Unknown Vendor',
        priceAtAdd: product.price,
        variant: selectedVariant,
        inStock: product.inStock,
        stockQuantity: product.stockQuantity
      });

      addToast(`Added ${selectedQuantity} ${product.name} to cart`, 'success');
      setSelectedQuantity(1); // Reset quantity after adding
    } catch (error) {
      addToast(error.message || 'Failed to add to cart', 'error');
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-700 hover:border-emerald-500 transition-colors flex flex-col h-full">
      <div className="relative">
        {/* Product Image */}
        <div className="aspect-square relative overflow-hidden rounded-t-lg">
          <img
            src={product.images[0] || '/placeholder-product.jpg'}
            alt={product.name}
            className="w-full h-full object-cover"
          />

          {/* Stock Badge */}
          {!product.inStock && (
            <Badge
              variant="destructive"
              className="absolute top-2 right-2"
            >
              Out of Stock
            </Badge>
          )}
          {product.inStock && product.stockQuantity < 5 && (
            <Badge
              variant="outline"
              className="absolute top-2 right-2 text-orange-400 border-orange-400"
            >
              Only {product.stockQuantity} left
            </Badge>
          )}

          {/* Cart Status Indicator */}
          {cartItem && (
            <Badge
              variant="default"
              className="absolute top-2 left-2 bg-emerald-500"
            >
              {cartItem.quantity} in cart
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        {/* Product Info */}
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-2 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-gray-400 text-sm mb-3 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* THC/CBD Info */}
          {(product.thcContent || product.cbdContent) && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {product.thcContent && (
                <div className="bg-gray-800 p-2 rounded text-center">
                  <div className="text-xs text-gray-400 mb-1">THC</div>
                  <div className="text-white font-semibold text-sm">
                    {product.thcContent}%
                  </div>
                </div>
              )}
              {product.cbdContent && (
                <div className="bg-gray-800 p-2 rounded text-center">
                  <div className="text-xs text-gray-400 mb-1">CBD</div>
                  <div className="text-white font-semibold text-sm">
                    {product.cbdContent}%
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Variant Selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-2 block">Size</label>
              <select
                value={selectedVariant?.size || ''}
                onChange={(e) => setSelectedVariant({
                  ...selectedVariant,
                  size: e.target.value
                })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
              >
                <option value="">Select size</option>
                {product.variants.map((variant) => (
                  <option key={variant.size} value={variant.size}>
                    {variant.size} - R {variant.price?.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Price */}
          <div className="mb-4">
            <span className="text-2xl font-bold text-emerald-400 whitespace-nowrap">
              R {product.price.toFixed(2)}
            </span>
            {product.weight && (
              <span className="text-gray-400 text-sm ml-2">
                / {product.weight}g
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Section */}
        <div className="space-y-3">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400">Quantity</label>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                disabled={selectedQuantity <= 1}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-3 w-3" />
              </Button>

              <span className="w-8 text-center text-sm font-medium">
                {selectedQuantity}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedQuantity(Math.min(product.stockQuantity, selectedQuantity + 1))}
                disabled={selectedQuantity >= product.stockQuantity}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={!product.inStock || isAddingToCart || product.stockQuantity < selectedQuantity}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            {isAddingToCart ? (
              'Adding...'
            ) : !product.inStock ? (
              'Out of Stock'
            ) : product.stockQuantity < selectedQuantity ? (
              'Not Enough Stock'
            ) : (
              `Add R ${(product.price * selectedQuantity).toFixed(2)} to Cart`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Add CartSidebar to marketplace header
function MarketplaceHeader() {
  return (
    <div className="bg-gray-900 border-b border-gray-800 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Existing header content */}
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-emerald-400">
            Bigg Buzz
          </h1>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-4">
          {/* Token Balance Card - existing */}
          <Card className="bg-emerald-600 border-emerald-500">
            <CardContent className="p-3 flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-emerald-900 font-bold">R</span>
              </div>
              <div>
                <p className="text-emerald-100 text-sm">Available Balance</p>
                <p className="text-white font-bold">R 245.50</p>
              </div>
            </CardContent>
          </Card>

          {/* Cart Sidebar Trigger */}
          <CartSidebar />

          {/* User Menu - existing */}
          <Button variant="ghost" size="sm">
            Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Enhancement Features:**
- Quantity selector with stock validation
- Variant selection (size, strain options)
- Real-time cart status indication
- Improved pricing display with totals
- Visual feedback for cart operations
- Stock availability warnings

**Acceptance Criteria:**
- [ ] Product cards show comprehensive cart controls
- [ ] Quantity selection respects stock limits
- [ ] Variant selection works smoothly
- [ ] Real-time cart status is displayed
- [ ] Visual feedback for all user actions

---

## Phase 2 Deliverables Summary

### Week 3 Deliverables:
- [ ] Enhanced cart store with backend API integration
- [ ] Cart tab added to marketplace navigation
- [ ] Comprehensive cart management interface
- [ ] Real-time synchronization and error handling

### Week 4 Deliverables:
- [ ] Cart sidebar for quick access
- [ ] Enhanced product cards with cart controls
- [ ] Optimistic updates and visual feedback
- [ ] Complete cart management workflow

### Testing Requirements:
- [ ] Unit tests for cart store operations
- [ ] Integration tests for API synchronization
- [ ] Responsive design tests on multiple devices
- [ ] Accessibility tests for cart components
- [ ] Performance tests for large cart operations

### Documentation:
- [ ] Component API documentation
- [ ] Cart store usage guide
- [ ] Integration patterns documentation
- [ ] Accessibility implementation notes

---

*Continue to Phase 3 tasks once Phase 2 is complete and tested.*