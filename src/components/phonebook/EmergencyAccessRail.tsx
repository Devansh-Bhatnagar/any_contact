import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { EMERGENCY_SERVICES } from '../../data/mockPhoneBook';
import { EmergencyItem } from '../../types/phoneBook';
import { Icon } from '../common/Icon';
import { useTheme } from '../../hooks/useTheme';

interface EmergencyAccessRailProps {
  onCall: (item: EmergencyItem) => void;
}

export const EmergencyAccessRail: React.FC<EmergencyAccessRailProps> = ({
  onCall,
}) => {
  const { isDark } = useTheme();

  const handlePress = (item: EmergencyItem) => {
    onCall(item);
  };

  const getMetaTheme = (title: string) => {
    switch (title) {
      case 'Police':
        return {
          bg: isDark ? 'rgba(8, 102, 255, 0.16)' : '#E7F3FF',
          iconColor: '#0866FF',
        };
      case 'Ambulance':
        return {
          bg: isDark ? 'rgba(239, 68, 68, 0.14)' : '#FEE2E2',
          iconColor: '#DC2626',
        };
      case 'Fire':
        return {
          bg: isDark ? 'rgba(249, 115, 22, 0.14)' : '#FFEDD5',
          iconColor: '#EA580C',
        };
      case 'Snake Catcher':
      default:
        return {
          bg: isDark ? 'rgba(16, 185, 129, 0.14)' : '#D1FAE5',
          iconColor: '#059669',
        };
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
        Emergency Contacts
      </Text>
      <View style={styles.grid}>
        {EMERGENCY_SERVICES.map((item) => {
          const metaTheme = getMetaTheme(item.title);
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: metaTheme.bg }]}>
                <Icon name={item.icon} size={20} color={metaTheme.iconColor} strokeWidth={2} />
              </View>
              <Text
                style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={styles.cardNum}>{item.number}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
  },
  card: {
    alignItems: 'flex-start',
    borderRadius: 14,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'left',
  },
  cardNum: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 1,
    textAlign: 'left',
  },
});
