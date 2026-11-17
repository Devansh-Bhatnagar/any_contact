import { Business } from '../types/business';
import { PhoneBookContact } from '../types/phoneBook';
import { IconName } from '../components/common/Icon';
import { SAMPLE_BUSINESSES } from './businesses';
import { CATEGORY_LOCAL_IMAGES, DEFAULT_BUSINESS_LOGO } from '../constants/imageAssets';

export interface BusinessCategoryGroup {
  id: string;
  name: string;
  hindiName?: string;
  icon: IconName;
  color: string;
  bgColor: string;
  businesses: PhoneBookContact[];
}

// Realistic distance helper for nearby businesses (e.g. 0.8 km, 1.2 km, 2.1 km, 3 km)
export const getBusinessDistance = (id: string, name: string): string => {
  let hash = 0;
  const str = id + name;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const distances = [
    '0.5 km',
    '0.8 km',
    '1.2 km',
    '1.5 km',
    '1.8 km',
    '2.1 km',
    '2.5 km',
    '3.0 km',
    '3.4 km',
    '4.2 km',
  ];
  return distances[Math.abs(hash) % distances.length];
};

// Helper to convert Business to PhoneBookContact
const toContact = (b: Business, defaultCategory: string): PhoneBookContact => ({
  id: b.id,
  name: b.name,
  category: b.category || defaultCategory,
  avatar: b.image || '',
  distance: getBusinessDistance(b.id, b.name),
  primaryPhone: b.phone,
  phoneNumbers: [{ label: 'Work', number: b.phone }],
  email: b.email || `${b.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@business.com`,
  hasApp: true,
  isFavorite: b.isBestie,
  offers:
    b.offers && b.offers.length > 0
      ? b.offers
      : b.promotions && b.promotions.length > 0
      ? b.promotions.map((p) => p.title).filter(Boolean)
      : undefined,
});

// 1. Hospitals & Clinics (12 items)
const hospitalContacts: PhoneBookContact[] = [
  ...SAMPLE_BUSINESSES.filter((b) => b.category === 'Hospitals').map((b) => toContact(b, 'Hospitals')),
  {
    id: 'hosp-ext-1',
    name: 'Fortis Escorts Heart & Multispeciality',
    category: 'Hospitals',
    avatar: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&q=80',
    primaryPhone: '+91 98110 54321',
    phoneNumbers: [{ label: 'Emergency', number: '+91 98110 54321' }],
    email: 'care@fortishealthcare.com',
    hasApp: true,
  },
  {
    id: 'hosp-ext-2',
    name: 'Max Super Speciality Hospital',
    category: 'Hospitals',
    avatar: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=400&q=80',
    primaryPhone: '+91 98220 12345',
    phoneNumbers: [{ label: 'Desk', number: '+91 98220 12345' }],
    email: 'support@maxhealthcare.com',
    hasApp: true,
  },
  {
    id: 'hosp-ext-3',
    name: 'Sanjeevani Maternity & Dental Clinic',
    category: 'Hospitals',
    avatar: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&q=80',
    primaryPhone: '+91 98330 67890',
    phoneNumbers: [{ label: 'Appointments', number: '+91 98330 67890' }],
    email: 'clinic@sanjeevani.com',
    hasApp: false,
  },
  {
    id: 'hosp-ext-4',
    name: 'City Care Orthopaedic & Trauma Center',
    category: 'Hospitals',
    avatar: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&q=80',
    primaryPhone: '+91 98440 98765',
    phoneNumbers: [{ label: 'Work', number: '+91 98440 98765' }],
    email: 'help@citycarehospital.in',
    hasApp: true,
  },
];

