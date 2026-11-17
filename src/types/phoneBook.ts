export interface PhoneNumberItem {
  label: 'Mobile' | 'Work' | 'Home' | 'Other' | 'Emergency' | string;
  number: string;
}

export interface PhoneBookContact {
  id: string;
  name: string;
  avatar: string;
  category?: string;
  localImage?: any;
  distance?: string;
  primaryPhone: string;
  phoneNumbers: PhoneNumberItem[];
  email: string;
  hasApp: boolean; // true: App Call connected, false: App not available
  isFavorite?: boolean;
  offers?: string[];
}

export interface EmergencyItem {
  id: string;
  title: string;
  number: string;
  icon: string;
  bgColor: string;
}
