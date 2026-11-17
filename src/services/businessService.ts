import {
  Business,
  BusinessCategory,
  BusinessSection,
} from '../types/business';
import { apiClient, UploadFileInput } from './api/apiClient';
import {
  BackendNotificationItem,
  BusinessMediaItem,
  BusinessProductItem,
  BusinessPromotionItem,
  BusinessServiceItem,
  BusinessSocialLinkItem,
  RawBackendBusiness,
} from './api/apiTypes';
import { transformBackendBusiness } from './api/businessAdapter';
import { StorageService } from './storageService';

export interface BusinessFilterOptions {
  query?: string;
  category?: BusinessCategory;
  onlyBesties?: boolean;
}

export interface RegisterBusinessInput {
  companyName: string;
  category: string;
  phone: string;
  email?: string;
  ownerName?: string;
  address: string;
  city: string;
  state?: string;
  description: string;
  openingHours?: string;
  website?: string;
  imageUri?: string;
  offers?: string[];
}

const normalizeWebsite = (raw?: string): string | undefined => {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export class BusinessService {
  private static async hasRemoteSession(): Promise<boolean> {
    const token = await apiClient.getAccessToken();
    return Boolean(token && !token.startsWith('local-session-'));
  }

  /**
   * Fetch backend category names (GET /categories)
   */
  static async getCategories(): Promise<string[]> {
    try {
      const items = await apiClient.getCategories({ timeoutMs: 10000 });
      if (Array.isArray(items) && items.length > 0) {
        return items
          .map((item) => item?.name?.trim())
          .filter((name): name is string => Boolean(name));
      }
    } catch (err) {
      console.warn('Backend categories fetch failed:', err);
    }
    return [];
  }

  /**
   * Fetch approved public businesses merged with user's locally saved registrations
   */
  static async getBusinesses(): Promise<Business[]> {
    const localBusinesses: Business[] =
      await StorageService.getRegisteredBusinesses();
    let backendBusinesses: Business[] = [];

    try {
      const response = await apiClient.getBusinesses({ limit: 100 });

      if (response && Array.isArray(response.items)) {
        backendBusinesses = response.items.map(transformBackendBusiness);
      }
    } catch (err) {
      console.warn('Backend API fetch failed:', err);
    }

    // Keep cached entries synchronized if they now exist in the live directory
    const liveById = new Map(backendBusinesses.map((b) => [b.id, b]));
    const syncedLocal = localBusinesses.map((local) => {
      const liveMatch = liveById.get(local.id);
      if (liveMatch) {
        return {
          ...local,
          ...liveMatch,
          image: liveMatch.image || local.image,
          openingHours: liveMatch.openingHours || local.openingHours,
        };
      }
      return local;
    });

    if (backendBusinesses.length > 0 && localBusinesses.length > 0) {
      await StorageService.saveRegisteredBusinesses(syncedLocal);
    }

    const seenIds = new Set(syncedLocal.map((b) => b.id));
    return [
      ...syncedLocal,
      ...backendBusinesses.filter((b) => !seenIds.has(b.id)),
    ];
  }

  /**
   * Search live directory via GET /search/businesses with local fallback
   */
  static async searchBusinesses(params: {
    q?: string;
    category?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<Business[]> {
    try {
      const response = await apiClient.searchBusinesses({
        ...params,
        limit: params.limit || 50,
      });
      if (response && Array.isArray(response.items)) {
        return response.items.map(transformBackendBusiness);
      }
    } catch (err) {
      console.warn('Backend searchBusinesses failed, using local filter:', err);
    }

    const all = await this.getBusinesses();
    return this.filterBusinesses(all, {
      query: params.q,
      category: params.category || 'All',
    });
  }

  /**
   * Fetch businesses owned by the signed-in user (GET /businesses/me)
   * merged with offline local registrations.
   */
  static async getMyBusinesses(): Promise<Business[]> {
    const localBusinesses = await StorageService.getRegisteredBusinesses();
    const isRemote = await this.hasRemoteSession();

    if (!isRemote) {
      return localBusinesses;
    }

    try {
      const raw = await apiClient.getMyBusinesses({ timeoutMs: 10000 });
      const rawList: RawBackendBusiness[] = Array.isArray(raw)
        ? raw
        : raw && (raw as RawBackendBusiness).id
          ? [raw as RawBackendBusiness]
          : [];

      const remoteMy = rawList.map(transformBackendBusiness);
      const remoteIds = new Set(remoteMy.map((b) => b.id));
      const localOnly = localBusinesses.filter(
        (b) =>
          b.id.startsWith('biz-local-') || (!b.isLiveBackend && !remoteIds.has(b.id))
      );

      const merged = [...remoteMy, ...localOnly];
      await StorageService.saveRegisteredBusinesses(merged);
      return merged;
    } catch (err: any) {
      // 404 simply means the user has no business created on the backend yet
      if (err?.isHttpError && err.status === 404) {
        return localBusinesses.filter((b) => b.id.startsWith('biz-local-'));
      }
      console.warn('Backend /businesses/me fetch failed:', err);
      return localBusinesses;
    }
  }

  /**
   * Register a new business:
   * POST /businesses -> optional POST /businesses/:id/media (LOGO) -> POST /businesses/:id/submit
   * Safely falls back to local persistence when offline or running local auth session.
   */
  static async registerBusiness(input: RegisterBusinessInput): Promise<Business> {
    let createdFromBackend: Business | null = null;
    const isRemote = await this.hasRemoteSession();

    if (isRemote) {
      try {
        const payload = {
          companyName: input.companyName.trim(),
          category: input.category,
          phone: input.phone.trim(),
          email: input.email?.trim() || undefined,
          ownerName: input.ownerName?.trim() || undefined,
          address: input.address.trim(),
          city: input.city.trim(),
          state: input.state?.trim() || undefined,
          description: input.description.trim(),
          website: normalizeWebsite(input.website),
        };

        const raw: any = await apiClient.createBusiness(payload, {
          timeoutMs: 12000,
        });

        let entity = raw?.data || raw;
        let uploadedLogoUrl: string | undefined;

        if (entity && entity.id) {
          // Upload selected logo if user picked a mobile image
          if (input.imageUri && !input.imageUri.startsWith('http')) {
            try {
              const media = await apiClient.uploadBusinessMedia(
                entity.id,
                { uri: input.imageUri },
                'LOGO'
              );
              if (media?.url) {
                uploadedLogoUrl = media.url;
              }
            } catch (uploadErr) {
              console.warn('Logo upload skipped/failed:', uploadErr);
            }
          }

          // Move newly created DRAFT business into review queue (PENDING)
          try {
            const submitted = await apiClient.submitBusiness(entity.id, {
              timeoutMs: 10000,
            });
            if (submitted && submitted.id) {
              entity = submitted;
            }
          } catch (submitErr) {
            console.warn('Business submit step skipped/failed (stays DRAFT):', submitErr);
          }

          createdFromBackend = transformBackendBusiness(entity);
          if (uploadedLogoUrl) {
            createdFromBackend.image = uploadedLogoUrl;
          }

          // Register promotions if any offers were provided
          if (input.offers && input.offers.length > 0) {
            for (const offerTitle of input.offers) {
              try {
                await apiClient.createPromotion(entity.id, {
                  title: offerTitle.trim(),
                  description: `Special Offer: ${offerTitle.trim()}`,
                });
              } catch (promoErr) {
                console.warn('Backend promo create skipped:', promoErr);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Backend business register unavailable, saving locally:', err);
      }
    }

    const offersList = input.offers && input.offers.length > 0 ? input.offers : [];
    const generatedPromotions = offersList.map((title, idx) => ({
      id: `promo-local-${Date.now()}-${idx}`,
      title,
      description: `Special Deal: ${title}`,
      status: 'APPROVED',
    }));

    const newBusiness: Business = createdFromBackend
      ? {
          ...createdFromBackend,
          image: createdFromBackend.image || input.imageUri || '',
          openingHours:
            input.openingHours?.trim() || createdFromBackend.openingHours,
          ownerName: input.ownerName?.trim() || createdFromBackend.ownerName,
          offers: offersList.length > 0 ? offersList : (createdFromBackend.offers || []),
          promotions:
            generatedPromotions.length > 0
              ? generatedPromotions
              : createdFromBackend.promotions,
        }
      : {
          id: `biz-local-${Date.now()}`,
          name: input.companyName.trim(),
          category: input.category || 'Other',
          phone: input.phone.trim(),
          email: input.email?.trim() || undefined,
          ownerName: input.ownerName?.trim() || undefined,
          address: input.address.trim(),
          city: input.city.trim(),
          state: input.state?.trim() || undefined,
          description: input.description.trim(),
          website: normalizeWebsite(input.website),
          openingHours: input.openingHours?.trim() || '9:00 AM - 8:00 PM',
          image: input.imageUri || '',
          latitude: 26.9124,
          longitude: 75.7873,
          isBestie: false,
          rating: 5.0,
          reviewCount: 1,
          verified: false,
          status: 'PENDING',
          isLiveBackend: false,
          offers: offersList,
          promotions: generatedPromotions,
        };

    const existingLocal = await StorageService.getRegisteredBusinesses();
    const filteredExisting = existingLocal.filter((b) => b.id !== newBusiness.id);
    const updatedLocal = [newBusiness, ...filteredExisting];
    await StorageService.saveRegisteredBusinesses(updatedLocal);

    return newBusiness;
  }

  /**
   * Update an existing business (PATCH /businesses/:id + optional logo upload)
   */
  static async updateBusiness(
    id: string,
    input: Partial<RegisterBusinessInput>
  ): Promise<Business | null> {
    const existingLocal = await StorageService.getRegisteredBusinesses();
    const localTarget = existingLocal.find((b) => b.id === id) || null;
    const isRemote = (await this.hasRemoteSession()) && !id.startsWith('biz-local-');

    let updated: Business | null = null;

    if (isRemote) {
      const payload: Record<string, any> = {};
      if (input.companyName !== undefined) payload.companyName = input.companyName.trim();
      if (input.category !== undefined) payload.category = input.category;
      if (input.phone !== undefined) payload.phone = input.phone.trim();
      if (input.email !== undefined) payload.email = input.email.trim() || undefined;
      if (input.ownerName !== undefined) payload.ownerName = input.ownerName.trim() || undefined;
      if (input.address !== undefined) payload.address = input.address.trim();
      if (input.city !== undefined) payload.city = input.city.trim();
      if (input.state !== undefined) payload.state = input.state.trim() || undefined;
      if (input.description !== undefined) payload.description = input.description.trim();
      if (input.website !== undefined) payload.website = normalizeWebsite(input.website);

      const raw = await apiClient.updateBusiness(id, payload);
      let uploadedLogoUrl: string | undefined;

      if (input.imageUri && !input.imageUri.startsWith('http')) {
        try {
          const media = await apiClient.uploadBusinessMedia(
            id,
            { uri: input.imageUri },
            'LOGO'
          );
          uploadedLogoUrl = media?.url;
        } catch (err) {
          console.warn('Updated logo upload failed:', err);
        }
      }

      if (raw && raw.id) {
        updated = transformBackendBusiness(raw);
        if (uploadedLogoUrl) updated.image = uploadedLogoUrl;
        else if (!updated.image && input.imageUri) updated.image = input.imageUri;
        if (input.openingHours) updated.openingHours = input.openingHours.trim();
        if (input.offers !== undefined) {
          updated.offers = input.offers;
          updated.promotions = input.offers.map((title, idx) => ({
            id: `promo-${Date.now()}-${idx}`,
            title,
            description: `Special Deal: ${title}`,
            status: 'APPROVED',
          }));
        }
      }
    } else if (localTarget) {
      updated = {
        ...localTarget,
        ...(input.companyName !== undefined ? { name: input.companyName.trim() } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}),
        ...(input.email !== undefined ? { email: input.email.trim() || undefined } : {}),
        ...(input.ownerName !== undefined ? { ownerName: input.ownerName.trim() || undefined } : {}),
        ...(input.address !== undefined ? { address: input.address.trim() } : {}),
        ...(input.city !== undefined ? { city: input.city.trim() } : {}),
        ...(input.state !== undefined ? { state: input.state.trim() || undefined } : {}),
        ...(input.description !== undefined ? { description: input.description.trim() } : {}),
        ...(input.website !== undefined ? { website: normalizeWebsite(input.website) } : {}),
        ...(input.openingHours !== undefined ? { openingHours: input.openingHours.trim() } : {}),
        ...(input.imageUri !== undefined ? { image: input.imageUri } : {}),
        ...(input.offers !== undefined
          ? {
              offers: input.offers,
              promotions: input.offers.map((title, idx) => ({
                id: `promo-local-${Date.now()}-${idx}`,
                title,
                description: `Special Deal: ${title}`,
                status: 'APPROVED',
              })),
            }
          : {}),
      };
    }

    if (updated) {
      const nextLocal = existingLocal.some((b) => b.id === id)
        ? existingLocal.map((b) => (b.id === id ? updated! : b))
        : [updated, ...existingLocal];
      await StorageService.saveRegisteredBusinesses(nextLocal);
    }

    return updated;
  }

  /**
   * Submit a DRAFT business for admin review (POST /businesses/:id/submit)
   */
  static async submitBusiness(id: string): Promise<Business | null> {
    const raw = await apiClient.submitBusiness(id);
    if (!raw || !raw.id) return null;

    const transformed = transformBackendBusiness(raw);
    const existingLocal = await StorageService.getRegisteredBusinesses();
    const nextLocal = existingLocal.map((b) =>
      b.id === id ? { ...b, ...transformed } : b
    );
    await StorageService.saveRegisteredBusinesses(nextLocal);
    return transformed;
  }

  /**
   * Delete a business owned by user (DELETE /businesses/:id)
   */
  static async deleteBusiness(id: string): Promise<void> {
    const isRemote = (await this.hasRemoteSession()) && !id.startsWith('biz-local-');
    if (isRemote) {
      await apiClient.deleteBusiness(id);
    }
    const existingLocal = await StorageService.getRegisteredBusinesses();
    await StorageService.saveRegisteredBusinesses(
      existingLocal.filter((b) => b.id !== id)
    );
  }

  /**
   * Fetch single business with fresh details (media, socialLinks, services, products, promotions)
   */
  static async getBusinessDetails(id: string): Promise<Business | null> {
    if (!id || id.startsWith('biz-local-')) {
      return null;
    }
    try {
      const [raw, promotions] = await Promise.all([
        apiClient.getBusinessById(id),
        apiClient.getPromotions(id).catch(() => [] as BusinessPromotionItem[]),
      ]);
      if (raw && raw.id) {
        const mergedRaw: RawBackendBusiness = {
          ...raw,
          promotions:
            raw.promotions && raw.promotions.length > 0
              ? raw.promotions
              : promotions,
        };
        return transformBackendBusiness(mergedRaw);
      }
    } catch (err) {
      console.warn(`Failed to fetch live business details for ${id}:`, err);
    }
    return null;
  }

  // --- Owner Extensions (Media, Socials, Services, Products, Promotions, Notifications) ---

  static async uploadBusinessMedia(
    businessId: string,
    file: UploadFileInput,
    type: 'LOGO' | 'GALLERY' | 'COVER' = 'GALLERY'
  ): Promise<BusinessMediaItem> {
    return apiClient.uploadBusinessMedia(businessId, file, type);
  }

  static async deleteBusinessMedia(
    businessId: string,
    mediaId: string
  ): Promise<void> {
    await apiClient.deleteBusinessMedia(businessId, mediaId);
  }

  static async updateSocialLinks(
    businessId: string,
    links: Array<{ platform: string; url: string }>
  ): Promise<BusinessSocialLinkItem[]> {
    return apiClient.updateSocialLinks(businessId, links);
  }

  static async createService(
    businessId: string,
    payload: { name: string; description?: string; price?: string }
  ): Promise<BusinessServiceItem> {
    return apiClient.createService(businessId, payload);
  }

  static async updateService(
    serviceId: string,
    payload: { name?: string; description?: string; price?: string }
  ): Promise<BusinessServiceItem> {
    return apiClient.updateService(serviceId, payload);
  }

  static async deleteService(serviceId: string): Promise<void> {
    await apiClient.deleteService(serviceId);
  }

  static async createProduct(
    businessId: string,
    payload: {
      name: string;
      description?: string;
      price?: string;
      imageUrl?: string | null;
    }
  ): Promise<BusinessProductItem> {
    return apiClient.createProduct(businessId, payload);
  }

  static async updateProduct(
    productId: string,
    payload: {
      name?: string;
      description?: string;
      price?: string;
      imageUrl?: string | null;
    }
  ): Promise<BusinessProductItem> {
    return apiClient.updateProduct(productId, payload);
  }

  static async deleteProduct(productId: string): Promise<void> {
    await apiClient.deleteProduct(productId);
  }

  static async createPromotion(
    businessId: string,
    payload: {
      title: string;
      description?: string;
      startDate?: string | null;
      endDate?: string | null;
    }
  ): Promise<BusinessPromotionItem> {
    return apiClient.createPromotion(businessId, payload);
  }

  static async updatePromotion(
    promotionId: string,
    payload: {
      title?: string;
      description?: string;
      startDate?: string | null;
      endDate?: string | null;
    }
  ): Promise<BusinessPromotionItem> {
    return apiClient.updatePromotion(promotionId, payload);
  }

  static async deletePromotion(promotionId: string): Promise<void> {
    await apiClient.deletePromotion(promotionId);
  }

  static async getNotifications(): Promise<BackendNotificationItem[]> {
    const isRemote = await this.hasRemoteSession();
    if (!isRemote) {
      return [];
    }
    try {
      const items = await apiClient.getNotifications({ timeoutMs: 10000 });
      return Array.isArray(items) ? items : [];
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
      return [];
    }
  }

  static async markNotificationRead(
    id: string
  ): Promise<BackendNotificationItem | null> {
    try {
      return await apiClient.markNotificationRead(id);
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
      return null;
    }
  }

  static async markAllNotificationsRead(): Promise<void> {
    try {
      await apiClient.markAllNotificationsRead();
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err);
    }
  }

  /**
   * Filter and search businesses by text and category
   */
  static filterBusinesses(
    businesses: Business[],
    options: BusinessFilterOptions
  ): Business[] {
    const { query = '', category = 'All', onlyBesties = false } = options;
    const cleanQuery = query.trim().toLowerCase();

    return businesses.filter((b) => {
      if (onlyBesties && !b.isBestie) {
        return false;
      }

      if (category !== 'All' && b.category !== category) {
        return false;
      }

      if (cleanQuery.length > 0) {
        const matchesName = b.name.toLowerCase().includes(cleanQuery);
        const matchesCategory = b.category.toLowerCase().includes(cleanQuery);
        const matchesCity = b.city.toLowerCase().includes(cleanQuery);
        const matchesAddress = b.address.toLowerCase().includes(cleanQuery);
        const matchesPhone = b.phone.toLowerCase().includes(cleanQuery);
        const matchesDesc = b.description.toLowerCase().includes(cleanQuery);

        return (
          matchesName ||
          matchesCategory ||
          matchesCity ||
          matchesAddress ||
          matchesPhone ||
          matchesDesc
        );
      }

      return true;
    });
  }

  /**
   * Sorts businesses alphabetically by name
   */
  static sortAlphabetically(businesses: Business[]): Business[] {
    return [...businesses].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }

  /**
   * Groups businesses into A-Z sections for SectionList
   */
  static groupIntoSections(businesses: Business[]): BusinessSection[] {
    const sorted = this.sortAlphabetically(businesses);
    const groups: Record<string, Business[]> = {};

    sorted.forEach((item) => {
      const firstChar = item.name.trim().charAt(0).toUpperCase();
      const sectionKey = /^[A-Z]$/.test(firstChar) ? firstChar : '#';

      if (!groups[sectionKey]) {
        groups[sectionKey] = [];
      }
      groups[sectionKey].push(item);
    });

    const letters = Object.keys(groups).sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    });

    return letters.map((letter) => ({
      title: letter,
      data: groups[letter],
    }));
  }
}
