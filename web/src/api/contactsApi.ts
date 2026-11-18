/**
 * Contacts Directory & Phonebook API Service for Leads Phone Book Web App
 * Integrates with server endpoints:
 * - GET /api/phonebook/bootstrap (SDUI verified contacts, active stories, lookups)
 * - POST /api/phonebook/leads (CRM lead / new contact creation)
 * - GET /api/phonebook/calls (Recent call records)
 * - POST /api/phonebook/calls (Log outgoing/incoming calls)
 * - POST /api/phonebook/match-contacts (Verified phone number matching)
 */
import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';
import { Contact, EmergencyContact } from '../types/contact';
import { INITIAL_CONTACTS, EMERGENCY_CONTACTS } from '../data/mockContacts';

const AVATAR_FALLBACKS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
];

export interface CreateContactInput {
  name: string;
  primaryPhone: string;
  email?: string;
  category?: string;
  avatar?: string;
  notes?: string;
  offers?: string[];
}

export const contactsApi = {
  /**
   * Fetch live directory contacts from SDUI Bootstrap: GET /api/phonebook/bootstrap
   */
  async getContacts(): Promise<{ contacts: Contact[]; isLive: boolean }> {
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.PHONEBOOK_BOOTSTRAP);

      if (res && Array.isArray(res.contacts) && res.contacts.length > 0) {
        const liveContacts: Contact[] = res.contacts.map((b: any, index: number) => {
          const offers: string[] = [];
          if (b.activeStory?.offerBadge) offers.push(b.activeStory.offerBadge);
          if (b.activeStory?.title) offers.push(b.activeStory.title);

          return {
            id: String(b.id),
            name: b.ownerName || b.businessName || 'Contact Partner',
            avatar: AVATAR_FALLBACKS[index % AVATAR_FALLBACKS.length],
            category: b.category || 'Business',
            primaryPhone: b.phone || '+91 98765 43210',
            phoneNumbers: [
              { label: 'Mobile', number: b.phone || '+91 98765 43210' },
              ...(b.email ? [{ label: 'Email', number: b.email }] : []),
            ],
            email: b.email || `${(b.ownerName || 'contact').toLowerCase().replace(/\s+/g, '')}@example.com`,
            hasApp: true,
            isFavorite: Boolean(b.verified),
            isBlocked: false,
            offers: offers.length > 0 ? offers : undefined,
            notes: b.activeStory?.description || `${b.businessName} - ${b.city || 'Verified Contact'}`,
            lastContacted: b.activeStory?.timeAgo || 'Recently Active',
          };
        });

        return { contacts: liveContacts, isLive: true };
      }
    } catch (err) {
      console.warn('Failed to fetch live contacts from bootstrap, falling back to local:', err);
    }

    return { contacts: INITIAL_CONTACTS, isLive: false };
  },

  /**
   * Create a new contact / lead in CRM pipeline: POST /api/phonebook/leads
   */
  async createContact(input: CreateContactInput): Promise<{ contact: Contact; isLive: boolean }> {
    try {
      const res = await apiClient.post<any>(API_ENDPOINTS.PHONEBOOK_LEADS, {
        businessName: input.name,
        contactPerson: input.name,
        phone: input.primaryPhone,
        email: input.email || undefined,
        category: input.category || 'Personal',
        stageCode: 'NEW',
        note: input.notes || 'Created via Leads Phone Book web client',
      });

      if (res && res.id) {
        const newContact: Contact = {
          id: String(res.id),
          name: input.name,
          primaryPhone: input.primaryPhone,
          phoneNumbers: [{ label: 'Mobile', number: input.primaryPhone }],
          email: input.email || '',
          category: input.category || 'Personal',
          avatar: input.avatar || AVATAR_FALLBACKS[0],
          hasApp: true,
          isFavorite: false,
          isBlocked: false,
          offers: input.offers,
          notes: input.notes,
        };
        return { contact: newContact, isLive: true };
      }
    } catch (err) {
      console.warn('POST /api/phonebook/leads failed, saving locally:', err);
    }

    const fallbackContact: Contact = {
      id: `local-contact-${Date.now()}`,
      name: input.name,
      primaryPhone: input.primaryPhone,
      phoneNumbers: [{ label: 'Mobile', number: input.primaryPhone }],
      email: input.email || '',
      category: input.category || 'Personal',
      avatar: input.avatar || AVATAR_FALLBACKS[0],
      hasApp: true,
      isFavorite: false,
      isBlocked: false,
      offers: input.offers,
      notes: input.notes,
    };
    return { contact: fallbackContact, isLive: false };
  },

  /**
   * Log a call to backend: POST /api/phonebook/calls
   */
  async logCall(data: {
    name: string;
    number: string;
    tag?: string;
    durationSec?: number;
  }): Promise<boolean> {
    try {
      await apiClient.post(API_ENDPOINTS.PHONEBOOK_CALLS, {
        name: data.name,
        number: data.number,
        tag: data.tag || 'Client',
        direction: 'OUTGOING',
        durationSec: data.durationSec || 45,
        isVerified: true,
        isLead: false,
        category: 'Phone Call',
      });
      return true;
    } catch (err) {
      console.warn('Failed to log call to backend:', err);
      return false;
    }
  },

  /**
   * Get Emergency Services Rail contacts
   */
  getEmergencyContacts(): EmergencyContact[] {
    return EMERGENCY_CONTACTS;
  },
};
