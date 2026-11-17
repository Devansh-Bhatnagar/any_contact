import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Switch,
  ScrollView,
  Platform,
  StatusBar,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { usePhoneBook } from '../store/PhoneBookContext';
import { useAuth } from '../store/AuthContext';
import { Icon } from '../components/common/Icon';
import { ImagePickerService } from '../services/imagePickerService';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark, toggleTheme } = useTheme();
  const { blockedContacts } = usePhoneBook();
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0
  );

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const userInitial = (user?.name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 10, borderBottomColor: colors.divider }]}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Account Profile Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }, shadows.subtle]}>
          <Text style={[styles.cardHeading, { color: colors.textSecondary }]}>Account</Text>

          {isAuthenticated && user ? (
            <>
              <View style={styles.profileRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    ImagePickerService.promptSelectImage(
                      async (picked) => {
                        await updateProfile({ avatarUrl: picked.uri });
                      },
                      {
                        hasExistingImage: !!user.avatarUrl,
                        onRemove: async () => {
                          await updateProfile({ avatarUrl: undefined });
                        },
                      }
                    )
                  }
                  style={{ position: 'relative' }}
                >
                  <View
                    style={[
                      styles.avatarCircle,
                      { backgroundColor: colors.primary, overflow: 'hidden' },
                    ]}
                  >
                    {user.avatarUrl ? (
                      <Image
                        source={{ uri: user.avatarUrl }}
                        style={{ width: '100%', height: '100%', borderRadius: 999 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.avatarText}>{userInitial}</Text>
                    )}
                  </View>
                  <View
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: '#1877F2',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor: '#FFFFFF',
                    }}
                  >
                    <Icon name="camera" size={11} color="#FFFFFF" strokeWidth={2.3} />
                  </View>
                </TouchableOpacity>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: colors.text }]}>
                    {user.name || 'User'}
                  </Text>
                  <Text style={[styles.profileEmail, { color: colors.textTertiary }]}>
                    {user.email}
                  </Text>
                  {user.phone ? (
                    <Text style={[styles.profilePhone, { color: colors.textTertiary }]}>
                      {user.phone}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                  <Icon name="log-out" size={18} color="#EF4444" />
                </View>
                <Text style={styles.logoutText}>Log Out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.guestContainer}>
              <View style={styles.guestInfo}>
                <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}18` }]}>
                  <Icon name="user" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Guest Mode</Text>
                  <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>
                    Sign in or register to sync your account
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.signInButton, { backgroundColor: colors.primary }]}
                onPress={() => logout()}
                activeOpacity={0.8}
              >
                <Text style={styles.signInButtonText}>Sign In / Register</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Appearance Section */}
        <View style={[styles.card, { backgroundColor: colors.surface }, shadows.subtle]}>
          <Text style={[styles.cardHeading, { color: colors.textSecondary }]}>Appearance</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}18` }]}>
                <Icon name={isDark ? 'moon' : 'sun'} size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>
                  {isDark ? 'Dark theme active' : 'Light theme active'}
                </Text>
              </View>
            </View>

            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Privacy & Blocked Contacts Section */}
        {/* <View style={[styles.card, { backgroundColor: colors.surface }, shadows.subtle]}>
          <Text style={[styles.cardHeading, { color: colors.textSecondary }]}>Privacy & Security</Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('BlockedContacts')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <Icon name="block" size={18} color="#EF4444" />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Blocked Contacts</Text>
                <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>
                  {blockedContacts.length === 0
                    ? 'No blocked contacts'
                    : `${blockedContacts.length} contact${blockedContacts.length > 1 ? 's' : ''} blocked`}
                </Text>
              </View>
            </View>

            <View style={styles.settingRight}>
              {blockedContacts.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{blockedContacts.length}</Text>
                </View>
              )}
              <Icon name="chevron-right" size={18} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>
        </View> */}

        {/* App Info Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }, shadows.subtle]}>
          <Text style={[styles.cardHeading, { color: colors.textSecondary }]}>Application</Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>App Name</Text>
            <Text style={[styles.infoVal, { color: colors.text }]}>Leads Phone Book</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Version</Text>
            <Text style={[styles.infoVal, { color: colors.text }]}>1.0.0 (Release)</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Communication Services</Text>
            {/* <Text style={[styles.infoVal, { color: '#10B981' }]}>WhatsApp & Voice Dialer Active</Text> */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    ...typography.titleLarge,
    fontWeight: '800',
    fontSize: 22,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeading: {
    ...typography.labelSmall,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  settingDesc: {
    ...typography.bodySmall,
    fontSize: 11,
    marginTop: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#EF4444',
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    ...typography.bodyMedium,
  },
  infoVal: {
    ...typography.bodyMedium,
    fontWeight: '700',
  },
  divider: {
    height: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    ...typography.bodyLarge,
    fontWeight: '700',
    fontSize: 16,
  },
  profileEmail: {
    ...typography.bodySmall,
    fontSize: 13,
  },
  profilePhone: {
    ...typography.bodySmall,
    fontSize: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 4,
  },
  logoutText: {
    ...typography.bodyMedium,
    color: '#EF4444',
    fontWeight: '700',
  },
  guestContainer: {
    gap: spacing.md,
  },
  guestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  signInButton: {
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