// 2. Salons & Beauty Parlours (12 items)
const salonContacts: PhoneBookContact[] = [
  ...SAMPLE_BUSINESSES.filter((b) => b.category === 'Salons').map((b) => toContact(b, 'Salons')),
  {
    id: 'salon-ext-1',
    name: 'Jawed Habib Hair & Beauty Lounge',
    category: 'Salons',
    avatar: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80',
    primaryPhone: '+91 98111 22334',
    phoneNumbers: [{ label: 'Bookings', number: '+91 98111 22334' }],
    email: 'salon@jawedhabib.in',
    hasApp: true,
  },
  {
    id: 'salon-ext-2',
    name: 'Lakme Salon & Bridal Studio',
    category: 'Salons',
    avatar: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
    primaryPhone: '+91 98222 33445',
    phoneNumbers: [{ label: 'Reception', number: '+91 98222 33445' }],
    email: 'care@lakmesalon.com',
    hasApp: true,
  },
  {
    id: 'salon-ext-3',
    name: 'Geetanjali Salon & Spa Luxury',
    category: 'Salons',
    avatar: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&q=80',
    primaryPhone: '+91 98333 44556',
    phoneNumbers: [{ label: 'Work', number: '+91 98333 44556' }],
    email: 'info@geetanjalisalon.in',
    hasApp: false,
  },
  {
    id: 'salon-ext-4',
    name: 'Looks Unisex Salon & Grooming',
    category: 'Salons',
    avatar: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
    primaryPhone: '+91 98444 55667',
    phoneNumbers: [{ label: 'Mobile', number: '+91 98444 55667' }],
    email: 'contact@lookssalon.com',
    hasApp: true,
  },
];

// 3. Tailors & Boutiques (10 items)
const tailorContacts: PhoneBookContact[] = [
  {
    id: 'tailor-1',
    name: 'Raymond Custom Tailoring Studio',
    category: 'Tailors',
    avatar: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80',
    primaryPhone: '+91 98101 11222',
    phoneNumbers: [{ label: 'Studio', number: '+91 98101 11222' }],
    email: 'tailoring@raymond.in',
    hasApp: true,
  },
  {
    id: 'tailor-2',
    name: 'Royal Designer Boutique & Tailors',
    category: 'Tailors',
    avatar: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80',
    primaryPhone: '+91 98202 22333',
    phoneNumbers: [{ label: 'Designer', number: '+91 98202 22333' }],
    email: 'royalboutique@mail.com',
    hasApp: true,
  },
  {
    id: 'tailor-3',
    name: 'Kalam Tailors Mens Formal & Sherwani',
    category: 'Tailors',
    avatar: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80',
    primaryPhone: '+91 98303 33444',
    phoneNumbers: [{ label: 'Shop', number: '+91 98303 33444' }],
    email: 'kalamtailors@mail.com',
    hasApp: false,
  },
  {
    id: 'tailor-4',
    name: 'Meena Ladies Boutique & Embroidery',
    category: 'Tailors',
    avatar: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&q=80',
    primaryPhone: '+91 98404 44555',
    phoneNumbers: [{ label: 'Mobile', number: '+91 98404 44555' }],
    email: 'meenaboutique@gmail.com',
    hasApp: false,
  },
  {
    id: 'tailor-5',
    name: 'Suits & Tuxedos Bespoke Tailors',
    category: 'Tailors',
    avatar: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=400&q=80',
    primaryPhone: '+91 98505 55666',
    phoneNumbers: [{ label: 'Work', number: '+91 98505 55666' }],
    email: 'bespoke@suitstux.com',
    hasApp: true,
  },
  {
    id: 'tailor-6',
    name: 'Anarkali Fashion Tailors & Blouse Works',
    category: 'Tailors',
    avatar: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80',
    primaryPhone: '+91 98606 66777',
    phoneNumbers: [{ label: 'Work', number: '+91 98606 66777' }],
    email: 'anarkalifashion@mail.com',
    hasApp: false,
  },
  {
    id: 'tailor-7',
    name: 'Shree Ram Tailoring & Alteration Shop',
    category: 'Tailors',
    avatar: 'https://images.unsplash.com/photo-1520006403909-838d6b92c22e?w=400&q=80',
    primaryPhone: '+91 98707 77888',
    phoneNumbers: [{ label: 'Shop', number: '+91 98707 77888' }],
    email: 'shreeramtailor@mail.com',
    hasApp: false,
  },
  {
    id: 'tailor-8',
    name: 'Vogue Cut Ladies Tailors & Draping',
    category: 'Tailors',
    avatar: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&q=80',
    primaryPhone: '+91 98808 88999',
    phoneNumbers: [{ label: 'Mobile', number: '+91 98808 88999' }],
    email: 'voguecut@mail.com',
    hasApp: true,
  },
  {
    id: 'tailor-9',
    name: 'Classic Fit Master Tailoring',
    category: 'Tailors',
    avatar: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=400&q=80',
    primaryPhone: '+91 98909 99000',
    phoneNumbers: [{ label: 'Work', number: '+91 98909 99000' }],
    email: 'classicfit@mail.com',
    hasApp: false,
  },
  {
    id: 'tailor-10',
    name: 'Golden Thread Bridal & Kurta Tailors',
    category: 'Tailors',
    avatar: 'https://images.unsplash.com/photo-1534126511673-b6899657816a?w=400&q=80',
    primaryPhone: '+91 98120 11999',
    phoneNumbers: [{ label: 'Store', number: '+91 98120 11999' }],
    email: 'goldenthread@mail.com',
    hasApp: true,
  },
];

