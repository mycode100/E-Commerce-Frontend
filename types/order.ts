
export type PaymentMethod = 'COD' | 'Credit Card' | 'Debit Card' | 'UPI' | 'Net Banking' | 'Wallet';
export type PaymentStatus = 'Pending' | 'Completed' | 'Failed' | 'Refunded' | 'Partially Refunded';

export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned' | 'Refunded';

export type Carrier = 'Delhivery' | 'Bluedart' | 'Ecom Express' | 'XpressBees' | 'India Post' | 'FedEx' | 'DHL' | 'Aramex';

export type TrackingStatus = 'Label Created' | 'Picked Up' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Failed Delivery' | 'Returned to Sender' | 'Lost';

export interface ComplexOrder {
  _id: string;
  orderId: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  
  pricing: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
  };
  
  shippingAddress: Address;
  billingAddress?: Address;
  
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    transactionId?: string;
    paymentGateway?: string;
    paidAmount: number;
    refundAmount?: number;
    paymentDate?: string;
    refundDate?: string;
  };
  
  tracking?: OrderTracking;
  
  coupons?: AppliedCoupon[];
  customerNotes?: string;
  internalNotes?: string;
  
  deliveryPreferences?: {
    timeSlot: string;
    instructions?: string;
    requireSignature: boolean;
    allowPartialDelivery: boolean;
  };
  
  analytics?: {
    sourceChannel: string;
    campaign?: string;
    referrer?: string;
    deviceInfo?: string;
  };
  
  canBeCancelled: boolean;
  canBeReturned?: boolean;
  isDelivered: boolean;
  itemCount: number;
  daysSinceOrder: number;
  estimatedDaysRemaining?: number;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  _id?: string;
  productId: string | {
    _id: string;
    name: string;
    brand: string;
    images: string[];
    price: number;
    discount?: number;
    rating?: number;
  };
  
  productSnapshot: {
    name: string;
    brand: string;
    images: string[];
    description?: string;
  };
  
  size?: string;
  color?: string;
  price: number;
  quantity: number;
  
  discount?: {
    percentage: number;
    amount: number;
    code?: string;
  };
  
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';
  
  cancellationReason?: string;
  returnReason?: string;
  returnStatus?: 'Not Requested' | 'Requested' | 'Approved' | 'Rejected' | 'Completed';
}

export interface OrderTracking {
  number: string;
  carrier: Carrier;
  estimatedDelivery: string;
  actualDelivery?: string;
  currentLocation: string;
  status: TrackingStatus;
  timeline: TrackingEvent[];
  deliveryAttempts?: number;
  deliveryInstructions?: string;
  recipientName?: string;
  deliveryProof?: string;
}

export interface TrackingEvent {
  status: string;
  location: string;
  timestamp: string;
  description?: string;
  updatedBy: 'system' | 'admin' | 'courier' | 'customer';
}

export interface Address {
  _id?: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  addressType?: 'Home' | 'Office' | 'Other';
  isDefault?: boolean;
}

export interface AppliedCoupon {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
}

export interface OrderStatistics {
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  statusBreakdown: Record<OrderStatus, number>;
  lifetimeValue: number;
  orderFrequency?: number;
}

export interface OrdersResponse {
  success: boolean;
  data: ComplexOrder[];
  meta?: {
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
    showing?: string;
  };
  statistics?: OrderStatistics;
  filters?: any;
}

export interface CreateOrderResponse {
  success: boolean;
  message?: string;
  data?: {
    orderId: string;
    order: ComplexOrder;
    trackingNumber?: string;
    estimatedDelivery?: string;
    totalAmount?: number;
    itemCount?: number;
    paymentMethod?: PaymentMethod;
    nextSteps?: string[];
  };
  error?: string;
}

export interface CreateOrderRequest {
  userId: string;
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: PaymentMethod;
  paymentGateway?: string;
  customerNotes?: string;
  deliveryPreferences?: {
    timeSlot?: string;
    instructions?: string;
    requireSignature?: boolean;
    allowPartialDelivery?: boolean;
  };
  analytics?: {
    sourceChannel?: string;
    campaign?: string;
    referrer?: string;
    deviceInfo?: string;
  };
}

export interface OrderSuccessData {
  orderId: string;
  order: ComplexOrder;
  trackingNumber?: string;
  estimatedDelivery?: string;
  totalAmount?: number;
  itemCount?: number;
  paymentMethod?: PaymentMethod;
  message?: string;
}

export type OrderApiError = 
  | 'INVALID_USER_ID'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'INSUFFICIENT_STOCK'
  | 'MONGOOSE_VALIDATION_ERROR'
  | 'DUPLICATE_ORDER'
  | 'INTERNAL_SERVER_ERROR';

export interface OrderFilterOptions {
  includeStats?: boolean;
  limit?: number;
  page?: number;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: 'orderDate' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export default ComplexOrder;
