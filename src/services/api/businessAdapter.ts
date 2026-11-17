import { Business, BusinessSocialLinks } from '../../types/business';
import { RawBackendBusiness, WorkingHourItem } from './apiTypes';

// High-resolution fallback photography for categories where business hasn't uploaded logo yet
const CATEGORY_IMAGE_FALLBACKS: Record<string, string> = {
  'Technology & SaaS':
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80',
  'Real Estate':
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&q=80',
  'Professional Services':
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&q=80',
  'Hospitality & Food':
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80',
  'Logistics & Supply':
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&q=80',
  Restaurants:
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80',
  Hotels:
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80',
  Hospitals:
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=500&q=80',
  Grocery:
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
  Shopping:
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80',
  Electronics:
    'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&q=80',
  Salons:
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80',
  Gyms:
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80',
  Banks:
    'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=500&q=80',
  Education:
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&q=80',
  Travel:
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500&q=80',
};

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&q=80';

/**
 * Format working hours array into human-readable string
 */
function formatWorkingHours(hours?: WorkingHourItem[] | null): string {
  if (!hours || !Array.isArray(hours) || hours.length === 0) {
    return '09:00 AM - 06:00 PM';
  }

  const openDays = hours.filter((h) => !h.closed && h.open && h.close);
  if (openDays.length === 0) {
    return 'By Appointment';
  }

  const first = openDays[0];
  return `${first.day}: ${first.open} - ${first.close}`;
}

/**
 * Convert backend social links array into BusinessSocialLinks object
 */
function mapSocialLinks(
  links?: RawBackendBusiness['socialLinks']
): BusinessSocialLinks {
  const socials: BusinessSocialLinks = {};
  if (!links || !Array.isArray(links)) return socials;

  links.forEach((link) => {
    const platform = (link.platform || '').toUpperCase();
    if (platform === 'INSTAGRAM') socials.instagram = link.url;
    else if (platform === 'FACEBOOK') socials.facebook = link.url;
    else if (platform === 'LINKEDIN') socials.linkedin = link.url;
    else if (platform === 'TWITTER') socials.twitter = link.url;
    else if (platform === 'YOUTUBE') socials.youtube = link.url;
  });

  return socials;
}

/**
 * Transforms a raw business object from backend API into frontend Business format
 */
export function transformBackendBusiness(raw: RawBackendBusiness): Business {
  // Extract primary image (prefer LOGO, then first media item, then category fallback)
  let imageUri = '';
  if (raw.media && raw.media.length > 0) {
    const logoMedia = raw.media.find((m) => m.type === 'LOGO');
    imageUri = logoMedia ? logoMedia.url : raw.media[0].url;
  }

  if (!imageUri) {
    imageUri =
      CATEGORY_IMAGE_FALLBACKS[raw.category] || DEFAULT_FALLBACK_IMAGE;
  }

  // Address and City
  const address = raw.address || 'Address not listed';
  const city = raw.city || (raw.state ? `${raw.state}` : 'India');

  // Description fallback
  const description =
    raw.description?.trim() ||
    `${raw.companyName} is an approved and verified business in ${city}. Specialized in ${raw.category} services.`;

  return {
    id: raw.id,
    name: raw.companyName,
    category: raw.category || 'Other',
    phone: raw.phone || '+91 98765 43210',
    address,
    city,
    description,
    image: imageUri,
    latitude: 12.9716, // Fallback coordinates
    longitude: 77.5946,
    isBestie: false,
    rating: 4.8,
    reviewCount: 36,
    openingHours: formatWorkingHours(raw.workingHours),
    email: raw.email || undefined,
    website: raw.website || undefined,
    tagline: raw.ownerName ? `Verified Owner: ${raw.ownerName}` : 'Verified Business',
    socials: mapSocialLinks(raw.socialLinks),
    ownerName: raw.ownerName,
    verified: raw.verified ?? true,
    status: raw.status || 'APPROVED',
    profileCompletionPercent: raw.profileCompletionPercent ?? 100,
    services: raw.services?.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: s.price,
    })),
    products: raw.products?.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      imageUrl: p.imageUrl,
    })),
    promotions: raw.promotions?.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
    })),
    offers:
      raw.promotions
        ?.map((p) => p.title)
        .filter((t): t is string => Boolean(t && t.trim())) || [],
    isLiveBackend: true,
  };
}
