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
  | 'Other';

export interface BusinessSocialLinks {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  twitter?: string;
}

export interface Business {
  id: string;
  name: string;
  category: Exclude<BusinessCategory, 'All'>;
  phone: string;
  address: string;
  city: string;
  description: string;
  image: string;
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
}

export interface BusinessSection {
  title: string;
  data: Business[];
}
