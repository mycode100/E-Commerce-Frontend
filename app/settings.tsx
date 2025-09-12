import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Settings,
  Wrench,
  Code,
  Clock,
  Zap,
  Users,
  Heart,
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function SettingsPage() {
  const router = useRouter();
  
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleBack = () => {
    router.push('/(tabs)');
  };

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Settings size={24} color="#ff3f6c" />
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.maintenanceContainer,
            { 
              opacity: fadeAnim,
              transform: [{ scale: pulseScale }]
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.toolsContainer,
              { transform: [{ rotate: rotateInterpolate }] }
            ]}
          >
            <Wrench size={64} color="#ff3f6c" />
          </Animated.View>

          <Text style={styles.mainTitle}>Under Development</Text>
          
          <Text style={styles.mainDescription}>
            Our developers are currently working hard on this feature to make it live and available for you soon.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.progressSection, { opacity: fadeAnim }]}>
          <Text style={styles.progressTitle}>What We're Building</Text>
          
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Users size={24} color="#2196f3" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Account Management</Text>
              <Text style={styles.featureDescription}>Profile settings, security, and privacy controls</Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>60%</Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Zap size={24} color="#ff9800" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>App Preferences</Text>
              <Text style={styles.featureDescription}>Notifications, language, and theme options</Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>45%</Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Heart size={24} color="#e91e63" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Shopping Preferences</Text>
              <Text style={styles.featureDescription}>Size preferences, favorites, and recommendations</Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>30%</Text>
            </View>
          </View>
        </Animated.View>

        {/* Timeline Section */}
        <Animated.View style={[styles.timelineSection, { opacity: fadeAnim }]}>
          <View style={styles.timelineHeader}>
            <Clock size={20} color="#666" />
            <Text style={styles.timelineTitle}>Development Timeline</Text>
          </View>
          
          <View style={styles.timelineItem}>
            <View style={[styles.timelineIndicator, styles.timelineCompleted]} />
            <Text style={styles.timelineText}>UI Design & Planning - Completed</Text>
          </View>
          
          <View style={styles.timelineItem}>
            <View style={[styles.timelineIndicator, styles.timelineActive]} />
            <Text style={styles.timelineText}>Backend Integration - In Progress</Text>
          </View>
          
          <View style={styles.timelineItem}>
            <View style={styles.timelineIndicator} />
            <Text style={styles.timelineText}>Testing & Optimization - Upcoming</Text>
          </View>
          
          <View style={styles.timelineItem}>
            <View style={styles.timelineIndicator} />
            <Text style={styles.timelineText}>Feature Launch - Coming Soon</Text>
          </View>
        </Animated.View>

        {/* Developer Message */}
        <View style={styles.developerMessage}>
          <Code size={20} color="#4caf50" />
          <Text style={styles.developerText}>
            Stay tuned! We're coding with passion to deliver an amazing settings experience.
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
    backgroundColor: '#f8f9fa',
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 40,
  },

  maintenanceContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  toolsContainer: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  mainDescription: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 8,
  },

  progressSection: {
    marginBottom: 32,
  },
  progressTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  progressBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1976d2',
  },

  timelineSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
    marginRight: 16,
  },
  timelineCompleted: {
    backgroundColor: '#4caf50',
  },
  timelineActive: {
    backgroundColor: '#ff3f6c',
  },
  timelineText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },

  developerMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8f0',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  developerText: {
    fontSize: 14,
    color: '#2e7d32',
    marginLeft: 12,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },

  bottomSpacer: {
    height: 40,
  },
});
