import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  StatusBar,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import {
  Package,
  ChevronRight,
  Clock,
  Calendar,
  CreditCard,
  RefreshCw,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Truck,
} from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { Order } from "@/types/product";

const { width: screenWidth } = Dimensions.get("window");

const ORDER_STATUS_CONFIG = {
  'Pending': { color: '#ffa500', icon: Clock },
  'Confirmed': { color: '#2196f3', icon: CheckCircle },
  'Processing': { color: '#ffa500', icon: Package },
  'Shipped': { color: '#2196f3', icon: Truck },
  'Delivered': { color: '#4caf50', icon: CheckCircle },
  'Cancelled': { color: '#ff6b6b', icon: AlertCircle },
  'Returned': { color: '#9c27b0', icon: Package },
  'Refunded': { color: '#607d8b', icon: CreditCard },
};

const FILTER_OPTIONS = [
  { label: 'All Orders', value: 'all' },
  { label: 'Processing', value: 'Processing' },
  { label: 'Shipped', value: 'Shipped' },
  { label: 'Delivered', value: 'Delivered' },
  { label: 'Cancelled', value: 'Cancelled' },
];

export default function Orders() {
  const router = useRouter();
  const { 
    user, 
    orders, 
    refreshUserPreferences, 
    totalOrders,
    isRefreshingPreferences
  } = useAuth();

  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const initialLoadRef = useRef(true);

  const fetchOrdersData = useCallback(async (forceLoading = true) => {
    if (!user?._id || isRefreshingPreferences) {
      return;
    }

    try {
      if (forceLoading) setLoading(true);
      
      if (orders.size === 0) {
        await refreshUserPreferences(true);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?._id, refreshUserPreferences, isRefreshingPreferences, orders.size]);

  useFocusEffect(
    useCallback(() => {
      if (user?._id && !isRefreshingPreferences) {
        if (initialLoadRef.current) {
          initialLoadRef.current = false;
          fetchOrdersData();
        }
      }

      return () => {
        initialLoadRef.current = true;
      };
    }, [user?._id, fetchOrdersData, isRefreshingPreferences])
  );

  useEffect(() => {
    const ordersList = Array.from(orders.values()).sort((a, b) => 
      new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );
    
    setFilteredOrders(
      selectedFilter === 'all'
        ? ordersList
        : ordersList.filter(order => order.status === selectedFilter)
    );
  }, [orders, selectedFilter]);

  const onRefresh = useCallback(async () => {
    if (isRefreshingPreferences) return;
    
    setRefreshing(true);
    await refreshUserPreferences(true);
    setRefreshing(false);
  }, [refreshUserPreferences, isRefreshingPreferences]);

  const getStatusIcon = (status: string) => {
    const config = ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG];
    if (!config) return <Package size={16} color="#666" />;
    
    const IconComponent = config.icon;
    return <IconComponent size={16} color={config.color} />;
  };

  const getStatusColor = (status: string) => {
    const config = ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG];
    return config?.color || '#666';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => router.push({
        pathname: "/orders/[id]" as any,
        params: { id: order.orderId }
      })}
      activeOpacity={0.8}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <Text style={styles.orderId}>#{order.orderId}</Text>
          <Text style={styles.orderDate}>{formatDate(order.orderDate)}</Text>
        </View>
        
        <View style={styles.orderHeaderRight}>
          <View style={[
            styles.statusContainer,
            { backgroundColor: `${getStatusColor(order.status)}20` }
          ]}>
            {getStatusIcon(order.status)}
            <Text style={[
              styles.orderStatus,
              { color: getStatusColor(order.status) }
            ]}>
              {order.status}
            </Text>
          </View>
          <ChevronRight size={20} color="#666" />
        </View>
      </View>

      <View style={styles.itemsPreview}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.itemsScrollContainer}
        >
          {order.items.slice(0, 3).map((item, index) => (
            <View key={index} style={styles.itemPreview}>
              <Image
                source={{ 
                  uri: item.productId?.images?.[0] || "https://via.placeholder.com/60" 
                }}
                style={styles.itemPreviewImage}
              />
              <Text style={styles.itemPreviewName} numberOfLines={1}>
                {item.productId?.name || 'Product'}
              </Text>
              <Text style={styles.itemPreviewPrice}>
                {formatCurrency(item.priceWhenAdded * item.quantity)}
              </Text>
            </View>
          ))}
          {order.items.length > 3 && (
            <View style={styles.moreItemsIndicator}>
              <Text style={styles.moreItemsText}>+{order.items.length - 3}</Text>
              <Text style={styles.moreItemsLabel}>more</Text>
            </View>
          )}
        </ScrollView>
      </View>

      <View style={styles.orderSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.summaryValue}>{formatCurrency(order.total)}</Text>
        </View>
        
        {order.expectedDeliveryDate && (
          <View style={styles.deliveryInfo}>
            <Calendar size={14} color="#4caf50" />
            <Text style={styles.deliveryText}>
              Expected: {formatDate(order.expectedDeliveryDate)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const FilterBar = () => (
    <View style={styles.filterBar}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        {FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterChip,
              selectedFilter === option.value && styles.activeFilterChip,
            ]}
            onPress={() => setSelectedFilter(option.value)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterChipText,
              selectedFilter === option.value && styles.activeFilterChipText,
            ]}>
              {option.label}
            </Text>
            <Text style={[
              styles.filterCount,
              selectedFilter === option.value && styles.activeFilterCount,
            ]}>
              {option.value === 'all' 
                ? Array.from(orders.values()).length 
                : Array.from(orders.values()).filter(o => o.status === option.value).length
              }
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const EmptyOrdersState = () => (
    <View style={styles.emptyState}>
      <ShoppingBag size={80} color="#ff3f6c" />
      <Text style={styles.emptyTitle}>
        {selectedFilter === 'all' ? 'No orders yet' : `No ${selectedFilter} orders`}
      </Text>
      <Text style={styles.emptySubtitle}>
        {selectedFilter === 'all' 
          ? 'Start shopping and your orders will appear here'
          : `You don't have any ${selectedFilter.toLowerCase()} orders`
        }
      </Text>
      {selectedFilter === 'all' && (
        <TouchableOpacity
          style={styles.startShoppingButton}
          onPress={() => router.push("/(tabs)/categories")}
          activeOpacity={0.8}
        >
          <Text style={styles.startShoppingText}>Start Shopping</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const OrdersStats = () => {
    const totalSpent = Array.from(orders.values())
      .reduce((sum, order) => sum + order.total, 0);
    
    const deliveredCount = Array.from(orders.values()).filter(o => o.status === 'Delivered').length;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{formatCurrency(totalSpent)}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{deliveredCount}</Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
      </View>
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/(tabs)")}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Orders</Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.emptyState}>
          <Package size={80} color="#ff3f6c" />
          <Text style={styles.emptyTitle}>Please login to view your orders</Text>
          <Text style={styles.emptySubtitle}>
            Track your orders and view order history
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/login")}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)")}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => fetchOrdersData()}
          activeOpacity={0.7}
        >
          <RefreshCw size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {loading && orders.size === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff3f6c" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : orders.size === 0 ? (
        <EmptyOrdersState />
      ) : (
        <>
          <OrdersStats />
          <FilterBar />
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <OrderCard order={item} />}
            contentContainerStyle={styles.ordersContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#ff3f6c"]}
                tintColor="#ff3f6c"
              />
            }
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.orderSeparator} />}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No orders found for this filter</Text>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  headerSpacer: {
    width: 44,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ff3f6c',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  filterBar: {
    paddingVertical: 12,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeFilterChip: {
    backgroundColor: '#ff3f6c',
    borderColor: '#ff3f6c',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginRight: 6,
  },
  activeFilterChipText: {
    color: '#fff',
  },
  filterCount: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    textAlign: 'center',
  },
  activeFilterCount: {
    color: '#ff3f6c',
    backgroundColor: '#fff',
  },
  ordersContainer: {
    padding: 16,
  },
  orderSeparator: {
    height: 12,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  orderHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  itemsPreview: {
    paddingVertical: 12,
  },
  itemsScrollContainer: {
    paddingHorizontal: 16,
  },
  itemPreview: {
    alignItems: 'center',
    marginRight: 12,
    width: 60,
  },
  itemPreviewImage: {
    width: 50,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    marginBottom: 4,
  },
  itemPreviewName: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  itemPreviewPrice: {
    fontSize: 10,
    color: '#ff3f6c',
    fontWeight: '600',
  },
  moreItemsIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 60,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  moreItemsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  moreItemsLabel: {
    fontSize: 10,
    color: '#666',
  },
  orderSummary: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  deliveryText: {
    fontSize: 12,
    color: '#4caf50',
    marginLeft: 6,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  startShoppingButton: {
    backgroundColor: '#ff3f6c',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  startShoppingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loginButton: {
    backgroundColor: '#ff3f6c',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
