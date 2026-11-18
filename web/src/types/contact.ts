export interface PhoneNumberItem {
  label: 'Mobile' | 'Work' | 'Home' | 'Other' | 'Emergency' | string;
  number: string;
}

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  category?: string;
  primaryPhone: string;
  phoneNumbers: PhoneNumberItem[];
  email: string;
  hasApp: boolean;
  isFavorite?: boolean;
  isBlocked?: boolean;
  offers?: string[];
  notes?: string;
  lastContacted?: string;
}

export interface EmergencyContact {
  id: string;
  title: string;
  number: string;
  iconName: string;
  bgColor: string;
  description: string;
}
