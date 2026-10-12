import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Business } from '../types/business';
import { useBusinesses } from '../hooks/useBusinesses';
import { useTheme } from '../hooks/useTheme';
import { Header } from '../components/common/Header';
import { EmptyState } from '../components/common/EmptyState';
import { BusinessListItem } from '../components/business/BusinessListItem';
import { CallActionSheet } from '../components/business/CallActionSheet';
import { LinkingService } from '../services/linkingService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const BestieScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { bestieBusinesses, toggleBestie, isBestie, trackBusinessView } = useBusinesses();
  const [selectedCallBusiness, setSelectedCallBusiness] = useState<Business | null>(null);

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
    ({ item, index }: { item: Business; index: number }) => {
      const isLast = index === bestieBusinesses.length - 1;
      return (
        <BusinessListItem
          business={item}
          onPress={handleOpenBusiness}
          onToggleBestie={toggleBestie}
          isBestie={isBestie(item.id)}
          onCall={handleQuickCall}
          onWhatsApp={handleQuickWhatsApp}
          showDivider={!isLast}
        />
      );
    },
    [handleOpenBusiness, toggleBestie, isBestie, bestieBusinesses.length, handleQuickCall, handleQuickWhatsApp]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Bestie"
        subtitle="Starred & Favorite Contacts"
        count={bestieBusinesses.length}
      />

      <FlatList
        data={bestieBusinesses}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="star"
            title="No Favorites Yet"
            description="Star any business contact from the main directory to pin them here for instant 1-tap WhatsApp and Call access."
          />
        }
      />

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
  listContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
});
