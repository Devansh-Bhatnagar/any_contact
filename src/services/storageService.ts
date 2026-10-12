import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storageKeys';

export class StorageService {
  static async getBestieIds(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BESTIE_IDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Failed to load besties from storage:', error);
      return [];
    }
  }

  static async saveBestieIds(ids: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BESTIE_IDS, JSON.stringify(ids));
    } catch (error) {
      console.warn('Failed to save besties to storage:', error);
    }
  }

  static async getRecentBusinessIds(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_BUSINESS_IDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Failed to load recent businesses from storage:', error);
      return [];
    }
  }

  static async saveRecentBusinessIds(ids: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_BUSINESS_IDS, JSON.stringify(ids));
    } catch (error) {
      console.warn('Failed to save recent businesses to storage:', error);
    }
  }

  static async clearRecentBusinesses(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_BUSINESS_IDS);
    } catch (error) {
      console.warn('Failed to clear recent businesses from storage:', error);
    }
  }

  static async getAuthUser(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to get auth user:', error);
      return null;
    }
  }

  static async saveAuthUser(user: any | null): Promise<void> {
    try {
      if (user) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      }
    } catch (error) {
      console.warn('Failed to save auth user:', error);
    }
  }

  static async getDashboardData(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BUSINESS_DASHBOARD_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to get dashboard data:', error);
      return null;
    }
  }

  static async saveDashboardData(data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.BUSINESS_DASHBOARD_DATA,
        JSON.stringify(data)
      );
    } catch (error) {
      console.warn('Failed to save dashboard data:', error);
    }
  }
}
