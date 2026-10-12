import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Icon, IconName } from '../common/Icon';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

interface BusinessActionButtonProps {
  type: 'call' | 'message' | 'directions';
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export const BusinessActionButton: React.FC<BusinessActionButtonProps> = ({
  type,
  label,
  onPress,
  disabled = false,
}) => {
  const { colors, isDark } = useTheme();

  let iconName: IconName = 'phone';
  let accentColor = colors.call;
  let bgColor = colors.surface;

  switch (type) {
    case 'call':
      iconName = 'phone';
      accentColor = colors.call;
      bgColor = isDark ? '#052E16' : '#DCFCE7';
      break;
    case 'message':
      iconName = 'message';
      accentColor = colors.message;
      bgColor = isDark ? '#172554' : '#DBEAFE';
      break;
    case 'directions':
      iconName = 'map-pin';
      accentColor = colors.directions;
      bgColor = isDark ? '#2E1065' : '#EDE9FE';
      break;
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        shadows.subtle,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
        <Icon name={iconName} size={20} color={accentColor} strokeWidth={2.2} />
      </View>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.labelMedium,
    fontWeight: '700',
    fontSize: 12,
  },
});
