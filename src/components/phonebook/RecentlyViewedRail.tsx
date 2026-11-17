import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { PhoneBookContact } from '../../types/phoneBook';
import { useTheme } from '../../hooks/useTheme';

interface RecentlyViewedRailProps {
  contacts: PhoneBookContact[];
  onSelect: (contact: PhoneBookContact) => void;
  onSeeAll?: () => void;
}

export const RecentlyViewedRail: React.FC<RecentlyViewedRailProps> = ({
  contacts,
  onSelect,
  onSeeAll,
}) => {
  const { isDark } = useTheme();

  if (!contacts || contacts.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
          Recently Viewed
        </Text>
        <TouchableOpacity onPress={onSeeAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {contacts.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.avatarItem}
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarCircle}>
              <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
            </View>
            <Text
              style={[styles.avatarName, { color: isDark ? '#F1F5F9' : '#1E293B' }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    paddingLeft: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  seeAllText: {
    color: '#0866FF',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollList: {
    paddingRight: 24,
    gap: 16,
  },
  avatarItem: {
    alignItems: 'center',
    width: 60,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: '#E4E6EB',
    overflow: 'hidden',
    backgroundColor: '#E4E6EB',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
});
