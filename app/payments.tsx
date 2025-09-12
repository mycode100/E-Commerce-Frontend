import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Building2,
  Truck,
  Calendar,
  Bitcoin,
  Wallet,
  Zap,
  Shield,
  Clock,
  CheckCircle,
  Rocket,
  Star,
  Trophy,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const offeredPayments = [
  { 
    icon: CreditCard, 
    name: 'Credit/Debit Cards', 
    description: 'Visa, Mastercard, Amex, RuPay & more',
    color: '#2196f3'
  },
  { 
    icon: Building2, 
    name: 'Net Banking', 
    description: 'All major banks supported',
    color: '#4caf50'
  },
  { 
    icon: Smartphone, 
    name: 'UPI Payments', 
    description: 'Google Pay, PhonePe, Paytm, BHIM',
    color: '#ff9800'
  },
  { 
    icon: Truck, 
    name: 'Cash on Delivery', 
    description: 'Pay when your order arrives',
    color: '#9c27b0'
  },
];

const upcomingPayments = [
  { 
    icon: Calendar, 
    name: 'EMI Options', 
    description: 'Easy monthly installments coming soon',
    color: '#607d8b'
  },
  { 
    icon: Bitcoin, 
    name: 'Crypto Payments', 
    description: 'Bitcoin, Ethereum & popular cryptocurrencies',
    color: '#ff5722'
  },
  { 
    icon: Wallet, 
    name: 'Digital Wallets', 
    description: 'Amazon Pay, Google Pay wallet support',
    color: '#795548'
  },
  { 
    icon: Zap, 
    name: 'Express Checkout', 
    description: 'One-click payments for faster shopping',
    color: '#e91e63'
  },
];

export default function PaymentsPage() {
  const router = useRouter();

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.02],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          style={[
            styles.animationBox, 
            { 
              opacity: pulseOpacity, 
              transform: [{ scale: pulseScale }] 
            }
          ]}
        >
          <View style={styles.animationContent}>
            <Shield size={32} color="#ff3f6c" />
            <Text style={styles.animationTitle}>Secure Payments</Text>
            <Text style={styles.animationText}>
              Our developers are working hard to bring you the most secure and convenient payment options!
            </Text>
            <View style={styles.loadingDots}>
              <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
            </View>
          </View>
        </Animated.View>

        <Animated.View 
          style={[
            styles.section,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>
            <CheckCircle size={20} color="#4caf50" /> Available Now
          </Text>
          <Text style={styles.sectionSubtitle}>Choose from our secure payment options</Text>
          
          {offeredPayments.map((payment, index) => (
            <Animated.View
              key={index}
              style={[
                styles.methodCard,
                {
                  transform: [{
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 50],
                      outputRange: [0, 50 + (index * 20)],
                    })
                  }]
                }
              ]}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: `${payment.color}15` }]}>
                  <payment.icon size={24} color={payment.color} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.methodName}>{payment.name}</Text>
                  <Text style={styles.methodDescription}>{payment.description}</Text>
                </View>
                <View style={[styles.statusBadge, styles.activeBadge]}>
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.View 
          style={[
            styles.section,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>
            <Rocket size={20} color="#ff9800" /> Coming Soon
          </Text>
          <Text style={styles.sectionSubtitle}>Exciting new payment features in development</Text>
          
          {upcomingPayments.map((payment, index) => (
            <Animated.View
              key={index}
              style={[
                styles.upcomingCard,
                {
                  transform: [{
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 50],
                      outputRange: [0, 50 + (index * 20)],
                    })
                  }]
                }
              ]}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: `${payment.color}15` }]}>
                  <payment.icon size={24} color={payment.color} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.upcomingName}>{payment.name}</Text>
                  <Text style={styles.upcomingDescription}>{payment.description}</Text>
                </View>
                <View style={[styles.statusBadge, styles.comingSoonBadge]}>
                  <Clock size={12} color="#666" />
                  <Text style={styles.comingSoonText}>Soon</Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        <View style={styles.securitySection}>
          <Shield size={20} color="#4caf50" />
          <Text style={styles.securityText}>
            All payments are secured with industry-standard encryption
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  animationBox: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#ff3f6c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
  },
  animationContent: {
    padding: 24,
    alignItems: "center",
  },
  animationTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginTop: 12,
    marginBottom: 8,
  },
  animationText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 16,
  },
  loadingDots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff3f6c",
  },
  
  section: {
    marginHorizontal: 20,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    lineHeight: 22,
  },
  
  methodCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  upcomingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    opacity: 0.8,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  methodName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  upcomingName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#555",
    marginBottom: 4,
  },
  upcomingDescription: {
    fontSize: 14,
    color: "#777",
    lineHeight: 20,
  },
  
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  activeBadge: {
    backgroundColor: "#e8f5e8",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4caf50",
  },
  comingSoonBadge: {
    backgroundColor: "#f5f5f5",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  
  securitySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 32,
    padding: 16,
    backgroundColor: "#f0f8f0",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4caf50",
  },
  securityText: {
    fontSize: 14,
    color: "#2e7d32",
    fontWeight: "500",
    marginLeft: 8,
    textAlign: "center",
    flex: 1,
  },
  
  bottomSpacer: {
    height: 40,
  },
});
