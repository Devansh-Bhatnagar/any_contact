import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  Platform,
  TextInput,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from '../common/Icon';

export interface CountryItem {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export const COUNTRIES: CountryItem[] = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
];

interface CountryPickerDropdownProps {
  visible: boolean;
  onClose: () => void;
  topInset?: number;
  selectedCountry: CountryItem;
  onSelectCountry: (country: CountryItem) => void;
}

export const CountryPickerDropdown: React.FC<CountryPickerDropdownProps> = ({
  visible,
  onClose,
  topInset = 40,
  selectedCountry,
  onSelectCountry,
}) => {
  const { colors, isDark } = useTheme();
  const [search, setSearch] = useState('');

  if (!visible) return null;

  const filteredCountries = COUNTRIES.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.dialCode.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.dropdownCard,
                {
                  top: topInset + (Platform.OS === 'android' ? 12 : 8),
                  backgroundColor: isDark ? '#242526' : '#FFFFFF',
                  borderColor: isDark ? '#3A3B3C' : '#E4E6EB',
                },
              ]}
            >
              {/* Header with Title and Search */}
              <View style={styles.headerRow}>
                <Text
                  style={[
                    styles.titleText,
                    { color: isDark ? '#E4E6EB' : '#050505' },
                  ]}
                >
                  Select Country
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon
                    name="close"
                    size={18}
                    color={isDark ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>
              </View>

              {/* Quick Search */}
              <View
                style={[
                  styles.searchBox,
                  {
                    backgroundColor: isDark ? '#18191A' : '#F0F2F5',
                    borderColor: isDark ? '#3A3B3C' : '#E4E6EB',
                  },
                ]}
              >
                <Icon
                  name="search"
                  size={15}
                  color={isDark ? '#94A3B8' : '#64748B'}
                />
                <TextInput
                  style={[
                    styles.searchInput,
                    { color: isDark ? '#E4E6EB' : '#050505' },
                  ]}
                  placeholder="Search country..."
                  placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                  value={search}
                  onChangeText={setSearch}
                  autoCorrect={false}
                />
              </View>

              {/* Country List */}
              <FlatList
                data={filteredCountries}
                keyExtractor={(item) => item.code}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={styles.list}
                renderItem={({ item }) => {
                  const isSelected = item.code === selectedCountry.code;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.countryItem,
                        isSelected && {
                          backgroundColor: isDark
                            ? 'rgba(30, 96, 242, 0.15)'
                            : '#EBF2FE',
                        },
                      ]}
                      onPress={() => {
                        onSelectCountry(item);
                        onClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.flagText}>{item.flag}</Text>
                      <View style={styles.countryInfo}>
                        <Text
                          style={[
                            styles.countryName,
                            {
                              color: isSelected
                                ? colors.primary
                                : isDark
                                ? '#E4E6EB'
                                : '#050505',
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text
                          style={[
                            styles.dialCode,
                            { color: isDark ? '#94A3B8' : '#64748B' },
                          ]}
                        >
                          {item.dialCode}
                        </Text>
                      </View>
                      {isSelected && (
                        <Icon
                          name="check"
                          size={16}
                          color={colors.primary}
                          strokeWidth={2.5}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  dropdownCard: {
    position: 'absolute',
    right: 16,
    width: 270,
    maxHeight: 380,
    borderRadius: 20,
    borderWidth: 1,
    paddingTop: 12,
    paddingBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 6,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  list: {
    maxHeight: 270,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginHorizontal: 6,
    marginVertical: 1,
  },
  flagText: {
    fontSize: 22,
    marginRight: 10,
  },
  countryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  countryName: {
    fontSize: 14,
    flexShrink: 1,
  },
  dialCode: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
});
