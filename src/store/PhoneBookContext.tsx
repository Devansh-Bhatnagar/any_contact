import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { PhoneBookContact } from '../types/phoneBook';
import { RecentChatItem } from '../data/mockChats';
import { ChatMessage } from '../components/phonebook/WhatsAppChatModal';
import { BusinessService } from '../services/businessService';
import { Business } from '../types/business';
import { DeviceContactsService } from '../services/deviceContactsService';
import { StorageService } from '../services/storageService';

export const businessToPhoneContact = (b: Business): PhoneBookContact => ({
  id: b.id,
  name: b.name,
  category: b.category,
  avatar: b.image || '',
  distance: '0.8 km',
  primaryPhone: b.phone,
  phoneNumbers: [{ label: 'Work', number: b.phone }],
  email: b.email || `${b.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@business.com`,
  hasApp: true,
  isFavorite: b.isBestie,
});

interface PhoneBookContextType {
  contacts: PhoneBookContact[];
  blockedContactIds: string[];
  pinnedContactIds: string[];
  mutedContactIds: string[];
  recentContacts: PhoneBookContact[];
  recentChats: RecentChatItem[];
  blockedContacts: PhoneBookContact[];
  favoriteContactIds: string[];
  isLoadingContacts: boolean;
  permissionDenied: boolean;
  blockContact: (contactId: string) => void;
  unblockContact: (contactId: string) => void;
  toggleBlockContact: (contact: PhoneBookContact) => void;
  toggleFavoriteContact: (contactId: string) => void;
  deleteContact: (contactId: string) => void;
  togglePinContact: (contactId: string) => void;
  toggleMuteContact: (contactId: string) => void;
  recordContactView: (contact: PhoneBookContact) => void;
  updateRecentChat: (
    contact: PhoneBookContact,
    lastMessage: string,
    messages: ChatMessage[],
    time?: string,
    timestamp?: number
  ) => void;
  isBlocked: (contactId: string) => boolean;
  isPinned: (contactId: string) => boolean;
  isMuted: (contactId: string) => boolean;
  isFavorite: (contactId: string) => boolean;
  isSplashFinished: boolean;
  setSplashFinished: (finished: boolean) => void;
  refreshContacts: () => Promise<void>;
  loadDeviceContacts: (requestIfMissing?: boolean) => Promise<void>;
}

const PhoneBookContext = createContext<PhoneBookContextType | undefined>(undefined);

