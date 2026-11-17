import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
  StatusBar,
  Alert,
  Linking,
  Animated,
  Easing,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Keyboard,
  BackHandler,
  UIManager,
  LayoutAnimation,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Business } from '../../types/business';
import { EmergencyItem, PhoneBookContact } from '../../types/phoneBook';
import { Icon } from '../common/Icon';
import { useTheme } from '../../hooks/useTheme';
import { useBusinesses } from '../../hooks/useBusinesses';
import { ContactListItem } from './ContactListItem';
import { ContactSettingsModal } from './ContactSettingsModal';
import { useNavigation } from '@react-navigation/native';
import { EmergencyAccessRail } from './EmergencyAccessRail';
import { RecentlyViewedRail } from './RecentlyViewedRail';
import { DigitalMarketingBanner } from './DigitalMarketingBanner';
import { BusinessDetailSheet } from '../business/BusinessDetailSheet';
import { LinkingService } from '../../services/linkingService';
import { usePhoneBook } from '../../store/PhoneBookContext';
import {
  CATEGORY_LOCAL_IMAGES,
  DEFAULT_BUSINESS_LOGO,
} from '../../constants/imageAssets';

import {
  BUSINESS_CATEGORIES,
  BusinessCategoryGroup,
  getBusinessDistance,
  getDynamicBusinessCategories,
} from '../../data/businessCategoriesData';
import { RecentChatsModal } from './RecentChatsModal';
import { WhatsAppChatModal, ChatMessage } from './WhatsAppChatModal';
import {
  startNativeSpeechRecognition,
  isVoiceRecognitionAvailable,
  findCategoryOrBusinessForVoiceQuery,
  isVoiceCallIntent,
  findContactOrCategoryForVoiceCall,
} from '../../services/voiceSearchService';
import { ThemedAlertModal } from '../common/ThemedAlertModal';
import { RegisterBusinessModal } from '../business/RegisterBusinessModal';

interface BusinessContactsModalProps {
  visible: boolean;
  onClose: () => void;
  onCall: (contact: PhoneBookContact) => void;
  onMessage: (contact: PhoneBookContact, initialMessages?: ChatMessage[], fromRecentChats?: boolean) => void;
}

interface CategoryAccordionItemProps {
  item: BusinessCategoryGroup;
  index: number;
  isExpanded: boolean;
  currentLimit: number;
  isDark: boolean;
  cardBg: string;
  borderColor: string;
  colors: any;
  onToggle: (catId: string, index: number) => void;
  onLoadMore: (catId: string, index: number) => void;
  onLoadLess: (catId: string) => void;
  onOpenBusinessDetail: (contact: PhoneBookContact) => void;
  onCall: (contact: PhoneBookContact) => void;
  onMessage: (contact: PhoneBookContact) => void;
  onVideoCall: (contact: PhoneBookContact) => void;
  onInviteContact: (contact: PhoneBookContact) => void;
  onOpenContactSettings: (contact: PhoneBookContact) => void;
  isFavorite: (id: string) => boolean;
  isBlocked: (id: string) => boolean;
  isPinned: (id: string) => boolean;
}

interface AnimatedCategoryItemRowProps {
  index: number;
  children: React.ReactNode;
}

const AnimatedCategoryItemRow: React.FC<AnimatedCategoryItemRowProps> = ({ index, children }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gentle staggered delay based on item index (40ms interval, max 160ms)
    const delay = Math.min(index * 40, 160);
    const timeout = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, [index]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.6, 1],
  });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