// 4. Carpenters & Woodwork (10 items)
const carpenterContacts: PhoneBookContact[] = [
  {
    id: 'carp-1',
    name: 'Vishwakarma Wood Works & Modular Kitchens',
    category: 'Carpenters',
    avatar: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80',
    primaryPhone: '+91 98115 11001',
    phoneNumbers: [{ label: 'Workshop', number: '+91 98115 11001' }],
    email: 'vishwakarmawood@mail.com',
    hasApp: true,
  },
  {
    id: 'carp-2',
    name: 'Urban Woodcraft Furniture & Interior',
    category: 'Carpenters',
    avatar: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&q=80',
    primaryPhone: '+91 98225 22002',
    phoneNumbers: [{ label: 'Office', number: '+91 98225 22002' }],
    email: 'urbanwoodcraft@mail.com',
    hasApp: true,
  },
  {
    id: 'carp-3',
    name: 'Master Carpenter Suresh Kumar',
    category: 'Carpenters',
    avatar: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
    primaryPhone: '+91 98335 33003',
    phoneNumbers: [{ label: 'Direct', number: '+91 98335 33003' }],
    email: 'sureshcarpenter@mail.com',
    hasApp: false,
  },
  {
    id: 'carp-4',
    name: 'Teak & Pine Custom Furniture Works',
    category: 'Carpenters',
    avatar: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
    primaryPhone: '+91 98445 44004',
    phoneNumbers: [{ label: 'Work', number: '+91 98445 44004' }],
    email: 'teakpine@mail.com',
    hasApp: true,
  },
  {
    id: 'carp-5',
    name: 'Om Sai Door & Wardrobe Fitting Service',
    category: 'Carpenters',
    avatar: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&q=80',
    primaryPhone: '+91 98555 55005',
    phoneNumbers: [{ label: 'Mobile', number: '+91 98555 55005' }],
    email: 'omsaifittings@mail.com',
    hasApp: false,
  },
  {
    id: 'carp-6',
    name: 'Modern Home Wood Interior Decorators',
    category: 'Carpenters',
    avatar: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400&q=80',
    primaryPhone: '+91 98665 66006',
    phoneNumbers: [{ label: 'Studio', number: '+91 98665 66006' }],
    email: 'wooddecor@modernhome.in',
    hasApp: true,
  },
  {
    id: 'carp-7',
    name: 'Sharma Carpenter & Furniture Polish',
    category: 'Carpenters',
    avatar: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80',
    primaryPhone: '+91 98775 77007',
    phoneNumbers: [{ label: 'Shop', number: '+91 98775 77007' }],
    email: 'sharmapolish@mail.com',
    hasApp: false,
  },
  {
    id: 'carp-8',
    name: 'Balaji Sofa Repair & Wood Structure',
    category: 'Carpenters',
    avatar: 'https://images.unsplash.com/photo-1549497538-303791108f95?w=400&q=80',
    primaryPhone: '+91 98885 88008',
    phoneNumbers: [{ label: 'Work', number: '+91 98885 88008' }],
    email: 'balajisofarepair@mail.com',
    hasApp: false,
  },
  {
    id: 'carp-9',
    name: 'Elite Kitchen Cabinets & Carpentry',
    category: 'Carpenters',
    avatar: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&q=80',
    primaryPhone: '+91 98995 99009',
    phoneNumbers: [{ label: 'Helpdesk', number: '+91 98995 99009' }],
    email: 'elitecabinets@mail.com',
    hasApp: true,
  },
  {
    id: 'carp-10',
    name: 'QuickFix Emergency Wood & Lock Repairs',
    category: 'Carpenters',
    avatar: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80',
    primaryPhone: '+91 98116 11223',
    phoneNumbers: [{ label: 'Emergency', number: '+91 98116 11223' }],
    email: 'quickfixwood@mail.com',
    hasApp: false,
  },
];

