import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Business } from '../types/business';
import { businessApi } from '../api/businessApi';
import { CategoryMeta, CATEGORIES } from '../data/categories';
import { INITIAL_BUSINESSES } from '../data/mockBusinesses';

interface BusinessContextType {
  businesses: Business[];
  categories: CategoryMeta[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onlyOffers: boolean;
  setOnlyOffers: (val: boolean) => void;
  onlyVerified: boolean;
  setOnlyVerified: (val: boolean) => void;
  filteredBusinesses: Business[];
  offersCount: number;
  isLoading: boolean;
  isLiveBackend: boolean;
  refreshBusinesses: () => Promise<void>;
  registerBusiness: (businessData: Omit<Business, 'id'>) => Promise<Business>;
  updateBusiness: (id: string, updates: Partial<Business>) => void;
  deleteBusiness: (id: string) => void;
  submitReview: (businessId: string, rating: number, comment: string) => Promise<boolean>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [businesses, setBusinesses] = useState<Business[]>(() => {
    const saved = localStorage.getItem('lpb_businesses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return INITIAL_BUSINESSES;
  });

  const [categories, setCategories] = useState<CategoryMeta[]>(CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyOffers, setOnlyOffers] = useState<boolean>(false);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lpb_businesses', JSON.stringify(businesses));
    } catch {
      // ignore
    }
  }, [businesses]);

  // Fetch live businesses and categories from backend on mount
  const refreshBusinesses = useCallback(async () => {
    setIsLoading(true);
    try {
      const [bizResult, catResult] = await Promise.all([
        businessApi.getBusinesses({
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          query: searchQuery.trim() || undefined,
        }),
        businessApi.getCategories(),
      ]);

      setIsLiveBackend(bizResult.isLive);

      if (catResult.categories && catResult.categories.length > 0) {
        setCategories(catResult.categories);
      }

      if (bizResult.businesses && bizResult.businesses.length > 0) {
        // Merge any locally registered businesses with live backend records
        setBusinesses((prev) => {
          const locallyCreated = prev.filter((b) => b.isCustomCreated);
          const liveIds = new Set(bizResult.businesses.map((b) => b.id));
          const localOnly = locallyCreated.filter((b) => !liveIds.has(b.id));
          return [...localOnly, ...bizResult.businesses];
        });
      }
    } catch (err) {
      console.warn('Backend business refresh failed, keeping cached/local data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    refreshBusinesses();
  }, []);

  const registerBusiness = async (data: Omit<Business, 'id'>): Promise<Business> => {
    const result = await businessApi.registerBusiness({
      companyName: data.name,
      ownerName: data.ownerName || 'Verified Owner',
      category: data.category,
      description: data.description,
      phone: data.phone,
      email: data.email,
      website: data.website,
      address: data.address,
      city: data.city,
      state: data.state,
      offers: data.offers,
      image: data.image,
    });

    const newBiz: Business = {
      ...result.business,
      verified: true,
      status: 'APPROVED',
      isCustomCreated: true,
      rating: 5.0,
      reviewCount: 1,
    };

    setBusinesses((prev) => [newBiz, ...prev.filter((b) => b.id !== newBiz.id)]);
    return newBiz;
  };

  const updateBusiness = (id: string, updates: Partial<Business>) => {
    setBusinesses((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const deleteBusiness = (id: string) => {
    setBusinesses((prev) => prev.filter((b) => b.id !== id));
  };

  const submitReview = async (businessId: string, rating: number, comment: string): Promise<boolean> => {
    const success = await businessApi.submitReview(businessId, rating, comment);
    // Optimistically update rating locally
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id === businessId) {
          const currentCount = b.reviewCount || 1;
          const currentRating = b.rating || 5;
          const newAvg = parseFloat(((currentRating * currentCount + rating) / (currentCount + 1)).toFixed(1));
          return {
            ...b,
            rating: newAvg,
            reviewCount: currentCount + 1,
          };
        }
        return b;
      })
    );
    return success;
  };

  const offersCount = useMemo(() => {
    return businesses.reduce((acc, curr) => acc + (curr.offers?.length || 0), 0);
  }, [businesses]);

  const filteredBusinesses = useMemo(() => {
    return businesses
      .filter((b) => {
        if (selectedCategory && selectedCategory !== 'All') {
          return b.category.toLowerCase() === selectedCategory.toLowerCase();
        }
        return true;
      })
      .filter((b) => {
        if (onlyOffers) return b.offers && b.offers.length > 0;
        return true;
      })
      .filter((b) => {
        if (onlyVerified) return b.verified;
        return true;
      })
      .filter((b) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          b.name.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.city.toLowerCase().includes(q) ||
          (b.description && b.description.toLowerCase().includes(q)) ||
          b.phone.includes(q)
        );
      });
  }, [businesses, selectedCategory, onlyOffers, onlyVerified, searchQuery]);

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        categories,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        onlyOffers,
        setOnlyOffers,
        onlyVerified,
        setOnlyVerified,
        filteredBusinesses,
        offersCount,
        isLoading,
        isLiveBackend,
        refreshBusinesses,
        registerBusiness,
        updateBusiness,
        deleteBusiness,
        submitReview,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusinesses = () => {
  const context = useContext(BusinessContext);
  if (!context) throw new Error('useBusinesses must be used within BusinessProvider');
  return context;
};
