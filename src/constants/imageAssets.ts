import { ImageSourcePropType } from 'react-native';

export const CATEGORY_LOCAL_IMAGES: Record<string, ImageSourcePropType> = {
  Restaurants: require('../assets/images/restaurants.jpg'),
  Cafes: require('../assets/images/cafes.jpg'),
  Hotels: require('../assets/images/hotels.jpg'),
  Hospitals: require('../assets/images/hospitals.jpg'),
  Grocery: require('../assets/images/grocery.jpg'),
  Shopping: require('../assets/images/shopping.jpg'),
  Electronics: require('../assets/images/electronics.jpg'),
  'Mobile Stores': require('../assets/images/mobile_stores.jpg'),
  Salons: require('../assets/images/salons.jpg'),
  Gyms: require('../assets/images/gyms.jpg'),
  Banks: require('../assets/images/banks.jpg'),
  'Real Estate': require('../assets/images/real_estate.jpg'),
  Automobile: require('../assets/images/automobile.jpg'),
  Mechanics: require('../assets/images/mechanics.jpg'),
  Education: require('../assets/images/education.jpg'),
  Travel: require('../assets/images/travel.jpg'),
  Other: require('../assets/images/other.jpg'),
};

export const DEFAULT_USER_AVATAR: ImageSourcePropType = require('../assets/images/user_avatar.jpg');
export const DEFAULT_BUSINESS_LOGO: ImageSourcePropType = require('../assets/images/business_logo.jpg');

export function getBusinessAvatarSource(
  imageUri?: string | null,
  category?: string
): ImageSourcePropType {
  const localCategory =
    (category && CATEGORY_LOCAL_IMAGES[category]) ||
    CATEGORY_LOCAL_IMAGES['Other'] ||
    DEFAULT_BUSINESS_LOGO;

  if (!imageUri || typeof imageUri !== 'string' || !imageUri.trim()) {
    return localCategory;
  }

  // Return uri object for custom image
  return { uri: imageUri };
}