// 5. Kirana & Grocery Shops (12 items)
const kiranaContacts: PhoneBookContact[] = [
  ...SAMPLE_BUSINESSES.filter((b) => b.category === 'Grocery').map((b) => toContact(b, 'Grocery')),
  {
    id: 'kirana-ext-1',
    name: 'Gupta Kirana General Store',
    category: 'Grocery',
    avatar: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&q=80',
    primaryPhone: '+91 98108 22331',
    phoneNumbers: [{ label: 'Shop', number: '+91 98108 22331' }],
    email: 'guptakirana@mail.com',
    hasApp: true,
  },
  {
    id: 'kirana-ext-2',
    name: 'Shree Ganesh Supermarket & Provisions',
    category: 'Grocery',
    avatar: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
    primaryPhone: '+91 98208 33442',
    phoneNumbers: [{ label: 'Orders', number: '+91 98208 33442' }],
    email: 'shreeganeshstore@mail.com',
    hasApp: true,
  },
  {
    id: 'kirana-ext-3',
    name: 'Nature Fresh Organic Dairy & Atta Chakki',
    category: 'Grocery',
    avatar: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=400&q=80',
    primaryPhone: '+91 98308 44553',
    phoneNumbers: [{ label: 'Delivery', number: '+91 98308 44553' }],
    email: 'naturefresh@mail.com',
    hasApp: false,
  },
  {
    id: 'kirana-ext-4',
    name: 'Aggarwal Daily Needs & Spices',
    category: 'Grocery',
    avatar: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=400&q=80',
    primaryPhone: '+91 98408 55664',
    phoneNumbers: [{ label: 'Counter', number: '+91 98408 55664' }],
    email: 'aggarwaldaily@mail.com',
    hasApp: true,
  },
];

// 6. Restaurants & Sweets (15 items)
const restaurantContacts: PhoneBookContact[] = [
  ...SAMPLE_BUSINESSES.filter((b) => b.category === 'Restaurants' || b.category === 'Cafes').map((b) =>
    toContact(b, 'Restaurants')
  ),
  {
    id: 'rest-ext-1',
    name: 'Haldirams Sweets & Pure Veg Thali',
    category: 'Restaurants',
    avatar: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80',
    primaryPhone: '+91 98112 88991',
    phoneNumbers: [{ label: 'Orders', number: '+91 98112 88991' }],
    email: 'orders@haldirams.com',
    hasApp: true,
  },
  {
    id: 'rest-ext-2',
    name: 'Bikanervala Sweets & Fast Food',
    category: 'Restaurants',
    avatar: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
    primaryPhone: '+91 98222 99002',
    phoneNumbers: [{ label: 'Table Booking', number: '+91 98222 99002' }],
    email: 'support@bikanervala.in',
    hasApp: true,
  },
];

