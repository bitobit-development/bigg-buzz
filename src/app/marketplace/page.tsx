'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Coins,
  ShoppingBag,
  History,
  Store,
  TrendingUp,
  LogOut,
  User,
  Phone,
  Search,
  Filter,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RotateCcw,
  Plus,
  Minus,
  Star,
  Leaf,
  FlaskConical,
  Cookie,
  ShoppingCart
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCartStore } from '@/lib/stores/cart-store';
import { CartButton } from '@/components/cart';
import { useProducts } from '@/lib/hooks/use-products';
import { useSubscriberProfile } from '@/lib/hooks/use-subscriber-profile';
import { useOrders } from '@/lib/hooks/use-orders';
import { useTokenTransactions } from '@/lib/hooks/use-token-transactions';
import { useDashboardStats } from '@/lib/hooks/use-dashboard-stats';

export default function MarketplacePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  // Real subscriber data
  const { subscriber, loading: profileLoading, error: profileError } = useSubscriberProfile();

  // Real dashboard data
  const { stats: dashboardStats, loading: statsLoading, error: statsError } = useDashboardStats();
  const { orders: recentOrdersData, loading: ordersLoading, error: ordersError } = useOrders({}, 1, 5); // Get 5 recent orders
  const { transactions: tokenTransactionsData, loading: transactionsLoading, error: transactionsError } = useTokenTransactions({}, 1, 5); // Get 5 recent transactions

  // Helper function to get status color for orders
  const getOrderStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return 'text-emerald-400 border-emerald-400 bg-emerald-400/10';
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return 'text-blue-400 border-blue-400 bg-blue-400/10';
      case 'PROCESSING':
      case 'CONFIRMED':
      case 'PACKED':
        return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'text-red-400 border-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 border-gray-400 bg-gray-400/10';
    }
  };

  // Format status text for display
  const formatOrderStatus = (status: string) => {
    return status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ');
  };

  // Helper function to format transaction type for display
  const formatTransactionType = (type: string) => {
    return type.charAt(0) + type.slice(1).toLowerCase();
  };

  // Helper function to format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // State declarations must come before they're used in hooks
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Use real orders data for the orders tab
  const { orders: allOrdersData, loading: allOrdersLoading, error: allOrdersError } = useOrders(
    {
      status: selectedStatus === 'all' ? undefined : selectedStatus.toUpperCase(),
      sortBy: 'createdAt',
      sortOrder: 'desc'
    },
    1,
    50 // Get more orders for the orders tab
  );

  // Phase 4: Browse tab state management
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  // Use cart store instead of local state
  const { cart: cartData, addItem, updateQuantity, removeItem, loading: cartLoading } = useCartStore();

  // Phase 4: Memoize filters to prevent infinite re-renders
  const productFilters = useMemo(() => ({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    search: productSearchQuery || undefined,
    minPrice: priceRange.min ? parseFloat(priceRange.min) : undefined,
    maxPrice: priceRange.max ? parseFloat(priceRange.max) : undefined,
    inStock: true // Only show in-stock products
  }), [selectedCategory, productSearchQuery, priceRange.min, priceRange.max]);

  // Phase 4: Load products from database via API
  const {
    products: apiProducts,
    loading: productsLoading,
    error: productsError,
    pagination,
    refetch: refetchProducts
  } = useProducts(productFilters, 1, 50);

  // Products are now filtered by the API, so we use them directly
  const filteredProducts = apiProducts;

  // Get featured products (first 3 products for featured section)
  const { products: featuredProductsData, loading: featuredLoading, error: featuredError } = useProducts(
    { inStock: true }, // Only featured in-stock products
    1,
    3 // Get only 3 for featured section
  );

  // Phase 4: Cart functions using backend cart store
  const addToCart = async (product, quantity = 1) => {
    try {
      if (!product.inStock) {
        toast.error('This product is currently out of stock');
        return;
      }

      await addItem(product.id, quantity);
    } catch (error) {
      handleProductError(product.id, error.message);
    }
  };

  // Filter orders based on search query (status filtering is handled by the API)
  const filteredOrders = allOrdersData?.filter(order => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return order.orderNumber.toLowerCase().includes(searchLower) ||
           order.items.some(item => item.product.name.toLowerCase().includes(searchLower));
  }) || [];

  const handleLogout = async () => {
    try {
      // Clear the marketplace token cookie
      document.cookie = 'marketplace-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      toast.success('Logged out successfully');
      router.push('/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  // Phase 5: Accessibility and UX improvements
  const handleKeyboardNavigation = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  // Cart calculations
  const cartTotal = cartData?.summary?.total || 0;
  const cartItemCount = cartData?.summary?.itemCount || 0;

  // Phase 5: Error boundary functionality
  const handleProductError = (productId, errorMessage) => {
    console.error(`Product ${productId} error:`, errorMessage);
    toast.error('Unable to process product action. Please try again.');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-emerald-400">Bigg Buzz</h1>
              <Badge variant="outline" className="text-emerald-400 border-emerald-400 bg-emerald-400/10">
                Marketplace
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <User className="w-4 h-4" />
                <span>
                  {profileLoading ? 'Loading...' :
                   profileError ? 'Guest User' :
                   subscriber ? `${subscriber.firstName || 'Unknown'} ${subscriber.lastName || 'User'}` : 'Guest User'}
                </span>
              </div>
              <CartButton
                variant="outline"
                size="sm"
                className="border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black"
              />
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-emerald-400">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
        {/* Token Balance Card */}
        <Card className="mb-8 bg-gray-900 border-emerald-400/30 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Coins className="w-6 h-6 text-emerald-400" />
                <CardTitle className="text-white">Available Balance</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-emerald-400/20 text-emerald-400 border-emerald-400">
                Tokens
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold mb-2 text-emerald-400">
                  R {profileLoading ? '0.00' :
                      profileError ? '0.00' :
                      subscriber ? subscriber.tokenBalance.toFixed(2) : '0.00'}
                </div>
                <p className="text-gray-400">
                  Ready to spend on premium products
                </p>
              </div>
              <Button variant="outline" className="border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black">
                <TrendingUp className="w-4 h-4 mr-2" />
                View History
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900 border-gray-700">
            <TabsTrigger value="overview" className="flex items-center space-x-2 data-[state=active]:bg-emerald-400 data-[state=active]:text-black text-gray-400 hover:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2 data-[state=active]:bg-emerald-400 data-[state=active]:text-black text-gray-400 hover:text-emerald-400">
              <History className="w-4 h-4" />
              <span>Orders</span>
            </TabsTrigger>
            <TabsTrigger value="browse" className="flex items-center space-x-2 data-[state=active]:bg-emerald-400 data-[state=active]:text-black text-gray-400 hover:text-emerald-400">
              <Store className="w-4 h-4" />
              <span>Browse Products</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <History className="w-5 h-5 text-emerald-400" />
                    <span>Recent Activity</span>
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Your latest transactions and orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ordersLoading ? (
                      // Loading state
                      Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700 animate-pulse">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-700 rounded w-24"></div>
                              <div className="h-3 bg-gray-700 rounded w-32"></div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-700 rounded w-16"></div>
                            <div className="h-6 bg-gray-700 rounded w-20"></div>
                          </div>
                        </div>
                      ))
                    ) : ordersError ? (
                      <div className="text-center py-4">
                        <p className="text-red-400 text-sm">Failed to load recent orders</p>
                      </div>
                    ) : recentOrdersData && recentOrdersData.length > 0 ? (
                      recentOrdersData.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-emerald-400/20 rounded-full flex items-center justify-center">
                              <ShoppingBag className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-sm text-white">{order.orderNumber}</p>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                              </div>
                              <p className="text-xs text-gray-400">
                                {order.items.length} item{order.items.length > 1 ? 's' : ''} • {order.items[0]?.product.name}
                                {order.items.length > 1 && ` +${order.items.length - 1} more`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm text-emerald-400 mb-1 whitespace-nowrap">R {order.total.toFixed(2)}</p>
                            <Badge variant="outline" className={getOrderStatusColor(order.status)}>
                              {formatOrderStatus(order.status)}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-400 text-sm">No recent orders</p>
                      </div>
                    )}

                    <div className="text-center pt-4">
                      <Button
                        variant="ghost"
                        className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                        onClick={() => setActiveTab('orders')}
                      >
                        View All Orders
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <span>Quick Stats</span>
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Your marketplace summary
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statsLoading ? (
                      // Loading state
                      Array.from({ length: 6 }).map((_, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between">
                            <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
                            <div className="h-4 bg-gray-700 rounded w-16 animate-pulse"></div>
                          </div>
                          {index < 5 && <Separator className="bg-gray-700" />}
                        </div>
                      ))
                    ) : statsError ? (
                      <div className="text-center py-4">
                        <p className="text-red-400 text-sm">Failed to load stats</p>
                      </div>
                    ) : dashboardStats ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Total Orders</span>
                          <span className="font-semibold text-emerald-400">{dashboardStats.totalOrders}</span>
                        </div>
                        <Separator className="bg-gray-700" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Total Spent</span>
                          <span className="font-semibold text-emerald-400">R {(dashboardStats.totalSpent || 0).toFixed(2)}</span>
                        </div>
                        <Separator className="bg-gray-700" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">This Month</span>
                          <span className="font-semibold text-emerald-400">R {(dashboardStats.thisMonthSpent || 0).toFixed(2)}</span>
                        </div>
                        <Separator className="bg-gray-700" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Avg. Order Value</span>
                          <span className="font-semibold text-emerald-400">R {(dashboardStats.averageOrderValue || 0).toFixed(2)}</span>
                        </div>
                        <Separator className="bg-gray-700" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Favorite Category</span>
                          <Badge variant="outline" className="text-emerald-400 border-emerald-400">{dashboardStats.favoriteCategory}</Badge>
                        </div>
                        <Separator className="bg-gray-700" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Member Since</span>
                          <span className="text-sm text-gray-300">{dashboardStats.memberSince}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-400 text-sm">No stats available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Token Activity */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Coins className="w-5 h-5 text-emerald-400" />
                    <span>Token Activity</span>
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Recent token transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactionsLoading ? (
                      // Loading state
                      Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700 animate-pulse">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-700 rounded w-32"></div>
                              <div className="h-3 bg-gray-700 rounded w-20"></div>
                            </div>
                          </div>
                          <div className="space-y-2 text-right">
                            <div className="h-4 bg-gray-700 rounded w-16"></div>
                            <div className="h-3 bg-gray-700 rounded w-20"></div>
                          </div>
                        </div>
                      ))
                    ) : transactionsError ? (
                      <div className="text-center py-4">
                        <p className="text-red-400 text-sm">Failed to load transactions</p>
                      </div>
                    ) : tokenTransactionsData && tokenTransactionsData.length > 0 ? (
                      tokenTransactionsData.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              transaction.amount < 0
                                ? 'bg-red-400/20'
                                : 'bg-emerald-400/20'
                            }`}>
                              {transaction.amount < 0 ? (
                                <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
                              ) : (
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-white">
                                {transaction.description || `${formatTransactionType(transaction.type)} Transaction`}
                              </p>
                              <p className="text-xs text-gray-400">{formatDate(transaction.createdAt)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold text-sm whitespace-nowrap ${
                              transaction.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {transaction.amount > 0 ? '+' : ''}R {Math.abs(transaction.amount).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 whitespace-nowrap">
                              Bal: R {transaction.balance.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-400 text-sm">No transactions yet</p>
                      </div>
                    )}

                    <div className="text-center pt-4">
                      <Button
                        variant="ghost"
                        className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                        onClick={() => {
                          // TODO: Implement transaction history modal or page
                          toast.info('Transaction history coming soon!');
                        }}
                      >
                        View All Transactions
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Featured Products Preview */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Store className="w-5 h-5 text-emerald-400" />
                  <span>Featured Products</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Discover premium cannabis products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Featured Product Cards */}
                  <div className="grid grid-cols-1 gap-4">
                    {featuredLoading ? (
                      // Loading state
                      Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="p-3 bg-gray-800 rounded-lg border border-gray-700 animate-pulse">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
                              <div className="h-3 bg-gray-700 rounded w-24 mb-2"></div>
                              <div className="flex items-center space-x-2">
                                <div className="h-5 bg-gray-700 rounded w-16"></div>
                                <div className="h-4 bg-gray-700 rounded w-12"></div>
                              </div>
                            </div>
                            <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
                          </div>
                        </div>
                      ))
                    ) : featuredError ? (
                      <div className="text-center py-4">
                        <p className="text-red-400 text-sm">Failed to load featured products</p>
                      </div>
                    ) : featuredProductsData && featuredProductsData.length > 0 ? (
                      featuredProductsData.map((product) => {
                        const categoryIcon = {
                          FLOWER: '🌿',
                          CONCENTRATES: '🧪',
                          EDIBLES: '🍪',
                          WELLNESS: '💊',
                          ACCESSORIES: '🔧',
                          SEEDS: '🌱',
                          CLONES: '🌿',
                          TOPICALS: '🧴',
                          TINCTURES: '💧',
                          VAPES: '💨'
                        };

                        const categoryColor = {
                          FLOWER: 'text-emerald-400 border-emerald-400',
                          CONCENTRATES: 'text-blue-400 border-blue-400',
                          EDIBLES: 'text-orange-400 border-orange-400',
                          WELLNESS: 'text-purple-400 border-purple-400',
                          ACCESSORIES: 'text-gray-400 border-gray-400',
                          SEEDS: 'text-green-400 border-green-400',
                          CLONES: 'text-lime-400 border-lime-400',
                          TOPICALS: 'text-pink-400 border-pink-400',
                          TINCTURES: 'text-cyan-400 border-cyan-400',
                          VAPES: 'text-indigo-400 border-indigo-400'
                        };

                        return (
                          <div
                            key={product.id}
                            className="p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-emerald-400/50 transition-colors cursor-pointer"
                            onClick={() => setActiveTab('browse')}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-white text-sm">{product.name}</h4>
                                <p className="text-xs text-gray-400">
                                  {product.strain ? `${product.strain} • ` : ''}
                                  {product.thcContent ? `${product.thcContent}% THC • ` : ''}
                                  {product.weight ? `${product.weight}g` : 'Various sizes'}
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Badge variant="outline" className={`text-xs ${categoryColor[product.category] || 'text-gray-400 border-gray-400'}`}>
                                    {product.category.toLowerCase().replace('_', ' ')}
                                  </Badge>
                                  <span className="text-emerald-400 font-semibold text-sm whitespace-nowrap">R {product.price.toFixed(2)}</span>
                                </div>
                              </div>
                              <div className="w-12 h-12 bg-emerald-400/10 rounded-lg flex items-center justify-center">
                                <span className="text-emerald-400 text-lg">
                                  {categoryIcon[product.category] || '🌿'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-400 text-sm">No featured products available</p>
                      </div>
                    )}
                  </div>

                  <div className="text-center pt-4">
                    <Button
                      onClick={() => setActiveTab('browse')}
                      className="bg-emerald-400 hover:bg-emerald-500 text-black w-full"
                    >
                      <Store className="w-4 h-4 mr-2" />
                      Browse All Products
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <History className="w-5 h-5 text-emerald-400" />
                  <span>Order History</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Track your purchases and reorder favorites
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search orders or products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full md:w-48 bg-gray-800 border-gray-700 text-white">
                      <Filter className="w-4 h-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all" className="text-white">All Orders</SelectItem>
                      <SelectItem value="delivered" className="text-white">Delivered</SelectItem>
                      <SelectItem value="shipped" className="text-white">Shipped</SelectItem>
                      <SelectItem value="processing" className="text-white">Processing</SelectItem>
                      <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Order List */}
                <div className="space-y-4">
                  {allOrdersLoading ? (
                    // Loading state
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="p-4 bg-gray-800 rounded-lg border border-gray-700 animate-pulse">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-5 h-5 bg-gray-700 rounded"></div>
                              <div className="h-5 bg-gray-700 rounded w-32"></div>
                              <div className="h-6 bg-gray-700 rounded w-20"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-700 rounded w-20"></div>
                                <div className="h-4 bg-gray-700 rounded w-24"></div>
                              </div>
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-700 rounded w-12"></div>
                                <div className="h-4 bg-gray-700 rounded w-36"></div>
                              </div>
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-700 rounded w-12"></div>
                                <div className="h-4 bg-gray-700 rounded w-16"></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="h-8 bg-gray-700 rounded w-24"></div>
                            <div className="h-8 bg-gray-700 rounded w-20"></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : allOrdersError ? (
                    <div className="text-center py-8">
                      <p className="text-red-400 mb-4">Failed to load orders</p>
                      <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        className="border-red-400 text-red-400 hover:bg-red-400 hover:text-black"
                      >
                        Retry
                      </Button>
                    </div>
                  ) : filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <div key={order.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-emerald-400/50 transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                {order.status === 'DELIVERED' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                                {(order.status === 'SHIPPED' || order.status === 'OUT_FOR_DELIVERY') && <Truck className="w-5 h-5 text-blue-400" />}
                                {(order.status === 'PROCESSING' || order.status === 'CONFIRMED' || order.status === 'PACKED') && <Clock className="w-5 h-5 text-yellow-400" />}
                                {(order.status === 'CANCELLED' || order.status === 'REFUNDED') && <XCircle className="w-5 h-5 text-red-400" />}
                                <h3 className="font-semibold text-white">{order.orderNumber}</h3>
                              </div>
                              <Badge variant="outline" className={getOrderStatusColor(order.status)}>
                                {formatOrderStatus(order.status)}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-400">Order Date</p>
                                <p className="text-white">{formatDate(order.createdAt)}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Items</p>
                                <p className="text-white">
                                  {order.items.length} item{order.items.length > 1 ? 's' : ''} • {order.items[0]?.product.name}
                                  {order.items.length > 1 && ` +${order.items.length - 1} more`}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400">Total</p>
                                <p className="text-emerald-400 font-semibold whitespace-nowrap">
                                  {(order.status === 'CANCELLED' || order.status === 'REFUNDED') ? 'R 0.00' : `R ${order.total.toFixed(2)}`}
                                </p>
                              </div>
                            </div>

                            {/* Add tracking info if available - this would come from delivery integration */}
                            {order.status === 'SHIPPED' && (
                              <div className="mt-3 p-2 bg-gray-750 rounded border border-gray-600">
                                <p className="text-xs text-gray-400">Tracking: <span className="text-emerald-400 font-mono">BB{order.orderNumber.replace('ORD-', '')}</span></p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              onClick={() => {
                                // TODO: Implement order details modal/page
                                toast.info('Order details coming soon!');
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                            {order.status === 'DELIVERED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black"
                                onClick={() => {
                                  // TODO: Implement reorder functionality
                                  toast.info('Reorder functionality coming soon!');
                                }}
                              >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Reorder
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : null}

                  {filteredOrders.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">No orders found</p>
                      <p className="text-sm text-gray-500">
                        {searchQuery || selectedStatus !== 'all'
                          ? 'Try adjusting your search or filter criteria'
                          : 'Your order history will appear here once you make your first purchase'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-4 bg-gray-900 p-4 rounded-lg border border-gray-700">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search products..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="all" className="text-white">All Categories</SelectItem>
                    <SelectItem value="flower" className="text-white">Flower</SelectItem>
                    <SelectItem value="concentrates" className="text-white">Concentrates</SelectItem>
                    <SelectItem value="edibles" className="text-white">Edibles</SelectItem>
                    <SelectItem value="wellness" className="text-white">Wellness</SelectItem>
                    <SelectItem value="accessories" className="text-white">Accessories</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input
                    placeholder="Min R"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                    className="w-20 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    type="number"
                  />
                  <Input
                    placeholder="Max R"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                    className="w-20 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    type="number"
                  />
                </div>
              </div>
            </div>

            {/* Cart Summary */}
            {cartItemCount > 0 && (
              <Card className="bg-emerald-950 border-emerald-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">
                        {cartItemCount} item{cartItemCount !== 1 ? 's' : ''} in cart
                      </span>
                    </div>
                    <div className="text-emerald-400 font-bold text-lg whitespace-nowrap" aria-label={`Cart total: R ${cartTotal.toFixed(2)}`}>
                      R {cartTotal.toFixed(2)}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      onClick={() => router.push('/cart')}
                      variant="outline"
                      size="sm"
                      className="border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black flex-1"
                    >
                      View Cart
                    </Button>
                    <Button
                      onClick={() => router.push('/checkout')}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                    >
                      Checkout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Product Grid */}
            {productsError && (
              <Card className="bg-red-950 border-red-800">
                <CardContent className="p-4 text-center">
                  <p className="text-red-400 mb-4">Failed to load products: {productsError}</p>
                  <Button
                    onClick={refetchProducts}
                    variant="outline"
                    className="border-red-400 text-red-400 hover:bg-red-400 hover:text-black"
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index} className="bg-gray-900 border-gray-700 animate-pulse">
                    <div className="h-48 bg-gray-800 rounded-t-lg"></div>
                    <CardContent className="p-4 space-y-3">
                      <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-800 rounded w-full"></div>
                      <div className="h-8 bg-gray-800 rounded w-full"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length === 0 && !productsError ? (
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No products found</h3>
                  <p className="text-gray-400 mb-4">
                    {productSearchQuery || selectedCategory !== 'all' || priceRange.min || priceRange.max
                      ? 'Try adjusting your search or filters'
                      : 'No products available at the moment'
                    }
                  </p>
                  {(productSearchQuery || selectedCategory !== 'all' || priceRange.min || priceRange.max) && (
                    <Button
                      onClick={() => {
                        setProductSearchQuery('');
                        setSelectedCategory('all');
                        setPriceRange({ min: '', max: '' });
                      }}
                      variant="outline"
                      className="border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white"
                    >
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                {filteredProducts.map((product) => {
                // Find if this product is in cart (simplified check by product ID)
                const cartItem = cartData?.items?.find(item => item.productId === product.id);
                const categoryIcon = {
                  flower: <Leaf className="w-4 h-4" />,
                  concentrates: <FlaskConical className="w-4 h-4" />,
                  edibles: <Cookie className="w-4 h-4" />,
                  wellness: <FlaskConical className="w-4 h-4" />,
                  accessories: <Package className="w-4 h-4" />
                };

                return (
                  <Card
                    key={product.id}
                    className={`bg-gray-900 border-gray-700 hover:border-emerald-500 transition-colors flex flex-col h-full ${!product.inStock ? 'opacity-60' : ''}`}
                    role="article"
                    aria-label={`Product: ${product.name}, Price: R ${product.price.toFixed(2)}, ${product.inStock ? 'In stock' : 'Out of stock'}`}
                  >
                    <div className="aspect-video bg-gray-800 rounded-t-lg flex items-center justify-center">
                      <div className="text-6xl">
                        {product.category === 'flower' ? '🌿' :
                         product.category === 'concentrates' ? '🧪' :
                         product.category === 'edibles' ? '🍪' :
                         product.category === 'wellness' ? '💊' :
                         product.category === 'accessories' ? '🔧' : '🌿'}
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-white text-lg leading-tight break-words">{product.name}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                              {categoryIcon[product.category]}
                              <span className="ml-1 capitalize">{product.category}</span>
                            </Badge>
                            <Badge variant="outline" className="border-emerald-500 text-emerald-400 text-xs">
                              {product.strain}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-emerald-400 font-bold text-lg whitespace-nowrap">R {product.price.toFixed(2)}</div>
                          <div className="text-gray-400 text-sm whitespace-nowrap">{product.weight}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 flex flex-col flex-grow">
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">{product.description}</p>

                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-gray-800 p-3 rounded text-center">
                          <div className="text-xs text-gray-400 mb-1">THC</div>
                          <div className="text-white font-semibold text-sm">{product.thc}</div>
                        </div>
                        <div className="bg-gray-800 p-3 rounded text-center">
                          <div className="text-xs text-gray-400 mb-1">CBD</div>
                          <div className="text-white font-semibold text-sm">{product.cbd}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`} />
                            ))}
                          </div>
                          <span className="text-gray-400 text-xs">({product.reviews})</span>
                        </div>
                        <div className="text-gray-400 text-xs">{product.vendor}</div>
                      </div>

                      {cartItem ? (
                        <div className="flex items-center space-x-2 mt-auto pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                            disabled={cartLoading}
                            className="w-8 h-8 p-0 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-black"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-white font-semibold px-2">{cartItem.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                            disabled={cartLoading || cartItem.quantity >= product.stockQuantity}
                            className="w-8 h-8 p-0 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-black"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeItem(cartItem.id)}
                            disabled={cartLoading}
                            className="flex-1 ml-2"
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-auto pt-2">
                          <Button
                            onClick={() => addToCart(product)}
                            disabled={!product.inStock || cartLoading}
                            className={`w-full ${
                            product.inStock && !cartLoading
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {cartLoading ? (
                            <>
                              <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                              Adding...
                            </>
                          ) : product.inStock ? (
                            <>
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Add to Cart
                            </>
                          ) : (
                            'Out of Stock'
                          )}
                        </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}