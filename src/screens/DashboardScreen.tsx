import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useBusinesses } from '../hooks/useBusinesses';
import { useTheme } from '../hooks/useTheme';
import { Icon } from '../components/common/Icon';
import { BusinessAvatar } from '../components/common/BusinessAvatar';
import { CallActionSheet } from '../components/business/CallActionSheet';
import { LinkingService } from '../services/linkingService';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { CATEGORY_COLORS } from '../constants/categories';
import { Business } from '../types/business';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { businesses, bestieBusinesses } = useBusinesses();
  const [selectedCallBusiness, setSelectedCallBusiness] = useState<Business | null>(null);

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0
  );

  const categoriesCount = useMemo(() => {
    const set = new Set(businesses.map((b: Business) => b.category));
    return set.size;
  }, [businesses]);

  const topBusinesses = useMemo(() => {
    return [...businesses].sort((a: Business, b: Business) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
  }, [businesses]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: topPadding + 10, borderBottomColor: colors.divider }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Overview</Text>
          <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>
        </View>

        <TouchableOpacity
          style={[styles.searchBtn, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => navigation.navigate('Contacts')}
          activeOpacity={0.7}
        >
          <Icon name="search" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* KPI Cards Strip */}
        <View style={styles.statsGrid}>
          {/* Total Contacts */}
          <View style={[styles.statCard, { backgroundColor: colors.surface }, shadows.card]}>
            <View style={[styles.statIconBox, { backgroundColor: `${colors.primary}18` }]}>
              <Icon name="contacts" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{businesses.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Directory Contacts</Text>
          </View>

          {/* Starred Besties */}
          <View style={[styles.statCard, { backgroundColor: colors.surface }, shadows.card]}>
            <View style={[styles.statIconBox, { backgroundColor: `${colors.bestie}20` }]}>
              <Icon name="star-fill" size={20} color={colors.bestie} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{bestieBusinesses.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Favorites (Bestie)</Text>
          </View>

          {/* Categories */}
          <View style={[styles.statCard, { backgroundColor: colors.surface }, shadows.card]}>
            <View style={[styles.statIconBox, { backgroundColor: '#10B98118' }]}>
              <Icon name="briefcase" size={20} color="#10B981" />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{categoriesCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Categories</Text>
          </View>
        </View>

        {/* Quick Dial Banner */}
        <View style={[styles.bannerCard, { backgroundColor: isDark ? '#064E3B' : '#DCFCE7' }, shadows.subtle]}>
          <View style={styles.bannerIconBox}>
            <Icon name="whatsapp" size={26} color="#25D366" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: isDark ? '#FFFFFF' : '#065F46' }]}>
              Direct WhatsApp & Voice Call
            </Text>
            <Text style={[styles.bannerSubtitle, { color: isDark ? '#A7F3D0' : '#047857' }]}>
              Tap the phone or WhatsApp icon on any contact to start communicating instantly.
            </Text>
          </View>
        </View>

        {/* Top Rated Contacts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Rated Contacts</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Contacts')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>View All →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.topList}>
            {topBusinesses.map((item) => {
              const categoryColor = CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS] || colors.primary;
              return (
                <View
                  key={item.id}
                  style={[styles.topItem, { backgroundColor: colors.surface }, shadows.subtle]}
                >
                  <View style={[styles.avatarBox, { backgroundColor: `${categoryColor}18` }]}>
                    <BusinessAvatar
                      image={item.image}
                      category={item.category}
                      name={item.name}
                      size={44}
                      style={{ width: 44, height: 44, borderRadius: 22 }}
                      fallbackColor={categoryColor}
                    />
                  </View>

                  <View style={styles.topItemInfo}>
                    <Text style={[styles.topItemName, { color: colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.topItemSub, { color: colors.textTertiary }]}>
                      {item.category} • ⭐ {item.rating}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.topActions}>
                    <TouchableOpacity
                      style={[styles.miniActionBtn, { backgroundColor: `${colors.call}18` }]}
                      onPress={() => setSelectedCallBusiness(item)}
                    >
                      <Icon name="phone" size={14} color={colors.call} strokeWidth={2.2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.miniActionBtn, { backgroundColor: '#25D36618' }]}
                      onPress={() =>
                        LinkingService.openWhatsApp(
                          item.phone,
                          `Hello ${item.name}, I found your contact on Leads Phone Book.`
                        )
                      }
                    >
                      <Icon name="whatsapp" size={14} color="#25D366" strokeWidth={2.2} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {selectedCallBusiness && (
        <CallActionSheet
          visible={!!selectedCallBusiness}
          business={selectedCallBusiness}
          onClose={() => setSelectedCallBusiness(null)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  greeting: {
    ...typography.labelSmall,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    ...typography.titleLarge,
    fontWeight: '800',
    fontSize: 22,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    gap: 4,
  },
  statIconBox: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statNumber: {
    ...typography.titleMedium,
    fontWeight: '800',
    fontSize: 18,
  },
  statLabel: {
    ...typography.labelSmall,
    fontSize: 10,
    textAlign: 'center',
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    gap: spacing.md,
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    fontSize: 14,
  },
  bannerSubtitle: {
    ...typography.bodySmall,
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.titleSmall,
    fontWeight: '700',
    fontSize: 16,
  },
  seeAllText: {
    ...typography.labelMedium,
    fontWeight: '700',
  },
  topList: {
    gap: spacing.sm,
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    gap: spacing.md,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    ...typography.bodyMedium,
    fontWeight: '700',
    fontSize: 14,
  },
  topItemSub: {
    ...typography.bodySmall,
    fontSize: 11,
    marginTop: 1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniActionBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
