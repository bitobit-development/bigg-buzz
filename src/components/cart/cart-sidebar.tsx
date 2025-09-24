'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Package,
  X
} from 'lucide-react';
import { useCartStore } from '@/lib/stores/cart-store';
import { toast } from 'sonner';

interface CartSidebarProps {
  trigger?: React.ReactNode;
}

export function CartSidebar({ trigger }: CartSidebarProps) {
  const router = useRouter();
  const {
    cart,
    isOpen,
    loading,
    error,
    fetchCart,
    removeItem,
    updateQuantity,
    toggleCart
  } = useCartStore();

  useEffect(() => {
    if (isOpen && !cart) {
      fetchCart();
    }
  }, [isOpen, cart, fetchCart]);

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeItem(itemId);
    } else {
      await updateQuantity(itemId, newQuantity);
    }
  };

  const handleCheckout = () => {
    toggleCart();
    router.push('/checkout');
  };

  const handleViewCart = () => {
    toggleCart();
    router.push('/cart');
  };

  return (
    <Sheet open={isOpen} onOpenChange={toggleCart}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}

      <SheetContent side="right" className="w-full sm:w-[400px] bg-gray-900 border-gray-700 text-white p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                Your Cart
                {cart && (
                  <Badge variant="outline" className="text-emerald-400 border-emerald-400">
                    {cart.summary.itemCount}
                  </Badge>
                )}
              </SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCart}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            {loading ? (
              <div className="flex-1 px-6 py-4 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-16 h-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-6" />
                        <Skeleton className="h-6 w-8" />
                        <Skeleton className="h-6 w-6" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center px-6 py-8">
                <div className="text-center">
                  <p className="text-red-400 mb-2">Failed to load cart</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchCart}
                    className="border-emerald-400 text-emerald-400"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : !cart || cart.items.length === 0 ? (
              <div className="flex-1 flex items-center justify-center px-6 py-8">
                <div className="text-center">
                  <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">Your cart is empty</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Add some products to get started
                  </p>
                  <Button
                    onClick={() => {
                      toggleCart();
                      router.push('/marketplace');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Shop Now
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="flex-1 px-6 py-4 overflow-y-auto">
                  <div className="space-y-4">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex gap-3 p-3 bg-gray-800 rounded-lg">
                        {/* Product Image */}
                        <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          {item.product.images && item.product.images.length > 0 ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <span className="text-2xl">🌿</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Product Info */}
                          <h4 className="font-medium text-white text-sm truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-gray-400 text-xs truncate">
                            {item.product.vendor.name}
                          </p>

                          {/* Variant */}
                          {item.variant && (
                            <div className="flex gap-1 mt-1">
                              {Object.entries(item.variant).map(([key, value]) => (
                                <Badge key={key} variant="secondary" className="text-xs">
                                  {key}: {String(value)}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="w-6 h-6 p-0 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-black"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-white text-sm font-medium w-6 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stockQuantity}
                              className="w-6 h-6 p-0 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-black"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="w-6 h-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10 ml-auto"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right flex-shrink-0">
                          <div className="text-emerald-400 font-semibold text-sm">
                            R {(item.priceAtAdd * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-700 px-6 py-4">
                  {/* Summary */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-gray-300">
                      <span>Subtotal</span>
                      <span>R {cart.summary.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Tax</span>
                      <span>R {cart.summary.tax.toFixed(2)}</span>
                    </div>
                    <Separator className="bg-gray-700" />
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-white">Total</span>
                      <span className="text-emerald-400">R {cart.summary.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={handleCheckout}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Checkout
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      onClick={handleViewCart}
                      variant="outline"
                      className="w-full border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black"
                    >
                      View Cart
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}