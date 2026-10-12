import React, { useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from './Icon';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search businesses, categories, cities...',
  onClear,
}) => {
  const { colors } = useTheme();
  const inputRef = useRef<any>(null);

  const handleClear = () => {
    onChangeText('');
    if (onClear) onClear();
    inputRef.current?.focus();
  };

  return (
    <View style={styles.outerContainer}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.searchBackground,
            borderColor: value ? colors.primary : 'transparent',
            borderWidth: value ? 1 : 0,
          },
        ]}
      >
        <Icon
          name="search"
          size={18}
          color={value ? colors.primary : colors.textTertiary}
          strokeWidth={2.2}
        />
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
          returnKeyType="search"
          accessibilityLabel="Search businesses"
          accessibilityRole="search"
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            style={[styles.clearButton, { backgroundColor: colors.border }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Clear search input"
            accessibilityRole="button"
          >
            <Icon name="close" size={12} color={colors.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.bodyLarge,
    fontSize: 15,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    paddingHorizontal: 0,
  },
  clearButton: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
