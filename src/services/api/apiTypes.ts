/**
 * Raw Backend Data Types matching the backend API contracts
 */

export interface WorkingHourItem {
  day: string;
  open: string | null;
  close: string | null;
  closed: boolean;
}

export interface BusinessMediaItem {
  id?: string;
  businessId?: string;
  type: 'LOGO' | 'COVER' | 'GALLERY' | string;
  url: string;
  createdAt?: string;
}

export interface BusinessSocialLinkItem {
  id?: string;
  businessId?: string;
  platform: 'FACEBOOK' | 'INSTAGRAM' | 'TWITTER' | 'LINKEDIN' | 'YOUTUBE' | string;
  url: string;
}

export interface BusinessServiceItem {
  id: string;
  businessId?: string;
  name: string;
  description?: string;
  price?: string;
}

export interface BusinessProductItem {
  id: string;
  businessId?: string;
  name: string;
  description?: string;
  price?: string;
  imageUrl?: string | null;
}

export interface BusinessPromotionItem {
  id: string;
  businessId?: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
}

export interface RawBackendBusiness {
  id: string;
  ownerId?: string;
  companyName: string;
  ownerName?: string;
  category: string;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  workingHours?: WorkingHourItem[] | null;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  verified: boolean;
  profileCompletionPercent?: number;
  createdAt?: string;
  updatedAt?: string;
  media?: BusinessMediaItem[];
  socialLinks?: BusinessSocialLinkItem[];
  services?: BusinessServiceItem[];
  products?: BusinessProductItem[];
  promotions?: BusinessPromotionItem[];
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface BackendCategoryItem {
  id: string;
  name: string;
}

export interface BackendPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface BackendAuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'BUSINESS_OWNER' | 'ADMIN' | string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface BackendHealthResponse {
  status: string;
}

export interface BackendUploadResponse {
  id: string;
  url: string;
}

export interface BackendNotificationItem {
  id: string;
  userId: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING' | string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
