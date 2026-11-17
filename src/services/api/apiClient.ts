import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  API_BASE_URL,
  API_ENDPOINTS,
  API_FALLBACK_URL,
  API_ROOT_URL,
} from './apiConfig';
import {
  BackendAuthResponse,
  BackendCategoryItem,
  BackendHealthResponse,
  BackendNotificationItem,
  BackendPaginatedResponse,
  BackendUploadResponse,
  BusinessMediaItem,
  BusinessProductItem,
  BusinessPromotionItem,
  BusinessServiceItem,
  BusinessSocialLinkItem,
  RawBackendBusiness,
} from './apiTypes';

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@contact_app_access_token',
  REFRESH_TOKEN: '@contact_app_refresh_token',
  USER_DATA: '@contact_app_auth_user',
};

const REQUEST_TIMEOUT_MS = 20000;

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
  skipFallback?: boolean;
  skipAuthRefresh?: boolean;
  customBaseUrl?: string;
}

export interface UploadFileInput {
  uri: string;
  name?: string;
  type?: string;
}

class ApiClient {
  private baseUrl: string = API_BASE_URL;
  private fallbackUrl: string = API_FALLBACK_URL;
  private refreshPromise: Promise<boolean> | null = null;

  /**
   * Perform fetch requests with timeout, multipart support, and automatic JWT refresh
   */
  private async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const {
      timeoutMs = REQUEST_TIMEOUT_MS,
      skipFallback = false,
      skipAuthRefresh = false,
      customBaseUrl,
      ...fetchOptions
    } = options;

    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const isFormData =
      typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;
    const isRemoteToken = Boolean(token && !token.startsWith('local-session-'));

    const headers: Record<string, string> = {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      Accept: 'application/json',
      ...(isRemoteToken ? { Authorization: `Bearer ${token}` } : {}),
      ...(fetchOptions.headers as Record<string, string>),
    };

