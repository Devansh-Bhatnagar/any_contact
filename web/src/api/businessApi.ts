/**
 * Business & Deals API Service for Leads Phone Book Web App
 * Integrates with server endpoints:
 * - GET /api/categories
 * - GET /api/businesses & GET /api/search/businesses
 * - GET /api/business-contacts/nearby & GET /api/business-contacts/offers/active
 * - POST /api/businesses & POST /api/phonebook/leads
 * - GET /api/business-contacts/:id & POST /api/business-contacts/:id/reviews
 */
import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';
import { Business, BusinessSocialLinks } from '../types/business';
import { INITIAL_BUSINESSES } from '../data/mockBusinesses';
import { CATEGORIES, CategoryMeta } from '../data/categories';

// High-resolution photography mapping for categories
const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  Restaurants: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  Cafes: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
  Hotels: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
  Hospitals: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
  Grocery: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
  Shopping: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
  Electronics: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80',
  'Mobile Stores': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
  Salons: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
  Gyms: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  Banks: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=800&q=80',
  'Real Estate': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
  Automobile: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&q=80',
  Mechanics: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80',
  Education: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80',
  Travel: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
  'Technology & SaaS': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
  'Professional Services': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
  'Healthcare & Wellness': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80';

export interface RegisterBusinessPayload {
  companyName: string;
  ownerName: string;
  category: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  offers?: string[];
  image?: string;
}

export function transformRawBackendBusiness(raw: any): Business {
  // Extract primary image
  let imageUri = '';
  if (raw.media && Array.isArray(raw.media) && raw.media.length > 0) {
    const logo = raw.media.find((m: any) => m.type === 'LOGO');
    imageUri = logo ? logo.url : raw.media[0].url;
  }
  if (!imageUri && raw.image) {
    imageUri = raw.image;
  }
  if (!imageUri) {
    imageUri = CATEGORY_FALLBACK_IMAGES[raw.category] || DEFAULT_IMAGE;
  }

  // Extract offers from specialOffers, promotions, or status stories
  const offersList: string[] = [];
  if (Array.isArray(raw.specialOffers)) {
    raw.specialOffers.forEach((o: any) => {
      if (o.title) offersList.push(o.title);
      else if (o.offerBadge) offersList.push(o.offerBadge);
    });
  }
  if (Array.isArray(raw.promotions)) {
    raw.promotions.forEach((p: any) => {
      if (p.title && !offersList.includes(p.title)) offersList.push(p.title);
    });
  }
  if (Array.isArray(raw.offers)) {
    raw.offers.forEach((off: string) => {
      if (off && !offersList.includes(off)) offersList.push(off);
    });
  }
  if (raw.activeStory?.offerBadge && !offersList.includes(raw.activeStory.offerBadge)) {
    offersList.push(raw.activeStory.offerBadge);
  }

  // Social links map
  const socials: BusinessSocialLinks = {};
  if (Array.isArray(raw.socialLinks)) {
    raw.socialLinks.forEach((l: any) => {
      const plat = (l.platform || '').toLowerCase();
      if (plat.includes('facebook')) socials.facebook = l.url;
      if (plat.includes('instagram')) socials.instagram = l.url;
      if (plat.includes('linkedin')) socials.linkedin = l.url;
      if (plat.includes('twitter')) socials.twitter = l.url;
      if (plat.includes('youtube')) socials.youtube = l.url;
    });
  }

  // Operating hours
  let openingHours = '09:00 AM - 08:00 PM';
  if (raw.openStatus?.text) {
    openingHours = raw.openStatus.text;
  } else if (typeof raw.workingHours === 'string') {
    openingHours = raw.workingHours;
  } else if (Array.isArray(raw.workingHours) && raw.workingHours.length > 0) {
    const openDay = raw.workingHours.find((h: any) => !h.closed && h.open && h.close);
    if (openDay) openingHours = `${openDay.day}: ${openDay.open} - ${openDay.close}`;
  }

  return {
    id: String(raw.id),
    name: raw.companyName || raw.name || 'Business Partner',
    category: raw.category || 'Other',
    phone: raw.phone || raw.maskedPhone || '+91 98765 43210',
    address: raw.address || 'Central Commercial Hub',
    city: raw.city || 'India',
    state: raw.state || undefined,
    description:
      raw.description ||
      raw.statusLine ||
      `${raw.companyName || 'Business'} is an approved and verified partner on Leads Phone Book.`,
    image: imageUri,
    galleryImages: Array.isArray(raw.media)
      ? raw.media.map((m: any) => m.url).filter(Boolean)
      : undefined,
    isBestie: Boolean(raw.isFavorite || raw.isBestie),
    rating: typeof raw.rating === 'number' && raw.rating > 0 ? raw.rating : 4.8,
    reviewCount: typeof raw.reviewCount === 'number' && raw.reviewCount > 0 ? raw.reviewCount : 18,
    openingHours,
    email: raw.email || undefined,
    website: raw.website || undefined,
    tagline: raw.statusLine || (raw.ownerName ? `Owner: ${raw.ownerName}` : 'Verified Partner'),
    socials,
    ownerName: raw.ownerName || undefined,
    verified: raw.verified ?? true,
    status: raw.status || 'APPROVED',
    offers: offersList,
    isCustomCreated: Boolean(raw.isCustomCreated),
  };
}

