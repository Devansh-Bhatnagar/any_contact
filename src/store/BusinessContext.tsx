import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { Business, BusinessCategory, BusinessSection } from '../types/business';
import {
  BusinessService,
  RegisterBusinessInput,
} from '../services/businessService';
import { BackendNotificationItem } from '../services/api/apiTypes';
import { StorageService } from '../services/storageService';
import { useAuth } from './AuthContext';

interface BusinessContextType {
  businesses: Business[];
  myBusinesses: Business[];
  categories: string[];
  notifications: BackendNotificationItem[];
  unreadNotificationsCount: number;
  sections: BusinessSection[];
  filteredBusinesses: Business[];
  recentBusinesses: Business[];
  bestieBusinesses: Business[];
  bestieSections: BusinessSection[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: BusinessCategory;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: BusinessCategory) => void;
  toggleBestie: (businessId: string) => Promise<void>;
  isBestie: (businessId: string) => boolean;
  trackBusinessView: (business: Business) => Promise<void>;
  clearRecentHistory: () => Promise<void>;
  refreshBusinesses: () => Promise<void>;
  refreshMyBusinesses: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  getBusinessById: (id: string) => Business | undefined;
  fetchBusinessDetails: (id: string) => Promise<Business | null>;
  searchRemoteBusinesses: (
    q?: string,
    category?: string
  ) => Promise<Business[]>;
  addBusiness: (input: RegisterBusinessInput) => Promise<Business>;
  updateBusiness: (
    id: string,
    input: Partial<RegisterBusinessInput>
  ) => Promise<Business | null>;
  submitBusiness: (id: string) => Promise<Business | null>;
  deleteBusiness: (id: string) => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(
  undefined
);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [myBusinesses, setMyBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<BackendNotificationItem[]>(
    []
  );
  const [bestieIds, setBestieIds] = useState<Set<string>>(new Set());
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] =
    useState<BusinessCategory>('All');

