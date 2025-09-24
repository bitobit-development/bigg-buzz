import { create } from 'zustand';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtAdd: number;
  variant?: any;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    inStock: boolean;
    stockQuantity: number;
    vendor: {
      id: string;
      name: string;
    };
  };
}

interface CartSummary {
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
}

interface CartData {
  id: string;
  items: CartItem[];
  summary: CartSummary;
}

interface CartState {
  cart: CartData | null;
  isOpen: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number, variant?: any) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleCart: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isOpen: false,
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  fetchCart: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/cart', {
        credentials: 'include',
      });
      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, set empty cart
          set({ cart: { id: '', items: [], summary: { itemCount: 0, subtotal: 0, tax: 0, total: 0 } }, loading: false });
          return;
        }
        throw new Error('Failed to fetch cart');
      }
      const cartData = await response.json();
      set({ cart: cartData, loading: false });
    } catch (error) {
      console.error('Error fetching cart:', error);
      const errorMessage = (error as Error).message || 'Unknown error';
      set({ error: errorMessage, loading: false });
      // Don't show toast error for auth issues
      if (!errorMessage.includes('Authentication')) {
        toast.error('Failed to load cart');
      }
    }
  },

  addItem: async (productId, quantity = 1, variant = null) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          quantity,
          variant,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Please sign in to add items to cart');
          set({ loading: false });
          return;
        }
        try {
          const error = await response.json();
          throw new Error(error.error || 'Failed to add item to cart');
        } catch (jsonError) {
          // If response doesn't contain JSON, throw a generic error
          throw new Error(`Failed to add item to cart (${response.status})`);
        }
      }

      // Refresh cart data
      await get().fetchCart();
      toast.success('Item added to cart');
    } catch (error) {
      console.error('Error adding item to cart:', error);
      const errorMessage = (error as Error).message || 'Unknown error';
      set({ error: errorMessage, loading: false });
      if (!errorMessage.includes('sign in')) {
        toast.error(errorMessage || 'Failed to add item to cart');
      }
    }
  },

  updateQuantity: async (itemId, quantity) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        try {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update quantity');
        } catch (jsonError) {
          throw new Error(`Failed to update quantity (${response.status})`);
        }
      }

      // Refresh cart data
      await get().fetchCart();
      toast.success('Quantity updated');
    } catch (error) {
      console.error('Error updating quantity:', error);
      const errorMessage = (error as Error).message || 'Unknown error';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage || 'Failed to update quantity');
    }
  },

  removeItem: async (itemId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        try {
          const error = await response.json();
          throw new Error(error.error || 'Failed to remove item');
        } catch (jsonError) {
          throw new Error(`Failed to remove item (${response.status})`);
        }
      }

      // Refresh cart data
      await get().fetchCart();
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      const errorMessage = (error as Error).message || 'Unknown error';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage || 'Failed to remove item');
    }
  },

  clearCart: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        try {
          const error = await response.json();
          throw new Error(error.error || 'Failed to clear cart');
        } catch (jsonError) {
          throw new Error(`Failed to clear cart (${response.status})`);
        }
      }

      // Refresh cart data
      await get().fetchCart();
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
      const errorMessage = (error as Error).message || 'Unknown error';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage || 'Failed to clear cart');
    }
  },
}));