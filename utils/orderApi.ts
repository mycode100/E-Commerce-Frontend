import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";


export interface CreateOrderData {
  userId: string;
  shippingAddress: any;
  paymentMethod: string;
  paymentGateway?: string;
  customerNotes?: string;
}

export interface OrderApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  meta?: any;
}

export const createOrder = async (orderData: CreateOrderData): Promise<OrderApiResponse> => {
  try {
    console.log('🛒 Creating order for user:', orderData.userId);
    console.log('📦 Order payload:', JSON.stringify(orderData, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/api/order/create/${orderData.userId}`, {
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      customerNotes: orderData.customerNotes || ''
    });

    console.log('🔥 Raw API Response:', JSON.stringify(response.data, null, 2));

    if (response.data?.success) {
      const responseData = response.data.data || response.data;
      
      console.log('✅ Order created successfully!');
      console.log('🆔 Order ID:', responseData.orderId || responseData.order?.orderId);
      
      return {
        success: true,
        data: responseData,
        message: response.data.message || 'Order placed successfully!'
      };
    } else {
      console.error('❌ Order creation failed - API returned success: false');
      return {
        success: false,
        message: response.data?.message || 'Failed to create order',
        error: response.data?.error || 'UNKNOWN_ERROR'
      };
    }
  } catch (error: any) {
    console.error('❌ Create order API error:', error);
    console.error('❌ Error response:', error.response?.data);
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create order. Please try again.',
      error: error.response?.data?.error || 'NETWORK_ERROR'
    };
  }
};

export const getUserOrders = async (userId: string, options?: {
  limit?: number;
  page?: number;
}): Promise<OrderApiResponse> => {
  try {
    console.log('📋 Fetching orders for user:', userId);
    console.log('📋 Options:', options);
    
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.page) params.append('page', options.page.toString());

    const url = `${API_BASE_URL}/api/order/user/${userId}?${params.toString()}`;
    console.log('🔗 Request URL:', url);
    
    const response = await axios.get(url);
    console.log('📊 Orders API Response:', JSON.stringify(response.data, null, 2));

    if (response.data?.success) {
      const orders = response.data.data || [];
      console.log(`✅ Found ${orders.length} orders for user`);
      
      return {
        success: true,
        data: orders,
        meta: response.data.meta
      };
    } else {
      console.warn('⚠️ Orders fetch returned unsuccessful response:', response.data);
      return {
        success: false,
        message: response.data?.message || 'Failed to fetch orders',
        error: response.data?.error,
        data: []
      };
    }
  } catch (error: any) {
    console.error('❌ Get user orders API error:', error);
    console.error('❌ Error response:', error.response?.data);
    
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch orders',
      error: error.response?.data?.error || 'NETWORK_ERROR',
      data: []
    };
  }
};

export const getOrderById = async (orderId: string): Promise<OrderApiResponse> => {
  try {
    console.log('🔍 Fetching order details for:', orderId);
    
    const response = await axios.get(`${API_BASE_URL}/api/order/${orderId}`);
    
    console.log('📋 Single order response:', response.data);
    
    if (response.data?.success) {
      return {
        success: true,
        data: response.data.data,
        message: 'Order details fetched successfully'
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Order not found'
      };
    }
  } catch (error: any) {
    console.error('❌ Get order by ID error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch order details',
      error: 'NETWORK_ERROR'
    };
  }
};

export const handleOrderApiError = (error: string | undefined): string => {
  switch (error) {
    case 'INVALID_USER_ID':
      return 'Invalid user information. Please login again.';
    case 'VALIDATION_ERROR':
      return 'Please check all required fields and try again.';
    case 'NETWORK_ERROR':
      return 'Network error. Please check your connection.';
    case 'MONGOOSE_VALIDATION_ERROR':
      return 'Invalid order data. Please try again.';
    case 'DUPLICATE_ORDER':
      return 'Duplicate order detected. Please refresh and try again.';
    case 'INTERNAL_SERVER_ERROR':
      return 'Server error. Please try again later.';
    default:
      return error || 'An unexpected error occurred. Please try again.';
  }
};

export const debugOrderResponse = (response: any, context: string) => {
  console.log(`🔍 [${context}] Full Response:`, JSON.stringify(response, null, 2));
  
  if (response?.data) {
    console.log(`📊 [${context}] Response Data:`, response.data);
    
    if (response.data.orderId) {
      console.log(`🆔 [${context}] Order ID found:`, response.data.orderId);
    }
    
    if (response.data.order?.orderId) {
      console.log(`🆔 [${context}] Nested Order ID found:`, response.data.order.orderId);
    }
  }
};

