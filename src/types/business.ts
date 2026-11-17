export type BusinessCategory =
  | 'All'
  | 'Restaurants'
  | 'Hotels'
  | 'Hospitals'
  | 'Shopping'
  | 'Electronics'
  | 'Mobile Stores'
  | 'Salons'
  | 'Gyms'
  | 'Real Estate'
  | 'Automobile'
  | 'Mechanics'
  | 'Education'
  | 'Grocery'
  | 'Cafes'
  | 'Banks'
  | 'Travel'
  | 'Professional Services'
  | 'Technology & SaaS'
  | 'Hospitality & Food'
  | 'Logistics & Supply'
  | 'Arts & Entertainment'
  | 'Beauty & Personal Care'
  | 'Healthcare & Wellness'
  | 'Finance & Insurance'
  | 'Retail & E-commerce'
  | 'Other'
  | (string & {});

export interface BusinessSocialLinks {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  twitter?: string;
}

export interface BusinessService {
  id: string;
  name: string;
  description?: string;
  price?: string;
}

export interface BusinessProduct {
  id: string;
  name: string;
  description?: string;
  price?: string;
  imageUrl?: string | null;
}

export interface BusinessPromotion {
  id: string;
  title: string;
  description?: string;
  status: string;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  description: string;
  image: string;
  galleryImages?: string[];
  latitude: number;
  longitude: number;
  isBestie: boolean;
  rating?: number;
  reviewCount?: number;
  openingHours?: string;
  email?: string;
  website?: string;
  tagline?: string;
  socials?: BusinessSocialLinks;
  ownerName?: string;
  verified?: boolean;
  status?: string;
  profileCompletionPercent?: number;
  services?: BusinessService[];
  products?: BusinessProduct[];
  promotions?: BusinessPromotion[];
  offers?: string[];
  isLiveBackend?: boolean;
}

export interface BusinessSection {
  title: string;
  data: Business[];
}

