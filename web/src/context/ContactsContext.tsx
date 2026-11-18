import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Contact, EmergencyContact } from '../types/contact';
import { contactsApi } from '../api/contactsApi';
import { INITIAL_CONTACTS } from '../data/mockContacts';

interface ContactsContextType {
  contacts: Contact[];
  emergencyContacts: EmergencyContact[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFilter: 'all' | 'favorites' | 'hasApp' | 'business';
  setActiveFilter: (f: 'all' | 'favorites' | 'hasApp' | 'business') => void;
  filteredContacts: Contact[];
  isLoading: boolean;
  isLiveBackend: boolean;
  refreshContacts: () => Promise<void>;
  addContact: (c: Omit<Contact, 'id'>) => Promise<Contact>;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleBlock: (id: string) => void;
  logCall: (data: { name: string; number: string; tag?: string }) => Promise<void>;
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

export const ContactsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('lpb_contacts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return INITIAL_CONTACTS;
  });

  const [emergencyContacts] = useState<EmergencyContact[]>(contactsApi.getEmergencyContacts());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'hasApp' | 'business'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('lpb_contacts', JSON.stringify(contacts));
    } catch {
      // ignore
    }
  }, [contacts]);

  // Fetch live contacts from SDUI bootstrap on mount
  const refreshContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await contactsApi.getContacts();
      setIsLiveBackend(result.isLive);

      if (result.contacts && result.contacts.length > 0) {
        setContacts((prev) => {
          // Keep locally user-added contacts that aren't on server yet
          const localAdded = prev.filter((c) => c.id.startsWith('local-'));
          const liveIds = new Set(result.contacts.map((c) => c.id));
          const uniqueLocal = localAdded.filter((c) => !liveIds.has(c.id));
          return [...uniqueLocal, ...result.contacts];
        });
      }
    } catch (err) {
      console.warn('Backend contacts refresh failed, keeping cached/local data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshContacts();
  }, [refreshContacts]);

  const addContact = async (contactData: Omit<Contact, 'id'>): Promise<Contact> => {
    const res = await contactsApi.createContact({
      name: contactData.name,
      primaryPhone: contactData.primaryPhone,
      email: contactData.email,
      category: contactData.category,
      avatar: contactData.avatar,
      notes: contactData.notes,
      offers: contactData.offers,
    });

    const newContact: Contact = {
      ...contactData,
      id: res.contact.id,
    };

    setContacts((prev) => [newContact, ...prev.filter((c) => c.id !== newContact.id)]);
    return newContact;
  };

  const updateContact = (id: string, updates: Partial<Contact>) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const toggleFavorite = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  };

  const toggleBlock = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isBlocked: !c.isBlocked } : c))
    );
  };

  const logCall = async (data: { name: string; number: string; tag?: string }) => {
    await contactsApi.logCall(data);
  };

  const filteredContacts = useMemo(() => {
    return contacts
      .filter((contact) => !contact.isBlocked)
      .filter((contact) => {
        if (activeFilter === 'favorites') return contact.isFavorite;
        if (activeFilter === 'hasApp') return contact.hasApp;
        if (activeFilter === 'business') return contact.category === 'Business' || (contact.offers && contact.offers.length > 0);
        return true;
      })
      .filter((contact) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          contact.name.toLowerCase().includes(q) ||
          contact.primaryPhone.includes(q) ||
          (contact.email && contact.email.toLowerCase().includes(q)) ||
          (contact.category && contact.category.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts, searchQuery, activeFilter]);

  return (
    <ContactsContext.Provider
      value={{
        contacts,
        emergencyContacts,
        searchQuery,
        setSearchQuery,
        activeFilter,
        setActiveFilter,
        filteredContacts,
        isLoading,
        isLiveBackend,
        refreshContacts,
        addContact,
        updateContact,
        deleteContact,
        toggleFavorite,
        toggleBlock,
        logCall,
      }}
    >
      {children}
    </ContactsContext.Provider>
  );
};

export const useContacts = () => {
  const context = useContext(ContactsContext);
  if (!context) throw new Error('useContacts must be used within ContactsProvider');
  return context;
};
