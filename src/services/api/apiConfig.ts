/**
 * API Configuration for Backend Integration
 * Base URL and endpoint route definitions
 */

// https://api.leadsphonebook.com is the primary production backend
export const API_ROOT_URL = 'https://api.leadsphonebook.com';
export const API_BASE_URL = `${API_ROOT_URL}/api`;
export const API_FALLBACK_URL = 'https://api.addphonenumber.in/api';

export const API_ENDPOINTS = {
  // Health check (served at root /health on API_ROOT_URL)
  HEALTH: '/health',

  // Authentication
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_ME: '/auth/me',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/auth/reset-password',
  AUTH_LOGOUT: '/auth/logout',

  // Categories
  CATEGORIES: '/categories',
  CATEGORY_BY_ID: (id: string) => `/categories/${id}`,

  // Businesses
  BUSINESSES: '/businesses',
  BUSINESS_ME: '/businesses/me',
  BUSINESS_BY_ID: (id: string) => `/businesses/${id}`,
  BUSINESS_SUBMIT: (id: string) => `/businesses/${id}/submit`,
  BUSINESS_MEDIA: (id: string) => `/businesses/${id}/media`,
  BUSINESS_MEDIA_DELETE: (businessId: string, mediaId: string) =>
    `/businesses/${businessId}/media/${mediaId}`,
  BUSINESS_SOCIAL_LINKS: (id: string) => `/businesses/${id}/social-links`,
  BUSINESS_SERVICES: (id: string) => `/businesses/${id}/services`,
  SERVICE_BY_ID: (serviceId: string) => `/services/${serviceId}`,
  BUSINESS_PRODUCTS: (id: string) => `/businesses/${id}/products`,
  PRODUCT_BY_ID: (productId: string) => `/products/${productId}`,
  BUSINESS_PROMOTIONS: (id: string) => `/businesses/${id}/promotions`,
  PROMOTION_BY_ID: (promotionId: string) => `/promotions/${promotionId}`,

  // Search & Filter
  SEARCH_BUSINESSES: '/search/businesses',

  // Generic upload
  UPLOADS: '/uploads',

  // Notifications
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_READ: (id: string) => `/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: '/notifications/read-all',
} as const;