export const businessApi = {
  /**
   * Fetch approved businesses from live backend:
   * 1. Try GET /api/business-contacts/nearby
   * 2. Fallback to GET /api/businesses
   * 3. Fallback to GET /api/phonebook/bootstrap
   * 4. Offline fallback to local storage / mock data
   */
  async getBusinesses(params?: { category?: string; query?: string }): Promise<{
    businesses: Business[];
    isLive: boolean;
  }> {
    // 1. Try /api/business-contacts/nearby (rich customer discovery endpoint)
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.BUSINESS_CONTACTS_NEARBY, {
        category: params?.category && params.category !== 'All' ? params.category : undefined,
      });

      if (res && Array.isArray(res.flatList) && res.flatList.length > 0) {
        const businesses = res.flatList.map(transformRawBackendBusiness);
        return { businesses, isLive: true };
      }
    } catch (err) {
      console.warn('Nearby businesses endpoint failed, trying /businesses:', err);
    }

    // 2. Try GET /api/businesses (directory search)
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.BUSINESSES, {
        category: params?.category && params.category !== 'All' ? params.category : undefined,
        q: params?.query || undefined,
        limit: 100,
      });

      if (res && Array.isArray(res.items) && res.items.length > 0) {
        const businesses = res.items.map(transformRawBackendBusiness);
        return { businesses, isLive: true };
      }
    } catch (err) {
      console.warn('Businesses endpoint failed, trying /phonebook/bootstrap:', err);
    }

    // 3. Try SDUI bootstrap endpoint
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.PHONEBOOK_BOOTSTRAP);
      if (res && Array.isArray(res.contacts) && res.contacts.length > 0) {
        const businesses = res.contacts.map(transformRawBackendBusiness);
        return { businesses, isLive: true };
      }
    } catch (err) {
      console.warn('Bootstrap endpoint failed, falling back to local data:', err);
    }

    // 4. Return initial businesses as graceful offline fallback
    return { businesses: INITIAL_BUSINESSES, isLive: false };
  },

  /**
   * Fetch categories from live backend: GET /api/categories
   */
  async getCategories(): Promise<{ categories: CategoryMeta[]; isLive: boolean }> {
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.CATEGORIES);
      if (Array.isArray(res) && res.length > 0) {
        // Map backend category names to CategoryMeta
        const liveCats: CategoryMeta[] = [
          { name: 'All', iconName: 'Grid', color: '#1E60F2', bgLight: '#EBF2FE', bgDark: 'rgba(30, 96, 242, 0.2)' },
          ...res.map((cat: any) => {
            const name = typeof cat === 'string' ? cat : cat.name;
            const existing = CATEGORIES.find((c) => c.name.toLowerCase() === name.toLowerCase());
            return (
              existing || {
                name,
                iconName: 'Building2',
                color: '#3B82F6',
                bgLight: '#EFF6FF',
                bgDark: 'rgba(59, 130, 246, 0.2)',
              }
            );
          }),
        ];
        return { categories: liveCats, isLive: true };
      }
    } catch (err) {
      console.warn('Failed to fetch backend categories, using presets:', err);
    }

    return { categories: CATEGORIES, isLive: false };
  },

  /**
   * Fetch active highlighted special offers: GET /api/business-contacts/offers/active
   */
  async getActiveSpecialOffers(): Promise<any[]> {
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.BUSINESS_CONTACTS_OFFERS_ACTIVE);
      if (res && Array.isArray(res)) return res;
      if (res && Array.isArray(res.offers)) return res.offers;
      if (res && Array.isArray(res.results)) return res.results;
    } catch (err) {
      console.warn('Failed to fetch active special offers:', err);
    }
    return [];
  },

  /**
   * Register a new business:
   * First tries POST /api/businesses with user session or guest profile,
   * falls back to POST /api/phonebook/leads.
   */
  async registerBusiness(payload: RegisterBusinessPayload): Promise<{
    business: Business;
    isLive: boolean;
  }> {
    // Attempt live backend registration
    try {
      const createRes = await apiClient.post<any>(API_ENDPOINTS.BUSINESSES, {
        companyName: payload.companyName,
        ownerName: payload.ownerName,
        category: payload.category,
        description: payload.description,
        phone: payload.phone,
        email: payload.email,
        website: payload.website,
        address: payload.address,
        city: payload.city,
        state: payload.state,
      });

      if (createRes && createRes.id) {
        return {
          business: transformRawBackendBusiness({
            ...createRes,
            offers: payload.offers,
            image: payload.image,
            isCustomCreated: true,
          }),
          isLive: true,
        };
      }
    } catch (err) {
      console.warn('POST /businesses failed (may require auth), creating lead:', err);
    }

    // Try creating via leads pipeline
    try {
      const leadRes = await apiClient.post<any>(API_ENDPOINTS.PHONEBOOK_LEADS, {
        businessName: payload.companyName,
        contactPerson: payload.ownerName,
        phone: payload.phone || '+91 98765 43210',
        email: payload.email || undefined,
        category: payload.category,
        city: payload.city,
        stageCode: 'HOT',
        note: payload.description,
      });

      if (leadRes && leadRes.id) {
        return {
          business: transformRawBackendBusiness({
            id: leadRes.id,
            companyName: payload.companyName,
            ownerName: payload.ownerName,
            category: payload.category,
            phone: payload.phone,
            city: payload.city,
            address: payload.address,
            description: payload.description,
            offers: payload.offers,
            image: payload.image,
            isCustomCreated: true,
          }),
          isLive: true,
        };
      }
    } catch (err) {
      console.warn('POST /phonebook/leads also failed, saving locally:', err);
    }

    // Local registered business format
    const localBiz: Business = {
      id: `live-biz-${Date.now()}`,
      name: payload.companyName,
      ownerName: payload.ownerName,
      category: payload.category,
      phone: payload.phone || '+91 98765 43210',
      email: payload.email,
      website: payload.website,
      address: payload.address || 'Central Commercial Hub',
      city: payload.city || 'India',
      description: payload.description || `${payload.companyName} is registered on Leads Phone Book.`,
      image: payload.image || CATEGORY_FALLBACK_IMAGES[payload.category] || DEFAULT_IMAGE,
      isBestie: false,
      rating: 5.0,
      reviewCount: 1,
      openingHours: '09:00 AM - 08:00 PM',
      verified: true,
      status: 'APPROVED',
      offers: payload.offers || [],
      isCustomCreated: true,
    };

    return { business: localBiz, isLive: false };
  },

  /**
   * Submit customer review: POST /api/business-contacts/:id/reviews
   */
  async submitReview(businessId: string, rating: number, comment: string): Promise<boolean> {
    try {
      await apiClient.post(API_ENDPOINTS.BUSINESS_CONTACTS_REVIEWS(businessId), {
        rating,
        comment,
      });
      return true;
    } catch (err) {
      console.warn('Failed to submit review to backend:', err);
      return false;
    }
  },
};
