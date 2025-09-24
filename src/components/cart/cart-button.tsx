'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/lib/stores/cart-store';
import { CartSidebar } from './cart-sidebar';

interface CartButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function CartButton({ variant = 'ghost', size = 'default', className }: CartButtonProps) {
  const { cart, toggleCart, fetchCart } = useCartStore();

  useEffect(() => {
    // Fetch cart data on component mount
    fetchCart();
  }, [fetchCart]);

  const itemCount = cart?.summary?.itemCount || 0;

  return (
    <CartSidebar
      trigger={
        <Button
          variant={variant}
          size={size}
          className={`relative ${className}`}
          onClick={toggleCart}
        >
          <ShoppingCart className="w-5 h-5" />
          {itemCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-emerald-600 hover:bg-emerald-600"
            >
              {itemCount > 99 ? '99+' : itemCount}
            </Badge>
          )}
          <span className="sr-only">
            Shopping cart with {itemCount} item{itemCount !== 1 ? 's' : ''}
          </span>
        </Button>
      }
    />
  );
}