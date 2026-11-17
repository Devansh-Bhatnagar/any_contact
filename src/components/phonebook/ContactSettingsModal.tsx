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
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhoneBookContact } from '../../types/phoneBook';
import { Icon } from '../common/Icon';
import { useTheme } from '../../hooks/useTheme';

interface ContactSettingsModalProps {
  visible: boolean;
  contact: PhoneBookContact | null;
  isFavorite?: boolean;
  isBlocked?: boolean;
  onClose: () => void;
  onEmail?: (contact: PhoneBookContact) => void;
  onToggleFavorite?: (contact: PhoneBookContact) => void;
  onToggleBlock?: (contact: PhoneBookContact) => void;
  onDeleteContact?: (contact: PhoneBookContact) => void;
}

export const ContactSettingsModal: React.FC<ContactSettingsModalProps> = ({
  visible,
  contact,
  isFavorite = false,
  isBlocked = false,
  onClose,
  onEmail,
  onToggleFavorite,
  onToggleBlock,
  onDeleteContact,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const bottomInset = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? 18 : 24
  );

  if (!contact) return null;

  const handleEmailPress = () => {
    onClose();
    if (onEmail) {
      onEmail(contact);
    } else if (contact.email) {
      Linking.openURL(`mailto:${contact.email}`).catch(() => {
        Alert.alert('Email', `Contact email: ${contact.email}`);
      });
    } else {
      Alert.alert('Email', 'No email address found for this contact.');
    }
  };

  const handleFavoritePress = () => {
    onClose();
    if (onToggleFavorite) {
      onToggleFavorite(contact);
    }
  };

  const handleBlockPress = () => {
    onClose();
    if (onToggleBlock) {
      onToggleBlock(contact);
    }
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}? This contact will be removed from your phonebook.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onClose();
            if (onDeleteContact) {
              onDeleteContact(contact);
            }
          },
        },
      ]
    );
  };

  const bgColor = isDark ? '#242526' : '#FFFFFF';
  const borderColor = isDark ? '#3A3B3C' : '#E4E6EB';
  const textColor = isDark ? '#E4E6EB' : '#0F172A';
  const subTextColor = isDark ? '#B0B3B8' : '#64748B';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: bgColor,
                  borderColor: borderColor,
                  paddingBottom: bottomInset + 8,
                },
              ]}
            >
              {/* Header: Contact Profile Preview */}
              <View style={styles.cardHeader}>
                <Image source={{ uri: contact.avatar }} style={styles.avatarImg} />
                <View style={styles.headerInfo}>
                  <Text style={[styles.contactName, { color: textColor }]} numberOfLines={1}>
                    {contact.name}
                  </Text>
                  <Text style={[styles.contactPhone, { color: subTextColor }]} numberOfLines={1}>
                    {contact.primaryPhone}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close" size={20} color={subTextColor} />
                </TouchableOpacity>
              </View>

              <View style={[styles.divider, { backgroundColor: borderColor }]} />

              {/* 4 Action Options Requested by User */}
              <View style={styles.optionsList}>
                {/* 1. Email */}
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={handleEmailPress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: isDark ? '#3A3B3C' : '#F0F2F5' },
                    ]}
                  >
                    <Icon name="mail" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={[styles.optionTitle, { color: textColor }]}>
                      Email
                    </Text>
                    <Text style={[styles.optionSub, { color: subTextColor }]} numberOfLines={1}>
                      {contact.email || 'Send email'}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color={subTextColor} />
                </TouchableOpacity>

                {/* 2. Add to favourite */}
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={handleFavoritePress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isFavorite
                          ? (isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7')
                          : (isDark ? '#3A3B3C' : '#F0F2F5'),
                      },
                    ]}
                  >
                    <Icon
                      name={isFavorite ? 'star-fill' : 'star'}
                      size={20}
                      color="#F59E0B"
                    />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={[styles.optionTitle, { color: textColor }]}>
                      {isFavorite ? 'Remove from favorites' : 'Add to favorite'}
                    </Text>
                    <Text style={[styles.optionSub, { color: subTextColor }]}>
                      {isFavorite ? 'Saved in favorite contacts' : 'Mark as favorite contact'}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color={subTextColor} />
                </TouchableOpacity>

                {/* 3. Block contact */}
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={handleBlockPress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isBlocked
                          ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2')
                          : (isDark ? '#3A3B3C' : '#F0F2F5'),
                      },
                    ]}
                  >
                    <Icon
                      name="block"
                      size={20}
                      color={isBlocked ? '#EF4444' : (isDark ? '#B0B3B8' : '#64748B')}
                    />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={[styles.optionTitle, { color: isBlocked ? '#EF4444' : textColor }]}>
                      {isBlocked ? 'Unblock contact' : 'Block contacts'}
                    </Text>
                    <Text style={[styles.optionSub, { color: subTextColor }]}>
                      {isBlocked ? 'Allow calls and messages' : 'Stop calls and messages'}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color={subTextColor} />
                </TouchableOpacity>

                {/* 4. Delete contacts (Additional Requested) */}
                <TouchableOpacity
                  style={[styles.optionRow, styles.deleteOptionRow]}
                  onPress={handleDeletePress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEE2E2' },
                    ]}
                  >
                    <Icon name="trash" size={20} color="#EF4444" />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={[styles.optionTitle, { color: '#EF4444' }]}>
                      Delete contacts
                    </Text>
                    <Text style={[styles.optionSub, { color: subTextColor }]}>
                      Permanently remove from phonebook
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 17,
    fontWeight: '700',
  },
  contactPhone: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginBottom: 10,
  },
  optionsList: {
    gap: 6,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    gap: 14,
    borderRadius: 14,
  },
  deleteOptionRow: {
    marginTop: 4,
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
    marginTop: 2,
  },
});
