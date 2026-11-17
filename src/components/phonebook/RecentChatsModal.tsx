import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhoneBookContact } from '../../types/phoneBook';
import { Icon } from '../common/Icon';
import { useTheme } from '../../hooks/useTheme';
import { usePhoneBook } from '../../store/PhoneBookContext';
import { ChatMessage } from './WhatsAppChatModal';
import { RecentChatItem } from '../../data/mockChats';

export type { RecentChatItem };

interface RecentChatsModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenChat: (contact: PhoneBookContact, initialMessages?: ChatMessage[]) => void;
}

// Helper to calculate numeric score for WhatsApp-style chronological sorting (most recent on top)
export const getTimeScore = (timeStr?: string, timestamp?: number): number => {
  if (timestamp && typeof timestamp === 'number' && !isNaN(timestamp)) {
    return timestamp;
  }
  if (!timeStr) return 0;

  const now = Date.now();
  const lower = timeStr.trim().toLowerCase();

  if (lower.includes('just now') || lower === 'now') {
    return now;
  }

  // e.g. "10 mins ago", "10 min ago", "2m ago"
  const minMatch = lower.match(/(\d+)\s*m/);
  if (minMatch) {
    const mins = parseInt(minMatch[1], 10) || 1;
    return now - mins * 60 * 1000;
  }

  // e.g. "2 hours ago", "1 hr ago"
  const hrMatch = lower.match(/(\d+)\s*h/);
  if (hrMatch) {
    const hrs = parseInt(hrMatch[1], 10) || 1;
    return now - hrs * 3600 * 1000;
  }

  // e.g. "5:11 PM", "12:32 PM", "09:45 AM"
  const time12Match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (time12Match) {
    let hours = parseInt(time12Match[1], 10);
    const minutes = parseInt(time12Match[2], 10);
    const ampm = time12Match[3]?.toUpperCase();

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    if (d.getTime() > now) {
      return d.getTime() - 24 * 3600 * 1000;
    }
    return d.getTime();
  }

  if (lower === 'yesterday') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(18, 0, 0, 0);
    return d.getTime();
  }

  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = daysOfWeek.findIndex((d) => lower.includes(d));
  if (dayIndex !== -1) {
    const todayIndex = new Date().getDay();
    let diffDays = todayIndex - dayIndex;
    if (diffDays <= 0) diffDays += 7;
    const d = new Date();
    d.setDate(d.getDate() - diffDays);
    d.setHours(14, 0, 0, 0);
    return d.getTime();
  }

  const parsed = Date.parse(timeStr);
  if (!isNaN(parsed)) {
    return parsed;
  }

  return 0;
};

