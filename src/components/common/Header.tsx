import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from './Icon';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface HeaderProps {
  title: string;
  subtitle?: string;
  count?: number;
  rightAction?: React.ReactNode;
  showThemeToggle?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  count,
  rightAction,
  showThemeToggle = true,
}) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.headerBackground,
          paddingTop: topPadding + spacing.sm,
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {count !== undefined && (
              <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>{count}</Text>
              </View>
            )}
          </View>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.actionsRow}>
          {rightAction}
          {showThemeToggle && (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.surfaceVariant }]}
              onPress={toggleTheme}
              accessibilityLabel="Toggle dark mode"
              accessibilityRole="button"
              activeOpacity={0.7}
            >
              <Icon
                name={isDark ? 'sun' : 'moon'}
                size={18}
                color={colors.text}
                strokeWidth={2}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.titleLarge,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
  },
  badgeText: {
    ...typography.labelMedium,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
