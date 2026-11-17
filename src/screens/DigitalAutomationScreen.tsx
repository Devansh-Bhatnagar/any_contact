import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { Icon } from '../components/common/Icon';

export const DigitalAutomationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#10141D' : '#F8FAFC' },
      ]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header with Back Button */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset + 6,
            borderBottomColor: isDark ? '#1E2533' : '#E2E8F0',
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[
            styles.backButton,
            { backgroundColor: isDark ? '#1E2533' : '#F1F5F9' },
          ]}
        >
          <Icon
            name="arrow-left"
            size={20}
            color={isDark ? '#F1F5F9' : '#0F172A'}
            strokeWidth={2.4}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            { color: isDark ? '#F8FAFC' : '#0F172A' },
          ]}
        >
          Digital Automation
        </Text>

        <View style={styles.headerRightSpacer} />
      </View>

      {/* Main Center Content */}
      <View style={styles.content}>
        {/* Glow Icon Background */}
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark
                ? 'rgba(37, 99, 235, 0.16)'
                : 'rgba(37, 99, 235, 0.08)',
              borderColor: isDark
                ? 'rgba(59, 130, 246, 0.28)'
                : 'rgba(37, 99, 235, 0.2)',
            },
          ]}
        >
          <Icon
            name="grid"
            size={42}
            color={colors.primary || '#2563EB'}
            strokeWidth={2}
          />
        </View>

        {/* Coming Soon Badge */}
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isDark
                ? 'rgba(59, 130, 246, 0.18)'
                : 'rgba(37, 99, 235, 0.1)',
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: colors.primary || '#2563EB' },
            ]}
          >
            Digital Marketing
          </Text>
        </View>

        {/* Coming Soon Title */}
        <Text
          style={[
            styles.title,
            { color: isDark ? '#F8FAFC' : '#0F172A' },
          ]}
        >
          Coming Soon
        </Text>

        {/* Subtitle Description */}
        <Text
          style={[
            styles.subtitle,
            { color: isDark ? '#94A3B8' : '#64748B' },
          ]}
        >
          We are currently working on this feature to bring you automated digital marketing campaigns and tools.
        </Text>

        {/* Back to Contacts Action Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          style={[
            styles.primaryButton,
            { backgroundColor: colors.primary || '#2563EB' },
          ]}
        >
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerRightSpacer: {
    width: 38,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: -40,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 320,
  },
  primaryButton: {
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
