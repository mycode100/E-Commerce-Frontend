import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  StatusBar,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  MapPin, 
  Home,
  Phone,
  Shield,
  Lock,
  Eye,
  AlertTriangle,
  Users,
  Star,
  CheckCircle,
  Calendar,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { Address } from '@/types/product';

const { width: screenWidth } = Dimensions.get('window');

export default function AddressesPage() {
  const router = useRouter();
  const { user, addresses } = useAuth();
  
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const addressArray = useMemo(() => {
    return Array.from(addresses.values()).sort((a, b) => {
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [addresses]);

  const formatAddress = (address: Address): string => {
    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.landmark,
      address.city,
      address.state,
      address.pincode,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const handleAddressPress = (address: Address) => {
    setSelectedAddress(address);
  };

  const closeModal = () => {
    setSelectedAddress(null);
  };

  const AddressItem = ({ address }: { address: Address }) => (
    <TouchableOpacity
      style={[styles.addressItem, address.isDefault && styles.defaultAddressItem]}
      onPress={() => handleAddressPress(address)}
      activeOpacity={0.7}
    >
      <View style={styles.addressHeader}>
        <View style={styles.addressTitleRow}>
          <Home size={18} color="#ff3f6c" />
          <Text style={styles.addressName}>{address.name}</Text>
          {address.isDefault && (
            <View style={styles.defaultBadge}>
              <Star size={10} color="#fff" fill="#fff" />
              <Text style={styles.defaultBadgeText}>DEFAULT</Text>
            </View>
          )}
        </View>
        <Eye size={16} color="#999" />
      </View>
      
      <View style={styles.addressDetails}>
        <Text style={styles.addressText} numberOfLines={2}>
          {formatAddress(address)}
        </Text>
        <View style={styles.phoneRow}>
          <Phone size={14} color="#666" />
          <Text style={styles.phoneText}>{address.phone}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <MapPin size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Addresses Found</Text>
      <Text style={styles.emptySubtitle}>
        Please add addresses from the home page to view them here
      </Text>
    </View>
  );

  const MiniAddressItem = ({ address, index }: { address: Address; index: number }) => (
    <View style={styles.miniAddressItem}>
      <View style={styles.miniAddressHeader}>
        <Text style={styles.miniAddressNumber}>{index + 1}</Text>
        <Text style={styles.miniAddressName}>{address.name}</Text>
        {address.isDefault && (
          <View style={styles.miniDefaultBadge}>
            <Star size={8} color="#ff3f6c" fill="#ff3f6c" />
          </View>
        )}
      </View>
      <Text style={styles.miniAddressText} numberOfLines={1}>
        {formatAddress(address)}
      </Text>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)')}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Addresses</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.emptyState}>
          <Lock size={80} color="#ff3f6c" />
          <Text style={styles.emptyTitle}>Please Login</Text>
          <Text style={styles.emptySubtitle}>
            Login to view your saved addresses
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)')}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Addresses</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.addressListSection}>
          {addressArray.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <Text style={styles.sectionTitle}>Your Saved Addresses</Text>
              <FlatList
                data={addressArray}
                keyExtractor={(item) => item._id!}
                renderItem={({ item }) => <AddressItem address={item} />}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </>
          )}
        </View>

        <View style={styles.cardsSection}>
          <View style={styles.overviewCard}>
            <View style={styles.cardHeader}>
              <Users size={24} color="#ff3f6c" />
              <Text style={styles.cardTitle}>Addresses Overview</Text>
            </View>
            
            <View style={styles.overviewStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{addressArray.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {addressArray.filter(a => a.isDefault).length}
                </Text>
                <Text style={styles.statLabel}>Default</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {addressArray.filter(a => !a.isDefault).length}
                </Text>
                <Text style={styles.statLabel}>Others</Text>
              </View>
            </View>

            {addressArray.length > 0 && (
              <View style={styles.miniAddressContainer}>
                <Text style={styles.miniAddressTitle}>Quick View</Text>
                <ScrollView 
                  style={styles.miniAddressScrollView}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {addressArray.map((address, index) => (
                    <MiniAddressItem 
                      key={address._id} 
                      address={address} 
                      index={index}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.securityCard}>
            <View style={styles.cardHeader}>
              <Shield size={24} color="#4caf50" />
              <Text style={styles.cardTitle}>MVSR Security</Text>
            </View>
            
            <View style={styles.securityFeatures}>
              <View style={styles.securityFeature}>
                <View style={styles.securityFeatureIcon}>
                  <Lock size={20} color="#4caf50" />
                </View>
                <View style={styles.securityFeatureText}>
                  <Text style={styles.securityFeatureTitle}>End-to-End Encryption</Text>
                  <Text style={styles.securityFeatureDesc}>
                    All address data encrypted during transmission
                  </Text>
                </View>
                <CheckCircle size={16} color="#4caf50" />
              </View>

              <View style={styles.securityFeature}>
                <View style={styles.securityFeatureIcon}>
                  <Shield size={20} color="#4caf50" />
                </View>
                <View style={styles.securityFeatureText}>
                  <Text style={styles.securityFeatureTitle}>Secure Storage</Text>
                  <Text style={styles.securityFeatureDesc}>
                    Industry-standard security protocols
                  </Text>
                </View>
                <CheckCircle size={16} color="#4caf50" />
              </View>

              <View style={styles.securityFeature}>
                <View style={styles.securityFeatureIcon}>
                  <Eye size={20} color="#4caf50" />
                </View>
                <View style={styles.securityFeatureText}>
                  <Text style={styles.securityFeatureTitle}>Privacy Protection</Text>
                  <Text style={styles.securityFeatureDesc}>
                    Never shared with third parties
                  </Text>
                </View>
                <CheckCircle size={16} color="#4caf50" />
              </View>
            </View>

            <View style={styles.securityFooter}>
              <Calendar size={14} color="#2e7d32" />
              <Text style={styles.securityFooterText}>
                Last security audit: December 2024
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={selectedAddress !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Address Details</Text>
              <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedAddress && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalAddressCard}>
                  <View style={styles.modalAddressHeader}>
                    <Home size={20} color="#fff" />
                    <Text style={styles.modalAddressName}>{selectedAddress.name}</Text>
                    {selectedAddress.isDefault && (
                      <View style={styles.modalDefaultBadge}>
                        <Star size={10} color="#ff3f6c" fill="#ff3f6c" />
                        <Text style={styles.modalDefaultBadgeText}>DEFAULT</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.modalAddressText}>
                    {formatAddress(selectedAddress)}
                  </Text>
                  
                  <View style={styles.modalPhoneRow}>
                    <Phone size={16} color="#ccc" />
                    <Text style={styles.modalPhoneText}>{selectedAddress.phone}</Text>
                  </View>
                </View>

                <View style={styles.securityNotice}>
                  <AlertTriangle size={20} color="#ffa726" />
                  <View style={styles.securityNoticeText}>
                    <Text style={styles.securityNoticeTitle}>Security Notice</Text>
                    <Text style={styles.securityNoticeDescription}>
                      For security reasons, add, delete, edit, and manage operations are not available here.
                    </Text>
                    <Text style={styles.securityNoticeDescription}>
                      To manage your addresses, please visit the home page and use the address section.
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  
  content: {
    flex: 1,
  },
  
  addressListSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  addressItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  defaultAddressItem: {
    borderColor: '#ff3f6c',
    backgroundColor: '#fff4f6',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff3f6c',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
    gap: 4,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  addressDetails: {
    marginLeft: 26,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 6,
    fontWeight: '500',
  },
  
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },

  cardsSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 20,
  },

  overviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginLeft: 12,
  },
  overviewStats: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ff3f6c',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  miniAddressContainer: {
    marginTop: 4,
  },
  miniAddressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  miniAddressScrollView: {
    maxHeight: 150,
  },
  miniAddressItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ff3f6c',
  },
  miniAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  miniAddressNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ff3f6c',
    backgroundColor: '#fff4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  miniAddressName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  miniDefaultBadge: {
    marginLeft: 8,
  },
  miniAddressText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 28,
  },

  securityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  securityFeatures: {
    marginBottom: 16,
  },
  securityFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f0f8f0',
    padding: 12,
    borderRadius: 10,
  },
  securityFeatureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  securityFeatureText: {
    flex: 1,
  },
  securityFeatureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 2,
  },
  securityFeatureDesc: {
    fontSize: 12,
    color: '#388e3c',
    lineHeight: 16,
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e8f5e8',
  },
  securityFooterText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '500',
    marginLeft: 6,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  modalCloseButton: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 16,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  modalAddressCard: {
    backgroundColor: '#2d2d2d',
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ff3f6c',
  },
  modalAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalAddressName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
    flex: 1,
  },
  modalDefaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  modalDefaultBadgeText: {
    color: '#ff3f6c',
    fontSize: 10,
    fontWeight: '700',
  },
  modalAddressText: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
    marginLeft: 32,
    marginBottom: 12,
  },
  modalPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 32,
  },
  modalPhoneText: {
    fontSize: 15,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  
  securityNotice: {
    flexDirection: 'row',
    backgroundColor: '#2d1b00',
    padding: 18,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffa726',
    marginBottom: 20,
  },
  securityNoticeText: {
    flex: 1,
    marginLeft: 12,
  },
  securityNoticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffa726',
    marginBottom: 8,
  },
  securityNoticeDescription: {
    fontSize: 14,
    color: '#ffcc80',
    lineHeight: 20,
    marginBottom: 6,
  },
  
  closeButton: {
    backgroundColor: '#ff3f6c',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#ff3f6c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
