import { NativeModules, Platform, Alert } from 'react-native';
import { PhoneBookContact, EmergencyItem } from '../types/phoneBook';
import { BUSINESS_CATEGORIES, BusinessCategoryGroup } from '../data/businessCategoriesData';
import { EMERGENCY_SERVICES } from '../data/mockPhoneBook';

const { VoiceRecognition } = NativeModules;

export interface VoiceCallSearchResult {
  contact: PhoneBookContact;
  source: 'my-contact' | 'business' | 'emergency';
  spokenText: string;
  cleanedQuery: string;
}

// Convert EmergencyItem to PhoneBookContact
const emergencyToContact = (item: EmergencyItem): PhoneBookContact => {
  const avatarMap: Record<string, string> = {
    Police: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=240&q=80',
    Ambulance: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=240&q=80',
    Fire: 'https://images.unsplash.com/photo-1543083477-4f785aeafaa9?w=240&q=80',
    'Snake Catcher': 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?w=240&q=80',
  };

  return {
    id: item.id,
    name: item.title,
    avatar: avatarMap[item.title] || 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=240&q=80',
    primaryPhone: item.number,
    phoneNumbers: [{ label: 'Emergency', number: item.number }],
    email: `${item.title.toLowerCase().replace(/\s+/g, '')}@emergency.gov`,
    hasApp: true,
  };
};

/**
 * Clean spoken voice command text to extract the contact or business name.
 * Handles English and Hindi / Hinglish patterns like:
 * - "call Aarav Sharma" -> "Aarav Sharma"
 * - "call to Aarav" -> "Aarav"
 * - "Aarav Sharma ko call karo" -> "Aarav Sharma"
 * - "call lagao Aarav" -> "Aarav"
 * - "dial Ambulance" -> "Ambulance"
 * - "Aarav Sharma" -> "Aarav Sharma"
 */
