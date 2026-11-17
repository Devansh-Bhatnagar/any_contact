import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  ScrollView,
  Share,
  Alert,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhoneBookContact } from '../../types/phoneBook';
import { Icon } from '../common/Icon';
import { useTheme } from '../../hooks/useTheme';
import { HeaderOptionsMenu } from './HeaderOptionsMenu';
import { LinkingService } from '../../services/linkingService';
import { usePhoneBook } from '../../store/PhoneBookContext';

interface ContactActionsModalProps {
  visible: boolean;
  contact: PhoneBookContact | null;
  onClose: () => void;
  onCall: (contact: PhoneBookContact) => void;
  onMessage?: (contact: PhoneBookContact) => void;
}

export const ContactActionsModal: React.FC<ContactActionsModalProps> = ({
  visible,
  contact,
  onClose,
  onCall,
  onMessage,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 24
  );
  const bottomInset = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? 24 : 34
  );

  if (!contact) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Contact: ${contact.name}\nPhone: ${contact.primaryPhone}\nEmail: ${contact.email}`,
      });
    } catch (err) {
      // ignore
    }
  };

  const handleToggleFavorite = () => {
    Alert.alert('Favorites', `${contact.name} added to favorites.`);
  };

  const handleInvite = () => {
    const inviteMessage = `Hey ${contact.name}! I am using Leads Phone Book for smart calling and directory. Download the app to connect with me: https://anycontact.app/download`;
    LinkingService.sendMessage(contact.primaryPhone, inviteMessage);
  };

  const { toggleBlockContact, isBlocked } = usePhoneBook();
  const contactIsBlocked = isBlocked(contact.id);

  const handleBlockContact = () => {
    if (contactIsBlocked) {
      Alert.alert(
        'Unblock Contact',
        `Unblock ${contact.name}? They will be able to call and message you.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unblock',
            onPress: () => {
              toggleBlockContact(contact);
              onClose();
              Alert.alert('Unblocked', `${contact.name} has been unblocked.`);
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Block Contact',
        `Are you sure you want to block ${contact.name}? You will no longer receive calls or messages.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Block',
            style: 'destructive',
            onPress: () => {
              toggleBlockContact(contact);
              onClose();
              Alert.alert('Blocked', `${contact.name} has been added to blocked contacts.`);
            },
          },
        ]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
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
                  paddingBottom: bottomInset + 12,
                },
              ]}
            >
              {/* Header: Back, Star, More */}
              <View style={styles.headerRow}>
                <TouchableOpacity
                  style={styles.headerIconBtn}
                  onPress={onClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Icon
                    name="arrow-left"
                    size={22}
                    color={isDark ? '#F8FAFC' : '#0F172A'}
                    strokeWidth={2.2}
                  />
                </TouchableOpacity>

                <View style={styles.headerRightActions}>
                  <TouchableOpacity
                    style={styles.headerIconBtn}
                    onPress={handleToggleFavorite}
                  >
                    <Icon
                      name={contact.isFavorite ? 'star-fill' : 'star'}
                      size={22}
                      color={contact.isFavorite ? '#F59E0B' : isDark ? '#94A3B8' : '#64748B'}
                      strokeWidth={1.8}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.headerIconBtn}
                    onPress={() => setShowMenu(true)}
                  >
                    <Icon
                      name="more-vertical"
                      size={20}
                      color={isDark ? '#94A3B8' : '#64748B'}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.scrollContent,
                  { paddingBottom: bottomInset + 30 },
                ]}
              >
                {/* Profile Center Avatar */}
                <View style={styles.avatarContainer}>
                  <View style={styles.avatarBorder}>
                    <Image source={{ uri: contact.avatar }} style={styles.avatarImg} />
                  </View>
                  <Text
                    style={[
                      styles.nameText,
                      { color: isDark ? '#F8FAFC' : '#0F172A' },
                    ]}
                  >
                    {contact.name}
                  </Text>
                  <Text style={styles.phoneSubText}>{contact.primaryPhone}</Text>
                </View>

                {/* 5 Quick Action Buttons in Horizontal Row */}
                <View style={styles.actionsBar}>
                  {/* 1. Chat */}
                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() => {
                      onClose();
                      if (onMessage) {
                        onMessage(contact);
                      } else {
                        LinkingService.sendMessage(contact.primaryPhone);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.actionCircle,
                        { backgroundColor: isDark ? '#242526' : '#F0F2F5' },
                      ]}
                    >
                      <Icon
                        name="message"
                        size={20}
                        color={isDark ? '#E4E6EB' : '#1C1E21'}
                        strokeWidth={2}
                      />
                    </View>
                    <Text
                      style={[
                        styles.actionLabel,
                        { color: isDark ? '#B0B3B8' : '#65676B' },
                      ]}
                    >
                      Chat
                    </Text>
                  </TouchableOpacity>

                  {/* 2. Call (Meta Blue Primary Action) */}
                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() => {
                      onClose();
                      setTimeout(() => {
                        onCall(contact);
                      }, 150);
                    }}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.actionCircle,
                        { backgroundColor: '#0866FF' },
                      ]}
                    >
                      <Icon name="phone" size={20} color="#FFFFFF" strokeWidth={2.2} />
                    </View>
                    <Text
                      style={[
                        styles.actionLabel,
                        { color: '#0866FF', fontWeight: '700' },
                      ]}
                    >
                      Call
                    </Text>
                  </TouchableOpacity>

                  {/* 3. Video Call */}
                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() => Alert.alert('Video Call', `Starting video call with ${contact.name}...`)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.actionCircle,
                        { backgroundColor: isDark ? '#242526' : '#F0F2F5' },
                      ]}
                    >
                      <Icon
                        name="video"
                        size={20}
                        color={isDark ? '#E4E6EB' : '#1C1E21'}
                        strokeWidth={2}
                      />
                    </View>
                    <Text
                      style={[
                        styles.actionLabel,
                        { color: isDark ? '#B0B3B8' : '#65676B' },
                      ]}
                    >
                      Video Call
                    </Text>
                  </TouchableOpacity>

                  {/* 4. Invite */}
                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={handleInvite}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.actionCircle,
                        { backgroundColor: isDark ? '#242526' : '#F0F2F5' },
                      ]}
                    >
                      <Icon
                        name="user-plus"
                        size={20}
                        color={isDark ? '#E4E6EB' : '#1C1E21'}
                        strokeWidth={2}
                      />
                    </View>
                    <Text
                      style={[
                        styles.actionLabel,
                        { color: isDark ? '#B0B3B8' : '#65676B' },
                      ]}
                    >
                      Invite
                    </Text>
                  </TouchableOpacity>

                  {/* 5. Settings */}
                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() => Alert.alert('Contact Settings', `Settings for ${contact.name}`)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.actionCircle,
                        { backgroundColor: isDark ? '#242526' : '#F0F2F5' },
                      ]}
                    >
                      <Icon
                        name="settings"
                        size={20}
                        color={isDark ? '#E4E6EB' : '#1C1E21'}
                        strokeWidth={2}
                      />
                    </View>
                    <Text
                      style={[
                        styles.actionLabel,
                        { color: isDark ? '#B0B3B8' : '#65676B' },
                      ]}
                    >
                      Settings
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Details List */}
                <View
                  style={[
                    styles.detailsCard,
                    {
                      backgroundColor: isDark ? '#18191A' : '#F0F2F5',
                      borderColor: isDark ? '#3A3B3C' : '#E4E6EB',
                    },
                  ]}
                >
                  {/* Phone numbers */}
                  {contact.phoneNumbers.map((p, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.detailRow,
                        idx > 0 && {
                          borderTopWidth: 1,
                          borderTopColor: isDark ? '#3A3B3C' : '#E4E6EB',
                        },
                      ]}
                      onPress={() => {
                        onClose();
                        setTimeout(() => {
                          onCall(contact);
                        }, 150);
                      }}
                    >
                      <View style={styles.detailIconWrap}>
                        <Icon name="phone" size={18} color="#0866FF" strokeWidth={2} />
                      </View>
                      <View style={styles.detailTextWrap}>
                        <Text
                          style={[
                            styles.detailMainText,
                            { color: isDark ? '#E4E6EB' : '#050505' },
                          ]}
                        >
                          {p.number}
                        </Text>
                        <Text style={styles.detailSubText}>{p.label}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {/* Email */}
                  {contact.email ? (
                    <TouchableOpacity
                      style={[
                        styles.detailRow,
                        {
                          borderTopWidth: 1,
                          borderTopColor: isDark ? '#3A3B3C' : '#E4E6EB',
                        },
                      ]}
                      onPress={() => Alert.alert('Email', `Composing email to ${contact.email}`)}
                    >
                      <View style={styles.detailIconWrap}>
                        <Icon name="mail" size={18} color="#0866FF" strokeWidth={2} />
                      </View>
                      <View style={styles.detailTextWrap}>
                        <Text
                          style={[
                            styles.detailMainText,
                            { color: isDark ? '#E4E6EB' : '#050505' },
                          ]}
                        >
                          {contact.email}
                        </Text>
                        <Text style={styles.detailSubText}>Email</Text>
                      </View>
                    </TouchableOpacity>
                  ) : null}

                  {/* Share Contact */}
                  <TouchableOpacity
                    style={[
                      styles.detailRow,
                      {
                        borderTopWidth: 1,
                        borderTopColor: isDark ? '#3A3B3C' : '#E4E6EB',
                      },
                    ]}
                    onPress={handleShare}
                  >
                    <View style={styles.detailIconWrap}>
                      <Icon
                        name="share"
                        size={18}
                        color={isDark ? '#B0B3B8' : '#65676B'}
                        strokeWidth={2}
                      />
                    </View>
                    <View style={styles.detailTextWrap}>
                      <Text
                        style={[
                          styles.detailActionTitle,
                          { color: isDark ? '#E4E6EB' : '#050505' },
                        ]}
                      >
                        Share Contact
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Add to Favorites */}
                  <TouchableOpacity
                    style={[
                      styles.detailRow,
                      {
                        borderTopWidth: 1,
                        borderTopColor: isDark ? '#334155' : '#EEF2F6',
                      },
                    ]}
                    onPress={handleToggleFavorite}
                  >
                    <View style={styles.detailIconWrap}>
                      <Icon name="star" size={18} color="#F59E0B" strokeWidth={2} />
                    </View>
                    <View style={styles.detailTextWrap}>
                      <Text
                        style={[
                          styles.detailActionTitle,
                          { color: isDark ? '#F8FAFC' : '#0F172A' },
                        ]}
                      >
                        Add to Favorites
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Block Contact */}
                  <TouchableOpacity
                    style={[
                      styles.detailRow,
                      {
                        borderTopWidth: 1,
                        borderTopColor: isDark ? '#334155' : '#EEF2F6',
                      },
                    ]}
                    onPress={handleBlockContact}
                  >
                    <View style={styles.detailIconWrap}>
                      <Icon name="block" size={18} color="#EF4444" strokeWidth={2} />
                    </View>
                    <View style={styles.detailTextWrap}>
                      <Text style={[styles.detailActionTitle, { color: '#EF4444' }]}>
                        {contactIsBlocked ? 'Unblock Contact' : 'Block Contact'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>

      {/* 3-Dots Options Menu Popup */}
      <HeaderOptionsMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        topInset={topInset}
        onDelete={() =>
          Alert.alert('Delete Contact', `Are you sure you want to delete ${contact.name}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: onClose },
          ])
        }
        onToggleHideBlocked={() =>
          Alert.alert('Blocked Calls', 'Blocked settings updated.')
        }
        onToggleHideOtherApps={() =>
          Alert.alert('App Calls', 'Calls from other apps updated.')
        }
        onTotalCallTime={() =>
          Alert.alert(
            'Total Call Time',
            `• Outgoing: 42m\n• Incoming: 28m\n• Total with ${contact.name}: 1h 10m`
          )
        }
        onViewTags={() =>
          Alert.alert('Tags', `Tags for ${contact.name}: Friends, VIP, Bestie.`)
        }
        onSettings={() => Alert.alert('Settings', 'Contact preferences & settings.')}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '78%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 14,
  },
  avatarBorder: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  phoneSubText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  actionItem: {
    alignItems: 'center',
    width: 62,
  },
  actionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  detailsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  detailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTextWrap: {
    flex: 1,
  },
  detailMainText: {
    fontSize: 15,
    fontWeight: '700',
  },
  detailSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  detailActionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
});
