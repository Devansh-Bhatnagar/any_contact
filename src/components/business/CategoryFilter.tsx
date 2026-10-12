import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { BusinessCategory } from '../../types/business';
import { ALL_CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '../../constants/categories';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from '../common/Icon';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface CategoryFilterProps {
  selectedCategory: BusinessCategory;
  onSelectCategory: (category: BusinessCategory) => void;
  categoryCounts?: Record<string, number>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts = {},
}) => {
  const { colors } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSelect = (cat: BusinessCategory) => {
    onSelectCategory(cat);
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.scrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Quick Filter All Button with modal toggle */}
          <TouchableOpacity
            style={[
              styles.chip,
              styles.moreChip,
              { backgroundColor: colors.chipBackground, borderColor: colors.border },
            ]}
            onPress={() => setIsModalVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel="Open all categories"
            accessibilityRole="button"
          >
            <Icon name="filter" size={13} color={colors.text} strokeWidth={2.2} />
            <Text style={[styles.chipText, { color: colors.text, fontWeight: '700' }]}>
              All ({ALL_CATEGORIES.length - 1})
            </Text>
          </TouchableOpacity>

          {ALL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const iconName = CATEGORY_ICONS[cat] || 'briefcase';
            const count = categoryCounts[cat];

            return (
              <TouchableOpacity
                key={`cat-chip-${cat}`}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? colors.chipActiveBackground
                      : colors.chipBackground,
                  },
                ]}
                onPress={() => onSelectCategory(cat)}
                activeOpacity={0.7}
                accessibilityLabel={`Filter by ${cat}`}
                accessibilityRole="button"
              >
                <Icon
                  name={iconName}
                  size={13}
                  color={isSelected ? colors.chipActiveText : colors.chipText}
                  strokeWidth={2.2}
                />
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isSelected ? colors.chipActiveText : colors.chipText,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {cat}
                </Text>
                {count !== undefined && count > 0 && cat !== 'All' && (
                  <View
                    style={[
                      styles.countBadge,
                      {
                        backgroundColor: isSelected
                          ? 'rgba(255, 255, 255, 0.25)'
                          : colors.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.countText,
                        {
                          color: isSelected
                            ? colors.chipActiveText
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Category Selection Modal / Bottom Sheet */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Categories</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Filter businesses by industry or service
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={[styles.closeButton, { backgroundColor: colors.surfaceVariant }]}
              accessibilityLabel="Close categories modal"
              accessibilityRole="button"
            >
              <Icon name="close" size={16} color={colors.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={ALL_CATEGORIES}
            keyExtractor={(item) => `modal-cat-${item}`}
            contentContainerStyle={styles.modalList}
            renderItem={({ item }) => {
              const isSelected = selectedCategory === item;
              const iconName = CATEGORY_ICONS[item] || 'briefcase';
              const catColor =
                item === 'All'
                  ? colors.primary
                  : CATEGORY_COLORS[item as Exclude<BusinessCategory, 'All'>] ||
                    colors.primary;
              const count = categoryCounts[item];

              return (
                <TouchableOpacity
                  style={[
                    styles.modalCategoryItem,
                    {
                      backgroundColor: isSelected
                        ? colors.primaryLight
                        : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.modalIconBox,
                      { backgroundColor: `${catColor}20` },
                    ]}
                  >
                    <Icon name={iconName} size={18} color={catColor} strokeWidth={2.2} />
                  </View>

                  <View style={styles.modalItemInfo}>
                    <Text
                      style={[
                        styles.modalItemTitle,
                        {
                          color: isSelected ? colors.primary : colors.text,
                          fontWeight: isSelected ? '700' : '600',
                        },
                      ]}
                    >
                      {item}
                    </Text>
                    {count !== undefined && (
                      <Text style={[styles.modalItemCount, { color: colors.textSecondary }]}>
                        {count} {count === 1 ? 'business' : 'businesses'}
                      </Text>
                    )}
                  </View>

                  {isSelected && (
                    <Icon name="check" size={18} color={colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  scrollWrapper: {
    paddingVertical: spacing.xxs,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  moreChip: {
    borderWidth: 1,
    paddingHorizontal: spacing.sm + 2,
  },
  chipText: {
    ...typography.labelMedium,
    fontSize: 12,
  },
  countBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...typography.titleMedium,
  },
  modalSubtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalList: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  modalIconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  modalItemInfo: {
    flex: 1,
  },
  modalItemTitle: {
    ...typography.bodyLarge,
  },
  modalItemCount: {
    ...typography.bodySmall,
    marginTop: 2,
  },
});
