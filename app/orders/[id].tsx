import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  TouchableOpacity,
  Image,
  RefreshControl
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types/product';
import { getOrderById } from '@/utils/orderApi';
import { Ionicons } from '@expo/vector-icons';

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, user, refreshUserPreferences } = useAuth();
  const router = useRouter();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const normalizeOrder = useCallback((orderData: any): Order => {
    return {
      _id: orderData._id || '',
      orderId: orderData.orderId || '',
      userId: orderData.userId || user?._id || '',
      items: orderData.items || [],
      shippingAddress: orderData.shippingAddress || {
        name: '',
        phone: '',
        addressLine1: '',
        city: '',
        state: '',
        pincode: ''
      },
      paymentMethod: orderData.paymentMethod || 'COD',
      customerNotes: orderData.customerNotes || '',
      status: orderData.status || 'Pending',
      orderDate: orderData.orderDate || new Date().toISOString(),
      expectedDeliveryDate: orderData.expectedDeliveryDate || 
        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      total: orderData.total || 0,
      createdAt: orderData.createdAt,
      updatedAt: orderData.updatedAt
    };
  }, [user?._id]);

  const fetchOrder = useCallback(async (showLoading = true) => {
    if (!id) {
      setError('Order ID not provided');
      setLoading(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);
      setError(null);

      console.log('🔍 Fetching order details for ID:', id);

      if (orders.has(id)) {
        console.log('✅ Order found in context');
        const contextOrder = orders.get(id)!;
        setOrder(normalizeOrder(contextOrder));
        if (showLoading) setLoading(false);
        return;
      }

      const orderByOrderId = Array.from(orders.values()).find(o => o.orderId === id);
      if (orderByOrderId) {
        console.log('✅ Order found in context by orderId');
        setOrder(normalizeOrder(orderByOrderId));
        if (showLoading) setLoading(false);
        return;
      }

      console.log('🔍 Order not found in context, fetching from API...');
      const response = await getOrderById(id);
      
      if (response.success && response.data) {
        console.log('✅ Order fetched successfully from API');
        setOrder(normalizeOrder(response.data));
      } else {
        console.error('❌ Failed to fetch order:', response.message);
        setError(response.message || 'Order not found');
      }
    } catch (err: any) {
      console.error('❌ Error fetching order:', err);
      setError('Failed to load order details');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [id, normalizeOrder]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUserPreferences?.();
    await fetchOrder(false);
    setRefreshing(false);
  }, [fetchOrder, refreshUserPreferences]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Delivered': return '#28a745';
      case 'Shipped': return '#17a2b8';
      case 'Confirmed': return '#20c997';
      case 'Pending': return '#6c757d';
      case 'Cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'Delivered': return 'checkmark-circle';
      case 'Shipped': return 'airplane';
      case 'Confirmed': return 'checkmark';
      case 'Pending': return 'hourglass';
      case 'Cancelled': return 'close-circle';
      default: return 'help-circle';
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff3f6c" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
        <Text style={styles.errorTitle}>Unable to Load Order</Text>
        <Text style={styles.errorText}>{error}</Text>
        <View style={styles.errorActions}>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchOrder()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="receipt-outline" size={48} color="#ccc" />
        <Text style={styles.errorTitle}>Order Not Found</Text>
        <Text style={styles.errorText}>The order you're looking for doesn't exist.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#ff3f6c"]}
          tintColor="#ff3f6c"
        />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Order Details</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>Order ID</Text>
          <Text style={styles.orderId}>#{order.orderId}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Ionicons name={getStatusIcon(order.status) as any} size={12} color="#fff" />
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Order Date:</Text>
          <Text style={styles.summaryValue}>{formatDate(order.orderDate)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Items:</Text>
          <Text style={styles.summaryValue}>{order.items.length} item(s)</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Payment Method:</Text>
          <Text style={styles.summaryValue}>{order.paymentMethod}</Text>
        </View>
        {order.expectedDeliveryDate && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Expected Delivery:</Text>
            <Text style={styles.summaryValue}>
              {formatDate(order.expectedDeliveryDate)}
            </Text>
          </View>
        )}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Amount:</Text>
          <Text style={[styles.summaryValue, styles.totalAmount]}>
            {formatCurrency(order.total)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
        {order.items.map((item, index) => (
          <View key={index} style={styles.itemContainer}>
            {item.productId?.images?.[0] && (
              <Image
                source={{ uri: item.productId.images[0] }}
                style={styles.itemImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.productId?.name || 'Product'}</Text>
              <Text style={styles.itemBrand}>{item.productId?.brand || 'Brand'}</Text>
              {item.size && <Text style={styles.itemDetails}>Size: {item.size}</Text>}
              {item.color && <Text style={styles.itemDetails}>Color: {item.color}</Text>}
              <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
            </View>
            <View style={styles.itemPriceContainer}>
              <Text style={styles.itemPrice}>
                {formatCurrency(item.priceWhenAdded * item.quantity)}
              </Text>
              <Text style={styles.itemUnitPrice}>₹{item.priceWhenAdded} each</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        <View style={styles.addressContainer}>
          <Text style={styles.addressName}>{order.shippingAddress.name}</Text>
          <Text style={styles.addressText}>{order.shippingAddress.addressLine1}</Text>
          {order.shippingAddress.addressLine2 && (
            <Text style={styles.addressText}>{order.shippingAddress.addressLine2}</Text>
          )}
          {order.shippingAddress.landmark && (
            <Text style={styles.addressText}>Near {order.shippingAddress.landmark}</Text>
          )}
          <Text style={styles.addressText}>
            {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
          </Text>
          <Text style={styles.addressPhone}>Phone: +91 {order.shippingAddress.phone}</Text>
        </View>
      </View>

      {order.customerNotes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Notes</Text>
          <Text style={styles.notesText}>{order.customerNotes}</Text>
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerBackButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  headerRight: {
    width: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  orderIdContainer: {
    flex: 1,
  },
  orderIdLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff3f6c',
  },
  itemContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  itemImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    lineHeight: 18,
  },
  itemBrand: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  itemPriceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  itemUnitPrice: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  addressContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff3f6c',
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    lineHeight: 18,
  },
  addressPhone: {
    fontSize: 14,
    color: '#ff3f6c',
    marginTop: 8,
    fontWeight: '500',
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#ff3f6c',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#6c757d',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
