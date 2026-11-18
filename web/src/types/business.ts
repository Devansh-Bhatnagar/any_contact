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
  latitude?: number;
  longitude?: number;
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
  offers?: string[];
  isCustomCreated?: boolean;
}