// 7. Banks & Financial Services (12 items)
const bankContacts: PhoneBookContact[] = [
  ...SAMPLE_BUSINESSES.filter((b) => b.category === 'Banks').map((b) => toContact(b, 'Banks')),
  {
    id: 'bank-ext-1',
    name: 'State Bank of India (SBI Main Branch)',
    category: 'Banks',
    avatar: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=400&q=80',
    primaryPhone: '+91 1800 1234',
    phoneNumbers: [{ label: 'Toll Free', number: '+91 1800 1234' }],
    email: 'customercare@sbi.co.in',
    hasApp: true,
  },
  {
    id: 'bank-ext-2',
    name: 'HDFC Bank Ltd & Priority Banking',
    category: 'Banks',
    avatar: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=400&q=80',
    primaryPhone: '+91 1800 202 6161',
    phoneNumbers: [{ label: 'Support', number: '+91 1800 202 6161' }],
    email: 'support@hdfcbank.com',
    hasApp: true,
  },
];

// 8. Automobile & Mechanics (12 items)
const mechanicContacts: PhoneBookContact[] = [
  ...SAMPLE_BUSINESSES.filter((b) => b.category === 'Mechanics' || b.category === 'Automobile').map((b) =>
    toContact(b, 'Mechanics')
  ),
  {
    id: 'mech-ext-1',
    name: 'Bosch Car Service & Wheel Alignment',
    category: 'Mechanics',
    avatar: 'https://images.unsplash.com/photo-1613214149922-f1809c99b414?w=400&q=80',
    primaryPhone: '+91 98114 77881',
    phoneNumbers: [{ label: 'Garage', number: '+91 98114 77881' }],
    email: 'service@boschauto.in',
    hasApp: true,
  },
  {
    id: 'mech-ext-2',
    name: 'Speedy Tyre & Puncture 24/7',
    category: 'Mechanics',
    avatar: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&q=80',
    primaryPhone: '+91 98224 88992',
    phoneNumbers: [{ label: 'Emergency Roadside', number: '+91 98224 88992' }],
    email: 'speedytyres@mail.com',
    hasApp: false,
  },
];