export const RecentChatsModal: React.FC<RecentChatsModalProps> = ({
  visible,
  onClose,
  onOpenChat,
}) => {
  const { isDark, colors } = useTheme();
  const { recentChats, isFavorite, contacts } = usePhoneBook();
  const insets = useSafeAreaInsets();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 20
  );

  // Map real active chats from context, enriched with contact information and chronologically sorted
  const recentContactChats: RecentChatItem[] = useMemo(() => {
    if (!recentChats || recentChats.length === 0) {
      return [];
    }

    const resolved = recentChats.map((chat) => {
      const matched = contacts.find(
        (c) =>
          c.id === chat.id ||
          c.primaryPhone === chat.phone ||
          c.name.toLowerCase() === chat.name.toLowerCase()
      );

      return {
        ...chat,
        name: matched?.name || chat.name,
        phone: matched?.primaryPhone || chat.phone,
        avatarUrl: chat.avatarUrl || matched?.avatar || '',
        isFavorite: matched ? isFavorite(matched.id) : (isFavorite(chat.id) || chat.isFavorite),
        timestamp: chat.timestamp || getTimeScore(chat.time),
      };
    });

    return resolved.sort((a, b) => {
      const scoreA = a.timestamp || getTimeScore(a.time);
      const scoreB = b.timestamp || getTimeScore(b.time);
      return scoreB - scoreA;
    });
  }, [recentChats, contacts, isFavorite]);

  // Dynamic filter pills showing actual unread count & groups
  const unreadCount = useMemo(() => {
    return recentContactChats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [recentContactChats]);

  const groupsCount = useMemo(() => {
    return recentContactChats.filter((c) => c.isGroup).length;
  }, [recentContactChats]);

  const filterPills = useMemo(() => [
    { key: 'all', label: 'All' },
    { key: 'unread', label: unreadCount > 0 ? `Unread ${unreadCount}` : 'Unread' },
    { key: 'favorites', label: 'Favorites' },
    { key: 'groups', label: groupsCount > 0 ? `Groups ${groupsCount}` : 'Groups' },
  ], [unreadCount, groupsCount]);

  // Filter chats based on tab and search
  const filteredChats = useMemo(() => {
    let list = recentContactChats;

    if (activeFilter === 'unread') {
      list = list.filter((c) => (c.unreadCount || 0) > 0);
    } else if (activeFilter === 'favorites') {
      list = list.filter((c) => c.isFavorite);
    } else if (activeFilter === 'groups') {
      list = list.filter((c) => c.isGroup);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.subtitleText.toLowerCase().includes(q)
      );
    }

    return list;
  }, [recentContactChats, activeFilter, searchQuery]);

  const handleSelectChat = (chat: RecentChatItem) => {
    // Find matching contact from full contacts list to get real avatar if available
    const matched = contacts.find(
      (c) =>
        c.id === chat.id ||
        c.primaryPhone === chat.phone ||
        c.name.toLowerCase() === chat.name.toLowerCase()
    );

    const resolvedAvatar = chat.avatarUrl || matched?.avatar || '';

    const contact: PhoneBookContact = matched
      ? { ...matched, avatar: resolvedAvatar || matched.avatar }
      : {
          id: chat.id,
          name: chat.name,
          avatar: resolvedAvatar,
          primaryPhone: chat.phone,
          phoneNumbers: [{ label: 'Mobile', number: chat.phone }],
          email: `${chat.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@chat.com`,
          hasApp: true,
          isFavorite: chat.isFavorite,
        };
    onOpenChat(contact, chat.messages);
  };

  // WhatsApp-faithful theme styling
  const bgColor = isDark ? '#111B21' : '#FFFFFF';
  const headerBg = isDark ? '#111B21' : '#FFFFFF';
  const titleColor = isDark ? '#E9EDEF' : '#111B21';
  const subtextColor = isDark ? '#8696A0' : '#667781';
  const pillInactiveBg = isDark ? '#202C33' : '#F0F2F5';
  const pillActiveBg = isDark ? '#0A3323' : '#D9FDD3';
  const pillActiveText = isDark ? '#00A884' : '#008069';
  const dividerColor = isDark ? '#1F2C34' : '#EFEAE2';
  const searchBarBg = isDark ? '#202C33' : '#F0F2F5';

  const AVATAR_COLORS = [
    '#0866FF',
    '#059669',
    '#7C3AED',
    '#D97706',
    '#DC2626',
    '#2563EB',
    '#0D9488',
    '#9333EA',
    '#EA580C',
    '#4F46E5',
  ];

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  };

  // Render individual avatar
  const renderAvatar = (chat: RecentChatItem) => {
    if (chat.avatarUrl && typeof chat.avatarUrl === 'string' && chat.avatarUrl.trim().length > 0) {
      return (
        <Image
          source={{ uri: chat.avatarUrl }}
          style={styles.avatarImage}
          resizeMode="cover"
        />
      );
    }

    return (
      <View style={[styles.avatarCircle, { backgroundColor: chat.avatarBg || getAvatarColor(chat.name) }]}>
        <Text style={styles.avatarLetter}>
          {chat.avatarLetter || chat.name.charAt(0).toUpperCase() || 'C'}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Top Header */}
        <View style={[styles.topHeader, { paddingTop: topInset + 10, backgroundColor: headerBg }]}>
          {isSearching ? (
            <View style={styles.headerSearchWrap}>
              <TouchableOpacity
                onPress={() => {
                  setIsSearching(false);
                  setSearchQuery('');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.headerBackBtn}
              >
                <Icon name="arrow-left" size={22} color={titleColor} strokeWidth={2.4} />
              </TouchableOpacity>
              <TextInput
                style={[
                  styles.headerSearchInput,
                  { backgroundColor: searchBarBg, color: titleColor },
                ]}
                placeholder="Search chats or messages..."
                placeholderTextColor={subtextColor}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.searchClearBtn}
                >
                  <Icon name="close" size={18} color={subtextColor} strokeWidth={2.2} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.headerMainRow}>
              <View style={styles.headerLeft}>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.headerBackBtn}
                >
                  <Icon name="arrow-left" size={22} color={titleColor} strokeWidth={2.4} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: titleColor }]}>Chats</Text>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.headerIconBtn}
                  onPress={() => setIsSearching(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="search" size={21} color={titleColor} strokeWidth={2.2} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerIconBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="camera" size={21} color={titleColor} strokeWidth={2.2} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerIconBtn}
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="more-vertical" size={21} color={titleColor} strokeWidth={2.2} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Filter Pills Row (Exact layout from screenshot: All, Unread 32, Favorites, Groups 3, +) */}
        <View style={styles.pillsContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={filterPills}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.pillsList}
            renderItem={({ item }) => {
              const isActive = activeFilter === item.key;
              return (
                <TouchableOpacity
                  style={[
                    styles.pillButton,
                    {
                      backgroundColor: isActive ? pillActiveBg : pillInactiveBg,
                    },
                    isActive && styles.pillActiveBorder,
                  ]}
                  onPress={() => setActiveFilter(item.key)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.pillText,
                      {
                        color: isActive ? pillActiveText : subtextColor,
                        fontWeight: isActive ? '700' : '500',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListFooterComponent={
              <TouchableOpacity
                style={[styles.pillAddBtn, { backgroundColor: pillInactiveBg }]}
                activeOpacity={0.75}
              >
                <Icon name="plus" size={17} color={subtextColor} strokeWidth={2.4} />
              </TouchableOpacity>
            }
          />
        </View>

        {/* WhatsApp Chat Listing */}
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatListContent}
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                style={styles.chatItem}
                onPress={() => handleSelectChat(item)}
                activeOpacity={0.65}
              >
                {/* Left Avatar */}
                <View style={styles.avatarWrapper}>
                  {renderAvatar(item)}
                </View>

                {/* Center Content & Right Metadata */}
                <View style={[styles.chatInfoWrapper, { borderBottomColor: dividerColor }]}>
                  {/* Top Row: Name & Time */}
                  <View style={styles.nameRow}>
                    <Text
                      style={[styles.chatName, { color: titleColor }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.chatTime, { color: subtextColor }]}>
                      {item.time}
                    </Text>
                  </View>

                  {/* Bottom Row: Read receipt + Icon + Message Text snippet + Unread badge */}
                  <View style={styles.messageRow}>
                    <View style={styles.messageSnippetWrap}>
                      {/* Read receipts: blue double check */}
                      {item.isReadByRecipient && (
                        <View style={styles.tickWrapper}>
                          <Icon name="double-check" size={15} color="#53BDEB" strokeWidth={2.4} />
                        </View>
                      )}

                      {/* Photo icon if media */}
                      {item.subtitleType === 'photo' && (
                        <View style={styles.mediaIconWrap}>
                          <Icon name="image" size={14} color={subtextColor} strokeWidth={2.2} />
                        </View>
                      )}

                      {/* Document icon if file */}
                      {item.subtitleType === 'document' && (
                        <View style={styles.mediaIconWrap}>
                          <Icon name="file-text" size={14} color={subtextColor} strokeWidth={2.2} />
                        </View>
                      )}

                      {/* Message preview text */}
                      <Text
                        style={[styles.chatSnippet, { color: subtextColor }]}
                        numberOfLines={1}
                      >
                        {item.subtitleType === 'document'
                          ? item.subtitleDocName || item.subtitleText
                          : item.subtitleText}
                      </Text>
                    </View>

                    {/* Unread Message Count Badge */}
                    {Boolean(item.unreadCount && item.unreadCount > 0) && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="message" size={44} color={subtextColor} strokeWidth={1.6} />
              <Text style={[styles.emptyStateTitle, { color: titleColor }]}>
                {searchQuery.trim() ? 'No chats found' : 'No chats yet'}
              </Text>
              <Text style={[styles.emptyStateText, { color: subtextColor }]}>
                {searchQuery.trim()
                  ? `No conversation matching "${searchQuery}"`
                  : 'Start a conversation by sending a message to any contact.'}
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBackBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  headerIconBtn: {
    padding: 4,
  },
  headerSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerSearchInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  searchClearBtn: {
    padding: 6,
  },
  pillsContainer: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.15)',
  },
  pillsList: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  pillButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActiveBorder: {
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 132, 0.4)',
  },
  pillText: {
    fontSize: 13.5,
  },
  pillAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  chatListContent: {
    paddingTop: 4,
    paddingBottom: 40,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  avatarWrapper: {
    marginRight: 14,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  chatInfoWrapper: {
    flex: 1,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16.5,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 12,
    fontWeight: '400',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageSnippetWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 4,
  },
  tickWrapper: {
    marginRight: 2,
  },
  mediaIconWrap: {
    marginRight: 2,
  },
  chatSnippet: {
    fontSize: 13.5,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#25D366',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
});
