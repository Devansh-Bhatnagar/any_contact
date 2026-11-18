export interface CategoryMeta {
  name: string;
  iconName: string;
  color: string;
  bgLight: string;
  bgDark: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { name: 'All', iconName: 'Grid', color: '#1E60F2', bgLight: '#EBF2FE', bgDark: 'rgba(30, 96, 242, 0.2)' },
  { name: 'Restaurants', iconName: 'Utensils', color: '#EF4444', bgLight: '#FEE2E2', bgDark: 'rgba(239, 68, 68, 0.2)' },
  { name: 'Cafes', iconName: 'Coffee', color: '#B45309', bgLight: '#FEF3C7', bgDark: 'rgba(180, 83, 9, 0.2)' },
  { name: 'Hotels', iconName: 'Hotel', color: '#0284C7', bgLight: '#E0F2FE', bgDark: 'rgba(2, 132, 199, 0.2)' },
  { name: 'Hospitals', iconName: 'HeartPulse', color: '#DC2626', bgLight: '#FFE4E6', bgDark: 'rgba(220, 38, 38, 0.2)' },
  { name: 'Grocery', iconName: 'ShoppingBasket', color: '#16A34A', bgLight: '#DCFCE7', bgDark: 'rgba(22, 163, 74, 0.2)' },
  { name: 'Shopping', iconName: 'ShoppingBag', color: '#D946EF', bgLight: '#FDF4FF', bgDark: 'rgba(217, 70, 239, 0.2)' },
  { name: 'Electronics', iconName: 'Tv', color: '#4F46E5', bgLight: '#EEF2FF', bgDark: 'rgba(79, 70, 229, 0.2)' },
  { name: 'Mobile Stores', iconName: 'Smartphone', color: '#2563EB', bgLight: '#EFF6FF', bgDark: 'rgba(37, 99, 235, 0.2)' },
  { name: 'Salons', iconName: 'Scissors', color: '#EC4899', bgLight: '#FCE7F3', bgDark: 'rgba(236, 72, 153, 0.2)' },
  { name: 'Gyms', iconName: 'Dumbbell', color: '#F97316', bgLight: '#FFEDD5', bgDark: 'rgba(249, 115, 22, 0.2)' },
  { name: 'Banks', iconName: 'Landmark', color: '#0D9488', bgLight: '#CCFBF1', bgDark: 'rgba(13, 148, 136, 0.2)' },
  { name: 'Real Estate', iconName: 'Home', color: '#8B5CF6', bgLight: '#F5F3FF', bgDark: 'rgba(139, 92, 246, 0.2)' },
  { name: 'Automobile', iconName: 'Car', color: '#EA580C', bgLight: '#FFEDD5', bgDark: 'rgba(234, 88, 12, 0.2)' },
  { name: 'Mechanics', iconName: 'Wrench', color: '#64748B', bgLight: '#F1F5F9', bgDark: 'rgba(100, 116, 139, 0.2)' },
  { name: 'Education', iconName: 'GraduationCap', color: '#0891B2', bgLight: '#CFFAFE', bgDark: 'rgba(8, 145, 178, 0.2)' },
  { name: 'Travel', iconName: 'Plane', color: '#06B6D4', bgLight: '#E0F2FE', bgDark: 'rgba(6, 182, 212, 0.2)' },
  { name: 'Professional Services', iconName: 'Briefcase', color: '#3B82F6', bgLight: '#DBEAFE', bgDark: 'rgba(59, 130, 246, 0.2)' },
  { name: 'Healthcare & Wellness', iconName: 'Sparkles', color: '#10B981', bgLight: '#D1FAE5', bgDark: 'rgba(16, 185, 129, 0.2)' },
  { name: 'Retail & E-commerce', iconName: 'Store', color: '#9333EA', bgLight: '#F3E8FF', bgDark: 'rgba(147, 51, 234, 0.2)' },
  { name: 'Other', iconName: 'MoreHorizontal', color: '#6B7280', bgLight: '#F3F4F6', bgDark: 'rgba(107, 114, 128, 0.2)' },
];

export const PRESET_OFFER_TEMPLATES = [
  'Buy 1 Get 1 Free',
  'Christmas offer flat 80% off',
  'Flat 50% Off',
  'Flat 20% Off',
  'Special Festival Offer',
  'Free Home Delivery',
  'Combo Deal',
];