// 9. Electricians & Plumbers (10 items)
const electricianContacts: PhoneBookContact[] = [
  {
    id: 'elec-1',
    name: 'BijliWala Quick Home Electrician',
    category: 'Electricians',
    avatar: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
    primaryPhone: '+91 98117 33441',
    phoneNumbers: [{ label: '24x7 Help', number: '+91 98117 33441' }],
    email: 'service@bijliwala.in',
    hasApp: true,
  },
  {
    id: 'elec-2',
    name: 'Sharma Plumbing & Water Tank Cleaning',
    category: 'Electricians',
    avatar: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&q=80',
    primaryPhone: '+91 98227 44552',
    phoneNumbers: [{ label: 'Work', number: '+91 98227 44552' }],
    email: 'sharmaplumbing@mail.com',
    hasApp: false,
  },
  {
    id: 'elec-3',
    name: 'Havells Certified Electrical Engineers',
    category: 'Electricians',
    avatar: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80',
    primaryPhone: '+91 98337 55663',
    phoneNumbers: [{ label: 'Office', number: '+91 98337 55663' }],
    email: 'care@havellsengineers.com',
    hasApp: true,
  },
  {
    id: 'elec-4',
    name: 'AquaFlow Sanitary & Pipe Fittings',
    category: 'Electricians',
    avatar: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&q=80',
    primaryPhone: '+91 98447 66774',
    phoneNumbers: [{ label: 'Store', number: '+91 98447 66774' }],
    email: 'aquaflow@mail.com',
    hasApp: false,
  },
  {
    id: 'elec-5',
    name: 'AC Repair & Inverter Battery Expert',
    category: 'Electricians',
    avatar: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=400&q=80',
    primaryPhone: '+91 98557 77885',
    phoneNumbers: [{ label: 'Booking', number: '+91 98557 77885' }],
    email: 'acrepairservice@mail.com',
    hasApp: true,
  },
  {
    id: 'elec-6',
    name: 'Master Plumber Rakesh Gupta',
    category: 'Electricians',
    avatar: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80',
    primaryPhone: '+91 98667 88996',
    phoneNumbers: [{ label: 'Mobile', number: '+91 98667 88996' }],
    email: 'rakeshplumber@mail.com',
    hasApp: false,
  },
  {
    id: 'elec-7',
    name: 'VoltSafe Home Wiring & MCB Repairs',
    category: 'Electricians',
    avatar: 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=400&q=80',
    primaryPhone: '+91 98777 99007',
    phoneNumbers: [{ label: 'Emergency', number: '+91 98777 99007' }],
    email: 'voltsafe@mail.com',
    hasApp: true,
  },
  {
    id: 'elec-8',
    name: 'Deep Drain & Sewage Pipe Cleaning',
    category: 'Electricians',
    avatar: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=400&q=80',
    primaryPhone: '+91 98887 11228',
    phoneNumbers: [{ label: 'Work', number: '+91 98887 11228' }],
    email: 'drainclean@mail.com',
    hasApp: false,
  },
  {
    id: 'elec-9',
    name: 'Solar Panel & Inverter Installation',
    category: 'Electricians',
    avatar: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&q=80',
    primaryPhone: '+91 98997 22339',
    phoneNumbers: [{ label: 'Sales', number: '+91 98997 22339' }],
    email: 'solarenergy@mail.com',
    hasApp: true,
  },
  {
    id: 'elec-10',
    name: '24 Hour Leakage & Geyser Fitting',
    category: 'Electricians',
    avatar: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
    primaryPhone: '+91 98118 33440',
    phoneNumbers: [{ label: 'Direct', number: '+91 98118 33440' }],
    email: 'geyserleakage@mail.com',
    hasApp: false,
  },
];

