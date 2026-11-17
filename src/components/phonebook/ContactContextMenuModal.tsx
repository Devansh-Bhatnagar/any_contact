import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Alert,
  Platform,
  StatusBar,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhoneBookContact } from '../../types/phoneBook';
import { Icon } from '../common/Icon';
import { useTheme } from '../../hooks/useTheme';

interface ContactContextMenuModalProps {
  visible: boolean;
  contact: PhoneBookContact | null;
  isBlocked?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  onClose: () => void;
  onDelete: (contact: PhoneBookContact) => void;
  onToggleBlock: (contact: PhoneBookContact) => void;
  onTogglePin?: (contact: PhoneBookContact) => void;
  onToggleMute?: (contact: PhoneBookContact) => void;
  onViewInfo?: (contact: PhoneBookContact) => void;
}

export const ContactContextMenuModal: React.FC<ContactContextMenuModalProps> = ({
  visible,
  contact,
  isBlocked = false,
  isPinned = false,
  isMuted = false,
  onClose,
  onDelete,
  onToggleBlock,
  onTogglePin,
  onToggleMute,
  onViewInfo,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 24
  );
  const bottomInset = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? 24 : 34
  );

  if (!contact) return null;

  // Handle Delete Confirmation (WhatsApp style)
  const handleDeletePress = () => {
    Alert.alert(
      `Delete "${contact.name}"?`,
      'Are you sure you want to delete this contact from your phone book? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onClose();
            onDelete(contact);
          },
        },
      ]
    );
  };

  // Handle Block Confirmation (WhatsApp style)
  const handleBlockPress = () => {
    if (isBlocked) {
      Alert.alert(
        `Unblock "${contact.name}"?`,
        'This contact will now be able to call and message you.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unblock',
            onPress: () => {
              onClose();
              onToggleBlock(contact);
            },
          },
        ]
      );
    } else {
      Alert.alert(
        `Block "${contact.name}"?`,
        'Blocked contacts will no longer be able to call or message you.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Block',
            style: 'destructive',
            onPress: () => {
              onClose();
              onToggleBlock(contact);
            },
          },
        ]
      );
    }
  };

  // Handle Pin
  const handlePinPress = () => {
    onClose();
    if (onTogglePin) onTogglePin(contact);
  };

  // Handle Mute
  const handleMutePress = () => {
    onClose();
    if (onToggleMute) onToggleMute(contact);
  };

  // Handle Share
  const handleSharePress = async () => {
    onClose();
    try {
      await Share.share({
        message: `Contact: ${contact.name}\nPhone: ${contact.primaryPhone}`,
      });
    } catch (err) {
      // ignore
    }
  };

  // Handle View Info
  const handleViewInfoPress = () => {
    onClose();
    if (onViewInfo) onViewInfo(contact);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, { paddingTop: topInset + 14 }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheetContainer,
                {
                  backgroundColor: isDark ? '#242526' : '#FFFFFF',
                  paddingBottom: bottomInset + 10,
                },
              ]}
            >
              {/* Sheet Drag Indicator */}
              <View style={styles.handleBar} />

              {/* Contact Info Header Card */}
              <View
                style={[
                  styles.contactCard,
                  {
                    backgroundColor: isDark ? '#18191A' : '#F0F2F5',
                    borderColor: isDark ? '#3A3B3C' : '#E4E6EB',
                  },
                ]}
              >
                <View style={styles.avatarBorder}>
                  <Image source={{ uri: contact.avatar }} style={styles.avatarImg} />
                </View>
                <View style={styles.contactDetails}>
                  <View style={styles.nameRow}>
                    <Text
                      style={[
                        styles.contactName,
                        { color: isDark ? '#E4E6EB' : '#050505' },
                      ]}
                      numberOfLines={1}
                    >
                      {contact.name}
                    </Text>
                    {isPinned && (
                      <View style={styles.badge}>
                        <Icon name="pin" size={11} color="#0866FF" strokeWidth={2.5} />
                        <Text style={[styles.badgeText, { color: '#0866FF' }]}>Pinned</Text>
                      </View>
                    )}
                    {isBlocked && (
                      <View style={[styles.badge, styles.blockedBadge]}>
                        <Icon name="block" size={11} color="#EF4444" strokeWidth={2.5} />
                        <Text style={[styles.badgeText, styles.blockedBadgeText]}>Blocked</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.contactPhone}>{contact.primaryPhone}</Text>
                </View>
              </View>

              {/* Options List */}
              <View style={styles.optionsList}>
                {/* 1. Pin / Unpin */}
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={handlePinPress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: isDark ? '#3A3B3C' : '#F0F2F5' },
                    ]}
                  >
                    <Icon
                      name="pin"
                      size={18}
                      color={isPinned ? '#0866FF' : (isDark ? '#B0B3B8' : '#65676B')}
                      strokeWidth={2}
                    />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text
                      style={[
                        styles.optionTitle,
                        { color: isDark ? '#F3F4F6' : '#1E293B' },
                      ]}
                    >
                      {isPinned ? 'Unpin contact' : 'Pin contact'}
                    </Text>
                    <Text style={styles.optionSub}>
                      {isPinned ? 'Remove from top of list' : 'Keep at the top of contact list'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 2. Mute Notifications */}
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={handleMutePress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: isDark ? '#3A3B3C' : '#F0F2F5' },
                    ]}
                  >
                    <Icon
                      name="bell-off"
                      size={18}
                      color={isMuted ? '#0866FF' : (isDark ? '#B0B3B8' : '#65676B')}
                      strokeWidth={2}
                    />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text
                      style={[
                        styles.optionTitle,
                        { color: isDark ? '#F3F4F6' : '#1E293B' },
                      ]}
                    >
                      {isMuted ? 'Unmute notifications' : 'Mute notifications'}
                    </Text>
                    <Text style={styles.optionSub}>
                      Silence calls & message alerts
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 3. View Contact Info */}
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={handleViewInfoPress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: isDark ? '#3A3B3C' : '#F0F2F5' },
                    ]}
                  >
                    <Icon
                      name="info"
                      size={18}
                      color={isDark ? '#B0B3B8' : '#65676B'}
                      strokeWidth={2}
                    />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text
                      style={[
                        styles.optionTitle,
                        { color: isDark ? '#F3F4F6' : '#1E293B' },
                      ]}
                    >
                      View contact info
                    </Text>
                    <Text style={styles.optionSub}>
                      See full profile, details and options
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 4. Share Contact */}
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={handleSharePress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: isDark ? '#3A3B3C' : '#F0F2F5' },
                    ]}
                  >
                    <Icon
                      name="share"
                      size={18}
                      color={isDark ? '#B0B3B8' : '#65676B'}
                      strokeWidth={2}
                    />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text
                      style={[
                        styles.optionTitle,
                        { color: isDark ? '#F3F4F6' : '#1E293B' },
                      ]}
                    >
                      Share contact
                    </Text>
                    <Text style={styles.optionSub}>
                      Send contact card to other apps
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Divider */}
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: isDark ? '#3A3B3C' : '#E4E6EB' },
                  ]}
                />

                {/* 5. Block Contact (WhatsApp red style) */}
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={handleBlockPress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' },
                    ]}
                  >
                    <Icon name="block" size={18} color="#EF4444" strokeWidth={2} />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={[styles.optionTitle, { color: '#EF4444' }]}>
                      {isBlocked ? `Unblock ${contact.name}` : `Block ${contact.name}`}
                    </Text>
                    <Text style={styles.optionSub}>
                      {isBlocked
                        ? 'Allow incoming calls and messages'
                        : 'Blocked contacts will no longer be able to call you'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 6. Delete Contact (WhatsApp red style) */}
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={handleDeletePress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' },
                    ]}
                  >
                    <Icon name="trash" size={18} color="#EF4444" strokeWidth={2} />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={[styles.optionTitle, { color: '#EF4444' }]}>
                      Delete contact
                    </Text>
                    <Text style={styles.optionSub}>
                      Remove from your phone book permanently
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: isDark ? '#3A3B3C' : '#F0F2F5',
                  },
                ]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.cancelText,
                    { color: isDark ? '#E4E6EB' : '#050505' },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  handleBar: {
    width: 38,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#94A3B8',
    alignSelf: 'center',
    marginBottom: 14,
    opacity: 0.6,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  avatarBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#CBD5E1',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  contactDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
    maxWidth: 160,
  },
  contactPhone: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3B82F6',
  },
  blockedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  blockedBadgeText: {
    color: '#EF4444',
  },
  optionsList: {
    marginVertical: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextCol: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 6,
  },
  cancelBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
