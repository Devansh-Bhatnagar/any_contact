import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Business } from '../../types/business';
import { useTheme } from '../../hooks/useTheme';
import { BestieButton } from '../common/BestieButton';
import { BusinessAvatar } from '../common/BusinessAvatar';
import { Icon } from '../common/Icon';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../constants/categories';

interface BusinessListItemProps {
  business: Business;
  onPress: (business: Business) => void;
  onToggleBestie: (id: string) => void;
  isBestie: boolean;
  onCall?: (business: Business) => void;
  onWhatsApp?: (business: Business) => void;
  showDivider?: boolean;
}

export const BusinessListItem: React.FC<BusinessListItemProps> = memo(
  ({ business, onPress, onToggleBestie, isBestie, onCall, onWhatsApp, showDivider = true }) => {
    const { colors, isDark } = useTheme();

    const categoryColor =
      CATEGORY_COLORS[business.category] || colors.primary;
    const categoryIcon = CATEGORY_ICONS[business.category] || 'briefcase';

    return (
      <TouchableOpacity
        style={[styles.container, { backgroundColor: colors.surface }]}
        onPress={() => onPress(business)}
        activeOpacity={0.65}
        accessibilityLabel={`${business.name}, ${business.category} in ${business.city}`}
        accessibilityRole="button"
      >
        <View style={styles.contentRow}>
          {/* Avatar / Logo */}
          <View style={[styles.avatarContainer, { backgroundColor: `${categoryColor}18` }]}>
            <BusinessAvatar
              image={business.image}
              category={business.category}
              name={business.name}
              size={46}
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
          </View>

          {/* Action Row: Direct Call, Direct WhatsApp, Bestie Star */}
          <View style={styles.actionRow}>
            {onCall && (
              <TouchableOpacity
                style={[
                  styles.quickBtn,
                  { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7' },
                ]}
                onPress={() => onCall(business)}
                accessibilityLabel={`Call ${business.name}`}
                activeOpacity={0.7}
              >
                <Icon name="phone" size={15} color={colors.call} strokeWidth={2.2} />
              </TouchableOpacity>
            )}

            {onWhatsApp && (
              <TouchableOpacity
                style={[
                  styles.quickBtn,
                  { backgroundColor: isDark ? 'rgba(37, 211, 102, 0.15)' : '#E8F5E9' },
                ]}
                onPress={() => onWhatsApp(business)}
                accessibilityLabel={`WhatsApp ${business.name}`}
                activeOpacity={0.7}
              >
                <Icon name="whatsapp" size={16} color="#25D366" strokeWidth={2.2} />
              </TouchableOpacity>
            )}

            <BestieButton
              isBestie={isBestie}
              onPress={() => onToggleBestie(business.id)}
              size={34}
              iconSize={18}
            />
          </View>
        </View>

        {showDivider && (
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        )}
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  avatarContainer: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    position: 'relative',
    overflow: 'visible',
  },
  avatarImage: {
    width: 46,
    height: 46,
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
    marginBottom: 2,
  },
  businessName: {
    ...typography.bodyLarge,
    fontWeight: '600',
    fontSize: 15,
  },
  bottomInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.xs,
  },
  categoryText: {
    ...typography.labelSmall,
    fontSize: 10,
    fontWeight: '600',
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
    marginTop: spacing.xs,
  },
});
