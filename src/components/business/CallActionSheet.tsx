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
} from 'react-native';
import { Business } from '../../types/business';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from '../common/Icon';
import { BusinessAvatar } from '../common/BusinessAvatar';
import { LinkingService } from '../../services/linkingService';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { CATEGORY_COLORS } from '../../constants/categories';

interface CallActionSheetProps {
  visible: boolean;
  business: Business;
  onClose: () => void;
}

export const CallActionSheet: React.FC<CallActionSheetProps> = ({
  visible,
  business,
  onClose,
}) => {
  const { colors, isDark } = useTheme();

  const categoryColor = CATEGORY_COLORS[business.category] || colors.primary;
  const initials = business.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase();

  const handleDirectCall = () => {
    onClose();
    setTimeout(() => {
      LinkingService.makeCall(business.phone);
    }, 150);
  };

  const handleWhatsApp = () => {
    onClose();
    setTimeout(() => {
      LinkingService.openWhatsApp(
        business.phone,
        `Hello ${business.name}, I am contacting you from Business Contacts app.`
      );
    }, 150);
  };

  const handleCopyNumber = () => {
    onClose();
    Alert.alert('Phone Copied', `${business.phone} copied to clipboard.`);
  };

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
                styles.sheetContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                shadows.floating,
              ]}
            >
              {/* Top Handle Bar */}
              <View style={styles.handleContainer}>
                <View style={[styles.handle, { backgroundColor: colors.border }]} />
              </View>

              {/* Profile Card Info */}
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
                  <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
                    {business.name}
                  </Text>
                  <Text style={[styles.phoneNumber, { color: colors.primary }]}>
                    {business.phone}
                  </Text>
                  <Text style={[styles.locationText, { color: colors.textTertiary }]}>
                    {business.category} • {business.city}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Action Buttons Panel */}
              <View style={styles.optionsList}>
                {/* Voice Call Option */}
                <TouchableOpacity
                  style={[styles.optionItem, { backgroundColor: isDark ? '#052E16' : '#DCFCE7' }]}
                  onPress={handleDirectCall}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIconCircle, { backgroundColor: colors.call }]}>
                    <Icon name="phone" size={18} color="#FFFFFF" strokeWidth={2.2} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, { color: colors.call }]}>
                      Voice Call (Direct Dialer)
                    </Text>
                    <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                      Call {business.phone} using cellular network
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color={colors.call} strokeWidth={2} />
                </TouchableOpacity>

                {/* WhatsApp Chat & Call Option */}
                <TouchableOpacity
                  style={[styles.optionItem, { backgroundColor: isDark ? '#064E3B' : '#E8F5E9' }]}
                  onPress={handleWhatsApp}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIconCircle, { backgroundColor: '#25D366' }]}>
                    <Icon name="whatsapp" size={18} color="#FFFFFF" strokeWidth={2.2} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, { color: '#2E7D32' }]}>
                      WhatsApp Chat & Call
                    </Text>
                    <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                      Open direct conversation on WhatsApp
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#2E7D32" strokeWidth={2} />
                </TouchableOpacity>

                {/* Copy Number Option */}
                <TouchableOpacity
                  style={[styles.optionItem, { backgroundColor: colors.surfaceVariant }]}
                  onPress={handleCopyNumber}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIconCircle, { backgroundColor: colors.surface }]}>
                    <Icon name="copy" size={16} color={colors.text} strokeWidth={2} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                      Copy Phone Number
                    </Text>
                    <Text style={[styles.optionSubtitle, { color: colors.textTertiary }]}>
                      Save number to clipboard
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color={colors.textTertiary} strokeWidth={2} />
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
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: spacing.sm,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
  },
  avatarText: {
    ...typography.titleSmall,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  businessName: {
    ...typography.bodyLarge,
    fontWeight: '700',
    fontSize: 16,
  },
  phoneNumber: {
    ...typography.labelMedium,
    fontWeight: '700',
    marginTop: 2,
  },
  locationText: {
    ...typography.bodySmall,
    fontSize: 11,
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  optionsList: {
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    gap: spacing.md,
  },
  optionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...typography.bodyLarge,
    fontWeight: '700',
    fontSize: 14,
  },
  optionSubtitle: {
    ...typography.bodySmall,
    fontSize: 11,
    marginTop: 1,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xs,
  },
  cancelText: {
    ...typography.labelLarge,
    fontWeight: '700',
  },
});
