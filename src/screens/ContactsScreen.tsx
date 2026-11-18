import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
  Alert,
  Linking,
  Animated,
  Easing,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Keyboard,
  LayoutAnimation,
  UIManager,
  BackHandler,
  RefreshControl,
  ActivityIndicator,
  AppState,
  Image,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { Icon } from '../components/common/Icon';
import { ALL_PHONE_CONTACTS, RECENTLY_VIEWED_CONTACTS } from '../data/mockPhoneBook';
import { PhoneBookContact, EmergencyItem } from '../types/phoneBook';
import { EmergencyAccessRail } from '../components/phonebook/EmergencyAccessRail';
import { RecentlyViewedRail } from '../components/phonebook/RecentlyViewedRail';
import { DigitalMarketingBanner } from '../components/phonebook/DigitalMarketingBanner';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { ContactListItem } from '../components/phonebook/ContactListItem';
import { ContactSettingsModal } from '../components/phonebook/ContactSettingsModal';
import { CallScreenModal } from '../components/phonebook/CallScreenModal';
import { HeaderOptionsMenu } from '../components/phonebook/HeaderOptionsMenu';
import { ContactContextMenuModal } from '../components/phonebook/ContactContextMenuModal';
import { WhatsAppChatModal, ChatMessage } from '../components/phonebook/WhatsAppChatModal';
import { RecentChatsModal } from '../components/phonebook/RecentChatsModal';
import { BusinessContactsModal } from '../components/phonebook/BusinessContactsModal';
import { handleDirectVoiceCall } from '../services/voiceSearchService';
import { ThemedAlertModal } from '../components/common/ThemedAlertModal';
import {
  CountryPickerDropdown,
  CountryItem,
  COUNTRIES,
} from '../components/phonebook/CountryPickerDropdown';
import { LinkingService } from '../services/linkingService';
import { DeviceContactsService } from '../services/deviceContactsService';
import { usePhoneBook } from '../store/PhoneBookContext';
import { useAuth } from '../store/AuthContext';
import { RegisterBusinessModal } from '../components/business/RegisterBusinessModal';
import { ProfileModal } from '../components/common/ProfileModal';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const ContactsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const {
    contacts,
    recentContacts,
    blockedContactIds,
    pinnedContactIds,
    mutedContactIds,
    recordContactView,
    deleteContact,
    toggleBlockContact,
    togglePinContact,
    toggleMuteContact,
    toggleFavoriteContact,
    isBlocked,
    isPinned,
    isMuted,
    isFavorite,
    isSplashFinished,
    refreshContacts,
    isLoadingContacts,
    permissionDenied,
    loadDeviceContacts,
  } = usePhoneBook();

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDeviceContacts(true);
    setIsRefreshing(false);
  };

  const handleGrantPermissionPress = async () => {
    const granted = await DeviceContactsService.requestPermission();
    if (granted) {
      loadDeviceContacts(false);
    } else {
      Linking.openSettings();
    }
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const isSearching = isSearchFocused || searchQuery.trim().length > 0;
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);
  const [settingsContact, setSettingsContact] = useState<PhoneBookContact | null>(null);
  const [showBusinessModal, setShowBusinessModal] = useState<boolean>(false);
  const [showRecentChatsModal, setShowRecentChatsModal] = useState<boolean>(false);
  const [customChatMessages, setCustomChatMessages] = useState<ChatMessage[] | undefined>(undefined);
  const [openedFromRecentChats, setOpenedFromRecentChats] = useState<boolean>(false);
  const [callingContact, setCallingContact] = useState<PhoneBookContact | null>(null);
  const [chatContact, setChatContact] = useState<PhoneBookContact | null>(null);
  const [longPressedContact, setLongPressedContact] = useState<PhoneBookContact | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState<boolean>(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState<boolean>(false);
  const [hideBlockedCalls, setHideBlockedCalls] = useState<boolean>(false);
  const [hideCallsFromOtherApps, setHideCallsFromOtherApps] = useState<boolean>(false);
  const [voiceAlertVisible, setVoiceAlertVisible] = useState<boolean>(false);
  const [voiceAlertQuery, setVoiceAlertQuery] = useState<string>('');
  const [showRegisterBusinessModal, setShowRegisterBusinessModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  const flatListRef = useRef<FlatList>(null);
  const fabAnim = useRef(new Animated.Value(1)).current; // 1 = expanded, 0 = collapsed icon
  const isFabExpanded = useRef(true);
  const lastScrollY = useRef(0);
  const hasAutoScrolled = useRef(false);
  const hasAnimatedRails = useRef(false);
  const isAutoScrolling = useRef(false);
  const railsCollapseAnim = useRef(new Animated.Value(1)).current;
  const bannerCollapseAnim = useRef(new Animated.Value(1)).current;
  const isHeaderExpanded = useRef(true);
  const lastTouchY = useRef(0);
  const step1TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const step2TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [railsHeight, setRailsHeight] = useState<number>(260);
  const scrollAnim = useRef(new Animated.Value(0)).current;

  const isFocused = useIsFocused();

  // When My Contacts opens (only after splash video is finished): check READ_CONTACTS permission, immediately request popup if not granted, fetch contacts
  useEffect(() => {
    if (isFocused && isSplashFinished) {
      loadDeviceContacts(true);
    }
  }, [isFocused, isSplashFinished, loadDeviceContacts]);

  // Refresh contacts when app returns from Settings after permission is granted
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active' && isSplashFinished) {
        const hasPerm = await DeviceContactsService.checkPermission();
        if (hasPerm) {
          loadDeviceContacts(false);
        }
      }
    });
    return () => sub.remove();
  }, [isSplashFinished, loadDeviceContacts]);

  // Sync scroll position using React Native's animation clock for stutter-free fluid motion
  useEffect(() => {
    const listenerId = scrollAnim.addListener(({ value }) => {
      flatListRef.current?.scrollToOffset({
        offset: value,
        animated: false,
      });
      lastScrollY.current = value;
    });

    return () => {
      scrollAnim.removeListener(listenerId);
    };
  }, []);

  // Handle hardware back press when chat modal or recent chats modal is open
  useEffect(() => {
    if (!chatContact && !showRecentChatsModal) return;

    const onBackPress = () => {
      if (chatContact) {
        const wasFromRecent = openedFromRecentChats;
        setChatContact(null);
        setCustomChatMessages(undefined);
        setOpenedFromRecentChats(false);
        if (wasFromRecent) {
          setTimeout(() => {
            setShowRecentChatsModal(true);
          }, 100);
        }
        return true;
      }
      if (showRecentChatsModal) {
        setShowRecentChatsModal(false);
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [chatContact, showRecentChatsModal, openedFromRecentChats]);

  // Smooth cinematic ease-in-out scrolling helper using React Native Animated + Easing
  const performSmoothScroll = (
    targetOffset: number,
    duration: number = 1000,
    onComplete?: () => void
  ) => {
    scrollAnim.stopAnimation();
    scrollAnim.setValue(lastScrollY.current || 0);

    const startOffset = lastScrollY.current || 0;
    const distance = targetOffset - startOffset;
    if (Math.abs(distance) < 2) {
      if (onComplete) onComplete();
      return;
    }

    isAutoScrolling.current = true;

    Animated.timing(scrollAnim, {
      toValue: targetOffset,
      duration: duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        isAutoScrolling.current = false;
        if (onComplete) {
          onComplete();
        }
      }
    });
  };

  // --- Header Show/Hide Engine ---
  // Tracks header visibility ('visible' or 'collapsed')
  const headerStateRef = useRef<'visible' | 'collapsed'>('visible');
  const isExpandingRef = useRef(false);
  const touchStartY = useRef(0);

  // Brings down recent contacts, emergency contacts, and digital automation banner together in one go ("ek baar me")
  const showHeader = () => {
    if (headerStateRef.current === 'visible' && !isExpandingRef.current) return;

    if (step1TimerRef.current) clearTimeout(step1TimerRef.current);
    if (step2TimerRef.current) clearTimeout(step2TimerRef.current);

    headerStateRef.current = 'visible';
    isHeaderExpanded.current = true;
    isExpandingRef.current = true;

    bannerCollapseAnim.stopAnimation();
    railsCollapseAnim.stopAnimation();

    Animated.parallel([
      Animated.timing(bannerCollapseAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: false,
      }),
      Animated.timing(railsCollapseAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: false,
      }),
    ]).start(() => {
      setTimeout(() => {
        isExpandingRef.current = false;
      }, 250);
    });
  };

  const hideHeader = () => {
    if (isExpandingRef.current) return;
    if (headerStateRef.current === 'collapsed') return;

    if (step1TimerRef.current) clearTimeout(step1TimerRef.current);
    if (step2TimerRef.current) clearTimeout(step2TimerRef.current);

    headerStateRef.current = 'collapsed';
    isHeaderExpanded.current = false;

    bannerCollapseAnim.stopAnimation();
    railsCollapseAnim.stopAnimation();

    Animated.parallel([
      Animated.timing(railsCollapseAnim, {
        toValue: 0,
        duration: 280,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
      Animated.timing(bannerCollapseAnim, {
        toValue: 0,
        duration: 280,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
    ]).start();
  };

  // 2-step auto-collapse animation: runs ONCE per screen focus
  // Step 1: Emergency & Recent contacts glide up smoothly behind Digital Automation after 2s
  // Step 2: Digital Automation banner glides up 3s after step 1 completes
  useEffect(() => {
    if (!isFocused || !isSplashFinished) {
      hasAnimatedRails.current = false;
      headerStateRef.current = 'visible';
      isHeaderExpanded.current = true;
      isExpandingRef.current = false;
      if (step1TimerRef.current) clearTimeout(step1TimerRef.current);
      if (step2TimerRef.current) clearTimeout(step2TimerRef.current);
      railsCollapseAnim.stopAnimation();
      bannerCollapseAnim.stopAnimation();
      railsCollapseAnim.setValue(1);
      bannerCollapseAnim.setValue(1);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      lastScrollY.current = 0;
      return;
    }

    if (hasAnimatedRails.current) return;

    headerStateRef.current = 'visible';
    isHeaderExpanded.current = true;
    isExpandingRef.current = false;
    railsCollapseAnim.stopAnimation();
    bannerCollapseAnim.stopAnimation();
    railsCollapseAnim.setValue(1);
    bannerCollapseAnim.setValue(1);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    lastScrollY.current = 0;
    isFabExpanded.current = true;
    fabAnim.setValue(1);

    // Step 1 at 2s: Emergency & Recent contacts glide up smoothly behind Digital Automation
    step1TimerRef.current = setTimeout(() => {
      if (isSearching) return;
      hasAnimatedRails.current = true;
      headerStateRef.current = 'collapsed';
      isHeaderExpanded.current = false;
      Animated.timing(railsCollapseAnim, {
        toValue: 0,
        duration: 900,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (!finished) return;
        // Step 2 at +3s: Digital Automation banner glides up
        step2TimerRef.current = setTimeout(() => {
          if (isSearching) return;
          Animated.timing(bannerCollapseAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: false,
          }).start();
        }, 3000);
      });
    }, 2000);

    return () => {
      if (step1TimerRef.current) clearTimeout(step1TimerRef.current);
      if (step2TimerRef.current) clearTimeout(step2TimerRef.current);
    };
  }, [isFocused, isSplashFinished]);

  // Shrink FAB to icon on scroll-up, expand back on scroll-down
  // Show/hide header based on scroll direction & touch
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    if (isAutoScrolling.current) {
      lastScrollY.current = currentY;
      return;
    }
    const diff = currentY - lastScrollY.current;

    // --- FAB collapse/expand ---
    if (diff > 6 && currentY > 20) {
      if (isFabExpanded.current) {
        isFabExpanded.current = false;
        Animated.spring(fabAnim, { toValue: 0, useNativeDriver: false, bounciness: 4, speed: 16 }).start();
      }
    } else if (diff < -6) {
      if (!isFabExpanded.current) {
        isFabExpanded.current = true;
        Animated.spring(fabAnim, { toValue: 1, useNativeDriver: false, bounciness: 4, speed: 16 }).start();
      }
    }

    // --- Header show/hide on scroll ---
    // If scrolling down towards top (offset decreasing) or near top: bring down header
    if (diff < -6 || currentY <= 5) {
      if (headerStateRef.current === 'collapsed') {
        showHeader();
      }
    } else if (diff > 12 && currentY > 60 && !isExpandingRef.current) {
      // If scrolling up into contacts list: hide header
      if (headerStateRef.current === 'visible') {
        hideHeader();
      }
    }

    lastScrollY.current = currentY;
  };


  // WhatsApp-style long-press context actions
  const handleLongPressContact = (contact: PhoneBookContact) => {
    setLongPressedContact(contact);
  };

  // Filter contacts by search query & blocked status, with pinned contacts on top
  const filteredContacts = useMemo(() => {
    let list = contacts;
    if (hideBlockedCalls) {
      list = list.filter((c) => !isBlocked(c.id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.primaryPhone.includes(q) ||
          c.phoneNumbers.some((p) => p.number.includes(q))
      );
    }
    return [...list].sort((a, b) => {
      const aPinned = isPinned(a.id);
      const bPinned = isPinned(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [contacts, searchQuery, hideBlockedCalls, blockedContactIds, pinnedContactIds, isBlocked, isPinned]);

  // Luxurious smooth slowly-expanding dropdown animation (~420ms)
  const animateContactDropdown = () => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    LayoutAnimation.configureNext({
      duration: 420,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
  };

  // Toggle Samsung One UI inline expandable menu card
  const handleToggleExpandContact = (contact: PhoneBookContact, index?: number) => {
    animateContactDropdown();
    const isOpening = expandedContactId !== contact.id;
    setExpandedContactId((prev) => (prev === contact.id ? null : contact.id));
    setTimeout(() => {
      recordContactView(contact);
    }, 450);

    // Auto-scroll when listing is tapped so that the expanded card is 100% fully visible
    if (isOpening && typeof index === 'number') {
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index,
            // Align 5th/6th+ listings higher up (viewPosition 0.15) to guarantee full visibility above FABs on all mobile screens
            viewPosition: index >= 4 ? 0.15 : (index >= 2 ? 0.22 : 0.08),
            animated: true,
          });
        } catch {
          // Handled by onScrollToIndexFailed
        }
      }, 160);
    }
  };

  // Open Settings Modal for contact (email, favorite, block, delete)
  const handleOpenContactSettings = (contact: PhoneBookContact) => {
    setSettingsContact(contact);
  };

  // Video call action
  const handleVideoCall = (contact: PhoneBookContact) => {
    Alert.alert(
      'Video Call',
      `Start video call with ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => handleStartCall(contact),
        },
      ]
    );
  };

  // Invite action
  const handleInviteContact = (contact: PhoneBookContact) => {
    const inviteMessage = `Hey ${contact.name}! Connect with me on Leads Phone Book: https://anycontact.app/download`;
    LinkingService.sendMessage(contact.primaryPhone, inviteMessage);
  };

  // Handle direct call (Screen 3)
  const handleStartCall = (contact: PhoneBookContact) => {
    if (contact.phoneNumbers && contact.phoneNumbers.length > 1) {
      Alert.alert(
        `Call ${contact.name}`,
        'Select number to call:',
        [
          ...contact.phoneNumbers.map((p) => ({
            text: `${p.label || 'Phone'}: ${p.number}`,
            onPress: () => {
              recordContactView(contact);
              setCallingContact({ ...contact, primaryPhone: p.number });
            },
          })),
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      recordContactView(contact);
      setCallingContact(contact);
    }
  };

  // Handle direct message (WhatsApp chatting section)
  const handleSendMessage = (
    contact: PhoneBookContact,
    initialMessages?: ChatMessage[],
    fromRecentChats?: boolean
  ) => {
    if (!fromRecentChats && contact.phoneNumbers && contact.phoneNumbers.length > 1) {
      Alert.alert(
        `Message ${contact.name}`,
        'Select number to message:',
        [
          ...contact.phoneNumbers.map((p) => ({
            text: `${p.label || 'Phone'}: ${p.number}`,
            onPress: () => {
              recordContactView(contact);
              setOpenedFromRecentChats(false);
              setCustomChatMessages(initialMessages);
              setChatContact({ ...contact, primaryPhone: p.number });
            },
          })),
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      recordContactView(contact);
      setOpenedFromRecentChats(!!fromRecentChats);
      setCustomChatMessages(initialMessages);
      setChatContact(contact);
    }
  };

  // Open chat from recent chats modal
  const handleOpenRecentChat = (contact: PhoneBookContact, initialMessages?: ChatMessage[]) => {
    setOpenedFromRecentChats(true);
    setShowRecentChatsModal(false);
    recordContactView(contact);
    setCustomChatMessages(initialMessages);
    setChatContact(contact);
  };

  // Handle emergency in-app call directly
  const handleEmergencyCall = (item: EmergencyItem) => {
    const avatarMap: Record<string, string> = {
      Police: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=240&q=80',
      Ambulance: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=240&q=80',
      Fire: 'https://images.unsplash.com/photo-1543083477-4f785aeafaa9?w=240&q=80',
      'Snake Catcher': 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?w=240&q=80',
    };

    const emergencyContact: PhoneBookContact = {
      id: item.id,
      name: item.title,
      avatar: avatarMap[item.title] || 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=240&q=80',
      primaryPhone: item.number,
      phoneNumbers: [{ label: 'Emergency', number: item.number }],
      email: `${item.title.toLowerCase().replace(/\s+/g, '')}@emergency.gov`,
      hasApp: true,
    };

    handleStartCall(emergencyContact);
  };

  // Scroll to alphabet index
  const handleAlphabetPress = (letter: string) => {
    const index = filteredContacts.findIndex((c) =>
      c.name.toUpperCase().startsWith(letter)
    );
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    }
  };

  // Options Menu Actions matching user screenshot
  const handleDeleteOption = () => {
    Alert.alert(
      'Delete History',
      'Are you sure you want to clear call history or logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Deleted', 'Call history cleared.') },
      ]
    );
  };

  const handleToggleBlocked = () => {
    const nextVal = !hideBlockedCalls;
    setHideBlockedCalls(nextVal);
    Alert.alert('Blocked Calls', nextVal ? 'Blocked calls are now hidden.' : 'Blocked calls are now visible.');
  };

  const handleToggleOtherApps = () => {
    const nextVal = !hideCallsFromOtherApps;
    setHideCallsFromOtherApps(nextVal);
    Alert.alert('Calls from Other Apps', nextVal ? 'Calls from other apps are now hidden.' : 'Calls from other apps are now visible.');
  };

  const handleTotalCallTime = () => {
    Alert.alert(
      'Total Call Time',
      '• Outgoing calls: 2h 14m\n• Incoming calls: 1h 48m\n• Total duration: 4h 02m',
      [{ text: 'OK' }]
    );
  };

  const handleViewTags = () => {
    Alert.alert(
      'View and Edit Tags',
      'Available tags: Family, Work, Friends, VIP, Emergency, Bestie.',
      [{ text: 'OK' }]
    );
  };

  const handleSettingsOption = () => {
    navigation.navigate('Settings');
  };

  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20
  );

  return (
    <View
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? '#18191A' : '#FFFFFF' },
      ]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Screen 1 Header with Meta clean layout */}
      <View style={[styles.topHeader, { paddingTop: topInset + 12 }]}>
        <View style={{ flex: 1 }} />

        <View style={styles.headerRight}>
          {/* Country Flag Button */}
          <TouchableOpacity
            style={[
              styles.headerFlagBtn,
              {
                backgroundColor: isDark ? '#242526' : '#F0F2F5',
                borderColor: isDark ? '#3A3B3C' : '#E4E6EB',
              },
            ]}
            onPress={() => setShowCountryPicker(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Text style={styles.headerFlagEmoji}>{selectedCountry.flag}</Text>
          </TouchableOpacity>

          {/* Profile Icon Button */}
          <TouchableOpacity
            style={[
              styles.headerProfileBtn,
              {
                backgroundColor: isDark ? '#242526' : '#EFF6FF',
                borderColor: user?.avatarUrl
                  ? '#1877F2'
                  : isDark
                  ? '#3A3B3C'
                  : '#BFDBFE',
              },
            ]}
            onPress={() => setShowProfileModal(true)}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.headerProfileImg}
                resizeMode="cover"
              />
            ) : (
              <Icon
                name="user"
                size={16}
                color={isDark ? '#E4E6EB' : '#1877F2'}
                strokeWidth={2.2}
              />
            )}
          </TouchableOpacity>

          {/* 3-Dots Menu Button */}
          <TouchableOpacity
            style={styles.headerMenuBtn}
            onPress={() => setShowOptionsMenu(true)}
            hitSlop={{ top: 10, bottom: 10, left: 4, right: 10 }}
          >
            <Icon
              name="more-vertical"
              size={20}
              color={isDark ? '#B0B3B8' : '#65676B'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar matching Meta/Facebook style */}
      <View style={styles.searchContainer}>
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
            size={18}
            color={isDark ? '#B0B3B8' : '#65676B'}
            strokeWidth={2}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: isDark ? '#E4E6EB' : '#050505' },
            ]}
            placeholder="Search contacts..."
            placeholderTextColor={isDark ? '#8A8D91' : '#8A8D91'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => {
              if (!searchQuery.trim()) {
                setIsSearchFocused(false);
              }
            }}
            clearButtonMode="while-editing"
          />
          {isSearching ? (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setIsSearchFocused(false);
                Keyboard.dismiss();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon
                name="close"
                size={18}
                color={isDark ? '#B0B3B8' : '#65676B'}
                strokeWidth={2.2}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() =>
                handleDirectVoiceCall(
                  contacts,
                  handleStartCall,
                  (spoken) => {
                    setVoiceAlertQuery(spoken || '');
                    setVoiceAlertVisible(true);
                  }
                )
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon
                name="mic"
                size={18}
                color={isDark ? '#B0B3B8' : '#65676B'}
                strokeWidth={2}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contacts List with Header & Scroller */}
      <View style={styles.listContainer}>
        <FlatList
          ref={flatListRef}
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onTouchStart={(e) => {
            touchStartY.current = e.nativeEvent.pageY;
            lastTouchY.current = e.nativeEvent.pageY;
          }}
          onTouchMove={(e) => {
            const deltaY = e.nativeEvent.pageY - touchStartY.current;
            if (deltaY > 12) {
              if (headerStateRef.current === 'collapsed') {
                showHeader();
              }
            }
          }}
          onScrollBeginDrag={() => {
            scrollAnim.stopAnimation();
            isAutoScrolling.current = false;
          }}
          onScrollToIndexFailed={(info) => {
            flatListRef.current?.scrollToOffset({
              offset: Math.max(0, info.highestMeasuredFrameIndex > 0 ? info.averageItemLength * info.index : info.index * 72),
              animated: true,
            });
            setTimeout(() => {
              try {
                flatListRef.current?.scrollToIndex({
                  index: info.index,
                  viewPosition: 0.25,
                  animated: true,
                });
              } catch {
                // Ignore fallback error
              }
            }, 100);
          }}
          ListHeaderComponent={
            !isSearching ? (
              <>
                <View>
                  {/* 1. Digital Marketing Automation Pill Banner (TOP POSITION) */}
                  <Animated.View
                    style={{
                      height: bannerCollapseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 84],
                      }),
                      opacity: bannerCollapseAnim.interpolate({
                        inputRange: [0, 0.4, 1],
                        outputRange: [0, 0.8, 1],
                      }),
                      transform: [
                        {
                          translateY: bannerCollapseAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-84, 0],
                          }),
                        },
                      ],
                      overflow: 'hidden',
                      zIndex: 10,
                    }}
                  >
                    <DigitalMarketingBanner
                      onPress={() => navigation.navigate('DigitalAutomation')}
                    />
                  </Animated.View>

                  {/* 2. Emergency Quick Access & Recent Contacts Rail */}
                  <Animated.View
                    style={{
                      height: railsCollapseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, railsHeight],
                      }),
                      opacity: railsCollapseAnim.interpolate({
                        inputRange: [0, 0.4, 1],
                        outputRange: [0, 0.8, 1],
                      }),
                      transform: [
                        {
                          translateY: railsCollapseAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-railsHeight, 0],
                          }),
                        },
                      ],
                      overflow: 'hidden',
                      zIndex: 1,
                    }}
                  >
                    <View
                      onLayout={(e) => {
                        const h = e.nativeEvent.layout.height;
                        if (h > 50 && Math.abs(h - railsHeight) > 4) {
                          setRailsHeight(h);
                        }
                      }}
                    >
                      {/* Emergency Quick Access (Police, Ambulance, Fire, Snake Catcher) */}
                      <EmergencyAccessRail onCall={handleEmergencyCall} />

                      {/* Recently Viewed Avatars Rail with dynamic horizontal scrolling */}
                      <RecentlyViewedRail
                        contacts={recentContacts}
                        onSelect={handleToggleExpandContact}
                      />
                    </View>
                  </Animated.View>
                </View>

                {/* My Contacts Header */}
                <View style={styles.sectionHeaderWrap}>
                  <Text
                    style={[
                      styles.sectionHeaderText,
                      { color: isDark ? '#F8FAFC' : '#0F172A' },
                    ]}
                  >
                    My Contacts
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.sectionHeaderWrap}>
                <Text
                  style={[
                    styles.sectionHeaderText,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  {searchQuery.trim()
                    ? `Results (${filteredContacts.length})`
                    : `My Contacts (${filteredContacts.length})`}
                </Text>
              </View>
            )
          }
          renderItem={({ item, index }) => (
            <ContactListItem
              contact={item}
              isExpanded={expandedContactId === item.id}
              isFavorite={isFavorite(item.id)}
              isBlocked={isBlocked(item.id)}
              isPinned={isPinned(item.id)}
              onPress={() => handleToggleExpandContact(item, index)}
              onLongPress={handleLongPressContact}
              onCall={handleStartCall}
              onMessage={handleSendMessage}
              onVideoCall={handleVideoCall}
              onInvite={handleInviteContact}
              onOpenSettings={handleOpenContactSettings}
            />
          )}
          ListEmptyComponent={
            isLoadingContacts ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text
                  style={[
                    styles.emptyText,
                    { color: isDark ? '#94A3B8' : '#64748B', marginTop: 8 },
                  ]}
                >
                  Loading device contacts...
                </Text>
              </View>
            ) : permissionDenied && contacts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View
                  style={[
                    styles.emptyIconCircle,
                    { backgroundColor: isDark ? '#242526' : '#F0F2F5' },
                  ]}
                >
                  <Icon name="shield" size={32} color="#EF4444" strokeWidth={2} />
                </View>
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  Contacts Permission Required
                </Text>
                <Text
                  style={[
                    styles.emptySubText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  Please allow contacts permission to view, search, and call your device contacts.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.grantPermissionBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleGrantPermissionPress}
                  activeOpacity={0.8}
                >
                  <Text style={styles.grantPermissionBtnText}>Grant Permission</Text>
                </TouchableOpacity>
              </View>
            ) : !isSearching && contacts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View
                  style={[
                    styles.emptyIconCircle,
                    { backgroundColor: isDark ? '#242526' : '#F0F2F5' },
                  ]}
                >
                  <Icon
                    name="contacts"
                    size={32}
                    color={isDark ? '#94A3B8' : '#64748B'}
                    strokeWidth={1.8}
                  />
                </View>
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  No Contacts Found
                </Text>
                <Text
                  style={[
                    styles.emptySubText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  No contacts found on this device.
                </Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="search" size={32} color="#94A3B8" />
                <Text
                  style={[
                    styles.emptyText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  No contacts matching "{searchQuery}"
                </Text>
              </View>
            )
          }
        />

        {/* Alphabet Index Scrubber on Right (A-Z) */}
        {!isSearching && (
          <View style={styles.alphabetIndexBar}>
            {ALPHABET.map((char) => (
              <TouchableOpacity
                key={char}
                onPress={() => handleAlphabetPress(char)}
                hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}
              >
                <Text
                  style={[
                    styles.alphabetChar,
                    { color: isDark ? '#64748B' : '#94A3B8' },
                  ]}
                >
                  {char}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Top Floating Button: Larger White Squircle with Dark Chat Bubble Plus (Recent Chats, shown above Business Contacts) */}
        <TouchableOpacity
          style={styles.recentChatsFab}
          onPress={() => setShowRecentChatsModal(true)}
          activeOpacity={0.85}
        >
          <Icon name="chat-plus" size={30} color="#1C2127" />
        </TouchableOpacity>

        {/* Bottom Floating Button: Business Contacts (shows icon + name "Business Contacts", shrinks on scroll, at the bottom) */}
        <Animated.View
          style={[
            styles.businessContactFab,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              width: fabAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [46, 184],
              }),
              paddingRight: fabAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [7, 16],
              }),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.fabTouchable}
            onPress={() => setShowBusinessModal(true)}
            activeOpacity={0.85}
          >
            <View style={styles.fabInnerCircle}>
              <Icon name="briefcase" size={17} color={colors.primary} strokeWidth={2.4} />
            </View>
            <Animated.View
              style={{
                opacity: fabAnim.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0, 0, 1],
                }),
                maxWidth: fabAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 130],
                }),
                overflow: 'hidden',
              }}
            >
              <Text style={styles.businessFabText} numberOfLines={1}>
                Business Contacts
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Contact Settings Modal (Email, Favorite, Block, Delete) */}
      {settingsContact && (
        <ContactSettingsModal
          visible={!!settingsContact}
          contact={settingsContact}
          isFavorite={isFavorite(settingsContact.id)}
          isBlocked={isBlocked(settingsContact.id)}
          onClose={() => setSettingsContact(null)}
          onEmail={(c) => {
            if (c.email) {
              Linking.openURL(`mailto:${c.email}`).catch(() => {
                Alert.alert('Email', `Contact email: ${c.email}`);
              });
            } else {
              Alert.alert('Email', `No email address found for ${c.name}.`);
            }
          }}
          onToggleFavorite={(c) => {
            toggleFavoriteContact(c.id);
            Alert.alert(
              'Favorites',
              isFavorite(c.id)
                ? `${c.name} removed from favorites.`
                : `${c.name} added to favorites.`
            );
          }}
          onToggleBlock={(c) => toggleBlockContact(c)}
          onDeleteContact={(c) => {
            deleteContact(c.id);
            if (expandedContactId === c.id) {
              animateContactDropdown();
              setExpandedContactId(null);
            }
            Alert.alert('Contact Deleted', `${c.name} has been deleted.`);
          }}
        />
      )}

      {/* Business Contacts Modal (Triggered by PhonePe-style Floating Button) */}
      <BusinessContactsModal
        visible={showBusinessModal}
        onClose={() => setShowBusinessModal(false)}
        onCall={(contact) => {
          setShowBusinessModal(false);
          handleStartCall(contact);
        }}
        onMessage={handleSendMessage}
      />

      {/* WhatsApp Chatting Section Modal */}
      {chatContact && (
        <WhatsAppChatModal
          visible={!!chatContact}
          contact={chatContact}
          isBlocked={isBlocked(chatContact.id)}
          customMessages={customChatMessages}
          onClose={() => {
            const wasFromRecent = openedFromRecentChats;
            setChatContact(null);
            setCustomChatMessages(undefined);
            setOpenedFromRecentChats(false);
            if (wasFromRecent) {
              setTimeout(() => {
                setShowRecentChatsModal(true);
              }, 100);
            }
          }}
          onCall={(c) => {
            setChatContact(null);
            handleStartCall(c);
          }}
          onViewContactDetails={(c) => {
            setChatContact(null);
            animateContactDropdown();
            setExpandedContactId(c.id);
          }}
          onBlockContact={(c) => toggleBlockContact(c)}
        />
      )}

      {/* WhatsApp Recent Chats Modal */}
      <RecentChatsModal
        visible={showRecentChatsModal}
        onClose={() => setShowRecentChatsModal(false)}
        onOpenChat={handleOpenRecentChat}
      />

      {/* Screen 3, 4A, 4B, 5: Complete Calling Experience Modal */}
      {callingContact && (
        <CallScreenModal
          visible={!!callingContact}
          contact={callingContact}
          onClose={() => setCallingContact(null)}
        />
      )}

      {/* WhatsApp-Style Long-Press Context Menu Modal */}
      <ContactContextMenuModal
        visible={!!longPressedContact}
        contact={longPressedContact}
        isBlocked={longPressedContact ? isBlocked(longPressedContact.id) : false}
        isPinned={longPressedContact ? isPinned(longPressedContact.id) : false}
        isMuted={longPressedContact ? isMuted(longPressedContact.id) : false}
        onClose={() => setLongPressedContact(null)}
        onDelete={(c) => deleteContact(c.id)}
        onToggleBlock={(c) => toggleBlockContact(c)}
        onTogglePin={(c) => togglePinContact(c.id)}
        onToggleMute={(c) => toggleMuteContact(c.id)}
        onViewInfo={handleToggleExpandContact}
      />

      {/* 3-Dots Options Menu Popup matching user screenshot */}
      <HeaderOptionsMenu
        visible={showOptionsMenu}
        onClose={() => setShowOptionsMenu(false)}
        topInset={topInset}
        onDelete={handleDeleteOption}
        onToggleHideBlocked={handleToggleBlocked}
        onToggleHideOtherApps={handleToggleOtherApps}
        onTotalCallTime={handleTotalCallTime}
        onViewTags={handleViewTags}
        onSettings={handleSettingsOption}
        onViewBlockedContacts={() => navigation.navigate('BlockedContacts')}
      />

      {/* Country Picker Dropdown */}
      <CountryPickerDropdown
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        topInset={topInset}
        selectedCountry={selectedCountry}
        onSelectCountry={(country) => setSelectedCountry(country)}
      />

      {/* Themed Alert Modal for Voice Search */}
      <ThemedAlertModal
        visible={voiceAlertVisible}
        title="No Contact Found"
        message="no contact found with this name"
        spokenText={voiceAlertQuery}
        buttonText="Okay"
        onClose={() => setVoiceAlertVisible(false)}
      />

      {/* Register Your Own Business Modal */}
      <RegisterBusinessModal
        visible={showRegisterBusinessModal}
        onClose={() => setShowRegisterBusinessModal(false)}
      />

      {/* User Profile & Mobile Photo Upload Modal */}
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onOpenRegisterBusiness={() => {
          setShowProfileModal(false);
          setTimeout(() => setShowRegisterBusinessModal(true), 120);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  appIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerMenuBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerFlagBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerFlagEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  headerProfileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerProfileImg: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  listContainer: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
    paddingBottom: 24,
    paddingRight: 22, // leave room for alphabet index
  },
  sectionHeaderWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  alphabetIndexBar: {
    position: 'absolute',
    right: 3,
    top: 10,
    bottom: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    width: 16,
  },
  alphabetChar: {
    fontSize: 8.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 54,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13.5,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 19,
  },
  grantPermissionBtn: {
    marginTop: 8,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grantPermissionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recentChatsFab: {
    position: 'absolute',
    bottom: 84,
    right: 18,
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    zIndex: 99,
  },
  businessContactFab: {
    position: 'absolute',
    bottom: 22,
    right: 18,
    height: 46,
    borderRadius: 23,
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    overflow: 'hidden',
    zIndex: 99,
  },
  fabTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingLeft: 7,
    gap: 8,
  },
  fabInnerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessFabText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
