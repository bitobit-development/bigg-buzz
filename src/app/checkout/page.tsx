'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Truck,
  Package,
  Clock,
  CheckCircle,
  Coins,
  Banknote,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface CartData {
  id: string;
  items: Array<{
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
      vendor: {
        id: string;
        name: string;
      };
    };
  }>;
  summary: {
    itemCount: number;
    subtotal: number;
    tax: number;
    total: number;
  };
}

interface DeliveryAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

type DeliveryMethod = 'STANDARD' | 'EXPRESS' | 'PICKUP';
type PaymentMethod = 'TOKENS' | 'CASH_ON_DELIVERY';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Form state
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'South Africa'
  });
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('STANDARD');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TOKENS');
  const [notes, setNotes] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);

  // User's token balance (mock - should be fetched from user profile)
  const [tokenBalance, setTokenBalance] = useState(0);

  // Delivery fees
  const deliveryFees = {
    STANDARD: 25,
    EXPRESS: 50,
    PICKUP: 0
  };

  // Calculate total with delivery
  const calculateTotalWithDelivery = () => {
    if (!cart) return 0;
    return cart.summary.total + deliveryFees[deliveryMethod];
  };

  // Fetch cart data and user balance
  const fetchData = async () => {
    try {
      const [cartResponse, profileResponse] = await Promise.all([
        fetch('/api/cart'),
        fetch('/api/users/profile')
      ]);

      if (!cartResponse.ok) {
        throw new Error('Failed to fetch cart');
      }

      const cartData = await cartResponse.json();
      setCart(cartData);

      // Get user's token balance if profile request succeeds
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setTokenBalance(profileData.tokenBalance || 0);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  // Validate form
  const validateForm = () => {
    if (!deliveryAddress.street.trim()) {
      toast.error('Please enter your street address');
      return false;
    }
    if (!deliveryAddress.city.trim()) {
      toast.error('Please enter your city');
      return false;
    }
    if (!deliveryAddress.province.trim()) {
      toast.error('Please select your province');
      return false;
    }
    if (!deliveryAddress.postalCode.trim()) {
      toast.error('Please enter your postal code');
      return false;
    }

    const total = calculateTotalWithDelivery();
    if (paymentMethod === 'TOKENS' && tokenBalance < total) {
      toast.error('Insufficient token balance for this order');
      return false;
    }

    return true;
  };

  // Submit order
  const submitOrder = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const orderData = {
        deliveryAddress,
        deliveryMethod,
        paymentMethod,
        notes: notes.trim() || undefined
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      const order = await response.json();

      // Redirect to order success page
      router.push(`/order-success?orderId=${order.id}`);
      toast.success('Order placed successfully!');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchData();
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
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-6 space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
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
    router.push('/cart');
    return null;
  }

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
            <h1 className="text-3xl font-bold text-white">Checkout</h1>
            <Badge variant="outline" className="text-emerald-400 border-emerald-400">
              {cart.summary.itemCount} item{cart.summary.itemCount !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Address */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="street" className="text-gray-300">Street Address</Label>
                      <Input
                        id="street"
                        value={deliveryAddress.street}
                        onChange={(e) => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
                        placeholder="123 Main Street"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-gray-300">City</Label>
                      <Input
                        id="city"
                        value={deliveryAddress.city}
                        onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Cape Town"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="province" className="text-gray-300">Province</Label>
                      <Select
                        value={deliveryAddress.province}
                        onValueChange={(value) => setDeliveryAddress(prev => ({ ...prev, province: value }))}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="Western Cape" className="text-white">Western Cape</SelectItem>
                          <SelectItem value="Gauteng" className="text-white">Gauteng</SelectItem>
                          <SelectItem value="KwaZulu-Natal" className="text-white">KwaZulu-Natal</SelectItem>
                          <SelectItem value="Eastern Cape" className="text-white">Eastern Cape</SelectItem>
                          <SelectItem value="Free State" className="text-white">Free State</SelectItem>
                          <SelectItem value="Limpopo" className="text-white">Limpopo</SelectItem>
                          <SelectItem value="Mpumalanga" className="text-white">Mpumalanga</SelectItem>
                          <SelectItem value="Northern Cape" className="text-white">Northern Cape</SelectItem>
                          <SelectItem value="North West" className="text-white">North West</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="postalCode" className="text-gray-300">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={deliveryAddress.postalCode}
                        onChange={(e) => setDeliveryAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                        placeholder="8001"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country" className="text-gray-300">Country</Label>
                      <Input
                        id="country"
                        value={deliveryAddress.country}
                        disabled
                        className="bg-gray-800 border-gray-600 text-gray-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="saveAddress"
                      checked={saveAddress}
                      onCheckedChange={setSaveAddress}
                    />
                    <Label htmlFor="saveAddress" className="text-gray-300 text-sm">
                      Save this address for future orders
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Method */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Truck className="w-5 h-5 text-emerald-400" />
                    Delivery Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3">
                    <label className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                      deliveryMethod === 'STANDARD'
                        ? 'border-emerald-400 bg-emerald-400/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}>
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="STANDARD"
                        checked={deliveryMethod === 'STANDARD'}
                        onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5 text-emerald-400" />
                          <div>
                            <div className="font-semibold text-white">Standard Delivery</div>
                            <div className="text-sm text-gray-400">3-5 business days</div>
                          </div>
                        </div>
                        <div className="text-emerald-400 font-semibold">
                          R {deliveryFees.STANDARD.toFixed(2)}
                        </div>
                      </div>
                    </label>

                    <label className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                      deliveryMethod === 'EXPRESS'
                        ? 'border-emerald-400 bg-emerald-400/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}>
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="EXPRESS"
                        checked={deliveryMethod === 'EXPRESS'}
                        onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-amber-400" />
                          <div>
                            <div className="font-semibold text-white">Express Delivery</div>
                            <div className="text-sm text-gray-400">1-2 business days</div>
                          </div>
                        </div>
                        <div className="text-emerald-400 font-semibold">
                          R {deliveryFees.EXPRESS.toFixed(2)}
                        </div>
                      </div>
                    </label>

                    <label className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                      deliveryMethod === 'PICKUP'
                        ? 'border-emerald-400 bg-emerald-400/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}>
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="PICKUP"
                        checked={deliveryMethod === 'PICKUP'}
                        onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                          <div>
                            <div className="font-semibold text-white">Store Pickup</div>
                            <div className="text-sm text-gray-400">Ready in 1-2 hours</div>
                          </div>
                        </div>
                        <div className="text-emerald-400 font-semibold">
                          Free
                        </div>
                      </div>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <label className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                    paymentMethod === 'TOKENS'
                      ? 'border-emerald-400 bg-emerald-400/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="TOKENS"
                      checked={paymentMethod === 'TOKENS'}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <Coins className="w-5 h-5 text-emerald-400" />
                        <div>
                          <div className="font-semibold text-white">Bigg Buzz Tokens</div>
                          <div className="text-sm text-gray-400">
                            Available: R {tokenBalance.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      {tokenBalance < calculateTotalWithDelivery() && (
                        <div className="flex items-center gap-2 text-amber-400">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm">Insufficient balance</span>
                        </div>
                      )}
                    </div>
                  </label>

                  <label className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                    paymentMethod === 'CASH_ON_DELIVERY'
                      ? 'border-emerald-400 bg-emerald-400/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH_ON_DELIVERY"
                      checked={paymentMethod === 'CASH_ON_DELIVERY'}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <Banknote className="w-5 h-5 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-white">Cash on Delivery</div>
                        <div className="text-sm text-gray-400">Pay when you receive your order</div>
                      </div>
                    </div>
                  </label>
                </CardContent>
              </Card>

              {/* Order Notes */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Order Notes (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions for your order..."
                    className="bg-gray-800 border-gray-600 text-white"
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="bg-gray-900 border-gray-700 sticky top-8">
                <CardHeader>
                  <CardTitle className="text-white">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items */}
                  <div className="space-y-3">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div className="flex-1">
                          <div className="text-white">{item.product.name}</div>
                          <div className="text-gray-400">
                            {item.product.vendor.name} × {item.quantity}
                          </div>
                        </div>
                        <div className="text-emerald-400 font-semibold">
                          R {(item.priceAtAdd * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-gray-700" />

                  {/* Pricing breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-300">
                      <span>Subtotal</span>
                      <span>R {cart.summary.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Tax</span>
                      <span>R {cart.summary.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Delivery</span>
                      <span>
                        {deliveryFees[deliveryMethod] === 0
                          ? 'Free'
                          : `R ${deliveryFees[deliveryMethod].toFixed(2)}`
                        }
                      </span>
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div className="flex justify-between text-xl font-semibold text-white">
                    <span>Total</span>
                    <span className="text-emerald-400">
                      R {calculateTotalWithDelivery().toFixed(2)}
                    </span>
                  </div>

                  <Button
                    onClick={submitOrder}
                    disabled={submitting || (paymentMethod === 'TOKENS' && tokenBalance < calculateTotalWithDelivery())}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-6"
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Place Order
                      </>
                    )}
                  </Button>

                  {paymentMethod === 'TOKENS' && tokenBalance < calculateTotalWithDelivery() && (
                    <div className="text-amber-400 text-sm text-center mt-2">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      Insufficient token balance. Please top up or select cash on delivery.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}