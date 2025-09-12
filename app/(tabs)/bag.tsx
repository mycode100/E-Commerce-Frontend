import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createOrder } from '@/utils/orderApi';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  StatusBar,
  Dimensions
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  Star,
  ArrowRight,
  ShoppingCart,
  Tag,
  Gift,
  CheckCircle2,
  XCircle,
  Package
} from 'lucide-react-native';

import { useAuth } from '@/context/AuthContext';
import {
  applyCoupon,
  removeCoupon,
  getAvailableCoupons,
  getThresholdSuggestions,
  updateBagItemQuantity,
  removeBagItem,
  handleApiError
} from '@/utils/api';

import CouponOverlay from '@/components/CouponOverlay';
import CouponThresholdMessage from '@/components/CouponThresholdMessage';
import AddressSelectionOverlay from '@/components/AddressSelectionOverlay';
import AddressManagementOverlay from '@/components/AddressManagementOverlay';
import OrderPreviewOverlay from '@/components/OrderPreviewOverlay';

import type { BagItem, Address } from '@/types/product';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const useDebouncedFn = (fn: () => void, delay = 500) => {
  const timer = useRef<NodeJS.Timeout>();
  return () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(fn, delay);
  };
};

export default function Bag() {
  const router = useRouter();
  const {
    user,
    bagItems,
    bagSummary,
    appliedCoupon,
    optimisticUpdateBag,
    refreshUserPreferences,
    addresses,
    defaultAddressId,
    createOrderWithSync,
    isCreatingOrder,
    isRefreshingPreferences
  } = useAuth();

  const itemsArr = useMemo(() => Array.from(bagItems.values()), [bagItems]);

  const totals = useMemo(() => {
    const sub = itemsArr.reduce((s, i) => s + i.quantity * i.priceWhenAdded, 0);
    const ship = sub >= 499 ? 0 : 99;
    const tax = Math.round(sub * 0.18);
    const disc = bagSummary?.couponDiscount || 0;
    return {
      itemCount: itemsArr.length,
      subtotal: sub,
      shipping: ship,
      tax,
      couponDiscount: disc,
      finalTotal: sub + ship + tax - disc
    };
  }, [itemsArr, bagSummary]);

  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<Set<string>>(new Set());

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponErr, setCouponErr] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState('');

  const [showCouponOverlay, setShowCouponOverlay] = useState(false);
  const [couponData, setCouponData] = useState({
    available: [] as any[],
    expired: [] as any[],
    cartTotal: 0
  });
  const [thresholdSuggestion, setThresholdSuggestion] = useState<any>(null);
  const [thresholdLoading, setThresholdLoading] = useState(false);

  const [showAddrSel, setShowAddrSel] = useState(false);
  const [showAddrMng, setShowAddrMng] = useState(false);
  const [showOrderPreview, setShowOrderPreview] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [selectedPayMethod, setSelectedPayMethod] = useState('COD');

  // ✅ FIXED: Now calling useDebouncedFn at top level, not inside useMemo
  const debouncedRefresh = useDebouncedFn(
    useCallback(() => refreshUserPreferences(true), [refreshUserPreferences]), 
    600
  );

  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (user?._id && !isRefreshingPreferences && first.current) {
        first.current = false;
        refreshUserPreferences(true);
      }
    }, [user?._id, isRefreshingPreferences])
  );

  useEffect(() => {
    if (!user?._id || totals.subtotal === 0) return;
    
    const timeoutId = setTimeout(async () => {
      setThresholdLoading(true);
      try {
        const res = await getThresholdSuggestions(user._id);
        setThresholdSuggestion(res?.data?.suggestion || null);
      } finally {
        setThresholdLoading(false);
      }
    }, 300); // Debounce API calls by 300ms

    return () => clearTimeout(timeoutId);
  }, [user?._id, totals.subtotal]);

  const selectedAddress =
    defaultAddressId && addresses.has(defaultAddressId)
      ? addresses.get(defaultAddressId)!
      : Array.from(addresses.values()).find(a => a.isDefault) || null;

  const changeQty = async (bagId: string, q: number, productId: string, oldItem: BagItem) => {
    if (q < 1 || q > 10 || updating.has(bagId)) return;

    optimisticUpdateBag(productId, { ...oldItem, quantity: q });
    setUpdating(prev => new Set(prev).add(bagId));

    try {
      const res = await updateBagItemQuantity(bagId, q);
      if (!res?.success) {
        optimisticUpdateBag(productId, oldItem);
        Alert.alert('Error', handleApiError(res?.error) || 'Failed to update quantity');
      } else {
        debouncedRefresh();
      }
    } catch {
      optimisticUpdateBag(productId, oldItem);
      Alert.alert('Error', 'Could not update quantity');
    } finally {
      setUpdating(prev => {
        const n = new Set(prev);
        n.delete(bagId);
        return n;
      });
    }
  };

  const deleteItem = async (bagId: string, productId: string, original: BagItem) => {
    optimisticUpdateBag(productId, null);
    setDeleting(prev => new Set(prev).add(bagId));

    try {
      const res = await removeBagItem(bagId);
      if (!res?.success) {
        optimisticUpdateBag(productId, original);
        Alert.alert('Error', handleApiError(res?.error) || 'Failed to remove item');
      } else {
        debouncedRefresh();
      }
    } catch {
      optimisticUpdateBag(productId, original);
      Alert.alert('Error', 'Could not remove item');
    } finally {
      setDeleting(prev => {
        const n = new Set(prev);
        n.delete(bagId);
        return n;
      });
    }
  };

  const applyCouponCode = async (code: string) => {
    if (!user?._id || code.trim().length < 3) return;
    setCouponLoading(true);
    setCouponErr(null);

    const res = await applyCoupon(user._id, code.trim());
    if (res?.success) {
      setCouponMsg('Coupon applied!');
      debouncedRefresh();
    } else {
      setCouponErr(handleApiError(res?.error) || 'Failed to apply coupon');
    }
    setCouponLoading(false);
  };

  const removeAppliedCoupon = async () => {
    if (!user?._id) return;
    setCouponLoading(true);
    const res = await removeCoupon(user._id);
    if (res?.success) {
      debouncedRefresh();
    } else {
      setCouponErr(handleApiError(res?.error) || 'Failed to remove coupon');
    }
    setCouponLoading(false);
  };

  const fetchCoupons = async () => {
    if (!user?._id) return;
    setCouponLoading(true);
    const res = await getAvailableCoupons(user._id);
    if (res?.success) {
      setCouponData({
        available: res?.data?.availableCoupons ?? [],
        expired: res?.data?.expiredCoupons ?? [],
        cartTotal: res?.data?.cartTotal ?? totals.subtotal
      });
      setShowCouponOverlay(true);
    }
    setCouponLoading(false);
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    if (isRefreshingPreferences) return;
    setRefreshing(true);
    await refreshUserPreferences(true);
    setRefreshing(false);
  };

  const placeOrder = async () => {
    if (!user || !selectedAddress) {
      Alert.alert('Address required', 'Please select a shipping address.');
      return;
    }

    try {
      console.log('🛒 Starting order placement...');
      
      const orderData = {
        userId: user._id,
        shippingAddress: selectedAddress,
        paymentMethod: selectedPayMethod,
        customerNotes: ''
      };

      const res = await createOrder(orderData);
      
      if (res.success) {
        console.log('✅ Order created successfully:', res.data);
        
        await refreshUserPreferences(true);
        
        setShowOrderPreview(false);
        
        Alert.alert('Success', 'Order placed successfully!', [
          { text: 'View Orders', onPress: () => router.push('/orders') },
          { text: 'Continue Shopping', style: 'cancel' }
        ]);
      } else {
        throw new Error(res.message || 'Failed to create order');
      }
    } catch (error: unknown) {
      console.error('❌ Order placement failed:', error);
      
      if (error instanceof Error) {
        Alert.alert('Error', error.message || 'Could not place order');
      } else {
        Alert.alert('Error', 'Could not place order');
      }
      
      throw error;
    }
  };

  const Rating = ({ r }: { r?: number }) =>
    r ? (
      <View style={styles.ratingWrap}>
        <Star size={12} color="#ffa500" fill="#ffa500" />
        <Text style={styles.ratingTxt}>{r.toFixed(1)}</Text>
      </View>
    ) : null;

  const ItemCard = ({ it }: { it: BagItem }) => {
    const updatingRow = updating.has(it._id);
    const deletingRow = deleting.has(it._id);

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardContent}
          activeOpacity={0.8}
          onPress={() => router.push(`/product/${it.productId._id}`)}
        >
          <Image
            source={{ uri: it.productId.images?.[0] || 'https://via.placeholder.com/80' }}
            style={styles.image}
          />
          <View style={styles.info}>
            <Text style={styles.brand}>{it.productId.brand}</Text>
            <Text style={styles.name} numberOfLines={2}>
              {it.productId.name}
            </Text>
            {(it.size || it.color) && (
              <View style={styles.vars}>
                {it.size && <Text style={styles.varTxt}>Size: {it.size}</Text>}
                {it.color && <Text style={styles.varTxt}>Color: {it.color}</Text>}
              </View>
            )}
            <Text style={styles.price}>₹{it.productId.price}</Text>
            <Rating r={it.productId.rating} />
          </View>
        </TouchableOpacity>

        <View style={styles.qtyRow}>
          <View style={styles.qtyCtrl}>
            <TouchableOpacity
              style={[styles.qtyBtn, it.quantity <= 1 && styles.btnDisabled]}
              onPress={() => changeQty(it._id, it.quantity - 1, it.productId._id, it)}
              disabled={it.quantity <= 1 || updatingRow || deletingRow}
            >
              <Minus size={14} color={it.quantity <= 1 ? '#bbb' : '#666'} />
            </TouchableOpacity>
            <View style={styles.qtyDisplay}>
              {updatingRow ? (
                <ActivityIndicator size="small" color="#ff3f6c" />
              ) : (
                <Text style={styles.qtyTxt}>{it.quantity}</Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.qtyBtn, it.quantity >= 10 && styles.btnDisabled]}
              onPress={() => changeQty(it._id, it.quantity + 1, it.productId._id, it)}
              disabled={it.quantity >= 10 || updatingRow || deletingRow}
            >
              <Plus size={14} color={it.quantity >= 10 ? '#bbb' : '#666'} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.delBtn, (updatingRow || deletingRow) && styles.btnDisabled]}
            onPress={() => deleteItem(it._id, it.productId._id, it)}
            disabled={updatingRow || deletingRow}
          >
            {deletingRow ? (
              <ActivityIndicator size="small" color="#ff3b30" />
            ) : (
              <Trash2 size={18} color="#ff3b30" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const Empty = () => (
    <View style={styles.empty}>
      <View style={styles.emptyIconContainer}>
        <ShoppingBag size={80} color="#ff3f6c" />
      </View>
      <Text style={styles.emptyT}>Your bag is empty</Text>
      <Text style={styles.emptyS}>Add items to start shopping</Text>
      
      <View style={styles.emptyButtonsContainer}>
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => router.push('/(tabs)/categories')}
        >
          <ShoppingCart size={20} color="#fff" />
          <Text style={styles.shopTxt}>Start Shopping</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.viewOrdersBtn}
          onPress={() => router.push('/orders')}
        >
          <Package size={20} color="#ff3f6c" />
          <Text style={styles.viewOrdersTxt}>View Orders</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.warningContainer}>
        <Text style={styles.warningText}>
          ⚠️ Do not open direct order page without place order.{'\n'}
          It might affect your connection to server.
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.hTitle}>Shopping Bag</Text>
        {itemsArr.length > 0 && (
          <View style={styles.countBubble}>
            <Text style={styles.countTxt}>{itemsArr.length}</Text>
          </View>
        )}
      </View>

      {isRefreshingPreferences && itemsArr.length === 0 ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#ff3f6c" />
          <Text style={styles.loadTxt}>Loading your bag…</Text>
        </View>
      ) : itemsArr.length === 0 ? (
        <Empty />
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#ff3f6c']}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 200 }}
          >
            <CouponThresholdMessage
              currentTotal={totals.subtotal}
              suggestion={thresholdSuggestion}
              loading={thresholdLoading}
              onPressViewCoupons={fetchCoupons}
            />

            {totals.subtotal > 0 && totals.subtotal < 499 && (
              <View style={styles.shipBar}>
                <Text style={styles.shipTxt}>
                  Add ₹{499 - totals.subtotal} more for FREE shipping! 🚚
                </Text>
              </View>
            )}

            <View style={styles.itemsSection}>
              {itemsArr.map(i => (
                <ItemCard key={i._id} it={i} />
              ))}
            </View>

            <View style={styles.couponBox}>
              <View style={styles.cHeader}>
                <Tag size={20} color="#666" />
                <Text style={styles.cTitle}>Apply Coupon</Text>
              </View>

              <TouchableOpacity
                style={styles.vcBtn}
                activeOpacity={0.8}
                onPress={fetchCoupons}
              >
                <Gift size={16} color="#ff3f6c" />
                <Text style={styles.vcTxt}>View & Apply Coupons</Text>
                <ArrowRight size={16} color="#ff3f6c" />
              </TouchableOpacity>

              {!appliedCoupon ? (
                <>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.cInput}
                      placeholder="Enter coupon code"
                      placeholderTextColor="#999"
                      value={couponCode}
                      onChangeText={setCouponCode}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={styles.cBtn}
                      disabled={couponLoading}
                      onPress={() => applyCouponCode(couponCode)}
                    >
                      {couponLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.cBtnTxt}>APPLY</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  {couponErr && (
                    <View style={styles.msgRow}>
                      <XCircle size={14} color="#ff3f6c" />
                      <Text style={styles.errTxt}>{couponErr}</Text>
                    </View>
                  )}
                  {couponMsg !== '' && (
                    <View style={styles.msgRow}>
                      <CheckCircle2 size={14} color="#4caf50" />
                      <Text style={styles.okTxt}>{couponMsg}</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.appliedRow}>
                  <View style={styles.msgRow}>
                    <CheckCircle2 size={16} color="#4caf50" />
                    <Text style={styles.okTxt}>{appliedCoupon.message}</Text>
                  </View>
                  <TouchableOpacity disabled={couponLoading} onPress={removeAppliedCoupon}>
                    {couponLoading ? (
                      <ActivityIndicator size="small" color="#ff3f6c" />
                    ) : (
                      <Text style={styles.rmTxt}>REMOVE</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.checkoutBar}>
            <View style={styles.summary}>
              <View style={styles.row}>
                <Text style={styles.label}>Subtotal ({totals.itemCount} items)</Text>
                <Text style={styles.val}>₹{totals.subtotal}</Text>
              </View>
              {totals.couponDiscount > 0 && (
                <View style={[styles.row, styles.discRow]}>
                  <Text style={styles.label}>Coupon Discount</Text>
                  <Text style={styles.discVal}>- ₹{totals.couponDiscount}</Text>
                </View>
              )}
              <View style={styles.row}>
                <Text style={styles.label}>Shipping</Text>
                <Text
                  style={[
                    styles.val,
                    totals.shipping === 0 && { color: '#4caf50' }
                  ]}
                >
                  {totals.shipping === 0 ? 'FREE' : `₹${totals.shipping}`}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Tax</Text>
                <Text style={styles.val}>₹{totals.tax}</Text>
              </View>
              <View style={styles.sep} />
              <View style={styles.row}>
                <Text style={styles.totalL}>Total</Text>
                <Text style={styles.totalV}>₹{totals.finalTotal}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.checkoutBtn, isCreatingOrder && { opacity: 0.7 }]}
              disabled={isCreatingOrder}
              onPress={() => {
                if (itemsArr.length === 0) return;
                setShowOrderPreview(true);
              }}
            >
              {isCreatingOrder ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.cbTxt}>CHECKOUT • ₹{totals.finalTotal}</Text>
                  <ArrowRight size={16} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <CouponOverlay
        visible={showCouponOverlay}
        onClose={() => setShowCouponOverlay(false)}
        onApplyCoupon={code => {
          setShowCouponOverlay(false);
          applyCouponCode(code);
        }}
        coupons={couponData.available}
        expiredCoupons={couponData.expired}
        loading={couponLoading}
        currentTotal={totals.subtotal}
        appliedCouponCode={appliedCoupon?.couponCode}
      />

      <OrderPreviewOverlay
        visible={showOrderPreview}
        onClose={() => setShowOrderPreview(false)}
        onEditAddress={() => {
          setShowOrderPreview(false);
          setShowAddrSel(true);
        }}
        onPlaceOrder={placeOrder}
        selectedAddress={selectedAddress}
        selectedPaymentMethod={selectedPayMethod}
        onPaymentMethodChange={setSelectedPayMethod}
        isLoading={isCreatingOrder}
      />

      <AddressSelectionOverlay
        visible={showAddrSel}
        onClose={() => {
          setShowAddrSel(false);
          setShowOrderPreview(true);
        }}
        onSelectAddress={() => {
          setShowAddrSel(false);
          setShowOrderPreview(true);
        }}
        onAddNewAddress={() => {
          setShowAddrSel(false);
          setEditingAddress(null);
          setShowAddrMng(true);
        }}
        onEditAddress={addr => {
          setShowAddrSel(false);
          setEditingAddress(addr);
          setShowAddrMng(true);
        }}
      />

      <AddressManagementOverlay
        visible={showAddrMng}
        editingAddress={editingAddress}
        onClose={() => {
          setShowAddrMng(false);
          setEditingAddress(null);
          setShowOrderPreview(true);
        }}
        onSuccess={() => {
          setShowAddrMng(false);
          setEditingAddress(null);
          setShowOrderPreview(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  hTitle: { fontSize: 24, fontWeight: '700', color: '#333' },
  countBubble: {
    backgroundColor: '#ff3f6c',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },
  countTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },

  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadTxt: { marginTop: 12, fontSize: 16, color: '#666' },
  empty: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 32,
    backgroundColor: '#fafbfc'
  },
  emptyIconContainer: {
    backgroundColor: '#fff4f6',
    padding: 24,
    borderRadius: 50,
    marginBottom: 20,
    shadowColor: '#ff3f6c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyT: { 
    fontSize: 26, 
    fontWeight: '700', 
    color: '#1a1a1a', 
    marginBottom: 8,
    textAlign: 'center'
  },
  emptyS: { 
    fontSize: 16, 
    color: '#666', 
    marginBottom: 32, 
    textAlign: 'center',
    lineHeight: 22
  },
  emptyButtonsContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff3f6c',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#ff3f6c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  shopTxt: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '700', 
    marginLeft: 8,
    letterSpacing: 0.5
  },
  viewOrdersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ff3f6c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewOrdersTxt: {
    color: '#ff3f6c',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.5
  },
  warningContainer: {
    backgroundColor: '#fff9e6',
    borderWidth: 1,
    borderColor: '#ffc107',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#8d6e00',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardContent: { flexDirection: 'row', padding: 16 },
  image: { width: 80, height: 100, borderRadius: 8, backgroundColor: '#f8f9fa' },
  info: { flex: 1, marginLeft: 16 },
  brand: { fontSize: 12, color: '#666', fontWeight: '500' },
  name: { fontSize: 14, color: '#333', fontWeight: '600', marginVertical: 4, lineHeight: 18 },
  vars: { flexDirection: 'row', marginBottom: 6 },
  varTxt: {
    fontSize: 10,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6
  },
  price: { fontSize: 16, color: '#333', fontWeight: '700', marginBottom: 4 },
  ratingWrap: { flexDirection: 'row', alignItems: 'center' },
  ratingTxt: { fontSize: 12, color: '#666', marginLeft: 4 },

  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12
  },
  qtyCtrl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 8 },
  qtyBtn: { padding: 8 },
  qtyDisplay: { paddingHorizontal: 14, minWidth: 38, alignItems: 'center' },
  qtyTxt: { fontSize: 16, fontWeight: '600', color: '#333' },
  btnDisabled: { opacity: 0.4 },

  delBtn: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginLeft: 16
  },

  couponBox: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  cHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginLeft: 8 },
  vcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff4f6',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    marginBottom: 12
  },
  vcTxt: { marginLeft: 8, marginRight: 'auto', fontSize: 14, color: '#ff3f6c', fontWeight: '600' },

  inputRow: { flexDirection: 'row', alignItems: 'center' },
  cInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    borderWidth: 1,
    borderColor: '#ccc'
  },
  cBtn: {
    backgroundColor: '#ff3f6c',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 8
  },
  cBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },

  msgRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  okTxt: { fontSize: 14, color: '#4caf50', fontWeight: '600', marginLeft: 6 },
  errTxt: { fontSize: 14, color: '#ff3f6c', fontWeight: '600', marginLeft: 6 },
  appliedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rmTxt: { fontSize: 14, fontWeight: '700', color: '#ff3f6c', textDecorationLine: 'underline' },

  shipBar: {
    backgroundColor: '#e8f5e8',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50'
  },
  shipTxt: { fontSize: 14, color: '#2e7d32', fontWeight: '600', textAlign: 'center' },

  itemsSection: { paddingHorizontal: 16 },

  checkoutBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    paddingTop: 8
  },
  summary: { padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, alignItems: 'center' },
  label: { fontSize: 14, color: '#666' },
  val: { fontSize: 14, color: '#333', fontWeight: '500' },
  discRow: { borderTopWidth: 1, borderTopColor: '#e0e0e0', marginTop: 8, paddingTop: 8 },
  discVal: { color: '#4caf50', fontSize: 14, fontWeight: '500' },
  sep: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
  totalL: { fontSize: 16, fontWeight: '700', color: '#333' },
  totalV: { fontSize: 16, fontWeight: '700', color: '#ff3f6c' },

  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff3f6c',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 8
  },
  cbTxt: { color: '#fff', fontSize: 16, fontWeight: '700', marginRight: 8 }
});
