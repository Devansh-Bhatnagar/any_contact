import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhoneBookContact } from '../../types/phoneBook';
import { Icon } from '../common/Icon';
import { useTheme } from '../../hooks/useTheme';
import { usePhoneBook } from '../../store/PhoneBookContext';

export interface ChatMessage {
  id: string;
  sender: 'me' | 'contact';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
}

interface WhatsAppChatModalProps {
  visible: boolean;
  contact: PhoneBookContact | null;
  onClose: () => void;
  onCall: (contact: PhoneBookContact) => void;
  onViewContactDetails?: (contact: PhoneBookContact) => void;
  onBlockContact?: (contact: PhoneBookContact) => void;
  isBlocked?: boolean;
  customMessages?: ChatMessage[];
}

export const WhatsAppChatModal: React.FC<WhatsAppChatModalProps> = ({
  visible,
  contact,
  onClose,
  onCall,
  onViewContactDetails,
  onBlockContact,
  isBlocked = false,
  customMessages,
}) => {
  const { colors, isDark } = useTheme();
  const { updateRecentChat } = usePhoneBook();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Track keyboard visibility + auto-scroll (WhatsApp behaviour)
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subShow = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
    });
    const subHide = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  // Top inset calculation
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 20
  );
  const bottomInset = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? 12 : 24
  );

  // Format current time
  const getCurrentTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minStr} ${ampm}`;
  };

  // Load conversation when opened
  useEffect(() => {
    if (visible && contact) {
      if (customMessages && customMessages.length > 0) {
        setMessages(customMessages);
      } else {
        setMessages([]);
      }
      setInputText('');
      setIsTyping(false);
      setShowMenu(false);
    }
  }, [visible, contact?.id, customMessages]);

  if (!contact) return null;

  // App's unified theme palette
  const headerBg = isDark ? '#18191A' : '#FFFFFF';
  const headerBorder = isDark ? '#2E2F30' : '#E4E6EB';
  const headerTitleColor = isDark ? '#E4E6EB' : '#050505';
  const headerIconColor = isDark ? '#E4E6EB' : '#1C1E21';
  const chatBg = isDark ? '#18191A' : '#F0F2F5';
  const inputBg = isDark ? '#242526' : '#FFFFFF';
  const inputBorder = isDark ? '#3A3B3C' : '#E4E6EB';
  const inputTextColor = isDark ? '#E4E6EB' : '#050505';
  const iconColor = isDark ? '#B0B3B8' : '#65676B';
  const myBubbleBg = colors.primary; // #1E60F2 in light, #3B82F6 in dark
  const contactBubbleBg = isDark ? '#242526' : '#FFFFFF';
  const contactBubbleBorder = isDark ? '#3A3B3C' : '#E4E6EB';
  const bubbleTextColor = isDark ? '#E4E6EB' : '#050505';
  const bubbleTimeColor = isDark ? '#B0B3B8' : '#65676B';

  // Realistic contact auto-replies pool
  const autoReplies = [
    `Sounds great! I'll ping you as soon as I'm done with this meeting 👍`,
    `Got it! Thanks for letting me know 😊`,
    `Haha nice! We should definitely catch up soon.`,
    `Sure thing! Give me a call whenever you're ready.`,
    `Perfect, talk to you later! 🚀`,
    `Noted! See you soon.`,
  ];

  // Send message handler
  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      text: trimmed,
      time: getCurrentTime(),
      status: 'read',
    };

    const nextMessages = [...messages, newMsg];
    setMessages(nextMessages);
    updateRecentChat(contact, trimmed, nextMessages);
    setInputText('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Trigger simulated reply from contact
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const replyText =
        autoReplies[Math.floor(Math.random() * autoReplies.length)];
      const replyMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        sender: 'contact',
        text: replyText,
        time: getCurrentTime(),
      };
      setMessages((prev) => {
        const withReply = [...prev, replyMsg];
        updateRecentChat(contact, replyText, withReply);
        return withReply;
      });
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1300);
  };

  const handleAudioCall = () => {
    onCall(contact);
  };

  const handleVideoCall = () => {
    Alert.alert(
      'Video Call',
      `Start video call with ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            onCall(contact);
          },
        },
      ]
    );
  };

  const handleMenuOption = (title: string, action?: () => void) => {
    setShowMenu(false);
    if (action) {
      action();
    } else {
      Alert.alert(title, `Feature: ${title}`);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* App Themed WhatsApp Chat Header */}
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: headerBg,
            borderBottomColor: headerBorder,
            paddingTop: topInset + 6,
          },
        ]}
      >
        <View style={styles.headerContent}>
          {/* Back Button & Avatar */}
          <TouchableOpacity
            style={styles.headerLeftGroup}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Icon
              name="arrow-left"
              size={22}
              color={headerIconColor}
              strokeWidth={2.4}
            />
            {contact.avatar && (contact.avatar.startsWith('http') || contact.avatar.startsWith('data:')) ? (
              <Image source={{ uri: contact.avatar }} style={styles.headerAvatar} />
            ) : (
              <View
                style={[
                  styles.headerAvatar,
                  styles.headerAvatarFallback,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.headerAvatarInitial}>
                  {(contact.name || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Contact Name & Status */}
          <TouchableOpacity
            style={styles.headerInfoCol}
            onPress={() => {
              if (onViewContactDetails) {
                onClose();
                onViewContactDetails(contact);
              }
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.headerNameText, { color: headerTitleColor }]}
              numberOfLines={1}
            >
              {contact.name}
            </Text>
            <Text
              style={[
                styles.headerStatusText,
                { color: isTyping ? colors.primary : (isDark ? '#94A3B8' : '#64748B') },
              ]}
              numberOfLines={1}
            >
              {isTyping ? 'typing...' : 'online'}
            </Text>
          </TouchableOpacity>

          {/* Right Action Icons: Video, Audio Call, 3-Dots Menu */}
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={handleVideoCall}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Icon
                name="video"
                size={21}
                color={headerIconColor}
                strokeWidth={2}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={handleAudioCall}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Icon
                name="phone"
                size={19}
                color={headerIconColor}
                strokeWidth={2}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => setShowMenu((prev) => !prev)}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Icon
                name="more-vertical"
                size={20}
                color={headerIconColor}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 3-Dots Dropdown Menu */}
      {showMenu && (
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <View style={styles.menuBackdrop}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.dropdownMenuCard,
                  {
                    top: topInset + 54,
                    backgroundColor: isDark ? '#242526' : '#FFFFFF',
                    borderColor: isDark ? '#3A3B3C' : '#E4E6EB',
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() =>
                    handleMenuOption('View contact', () => {
                      if (onViewContactDetails) {
                        onClose();
                        onViewContactDetails(contact);
                      }
                    })
                  }
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      { color: isDark ? '#E4E6EB' : '#050505' },
                    ]}
                  >
                    View contact
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuOption('Media, links, and docs')}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      { color: isDark ? '#E4E6EB' : '#050505' },
                    ]}
                  >
                    Media, links, and docs
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuOption('Search')}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      { color: isDark ? '#E4E6EB' : '#050505' },
                    ]}
                  >
                    Search
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuOption('Mute notifications')}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      { color: isDark ? '#E4E6EB' : '#050505' },
                    ]}
                  >
                    Mute notifications
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuOption('Disappearing messages')}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      { color: isDark ? '#E4E6EB' : '#050505' },
                    ]}
                  >
                    Disappearing messages
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuOption('Wallpaper')}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      { color: isDark ? '#E4E6EB' : '#050505' },
                    ]}
                  >
                    Wallpaper
                  </Text>
                </TouchableOpacity>

                {onBlockContact && (
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: isDark ? '#3A3B3C' : '#E4E6EB',
                        marginTop: 4,
                      },
                    ]}
                    onPress={() =>
                      handleMenuOption(
                        isBlocked ? 'Unblock contact' : 'Block contact',
                        () => onBlockContact(contact)
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.menuItemText,
                        { color: '#EF4444' },
                      ]}
                    >
                      {isBlocked ? 'Unblock contact' : 'Block contact'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Chat Messages Body with Keyboard Avoidance */}
      <KeyboardAvoidingView
        style={[styles.chatBodyContainer, { backgroundColor: chatBg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesListContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          onLayout={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
          ListHeaderComponent={
            <View style={styles.chatHeaderAnnouncements}>
              {/* App End-to-End Encryption Banner */}
              <View
                style={[
                  styles.encryptionBanner,
                  {
                    backgroundColor: isDark ? '#242526' : '#EBF2FE',
                    borderColor: isDark ? '#3A3B3C' : '#D0E1FD',
                  },
                ]}
              >
                <View style={styles.lockRow}>
                  <Icon name="lock" size={12} color={colors.primary} />
                  <Text
                    style={[
                      styles.encryptionText,
                      { color: isDark ? '#94A3B8' : '#1E60F2' },
                    ]}
                  >
                    Messages and calls are end-to-end encrypted. No one outside of this
                    chat can read or listen to them.
                  </Text>
                </View>
              </View>

              {/* Date Capsule: TODAY */}
              <View
                style={[
                  styles.datePill,
                  {
                    backgroundColor: isDark ? '#242526' : '#FFFFFF',
                    borderColor: isDark ? '#3A3B3C' : '#E2E8F0',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.datePillText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  TODAY
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.sender === 'me';
            return (
              <View
                style={[
                  styles.bubbleRow,
                  isMe ? styles.bubbleRowMe : styles.bubbleRowContact,
                ]}
              >
                <View
                  style={[
                    styles.bubbleContainer,
                    isMe
                      ? [styles.bubbleMe, { backgroundColor: myBubbleBg }]
                      : [
                        styles.bubbleContact,
                        {
                          backgroundColor: contactBubbleBg,
                          borderColor: contactBubbleBorder,
                          borderWidth: 1,
                        },
                      ],
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleMessageText,
                      { color: isMe ? '#FFFFFF' : bubbleTextColor },
                    ]}
                  >
                    {item.text}
                  </Text>
                  <View style={styles.bubbleFooterRow}>
                    <Text
                      style={[
                        styles.bubbleTimeText,
                        {
                          color: isMe
                            ? 'rgba(255,255,255,0.75)'
                            : bubbleTimeColor,
                        },
                      ]}
                    >
                      {item.time}
                    </Text>
                    {isMe && (
                      <View style={styles.bubbleCheckIcon}>
                        <Icon
                          name="double-check"
                          size={14}
                          color="#FFFFFF"
                          strokeWidth={2}
                        />
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />

        {/* WhatsApp Layout Bottom Input Bar with App Theme Colors */}
        <View
          style={[
            styles.bottomInputBar,
            { paddingBottom: isKeyboardVisible ? 0 : Math.max(bottomInset, 8) },
          ]}
        >
          {/* Main Pill Input Box */}
          <View
            style={[
              styles.inputPillBox,
              {
                backgroundColor: inputBg,
                borderColor: inputBorder,
              },
            ]}
          >
            {/* Smile Emoji Icon */}
            <TouchableOpacity
              style={styles.inputInnerBtn}
              activeOpacity={0.7}
              onPress={() => setInputText((prev) => prev + ' 😊')}
            >
              <Icon name="smile" size={22} color={iconColor} />
            </TouchableOpacity>

            {/* Text Input */}
            <TextInput
              style={[styles.textInput, { color: inputTextColor }]}
              placeholder="Message"
              placeholderTextColor={iconColor}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />

            {/* Paperclip Attachment */}
            <TouchableOpacity
              style={styles.inputInnerBtn}
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert('Share', 'Share photos, documents, or location')
              }
            >
              <Icon name="paperclip" size={20} color={iconColor} strokeWidth={2} />
            </TouchableOpacity>

            {/* Camera Icon (only when input is empty, exact WhatsApp behavior) */}
            {inputText.trim().length === 0 && (
              <TouchableOpacity
                style={styles.inputInnerBtn}
                activeOpacity={0.7}
                onPress={() => Alert.alert('Camera', 'Open Camera')}
              >
                <Icon name="camera" size={20} color={iconColor} strokeWidth={1.8} />
              </TouchableOpacity>
            )}
          </View>

          {/* Right Circular Send / Mic Button using app's primary color */}
          <TouchableOpacity
            style={[
              styles.circularActionButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => {
              if (inputText.trim().length > 0) {
                handleSend();
              } else {
                Alert.alert('Voice Note', 'Hold to record voice message');
              }
            }}
            activeOpacity={0.85}
          >
            {inputText.trim().length > 0 ? (
              <Icon name="send" size={18} color="#FFFFFF" strokeWidth={2} />
            ) : (
              <Icon name="mic" size={21} color="#FFFFFF" strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingRight: 6,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginLeft: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerInfoCol: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  headerNameText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  headerStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingRight: 4,
  },
  headerActionBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },
  dropdownMenuCard: {
    position: 'absolute',
    right: 12,
    width: 200,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 100,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chatBodyContainer: {
    flex: 1,
  },
  messagesListContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 14,
  },
  chatHeaderAnnouncements: {
    alignItems: 'center',
    marginBottom: 8,
  },
  encryptionBanner: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 12,
    maxWidth: '92%',
    alignSelf: 'center',
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  encryptionText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    marginBottom: 8,
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  bubbleRow: {
    marginVertical: 3,
    flexDirection: 'row',
  },
  bubbleRowMe: {
    justifyContent: 'flex-end',
  },
  bubbleRowContact: {
    justifyContent: 'flex-start',
  },
  bubbleContainer: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 7,
    borderRadius: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  bubbleMe: {
    borderTopRightRadius: 3,
  },
  bubbleContact: {
    borderTopLeftRadius: 3,
  },
  bubbleMessageText: {
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '400',
  },
  bubbleFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
    gap: 4,
  },
  bubbleTimeText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  bubbleCheckIcon: {
    marginLeft: 2,
  },
  bottomInputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  inputPillBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    marginRight: 8,
    marginBottom: 5,
    minHeight: 46,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 1.5,
  },
  inputInnerBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    paddingHorizontal: 6,
    paddingVertical: 4,
    maxHeight: 100,
  },
  circularActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.2,
    shadowRadius: 2.5,
  },
});
