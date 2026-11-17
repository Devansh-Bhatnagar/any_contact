import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Business } from '../../types/business';
import { useTheme } from '../../hooks/useTheme';
import { BusinessAvatar } from '../common/BusinessAvatar';
import { Icon } from '../common/Icon';
import { LinkingService } from '../../services/linkingService';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../constants/categories';
import { getOfferColor } from '../../constants/offerColors';
import { OFFER_FLAG_IMAGE } from '../../constants/imageAssets';

interface BusinessListItemProps {
  business: Business;
  isExpanded?: boolean;
  onToggleExpand?: (id: string) => void;
  onOpenDetails?: (business: Business) => void;
  onPress?: (business: Business) => void;
  onToggleBestie: (id: string) => void;
  isBestie: boolean;
  onCall?: (business: Business) => void;
  onWhatsApp?: (business: Business) => void;
  showDivider?: boolean;
}

export const BusinessListItem: React.FC<BusinessListItemProps> = memo(
  ({
    business,
    isExpanded = false,
    onToggleExpand,
    onOpenDetails,
    onPress,
    onToggleBestie,
    isBestie,
    onCall,
    onWhatsApp,
    showDivider = true,
  }) => {
    const { colors, isDark } = useTheme();

    const categoryColor =
      CATEGORY_COLORS[business.category] || colors.primary;
    const categoryIcon = CATEGORY_ICONS[business.category] || 'briefcase';

    const handleRowPress = () => {
      if (onToggleExpand) {
        onToggleExpand(business.id);
      } else if (onPress) {
        onPress(business);
      }
    };

    const handleDetailsPress = () => {
      if (onOpenDetails) {
        onOpenDetails(business);
      } else if (onPress) {
        onPress(business);
      }
    };

    const firstLetter =
      business.name.trim().charAt(0).toUpperCase() || 'M';

    const businessOffers =
      business.offers && business.offers.length > 0
        ? business.offers
        : business.promotions && business.promotions.length > 0
        ? business.promotions.map((p) => p.title).filter(Boolean)
        : [];

    const mainOfferColor = businessOffers.length > 0 ? getOfferColor(businessOffers[0]) : null;

    /* ========================================================
       1. SAMSUNG ONE UI EXPANDED CARD (EXACT PIXEL-PERFECT)
       ======================================================== */
    if (isExpanded) {
      return (
        <View
          style={[
            styles.samsungExpandedCard,
            {
              backgroundColor: isDark ? '#1D1F24' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
            },
            shadows.card,
          ]}
        >
          {/* Header Area (Tap to collapse) */}
          <TouchableOpacity
            onPress={handleRowPress}
            activeOpacity={0.8}
            accessibilityLabel={`${business.name}. Tap to collapse.`}
            accessibilityRole="button"
          >
            <View style={styles.samsungCardHeader}>
              {/* Left Column: Name, Mobile, Call Status */}
              <View style={styles.samsungInfoCol}>
                <View style={styles.nameWithFlagRow}>
                  <Text
                    style={[
                      styles.samsungName,
                      { color: isDark ? '#FFFFFF' : '#111827' },
                    ]}
                    numberOfLines={1}
                  >
                    {business.name}
                  </Text>
                  {mainOfferColor && (
                    <Image
                      source={OFFER_FLAG_IMAGE}
                      style={styles.offerFlagImage}
                      resizeMode="contain"
                    />
                  )}
                </View>

                <Text
                  style={[
                    styles.samsungPhoneSubtitle,
                    { color: isDark ? '#9AA0A6' : '#64748B' },
                  ]}
                >
                  Mobile {business.phone}
                </Text>

                {/* Status line: Diagonal arrow, Category • City, Rating */}
                <View style={styles.samsungCallInfoRow}>
                  <View style={{ transform: [{ rotate: '45deg' }] }}>
                    <Icon
                      name="arrow-right"
                      size={12}
                      color={isDark ? '#80868B' : '#94A3B8'}
                      strokeWidth={2.4}
                    />
                  </View>
                  <Text
                    style={[
                      styles.samsungCallInfoText,
                      { color: isDark ? '#80868B' : '#94A3B8' },
                    ]}
                    numberOfLines={1}
                  >
                    {business.category} • {business.city}
                  </Text>

                  {business.rating ? (
                    <View style={styles.samsungRatingBadge}>
                      <Icon name="star-fill" size={11} color="#F59E0B" />
                      <Text style={styles.samsungRatingText}>
                        {business.rating}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Right Profile Icon / Logo (Shows the exact set logo/image) */}
              <View style={styles.samsungAvatarCircle}>
                <BusinessAvatar
                  image={business.image}
                  category={business.category}
                  name={business.name}
                  size={52}
                  style={styles.samsungAvatarImg}
                  fallbackColor={categoryColor}
                />
              </View>
            </View>
          </TouchableOpacity>

          {/* Active Offers Banner */}
          {mainOfferColor && businessOffers.length > 0 && (
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
                  Active Offers & Deals ({businessOffers.length})
                </Text>
              </View>
              <View style={styles.expandedOffersChipsRow}>
                {businessOffers.map((off, oIdx) => {
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

          {/* Bottom 4 Circular Action Buttons (Call, Message, Video, Details) */}
          <View style={styles.samsungActionsRow}>
            {/* 1. Call Button */}
            <TouchableOpacity
              style={[
                styles.actionCircle,
                { backgroundColor: isDark ? '#2D3037' : '#ECEFF3' },
              ]}
              onPress={() => {
                if (onCall) {
                  onCall(business);
                } else {
                  LinkingService.makeCall(business.phone);
                }
              }}
              activeOpacity={0.7}
              accessibilityLabel={`Call ${business.name}`}
              accessibilityRole="button"
            >
              <Icon name="phone-fill" size={22} color="#22C55E" />
            </TouchableOpacity>

            {/* 2. Message Button */}
            <TouchableOpacity
              style={[
                styles.actionCircle,
                { backgroundColor: isDark ? '#2D3037' : '#ECEFF3' },
              ]}
              onPress={() => LinkingService.sendMessage(business.phone)}
              activeOpacity={0.7}
              accessibilityLabel={`Message ${business.name}`}
              accessibilityRole="button"
            >
              <Icon name="message-fill" size={22} color="#0A84FF" />
            </TouchableOpacity>

            {/* 3. Video Call Button */}
            <TouchableOpacity
              style={[
                styles.actionCircle,
                { backgroundColor: isDark ? '#2D3037' : '#ECEFF3' },
              ]}
              onPress={() => {
                if (onWhatsApp) {
                  onWhatsApp(business);
                } else {
                  LinkingService.openWhatsApp(business.phone);
                }
              }}
              activeOpacity={0.7}
              accessibilityLabel={`Video call ${business.name}`}
              accessibilityRole="button"
            >
              <Icon name="video" size={22} color="#22C55E" />
            </TouchableOpacity>

            {/* 4. Details / List Button */}
            <TouchableOpacity
              style={[
                styles.actionCircle,
                { backgroundColor: isDark ? '#2D3037' : '#ECEFF3' },
              ]}
              onPress={handleDetailsPress}
              activeOpacity={0.7}
              accessibilityLabel={`View full details of ${business.name}`}
              accessibilityRole="button"
            >
              <Icon
                name="list"
                size={21}
                color={isDark ? '#E2E8F0' : '#475569'}
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    /* ========================================================
       2. SAMSUNG ONE UI COLLAPSED ROW
       ======================================================== */
    return (
      <View
        style={[
          styles.wrapper,
          { backgroundColor: colors.surface },
        ]}
      >
        <TouchableOpacity
          style={styles.container}
          onPress={handleRowPress}
          activeOpacity={0.7}
          accessibilityLabel={`${business.name}, ${business.category} in ${business.city}. Tap to expand options.`}
          accessibilityRole="button"
        >
          <View style={styles.contentRow}>
            {/* Avatar / Logo */}
            <View style={[styles.avatarContainer, { backgroundColor: `${categoryColor}18` }]}>
              {mainOfferColor && (
                <View style={styles.avatarOfferFlagWrap}>
                  <Image
                    source={OFFER_FLAG_IMAGE}
                    style={styles.avatarOfferFlagImg}
                    resizeMode="contain"
                  />
                </View>
              )}
              <BusinessAvatar
                image={business.image}
                category={business.category}
                name={business.name}
                size={48}
                style={styles.avatarImage}
                fallbackColor={categoryColor}
              />
              <View style={[styles.categoryBadgeMini, { backgroundColor: categoryColor }]}>
                <Icon name={categoryIcon} size={9} color="#FFFFFF" strokeWidth={2.2} />
              </View>
            </View>

            {/* Info */}
            <View style={styles.infoContainer}>
              <View style={styles.topInfoRow}>
                <Text
                  style={[styles.businessName, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {business.name}
                </Text>
                {mainOfferColor && (
                  <Image
                    source={OFFER_FLAG_IMAGE}
                    style={styles.offerFlagImage}
                    resizeMode="contain"
                  />
                )}
              </View>

              <View style={styles.bottomInfoRow}>
                <View
                  style={[
                    styles.categoryTag,
                    { backgroundColor: colors.surfaceVariant },
                  ]}
                >
                  <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                    {business.category}
                  </Text>
                </View>

                <View style={styles.locationContainer}>
                  <Icon name="map-pin" size={11} color={colors.textTertiary} strokeWidth={2} />
                  <Text
                    style={[styles.locationText, { color: colors.textTertiary }]}
                    numberOfLines={1}
                  >
                    {business.city}
                  </Text>
                </View>
              </View>

              {/* Active Offer Pill */}
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
                      {businessOffers[0]}
                      {businessOffers.length > 1 ? ` (+${businessOffers.length - 1})` : ''}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Right indicator */}
            <View style={styles.rightIndicatorRow}>
              {isBestie && (
                <View style={[styles.miniBestieBadge, { backgroundColor: colors.bestieBackground }]}>
                  <Icon name="star-fill" size={12} color={colors.bestie} strokeWidth={1} />
                </View>
              )}
              <View
                style={[
                  styles.chevronCircle,
                  { backgroundColor: colors.surfaceVariant },
                ]}
              >
                <Icon
                  name="chevron-right"
                  size={14}
                  color={colors.textTertiary}
                  strokeWidth={2.4}
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {showDivider && (
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  /* Collapsed row styles */
  wrapper: {
    marginHorizontal: spacing.sm,
    marginVertical: 2,
    borderRadius: borderRadius.md,
  },
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    position: 'relative',
    overflow: 'visible',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
  },
  categoryBadgeMini: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 17,
    height: 17,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: spacing.xs,
  },
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  businessName: {
    ...typography.bodyLarge,
    fontWeight: '700',
    fontSize: 15,
  },
  bottomInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  categoryText: {
    ...typography.labelSmall,
    fontSize: 10,
    fontWeight: '700',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 1,
  },
  locationText: {
    ...typography.bodySmall,
    fontSize: 11,
  },
  rightIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  miniBestieBadge: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 66,
    marginTop: spacing.xs,
  },

  /* Samsung One UI Expanded Card styles (Pixel-Perfect) */
  samsungExpandedCard: {
    marginHorizontal: spacing.sm,
    marginVertical: 4,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    borderRadius: 24,
    borderWidth: 1,
  },
  samsungCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  samsungInfoCol: {
    flex: 1,
    paddingRight: 12,
  },
  samsungName: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  samsungPhoneSubtitle: {
    fontSize: 13.5,
    marginTop: 4,
    fontWeight: '400',
  },
  samsungCallInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  samsungCallInfoText: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  samsungRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 6,
  },
  samsungRatingText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#F59E0B',
  },
  samsungAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  samsungAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  samsungAvatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  samsungActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 2,
  },
  actionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameWithFlagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    top: -2,
    left: -2,
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
    marginLeft: 4,
  },
  offerFlagBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  offerPillContainer: {
    marginTop: 4,
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