export const PhoneBookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contacts, setContacts] = useState<PhoneBookContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [blockedContactRecords, setBlockedContactRecords] = useState<PhoneBookContact[]>([]);
  const [pinnedContactIds, setPinnedContactIds] = useState<string[]>([]);
  const [mutedContactIds, setMutedContactIds] = useState<string[]>([]);
  const [favoriteContactIds, setFavoriteContactIds] = useState<string[]>([]);
  const [recentContacts, setRecentContacts] = useState<PhoneBookContact[]>([]);
  const [recentChats, setRecentChats] = useState<RecentChatItem[]>([]);
  const [isSplashFinished, setSplashFinished] = useState<boolean>(false);

  // Load device contacts via native ContactsContract & ContentResolver
  const loadDeviceContacts = useCallback(async (requestIfMissing: boolean = false) => {
    try {
      setIsLoadingContacts(true);
      const hasPermission = await DeviceContactsService.checkPermission();
      if (!hasPermission) {
        if (requestIfMissing) {
          const granted = await DeviceContactsService.requestPermission();
          if (!granted) {
            setPermissionDenied(true);
            setIsLoadingContacts(false);
            setContacts([]);
            return;
          }
        } else {
          setPermissionDenied(true);
          setIsLoadingContacts(false);
          setContacts([]);
          return;
        }
      }

      setPermissionDenied(false);
      const deviceContacts = await DeviceContactsService.fetchContacts();
      setContacts(deviceContacts);
    } catch (err) {
      console.warn('Failed to load device contacts:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  }, []);

  const refreshContacts = useCallback(async () => {
    await loadDeviceContacts(false);
  }, [loadDeviceContacts]);

  useEffect(() => {
    // Load persisted blocked contacts from storage
    StorageService.getBlockedContacts().then((saved) => {
      if (Array.isArray(saved) && saved.length > 0) {
        setBlockedContactRecords((prev) => {
          if (prev.length === 0) return saved;
          const existingIds = new Set(prev.map((c) => c.id));
          return [...prev, ...saved.filter((c) => c && c.id && !existingIds.has(c.id))];
        });
      }
    });
  }, []);

  useEffect(() => {
    // If permission already granted silently on start, fetch contacts
    DeviceContactsService.checkPermission().then((granted) => {
      if (granted) {
        loadDeviceContacts(false);
      }
    });
  }, [loadDeviceContacts]);

  const blockedContactIds = useMemo(
    () => blockedContactRecords.map((c) => c.id),
    [blockedContactRecords]
  );

  const isFavorite = useCallback(
    (contactId: string) => favoriteContactIds.includes(contactId),
    [favoriteContactIds]
  );

  const isBlocked = useCallback(
    (contactId: string) => blockedContactIds.includes(contactId),
    [blockedContactIds]
  );

  const isPinned = useCallback(
    (contactId: string) => pinnedContactIds.includes(contactId),
    [pinnedContactIds]
  );

  const isMuted = useCallback(
    (contactId: string) => mutedContactIds.includes(contactId),
    [mutedContactIds]
  );

  const blockContact = useCallback(
    (contactId: string) => {
      const matched: PhoneBookContact =
        contacts.find((c) => c.id === contactId) ||
        recentContacts.find((c) => c.id === contactId) || {
          id: contactId,
          name: 'Blocked Contact',
          avatar: '',
          primaryPhone: '',
          phoneNumbers: [],
          email: '',
          hasApp: false,
        };
      setBlockedContactRecords((prev) => {
        if (prev.some((c) => c.id === contactId)) return prev;
        const next = [matched, ...prev];
        StorageService.saveBlockedContacts(next);
        return next;
      });
    },
    [contacts, recentContacts]
  );

  const unblockContact = useCallback((contactId: string) => {
    setBlockedContactRecords((prev) => {
      const next = prev.filter((c) => c.id !== contactId);
      StorageService.saveBlockedContacts(next);
      return next;
    });
  }, []);

  const toggleBlockContact = useCallback((contact: PhoneBookContact) => {
    setBlockedContactRecords((prev) => {
      const alreadyBlocked = prev.some((c) => c.id === contact.id);
      const next = alreadyBlocked
        ? prev.filter((c) => c.id !== contact.id)
        : [contact, ...prev];
      StorageService.saveBlockedContacts(next);
      return next;
    });
  }, []);

  const deleteContact = useCallback((contactId: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    setRecentContacts((prev) => prev.filter((c) => c.id !== contactId));
    setBlockedContactRecords((prev) => {
      const next = prev.filter((c) => c.id !== contactId);
      StorageService.saveBlockedContacts(next);
      return next;
    });
    setPinnedContactIds((prev) => prev.filter((id) => id !== contactId));
    setMutedContactIds((prev) => prev.filter((id) => id !== contactId));
  }, []);

  const togglePinContact = useCallback((contactId: string) => {
    setPinnedContactIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  }, []);

  const toggleMuteContact = useCallback((contactId: string) => {
    setMutedContactIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  }, []);

  const toggleFavoriteContact = useCallback((contactId: string) => {
    setFavoriteContactIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  }, []);

  const recordContactView = useCallback((contact: PhoneBookContact) => {
    setRecentContacts((prev) => {
      const filtered = prev.filter((c) => c.id !== contact.id);
      return [contact, ...filtered];
    });
  }, []);

  const updateRecentChat = useCallback(
    (
      contact: PhoneBookContact,
      lastMessage: string,
      messages: ChatMessage[],
      time?: string,
      timestamp?: number
    ) => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minStr = minutes < 10 ? '0' + minutes : String(minutes);
      const currentTime = time || `${hours}:${minStr} ${ampm}`;
      const currentTimestamp = timestamp || Date.now();

      setRecentChats((prev) => {
        const existingIndex = prev.findIndex(
          (c) =>
            c.id === contact.id ||
            c.phone === contact.primaryPhone ||
            c.name.toLowerCase() === contact.name.toLowerCase()
        );

        if (existingIndex !== -1) {
          const existing = prev[existingIndex];
          const updatedChat: RecentChatItem = {
            ...existing,
            subtitleText: lastMessage,
            subtitleType: 'text',
            time: currentTime,
            timestamp: currentTimestamp,
            isReadByRecipient: true,
            unreadCount: 0,
            messages: messages,
          };
          const rest = prev.filter((_, idx) => idx !== existingIndex);
          return [updatedChat, ...rest];
        } else {
          const newChat: RecentChatItem = {
            id: `chat-${contact.id}`,
            name: contact.name,
            phone: contact.primaryPhone,
            avatarType: contact.avatar ? 'image' : 'letter',
            avatarUrl: contact.avatar,
            avatarLetter: contact.name.charAt(0).toUpperCase(),
            avatarBg: '#0A5C43',
            subtitleType: 'text',
            subtitleText: lastMessage,
            time: currentTime,
            timestamp: currentTimestamp,
            isReadByRecipient: true,
            messages: messages,
            isFavorite: contact.isFavorite,
          };
          return [newChat, ...prev];
        }
      });
    },
    []
  );

  // Dynamic list of all blocked contacts (device contacts, businesses, and chat contacts),
  // enriched with live device contact info when present
  const blockedContacts = useMemo(() => {
    return blockedContactRecords.map((saved) => {
      const live = contacts.find((c) => c.id === saved.id);
      return live ? { ...saved, ...live } : saved;
    });
  }, [blockedContactRecords, contacts]);

  const value = useMemo(
    () => ({
      contacts,
      blockedContactIds,
      pinnedContactIds,
      mutedContactIds,
      favoriteContactIds,
      recentContacts,
      recentChats,
      blockedContacts,
      isLoadingContacts,
      permissionDenied,
      blockContact,
      unblockContact,
      toggleBlockContact,
      toggleFavoriteContact,
      deleteContact,
      togglePinContact,
      toggleMuteContact,
      recordContactView,
      updateRecentChat,
      isBlocked,
      isPinned,
      isMuted,
      isFavorite,
      isSplashFinished,
      setSplashFinished,
      refreshContacts,
      loadDeviceContacts,
    }),
    [
      contacts,
      blockedContactIds,
      pinnedContactIds,
      mutedContactIds,
      favoriteContactIds,
      recentContacts,
      recentChats,
      blockedContacts,
      isLoadingContacts,
      permissionDenied,
      blockContact,
      unblockContact,
      toggleBlockContact,
      toggleFavoriteContact,
      deleteContact,
      togglePinContact,
      toggleMuteContact,
      recordContactView,
      updateRecentChat,
      isBlocked,
      isPinned,
      isMuted,
      isFavorite,
      isSplashFinished,
      refreshContacts,
      loadDeviceContacts,
    ]
  );

  return <PhoneBookContext.Provider value={value}>{children}</PhoneBookContext.Provider>;
};

export const usePhoneBook = (): PhoneBookContextType => {
  const context = useContext(PhoneBookContext);
  if (!context) {
    throw new Error('usePhoneBook must be used within a PhoneBookProvider');
  }
  return context;
};
