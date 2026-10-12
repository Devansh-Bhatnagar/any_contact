import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Business } from '../../types/business';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from '../common/Icon';
import { BusinessAvatar } from '../common/BusinessAvatar';
import { LinkingService } from '../../services/linkingService';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { CATEGORY_COLORS } from '../../constants/categories';

interface MessageActionSheetProps {
  visible: boolean;
  business: Business;
  onClose: () => void;
}

const MESSAGE_TEMPLATES = [
  'Hi! I would like to inquire about your timings and services.',
  'Hello, are you open today? Looking forward to visiting.',
  'Hi, please share your pricing, catalog or appointment details.',
  'Hi, I saw your business on Business Contacts app and had a quick question.',
];

export const MessageActionSheet: React.FC<MessageActionSheetProps> = ({
  visible,
  business,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const [messageText, setMessageText] = useState(MESSAGE_TEMPLATES[0]);

  const categoryColor = CATEGORY_COLORS[business.category] || colors.primary;
  const initials = business.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase();

  const handleSendSMS = () => {
    onClose();
    setTimeout(() => {
      LinkingService.sendMessage(business.phone, messageText);
    }, 150);
  };

  const handleSendWhatsApp = () => {
    onClose();
    setTimeout(() => {
      LinkingService.openWhatsApp(business.phone, messageText);
    }, 150);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.sheetContainer,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  shadows.floating,
                ]}
              >
                {/* Handle Bar */}
                <View style={styles.handleContainer}>
                  <View style={[styles.handle, { backgroundColor: colors.border }]} />
                </View>

                {/* Profile Header */}
                <View style={styles.profileRow}>
                  <View
                    style={[
                      styles.avatarBox,
                      { backgroundColor: `${categoryColor}18`, borderColor: categoryColor, overflow: 'hidden' },
                    ]}
                  >
                    <BusinessAvatar
                      image={business.image}
                      category={business.category}
                      name={business.name}
                      size={52}
                      style={styles.avatarImage}
                      fallbackColor={categoryColor}
                    />
                  </View>

                  <View style={styles.profileInfo}>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                      Message {business.name}
                    </Text>
                    <Text style={[styles.subText, { color: colors.textSecondary }]}>
                      To: {business.phone}
                    </Text>
                  </View>
                </View>

                {/* Quick Template Chips */}
                <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
                  QUICK TEMPLATES
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.templatesScroll}
                >
                  {MESSAGE_TEMPLATES.map((tmpl, idx) => {
                    const isSelected = messageText === tmpl;
                    return (
                      <TouchableOpacity
                        key={`msg-tmpl-${idx}`}
                        style={[
                          styles.templateChip,
                          {
                            backgroundColor: isSelected
                              ? colors.primaryLight
                              : colors.surfaceVariant,
                            borderColor: isSelected ? colors.primary : 'transparent',
                          },
                        ]}
                        onPress={() => setMessageText(tmpl)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.templateText,
                            { color: isSelected ? colors.primary : colors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {tmpl}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Message Input Box */}
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: colors.searchBackground,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    value={messageText}
                    onChangeText={setMessageText}
                    multiline
                    numberOfLines={3}
                    placeholder="Type your message here..."
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>

                {/* Send Actions Row */}
                <View style={styles.actionButtonsContainer}>
                  {/* WhatsApp Direct */}
                  <TouchableOpacity
                    style={[styles.sendButton, { backgroundColor: '#25D366' }]}
                    onPress={handleSendWhatsApp}
                    activeOpacity={0.8}
                  >
                    <Icon name="whatsapp" size={18} color="#FFFFFF" strokeWidth={2.2} />
                    <Text style={styles.sendButtonText}>Send WhatsApp</Text>
                  </TouchableOpacity>

                  {/* SMS Direct */}
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      { backgroundColor: isDark ? '#1E293B' : colors.primaryLight },
                    ]}
                    onPress={handleSendSMS}
                    activeOpacity={0.8}
                  >
                    <Icon name="message" size={18} color={colors.primary} strokeWidth={2.2} />
                    <Text style={[styles.sendButtonText, { color: colors.primary }]}>
                      Send SMS
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Cancel Button */}
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.surfaceVariant }]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
  },
  avatarText: {
    ...typography.titleSmall,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  title: {
    ...typography.bodyLarge,
    fontWeight: '700',
    fontSize: 16,
  },
  subText: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  sectionLabel: {
    ...typography.labelSmall,
    letterSpacing: 0.8,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  templatesScroll: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  templateChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    maxWidth: 240,
  },
  templateText: {
    ...typography.bodySmall,
    fontSize: 12,
  },
  inputContainer: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.sm,
    marginVertical: spacing.sm,
    minHeight: 70,
  },
  textInput: {
    ...typography.bodyMedium,
    textAlignVertical: 'top',
    padding: 0,
    minHeight: 60,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  sendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
  },
  sendButtonText: {
    ...typography.labelLarge,
    fontWeight: '700',
    color: '#FFFFFF',
    fontSize: 13,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  cancelText: {
    ...typography.labelLarge,
    fontWeight: '700',
  },
});
