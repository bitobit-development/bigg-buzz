'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle,
  Package,
  Truck,
  Clock,
  MapPin,
  CreditCard,
  ArrowRight,
  Download,
  Mail,
  Copy,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  deliveryMethod: string;
  deliveryAddress: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  notes?: string;
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    priceAtOrder: number;
    variant?: any;
    product: {
      id: string;
      name: string;
      images: string[];
      category: string;
      vendor: {
        id: string;
        name: string;
      };
    };
  }>;
}

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch order details
  const fetchOrder = async () => {
    if (!orderId) {
      router.push('/marketplace');
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      const orderData = await response.json();
      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
      router.push('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  // Copy order number to clipboard
  const copyOrderNumber = () => {
    if (order) {
      navigator.clipboard.writeText(order.orderNumber);
      toast.success('Order number copied to clipboard');
    }
  };

  // Get delivery time estimate
  const getDeliveryEstimate = (deliveryMethod: string) => {
    switch (deliveryMethod) {
      case 'EXPRESS':
        return '1-2 business days';
      case 'STANDARD':
        return '3-5 business days';
      case 'PICKUP':
        return 'Ready for pickup in 1-2 hours';
      default:
        return 'Processing';
    }
  };

  // Get delivery fee
  const getDeliveryFee = (deliveryMethod: string) => {
    switch (deliveryMethod) {
      case 'EXPRESS':
        return 50;
      case 'STANDARD':
        return 25;
      case 'PICKUP':
        return 0;
      default:
        return 0;
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-4">
              <Skeleton className="h-16 w-16 rounded-full mx-auto" />
              <Skeleton className="h-8 w-64 mx-auto" />
              <Skeleton className="h-6 w-48 mx-auto" />
            </div>
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-6 space-y-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 bigg-glow-green">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Order Confirmed!</h1>
            <p className="text-gray-400 text-lg">
              Thank you for your order. We'll send you a confirmation email shortly.
            </p>
          </div>

          {/* Order Details */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <span>Order Details</span>
                  <Badge variant="outline" className="text-emerald-400 border-emerald-400">
                    {order.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-400 text-sm">Order Number</div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono text-lg">{order.orderNumber}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyOrderNumber}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Order Date</div>
                    <div className="text-white text-lg">
                      {new Date(order.createdAt).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Amount</span>
                  <span className="text-2xl font-bold text-emerald-400">
                    R {order.total.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Truck className="w-5 h-5 text-emerald-400" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Delivery Method</div>
                    <div className="flex items-center gap-2">
                      {order.deliveryMethod === 'EXPRESS' && <Clock className="w-4 h-4 text-amber-400" />}
                      {order.deliveryMethod === 'STANDARD' && <Package className="w-4 h-4 text-emerald-400" />}
                      {order.deliveryMethod === 'PICKUP' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                      <span className="text-white">
                        {order.deliveryMethod === 'EXPRESS' && 'Express Delivery'}
                        {order.deliveryMethod === 'STANDARD' && 'Standard Delivery'}
                        {order.deliveryMethod === 'PICKUP' && 'Store Pickup'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Estimated Delivery</div>
                    <div className="text-white">
                      {getDeliveryEstimate(order.deliveryMethod)}
                    </div>
                  </div>
                </div>

                {order.deliveryMethod !== 'PICKUP' && (
                  <>
                    <Separator className="bg-gray-700" />
                    <div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                        <MapPin className="w-4 h-4" />
                        Delivery Address
                      </div>
                      <div className="text-white">
                        <div>{order.deliveryAddress.street}</div>
                        <div>
                          {order.deliveryAddress.city}, {order.deliveryAddress.province} {order.deliveryAddress.postalCode}
                        </div>
                        <div>{order.deliveryAddress.country}</div>
                      </div>
                    </div>
                  </>
                )}

                {order.notes && (
                  <>
                    <Separator className="bg-gray-700" />
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Order Notes</div>
                      <div className="text-white">{order.notes}</div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Items Ordered */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Package className="w-5 h-5 text-emerald-400" />
                  Items Ordered ({order.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-gray-800 rounded-lg">
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
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{item.product.name}</h4>
                        <p className="text-gray-400 text-sm">{item.product.vendor.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {item.product.category}
                          </Badge>
                          {item.variant && Object.entries(item.variant).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {String(value)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-semibold">
                          R {(item.priceAtOrder * item.quantity).toFixed(2)}
                        </div>
                        <div className="text-gray-400 text-sm">
                          R {item.priceAtOrder.toFixed(2)} × {item.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="bg-gray-700 my-4" />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <span>R {order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Tax</span>
                    <span>R {order.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Delivery</span>
                    <span>
                      {getDeliveryFee(order.deliveryMethod) === 0
                        ? 'Free'
                        : `R ${getDeliveryFee(order.deliveryMethod).toFixed(2)}`
                      }
                    </span>
                  </div>
                  <Separator className="bg-gray-700" />
                  <div className="flex justify-between text-xl font-semibold">
                    <span className="text-white">Total</span>
                    <span className="text-emerald-400">R {order.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => router.push('/marketplace')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
              >
                <Package className="w-4 h-4 mr-2" />
                Continue Shopping
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => router.push('/marketplace?tab=orders')}
                variant="outline"
                className="border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black flex-1"
              >
                View All Orders
              </Button>
            </div>

            {/* Help Section */}
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Need Help?</h3>
                  <p className="text-gray-400 mb-4">
                    If you have any questions about your order, our customer service team is here to help.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline" className="border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black">
                      <Mail className="w-4 h-4 mr-2" />
                      Contact Support
                    </Button>
                    <Button variant="outline" className="border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Track Order
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function OrderSuccessLoadingFallback() {
  return (
    <div className="min-h-screen bg-black">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-6 w-48 mx-auto" />
          </div>
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6 space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<OrderSuccessLoadingFallback />}>
      <OrderSuccessContent />
    </Suspense>
  );
}