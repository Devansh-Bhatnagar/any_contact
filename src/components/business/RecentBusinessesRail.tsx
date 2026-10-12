import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Business } from '../../types/business';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from '../common/Icon';
import { BusinessAvatar } from '../common/BusinessAvatar';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { CATEGORY_COLORS } from '../../constants/categories';

interface RecentBusinessesRailProps {
  businesses: Business[];
  onSelect: (business: Business) => void;
  onClear: () => void;
}

export const RecentBusinessesRail: React.FC<RecentBusinessesRailProps> = ({
  businesses,
  onSelect,
  onClear,
}) => {
  const { colors } = useTheme();

  if (!businesses || businesses.length === 0) {
    return null;
  }

  const handleClearConfirm = () => {
    Alert.alert(
      'Clear Recent Businesses',
      'Are you sure you want to clear your recently viewed businesses history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: onClear },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Icon name="clock" size={14} color={colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            RECENTLY VIEWED
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleClearConfirm}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Clear recent businesses"
          accessibilityRole="button"
        >
          <Text style={[styles.clearText, { color: colors.primary }]}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {businesses.map((business) => {
          const catColor =
            CATEGORY_COLORS[business.category] || colors.primary;
          const initials = business.name
            .split(' ')
            .slice(0, 2)
            .map((w) => w.charAt(0))
            .join('')
            .toUpperCase();

          return (
            <TouchableOpacity
              key={`recent-${business.id}`}
              style={styles.itemCard}
              onPress={() => onSelect(business)}
              activeOpacity={0.7}
              accessibilityLabel={`Recent: ${business.name}`}
              accessibilityRole="button"
            >
              <View
                style={[
                  styles.avatarWrapper,
                  { borderColor: catColor, backgroundColor: `${catColor}15`, overflow: 'hidden' },
                ]}
              >
                <BusinessAvatar
                  image={business.image}
                  category={business.category}
                  name={business.name}
                  size={52}
                  style={styles.avatar}
                  fallbackColor={catColor}
                />
              </View>
              <Text
                style={[styles.businessName, { color: colors.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {business.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionTitle: {
    ...typography.labelSmall,
    letterSpacing: 0.8,
  },
  clearText: {
    ...typography.labelSmall,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  itemCard: {
    alignItems: 'center',
    width: 62,
  },
  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
  },
  initials: {
    ...typography.labelMedium,
    fontWeight: '700',
  },
  businessName: {
    ...typography.bodySmall,
    fontSize: 11,
    textAlign: 'center',
    width: '100%',
  },
});
