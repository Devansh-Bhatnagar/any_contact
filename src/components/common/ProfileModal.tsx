import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Platform,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../store/AuthContext';
import { useBusinesses } from '../../store/BusinessContext';
import { Icon } from './Icon';
import { ImagePickerService } from '../../services/imagePickerService';
import { AuthService } from '../../services/authService';
import { RegisterBusinessModal } from '../business/RegisterBusinessModal';
import { Business } from '../../types/business';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenRegisterBusiness?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  visible,
  onClose,
  onOpenRegisterBusiness,
}) => {
  const { colors, isDark } = useTheme();
  const { user, isAuthenticated, updateProfile, logout } = useAuth();
  const {
    myBusinesses,
    notifications,
    unreadNotificationsCount,
    refreshMyBusinesses,
    refreshNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    submitBusiness,
    deleteBusiness,
  } = useBusinesses();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingBiz, setEditingBiz] = useState<Business | null>(null);
  const [busyBizId, setBusyBizId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(user?.name || '');
      setPhone(user?.phone || '');
      refreshMyBusinesses();
      refreshNotifications();
    }
  }, [visible, user, refreshMyBusinesses, refreshNotifications]);

  const handleUploadPhoto = () => {
    ImagePickerService.promptSelectImage(
      async (picked) => {
        const uploadedUrl = await AuthService.uploadAvatarToBackend(
          picked.uri,
          picked.fileName,
          picked.type
        );
        await updateProfile({ avatarUrl: uploadedUrl });
      },
      {
        hasExistingImage: !!user?.avatarUrl,
        onRemove: async () => {
          await updateProfile({ avatarUrl: undefined });
        },
      }
    );
  };

  const handleSubmitDraftBusiness = async (biz: Business) => {
    try {
      setBusyBizId(biz.id);
      const res = await submitBusiness(biz.id);
      Alert.alert(
        'Submitted',
        `"${res?.name || biz.name}" has been submitted for approval.`
      );
    } catch (err: any) {
      Alert.alert('Submit Failed', err?.message || 'Could not submit business.');
    } finally {
      setBusyBizId(null);
    }
  };

  const handleDeleteBusiness = (biz: Business) => {
    Alert.alert(
      'Delete Business',
      `Are you sure you want to delete "${biz.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusyBizId(biz.id);
              await deleteBusiness(biz.id);
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Could not delete business.');
            } finally {
              setBusyBizId(null);
            }
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Validation', 'Please enter your name.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: trimmedName,
        phone: phone.trim() || undefined,
      });
      Alert.alert('Profile Updated', 'Your profile changes have been saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          onClose();
          await logout();
        },
      },
    ]);
  };

  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 20
  );

  const bgColor = isDark ? '#18191A' : colors.background;
  const surfaceColor = isDark ? '#242526' : colors.surface;
  const inputBg = isDark ? '#1C1E21' : colors.surfaceVariant;
  const borderColor = isDark ? '#3A3B3C' : colors.border;

  const userInitial = (user?.name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: bgColor }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: topPadding + 10,
              backgroundColor: surfaceColor,
              borderBottomColor: colors.divider,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-left" size={22} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Profile</Text>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Photo Card */}
          <View style={[styles.avatarCard, { backgroundColor: surfaceColor }, shadows.subtle]}>
            <TouchableOpacity
              onPress={handleUploadPhoto}
              activeOpacity={0.85}
              style={styles.avatarTouchWrap}
            >
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={[styles.avatarImage, { borderColor: colors.primary }]}
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarInitial}>{userInitial}</Text>
                </View>
              )}

              <View
                style={[
                  styles.cameraBadge,
                  {
                    backgroundColor: colors.primary,
                    borderColor: surfaceColor,
                  },
                ]}
              >
                <Icon name="camera" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <Text style={[styles.displayName, { color: colors.text }]}>
              {user?.name || 'Guest User'}
            </Text>
            {user?.email ? (
              <Text style={[styles.displayEmail, { color: colors.textSecondary }]}>
                {user.email}
              </Text>
            ) : (
              <Text style={[styles.displayEmail, { color: colors.textTertiary }]}>
                Guest Session
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.uploadPillBtn,
                { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}35` },
              ]}
              onPress={handleUploadPhoto}
              activeOpacity={0.75}
            >
              <Icon name="image" size={16} color={colors.primary} />
              <Text style={[styles.uploadPillText, { color: colors.primary }]}>
                {user?.avatarUrl ? 'Change Profile Photo' : 'Upload Photo from Mobile'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Edit Profile Details Card */}
          <View style={[styles.card, { backgroundColor: surfaceColor }, shadows.subtle]}>
            <Text style={[styles.cardHeading, { color: colors.textSecondary }]}>
              Profile Information
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
              <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor }]}>
                <Icon name="user" size={18} color={colors.textTertiary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textTertiary}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number</Text>
              <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor }]}>
                <Icon name="phone" size={18} color={colors.textTertiary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={colors.textTertiary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {user?.email ? (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
                <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor, opacity: 0.75 }]}>
                  <Icon name="mail" size={18} color={colors.textTertiary} />
                  <Text style={[styles.readonlyText, { color: colors.textSecondary }]}>
                    {user.email}
                  </Text>
                </View>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSaveProfile}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>
                {saving ? 'Saving...' : 'Save Profile'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* My Registered Businesses Card */}
          <View style={[styles.card, { backgroundColor: surfaceColor }, shadows.subtle]}>
            <View style={styles.bizHeaderRow}>
              <Text style={[styles.cardHeading, { color: colors.textSecondary }]}>
                My Businesses ({myBusinesses.length})
              </Text>
              {onOpenRegisterBusiness ? (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    setTimeout(() => onOpenRegisterBusiness(), 150);
                  }}
                  style={styles.addMiniBtn}
                >
                  <Icon name="plus" size={14} color={colors.primary} strokeWidth={2.5} />
                  <Text style={[styles.addMiniText, { color: colors.primary }]}>Add New</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {myBusinesses.length === 0 ? (
              <Text style={[styles.emptyBizText, { color: colors.textTertiary }]}>
                No business registered yet. Tap "Add New" or the + icon to register your business.
              </Text>
            ) : (
              myBusinesses.map((biz) => {
                const statusLabel = (biz.status || 'PENDING').toUpperCase();
                const statusBg =
                  statusLabel === 'APPROVED'
                    ? 'rgba(34, 197, 94, 0.14)'
                    : statusLabel === 'REJECTED'
                      ? 'rgba(239, 68, 68, 0.14)'
                      : 'rgba(245, 158, 11, 0.14)';
                const statusFg =
                  statusLabel === 'APPROVED'
                    ? '#16A34A'
                    : statusLabel === 'REJECTED'
                      ? '#EF4444'
                      : '#D97706';

                return (
                  <View
                    key={biz.id}
                    style={[
                      styles.bizRow,
                      { backgroundColor: inputBg, borderColor },
                    ]}
                  >
                    {biz.image ? (
                      <Image source={{ uri: biz.image }} style={styles.bizThumb} />
                    ) : (
                      <View style={[styles.bizThumbPlaceholder, { backgroundColor: `${colors.primary}18` }]}>
                        <Icon name="briefcase" size={18} color={colors.primary} />
                      </View>
                    )}
                    <View style={styles.bizInfo}>
                      <View style={styles.bizTitleRow}>
                        <Text style={[styles.bizName, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                          {biz.name}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                          <Text style={[styles.statusBadgeText, { color: statusFg }]}>
                            {statusLabel}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.bizMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                        {biz.category} • {biz.city}
                      </Text>
                      <Text style={[styles.bizPhone, { color: colors.primary }]}>
                        {biz.phone}
                      </Text>
                      <View style={styles.bizActionRow}>
                        <TouchableOpacity
                          style={[styles.bizMiniAction, { borderColor }]}
                          onPress={() => setEditingBiz(biz)}
                          disabled={busyBizId === biz.id}
                        >
                          <Icon name="edit" size={13} color={colors.primary} />
                          <Text style={[styles.bizMiniActionText, { color: colors.primary }]}>
                            Edit
                          </Text>
                        </TouchableOpacity>
                        {statusLabel === 'DRAFT' ? (
                          <TouchableOpacity
                            style={[styles.bizMiniAction, { borderColor: '#16A34A' }]}
                            onPress={() => handleSubmitDraftBusiness(biz)}
                            disabled={busyBizId === biz.id}
                          >
                            <Icon name="send" size={13} color="#16A34A" />
                            <Text style={[styles.bizMiniActionText, { color: '#16A34A' }]}>
                              Submit
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                        <TouchableOpacity
                          style={[styles.bizMiniAction, { borderColor: 'rgba(239, 68, 68, 0.35)' }]}
                          onPress={() => handleDeleteBusiness(biz)}
                          disabled={busyBizId === biz.id}
                        >
                          <Icon name="trash" size={13} color="#EF4444" />
                          <Text style={[styles.bizMiniActionText, { color: '#EF4444' }]}>
                            Delete
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Notifications Card (Owner alerts from backend GET /notifications) */}
          {(isAuthenticated || notifications.length > 0) ? (
            <View style={[styles.card, { backgroundColor: surfaceColor }, shadows.subtle]}>
              <View style={styles.bizHeaderRow}>
                <Text style={[styles.cardHeading, { color: colors.textSecondary }]}>
                  Notifications {unreadNotificationsCount > 0 ? `(${unreadNotificationsCount})` : ''}
                </Text>
                {unreadNotificationsCount > 0 ? (
                  <TouchableOpacity
                    onPress={markAllNotificationsRead}
                    style={styles.addMiniBtn}
                  >
                    <Icon name="check" size={14} color={colors.primary} strokeWidth={2.5} />
                    <Text style={[styles.addMiniText, { color: colors.primary }]}>
                      Mark all read
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {notifications.length === 0 ? (
                <Text style={[styles.emptyBizText, { color: colors.textTertiary }]}>
                  No notifications yet.
                </Text>
              ) : (
                notifications.slice(0, 8).map((notif) => (
                  <TouchableOpacity
                    key={notif.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (!notif.read) {
                        markNotificationRead(notif.id);
                      }
                    }}
                    style={[
                      styles.notifRow,
                      {
                        backgroundColor: notif.read ? inputBg : `${colors.primary}10`,
                        borderColor: notif.read ? borderColor : `${colors.primary}40`,
                      },
                    ]}
                  >
                    <View style={styles.notifHeader}>
                      <Text style={[styles.notifTitle, { color: colors.text }]} numberOfLines={1}>
                        {notif.title}
                      </Text>
                      {!notif.read ? (
                        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                      ) : null}
                    </View>
                    <Text style={[styles.notifMessage, { color: colors.textSecondary }]}>
                      {notif.message}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          ) : null}

          {/* Account Session Action */}
          <TouchableOpacity
            style={[
              styles.accountBtn,
              {
                backgroundColor: isAuthenticated ? 'rgba(239, 68, 68, 0.12)' : `${colors.primary}15`,
              },
            ]}
            onPress={() => {
              if (isAuthenticated) {
                handleLogout();
              } else {
                onClose();
                logout();
              }
            }}
            activeOpacity={0.8}
          >
            <Icon
              name={isAuthenticated ? 'log-out' : 'user'}
              size={18}
              color={isAuthenticated ? '#EF4444' : colors.primary}
            />
            <Text
              style={[
                styles.accountBtnText,
                { color: isAuthenticated ? '#EF4444' : colors.primary },
              ]}
            >
              {isAuthenticated ? 'Log Out' : 'Sign In / Create Account'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <RegisterBusinessModal
        visible={Boolean(editingBiz)}
        editingBusiness={editingBiz}
        onClose={() => setEditingBiz(null)}
        onSuccess={() => {
          setEditingBiz(null);
          refreshMyBusinesses();
        }}
      />
    </Modal>
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
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.titleMedium,
    fontWeight: '800',
    fontSize: 18,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  avatarCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: 6,
  },
  avatarTouchWrap: {
    position: 'relative',
    marginBottom: 6,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.5,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  displayName: {
    ...typography.titleMedium,
    fontWeight: '800',
    fontSize: 19,
  },
  displayEmail: {
    ...typography.bodySmall,
    fontSize: 13,
  },
  uploadPillBtn: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  uploadPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeading: {
    ...typography.labelSmall,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    ...typography.labelMedium,
    fontWeight: '600',
    fontSize: 13,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.bodyMedium,
    fontSize: 15,
    paddingVertical: 0,
  },
  readonlyText: {
    flex: 1,
    ...typography.bodyMedium,
    fontSize: 14,
  },
  saveBtn: {
    height: 46,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  bizHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addMiniText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyBizText: {
    ...typography.bodySmall,
    fontSize: 13,
    lineHeight: 18,
  },
  bizRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  bizThumb: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.sm,
  },
  bizThumbPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bizInfo: {
    flex: 1,
    gap: 2,
  },
  bizName: {
    ...typography.bodyMedium,
    fontWeight: '700',
  },
  bizMeta: {
    ...typography.bodySmall,
    fontSize: 12,
  },
  bizPhone: {
    ...typography.bodySmall,
    fontSize: 12,
    fontWeight: '600',
  },
  accountBtn: {
    height: 48,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  accountBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  bizTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  bizActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  bizMiniAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  bizMiniActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  notifRow: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: 4,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  notifMessage: {
    fontSize: 12,
    lineHeight: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