export const cleanSpokenText = (rawText: string): string => {
  if (!rawText) return '';

  let text = rawText.trim();

  // Remove common punctuation like quotes, period, question marks at ends
  text = text.replace(/^["'“”‘]+|["'“”‘?.!]+$/g, '').trim();

  // Remove Hindi suffixes: "ko call karo", "ko call lagao", "ko phone karo", "ko mila do", "ko", etc.
  text = text.replace(/\s+(?:ko\s+)?(?:call|phone)\s+(?:karo|lagao|kijiye|milao|kar do|kar dena)$/i, '');
  text = text.replace(/\s+ko\s+call$/i, '');
  text = text.replace(/\s+ko$/i, '');

  // Remove English prefixes: "please call", "make a call to", "call to", "call", "dial", "phone"
  text = text.replace(/^(?:please\s+)?(?:make\s+a\s+call\s+to|make\s+call\s+to|call\s+to|call|dial|phone|ring)\s+/i, '');

  // Remove Hindi prefixes: "call lagao", "call karo", "phone lagao", "phone karo"
  text = text.replace(/^(?:call\s+lagao|call\s+karo|phone\s+lagao|phone\s+karo)\s+/i, '');

  // Remove trailing politeness
  text = text.replace(/\s+(?:please|now)$/i, '');

  return text.trim();
};

/**
 * Collect all business contacts from BUSINESS_CATEGORIES and SAMPLE_BUSINESSES
 */
export const getAllBusinessContacts = (): PhoneBookContact[] => {
  const seenIds = new Set<string>();
  const list: PhoneBookContact[] = [];

  // 1. From BUSINESS_CATEGORIES
  if (BUSINESS_CATEGORIES && Array.isArray(BUSINESS_CATEGORIES)) {
    for (const cat of BUSINESS_CATEGORIES) {
      if (cat.businesses && Array.isArray(cat.businesses)) {
        for (const biz of cat.businesses) {
          if (!seenIds.has(biz.id)) {
            seenIds.add(biz.id);
            list.push(biz);
          }
        }
      }
    }
  }

  return list;
};

/**
 * Find matching contact from:
 * 1. My Contacts (User's phone contacts)
 * 2. Business Categories contacts
 * 3. Emergency Services (Police, Ambulance, Fire, etc.)
 */
export const findContactForVoiceQuery = (
  rawSpokenText: string,
  myContacts: PhoneBookContact[] = []
): VoiceCallSearchResult | null => {
  if (!rawSpokenText || !rawSpokenText.trim()) return null;

  const cleanedQuery = cleanSpokenText(rawSpokenText);
  if (!cleanedQuery) return null;

  const q = cleanedQuery.toLowerCase();
  const rawQ = rawSpokenText.trim().toLowerCase();

  const businessContacts = getAllBusinessContacts();
  const emergencyContacts = EMERGENCY_SERVICES.map(emergencyToContact);

  // Normalize phone number helper
  const normalizeNum = (num: string) => num.replace(/[^0-9]/g, '');
  const digitsOnly = normalizeNum(q);

  // 1. Check direct phone/emergency number match (e.g. "100", "108", "101", "2")
  if (digitsOnly.length > 0) {
    // Check emergency numbers first
    for (const em of emergencyContacts) {
      if (normalizeNum(em.primaryPhone) === digitsOnly) {
        return {
          contact: em,
          source: 'emergency',
          spokenText: rawSpokenText,
          cleanedQuery,
        };
      }
    }
    // Check contact phone numbers
    for (const c of myContacts) {
      if (normalizeNum(c.primaryPhone).endsWith(digitsOnly) || digitsOnly.endsWith(normalizeNum(c.primaryPhone))) {
        return {
          contact: c,
          source: 'my-contact',
          spokenText: rawSpokenText,
          cleanedQuery,
        };
      }
    }
  }

  // 2. Exact Name Match (Case-Insensitive)
  // Priority: My Contacts > Emergency > Business
  for (const c of myContacts) {
    if (c.name.trim().toLowerCase() === q || c.name.trim().toLowerCase() === rawQ) {
      return { contact: c, source: 'my-contact', spokenText: rawSpokenText, cleanedQuery };
    }
  }

  for (const em of emergencyContacts) {
    if (em.name.trim().toLowerCase() === q || em.name.trim().toLowerCase() === rawQ) {
      return { contact: em, source: 'emergency', spokenText: rawSpokenText, cleanedQuery };
    }
  }

  for (const b of businessContacts) {
    if (b.name.trim().toLowerCase() === q || b.name.trim().toLowerCase() === rawQ) {
      return { contact: b, source: 'business', spokenText: rawSpokenText, cleanedQuery };
    }
  }

  // 3. StartsWith Name Match (e.g. "Aarav" matches "Aarav Sharma", "Fortis" matches "Fortis Escorts...")
  for (const c of myContacts) {
    const cName = c.name.trim().toLowerCase();
    if (cName.startsWith(q) || q.startsWith(cName)) {
      return { contact: c, source: 'my-contact', spokenText: rawSpokenText, cleanedQuery };
    }
  }

  for (const em of emergencyContacts) {
    const emName = em.name.trim().toLowerCase();
    if (emName.startsWith(q) || q.startsWith(emName)) {
      return { contact: em, source: 'emergency', spokenText: rawSpokenText, cleanedQuery };
    }
  }

  for (const b of businessContacts) {
    const bName = b.name.trim().toLowerCase();
    if (bName.startsWith(q) || q.startsWith(bName)) {
      return { contact: b, source: 'business', spokenText: rawSpokenText, cleanedQuery };
    }
  }

  // 4. Token Overlap Match (e.g. "sharma aarav", "aarav sharma", "fortis hospital", "apollo")
  const queryTokens = q.split(/\s+/).filter((t) => t.length > 1);

  if (queryTokens.length > 0) {
    // Check myContacts for all token matches
    for (const c of myContacts) {
      const cLower = c.name.toLowerCase();
      const allTokensMatch = queryTokens.every((token) => cLower.includes(token));
      if (allTokensMatch) {
        return { contact: c, source: 'my-contact', spokenText: rawSpokenText, cleanedQuery };
      }
    }

    // Check emergency contacts
    for (const em of emergencyContacts) {
      const emLower = em.name.toLowerCase();
      const anyTokenMatch = queryTokens.some((token) => emLower.includes(token));
      if (anyTokenMatch) {
        return { contact: em, source: 'emergency', spokenText: rawSpokenText, cleanedQuery };
      }
    }

    // Check business contacts for all token matches
    for (const b of businessContacts) {
      const bLower = b.name.toLowerCase();
      const allTokensMatch = queryTokens.every((token) => bLower.includes(token));
      if (allTokensMatch) {
        return { contact: b, source: 'business', spokenText: rawSpokenText, cleanedQuery };
      }
    }

    // Check business contacts for ANY primary token match (e.g. "fortis", "max", "jawed", "lakme", "apollo")
    for (const b of businessContacts) {
      const bLower = b.name.toLowerCase();
      const anyTokenMatch = queryTokens.some((token) => token.length >= 3 && bLower.includes(token));
      if (anyTokenMatch) {
        return { contact: b, source: 'business', spokenText: rawSpokenText, cleanedQuery };
      }
    }
  }

  // 5. Substring Match (e.g. contains query)
  for (const c of myContacts) {
    if (c.name.toLowerCase().includes(q)) {
      return { contact: c, source: 'my-contact', spokenText: rawSpokenText, cleanedQuery };
    }
  }

  for (const b of businessContacts) {
    if (b.name.toLowerCase().includes(q)) {
      return { contact: b, source: 'business', spokenText: rawSpokenText, cleanedQuery };
    }
  }

  // 6. Category Name / Generic Intent Match
  // e.g. "hospital", "doctor", "restaurant", "sweets", "kirana", "tailor", "carpenter", "ambulance", "police", "salon", "mechanic", "pharmacy", "bank"
  const categoryKeywords: Record<string, string> = {
    restaurant: 'Restaurants',
    restaurants: 'Restaurants',
    resturent: 'Restaurants',
    resturents: 'Restaurants',
    restaurent: 'Restaurants',
    restaurents: 'Restaurants',
    sweet: 'Restaurants',
    sweets: 'Restaurants',
    mithai: 'Restaurants',
    dhaba: 'Restaurants',
    food: 'Restaurants',
    hospital: 'Hospitals',
    hospitals: 'Hospitals',
    doctor: 'Hospitals',
    doctors: 'Hospitals',
    clinic: 'Hospitals',
    salon: 'Salons',
    salons: 'Salons',
    parlour: 'Salons',
    beauty: 'Salons',
    tailor: 'Tailors',
    tailors: 'Tailors',
    boutique: 'Tailors',
    darzi: 'Tailors',
    carpenter: 'Carpenters',
    carpenters: 'Carpenters',
    woodwork: 'Carpenters',
    furniture: 'Carpenters',
    kirana: 'Kirana',
    grocery: 'Kirana',
    groceries: 'Kirana',
    ration: 'Kirana',
    mechanic: 'Automobile & Mechanics',
    mechanics: 'Automobile & Mechanics',
    car: 'Automobile & Mechanics',
    bike: 'Automobile & Mechanics',
    garage: 'Automobile & Mechanics',
    pharmacy: 'Pharmacies & Chemists',
    chemist: 'Pharmacies & Chemists',
    medicine: 'Pharmacies & Chemists',
    medical: 'Pharmacies & Chemists',
    bank: 'Banks & Financial Services',
    electrician: 'Electricians & Plumbers',
    plumber: 'Electricians & Plumbers',
  };

  for (const [kw, catName] of Object.entries(categoryKeywords)) {
    if (q.includes(kw)) {
      // Find top business in this category
      const catBiz = businessContacts.find(
        (b) => b.category?.toLowerCase() === catName.toLowerCase() || b.category?.toLowerCase().includes(kw)
      );
      if (catBiz) {
        return { contact: catBiz, source: 'business', spokenText: rawSpokenText, cleanedQuery };
      }
    }
  }

  return null;
};

/**
 * Check if Native Voice Recognition is available
 */
export const isVoiceRecognitionAvailable = (): boolean => {
  return Platform.OS === 'android' && !!VoiceRecognition && typeof VoiceRecognition.startSpeechRecognition === 'function';
};

/**
 * Trigger native Android Speech Recognition
 */
export const startNativeSpeechRecognition = async (
  prompt: string = "Say 'Call Aarav Sharma' or contact name"
): Promise<string> => {
  if (isVoiceRecognitionAvailable()) {
    return await VoiceRecognition.startSpeechRecognition(prompt);
  }
  throw new Error('Native Voice Recognition is not available on this device');
};

/**
 * Handle direct voice call:
 * Triggers native voice speech recognition.
 * Matches spoken text with contacts/businesses/emergency services.
 * If found: immediately dials without opening any extra modal.
 * If not found: shows Alert: "no contact found with this name".
 */
export const handleDirectVoiceCall = async (
  myContacts: PhoneBookContact[],
  onCall: (contact: PhoneBookContact) => void,
  onNotFound?: (spokenText?: string) => void
) => {
  try {
    if (!isVoiceRecognitionAvailable()) {
      if (onNotFound) {
        onNotFound();
      } else {
        Alert.alert('Notice', 'Voice recognition is not available on this device');
      }
      return;
    }

    const spoken = await startNativeSpeechRecognition("Say 'Call Aarav Sharma' or contact name");
    if (!spoken || !spoken.trim()) return;

    const result = findContactForVoiceQuery(spoken, myContacts);
    if (result && result.contact) {
      onCall(result.contact);
    } else {
      if (onNotFound) {
        onNotFound(spoken);
      } else {
        Alert.alert('No contact found with this name');
      }
    }
  } catch (err: any) {
    const errMsg = err?.message || '';
    if (errMsg.includes('CANCELLED') || err?.code === 'CANCELLED') {
      return;
    }
    if (onNotFound) {
      onNotFound();
    } else {
      Alert.alert('No contact found with this name');
    }
  }
};

export interface VoiceCategorySearchResult {
  category: BusinessCategoryGroup;
  type: 'category' | 'business';
  matchedBusiness?: PhoneBookContact;
  spokenText: string;
  cleanedQuery: string;
}

const CATEGORY_MATCHERS: {
  id: string;
  aliases: string[];
}[] = [
  {
    id: 'restaurants',
    aliases: [
      'restaurant', 'restaurants', 'resturent', 'resturents', 'restaurent', 'restaurents',
      'sweet', 'sweets', 'mithai', 'dhaba', 'food', 'cafe', 'dining', 'bhojanalaya',
      'रेस्टोरेंट', 'मिठाई', 'खाना', 'होटल'
    ],
  },
  {
    id: 'hospitals',
    aliases: [
      'hospital', 'hospitals', 'clinic', 'clinics', 'doctor', 'doctors', 'healthcare',
      'medical centre', 'hospital and clinic', 'hospitals and clinics',
      'अस्पताल', 'क्लीनिक', 'डॉक्टर'
    ],
  },
  {
    id: 'salons',
    aliases: [
      'salon', 'salons', 'beauty', 'parlour', 'parlours', 'parlor', 'parlors', 'spa',
      'haircut', 'makeup', 'beauty parlour', 'salons and beauty',
      'सैलून', 'ब्यूटी', 'पार्लर'
    ],
  },
  {
    id: 'tailors',
    aliases: [
      'tailor', 'tailors', 'boutique', 'boutiques', 'darzi', 'stitching',
      'tailors and boutiques', 'दर्जी', 'बुटीक'
    ],
  },
  {
    id: 'carpenters',
    aliases: [
      'carpenter', 'carpenters', 'woodwork', 'furniture', 'badhai',
      'carpenters and woodwork', 'बढ़ई', 'लकड़ी'
    ],
  },
  {
    id: 'kirana',
    aliases: [
      'kirana', 'grocery', 'groceries', 'ration', 'general store', 'supermarket',
      'kirana and grocery', 'किराना', 'राशन'
    ],
  },
  {
    id: 'banks',
    aliases: [
      'bank', 'banks', 'financial', 'finance', 'atm', 'loan', 'insurance',
      'banks and financial', 'बैंक', 'फाइनेंस'
    ],
  },
  {
    id: 'mechanics',
    aliases: [
      'mechanic', 'mechanics', 'automobile', 'car repair', 'bike repair', 'garage',
      'automobile and mechanics', 'कार', 'बाइक', 'मैकेनिक', 'गैराज'
    ],
  },
  {
    id: 'electricians',
    aliases: [
      'electrician', 'electricians', 'plumber', 'plumbers', 'electricity', 'wiring',
      'plumbing', 'electricians and plumbers', 'bijli', 'इलेक्ट्रीशियन', 'प्लंबर'
    ],
  },
  {
    id: 'pharmacies',
    aliases: [
      'pharmacy', 'pharmacies', 'chemist', 'chemists', 'medicine', 'medicines',
      'medical', 'medical store', 'pharmacies and chemists', 'dawa', 'dawai',
      'दवाइयां', 'मेडिकल', 'दवा'
    ],
  },
];

/**
 * Clean spoken voice search command text to extract the category or business query.
 * Strips search prefixes like "search", "search for", "open", "show", "dhoondo", etc.
 */
export const cleanSearchSpokenText = (rawText: string): string => {
  if (!rawText) return '';
  let text = rawText.trim();
  text = text.replace(/^["'“”‘]+|["'“”‘?.!]+$/g, '').trim();

  // Remove common speech search prefixes in English & Hindi
  text = text.replace(
    /^(?:please\s+)?(?:search\s+(?:for\s+)?|find\s+(?:me\s+)?|look\s+for\s+|open\s+|show\s+(?:me\s+)?|dhoondo\s+|khojo\s+|kholo\s+|dikhao\s+)/i,
    ''
  );

  // Remove common speech search suffixes in English & Hindi
  text = text.replace(
    /\s+(?:search\s+karo|search|dhoondo|khojo|kholo|dikhao|batao|open\s+karo|khol\s+do)$/i,
    ''
  );

  return text.trim();
};

const normalizeForMatch = (s: string): string => {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Find matching business category or business contact for a voice search query.
 * Matches spoken categories (e.g. "search restaurants and sweets", "restaurants", "sweets", "hospitals", etc.)
 * or specific businesses without triggering any phone calls.
 */
export const findCategoryOrBusinessForVoiceQuery = (
  rawSpokenText: string,
  categories: BusinessCategoryGroup[] = BUSINESS_CATEGORIES
): VoiceCategorySearchResult | null => {
  if (!rawSpokenText || !rawSpokenText.trim()) return null;

  const cleanedQuery = cleanSearchSpokenText(rawSpokenText);
  if (!cleanedQuery) return null;

  const normCleaned = normalizeForMatch(cleanedQuery);
  if (!normCleaned) return null;

  const tokens = normCleaned
    .split(/\s+/)
    .filter((t) => t.length > 1 && !['and', 'or', 'the', 'a', 'of', 'in', 'ki', 'ke', 'ka', 'ko'].includes(t));

  // 1. Direct Category Name Match (e.g. "restaurants and sweets", "restaurants & sweets")
  for (const cat of categories) {
    const normName = normalizeForMatch(cat.name);
    if (
      normName === normCleaned ||
      (normCleaned.length >= 3 && normName.includes(normCleaned)) ||
      (normName.length >= 3 && normCleaned.includes(normName)) ||
      (cat.hindiName && (cat.hindiName.includes(cleanedQuery) || cleanedQuery.includes(cat.hindiName)))
    ) {
      return {
        category: cat,
        type: 'category',
        spokenText: rawSpokenText,
        cleanedQuery,
      };
    }
  }

  // 2. Alias / Keyword Match for Category
  let bestCat: BusinessCategoryGroup | null = null;
  let bestScore = 0;

  for (const matcher of CATEGORY_MATCHERS) {
    const cat = categories.find((c) => c.id === matcher.id);
    if (!cat) continue;

    let score = 0;
    for (const alias of matcher.aliases) {
      const normAlias = normalizeForMatch(alias);
      if (!normAlias || normAlias.length < 2) continue;

      if (normCleaned === normAlias) {
        score = Math.max(score, 95);
      } else if (normCleaned.length >= 3 && normCleaned.includes(normAlias)) {
        score = Math.max(score, 85);
      } else if (tokens.some((t) => t === normAlias)) {
        score = Math.max(score, 75);
      } else if (tokens.some((t) => normAlias.includes(t) && t.length >= 4)) {
        score = Math.max(score, 65);
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCat = cat;
    }
  }

  if (bestCat && bestScore >= 65) {
    return {
      category: bestCat,
      type: 'category',
      spokenText: rawSpokenText,
      cleanedQuery,
    };
  }

  // 3. Match Specific Business Contact Name within categories
  // e.g. "Haldiram", "Bikaner Sweets", "Fortis Escorts"
  for (const cat of categories) {
    for (const b of cat.businesses) {
      const bNorm = normalizeForMatch(b.name);
      if (bNorm === normCleaned || bNorm.startsWith(normCleaned) || normCleaned.startsWith(bNorm)) {
        return {
          category: cat,
          type: 'business',
          matchedBusiness: b,
          spokenText: rawSpokenText,
          cleanedQuery,
        };
      }
    }
  }

  // 4. Token overlap match on business contacts
  if (tokens.length > 0) {
    for (const cat of categories) {
      for (const b of cat.businesses) {
        const bNorm = normalizeForMatch(b.name);
        const allTokensMatch = tokens.every((token) => bNorm.includes(token));
        if (allTokensMatch) {
          return {
            category: cat,
            type: 'business',
            matchedBusiness: b,
            spokenText: rawSpokenText,
            cleanedQuery,
          };
        }
      }
    }
  }

  // 5. Fallback substring match on business contacts
  for (const cat of categories) {
    for (const b of cat.businesses) {
      const bNorm = normalizeForMatch(b.name);
      if (bNorm.includes(normCleaned) || normCleaned.includes(bNorm)) {
        return {
          category: cat,
          type: 'business',
          matchedBusiness: b,
          spokenText: rawSpokenText,
          cleanedQuery,
        };
      }
    }
  }

  return null;
};

/**
 * Detect if the spoken voice command expresses an intent to place a phone call.
 * Matches keywords like "call", "dial", "phone", "call lagao", "call karo", "ko call karo", etc.
 */
export const isVoiceCallIntent = (rawText: string): boolean => {
  if (!rawText) return false;
  const lower = rawText.toLowerCase().trim();

  // Explicit English call prefixes
  if (/^(?:please\s+)?(?:call|dial|phone|ring)\b/i.test(lower)) return true;
  if (/^(?:make\s+a\s+call\s+to|make\s+call\s+to|call\s+to)\b/i.test(lower)) return true;

  // Hindi call prefixes
  if (/^(?:call\s+lagao|call\s+karo|phone\s+lagao|phone\s+karo)\b/i.test(lower)) return true;

  // Hindi call suffixes
  if (/\b(?:ko\s+)?(?:call|phone)\s+(?:karo|lagao|kijiye|milao|kar\s+do|kar\s+dena)$/i.test(lower)) return true;
  if (/\bko\s+(?:call|phone)$/i.test(lower)) return true;
  if (/\b(?:call|phone)\s+(?:karo|lagao)$/i.test(lower)) return true;

  // If contains standalone word "call" or "dial", and not "search"
  if (/\b(?:call|dial)\b/i.test(lower) && !/\b(?:search|dhoondo|khojo)\b/i.test(lower)) return true;

  return false;
};

/**
 * Resolves a contact to call for a voice call query.
 * Checks personal contacts, emergency services, specific business contacts,
 * and if a category was spoken (e.g. "call restaurants and sweets", "call hospitals"),
 * resolves to the top verified business contact in that category.
 */
export const findContactOrCategoryForVoiceCall = (
  rawSpokenText: string,
  myContacts: PhoneBookContact[] = [],
  categories: BusinessCategoryGroup[] = BUSINESS_CATEGORIES
): PhoneBookContact | null => {
  if (!rawSpokenText || !rawSpokenText.trim()) return null;

  // 1. Try finding direct contact match (personal contact, emergency service, specific business name)
  const contactResult = findContactForVoiceQuery(rawSpokenText, myContacts);
  if (contactResult && contactResult.contact) {
    return contactResult.contact;
  }

  // 2. Check if a category was spoken (e.g. "call restaurants and sweets", "call hospitals")
  const catResult = findCategoryOrBusinessForVoiceQuery(rawSpokenText, categories);
  if (catResult) {
    if (catResult.matchedBusiness) {
      return catResult.matchedBusiness;
    }
    if (catResult.category && catResult.category.businesses && catResult.category.businesses.length > 0) {
      return catResult.category.businesses[0];
    }
  }

  return null;
};

