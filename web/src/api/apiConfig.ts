/**
 * API Configuration for Leads Phone Book Web App
 * Connects frontend to the Express/Prisma backend server
 */

const getApiBaseUrl = (): string => {
  // If explicitly configured via Vite env
  const metaEnv = (import.meta as any).env;
  if (metaEnv && metaEnv.VITE_API_URL) {
    return metaEnv.VITE_API_URL;
  }

  // When served on localhost, use the local proxy or backend port
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    // Relative /api is handled by Vite proxy in dev
    return '/api';
  }

  // Production backend API
  return 'https://any-contact.onrender.com/api';
};

export const API_BASE_URL = getApiBaseUrl();
export const API_FALLBACK_URL = 'https://any-contact.onrender.com/api';

export const API_ENDPOINTS = {
  // Health
  HEALTH: '/health',

  // Authentication
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_ME: '/auth/me',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_LOGOUT: '/auth/logout',

  // Categories
  CATEGORIES: '/categories',

  // Businesses & Directory
  BUSINESSES: '/businesses',
  BUSINESS_BY_ID: (id: string) => `/businesses/${id}`,
  BUSINESS_ME: '/businesses/me',
  SEARCH_BUSINESSES: '/search/businesses',

  // Business Contacts & Discovery
  BUSINESS_CONTACTS_NEARBY: '/business-contacts/nearby',
  BUSINESS_CONTACTS_SEARCH: '/business-contacts/search',
  BUSINESS_CONTACTS_OFFERS_ACTIVE: '/business-contacts/offers/active',
  BUSINESS_CONTACTS_BY_ID: (id: string) => `/business-contacts/${id}`,
  BUSINESS_CONTACTS_REVIEWS: (id: string) => `/business-contacts/${id}/reviews`,
  BUSINESS_CONTACTS_FAVORITES: '/business-contacts/favorites',
  BUSINESS_CONTACTS_SHARE: (id: string) => `/business-contacts/${id}/share`,

  // Phonebook SDUI & CRM Engine
  PHONEBOOK_BOOTSTRAP: '/phonebook/bootstrap',
  PHONEBOOK_LOOKUPS: '/phonebook/lookups',
  PHONEBOOK_STATUS: '/phonebook/status',
  PHONEBOOK_LEADS: '/phonebook/leads',
  PHONEBOOK_CALLS: '/phonebook/calls',
  PHONEBOOK_MATCH_CONTACTS: '/phonebook/match-contacts',
} as const;