const CategoryAccordionItem: React.FC<CategoryAccordionItemProps> = React.memo(({
  item,
  index,
  isExpanded,
  currentLimit,
  isDark,
  cardBg,
  borderColor,
  colors,
  onToggle,
  onLoadMore,
  onLoadLess,
  onOpenBusinessDetail,
  onCall,
  onMessage,
  onVideoCall,
  onInviteContact,
  onOpenContactSettings,
  isFavorite,
  isBlocked,
  isPinned,
}) => {
  const chevronAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  const bodyAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(chevronAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    if (isExpanded) {
      bodyAnim.setValue(0);
      Animated.timing(bodyAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [isExpanded]);

  const chevronRotation = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const bodyOpacity = bodyAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.5, 1],
  });

  const bodyTranslateY = bodyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });

  const visibleBusinesses = item.businesses.slice(0, currentLimit);
  const hasMore = currentLimit < item.businesses.length;
  const remainingCount = item.businesses.length - currentLimit;

  return (
    <View
      style={[
        styles.categoryCard,
        {
          backgroundColor: cardBg,
          borderColor: isExpanded ? item.color + '65' : borderColor,
          shadowColor: isExpanded ? item.color : '#000000',
          shadowOffset: { width: 0, height: isExpanded ? 3 : 1 },
          shadowOpacity: isExpanded ? 0.2 : (isDark ? 0.2 : 0.04),
          shadowRadius: isExpanded ? 8 : 3,
          elevation: isExpanded ? 3 : 1,
        },
      ]}
    >
      {/* Category Header Row (Tap to expand/collapse dropdown) */}
      <Pressable
        style={({ pressed }) => [
          styles.categoryHeader,
          pressed && { opacity: 0.78, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
        ]}
        android_ripple={{
          color: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        }}
        onPress={() => onToggle(item.id, index)}
      >
        <View style={styles.categoryHeaderLeft}>
          <View style={[styles.categoryIconWrap, { backgroundColor: item.bgColor }]}>
            <Icon name={item.icon} size={22} color={item.color} strokeWidth={2.2} />
          </View>
          <View style={styles.categoryTextCol}>
            <Text
              style={[
                styles.categoryTitle,
                { color: isDark ? '#F8FAFC' : '#0F172A' },
              ]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {item.hindiName ? (
              <Text
                style={[
                  styles.categorySubtitle,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
                numberOfLines={1}
              >
                {item.hindiName}
              </Text>
            ) : (
              <Text
                style={[
                  styles.categorySubtitle,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
                numberOfLines={1}
              >
                {item.businesses.length} Verified Contacts
              </Text>
            )}
          </View>
        </View>

        <View style={styles.categoryHeaderRight}>
          {/* Verified Count Pill Badge */}
          <View
            style={[
              styles.categoryCountBadge,
              {
                backgroundColor: item.color + '15',
                borderColor: item.color + '35',
              },
            ]}
          >
            <Text
              style={[
                styles.categoryCountText,
                { color: item.color },
              ]}
            >
              {item.businesses.length} Places
            </Text>
          </View>

          {/* Smooth Rotating Chevron Animation */}
          <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
            <Icon
              name="chevron-down"
              size={18}
              color={isExpanded ? item.color : (isDark ? '#94A3B8' : '#64748B')}
              strokeWidth={2.4}
            />
          </Animated.View>
        </View>
      </Pressable>

      {/* Dropdown Content: 5-by-5 Pagination with Load More */}
      {isExpanded && (
        <Animated.View
          style={[
            styles.categoryBody,
            {
              borderTopColor: isDark ? '#334155' : '#E2E8F0',
              opacity: bodyOpacity,
              transform: [{ translateY: bodyTranslateY }],
            },
          ]}
        >
          {visibleBusinesses.map((biz, idx) => (
            <AnimatedCategoryItemRow key={biz.id} index={idx}>
              <ContactListItem
                contact={biz}
                isExpanded={false}
                isFavorite={isFavorite(biz.id)}
                isBlocked={isBlocked(biz.id)}
                isPinned={isPinned(biz.id)}
                onPress={onOpenBusinessDetail}
                onCall={onCall}
                onMessage={onMessage}
                onVideoCall={onVideoCall}
                onInvite={onInviteContact}
                onOpenSettings={onOpenContactSettings}
              />
            </AnimatedCategoryItemRow>
          ))}

          {/* Pagination Controls */}
          <View style={styles.paginationRow}>
            {hasMore && (
              <TouchableOpacity
                style={[
                  styles.loadMoreBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: item.color + '40',
                  },
                ]}
                onPress={() => onLoadMore(item.id, index)}
                activeOpacity={0.75}
              >
                <Text style={[styles.loadMoreText, { color: item.color }]}>
                  View More ({remainingCount} more)
                </Text>
                <Icon name="chevron-down" size={16} color={item.color} strokeWidth={2.4} />
              </TouchableOpacity>
            )}

            {currentLimit > 5 && (
              <TouchableOpacity
                style={[
                  styles.loadLessBtn,
                  {
                    backgroundColor: isDark ? '#2D1B22' : '#FFF1F2',
                    borderColor: isDark ? '#4C1D24' : '#FFE4E6',
                  },
                ]}
                onPress={() => onLoadLess(item.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.loadLessText, { color: '#E11D48' }]}>
                  Show Less
                </Text>
                <Icon name="chevron-up" size={16} color="#E11D48" strokeWidth={2.4} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
});

export const BusinessContactsModal: React.FC<BusinessContactsModalProps> = ({
  visible,
  onClose,
  onCall,
  onMessage,
}) => {
  const navigation = useNavigation<any>();
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleDigitalAutomationPress = () => {
    onClose();
    navigation.navigate('DigitalAutomation');
  };
  const {
    contacts,
    isBlocked,
    isPinned,
    isFavorite,
    toggleBlockContact,
    toggleFavoriteContact,
    recentContacts,
    recordContactView,
  } = usePhoneBook();
  const { businesses, isLoading, refreshBusinesses } = useBusinesses();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible && businesses.length === 0 && !isLoading) {
      refreshBusinesses();
    }
  }, [visible, businesses.length, isLoading, refreshBusinesses]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshBusinesses();
    } finally {
      setRefreshing(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const isSearching = isSearchFocused || searchQuery.trim().length > 0;
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);
  const [settingsContact, setSettingsContact] = useState<PhoneBookContact | null>(null);
  const [selectedDetailBusiness, setSelectedDetailBusiness] = useState<Business | null>(null);
  const [showRecentChatsModal, setShowRecentChatsModal] = useState<boolean>(false);
  const [chatContact, setChatContact] = useState<PhoneBookContact | null>(null);
  const [customChatMessages, setCustomChatMessages] = useState<ChatMessage[] | undefined>(undefined);
  const [openedFromRecentChats, setOpenedFromRecentChats] = useState<boolean>(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [categoryPageSizes, setCategoryPageSizes] = useState<Record<string, number>>({});
  const [voiceAlertVisible, setVoiceAlertVisible] = useState<boolean>(false);
  const [voiceAlertQuery, setVoiceAlertQuery] = useState<string>('');
  const [voiceAlertTitle, setVoiceAlertTitle] = useState<string>('No Results Found');
  const [voiceAlertMessage, setVoiceAlertMessage] = useState<string>(
    'No business category or contact found matching your search'
  );
  const [showRegisterBusinessModal, setShowRegisterBusinessModal] = useState<boolean>(false);

  const flatListRef = useRef<FlatList<BusinessCategoryGroup>>(null);
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
  const touchStartY = useRef(0);
  const step1TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const step2TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [railsHeight, setRailsHeight] = useState<number>(260);
  const scrollAnim = useRef(new Animated.Value(0)).current;

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

  // Intercept Android hardware back press: close child sheets/modals first without closing the Business Contacts page
  useEffect(() => {
    if (!visible) return;

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
      if (selectedDetailBusiness) {
        setSelectedDetailBusiness(null);
        return true;
      }
      if (settingsContact) {
        setSettingsContact(null);
        return true;
      }
      if (showRecentChatsModal) {
        setShowRecentChatsModal(false);
        return true;
      }
      onClose();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [visible, chatContact, selectedDetailBusiness, settingsContact, showRecentChatsModal, openedFromRecentChats, onClose]);

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
  const headerStateRef = useRef<'visible' | 'collapsed'>('visible');
  const isExpandingRef = useRef(false);

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

  const expandHeader = showHeader;
  const collapseHeader = hideHeader;

  // 2-step animation: runs ONCE per modal open
  // Step 1 (at 2s): Emergency & Recent contacts glide up smoothly behind Digital Automation
  // Step 2 (3s after step 1 finishes): Digital Automation button itself collapses
  useEffect(() => {
    if (!visible) {
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
      lastScrollY.current = 0;
      setSearchQuery('');
      setIsSearchFocused(false);
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

    // Step 1: after 2s, collapse Emergency & Recent contacts smoothly behind Digital Automation
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
        // Step 2: 3s after step 1 finishes, collapse Digital Automation banner
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
  }, [visible]);

  // Shrink FAB to icon on scroll up, expand back on scroll down
  // Show/hide header based on scroll direction & touch
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    if (isAutoScrolling.current) {
      lastScrollY.current = currentY;
      return;
    }
    const diff = currentY - lastScrollY.current;

    // --- FAB collapse/expand ---
    if (diff > 8 && currentY > 25) {
      if (isFabExpanded.current) {
        isFabExpanded.current = false;
        Animated.spring(fabAnim, {
          toValue: 0,
          useNativeDriver: false,
          bounciness: 4,
          speed: 16,
        }).start();
      }
    } else if (diff < -6) {
      if (!isFabExpanded.current) {
        isFabExpanded.current = true;
        Animated.spring(fabAnim, {
          toValue: 1,
          useNativeDriver: false,
          bounciness: 4,
          speed: 16,
        }).start();
      }
    }

    // --- Header show/hide on scroll ---
    // If scrolling down towards top (offset decreasing) or near top: bring down header
    if (diff < -6 || currentY <= 5) {
      if (headerStateRef.current === 'collapsed') {
        showHeader();
      }
    } else if (diff > 12 && currentY > 60 && !isExpandingRef.current) {
      // If scrolling up into category list: hide header
      if (headerStateRef.current === 'visible') {
        hideHeader();
      }
    }

    lastScrollY.current = currentY;
  };

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20
  );
  const bottomFabBase = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? 24 : 16
  ) + 32;

  // Map businesses to PhoneBookContact format matching contacts screen with reliable local images
  const businessContacts: PhoneBookContact[] = useMemo(() => {
    const list = businesses || [];
    return list.map((b: Business) => ({
      id: b.id,
      name: b.name,
      category: b.category,
      avatar: b.image || '',
      distance: getBusinessDistance(b.id, b.name),
      primaryPhone: b.phone,
      phoneNumbers: [{ label: 'Work', number: b.phone }],
      email: b.email || `${b.name.toLowerCase().replace(/[^a-z]/g, '')}@business.com`,
      hasApp: true,
      isFavorite: b.isBestie,
      offers:
        b.offers && b.offers.length > 0
          ? b.offers
          : b.promotions && b.promotions.length > 0
          ? b.promotions.map((p) => p.title).filter(Boolean)
          : undefined,
    }));
  }, [businesses]);

  // Filter categories based on search query
  const filteredCategories: BusinessCategoryGroup[] = useMemo(() => {
    let list = getDynamicBusinessCategories(businesses);

    // Filter by search query across category name and business contacts
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const qNorm = q
        .replace(/&/g, 'and')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      list = list
        .map((cat) => {
          const catNameNorm = cat.name
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          const catMatches =
            cat.name.toLowerCase().includes(q) ||
            (qNorm.length >= 3 && catNameNorm.includes(qNorm)) ||
            (catNameNorm.length >= 3 && qNorm.includes(catNameNorm)) ||
            (cat.hindiName && cat.hindiName.includes(q));
          const matchingBusinesses = cat.businesses.filter(
            (b) =>
              b.name.toLowerCase().includes(q) ||
              b.primaryPhone.includes(q) ||
              (b.email && b.email.toLowerCase().includes(q))
          );
          if (catMatches) {
            return cat;
          }
          if (matchingBusinesses.length > 0) {
            return {
              ...cat,
              businesses: matchingBusinesses,
            };
          }
          return null;
        })
        .filter((c): c is BusinessCategoryGroup => c !== null);
    }

    return list;
  }, [searchQuery, businesses]);

  // Auto-expand matching categories on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const allOpen: Record<string, boolean> = {};
      filteredCategories.forEach((c) => {
        allOpen[c.id] = true;
      });
      setExpandedCategories((prev) => ({ ...prev, ...allOpen }));
    }
  }, [searchQuery, filteredCategories]);

  // Toggle category dropdown open/close with smooth native animation & auto-scroll
  const handleToggleCategory = (catId: string, index?: number) => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    LayoutAnimation.configureNext({
      duration: 400,
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

    const isOpening = !expandedCategories[catId];
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: isOpening,
    }));
    setCategoryPageSizes((prev) => ({
      ...prev,
      [catId]: prev[catId] || 5,
    }));

    // Auto-scroll when category is tapped so that the selected category and listings are fully visible
    if (isOpening && typeof index === 'number') {
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index,
            viewPosition: index >= 4 ? 0.12 : 0.08,
            animated: true,
          });
        } catch {
          // Handled by onScrollToIndexFailed
        }
      }, 150);
    }
  };

  // Load more 5 items for a category with layout animation & scroll adjustment
  const handleLoadMore = (catId: string, index?: number) => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    LayoutAnimation.configureNext({
      duration: 400,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });

    setCategoryPageSizes((prev) => ({
      ...prev,
      [catId]: (prev[catId] || 5) + 5,
    }));

    // Smoothly scroll down so the newly revealed listings are visible
    if (typeof index === 'number') {
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index,
            viewPosition: 0.35,
            animated: true,
          });
        } catch {
          // Handled by onScrollToIndexFailed
        }
      }, 150);
    }
  };

  // Load less: hide expanded items and reset back to initial 5 with smooth transition
  const handleLoadLess = (catId: string) => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    LayoutAnimation.configureNext({
      duration: 400,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });

    setCategoryPageSizes((prev) => ({
      ...prev,
      [catId]: 5,
    }));
  };

  // Handle Voice Search & Voice Call for Business Contacts & Categories
  const handleVoiceSearch = async () => {
    try {
      if (!isVoiceRecognitionAvailable()) {
        setVoiceAlertTitle('Notice');
        setVoiceAlertMessage('Voice recognition is not available on this device');
        setVoiceAlertQuery('');
        setVoiceAlertVisible(true);
        return;
      }

      const spoken = await startNativeSpeechRecognition(
        "Say 'call restaurants' or 'search restaurants and sweets'"
      );
      if (!spoken || !spoken.trim()) return;

      // 1. Direct Call Intent ("jab hum call bole or kisi bhi category ka name le to call lgg jaani chaiiyeh")
      if (isVoiceCallIntent(spoken)) {
        const targetContact = findContactOrCategoryForVoiceCall(
          spoken,
          contacts,
          BUSINESS_CATEGORIES
        );

        if (targetContact) {
          recordContactView(targetContact);
          onClose();
          onCall(targetContact);
          return;
        } else {
          setVoiceAlertTitle('No Contact Found');
          setVoiceAlertMessage('no contact found with this name');
          setVoiceAlertQuery(spoken);
          setVoiceAlertVisible(true);
          return;
        }
      }

      // 2. Search Intent ("search resturents and sweets" -> open category and show all items)
      const matchResult = findCategoryOrBusinessForVoiceQuery(spoken, BUSINESS_CATEGORIES);

      if (matchResult && matchResult.category) {
        const cat = matchResult.category;

        // Set search query so search bar reflects the category/business and filters cleanly
        if (matchResult.type === 'business' && matchResult.matchedBusiness) {
          setSearchQuery(matchResult.matchedBusiness.name);
        } else {
          setSearchQuery(cat.name);
        }

        setIsSearchFocused(false);
        Keyboard.dismiss();

        // Expand the matched category
        setExpandedCategories((prev) => ({
          ...prev,
          [cat.id]: true,
        }));

        // Open ALL items of this category ("vo vaali category ke saare item open ho jaane chaiyeh")
        setCategoryPageSizes((prev) => ({
          ...prev,
          [cat.id]: Math.max(50, cat.businesses.length),
        }));

        // Smoothly scroll to top so the category items are immediately in view
        setTimeout(() => {
          try {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          } catch {
            // Handled
          }
        }, 120);
      } else {
        // No match found - show themed alert without initiating any call
        setVoiceAlertTitle('No Results Found');
        setVoiceAlertMessage('No business category or contact found matching your search');
        setVoiceAlertQuery(spoken || '');
        setVoiceAlertVisible(true);
      }
    } catch (err: any) {
      const errMsg = err?.message || '';
      if (errMsg.includes('CANCELLED') || err?.code === 'CANCELLED') {
        return;
      }
      setVoiceAlertTitle('No Results Found');
      setVoiceAlertMessage('No business category or contact found matching your search');
      setVoiceAlertQuery('');
      setVoiceAlertVisible(true);
    }
  };

  // Open full business details bottom sheet on contact press
  const handleOpenBusinessDetail = (contact: PhoneBookContact) => {
    recordContactView(contact);
    const fullBiz = businesses.find((b) => b.id === contact.id);
    if (fullBiz) {
      setSelectedDetailBusiness(fullBiz);
    } else {
      setSelectedDetailBusiness({
        id: contact.id,
        name: contact.name,
        category: (contact.category as any) || 'Services',
        phone: contact.primaryPhone,
        address: 'Commercial Market, Central Complex',
        city: 'Local City',
        description: `Verified ${contact.category || 'business'} services with top customer ratings and quick response.`,
        image: contact.avatar || '',
        latitude: 28.6139,
        longitude: 77.209,
        email: contact.email,
        isBestie: isFavorite(contact.id),
        rating: 4.8,
        reviewCount: 142,
        openingHours: '09:00 AM - 08:30 PM (Mon-Sat)',
        tagline: 'Verified Professional Service',
      });
    }
  };

  const handleDetailCall = (phone: string, name: string) => {
    const contact = businessContacts.find((c) => c.primaryPhone === phone) || {
      id: selectedDetailBusiness?.id || 'biz-call',
      name: name,
      avatar: selectedDetailBusiness?.image || '',
      primaryPhone: phone,
      phoneNumbers: [{ label: 'Work', number: phone }],
      email: selectedDetailBusiness?.email || '',
      hasApp: true,
    };
    setSelectedDetailBusiness(null);
    onClose();
    onCall(contact);
  };

  const handleDetailMessage = (phone: string, name: string) => {
    const contact = businessContacts.find((c) => c.primaryPhone === phone) || {
      id: selectedDetailBusiness?.id || 'biz-msg',
      name: name,
      avatar: selectedDetailBusiness?.image || '',
      primaryPhone: phone,
      phoneNumbers: [{ label: 'Work', number: phone }],
      email: selectedDetailBusiness?.email || '',
      hasApp: true,
    };
    setSelectedDetailBusiness(null);
    setChatContact(contact);
  };

  const handleDetailVideoCall = (phone: string, name: string) => {
    const contact = businessContacts.find((c) => c.primaryPhone === phone) || {
      id: selectedDetailBusiness?.id || 'biz-vid',
      name: name,
      avatar: selectedDetailBusiness?.image || '',
      primaryPhone: phone,
      phoneNumbers: [{ label: 'Work', number: phone }],
      email: selectedDetailBusiness?.email || '',
      hasApp: true,
    };
    setSelectedDetailBusiness(null);
    handleVideoCall(contact);
  };

  const handleOpenContactSettings = (contact: PhoneBookContact) => {
    setSettingsContact(contact);
  };

  const handleVideoCall = (contact: PhoneBookContact) => {
    Alert.alert(
      'Video Call',
      `Start video call with ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            onClose();
            onCall(contact);
          },
        },
      ]
    );
  };

  const handleInviteContact = (contact: PhoneBookContact) => {
    const inviteMessage = `Hey ${contact.name}! Connect with me on Leads Phone Book: https://anycontact.app/download`;
    LinkingService.sendMessage(contact.primaryPhone, inviteMessage);
  };

  // Handle emergency call from shared emergency rail
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

    onClose();
    onCall(emergencyContact);
  };

  // Handle select recent contact from shared recent rail
  const handleSelectRecentContact = (contact: PhoneBookContact) => {
    handleOpenBusinessDetail(contact);
  };



  const bgColor = isDark ? '#18191A' : '#FFFFFF';
  const textColor = isDark ? '#E4E6EB' : '#050505';
  const subTextColor = isDark ? '#8A8D91' : '#65676B';
  const cardBg = isDark ? '#242526' : '#F0F2F5';
  const borderColor = isDark ? '#3A3B3C' : '#E4E6EB';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
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
          return;
        }
        if (selectedDetailBusiness) {
          setSelectedDetailBusiness(null);
          return;
        }
        if (settingsContact) {
          setSettingsContact(null);
          return;
        }
        if (showRecentChatsModal) {
          setShowRecentChatsModal(false);
          return;
        }
        onClose();
      }}
    >
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Header - exactly identical layout to ContactsScreen */}
        <View style={[styles.topHeader, { paddingTop: topInset + 12 }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon
                name="arrow-left"
                size={22}
                color={textColor}
                strokeWidth={2.4}
              />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              Business Contacts
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[
                styles.headerAddBtn,
                {
                  backgroundColor: isDark ? 'rgba(24, 119, 242, 0.18)' : '#EFF6FF',
                  borderColor: isDark ? 'rgba(96, 165, 250, 0.35)' : '#BFDBFE',
                },
              ]}
              onPress={() => setShowRegisterBusinessModal(true)}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 6 }}
            >
              <Icon
                name="plus"
                size={18}
                color={isDark ? '#60A5FA' : '#1877F2'}
                strokeWidth={2.4}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerMenuBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
            >
              <Icon
                name="close"
                size={20}
                color={subTextColor}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar - exactly identical layout to ContactsScreen */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: cardBg,
                borderColor: borderColor,
              },
            ]}
          >
            <Icon
              name="search"
              size={18}
              color={subTextColor}
              strokeWidth={2}
            />
            <TextInput
              style={[
                styles.searchInput,
                { color: textColor },
              ]}
              placeholder="Search business contacts..."
              placeholderTextColor={subTextColor}
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
                  color={subTextColor}
                  strokeWidth={2.2}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleVoiceSearch}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon
                  name="mic"
                  size={18}
                  color={subTextColor}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories Accordion List Container */}
        <View style={styles.listContainer}>
          <FlatList
            ref={flatListRef}
            data={filteredCategories}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
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
                offset: Math.max(0, info.highestMeasuredFrameIndex > 0 ? info.averageItemLength * info.index : info.index * 85),
                animated: true,
              });
              setTimeout(() => {
                try {
                  flatListRef.current?.scrollToIndex({
                    index: info.index,
                    viewPosition: info.index >= 4 ? 0.12 : 0.08,
                    animated: true,
                  });
                } catch {
                  // Fallback handled
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
                        onPress={handleDigitalAutomationPress}
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
                          onSelect={handleSelectRecentContact}
                        />
                      </View>
                    </Animated.View>
                  </View>

                  {/* Section Header */}
                  <View style={styles.sectionHeaderWrap}>
                    <Text
                      style={[
                        styles.sectionHeaderText,
                        { color: isDark ? '#F8FAFC' : '#0F172A' },
                      ]}
                    >
                      Business Categories
                    </Text>
                    <Text
                      style={[
                        styles.sectionSubheaderText,
                        { color: isDark ? '#94A3B8' : '#64748B' },
                      ]}
                    >
                      Tap any category to view verified contacts
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
                    Business Categories
                  </Text>
                </View>
              )
            }
            renderItem={({ item, index }) => (
              <CategoryAccordionItem
                item={item}
                index={index}
                isExpanded={!!expandedCategories[item.id]}
                currentLimit={categoryPageSizes[item.id] || 5}
                isDark={isDark}
                cardBg={cardBg}
                borderColor={borderColor}
                colors={colors}
                onToggle={handleToggleCategory}
                onLoadMore={handleLoadMore}
                onLoadLess={handleLoadLess}
                onOpenBusinessDetail={handleOpenBusinessDetail}
                onCall={(c) => {
                  recordContactView(c);
                  onClose();
                  onCall(c);
                }}
                onMessage={(c) => {
                  recordContactView(c);
                  setChatContact(c);
                }}
                onVideoCall={handleVideoCall}
                onInviteContact={handleInviteContact}
                onOpenContactSettings={handleOpenContactSettings}
                isFavorite={isFavorite}
                isBlocked={isBlocked}
                isPinned={isPinned}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="search" size={32} color="#94A3B8" />
                <Text
                  style={[
                    styles.emptyText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  No categories matching "{searchQuery}"
                </Text>
              </View>
            }
          />

          {/* Top Floating Button: Recent Chats (Larger White Squircle 58x58 with chat-plus icon, above My Contacts) */}
          <TouchableOpacity
            style={[
              styles.recentChatsFab,
              { bottom: bottomFabBase + 58 },
            ]}
            onPress={() => setShowRecentChatsModal(true)}
            activeOpacity={0.85}
          >
            <Icon name="chat-plus" size={30} color="#1C2127" />
          </TouchableOpacity>

          {/* Bottom Floating Button: My Contacts (shows icon + name "My Contacts", shrinks on scroll, at the bottom) */}
          <Animated.View
            style={[
              styles.businessContactFab,
              {
                bottom: bottomFabBase,
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                width: fabAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [46, 150],
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
              onPress={onClose}
              activeOpacity={0.85}
            >
              <View style={styles.fabInnerCircle}>
                <Icon name="users" size={17} color={colors.primary} strokeWidth={2.4} />
              </View>
              <Animated.View
                style={{
                  opacity: fabAnim.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: [0, 0, 1],
                  }),
                  maxWidth: fabAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 100],
                  }),
                  overflow: 'hidden',
                }}
              >
                <Text style={styles.businessFabText} numberOfLines={1}>
                  My Contacts
                </Text>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* WhatsApp Recent Chats Modal */}
        <RecentChatsModal
          visible={showRecentChatsModal}
          onClose={() => setShowRecentChatsModal(false)}
          onOpenChat={(contact, initialMessages) => {
            setOpenedFromRecentChats(true);
            setShowRecentChatsModal(false);
            setCustomChatMessages(initialMessages);
            setChatContact(contact);
          }}
        />

        {/* Contact Settings Modal - same as ContactsScreen */}
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
              Alert.alert('Business Removed', `${c.name} removed from list.`);
              setSettingsContact(null);
            }}
          />
        )}

        {/* Business Details Bottom Sheet */}
        <BusinessDetailSheet
          visible={!!selectedDetailBusiness}
          business={selectedDetailBusiness}
          onClose={() => setSelectedDetailBusiness(null)}
          onCall={handleDetailCall}
          onMessage={handleDetailMessage}
          onVideoCall={handleDetailVideoCall}
          isFavorite={selectedDetailBusiness ? isFavorite(selectedDetailBusiness.id) : false}
          onToggleFavorite={(id) => toggleFavoriteContact(id)}
        />

        {/* WhatsApp Chatting Section Modal directly inside Business Contacts */}
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
              onCall(c);
            }}
            onViewContactDetails={(c) => {
              setChatContact(null);
              handleOpenBusinessDetail(c);
            }}
            onBlockContact={(c) => toggleBlockContact(c)}
          />
        )}

        {/* Themed Alert Modal for Voice Search */}
        <ThemedAlertModal
          visible={voiceAlertVisible}
          title={voiceAlertTitle}
          message={voiceAlertMessage}
          spokenText={voiceAlertQuery}
          buttonText="Okay"
          onClose={() => setVoiceAlertVisible(false)}
        />

        {/* Register Business Form Modal */}
        <RegisterBusinessModal
          visible={showRegisterBusinessModal}
          onClose={() => setShowRegisterBusinessModal(false)}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAddBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMenuBtn: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingBottom: 160,
    paddingRight: 0,
  },
  sectionHeaderWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubheaderText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  categoryCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  categoryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTextCol: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  categorySubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  categoryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryCountBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  categoryBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 4,
    paddingBottom: 10,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    gap: 10,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    flex: 1,
  },
  loadLessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    flex: 1,
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  loadLessText: {
    fontSize: 13,
    fontWeight: '700',
  },
  allLoadedBadge: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  allLoadedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recentChatsFab: {
    position: 'absolute',
    bottom: 116,
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
    bottom: 56,
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
