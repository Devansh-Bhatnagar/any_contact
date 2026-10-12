import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useBusinesses } from '../hooks/useBusinesses';
import { useTheme } from '../hooks/useTheme';
import { Icon } from '../components/common/Icon';
import { BestieButton } from '../components/common/BestieButton';
import { BusinessAvatar } from '../components/common/BusinessAvatar';
import { CallActionSheet } from '../components/business/CallActionSheet';
import { LinkingService } from '../services/linkingService';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../constants/categories';

type DetailsRouteProp = RouteProp<RootStackParamList, 'BusinessDetails'>;
type DetailsNavProp = NativeStackNavigationProp<RootStackParamList>;

export const BusinessDetailsScreen: React.FC = () => {
  const route = useRoute<DetailsRouteProp>();
  const navigation = useNavigation<DetailsNavProp>();
  const { colors, isDark } = useTheme();
  const { businessId, initialBusiness } = route.params;
  const { getBusinessById, toggleBestie, isBestie: checkIsBestie } = useBusinesses();

  const [isCallSheetVisible, setIsCallSheetVisible] = useState(false);

  const business = useMemo(() => {
    return getBusinessById(businessId) || initialBusiness;
  }, [getBusinessById, businessId, initialBusiness]);

  if (!business) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Business not found.
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isFavorited = checkIsBestie(business.id);
  const categoryColor = CATEGORY_COLORS[business.category as keyof typeof CATEGORY_COLORS] || colors.primary;
  const categoryIcon = CATEGORY_ICONS[business.category as keyof typeof CATEGORY_ICONS] || 'briefcase';

  const handleDirections = () => {
    LinkingService.openDirections(
      business.latitude,
      business.longitude,
      business.name
    );
  };

  const handleShare = () => {
    LinkingService.shareBusiness(
      business.name,
      business.phone,
      business.address,
      business.city
    );
  };

  const handleWhatsApp = () => {
    LinkingService.openWhatsApp(
      business.phone,
      `Hello ${business.name}, I am contacting you via Contact App.`
    );
  };

  const handleCall = () => {
    setIsCallSheetVisible(true);
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

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Navigation Bar */}
      <View
        style={[
          styles.navBar,
          {
            backgroundColor: colors.background,
            paddingTop: topPadding + 8,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.navIconButton, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back"
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          <Icon name="back" size={18} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.navRightActions}>
          <TouchableOpacity
            style={[styles.navIconButton, { backgroundColor: colors.surfaceVariant }]}
            onPress={handleShare}
            accessibilityLabel="Share business"
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Icon name="share" size={18} color={colors.text} strokeWidth={2.2} />
          </TouchableOpacity>

          <BestieButton
            isBestie={isFavorited}
            onPress={() => toggleBestie(business.id)}
            size={40}
            iconSize={20}
            showBackground
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card Header */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }, shadows.card]}>
          <View style={styles.avatarRow}>
            <View
              style={[
                styles.largeAvatarContainer,
                { backgroundColor: `${categoryColor}15`, borderColor: categoryColor },
              ]}
            >
              <BusinessAvatar
                image={business.image}
                category={business.category}
                name={business.name}
                size={80}
                style={styles.largeAvatarImage}
                fallbackColor={categoryColor}
              />
            </View>
          </View>

          <Text style={[styles.businessTitle, { color: colors.text }]}>
            {business.name}
          </Text>

          {business.tagline ? (
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              "{business.tagline}"
            </Text>
          ) : null}

          {/* Category Chip & Rating */}
          <View style={styles.categoryBadgeRow}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: `${categoryColor}18`, borderColor: `${categoryColor}40` },
              ]}
            >
              <Icon name={categoryIcon} size={14} color={categoryColor} strokeWidth={2.2} />
              <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
                {business.category}
              </Text>
            </View>

            {business.rating && (
              <View
                style={[
                  styles.ratingBadge,
                  { backgroundColor: colors.bestieBackground },
                ]}
              >
                <Icon name="star-fill" size={13} color={colors.bestie} strokeWidth={1} />
                <Text style={[styles.ratingText, { color: colors.bestie }]}>
                  {business.rating.toFixed(1)}
                </Text>
                {business.reviewCount && (
                  <Text style={[styles.reviewCountText, { color: colors.textTertiary }]}>
                    ({business.reviewCount})
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Primary Action Buttons: [ Call ] [ WhatsApp ] [ Directions ] */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: colors.call }]}
            onPress={handleCall}
            activeOpacity={0.8}
          >
            <Icon name="phone" size={20} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.primaryActionBtnText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: '#25D366' }]}
            onPress={handleWhatsApp}
            activeOpacity={0.8}
          >
            <Icon name="whatsapp" size={20} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.primaryActionBtnText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: colors.directions }]}
            onPress={handleDirections}
            activeOpacity={0.8}
          >
            <Icon name="map-pin" size={20} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.primaryActionBtnText}>Directions</Text>
          </TouchableOpacity>
        </View>

        {/* Dedicated "Add to Besties / Favorites" Switch Card */}
        <TouchableOpacity
          style={[
            styles.bestieToggleCard,
            {
              backgroundColor: isFavorited ? colors.bestieBackground : colors.surface,
              borderColor: isFavorited ? colors.bestie : colors.border,
            },
            shadows.subtle,
          ]}
          onPress={() => toggleBestie(business.id)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.bestieIconBox,
              {
                backgroundColor: isFavorited
                  ? colors.bestie
                  : colors.surfaceVariant,
              },
            ]}
          >
            <Icon
              name={isFavorited ? 'star-fill' : 'star'}
              size={22}
              color={isFavorited ? '#FFFFFF' : colors.textSecondary}
              strokeWidth={1.8}
            />
          </View>

          <View style={styles.bestieTextContainer}>
            <Text
              style={[
                styles.bestieCardTitle,
                {
                  color: isFavorited
                    ? isDark ? '#FBBF24' : '#B45309'
                    : colors.text,
                },
              ]}
            >
              {isFavorited ? 'Added in Besties list ⭐' : 'Add to Besties / Favorites'}
            </Text>
            <Text style={[styles.bestieCardSubtitle, { color: colors.textSecondary }]}>
              {isFavorited
                ? 'Pinned to your Bestie tab for 1-tap quick access.'
                : 'Tap to add to your favorites for instant access anytime.'}
            </Text>
          </View>

          <Switch
            value={isFavorited}
            onValueChange={() => toggleBestie(business.id)}
            trackColor={{ false: colors.border, true: colors.bestie }}
            thumbColor="#FFFFFF"
          />
        </TouchableOpacity>

        {/* Detailed Info Cards */}
        <View style={styles.detailsGroup}>
          {/* Phone Details Card */}
          <TouchableOpacity
            style={[styles.infoCard, { backgroundColor: colors.surface }, shadows.subtle]}
            onPress={handleCall}
            activeOpacity={0.7}
          >
            <View style={[styles.infoIconBox, { backgroundColor: colors.primaryLight }]}>
              <Icon name="phone" size={18} color={colors.primary} strokeWidth={2.2} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Phone Number</Text>
              <Text style={[styles.infoValue, { color: colors.primary }]}>{business.phone}</Text>
            </View>
            <Icon name="chevron-right" size={16} color={colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>

          {/* WhatsApp Direct Card */}
          <TouchableOpacity
            style={[styles.infoCard, { backgroundColor: colors.surface }, shadows.subtle]}
            onPress={handleWhatsApp}
            activeOpacity={0.7}
          >
            <View style={[styles.infoIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Icon name="whatsapp" size={18} color="#16A34A" strokeWidth={2.2} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>WhatsApp Chat</Text>
              <Text style={[styles.infoValue, { color: '#16A34A' }]}>Chat on WhatsApp ({business.phone})</Text>
            </View>
            <Icon name="chevron-right" size={16} color={colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>

          {/* Address & Location Card */}
          <TouchableOpacity
            style={[styles.infoCard, { backgroundColor: colors.surface }, shadows.subtle]}
            onPress={handleDirections}
            activeOpacity={0.7}
          >
            <View style={[styles.infoIconBox, { backgroundColor: `${colors.directions}18` }]}>
              <Icon name="map-pin" size={18} color={colors.directions} strokeWidth={2.2} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Address & City</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{business.address}</Text>
              <Text style={[styles.infoSubValue, { color: colors.textSecondary }]}>
                {business.city}, India
              </Text>
              {business.latitude && business.longitude && (
                <Text style={[styles.coordsText, { color: colors.textTertiary }]}>
                  GPS: {business.latitude.toFixed(4)}, {business.longitude.toFixed(4)}
                </Text>
              )}
            </View>
            <Icon name="chevron-right" size={16} color={colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>

          {/* Opening Hours */}
          {business.openingHours && (
            <View style={[styles.infoCard, { backgroundColor: colors.surface }, shadows.subtle]}>
              <View style={[styles.infoIconBox, { backgroundColor: `${colors.accent}18` }]}>
                <Icon name="clock" size={18} color={colors.accent} strokeWidth={2.2} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Working Hours</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {business.openingHours}
                </Text>
              </View>
            </View>
          )}

          {/* Website Link */}
          {business.website && (
            <TouchableOpacity
              style={[styles.infoCard, { backgroundColor: colors.surface }, shadows.subtle]}
              onPress={handleWebsite}
              activeOpacity={0.7}
            >
              <View style={[styles.infoIconBox, { backgroundColor: colors.primaryLight }]}>
                <Icon name="website" size={18} color={colors.primary} strokeWidth={2.2} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Official Website</Text>
                <Text style={[styles.infoValue, { color: colors.primary }]} numberOfLines={1}>
                  {business.website.replace('https://', '').replace('http://', '')}
                </Text>
              </View>
              <Icon name="external-link" size={16} color={colors.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          )}

          {/* Email */}
          {business.email && (
            <TouchableOpacity
              style={[styles.infoCard, { backgroundColor: colors.surface }, shadows.subtle]}
              onPress={handleEmail}
              activeOpacity={0.7}
            >
              <View style={[styles.infoIconBox, { backgroundColor: colors.surfaceVariant }]}>
                <Icon name="mail" size={18} color={colors.textSecondary} strokeWidth={2.2} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Email Support</Text>
                <Text style={[styles.infoValue, { color: colors.primary }]} numberOfLines={1}>
                  {business.email}
                </Text>
              </View>
              <Icon name="external-link" size={16} color={colors.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          )}

          {/* About / Description Card */}
          {business.description && (
            <View style={[styles.aboutCard, { backgroundColor: colors.surface }, shadows.subtle]}>
              <Text style={[styles.aboutTitle, { color: colors.text }]}>About This Business</Text>
              <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
                {business.description}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Call Action Panel (Modal Sheet) */}
      <CallActionSheet
        visible={isCallSheetVisible}
        business={business}
        onClose={() => setIsCallSheetVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  errorText: {
    ...typography.titleMedium,
  },
  backButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  navIconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 48,
    gap: spacing.lg,
  },
  profileCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.xxl,
    marginTop: spacing.xs,
  },
  avatarRow: {
    marginBottom: spacing.md,
  },
  largeAvatarContainer: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  largeAvatarImage: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
  },
  businessTitle: {
    ...typography.titleMedium,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 4,
  },
  tagline: {
    ...typography.bodyMedium,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: 6,
  },
  categoryBadgeText: {
    ...typography.labelMedium,
    fontWeight: '700',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  ratingText: {
    ...typography.labelMedium,
    fontWeight: '800',
  },
  reviewCountText: {
    ...typography.bodySmall,
    fontSize: 11,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.xl,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  bestieToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    gap: spacing.md,
  },
  bestieIconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestieTextContainer: {
    flex: 1,
  },
  bestieCardTitle: {
    ...typography.bodyLarge,
    fontWeight: '700',
    fontSize: 15,
  },
  bestieCardSubtitle: {
    ...typography.bodySmall,
    fontSize: 12,
    marginTop: 2,
  },
  detailsGroup: {
    gap: spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    gap: spacing.md,
  },
  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...typography.bodySmall,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  infoSubValue: {
    ...typography.bodySmall,
    marginTop: 1,
  },
  coordsText: {
    fontSize: 10,
    marginTop: 2,
  },
  aboutCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: spacing.xs,
  },
  aboutTitle: {
    ...typography.titleSmall,
    fontWeight: '700',
    marginBottom: 4,
  },
  aboutText: {
    ...typography.bodyMedium,
    lineHeight: 20,
  },
});
