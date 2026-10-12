import React, { useRef, useMemo, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Business } from '../types/business';
import { useBusinesses } from '../hooks/useBusinesses';
import { useTheme } from '../hooks/useTheme';
import { Header } from '../components/common/Header';
import { SearchBar } from '../components/common/SearchBar';
import { SectionHeader } from '../components/common/SectionHeader';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { BusinessListItem } from '../components/business/BusinessListItem';
import { RecentBusinessesRail } from '../components/business/RecentBusinessesRail';
import { CategoryFilter } from '../components/business/CategoryFilter';
import { CallActionSheet } from '../components/business/CallActionSheet';
import { LinkingService } from '../services/linkingService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ContactsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const {
    businesses,
    sections,
    filteredBusinesses,
    recentBusinesses,
    isLoading,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
    toggleBestie,
    isBestie,
    trackBusinessView,
    clearRecentHistory,
    refreshBusinesses,
  } = useBusinesses();

  const sectionListRef = useRef<any>(null);
  const [selectedCallBusiness, setSelectedCallBusiness] = useState<Business | null>(null);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    businesses.forEach((b: Business) => {
      counts[b.category] = (counts[b.category] || 0) + 1;
    });
    return counts;
  }, [businesses]);

  const handleOpenBusiness = useCallback(
    (business: Business) => {
      trackBusinessView(business);
      navigation.navigate('BusinessDetails', {
        businessId: business.id,
        initialBusiness: business,
      });
    },
    [navigation, trackBusinessView]
  );

  const handleQuickCall = useCallback((business: Business) => {
    setSelectedCallBusiness(business);
  }, []);

  const handleQuickWhatsApp = useCallback((business: Business) => {
    LinkingService.openWhatsApp(
      business.phone,
      `Hello ${business.name}, I am contacting you via Contact App.`
    );
  }, []);

  const renderItem = useCallback(
    ({ item, index, section }: any) => {
      const isLastInSection = index === section.data.length - 1;
      return (
        <BusinessListItem
          business={item}
          onPress={handleOpenBusiness}
          onToggleBestie={toggleBestie}
          isBestie={isBestie(item.id)}
          onCall={handleQuickCall}
          onWhatsApp={handleQuickWhatsApp}
          showDivider={!isLastInSection}
        />
      );
    },
    [handleOpenBusiness, toggleBestie, isBestie, handleQuickCall, handleQuickWhatsApp]
  );

  const renderSectionHeader = useCallback(
    ({ section: { title } }: any) => (
      <SectionHeader title={title} />
    ),
    []
  );

  if (isLoading && businesses.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState message="Loading contacts directory..." />
      </SafeAreaView>
    );
  }

  const hasFilter = searchQuery.length > 0 || selectedCategory !== 'All';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header matching exact screenshot */}
      <Header
        title="Contacts"
        subtitle="Business Directory"
        count={filteredBusinesses.length}
      />

      {/* Search Input */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search names, services, cities, phones..."
        onClear={() => setSearchQuery('')}
      />

      {/* Category Filter Chips */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categoryCounts}
      />

      {/* List Body */}
      <View style={styles.listWrapper}>
        <SectionList
          ref={sectionListRef}
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshBusinesses}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            !hasFilter && recentBusinesses.length > 0 ? (
              <RecentBusinessesRail
                businesses={recentBusinesses}
                onSelect={handleOpenBusiness}
                onClear={clearRecentHistory}
              />
            ) : undefined
          }
          ListEmptyComponent={
            <EmptyState
              icon="search"
              title="No Contacts Found"
              description={
                hasFilter
                  ? `No matching results for "${searchQuery || selectedCategory}". Try another name or clear filter.`
                  : 'No contacts currently available.'
              }
              actionLabel={hasFilter ? 'Reset Filters' : undefined}
              onAction={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
            />
          }
        />
      </View>

      {/* Quick Call & WhatsApp Action Sheet */}
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
  listWrapper: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
    paddingBottom: 40,
  },
});