  // Load directory, categories, owner businesses, and notifications
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        loadedBusinesses,
        loadedCategories,
        loadedMyBusinesses,
        loadedNotifications,
        storedBestieIds,
        storedRecentIds,
      ] = await Promise.all([
        BusinessService.getBusinesses(),
        BusinessService.getCategories(),
        BusinessService.getMyBusinesses(),
        BusinessService.getNotifications(),
        StorageService.getBestieIds(),
        StorageService.getRecentBusinessIds(),
      ]);

      const initialBestieSet = new Set<string>(storedBestieIds);
      loadedBusinesses.forEach((b: Business) => {
        if (b.isBestie) {
          initialBestieSet.add(b.id);
        }
      });

      const unifiedBusinesses = loadedBusinesses.map((b: Business) => ({
        ...b,
        isBestie: initialBestieSet.has(b.id),
      }));

      setBusinesses(unifiedBusinesses);
      setCategories(loadedCategories);
      setMyBusinesses(loadedMyBusinesses);
      setNotifications(loadedNotifications);
      setBestieIds(initialBestieSet);
      setRecentIds(storedRecentIds);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load businesses'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshMyBusinesses = useCallback(async () => {
    const mine = await BusinessService.getMyBusinesses();
    setMyBusinesses(mine);
    // Ensure owner-created listings also stay reflected in businesses list cleanly
    setBusinesses((prev) => {
      const mineMap = new Map(mine.map((m) => [m.id, m]));
      const updated = prev.map((b) =>
        mineMap.has(b.id)
          ? { ...b, ...mineMap.get(b.id)!, isBestie: b.isBestie }
          : b
      );
      const existingIds = new Set(updated.map((b) => b.id));
      const additions = mine.filter((m) => !existingIds.has(m.id));
      return [...additions, ...updated];
    });
  }, []);

  const refreshNotifications = useCallback(async () => {
    const list = await BusinessService.getNotifications();
    setNotifications(list);
  }, []);

  // Refresh owner-scoped data when authenticated user changes
  useEffect(() => {
    refreshMyBusinesses();
    refreshNotifications();
  }, [user?.id, refreshMyBusinesses, refreshNotifications]);

  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await BusinessService.markNotificationRead(id);
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await BusinessService.markAllNotificationsRead();
  }, []);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Toggle Bestie
  const toggleBestie = useCallback(async (businessId: string) => {
    setBestieIds((prev) => {
      const next = new Set(prev);
      if (next.has(businessId)) {
        next.delete(businessId);
      } else {
        next.add(businessId);
      }

      const idsArray = Array.from(next);
      StorageService.saveBestieIds(idsArray).catch((err: any) =>
        console.warn('Failed to save bestie:', err)
      );

      return next;
    });

    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === businessId ? { ...b, isBestie: !b.isBestie } : b
      )
    );
  }, []);

  const isBestieCheck = useCallback(
    (businessId: string): boolean => {
      return bestieIds.has(businessId);
    },
    [bestieIds]
  );

  // Track Business View for Recents (LRU - most recent at index 0, no duplicates)
  const trackBusinessView = useCallback(async (business: Business) => {
    setRecentIds((prev) => {
      const filtered = prev.filter((id) => id !== business.id);
      const updated = [business.id, ...filtered].slice(0, 15);
      StorageService.saveRecentBusinessIds(updated).catch(() => {});
      return updated;
    });
  }, []);

  // Clear Recent History
  const clearRecentHistory = useCallback(async () => {
    setRecentIds([]);
    await StorageService.clearRecentBusinesses();
  }, []);

  // Filtered Businesses
  const filteredBusinesses = useMemo(() => {
    return BusinessService.filterBusinesses(businesses, {
      query: searchQuery,
      category: selectedCategory,
    });
  }, [businesses, searchQuery, selectedCategory]);

  // Grouped A-Z Sections for Contacts list
  const sections = useMemo(() => {
    return BusinessService.groupIntoSections(filteredBusinesses);
  }, [filteredBusinesses]);

  // Bestie Businesses list (alphabetically sorted)
  const bestieBusinesses = useMemo(() => {
    const list = businesses.filter((b) => bestieIds.has(b.id));
    const filtered = BusinessService.filterBusinesses(list, {
      query: searchQuery,
      category: selectedCategory,
    });
    return BusinessService.sortAlphabetically(filtered);
  }, [businesses, bestieIds, searchQuery, selectedCategory]);

  // Grouped A-Z Sections for Bestie list
  const bestieSections = useMemo(() => {
    return BusinessService.groupIntoSections(bestieBusinesses);
  }, [bestieBusinesses]);

  // Recent Businesses list in order of viewing
  const recentBusinesses = useMemo(() => {
    const map = new Map(businesses.map((b) => [b.id, b]));
    const result: Business[] = [];
    recentIds.forEach((id) => {
      const b = map.get(id);
      if (b) {
        result.push(b);
      }
    });
    return result;
  }, [businesses, recentIds]);

  const getBusinessById = useCallback(
    (id: string) => {
      return (
        businesses.find((b) => b.id === id) ||
        myBusinesses.find((b) => b.id === id)
      );
    },
    [businesses, myBusinesses]
  );

  const fetchBusinessDetails = useCallback(
    async (id: string): Promise<Business | null> => {
      const detailed = await BusinessService.getBusinessDetails(id);
      if (detailed) {
        setBusinesses((prev) =>
          prev.map((b) =>
            b.id === id ? { ...b, ...detailed, isBestie: b.isBestie } : b
          )
        );
        setMyBusinesses((prev) =>
          prev.map((b) => (b.id === id ? { ...b, ...detailed } : b))
        );
      }
      return detailed;
    },
    []
  );

  const searchRemoteBusinesses = useCallback(
    async (q?: string, category?: string): Promise<Business[]> => {
      return BusinessService.searchBusinesses({ q, category });
    },
    []
  );

  const addBusiness = useCallback(
    async (input: RegisterBusinessInput): Promise<Business> => {
      const newBiz = await BusinessService.registerBusiness(input);
      setBusinesses((prev) => [
        newBiz,
        ...prev.filter((b) => b.id !== newBiz.id),
      ]);
      setMyBusinesses((prev) => [
        newBiz,
        ...prev.filter((b) => b.id !== newBiz.id),
      ]);
      return newBiz;
    },
    []
  );

  const updateBusiness = useCallback(
    async (
      id: string,
      input: Partial<RegisterBusinessInput>
    ): Promise<Business | null> => {
      const updated = await BusinessService.updateBusiness(id, input);
      if (updated) {
        setBusinesses((prev) =>
          prev.map((b) =>
            b.id === id ? { ...b, ...updated, isBestie: b.isBestie } : b
          )
        );
        setMyBusinesses((prev) =>
          prev.map((b) => (b.id === id ? { ...b, ...updated } : b))
        );
      }
      return updated;
    },
    []
  );

  const submitBusiness = useCallback(
    async (id: string): Promise<Business | null> => {
      const submitted = await BusinessService.submitBusiness(id);
      if (submitted) {
        setBusinesses((prev) =>
          prev.map((b) =>
            b.id === id ? { ...b, ...submitted, isBestie: b.isBestie } : b
          )
        );
        setMyBusinesses((prev) =>
          prev.map((b) => (b.id === id ? { ...b, ...submitted } : b))
        );
      }
      return submitted;
    },
    []
  );

  const deleteBusiness = useCallback(async (id: string): Promise<void> => {
    await BusinessService.deleteBusiness(id);
    setBusinesses((prev) => prev.filter((b) => b.id !== id));
    setMyBusinesses((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        myBusinesses,
        categories,
        notifications,
        unreadNotificationsCount,
        sections,
        filteredBusinesses,
        recentBusinesses,
        bestieBusinesses,
        bestieSections,
        isLoading,
        error,
        searchQuery,
        selectedCategory,
        setSearchQuery,
        setSelectedCategory,
        toggleBestie,
        isBestie: isBestieCheck,
        trackBusinessView,
        clearRecentHistory,
        refreshBusinesses: loadData,
        refreshMyBusinesses,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        getBusinessById,
        fetchBusinessDetails,
        searchRemoteBusinesses,
        addBusiness,
        updateBusiness,
        submitBusiness,
        deleteBusiness,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusinesses = (): BusinessContextType => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusinesses must be used within a BusinessProvider');
  }
  return context;
};
