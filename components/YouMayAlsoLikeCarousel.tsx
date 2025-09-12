import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';

import { Product } from '@/types/product';
import { Star } from 'lucide-react-native';

interface Recommendation {
  product: Product;
  score: number;
  reasons: string[];
  metadata?: {
    viewerCount?: number;
    totalViews?: number;
    [key: string]: any;
  };
}

interface RecommendationMeta {
  count: number;
  userId: string;
  algorithm: string;
  timestamp: string;
}

interface RecommendationResponse {
  recommendations: Recommendation[];
  meta: RecommendationMeta;
}

interface TrackingMetadata {
  userAgent: string;
  platform: string;
  timestamp?: string;
  recommendationIndex?: number;
  fromProduct?: string;
  clickedAt?: string;
}

interface TrackingData {
  productId: string;
  sessionId: string;
  userId?: string;
  source: string;
  metadata: TrackingMetadata;
}

interface YouMayAlsoLikeCarouselProps {
  currentProductId: string;
  onProductPress?: (product: Product) => void;
  limit?: number;
  style?: any;
  testID?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth * 0.45;
const cardMargin = 12;

const YouMayAlsoLikeCarousel: React.FC<YouMayAlsoLikeCarouselProps> = ({
  currentProductId,
  onProductPress,
  limit = 6,
  style,
  testID = 'you-may-also-like-carousel',
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  const { user, isAuthenticated } = useAuth();
  
  const scrollViewRef = useRef<ScrollView>(null);
  const sessionId = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "https://e-commerce-backend-rktu.onrender.com";


  const fetchRecommendations = useCallback(async (showLoading: boolean = true): Promise<void> => {
    if (!currentProductId) {
      console.warn('⚠️ No product ID provided for recommendations');
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000);

    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      console.log(`🎯 Fetching recommendations for product: ${currentProductId}`);

      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      if (user?._id) {
        params.append('userId', user._id);
      }

      const url = `${API_BASE_URL}/api/recommendations/product/${currentProductId}?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: { success: boolean; data: RecommendationResponse; message?: string } = await response.json();

      if (data.success && data.data) {
        const validRecommendations = (data.data.recommendations || []).filter(
          rec => rec.product && rec.product._id && rec.product.name
        );
        
        console.log(`✅ Received ${validRecommendations.length} valid recommendations`);
        setRecommendations(validRecommendations);
        
        if (validRecommendations.length > 0) {
          await trackRecommendationView();
        }
      } else {
        throw new Error(data.message || 'Failed to fetch recommendations');
      }

    } catch (err) {
      clearTimeout(timeoutId);
      
      console.error('❌ Error fetching recommendations:', err);
      
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load recommendations';
        setError(errorMessage);
      }
      setRecommendations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentProductId, user?._id, limit]);

  const trackRecommendationView = useCallback(async (): Promise<void> => {
    try {
      const trackingData: TrackingData = {
        productId: currentProductId,
        sessionId: sessionId.current,
        source: 'recommendation_carousel',
        metadata: {
          userAgent: 'ReactNative',
          platform: 'mobile',
          timestamp: new Date().toISOString(),
        },
      };

      if (user?._id) {
        trackingData.userId = user._id;
      }

      const response = await fetch(`${API_BASE_URL}/api/browsing-history/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(trackingData),
      });

      if (response.ok) {
        console.log('📊 Recommendation view tracked successfully');
      } else {
        throw new Error(`Tracking failed: ${response.status}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to track recommendation view:', error);
    }
  }, [currentProductId, user?._id]);

  const trackProductClick = useCallback(async (clickedProduct: Product, index: number): Promise<void> => {
    try {
      const trackingData: TrackingData = {
        productId: clickedProduct._id,
        sessionId: sessionId.current,
        source: 'recommendation_click',
        metadata: {
          userAgent: 'ReactNative',
          platform: 'mobile',
          recommendationIndex: index,
          fromProduct: currentProductId,
          clickedAt: new Date().toISOString(),
        },
      };

      if (user?._id) {
        trackingData.userId = user._id;
      }

      const response = await fetch(`${API_BASE_URL}/api/browsing-history/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(trackingData),
      });

      if (response.ok) {
        console.log(`📊 Product click tracked: ${clickedProduct.name}`);
      } else {
        throw new Error(`Click tracking failed: ${response.status}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to track product click:', error);
    }
  }, [currentProductId, user?._id]);

  const handleProductPress = useCallback(async (product: Product, index: number): Promise<void> => {
    try {
      trackProductClick(product, index).catch(console.warn);
      
      if (onProductPress) {
        onProductPress(product);
      }
    } catch (error) {
      console.error('❌ Error handling product press:', error);
      if (onProductPress) {
        onProductPress(product);
      }
    }
  }, [onProductPress, trackProductClick]);

  const calculateDiscountPercentage = useCallback((originalPrice: number, currentPrice: number): number => {
    if (!originalPrice || originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }, []);

  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }, []);

  const getImageUrl = useCallback((imagePath: string): string => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_BASE_URL}${imagePath}`;
  }, [API_BASE_URL]);

  const getCategoryName = useCallback((category: Product['category']): string => {
    if (!category) return 'Unknown Category';
    if (typeof category === 'string') return category;
    return category.name || 'Unknown Category';
  }, []);

  const onRefresh = useCallback((): void => {
    setRefreshing(true);
    fetchRecommendations(false);
  }, [fetchRecommendations]);

  const handleRetry = useCallback((): void => {
    setError(null);
    fetchRecommendations(true);
  }, [fetchRecommendations]);

  useEffect(() => {
    if (currentProductId) {
      fetchRecommendations(true);
    }
  }, [fetchRecommendations, currentProductId]);

  if (!currentProductId) {
    return null;
  }

  const renderProductCard = useCallback((recommendation: Recommendation, index: number) => {
    const { product } = recommendation;
    
    if (!product || !product._id) {
      return null;
    }

    const discountPercentage = calculateDiscountPercentage(
      product.originalPrice || 0,
      product.price
    );

    return (
      <TouchableOpacity
        key={product._id}
        style={styles.productCard}
        onPress={() => handleProductPress(product, index)}
        activeOpacity={0.8}
        testID={`product-card-${index}`}
      >
        <View style={styles.imageContainer}>
          {product.images && product.images.length > 0 ? (
            <Image
              source={{ uri: getImageUrl(product.images[0]) }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          
          {discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.brandText} numberOfLines={1}>
            {product.brand || 'Unknown Brand'}
          </Text>
          
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
          
          <View style={styles.priceSection}>
            <Text style={styles.currentPrice}>
              {formatPrice(product.price)}
            </Text>
            {product.originalPrice && product.originalPrice > product.price && (
              <Text style={styles.originalPrice}>
                {formatPrice(product.originalPrice)}
              </Text>
            )}
          </View>
          
          {product.rating && product.rating > 0 && (
            <View style={styles.ratingSection}>
              <Text style={styles.ratingText}>
                <Star size={14} color="#ffa500" fill="#ffa500" /> {product.rating.toFixed(1)}
              </Text>
              {product.ratingCount && product.ratingCount > 0 && (
                <Text style={styles.ratingCount}>({product.ratingCount})</Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [calculateDiscountPercentage, formatPrice, getImageUrl, handleProductPress]);

  if (error && !loading) {
    return (
      <View style={[styles.container, style]} testID={testID}>
        <View style={styles.header}>
          <Text style={styles.title}>You May Also Like</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error.includes('HTTP') ? 'Unable to load recommendations' : error}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={handleRetry}
            testID="retry-button"
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!loading && !error && recommendations.length === 0) {
    return (
      <View style={[styles.container, style]} testID={testID}>
        <View style={styles.header}>
          <Text style={styles.title}>You May Also Like</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No recommendations available right now
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={onRefresh}
            testID="refresh-button"
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title}>You May Also Like</Text>
        {recommendations.length > 0 && (
          <Text style={styles.subtitle}>
            {isAuthenticated ? 'Personalized for you' : 'Popular picks'}
          </Text>
        )}
      </View>

      {loading && recommendations.length === 0 && (
        <View style={styles.loadingContainer} testID="loading-container">
          <ActivityIndicator size="large" color="#ff3f6c" />
          <Text style={styles.loadingText}>Finding products you'll love...</Text>
        </View>
      )}

      {/* ✅ Recommendations Carousel */}
      {recommendations.length > 0 && (
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          testID="recommendations-carousel"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#ff3f6c']}
              tintColor="#ff3f6c"
            />
          }
        >
          {recommendations.map((recommendation, index) =>
            renderProductCard(recommendation, index)
          )}
        </ScrollView>
      )}
    </View>
  );
};

// ✅ Comprehensive Styles (unchanged)
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 20,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#282c3f',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#94969f',
    fontWeight: '400',
  },
  carouselContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  productCard: {
    width: cardWidth,
    marginRight: cardMargin,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  imageContainer: {
    position: 'relative',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8f8f8',
  },
  productImage: {
    width: '100%',
    height: cardWidth * 1.2,
    backgroundColor: '#f8f8f8',
  },
  placeholderImage: {
    width: '100%',
    height: cardWidth * 1.2,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#94969f',
    fontSize: 12,
    fontWeight: '500',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ff3f6c',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    elevation: 1,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  productInfo: {
    padding: 12,
    flex: 1,
  },
  brandText: {
    fontSize: 12,
    color: '#94969f',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 14,
    color: '#282c3f',
    fontWeight: '400',
    marginBottom: 8,
    lineHeight: 18,
    minHeight: 36,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#282c3f',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#94969f',
    textDecorationLine: 'line-through',
    fontWeight: '400',
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#14958f',
    fontWeight: '600',
    marginRight: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: '#94969f',
    fontWeight: '400',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94969f',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#94969f',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#ff3f6c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    elevation: 2,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#94969f',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  refreshButton: {
    borderColor: '#ff3f6c',
    borderWidth: 1.5,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  refreshButtonText: {
    color: '#ff3f6c',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default YouMayAlsoLikeCarousel;
