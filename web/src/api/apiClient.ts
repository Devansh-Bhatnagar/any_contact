/**
 * HTTP API Client for Leads Phone Book Web App
 * Handles request timeouts, JSON serialization, auth token management, and fallback hosts.
 */
import { API_BASE_URL, API_FALLBACK_URL } from './apiConfig';

const TOKEN_KEY = 'lpb_access_token';
const REFRESH_TOKEN_KEY = 'lpb_refresh_token';
const USER_KEY = 'lpb_user';

export interface ApiOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
  params?: Record<string, string | number | boolean | undefined | null>;
}

export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

class ApiClient {
  private baseUrl = API_BASE_URL;
  private fallbackUrl = API_FALLBACK_URL;

  public getAccessToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public setTokens(accessToken: string, refreshToken?: string, user?: any) {
    try {
      localStorage.setItem(TOKEN_KEY, accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // storage quota or private mode
    }
  }

  public clearTokens() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
  }

  public getUser(): any | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private buildUrl(endpoint: string, base: string, params?: Record<string, any>): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let fullUrl = endpoint.startsWith('http') ? endpoint : `${base}${cleanEndpoint}`;

    if (params) {
      const queryParts: string[] = [];
      for (const [key, val] of Object.entries(params)) {
        if (val !== undefined && val !== null && val !== '') {
          queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
        }
      }
      if (queryParts.length > 0) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryParts.join('&');
      }
    }

    return fullUrl;
  }

  public async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const {
      timeoutMs = 12000,
      skipAuth = false,
      params,
      headers: customHeaders,
      ...fetchOptions
    } = options;

    const token = !skipAuth ? this.getAccessToken() : null;

    const isFormData = typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(customHeaders as Record<string, string>),
    };

    const tryFetch = async (baseHost: string): Promise<T> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const targetUrl = this.buildUrl(endpoint, baseHost, params);

      try {
        const res = await fetch(targetUrl, {
          ...fetchOptions,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (res.status === 204) {
          return null as unknown as T;
        }

        const text = await res.text();
        let json: any = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {
          json = text;
        }

        if (!res.ok) {
          const errMsg = json?.message || json?.error || `Request failed with status ${res.status}`;
          throw new ApiError(errMsg, res.status, json);
        }

        return json as T;
      } catch (err: any) {
        clearTimeout(timer);
        if (err.name === 'AbortError') {
          throw new ApiError(`Request timeout after ${timeoutMs}ms`, 408);
        }
        throw err;
      }
    };

    // Attempt primary URL, with fallback if network error
    try {
      return await tryFetch(this.baseUrl);
    } catch (primaryErr: any) {
      // If primary failed due to network / refused connection and is not a 4xx client error, try fallback
      const isNetworkError =
        primaryErr.status === 408 ||
        primaryErr.status === 0 ||
        primaryErr.status === 500 ||
        primaryErr.status === 502 ||
        primaryErr.status === 503 ||
        primaryErr.status === 504 ||
        primaryErr.name === 'TypeError';

      if (isNetworkError && this.baseUrl !== this.fallbackUrl) {
        try {
          return await tryFetch(this.fallbackUrl);
        } catch {
          // Re-throw original error
          throw primaryErr;
        }
      }
      throw primaryErr;
    }
  }

  public get<T>(endpoint: string, params?: Record<string, any>, options?: ApiOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params, ...options });
  }

  public post<T>(endpoint: string, body?: any, options?: ApiOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  }

  public put<T>(endpoint: string, body?: any, options?: ApiOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  }

  public patch<T>(endpoint: string, body?: any, options?: ApiOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  }

  public delete<T>(endpoint: string, options?: ApiOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  }
}

export const apiClient = new ApiClient();