// 10. Pharmacies & Chemists (10 items)
const pharmacyContacts: PhoneBookContact[] = [
  {
    id: 'pharm-1',
    name: 'Apollo Pharmacy 24/7 Chemist',
    category: 'Pharmacies',
    avatar: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=400&q=80',
    primaryPhone: '+91 1860 500 0101',
    phoneNumbers: [{ label: 'Order Medicine', number: '+91 1860 500 0101' }],
    email: 'help@apollopharmacy.org',
    hasApp: true,
  },
  {
    id: 'pharm-2',
    name: 'MedPlus Health & Medical Store',
    category: 'Pharmacies',
    avatar: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400&q=80',
    primaryPhone: '+91 98119 44551',
    phoneNumbers: [{ label: 'Store', number: '+91 98119 44551' }],
    email: 'care@medplusindia.com',
    hasApp: true,
  },
  {
    id: 'pharm-3',
    name: 'Sanjivani Chemist & Druggists',
    category: 'Pharmacies',
    avatar: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&q=80',
    primaryPhone: '+91 98229 55662',
    phoneNumbers: [{ label: 'Desk', number: '+91 98229 55662' }],
    email: 'sanjivanichemist@mail.com',
    hasApp: false,
  },
  {
    id: 'pharm-4',
    name: 'Tata 1mg Medicine Delivery Hub',
    category: 'Pharmacies',
    avatar: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
    primaryPhone: '+91 98339 66773',
    phoneNumbers: [{ label: 'Delivery', number: '+91 98339 66773' }],
    email: 'contact@1mg.com',
    hasApp: true,
  },
  {
    id: 'pharm-5',
    name: 'Frank Ross Pharmacy & Surgical',
    category: 'Pharmacies',
    avatar: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&q=80',
    primaryPhone: '+91 98449 77884',
    phoneNumbers: [{ label: 'Helpdesk', number: '+91 98449 77884' }],
    email: 'care@frankrosspharmacy.com',
    hasApp: true,
  },
  {
    id: 'pharm-6',
    name: 'LifeCare Ayurvedic & Generic Medicines',
    category: 'Pharmacies',
    avatar: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=400&q=80',
    primaryPhone: '+91 98559 88995',
    phoneNumbers: [{ label: 'Counter', number: '+91 98559 88995' }],
    email: 'lifecaremed@mail.com',
    hasApp: false,
  },
  {
    id: 'pharm-7',
    name: 'Wellness Forever Day & Night Pharmacy',
    category: 'Pharmacies',
    avatar: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=80',
    primaryPhone: '+91 98669 99006',
    phoneNumbers: [{ label: 'Emergency', number: '+91 98669 99006' }],
    email: 'care@wellnessforever.in',
    hasApp: true,
  },
  {
    id: 'pharm-8',
    name: 'Jan Aushadhi Kendra (Govt Generic Store)',
    category: 'Pharmacies',
    avatar: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&q=80',
    primaryPhone: '+91 98779 11227',
    phoneNumbers: [{ label: 'Govt Store', number: '+91 98779 11227' }],
    email: 'janaushadhi@gov.in',
    hasApp: false,
  },
  {
    id: 'pharm-9',
    name: 'Relief Point Chemist & Baby Care',
    category: 'Pharmacies',
    avatar: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80',
    primaryPhone: '+91 98889 22338',
    phoneNumbers: [{ label: 'Shop', number: '+91 98889 22338' }],
    email: 'reliefpoint@mail.com',
    hasApp: false,
  },
  {
    id: 'pharm-10',
    name: 'HealthPlus Diagnostic & Pharmacy',
    category: 'Pharmacies',
    avatar: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&q=80',
    primaryPhone: '+91 98999 33449',
    phoneNumbers: [{ label: 'Front Office', number: '+91 98999 33449' }],
    email: 'healthplus@mail.com',
    hasApp: true,
  },
];

// 10 Curated Categories Requested by the User
const RAW_CATEGORIES: BusinessCategoryGroup[] = [
  {
    id: 'hospitals',
    name: 'Hospitals & Clinics',
    hindiName: 'अस्पताल और क्लीनिक',
    icon: 'hospital',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    businesses: hospitalContacts,
  },
  {
    id: 'salons',
    name: 'Salons & Beauty Parlours',
    hindiName: 'सैलून और ब्यूटी पार्लर',
    icon: 'scissors',
    color: '#DB2777',
    bgColor: '#FCE7F3',
    businesses: salonContacts,
  },
  {
    id: 'tailors',
    name: 'Tailors & Boutiques',
    hindiName: 'दर्जी और बुटीक',
    icon: 'scissors',
    color: '#9333EA',
    bgColor: '#F3E8FF',
    businesses: tailorContacts,
  },
  {
    id: 'carpenters',
    name: 'Carpenters & Woodwork',
    hindiName: 'बढ़ई और लकड़ी का काम',
    icon: 'wrench',
    color: '#D97706',
    bgColor: '#FEF3C7',
    businesses: carpenterContacts,
  },
  {
    id: 'kirana',
    name: 'Kirana & Grocery Shops',
    hindiName: 'किराना और राशन की दुकान',
    icon: 'shopping-basket',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    businesses: kiranaContacts,
  },
  {
    id: 'restaurants',
    name: 'Restaurants & Sweets',
    hindiName: 'रेस्टोरेंट और मिठाई',
    icon: 'utensils',
    color: '#EA580C',
    bgColor: '#FFEDD5',
    businesses: restaurantContacts,
  },
  {
    id: 'banks',
    name: 'Banks & Financial Services',
    hindiName: 'बैंक और वित्तीय सेवाएं',
    icon: 'landmark',
    color: '#2563EB',
    bgColor: '#DBEAFE',
    businesses: bankContacts,
  },
  {
    id: 'mechanics',
    name: 'Automobile & Mechanics',
    hindiName: 'कार और बाइक मैकेनिक',
    icon: 'car',
    color: '#475569',
    bgColor: '#F1F5F9',
    businesses: mechanicContacts,
  },
  {
    id: 'electricians',
    name: 'Electricians & Plumbers',
    hindiName: 'इलेक्ट्रीशियन और प्लंबर',
    icon: 'zap',
    color: '#CA8A04',
    bgColor: '#FEF9C3',
    businesses: electricianContacts,
  },
  {
    id: 'pharmacies',
    name: 'Pharmacies & Chemists',
    hindiName: 'दवाइयां और मेडिकल स्टोर',
    icon: 'heart',
    color: '#059669',
    bgColor: '#D1FAE5',
    businesses: pharmacyContacts,
  },
];

