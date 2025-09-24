'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Package,
  CreditCard,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
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

interface CartData {
  id: string;
  items: CartItem[];
  summary: {
    itemCount: number;
    subtotal: number;
    tax: number;
    total: number;
  };
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Fetch cart data
  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart');
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }
      const cartData = await response.json();
      setCart(cartData);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }

    setUpdating(itemId);
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update quantity');
      }

      // Refresh cart data
      await fetchCart();
      toast.success('Quantity updated');
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error(error.message || 'Failed to update quantity');
    } finally {
      setUpdating(null);
    }
  };

  // Remove item from cart
  const removeItem = async (itemId: string) => {
    setUpdating(itemId);
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove item');
      }

      // Refresh cart data
      await fetchCart();
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error(error.message || 'Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear cart');
      }

      await fetchCart();
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error(error.message || 'Failed to clear cart');
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-8 w-48" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="bg-gray-900 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <Skeleton className="w-20 h-20 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <div className="flex gap-2">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-12" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div>
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-24" />
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
        </main>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-gray-300 hover:text-emerald-400"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-3xl font-bold text-white">Your Cart</h1>
            </div>

            {/* Empty cart state */}
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-12 text-center">
                <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Your cart is empty</h3>
                <p className="text-gray-400 mb-6">
                  Looks like you haven't added any products to your cart yet.
                </p>
                <Button
                  onClick={() => router.push('/marketplace')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-gray-300 hover:text-emerald-400"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-3xl font-bold text-white">Your Cart</h1>
              <Badge variant="outline" className="text-emerald-400 border-emerald-400">
                {cart.summary.itemCount} item{cart.summary.itemCount !== 1 ? 's' : ''}
              </Badge>
            </div>

            {cart.items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Cart
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <Card key={item.id} className="bg-gray-900 border-gray-700 hover:border-emerald-400/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.product.images && item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-3xl">🌿</span>
                        )}
                      </div>

                      <div className="flex-1">
                        {/* Product Info */}
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-white text-lg">{item.product.name}</h3>
                            <p className="text-gray-400 text-sm">{item.product.vendor.name}</p>
                            {item.variant && (
                              <div className="flex gap-2 mt-1">
                                {Object.entries(item.variant).map(([key, value]) => (
                                  <Badge key={key} variant="secondary" className="text-xs">
                                    {key}: {value}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            disabled={updating === item.id}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Stock Warning */}
                        {item.quantity > item.product.stockQuantity && (
                          <div className="flex items-center gap-2 text-amber-400 text-sm mb-3">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Only {item.product.stockQuantity} available in stock</span>
                          </div>
                        )}

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={updating === item.id}
                              className="w-8 h-8 p-0 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-black"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              max={item.product.stockQuantity}
                              value={item.quantity}
                              onChange={(e) => {
                                const newQuantity = parseInt(e.target.value);
                                if (newQuantity > 0 && newQuantity <= item.product.stockQuantity) {
                                  updateQuantity(item.id, newQuantity);
                                }
                              }}
                              disabled={updating === item.id}
                              className="w-16 text-center bg-gray-800 border-gray-600 text-white"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={updating === item.id || item.quantity >= item.product.stockQuantity}
                              className="w-8 h-8 p-0 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-black"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="text-right">
                            <div className="text-emerald-400 font-semibold">
                              R {(item.priceAtAdd * item.quantity).toFixed(2)}
                            </div>
                            {item.priceAtAdd !== item.product.price && (
                              <div className="text-xs text-gray-400">
                                Current price: R {item.product.price.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="bg-gray-900 border-gray-700 sticky top-8">
                <CardHeader>
                  <CardTitle className="text-white">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal ({cart.summary.itemCount} item{cart.summary.itemCount !== 1 ? 's' : ''})</span>
                    <span>R {cart.summary.subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-gray-300">
                    <span>Tax (10%)</span>
                    <span>R {cart.summary.tax.toFixed(2)}</span>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div className="flex justify-between text-xl font-semibold text-white">
                    <span>Total</span>
                    <span className="text-emerald-400">R {cart.summary.total.toFixed(2)}</span>
                  </div>

                  <Button
                    onClick={() => router.push('/checkout')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-6"
                    size="lg"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <Button
                    onClick={() => router.push('/marketplace')}
                    variant="ghost"
                    className="w-full text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                  >
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}