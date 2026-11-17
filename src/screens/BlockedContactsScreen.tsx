import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { usePhoneBook } from '../store/PhoneBookContext';
import { PhoneBookContact } from '../types/phoneBook';
import { Icon } from '../components/common/Icon';
import { ContactActionsModal } from '../components/phonebook/ContactActionsModal';
import { CallScreenModal } from '../components/phonebook/CallScreenModal';

const AVATAR_COLORS = [
  '#0866FF',
  '#059669',
  '#7C3AED',
  '#D97706',
  '#DC2626',
  '#2563EB',
  '#0D9488',
  '#9333EA',
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export const BlockedContactsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { blockedContacts, unblockContact } = usePhoneBook();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<PhoneBookContact | null>(null);
  const [callingContact, setCallingContact] = useState<PhoneBookContact | null>(null);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20
  );

  // Filter blocked contacts by search
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return blockedContacts;
    const q = searchQuery.toLowerCase();
    return blockedContacts.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.primaryPhone || '').includes(q) ||
        (c.category || '').toLowerCase().includes(q)
    );
  }, [blockedContacts, searchQuery]);

  // Handle Unblock confirmation
  const handleUnblockPress = (contact: PhoneBookContact) => {
    Alert.alert(
      `Unblock "${contact.name}"?`,
      'This contact will now be able to call and send you messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: () => {
            unblockContact(contact.id);
            Alert.alert('Unblocked', `"${contact.name}" has been unblocked.`);
          },
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#18191A' : '#FFFFFF' },
      ]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: topInset + 10 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon
            name="arrow-left"
            size={22}
            color={isDark ? '#E4E6EB' : '#050505'}
            strokeWidth={2.2}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: isDark ? '#E4E6EB' : '#050505' }]}>
            Blocked Contacts
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{blockedContacts.length}</Text>
          </View>
        </View>

        <View style={{ width: 36 }} />
      </View>

      {/* Info Notice Banner */}
      <View
        style={[
          styles.noticeBanner,
          {
            backgroundColor: isDark ? '#242526' : '#F0F2F5',
            borderColor: isDark ? '#3A3B3C' : '#E4E6EB',
          },
        ]}
      >
        <Icon name="block" size={16} color="#EF4444" strokeWidth={2} />
        <Text style={[styles.noticeText, { color: isDark ? '#B0B3B8' : '#65676B' }]}>
          Blocked contacts cannot call you or send messages. You can unblock them anytime.
        </Text>
      </View>

      {/* Search Input (visible if there are blocked contacts) */}
      {blockedContacts.length > 0 && (
        <View style={styles.searchWrap}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: isDark ? '#242526' : '#F0F2F5',
                borderColor: isDark ? '#3A3B3C' : '#E4E6EB',
              },
            ]}
          >
            <Icon
              name="search"
              size={17}
              color={isDark ? '#B0B3B8' : '#65676B'}
              strokeWidth={2}
            />
            <TextInput
              style={[
                styles.searchInput,
                { color: isDark ? '#E4E6EB' : '#050505' },
              ]}
              placeholder="Search blocked contacts..."
              placeholderTextColor="#8A8D91"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>
        </View>
      )}

      {/* List of Blocked Contacts */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.contactRow,
              {
                borderBottomColor: isDark ? '#242526' : '#F0F2F5',
              },
            ]}
            onPress={() => setSelectedContact(item)}
            activeOpacity={0.7}
          >
            {/* Avatar */}
            <View
              style={[
                styles.avatarBorder,
                !(item.avatar && item.avatar.trim().length > 0) && {
                  backgroundColor: getAvatarColor(item.name || '?'),
                  justifyContent: 'center',
                  alignItems: 'center',
                },
              ]}
            >
              {item.avatar && item.avatar.trim().length > 0 ? (
                <Image
                  source={{ uri: item.avatar }}
                  style={styles.avatarImg}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarInitial}>
                  {(item.name || '?').trim().charAt(0).toUpperCase()}
                </Text>
              )}
            </View>

            {/* Info */}
            <View style={styles.infoCol}>
              <View style={styles.nameRow}>
                <Text
                  style={[
                    styles.nameText,
                    { color: isDark ? '#E4E6EB' : '#050505' },
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <View style={styles.blockedBadge}>
                  <Text style={styles.blockedBadgeText}>Blocked</Text>
                </View>
              </View>
              <Text style={styles.phoneSubText} numberOfLines={1}>
                {item.category
                  ? `${item.category}${item.primaryPhone ? ` • ${item.primaryPhone}` : ''}`
                  : item.primaryPhone || item.email || 'Blocked contact'}
              </Text>
            </View>

            {/* Unblock Button */}
            <TouchableOpacity
              style={[
                styles.unblockBtn,
                {
                  backgroundColor: isDark ? 'rgba(8, 102, 255, 0.16)' : '#E7F3FF',
                },
              ]}
              onPress={() => handleUnblockPress(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Text style={styles.unblockText}>Unblock</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: isDark ? '#242526' : '#F0F2F5' },
              ]}
            >
              <Icon name="block" size={32} color="#8A8D91" strokeWidth={1.8} />
            </View>
            <Text
              style={[
                styles.emptyTitle,
                { color: isDark ? '#E4E6EB' : '#050505' },
              ]}
            >
              No Blocked Contacts
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? `No blocked contacts match "${searchQuery}"`
                : 'Contacts you block from their profile or by long-pressing will appear here.'}
            </Text>
          </View>
        }
      />

      {/* Contact Details Sheet */}
      <ContactActionsModal
        visible={!!selectedContact}
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        onCall={(c) => {
          setSelectedContact(null);
          setCallingContact(c);
        }}
      />

      {/* Calling Modal if needed */}
      {callingContact && (
        <CallScreenModal
          visible={!!callingContact}
          contact={callingContact}
          onClose={() => setCallingContact(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#EF4444',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  searchWrap: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: 40,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  avatarBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#E4E6EB',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
    maxWidth: 160,
  },
  blockedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  blockedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  phoneSubText: {
    fontSize: 13,
    color: '#8A8D91',
    fontWeight: '500',
    marginTop: 2,
  },
  unblockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unblockText: {
    color: '#0866FF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#8A8D91',
    textAlign: 'center',
    lineHeight: 19,
  },
});
