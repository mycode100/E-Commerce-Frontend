// For web compatibility, use localStorage as fallback
const isWeb = typeof window !== 'undefined';

export const webSafeStorage = {
  setItem: async (key: string, value: string) => {
    if (isWeb) {
      localStorage.setItem(key, value);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(key, value);
    }
  },
  
  getItem: async (key: string): Promise<string | null> => {
    if (isWeb) {
      return localStorage.getItem(key);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem(key);
    }
  },
  
  removeItem: async (key: string) => {
    if (isWeb) {
      localStorage.removeItem(key);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(key);
    }
  }
};
