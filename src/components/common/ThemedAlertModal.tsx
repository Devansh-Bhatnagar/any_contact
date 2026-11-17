import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from './Icon';

export interface ThemedAlertModalProps {
  visible: boolean;
  title?: string;
  message: string;
  spokenText?: string;
  buttonText?: string;
  onClose: () => void;
}

export const ThemedAlertModal: React.FC<ThemedAlertModalProps> = ({
  visible,
  title = 'No Contact Found',
  message = 'no contact found with this name',
  spokenText,
  buttonText = 'Okay',
  onClose,
}) => {
  const { isDark, colors } = useTheme();

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim,
                },
              ]}
            >
              {/* Top Warning / Alert Icon Circle */}
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(239, 68, 68, 0.16)'
                      : '#FEE2E2',
                  },
                ]}
              >
                <Icon name="phone-off" size={26} color="#EF4444" strokeWidth={2.4} />
              </View>

              {/* Title */}
              <Text
                style={[
                  styles.title,
                  { color: isDark ? '#F8FAFC' : '#0F172A' },
                ]}
              >
                {title}
              </Text>

              {/* Message */}
              <Text
                style={[
                  styles.message,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                {message}
              </Text>

              {/* Spoken Text Pill (if available) */}
              {spokenText ? (
                <View
                  style={[
                    styles.spokenBadge,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                    },
                  ]}
                >
                  <Icon
                    name="mic"
                    size={13}
                    color={colors.primary || '#1E60F2'}
                    strokeWidth={2.2}
                  />
                  <Text
                    style={[
                      styles.spokenLabel,
                      { color: isDark ? '#64748B' : '#94A3B8' },
                    ]}
                  >
                    You said:
                  </Text>
                  <Text
                    style={[
                      styles.spokenQuery,
                      { color: isDark ? '#E2E8F0' : '#1E293B' },
                    ]}
                    numberOfLines={1}
                  >
                    “{spokenText}”
                  </Text>
                </View>
              ) : null}

              {/* Action Button matching app theme */}
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: colors.primary || '#1E60F2',
                    shadowColor: colors.primary || '#1E60F2',
                  },
                ]}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>{buttonText}</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 14,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
    marginTop: 6,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  spokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: '90%',
  },
  spokenLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  spokenQuery: {
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  button: {
    width: '100%',
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
