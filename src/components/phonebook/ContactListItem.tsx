import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Pressable, Easing } from 'react-native';
import { PhoneBookContact } from '../../types/phoneBook';
import { Icon } from '../common/Icon';
import { useTheme } from '../../hooks/useTheme';
import { LinkingService } from '../../services/linkingService';
import {
  CATEGORY_LOCAL_IMAGES,
  DEFAULT_BUSINESS_LOGO,
  DEFAULT_USER_AVATAR,
  OFFER_FLAG_IMAGE,
} from '../../constants/imageAssets';
import { getOfferColor } from '../../constants/offerColors';

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

const getInitials = (name: string) => {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('') || 'C'
  );
};

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

interface ContactListItemProps {
  contact: PhoneBookContact;
  isExpanded?: boolean;
  onPress: (contact: PhoneBookContact) => void;
  onLongPress?: (contact: PhoneBookContact) => void;
  onCall: (contact: PhoneBookContact) => void;
  onMessage?: (contact: PhoneBookContact) => void;
  onVideoCall?: (contact: PhoneBookContact) => void;
  onInvite?: (contact: PhoneBookContact) => void;
  onOpenSettings?: (contact: PhoneBookContact) => void;
  isBlocked?: boolean;
  isPinned?: boolean;
  isFavorite?: boolean;
}