const BACKEND_CATEGORY_METADATA: Record<
  string,
  { hindiName: string; icon: IconName; color: string; bgColor: string }
> = {
  'Technology & SaaS': {
    hindiName: 'टेक्नोलॉजी और सॉफ्टवेयर',
    icon: 'smartphone',
    color: '#6200EA',
    bgColor: '#EDE7F6',
  },
  'Real Estate': {
    hindiName: 'प्रॉपर्टी और रियल एस्टेट',
    icon: 'home',
    color: '#5C6BC0',
    bgColor: '#E8EAF6',
  },
  'Professional Services': {
    hindiName: 'प्रोफेशनल और लीगल सेवाएं',
    icon: 'briefcase',
    color: '#0288D1',
    bgColor: '#E1F5FE',
  },
  'Hospitality & Food': {
    hindiName: 'रेस्टोरेंट और कैफे',
    icon: 'utensils',
    color: '#FF7043',
    bgColor: '#FBE9E7',
  },
  'Logistics & Supply': {
    hindiName: 'लॉजिस्टिक्स और ट्रांसपोर्ट',
    icon: 'car',
    color: '#00897B',
    bgColor: '#E0F2F1',
  },
};

export const BUSINESS_CATEGORIES: BusinessCategoryGroup[] = RAW_CATEGORIES.map((cat) => ({
  ...cat,
  businesses: cat.businesses.map((biz) => ({
    ...biz,
    distance: biz.distance || getBusinessDistance(biz.id, biz.name),
  })),
}));

export const getDynamicBusinessCategories = (
  businessesList?: Business[]
): BusinessCategoryGroup[] => {
  if (!businessesList || businessesList.length === 0) {
    return [];
  }

  const liveCategoryGroups: BusinessCategoryGroup[] = [];
  const groupsByCategory = new Map<string, PhoneBookContact[]>();

  businessesList.forEach((b) => {
    const catName = b.category || 'Other';
    const contact = toContact(b, catName);
    if (!groupsByCategory.has(catName)) {
      groupsByCategory.set(catName, []);
    }
    groupsByCategory.get(catName)!.push(contact);
  });

  // Create top-level category groups exclusively for real backend categories
  groupsByCategory.forEach((bizList, catName) => {
    const meta = BACKEND_CATEGORY_METADATA[catName] || {
      hindiName: catName,
      icon: 'briefcase',
      color: '#0288D1',
      bgColor: '#E1F5FE',
    };

    liveCategoryGroups.push({
      id: `cat-${catName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: catName,
      hindiName: meta.hindiName,
      icon: meta.icon,
      color: meta.color,
      bgColor: meta.bgColor,
      businesses: bizList.map((biz) => ({
        ...biz,
        distance: biz.distance || getBusinessDistance(biz.id, biz.name),
      })),
    });
  });

  return liveCategoryGroups;
};

