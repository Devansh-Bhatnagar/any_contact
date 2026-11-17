import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Share,
  Alert,
  Platform,
  BackHandler,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Business } from '../../types/business';
import { PhoneBookContact } from '../../types/phoneBook';
import { Icon } from '../common/Icon';
import { BusinessAvatar } from '../common/BusinessAvatar';
import { ContactSettingsModal } from '../phonebook/ContactSettingsModal';
import { useTheme } from '../../hooks/useTheme';
import { usePhoneBook } from '../../store/PhoneBookContext';
import { useBusinesses } from '../../store/BusinessContext';
import { LinkingService } from '../../services/linkingService';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../constants/categories';
import { getOfferColor } from '../../constants/offerColors';
import { OFFER_FLAG_IMAGE } from '../../constants/imageAssets';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BusinessDetailSheetProps {
  visible: boolean;
  business: Business | null;
  onClose: () => void;
  onCall: (phone: string, name: string) => void;
  onMessage?: (phone: string, name: string) => void;
  onVideoCall?: (phone: string, name: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export const BusinessDetailSheet: React.FC<BusinessDetailSheetProps> = ({
  visible,
  business: propBusiness,
  onClose,
  onCall,
  onMessage,
  onVideoCall,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { isBlocked, toggleBlockContact, deleteContact } = usePhoneBook();
  const { fetchBusinessDetails, getBusinessById } = useBusinesses();
  const [showSettings, setShowSettings] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [detailedBusiness, setDetailedBusiness] = useState<Business | null>(null);

  useEffect(() => {
    let active = true;
    if (
      visible &&
      propBusiness?.id &&
      !propBusiness.id.startsWith('biz-local-')
    ) {
      fetchBusinessDetails(propBusiness.id).then((fresh) => {
        if (active && fresh) {
          setDetailedBusiness(fresh);
        }
      });
    } else if (!visible) {
      setDetailedBusiness(null);
    }
    return () => {
      active = false;
    };
  }, [visible, propBusiness?.id, fetchBusinessDetails]);

  const business = useMemo(() => {
    if (!propBusiness) return null;
    if (detailedBusiness && detailedBusiness.id === propBusiness.id) {
      return { ...propBusiness, ...detailedBusiness };
    }
    const ctxBiz = getBusinessById(propBusiness.id);
    return ctxBiz ? { ...propBusiness, ...ctxBiz } : propBusiness;
  }, [propBusiness, detailedBusiness, getBusinessById]);

  // Exact vertical inset calculations so top and bottom margins are identical
  const statusBarHeight =
    Platform.OS === 'android'
      ? (StatusBar.currentHeight || insets.top || 24)
      : insets.top;
  const bottomInset = insets.bottom;

  // Smooth entrance & exit animations for the floating modal
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShowFullDescription(false);
      animVal.setValue(0);
      Animated.spring(animVal, {
        toValue: 1,
        damping: 24,
        mass: 0.85,
        stiffness: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(animVal, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  // Intercept Android hardware back press so it smoothly animates closed
  useEffect(() => {
    if (!visible) return;

    const onBackPress = () => {
      handleClose();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [visible, onClose]);

  const phoneBookContact: PhoneBookContact = useMemo(() => {
    if (!business) {
      return {
        id: '',
        name: '',
        avatar: '',
        primaryPhone: '',
        phoneNumbers: [],
        email: '',
        hasApp: true,
      };
    }
    return {
      id: business.id,
      name: business.name,
      category: business.category,
      avatar: business.image || '',
      primaryPhone: business.phone,
      phoneNumbers: [{ label: 'Work', number: business.phone }],
      email: business.email || `${business.name.toLowerCase().replace(/[^a-z]/g, '')}@business.com`,
      hasApp: true,
      isFavorite: isFavorite,
    };
  }, [business, isFavorite]);

  if (!business) return null;

  const categoryColor =
    CATEGORY_COLORS[business.category as keyof typeof CATEGORY_COLORS] || colors.primary;
  const categoryIcon =
    CATEGORY_ICONS[business.category as keyof typeof CATEGORY_ICONS] || 'briefcase';

  const handleShare = async () => {
    try {
      await Share.share({
        title: business.name,
        message: `${business.name}\n📞 ${business.phone}\n📍 ${business.address}, ${business.city}\n${business.website || ''}\nShared via Leads Phone Book`,
      });
    } catch {
      // ignore
    }
  };

  const handleCall = () => {
    onCall(business.phone, business.name);
  };

  const handleMessage = () => {
    if (onMessage) {
      onMessage(business.phone, business.name);
    } else {
      LinkingService.sendMessage(business.phone);
    }
  };

  const handleVideoCall = () => {
    if (onVideoCall) {
      onVideoCall(business.phone, business.name);
    } else {
      Alert.alert(
        'Video Call',
        `Start video call with ${business.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Call',
            onPress: () => onCall(business.phone, business.name),
          },
        ]
      );
    }
  };

  const handleInvite = () => {
    const inviteMessage = `Hey ${business.name}! Connect with me on Leads Phone Book: https://anycontact.app/download`;
    LinkingService.sendMessage(business.phone, inviteMessage);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${business.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteContact(business.id);
            handleClose();
          },
        },
      ]
    );
  };

  const handleDirections = () => {
    LinkingService.openDirections(
      business.latitude,
      business.longitude,
      business.name
    );
  };

  const handleEmail = () => {
    if (business.email) {
      LinkingService.openEmail(business.email, `Inquiry regarding ${business.name}`);
    }
  };

  const handleWebsite = () => {
    if (business.website) {
      LinkingService.openWebsite(business.website);
    }
  };

  const backdropOpacity = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const cardScale = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  const cardTranslateY = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const cardOpacity = animVal.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.8, 1],
  });

  // Feature list items in 2 clean columns
  const featureRows = [
    [
      { label: 'Verified contact', checked: true },
      { label: 'Quick response', checked: true },
    ],
    [
      { label: 'Location & maps', checked: !!business.address },
      { label: business.rating && business.rating >= 4 ? 'Top rated' : 'Reliable service', checked: true },
    ],
    [
      { label: 'Active business', checked: true },
      { label: business.email ? 'Email support' : 'Direct calling', checked: true },
    ],
    [
      { label: business.openingHours ? 'Operating hours' : 'Regular hours', checked: !!business.openingHours },
      { label: 'Safe & trusted', checked: true },
    ],
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableWithoutFeedback>
            <View style={styles.centerWrapper}>
              {/* Premium Floating Card */}
              <Animated.View
                style={[
                  styles.cardContainer,
                  {
                    backgroundColor: isDark ? '#1E2024' : '#FFFFFF',
                    borderColor: isDark ? '#2E3238' : 'rgba(0, 0, 0, 0.08)',
                    transform: [{ scale: cardScale }, { translateY: cardTranslateY }],
                    opacity: cardOpacity,
                  },
                ]}
              >
                {/* Clean Top Header Bar */}
                <View style={styles.cardHeaderBar}>
                  <View
                    style={[
                      styles.headerCategoryPill,
                      {
                        backgroundColor: `${categoryColor}16`,
                        borderColor: `${categoryColor}32`,
                      },
                    ]}
                  >
                    <Icon
                      name={categoryIcon}
                      size={12}
                      color={categoryColor}
                      strokeWidth={2.4}
                    />
                    <Text
                      style={[styles.headerCategoryText, { color: categoryColor }]}
                      numberOfLines={1}
                    >
                      {business.category}
                    </Text>
                  </View>

                  <View style={styles.headerRightActions}>
                    {onToggleFavorite && (
                      <TouchableOpacity
                        style={[
                          styles.headerActionBtn,
                          { backgroundColor: isDark ? '#2D3036' : '#F1F3F5' },
                        ]}
                        onPress={() => onToggleFavorite(business.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon
                          name={isFavorite ? 'heart-fill' : 'heart'}
                          size={16}
                          color={isFavorite ? '#EF4444' : isDark ? '#9CA3AF' : '#64748B'}
                        />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.headerActionBtn,
                        { backgroundColor: isDark ? '#2D3036' : '#F1F3F5' },
                      ]}
                      onPress={handleShare}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon
                        name="share"
                        size={15}
                        color={isDark ? '#9CA3AF' : '#64748B'}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.headerActionBtn,
                        { backgroundColor: isDark ? '#2D3036' : '#F1F3F5' },
                      ]}
                      onPress={handleClose}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon
                        name="close"
                        size={15}
                        color={isDark ? '#9CA3AF' : '#64748B'}
                        strokeWidth={2.4}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Scrollable Body: Profile, Customers say, Contact details */}
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  contentContainerStyle={styles.cardScrollContent}
                >
                  {/* Profile Header Row */}
                  <View style={styles.profileRow}>
                    <View
                      style={[
                        styles.avatarContainer,
                        {
                          borderColor: isDark ? '#374151' : '#E5E7EB',
                          backgroundColor: isDark ? '#282A2E' : '#F8FAFC',
                        },
                      ]}
                    >
                      <BusinessAvatar
                        image={business.image}
                        category={business.category}
                        name={business.name}
                        size={78}
                        borderRadius={18}
                        fallbackColor={categoryColor}
                      />
                    </View>

                    <View style={styles.profileInfoBox}>
                      <View style={styles.businessTitleRow}>
                        <Text
                          style={[
                            styles.businessTitle,
                            { color: isDark ? '#F9FAFB' : '#111827' },
                          ]}
                          numberOfLines={2}
                        >
                          {business.name}
                        </Text>
                        {business.verified !== false ? (
                          <Icon name="verified-badge" size={18} color="#25D366" />
                        ) : null}
                      </View>

                      {business.rating ? (
                        <View style={styles.ratingRow}>
                          <Icon name="star-fill" size={13} color="#F59E0B" />
                          <Text style={styles.ratingScore}>
                            {business.rating.toFixed(1)}
                          </Text>
                          {business.reviewCount ? (
                            <Text
                              style={[
                                styles.reviewCountText,
                                { color: isDark ? '#9CA3AF' : '#6B7280' },
                              ]}
                            >
                              ({business.reviewCount} reviews)
                            </Text>
                          ) : null}
                        </View>
                      ) : null}

                      {/* Phone pill */}
                      <TouchableOpacity
                        style={[
                          styles.phoneChip,
                          {
                            backgroundColor: isDark
                              ? 'rgba(34, 197, 94, 0.12)'
                              : '#F0FDF4',
                            borderColor: isDark
                              ? 'rgba(34, 197, 94, 0.25)'
                              : '#DCFCE7',
                          },
                        ]}
                        onPress={handleCall}
                        activeOpacity={0.7}
                      >
                        <Icon name="phone" size={12} color="#16A34A" strokeWidth={2.4} />
                        <Text
                          style={[
                            styles.phoneChipText,
                            { color: isDark ? '#4ADE80' : '#15803D' },
                          ]}
                          numberOfLines={1}
                        >
                          {business.phone}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Highlights Card ("Customers say") */}
                  <View
                    style={[
                      styles.highlightsCard,
                      {
                        backgroundColor: isDark
                          ? 'rgba(56, 189, 248, 0.08)'
                          : '#F0F7FF',
                        borderColor: isDark
                          ? 'rgba(56, 189, 248, 0.2)'
                          : '#E0EFFF',
                      },
                    ]}
                  >
                    <View style={styles.highlightsHeaderRow}>
                      <Text
                        style={[
                          styles.highlightsTitle,
                          { color: isDark ? '#F3F4F6' : '#0F172A' },
                        ]}
                      >
                        Customers say
                      </Text>
                      <View style={styles.aiTagBadge}>
                        <Icon name="sparkles" size={12} color="#0284C7" />
                        <Text style={styles.aiTagBadgeText}>Verified</Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.highlightsSummary,
                        { color: isDark ? '#D1D5DB' : '#334155' },
                      ]}
                      numberOfLines={showFullDescription ? undefined : 3}
                    >
                      {business.description ||
                        `Customers find ${business.name} offers dependable service and professional standards, providing quick assistance and trusted support for all requirements.`}
                    </Text>

                    <TouchableOpacity
                      onPress={() => setShowFullDescription(!showFullDescription)}
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      style={styles.seeMoreBtn}
                    >
                      <Text style={styles.seeMoreText}>
                        {showFullDescription ? 'See less' : 'See more'}
                      </Text>
                    </TouchableOpacity>

                    {/* Features checklist */}
                    <View style={styles.checklistGrid}>
                      {featureRows.map((row, rIndex) => (
                        <View key={`feat-row-${rIndex}`} style={styles.checklistRow}>
                          <View style={styles.checklistCol}>
                            {row[0].checked ? (
                              <Icon
                                name="check"
                                size={13}
                                color="#0D9488"
                                strokeWidth={2.8}
                              />
                            ) : (
                              <Text style={styles.dashSymbol}>—</Text>
                            )}
                            <Text
                              style={[
                                styles.checkLabel,
                                { color: isDark ? '#E2E8F0' : '#1E293B' },
                              ]}
                              numberOfLines={1}
                            >
                              {row[0].label}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.colDivider,
                              {
                                backgroundColor: isDark
                                  ? 'rgba(255, 255, 255, 0.12)'
                                  : 'rgba(0, 0, 0, 0.1)',
                              },
                            ]}
                          />

                          <View style={styles.checklistCol}>
                            {row[1].checked ? (
                              <Icon
                                name="check"
                                size={13}
                                color="#0D9488"
                                strokeWidth={2.8}
                              />
                            ) : (
                              <Text style={styles.dashSymbol}>—</Text>
                            )}
                            <Text
                              style={[
                                styles.checkLabel,
                                { color: isDark ? '#E2E8F0' : '#1E293B' },
                              ]}
                              numberOfLines={1}
                            >
                              {row[1].label}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Section Title */}
                  <Text
                    style={[
                      styles.sectionHeading,
                      { color: isDark ? '#9CA3AF' : '#6B7280' },
                    ]}
                  >
                    CONTACT & LOCATION
                  </Text>

                  {/* Contact Details Inset Group Card */}
                  <View
                    style={[
                      styles.detailsGroupCard,
                      {
                        backgroundColor: isDark ? '#24272C' : '#F9FAFB',
                        borderColor: isDark ? '#32363D' : '#E5E7EB',
                      },
                    ]}
                  >
                    {/* Phone Row */}
                    <TouchableOpacity
                      style={styles.detailItemRow}
                      onPress={handleCall}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.detailIconCircle,
                          { backgroundColor: 'rgba(34, 197, 94, 0.12)' },
                        ]}
                      >
                        <Icon name="phone" size={16} color="#16A34A" strokeWidth={2.2} />
                      </View>
                      <View style={styles.detailItemText}>
                        <Text
                          style={[
                            styles.detailItemValue,
                            { color: isDark ? '#F9FAFB' : '#111827' },
                          ]}
                        >
                          {business.phone}
                        </Text>
                        <Text style={styles.detailItemLabel}>Mobile / Work • Tap to Call</Text>
                      </View>
                      <Icon name="chevron-right" size={14} color="#9CA3AF" />
                    </TouchableOpacity>

                    {/* Email Row */}
                    {business.email ? (
                      <TouchableOpacity
                        style={[
                          styles.detailItemRow,
                          {
                            borderTopWidth: StyleSheet.hairlineWidth,
                            borderTopColor: isDark ? '#32363D' : '#E5E7EB',
                          },
                        ]}
                        onPress={handleEmail}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.detailIconCircle,
                            { backgroundColor: 'rgba(37, 99, 235, 0.12)' },
                          ]}
                        >
                          <Icon name="mail" size={16} color="#2563EB" strokeWidth={2.2} />
                        </View>
                        <View style={styles.detailItemText}>
                          <Text
                            style={[
                              styles.detailItemValue,
                              { color: isDark ? '#F9FAFB' : '#111827' },
                            ]}
                            numberOfLines={1}
                          >
                            {business.email}
                          </Text>
                          <Text style={styles.detailItemLabel}>Official Email • Tap to Compose</Text>
                        </View>
                        <Icon name="chevron-right" size={14} color="#9CA3AF" />
                      </TouchableOpacity>
                    ) : null}

                    {/* Address Row */}
                    {business.address ? (
                      <TouchableOpacity
                        style={[
                          styles.detailItemRow,
                          {
                            borderTopWidth: StyleSheet.hairlineWidth,
                            borderTopColor: isDark ? '#32363D' : '#E5E7EB',
                          },
                        ]}
                        onPress={handleDirections}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.detailIconCircle,
                            { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
                          ]}
                        >
                          <Icon name="map-pin" size={16} color="#EF4444" strokeWidth={2.2} />
                        </View>
                        <View style={styles.detailItemText}>
                          <Text
                            style={[
                              styles.detailItemValue,
                              { color: isDark ? '#F9FAFB' : '#111827' },
                            ]}
                            numberOfLines={2}
                          >
                            {business.address}, {business.city}
                          </Text>
                          <Text style={styles.detailItemLabel}>Address • Tap for Directions</Text>
                        </View>
                        <Icon name="chevron-right" size={14} color="#9CA3AF" />
                      </TouchableOpacity>
                    ) : null}

                    {/* Opening Hours Row */}
                    {business.openingHours ? (
                      <View
                        style={[
                          styles.detailItemRow,
                          {
                            borderTopWidth: StyleSheet.hairlineWidth,
                            borderTopColor: isDark ? '#32363D' : '#E5E7EB',
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.detailIconCircle,
                            { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
                          ]}
                        >
                          <Icon name="clock" size={16} color="#F59E0B" strokeWidth={2.2} />
                        </View>
                        <View style={styles.detailItemText}>
                          <Text
                            style={[
                              styles.detailItemValue,
                              { color: isDark ? '#F9FAFB' : '#111827' },
                            ]}
                          >
                            {business.openingHours}
                          </Text>
                          <Text style={styles.detailItemLabel}>Operating Hours</Text>
                        </View>
                      </View>
                    ) : null}

                    {/* Website Row */}
                    {business.website ? (
                      <TouchableOpacity
                        style={[
                          styles.detailItemRow,
                          {
                            borderTopWidth: StyleSheet.hairlineWidth,
                            borderTopColor: isDark ? '#32363D' : '#E5E7EB',
                          },
                        ]}
                        onPress={handleWebsite}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.detailIconCircle,
                            { backgroundColor: 'rgba(147, 51, 234, 0.12)' },
                          ]}
                        >
                          <Icon name="globe" size={16} color="#9333EA" strokeWidth={2.2} />
                        </View>
                        <View style={styles.detailItemText}>
                          <Text
                            style={[
                              styles.detailItemValue,
                              { color: isDark ? '#F9FAFB' : '#111827' },
                            ]}
                            numberOfLines={1}
                          >
                            {business.website}
                          </Text>
                          <Text style={styles.detailItemLabel}>Official Website • Tap to Visit</Text>
                        </View>
                        <Icon name="chevron-right" size={14} color="#9CA3AF" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Social Media Links */}
                  {business.socials && Object.keys(business.socials).length > 0 ? (
                    <View style={styles.socialsWrapper}>
                      <Text
                        style={[
                          styles.sectionHeading,
                          { color: isDark ? '#9CA3AF' : '#6B7280' },
                        ]}
                      >
                        SOCIAL CHANNELS
                      </Text>
                      <View style={styles.socialsPillRow}>
                        {business.socials.instagram ? (
                          <TouchableOpacity
                            style={[
                              styles.socialChip,
                              { backgroundColor: isDark ? '#282A2E' : '#F1F3F5' },
                            ]}
                            onPress={() =>
                              LinkingService.openInstagram(business.socials!.instagram!)
                            }
                            activeOpacity={0.7}
                          >
                            <Icon name="instagram" size={15} color="#E1306C" strokeWidth={2} />
                            <Text
                              style={[
                                styles.socialChipText,
                                { color: isDark ? '#E4E6EB' : '#1C1E21' },
                              ]}
                            >
                              Instagram
                            </Text>
                          </TouchableOpacity>
                        ) : null}

                        {business.socials.facebook ? (
                          <TouchableOpacity
                            style={[
                              styles.socialChip,
                              { backgroundColor: isDark ? '#282A2E' : '#F1F3F5' },
                            ]}
                            onPress={() =>
                              LinkingService.openFacebook(business.socials!.facebook!)
                            }
                            activeOpacity={0.7}
                          >
                            <Icon name="facebook" size={15} color="#1877F2" strokeWidth={2} />
                            <Text
                              style={[
                                styles.socialChipText,
                                { color: isDark ? '#E4E6EB' : '#1C1E21' },
                              ]}
                            >
                              Facebook
                            </Text>
                          </TouchableOpacity>
                        ) : null}

                        {business.socials.linkedin ? (
                          <TouchableOpacity
                            style={[
                              styles.socialChip,
                              { backgroundColor: isDark ? '#282A2E' : '#F1F3F5' },
                            ]}
                            onPress={() =>
                              LinkingService.openLinkedIn(business.socials!.linkedin!)
                            }
                            activeOpacity={0.7}
                          >
                            <Icon name="linkedin" size={15} color="#0A66C2" strokeWidth={2} />
                            <Text
                              style={[
                                styles.socialChipText,
                                { color: isDark ? '#E4E6EB' : '#1C1E21' },
                              ]}
                            >
                              LinkedIn
                            </Text>
                          </TouchableOpacity>
                        ) : null}

                        {business.socials.youtube ? (
                          <TouchableOpacity
                            style={[
                              styles.socialChip,
                              { backgroundColor: isDark ? '#282A2E' : '#F1F3F5' },
                            ]}
                            onPress={() =>
                              LinkingService.openYouTube(business.socials!.youtube!)
                            }
                            activeOpacity={0.7}
                          >
                            <Icon name="youtube" size={15} color="#FF0000" strokeWidth={2} />
                            <Text
                              style={[
                                styles.socialChipText,
                                { color: isDark ? '#E4E6EB' : '#1C1E21' },
                              ]}
                            >
                              YouTube
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  ) : null}

                  {/* Live Services (GET /businesses/:id) */}
                  {business.services && business.services.length > 0 ? (
                    <View style={styles.extraSection}>
                      <Text
                        style={[
                          styles.extraSectionTitle,
                          { color: isDark ? '#B0B3B8' : '#65676B' },
                        ]}
                      >
                        Services
                      </Text>
                      {business.services.map((svc) => (
                        <View
                          key={svc.id}
                          style={[
                            styles.extraCard,
                            {
                              backgroundColor: isDark ? '#25282E' : '#F4F6F9',
                              borderColor: isDark ? '#32363E' : '#E5E7EB',
                            },
                          ]}
                        >
                          <View style={styles.extraCardHeader}>
                            <Text
                              style={[
                                styles.extraCardTitle,
                                { color: isDark ? '#FFFFFF' : '#111827' },
                              ]}
                            >
                              {svc.name}
                            </Text>
                            {svc.price ? (
                              <Text style={[styles.extraPrice, { color: colors.primary }]}>
                                {svc.price}
                              </Text>
                            ) : null}
                          </View>
                          {svc.description ? (
                            <Text
                              style={[
                                styles.extraCardDesc,
                                { color: isDark ? '#B0B3B8' : '#4B5563' },
                              ]}
                            >
                              {svc.description}
                            </Text>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {/* Live Products (GET /businesses/:id) */}
                  {business.products && business.products.length > 0 ? (
                    <View style={styles.extraSection}>
                      <Text
                        style={[
                          styles.extraSectionTitle,
                          { color: isDark ? '#B0B3B8' : '#65676B' },
                        ]}
                      >
                        Products
                      </Text>
                      {business.products.map((prod) => (
                        <View
                          key={prod.id}
                          style={[
                            styles.extraCard,
                            {
                              backgroundColor: isDark ? '#25282E' : '#F4F6F9',
                              borderColor: isDark ? '#32363E' : '#E5E7EB',
                            },
                          ]}
                        >
                          <View style={styles.extraCardHeader}>
                            <Text
                              style={[
                                styles.extraCardTitle,
                                { color: isDark ? '#FFFFFF' : '#111827' },
                              ]}
                            >
                              {prod.name}
                            </Text>
                            {prod.price ? (
                              <Text style={[styles.extraPrice, { color: colors.primary }]}>
                                {prod.price}
                              </Text>
                            ) : null}
                          </View>
                          {prod.description ? (
                            <Text
                              style={[
                                styles.extraCardDesc,
                                { color: isDark ? '#B0B3B8' : '#4B5563' },
                              ]}
                            >
                              {prod.description}
                            </Text>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {/* Live Promotions & Offers */}
                  {(() => {
                    const offersList =
                      business.offers && business.offers.length > 0
                        ? business.offers.map((off, idx) => ({ id: `off-${idx}`, title: off, description: undefined }))
                        : (business.promotions || []);
                    if (offersList.length === 0) return null;
                    const topColor = getOfferColor(offersList[0].title);
                    return (
                      <View style={styles.extraSection}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <Image
                            source={OFFER_FLAG_IMAGE}
                            style={{ width: 28, height: 24 }}
                            resizeMode="contain"
                          />
                          <Text
                            style={[
                              styles.extraSectionTitle,
                              { color: isDark ? '#B0B3B8' : '#65676B', marginBottom: 0, flex: 1 },
                            ]}
                          >
                            Special Offers & Deals
                          </Text>
                          <Image
                            // source={OFFER_FLAG_IMAGE}
                            style={{ width: 26, height: 22 }}
                            resizeMode="contain"
                          />
                        </View>
                        {offersList.map((promo, idx) => {
                          const itemColor = getOfferColor(promo.title, idx);
                          return (
                            <View
                              key={promo.id}
                              style={[
                                styles.extraCard,
                                {
                                  backgroundColor: isDark ? '#25282E' : itemColor.badgeBg,
                                  borderColor: isDark ? itemColor.borderDark : itemColor.border,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 10,
                                },
                              ]}
                            >
                              <Image
                                source={OFFER_FLAG_IMAGE}
                                style={{ width: 24, height: 21 }}
                                resizeMode="contain"
                              />
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[
                                    styles.extraCardTitle,
                                    { color: isDark ? '#FFFFFF' : itemColor.text },
                                  ]}
                                >
                                  {promo.title}
                                </Text>
                                {promo.description ? (
                                  <Text
                                    style={[
                                      styles.extraCardDesc,
                                      { color: isDark ? '#B0B3B8' : itemColor.text },
                                    ]}
                                  >
                                    {promo.description}
                                  </Text>
                                ) : null}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })()}
                </ScrollView>

                {/* 5 Professional Bottom Action Buttons: Call, Video Call, Message, Invite, Delete */}
                <View
                  style={[
                    styles.bottomActionsBar,
                    {
                      backgroundColor: isDark ? '#1E2024' : '#FFFFFF',
                      borderTopColor: isDark ? '#2E3238' : '#EEF0F2',
                    },
                  ]}
                >
                  {/* 1. Call */}
                  <TouchableOpacity
                    style={styles.actionBtnItem}
                    onPress={handleCall}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.actionBtnCircle,
                        { backgroundColor: '#10B981' },
                      ]}
                    >
                      <Icon name="phone" size={19} color="#FFFFFF" strokeWidth={2.4} />
                    </View>
                    <Text
                      style={[
                        styles.actionBtnLabel,
                        { color: isDark ? '#E5E7EB' : '#1F2937' },
                      ]}
                    >
                      Call
                    </Text>
                  </TouchableOpacity>

                  {/* 2. Video Call */}
                  <TouchableOpacity
                    style={styles.actionBtnItem}
                    onPress={handleVideoCall}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.actionBtnCircle,
                        { backgroundColor: '#059669' },
                      ]}
                    >
                      <Icon name="video" size={19} color="#FFFFFF" strokeWidth={2.2} />
                    </View>
                    <Text
                      style={[
                        styles.actionBtnLabel,
                        { color: isDark ? '#E5E7EB' : '#1F2937' },
                      ]}
                    >
                      Video Call
                    </Text>
                  </TouchableOpacity>

                  {/* 3. Message */}
                  <TouchableOpacity
                    style={styles.actionBtnItem}
                    onPress={handleMessage}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.actionBtnCircle,
                        { backgroundColor: '#2563EB' },
                      ]}
                    >
                      <Icon name="message" size={19} color="#FFFFFF" strokeWidth={2.2} />
                    </View>
                    <Text
                      style={[
                        styles.actionBtnLabel,
                        { color: isDark ? '#E5E7EB' : '#1F2937' },
                      ]}
                    >
                      Message
                    </Text>
                  </TouchableOpacity>

                  {/* 4. Invite */}
                  <TouchableOpacity
                    style={styles.actionBtnItem}
                    onPress={handleInvite}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.actionBtnCircle,
                        { backgroundColor: '#7C3AED' },
                      ]}
                    >
                      <Icon name="user-plus" size={19} color="#FFFFFF" strokeWidth={2.2} />
                    </View>
                    <Text
                      style={[
                        styles.actionBtnLabel,
                        { color: isDark ? '#E5E7EB' : '#1F2937' },
                      ]}
                    >
                      Invite
                    </Text>
                  </TouchableOpacity>

                  {/* 5. Delete */}
                  <TouchableOpacity
                    style={styles.actionBtnItem}
                    onPress={handleDelete}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.actionBtnCircle,
                        { backgroundColor: '#b75e5eff' },
                      ]}
                    >
                      <Icon name="trash" size={19} color="#FFFFFF" strokeWidth={2.2} />
                    </View>
                    <Text
                      style={[
                        styles.actionBtnLabel,
                        { color: '#EF4444' },
                      ]}
                    >
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* Contact Settings Modal */}
      <ContactSettingsModal
        visible={showSettings}
        contact={phoneBookContact}
        isFavorite={isFavorite}
        isBlocked={isBlocked(business.id)}
        onClose={() => setShowSettings(false)}
        onEmail={handleEmail}
        onToggleFavorite={() => {
          if (onToggleFavorite) {
            onToggleFavorite(business.id);
          }
        }}
        onToggleBlock={() => {
          toggleBlockContact(phoneBookContact);
        }}
        onDeleteContact={() => {
          deleteContact(business.id);
          setShowSettings(false);
          handleClose();
        }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  centerWrapper: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },
  cardContainer: {
    width: '100%',
    minHeight: Math.min(SCREEN_HEIGHT * 0.74, 580),
    maxHeight: '75%',
    borderRadius: 24,
    borderWidth: 1,
    elevation: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    overflow: 'hidden',
  },
  cardHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: '55%',
  },
  headerCategoryText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 2,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 18,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileInfoBox: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  businessTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  businessTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 22,
    flexShrink: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  ratingScore: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#D97706',
  },
  reviewCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  phoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  phoneChipText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  highlightsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  highlightsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  highlightsTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  aiTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  aiTagBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.1,
  },
  highlightsSummary: {
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '400',
  },
  seeMoreBtn: {
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  seeMoreText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  checklistGrid: {
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checklistCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  checkLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  dashSymbol: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    width: 14,
    textAlign: 'center',
  },
  colDivider: {
    width: 1,
    height: 13,
    marginHorizontal: 8,
  },
  sectionHeading: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  detailsGroupCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  detailItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  detailIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailItemText: {
    flex: 1,
  },
  detailItemValue: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  detailItemLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 1,
  },
  socialsWrapper: {
    marginBottom: 6,
  },
  socialsPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  socialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
  },
  socialChipText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  extraSection: {
    marginTop: 10,
    gap: 6,
  },
  extraSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  extraCard: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
  },
  extraCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  extraCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  extraPrice: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  extraCardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  bottomActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderTopWidth: 1,
  },
  actionBtnItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  actionBtnCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
  },
  actionBtnLabel: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