export const ContactListItem: React.FC<ContactListItemProps> = React.memo(({
  contact,
  isExpanded = false,
  onPress,
  onLongPress,
  onCall,
  onMessage,
  onVideoCall,
  onInvite,
  onOpenSettings,
  isBlocked = false,
  isPinned = false,
  isFavorite = false,
}) => {
  const { isDark, colors } = useTheme();

  const mainOfferColor = useMemo(() => {
    return contact.offers && contact.offers.length > 0
      ? getOfferColor(contact.offers[0])
      : null;
  }, [contact.offers]);

  // Luxurious, smooth, slowly-expanding Samsung One UI animations (~380ms)
  const actionsAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  const headerAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  useEffect(() => {
    if (isExpanded) {
      actionsAnim.setValue(0);
      headerAnim.setValue(0);
      Animated.parallel([
        Animated.timing(actionsAnim, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isExpanded]);

  const actionsFade = actionsAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.45, 1],
  });

  const actionsSlide = actionsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  const actionsScale = actionsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1],
  });

  const headerOpacity = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1],
  });

  const handleMessage = () => {
    if (onMessage) {
      onMessage(contact);
    } else {
      LinkingService.sendMessage(contact.primaryPhone);
    }
  };

  const handleVideoCall = () => {
    if (onVideoCall) {
      onVideoCall(contact);
    } else {
      onCall(contact);
    }
  };

  const handleInvite = () => {
    if (onInvite) {
      onInvite(contact);
    } else {
      const inviteMsg = `Hey ${contact.name}! Connect with me on Leads Phone Book: https://anycontact.app/download`;
      LinkingService.sendMessage(contact.primaryPhone, inviteMsg);
    }
  };

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [contact.id, contact.avatar]);

  // Compute unique avatar source
  const avatarSource = useMemo(() => {
    if (contact.avatar && typeof contact.avatar === 'string' && contact.avatar.trim() && !imageError) {
      return { uri: contact.avatar };
    }
    if (contact.localImage) {
      return contact.localImage;
    }
    if (contact.category && CATEGORY_LOCAL_IMAGES[contact.category] && !imageError) {
      return CATEGORY_LOCAL_IMAGES[contact.category];
    }
    return null;
  }, [contact.avatar, contact.localImage, contact.category, imageError]);

  return (
    <View style={styles.itemRoot}>
      {isExpanded ? (
        /* 1. Samsung One UI Expanded Card Layout */
        <View
          style={[
            styles.expandedCard,
            {
              backgroundColor: isDark ? '#242526' : '#F0F2F5',
              borderColor: isDark ? '#3A3B3C' : '#E4E6EB',
            },
          ]}
        >
          {/* Top Header of Expanded Card: Contact Name, Mobile info, & Avatar */}
          <Pressable
            style={({ pressed }) => [
              styles.expandedHeaderRow,
              pressed && { opacity: 0.78 },
            ]}
            android_ripple={{
              color: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            }}
            onPress={() => onPress(contact)}
          >
            <Animated.View style={[styles.expandedInfoCol, { opacity: headerOpacity }]}>
              <View style={styles.expandedNameRow}>
                <Text
                  style={[
                    styles.expandedNameText,
                    { color: isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                  numberOfLines={1}
                >
                  {contact.name}
                </Text>
                {mainOfferColor && (
                  <Image
                    source={OFFER_FLAG_IMAGE}
                    style={styles.offerFlagImage}
                    resizeMode="contain"
                  />
                )}
                {isFavorite && (
                  <Icon name="star-fill" size={14} color="#F59E0B" />
                )}
                {isPinned && (
                  <Icon name="pin" size={13} color="#3B82F6" strokeWidth={2.5} />
                )}
                {isBlocked && (
                  <View style={styles.blockedBadge}>
                    <Text style={styles.blockedText}>Blocked</Text>
                  </View>
                )}
              </View>

              {/* Expanded Sub Info: Mobile Phone(s) and Distance */}
              {contact.phoneNumbers && contact.phoneNumbers.length > 1 ? (
                <View style={styles.multiPhoneWrap}>
                  {contact.phoneNumbers.map((pn, pIdx) => (
                    <TouchableOpacity
                      key={`${pn.number}-${pIdx}`}
                      style={[
                        styles.multiPhonePill,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                        },
                      ]}
                      onPress={() => onCall({ ...contact, primaryPhone: pn.number })}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.multiPhoneLabelText,
                          { color: isDark ? '#94A3B8' : '#64748B' },
                        ]}
                      >
                        {pn.label || 'Mobile'}:
                      </Text>
                      <Text
                        style={[
                          styles.multiPhoneNumberText,
                          { color: isDark ? '#F8FAFC' : '#0F172A' },
                        ]}
                      >
                        {pn.number}
                      </Text>
                      <Icon
                        name="phone"
                        size={12}
                        color="#16A34A"
                        strokeWidth={2.2}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text
                  style={[
                    styles.expandedPhoneSubText,
                    { color: isDark ? '#B0B3B8' : '#65676B' },
                  ]}
                  numberOfLines={1}
                >
                  {contact.phoneNumbers?.[0]?.label || 'Mobile'} {contact.primaryPhone}
                </Text>
              )}
              {contact.distance ? (
                <View style={styles.distanceBadge}>
                  <Icon
                    name="map-pin"
                    size={11.5}
                    color="#0866FF"
                    strokeWidth={2.4}
                  />
                  <Text style={[styles.distanceText, { color: isDark ? '#60A5FA' : '#0866FF' }]}>
                    {contact.distance} away
                  </Text>
                </View>
              ) : null}

              {/* Samsung Style Call/Status Indicator */}
              <View style={styles.samsungCallInfoRow}>
                <Icon
                  name="phone"
                  size={12}
                  color={isDark ? '#94A3B8' : '#64748B'}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.samsungCallInfoText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  Mobile • Tap to call or chat
                </Text>
              </View>
            </Animated.View>

            {/* Right Circular Avatar */}
            <View style={styles.expandedAvatarBorder}>
              {avatarSource ? (
                <Image
                  source={avatarSource}
                  style={styles.expandedAvatarImg}
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <View
                  style={[
                    styles.expandedInitialsAvatar,
                    { backgroundColor: getAvatarColor(contact.name) },
                  ]}
                >
                  <Text style={styles.expandedInitialsText}>
                    {getInitials(contact.name)}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>

          {/* Active Offers Banner (if any) */}
          {mainOfferColor && contact.offers && contact.offers.length > 0 && (
            <View
              style={[
                styles.expandedOffersCard,
                {
                  backgroundColor: isDark ? mainOfferColor.badgeBgDark : mainOfferColor.badgeBg,
                  borderColor: isDark ? mainOfferColor.borderDark : mainOfferColor.border,
                },
              ]}
            >
              <View style={styles.expandedOffersHeader}>
                <Image
                  source={OFFER_FLAG_IMAGE}
                  style={styles.expandedHeaderFlagImg}
                  resizeMode="contain"
                />
                <Text style={[styles.expandedOffersHeaderTitle, { color: isDark ? mainOfferColor.textDark : mainOfferColor.text }]}>
                  Active Offers & Deals ({contact.offers.length})
                </Text>
              </View>
              <View style={styles.expandedOffersChipsRow}>
                {contact.offers.map((off, oIdx) => {
                  const itemColor = getOfferColor(off, oIdx);
                  return (
                    <View
                      key={oIdx}
                      style={[
                        styles.expandedOfferChip,
                        {
                          backgroundColor: isDark ? '#23252B' : '#FFFFFF',
                          borderColor: isDark ? itemColor.borderDark : itemColor.border,
                        },
                      ]}
                    >
                      <Icon name="flag-fill" size={11} color={itemColor.primary} />
                      <Text style={[styles.expandedOfferChipText, { color: isDark ? itemColor.textDark : itemColor.text }]}>
                        {off}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* 5 Circular Action Buttons: Call, Chat, Video Call, Invite, Settings */}
          <Animated.View
            style={[
              styles.samsungActionsRow,
              {
                opacity: actionsFade,
                transform: [
                  { translateY: actionsSlide },
                  { scale: actionsScale },
                ],
              },
            ]}
          >
            {/* 1. Call */}
            <TouchableOpacity
              style={[
                styles.samsungActionBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(34, 197, 94, 0.22)'
                    : '#DCFCE7',
                },
              ]}
              onPress={() => onCall(contact)}
              activeOpacity={0.7}
            >
              <Icon name="phone" size={20} color="#16A34A" strokeWidth={2.2} />
            </TouchableOpacity>

            {/* 2. Chat */}
            <TouchableOpacity
              style={[
                styles.samsungActionBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(30, 96, 242, 0.22)'
                    : '#EBF2FE',
                },
              ]}
              onPress={handleMessage}
              activeOpacity={0.7}
            >
              <Icon name="message" size={20} color={colors.primary} strokeWidth={2} />
            </TouchableOpacity>

            {/* 3. Video Call */}
            <TouchableOpacity
              style={[
                styles.samsungActionBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(34, 197, 94, 0.22)'
                    : '#DCFCE7',
                },
              ]}
              onPress={handleVideoCall}
              activeOpacity={0.7}
            >
              <Icon name="video" size={20} color="#16A34A" strokeWidth={2} />
            </TouchableOpacity>

            {/* 4. Invite */}
            <TouchableOpacity
              style={[
                styles.samsungActionBtn,
                { backgroundColor: isDark ? '#3A3B3C' : '#E4E6EB' },
              ]}
              onPress={handleInvite}
              activeOpacity={0.7}
            >
              <Icon
                name="user-plus"
                size={20}
                color={isDark ? '#E4E6EB' : '#1C1E21'}
                strokeWidth={2}
              />
            </TouchableOpacity>

            {/* 5. Settings */}
            <TouchableOpacity
              style={[
                styles.samsungActionBtn,
                { backgroundColor: isDark ? '#3A3B3C' : '#E4E6EB' },
              ]}
              onPress={() => onOpenSettings && onOpenSettings(contact)}
              activeOpacity={0.7}
            >
              <Icon
                name="settings"
                size={20}
                color={isDark ? '#E4E6EB' : '#1C1E21'}
                strokeWidth={2}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      ) : (
        /* 2. Normal Collapsed Contact Row with instant Samsung hover/press feedback */
        <Pressable
          android_ripple={{
            color: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            foreground: true,
          }}
          style={({ pressed }) => [
            styles.container,
            {
              borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              backgroundColor: pressed
                ? (isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.045)')
                : (isPinned
                    ? (isDark ? 'rgba(30, 96, 242, 0.08)' : 'rgba(30, 96, 242, 0.04)')
                    : 'transparent'),
            },
          ]}
          onPress={() => onPress(contact)}
          onLongPress={() => onLongPress && onLongPress(contact)}
        >
          {/* Avatar */}
          <View style={styles.avatarBorder}>
            {mainOfferColor && (
              <View style={styles.avatarOfferFlagWrap}>
                <Image
                  source={OFFER_FLAG_IMAGE}
                  style={styles.avatarOfferFlagImg}
                  resizeMode="contain"
                />
              </View>
            )}
            {avatarSource ? (
              <Image
                source={avatarSource}
                style={styles.avatarImg}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <View
                style={[
                  styles.initialsAvatar,
                  { backgroundColor: getAvatarColor(contact.name) },
                ]}
              >
                <Text style={styles.initialsText}>
                  {getInitials(contact.name)}
                </Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoCol}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.nameText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}
                numberOfLines={1}
              >
                {contact.name}
              </Text>
              {mainOfferColor && (
                <Image
                  source={OFFER_FLAG_IMAGE}
                  style={styles.offerFlagImage}
                  resizeMode="contain"
                />
              )}
              {isFavorite && (
                <Icon name="star-fill" size={13} color="#F59E0B" />
              )}
              {isPinned && (
                <Icon name="pin" size={12} color="#3B82F6" strokeWidth={2.5} />
              )}
              {isBlocked && (
                <View style={styles.blockedBadge}>
                  <Text style={styles.blockedText}>Blocked</Text>
                </View>
              )}
            </View>

            {/* Phone number - full width, never cut off */}
            <Text
              style={[
                styles.phoneSubText,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
              numberOfLines={1}
            >
              {contact.primaryPhone}
              {contact.phoneNumbers && contact.phoneNumbers.length > 1
                ? ` • +${contact.phoneNumbers.length - 1} more`
                : ''}
            </Text>

            {/* Distance under phone number */}
            {contact.distance ? (
              <View style={styles.distanceBadge}>
                <Icon
                  name="map-pin"
                  size={11}
                  color="#0866FF"
                  strokeWidth={2.4}
                />
                <Text style={[styles.distanceText, { color: isDark ? '#60A5FA' : '#0866FF' }]}>
                  {contact.distance} away
                </Text>
              </View>
            ) : null}

            {/* Active Offer Pill - visible in listing */}
            {mainOfferColor && (
              <View style={styles.offerPillContainer}>
                <View
                  style={[
                    styles.offerPill,
                    {
                      backgroundColor: isDark ? mainOfferColor.badgeBgDark : mainOfferColor.badgeBg,
                      borderColor: isDark ? mainOfferColor.borderDark : mainOfferColor.border,
                    },
                  ]}
                >
                  <Image
                    source={OFFER_FLAG_IMAGE}
                    style={styles.offerPillFlagImg}
                    resizeMode="contain"
                  />
                  <Text
                    style={[styles.offerPillText, { color: isDark ? mainOfferColor.textDark : mainOfferColor.text }]}
                    numberOfLines={1}
                  >
                    {contact.offers![0]}
                    {contact.offers!.length > 1 ? ` (+${contact.offers!.length - 1} more)` : ''}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons: Quick Message and Call */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[
                styles.messageButton,
                { backgroundColor: isDark ? '#242526' : '#F0F2F5' },
              ]}
              onPress={handleMessage}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Icon
                name="message"
                size={16}
                color={isDark ? '#B0B3B8' : '#65676B'}
                strokeWidth={2}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.callButton,
                { backgroundColor: isDark ? 'rgba(8, 102, 255, 0.18)' : '#E7F3FF' },
              ]}
              onPress={() => onCall(contact)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Icon name="phone" size={16} color="#0866FF" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </Pressable>
      )}
    </View>
  );
}, (prev, next) => {
  return (
    prev.isExpanded === next.isExpanded &&
    prev.contact.id === next.contact.id &&
    prev.contact.name === next.contact.name &&
    prev.contact.primaryPhone === next.contact.primaryPhone &&
    prev.contact.phoneNumbers?.length === next.contact.phoneNumbers?.length &&
    prev.contact.avatar === next.contact.avatar &&
    prev.contact.distance === next.contact.distance &&
    prev.isFavorite === next.isFavorite &&
    prev.isBlocked === next.isBlocked &&
    prev.isPinned === next.isPinned &&
    prev.contact.offers?.join('|') === next.contact.offers?.join('|')
  );
});

const styles = StyleSheet.create({
  itemRoot: {
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  avatarBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
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
  },
  blockedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  blockedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  expandedSubInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    marginTop: 2,
  },
  distanceText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  subDotSeparator: {
    fontSize: 11,
    marginLeft: 3,
    fontWeight: '600',
  },
  phoneSubText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Samsung One UI Expanded Card Styles
  expandedCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  expandedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  expandedInfoCol: {
    flex: 1,
    paddingRight: 10,
  },
  expandedNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandedNameText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  expandedPhoneSubText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 3,
  },
  samsungCallInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  samsungCallInfoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  expandedAvatarBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  expandedAvatarImg: {
    width: '100%',
    height: '100%',
  },
  samsungActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.18)',
  },
  samsungActionBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  initialsAvatar: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  expandedInitialsAvatar: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedInitialsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  multiPhoneWrap: {
    marginTop: 6,
    gap: 6,
  },
  multiPhonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  multiPhoneLabelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  multiPhoneNumberText: {
    fontSize: 13,
    fontWeight: '600',
  },
  avatarOfferFlagWrap: {
    position: 'absolute',
    top: -4,
    left: -4,
    zIndex: 10,
  },
  avatarOfferFlagImg: {
    width: 22,
    height: 19,
  },
  offerFlagImage: {
    width: 30,
    height: 24,
    marginLeft: 4,
  },
  offerPillFlagImg: {
    width: 16,
    height: 14,
    marginRight: 2,
  },
  expandedHeaderFlagImg: {
    width: 22,
    height: 19,
    marginRight: 4,
  },
  avatarOfferFlag: {
    position: 'absolute',
    top: -1,
    left: -1,
    backgroundColor: '#DC2626',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  offerFlagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    gap: 3,
    marginLeft: 2,
  },
  offerFlagBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  offerPillContainer: {
    marginTop: 3,
    flexDirection: 'row',
  },
  offerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    gap: 4,
    maxWidth: '100%',
  },
  offerPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  expandedOffersCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  expandedOffersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  expandedOffersHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  expandedOffersChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  expandedOfferChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  expandedOfferChipText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
});
