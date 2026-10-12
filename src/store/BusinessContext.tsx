import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { Business, BusinessCategory, BusinessSection } from '../types/business';
import { BusinessService } from '../services/businessService';
import { StorageService } from '../services/storageService';

interface BusinessContextType {
  businesses: Business[];
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
  getBusinessById: (id: string) => Business | undefined;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [bestieIds, setBestieIds] = useState<Set<string>>(new Set());
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory>('All');

  // Load initial data and storage
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [loadedBusinesses, storedBestieIds, storedRecentIds] =
        await Promise.all([
          BusinessService.getBusinesses(),
          StorageService.getBestieIds(),
          StorageService.getRecentBusinessIds(),
        ]);

      // Combine default mock bestie flags with locally stored bestie IDs
      const initialBestieSet = new Set<string>(storedBestieIds);
      loadedBusinesses.forEach((b: Business) => {
        if (b.isBestie) {
          initialBestieSet.add(b.id);
        }
      });

      // Update business isBestie flags
      const unifiedBusinesses = loadedBusinesses.map((b: Business) => ({
        ...b,
        isBestie: initialBestieSet.has(b.id),
      }));

      setBusinesses(unifiedBusinesses);
      setBestieIds(initialBestieSet);
      setRecentIds(storedRecentIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load businesses');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle Bestie
  const toggleBestie = useCallback(
    async (businessId: string) => {
      setBestieIds((prev) => {
        const next = new Set(prev);
        if (next.has(businessId)) {
          next.delete(businessId);
        } else {
          next.add(businessId);
        }

        // Persist to storage
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
    },
    []
  );

  const isBestieCheck = useCallback(
    (businessId: string): boolean => {
      return bestieIds.has(businessId);
    },
    [bestieIds]
  );

  // Track Business View for Recents (LRU - most recent at index 0, no duplicates)
  const trackBusinessView = useCallback(
    async (business: Business) => {
      setRecentIds((prev) => {
        const filtered = prev.filter((id) => id !== business.id);
        const updated = [business.id, ...filtered].slice(0, 15);
        StorageService.saveRecentBusinessIds(updated).catch(() => {});
        return updated;
      });
    },
    []
  );

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
      return businesses.find((b) => b.id === id);
    },
    [businesses]
  );

  return (
    <BusinessContext.Provider
      value={{
        businesses,
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
        getBusinessById,
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