    const executeFetch = async (hostBase: string): Promise<T> => {
      const url = endpoint.startsWith('http')
        ? endpoint
        : `${hostBase}${endpoint}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 204) {
          return null as unknown as T;
        }

        const text = await response.text();
        let data: any = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }

        if (!response.ok) {
          let errorMsg =
            (data && typeof data === 'object' && (data.message || data.error)) ||
            `Request failed with status ${response.status}`;

          if (
            data?.details?.fieldErrors &&
            typeof data.details.fieldErrors === 'object'
          ) {
            const fieldMsgs = Object.entries(data.details.fieldErrors)
              .map(([field, msgs]: [string, any]) => {
                const msgText = Array.isArray(msgs)
                  ? msgs.join(', ')
                  : String(msgs);
                return `${field}: ${msgText}`;
              })
              .join('. ');
            if (fieldMsgs) {
              errorMsg = fieldMsgs;
            }
          }

          const httpErr: any = new Error(errorMsg);
          httpErr.status = response.status;
          httpErr.data = data;
          httpErr.isHttpError = true;
          throw httpErr;
        }

        return data as T;
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (
          err?.name === 'AbortError' ||
          err?.message?.toLowerCase().includes('aborted')
        ) {
          const timeoutErr: any = new Error(
            'Connection timed out. Please check your internet connection and try again.'
          );
          timeoutErr.isTimeout = true;
          throw timeoutErr;
        }
        throw err;
      }
    };

    const isAuthMutation =
      endpoint === API_ENDPOINTS.AUTH_LOGIN ||
      endpoint === API_ENDPOINTS.AUTH_REGISTER ||
      endpoint === API_ENDPOINTS.AUTH_REFRESH;

    const runWithFailover = async (): Promise<T> => {
      const targetBase = customBaseUrl || this.baseUrl;
      try {
        return await executeFetch(targetBase);
      } catch (primaryErr: any) {
        if (
          skipFallback ||
          customBaseUrl ||
          primaryErr?.isHttpError ||
          primaryErr?.isTimeout
        ) {
          throw primaryErr;
        }

        if (this.fallbackUrl && this.fallbackUrl !== this.baseUrl) {
          try {
            return await executeFetch(this.fallbackUrl);
          } catch {
            // Throw original error if fallback also unreachable
          }
        }
        throw primaryErr;
      }
    };

    try {
      return await runWithFailover();
    } catch (err: any) {
      // Automatically refresh expired 15-minute access token and retry once
      if (
        err?.isHttpError &&
        err.status === 401 &&
        !skipAuthRefresh &&
        !isAuthMutation &&
        isRemoteToken
      ) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          return this.request<T>(endpoint, {
            ...options,
            skipAuthRefresh: true,
          });
        }
      }
      throw err;
    }
  }

  /**
   * Deduplicated single-flight refresh token exchange
   */
  private async tryRefreshToken(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = await AsyncStorage.getItem(
          STORAGE_KEYS.REFRESH_TOKEN
        );
        if (!refreshToken || refreshToken.startsWith('local-session-')) {
          return false;
        }

        const data = await this.request<{
          accessToken: string;
          refreshToken: string;
        }>(API_ENDPOINTS.AUTH_REFRESH, {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
          skipAuthRefresh: true,
        });

        if (data?.accessToken && data?.refreshToken) {
          await this.setTokens(data.accessToken, data.refreshToken);
          return true;
        }
        return false;
      } catch (err: any) {
        if (err?.isHttpError && (err.status === 401 || err.status === 403)) {
          await this.clearTokens();
        }
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // --- Generic HTTP Methods ---

  private serializeBody(data?: any): RequestInit['body'] | undefined {
    if (data === undefined) {
      return undefined;
    }
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return data;
    }
    return JSON.stringify(data);
  }

  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: this.serializeBody(data),
      ...options,
    });
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: this.serializeBody(data),
      ...options,
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: this.serializeBody(data),
      ...options,
    });
  }

  async delete<T = void>(
    endpoint: string,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  // --- Section 0: Health Check ---

  async checkHealth(): Promise<BackendHealthResponse> {
    return this.request<BackendHealthResponse>(API_ENDPOINTS.HEALTH, {
      method: 'GET',
      customBaseUrl: API_ROOT_URL,
      timeoutMs: 8000,
      skipFallback: true,
    });
  }

  // --- Section 1, 11, 12: Authentication ---

  async login(
    email: string,
    password: string,
    options?: ApiRequestOptions
  ): Promise<BackendAuthResponse> {
    return this.post<BackendAuthResponse>(
      API_ENDPOINTS.AUTH_LOGIN,
      { email, password },
      options
    );
  }

  async register(
    payload: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      role?: string;
    },
    options?: ApiRequestOptions
  ): Promise<BackendAuthResponse> {
    return this.post<BackendAuthResponse>(
      API_ENDPOINTS.AUTH_REGISTER,
      payload,
      options
    );
  }

  async getMe(options?: ApiRequestOptions): Promise<BackendAuthResponse['user']> {
    return this.get<BackendAuthResponse['user']>(API_ENDPOINTS.AUTH_ME, options);
  }

  async refreshTokens(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.post<{ accessToken: string; refreshToken: string }>(
      API_ENDPOINTS.AUTH_REFRESH,
      { refreshToken },
      { skipAuthRefresh: true }
    );
  }

  async forgotPassword(email: string): Promise<void> {
    await this.post<void>(API_ENDPOINTS.AUTH_FORGOT_PASSWORD, { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await this.post<void>(API_ENDPOINTS.AUTH_RESET_PASSWORD, {
      token,
      password,
    });
  }

  async logout(refreshToken?: string | null): Promise<void> {
    await this.post<void>(
      API_ENDPOINTS.AUTH_LOGOUT,
      refreshToken ? { refreshToken } : {},
      { skipAuthRefresh: true, timeoutMs: 5000 }
    );
  }

  // --- Section 2: Categories ---

  async getCategories(
    options?: ApiRequestOptions
  ): Promise<BackendCategoryItem[]> {
    return this.get<BackendCategoryItem[]>(API_ENDPOINTS.CATEGORIES, options);
  }

  // --- Section 3 & 10: Businesses & Search ---

  async getBusinesses(
    params?: { page?: number; limit?: number },
    options?: ApiRequestOptions
  ): Promise<BackendPaginatedResponse<RawBackendBusiness>> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const qs = query.toString();
    const endpoint = `${API_ENDPOINTS.BUSINESSES}${qs ? `?${qs}` : ''}`;
    return this.get<BackendPaginatedResponse<RawBackendBusiness>>(
      endpoint,
      options
    );
  }

  async searchBusinesses(
    params: {
      q?: string;
      category?: string;
      status?: string;
      sort?: string;
      page?: number;
      limit?: number;
    },
    options?: ApiRequestOptions
  ): Promise<BackendPaginatedResponse<RawBackendBusiness>> {
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    if (params.category && params.category !== 'All') {
      query.append('category', params.category);
    }
    if (params.status) query.append('status', params.status);
    if (params.sort) query.append('sort', params.sort);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const qs = query.toString();
    const endpoint = `${API_ENDPOINTS.SEARCH_BUSINESSES}${qs ? `?${qs}` : ''}`;
    return this.get<BackendPaginatedResponse<RawBackendBusiness>>(
      endpoint,
      options
    );
  }

  async getMyBusinesses(
    options?: ApiRequestOptions
  ): Promise<RawBackendBusiness | RawBackendBusiness[] | null> {
    return this.get<RawBackendBusiness | RawBackendBusiness[] | null>(
      API_ENDPOINTS.BUSINESS_ME,
      options
    );
  }

  async getBusinessById(
    id: string,
    options?: ApiRequestOptions
  ): Promise<RawBackendBusiness> {
    return this.get<RawBackendBusiness>(
      API_ENDPOINTS.BUSINESS_BY_ID(id),
      options
    );
  }

  async createBusiness(
    payload: Record<string, any>,
    options?: ApiRequestOptions
  ): Promise<RawBackendBusiness> {
    return this.post<RawBackendBusiness>(
      API_ENDPOINTS.BUSINESSES,
      payload,
      options
    );
  }

  async updateBusiness(
    id: string,
    payload: Record<string, any>,
    options?: ApiRequestOptions
  ): Promise<RawBackendBusiness> {
    return this.patch<RawBackendBusiness>(
      API_ENDPOINTS.BUSINESS_BY_ID(id),
      payload,
      options
    );
  }

  async submitBusiness(
    id: string,
    options?: ApiRequestOptions
  ): Promise<RawBackendBusiness> {
    return this.post<RawBackendBusiness>(
      API_ENDPOINTS.BUSINESS_SUBMIT(id),
      undefined,
      options
    );
  }

  async deleteBusiness(id: string, options?: ApiRequestOptions): Promise<void> {
    await this.delete<void>(API_ENDPOINTS.BUSINESS_BY_ID(id), options);
  }

  // --- Section 4: Business Media & Generic Uploads ---

  private buildUploadFormData(
    file: UploadFileInput,
    extraFields?: Record<string, string>
  ): FormData {
    const formData = new FormData();
    const inferredName =
      file.name ||
      file.uri.split('/').pop() ||
      `upload_${Date.now()}.jpg`;
    const inferredType =
      file.type ||
      (inferredName.toLowerCase().endsWith('.png')
        ? 'image/png'
        : 'image/jpeg');

    formData.append('file', {
      uri: file.uri,
      name: inferredName,
      type: inferredType,
    } as any);

    if (extraFields) {
      Object.entries(extraFields).forEach(([k, v]) => {
        formData.append(k, v);
      });
    }
    return formData;
  }

  async uploadBusinessMedia(
    businessId: string,
    file: UploadFileInput,
    type: 'LOGO' | 'GALLERY' | 'COVER' = 'LOGO'
  ): Promise<BusinessMediaItem> {
    const formData = this.buildUploadFormData(file, { type });
    return this.post<BusinessMediaItem>(
      API_ENDPOINTS.BUSINESS_MEDIA(businessId),
      formData
    );
  }

  async getBusinessMedia(businessId: string): Promise<BusinessMediaItem[]> {
    return this.get<BusinessMediaItem[]>(
      API_ENDPOINTS.BUSINESS_MEDIA(businessId)
    );
  }

  async deleteBusinessMedia(
    businessId: string,
    mediaId: string
  ): Promise<void> {
    await this.delete<void>(
      API_ENDPOINTS.BUSINESS_MEDIA_DELETE(businessId, mediaId)
    );
  }

  async uploadFile(file: UploadFileInput): Promise<BackendUploadResponse> {
    const formData = this.buildUploadFormData(file);
    return this.post<BackendUploadResponse>(API_ENDPOINTS.UPLOADS, formData);
  }

  // --- Section 5: Social Links ---

  async getSocialLinks(businessId: string): Promise<BusinessSocialLinkItem[]> {
    return this.get<BusinessSocialLinkItem[]>(
      API_ENDPOINTS.BUSINESS_SOCIAL_LINKS(businessId)
    );
  }

  async updateSocialLinks(
    businessId: string,
    links: Array<{ platform: string; url: string }>
  ): Promise<BusinessSocialLinkItem[]> {
    try {
      return await this.put<BusinessSocialLinkItem[]>(
        API_ENDPOINTS.BUSINESS_SOCIAL_LINKS(businessId),
        { links }
      );
    } catch (err: any) {
      if (err?.isHttpError && err.status === 400) {
        return this.put<BusinessSocialLinkItem[]>(
          API_ENDPOINTS.BUSINESS_SOCIAL_LINKS(businessId),
          links
        );
      }
      throw err;
    }
  }

  // --- Section 6: Services & Products ---

  async getServices(businessId: string): Promise<BusinessServiceItem[]> {
    return this.get<BusinessServiceItem[]>(
      API_ENDPOINTS.BUSINESS_SERVICES(businessId)
    );
  }

  async createService(
    businessId: string,
    payload: { name: string; description?: string; price?: string }
  ): Promise<BusinessServiceItem> {
    return this.post<BusinessServiceItem>(
      API_ENDPOINTS.BUSINESS_SERVICES(businessId),
      payload
    );
  }

  async updateService(
    serviceId: string,
    payload: { name?: string; description?: string; price?: string }
  ): Promise<BusinessServiceItem> {
    return this.patch<BusinessServiceItem>(
      API_ENDPOINTS.SERVICE_BY_ID(serviceId),
      payload
    );
  }

  async deleteService(serviceId: string): Promise<void> {
    await this.delete<void>(API_ENDPOINTS.SERVICE_BY_ID(serviceId));
  }

  async getProducts(businessId: string): Promise<BusinessProductItem[]> {
    return this.get<BusinessProductItem[]>(
      API_ENDPOINTS.BUSINESS_PRODUCTS(businessId)
    );
  }

  async createProduct(
    businessId: string,
    payload: {
      name: string;
      description?: string;
      price?: string;
      imageUrl?: string | null;
    }
  ): Promise<BusinessProductItem> {
    return this.post<BusinessProductItem>(
      API_ENDPOINTS.BUSINESS_PRODUCTS(businessId),
      payload
    );
  }

  async updateProduct(
    productId: string,
    payload: {
      name?: string;
      description?: string;
      price?: string;
      imageUrl?: string | null;
    }
  ): Promise<BusinessProductItem> {
    return this.patch<BusinessProductItem>(
      API_ENDPOINTS.PRODUCT_BY_ID(productId),
      payload
    );
  }

  async deleteProduct(productId: string): Promise<void> {
    await this.delete<void>(API_ENDPOINTS.PRODUCT_BY_ID(productId));
  }

  // --- Section 7 & 13: Promotions ---

  async getPromotions(businessId: string): Promise<BusinessPromotionItem[]> {
    return this.get<BusinessPromotionItem[]>(
      API_ENDPOINTS.BUSINESS_PROMOTIONS(businessId)
    );
  }

  async createPromotion(
    businessId: string,
    payload: {
      title: string;
      description?: string;
      startDate?: string | null;
      endDate?: string | null;
    }
  ): Promise<BusinessPromotionItem> {
    return this.post<BusinessPromotionItem>(
      API_ENDPOINTS.BUSINESS_PROMOTIONS(businessId),
      payload
    );
  }

  async getPromotionById(
    promotionId: string
  ): Promise<BusinessPromotionItem> {
    return this.get<BusinessPromotionItem>(
      API_ENDPOINTS.PROMOTION_BY_ID(promotionId)
    );
  }

  async updatePromotion(
    promotionId: string,
    payload: {
      title?: string;
      description?: string;
      startDate?: string | null;
      endDate?: string | null;
    }
  ): Promise<BusinessPromotionItem> {
    return this.patch<BusinessPromotionItem>(
      API_ENDPOINTS.PROMOTION_BY_ID(promotionId),
      payload
    );
  }

  async deletePromotion(promotionId: string): Promise<void> {
    await this.delete<void>(API_ENDPOINTS.PROMOTION_BY_ID(promotionId));
  }

  // --- Section 9: Notifications ---

  async getNotifications(
    options?: ApiRequestOptions
  ): Promise<BackendNotificationItem[]> {
    return this.get<BackendNotificationItem[]>(
      API_ENDPOINTS.NOTIFICATIONS,
      options
    );
  }

  async markNotificationRead(id: string): Promise<BackendNotificationItem> {
    return this.patch<BackendNotificationItem>(
      API_ENDPOINTS.NOTIFICATION_READ(id)
    );
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.patch<void>(API_ENDPOINTS.NOTIFICATIONS_READ_ALL);
  }

  // --- Token Management ---

  async setTokens(accessToken: string, refreshToken: string) {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  }

  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  async clearTokens() {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
    ]);
  }

  async setUserData(userData: any) {
    if (userData) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(userData)
      );
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
  }

  async getUserData(): Promise<any | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

export const apiClient = new ApiClient();
