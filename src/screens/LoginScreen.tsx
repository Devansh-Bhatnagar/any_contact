import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../store/AuthContext';
import { AuthService, isValidEmailFormat } from '../services/authService';
import { AppLogo } from '../components/common/AppLogo';
import { Icon } from '../components/common/Icon';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { login, skipAuth } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot / Reset Password Modal state
  const [forgotVisible, setForgotVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const openForgotModal = () => {
    setResetEmail(email.trim());
    setResetToken('');
    setNewPassword('');
    setResetStep('request');
    setResetError(null);
    setForgotVisible(true);
  };

  const handleRequestReset = async () => {
    setResetError(null);
    try {
      setResetBusy(true);
      await AuthService.forgotPassword(resetEmail);
      setResetStep('confirm');
      Alert.alert(
        'Reset Email Sent',
        'If this email is registered, reset instructions have been sent. Paste your reset token below to set a new password.'
      );
    } catch (err: any) {
      setResetError(err?.message || 'Could not request password reset.');
    } finally {
      setResetBusy(false);
    }
  };

  const handleConfirmReset = async () => {
    setResetError(null);
    try {
      setResetBusy(true);
      await AuthService.resetPassword(resetToken, newPassword);
      setForgotVisible(false);
      Alert.alert(
        'Password Reset',
        'Your password has been updated. You can now sign in with your new password.'
      );
    } catch (err: any) {
      setResetError(err?.message || 'Invalid or expired reset token.');
    } finally {
      setResetBusy(false);
    }
  };

  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20
  );

  const handleLogin = async () => {
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address');
      return;
    }
    if (!isValidEmailFormat(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    setLoading(true);
    const result = await login(trimmedEmail, password);
    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Login failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPadding + 20, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Branding & Logo Header */}
        <View style={styles.header}>
          <AppLogo size={76} showShadow />
          <Text style={[styles.brandTitle, { color: colors.text }]}>Leads Phone Book</Text>
          <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
            Welcome back! Sign in to connect and call seamlessly.
          </Text>
        </View>

        {/* Error Alert Box */}
        {errorMessage ? (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                borderColor: '#EF4444',
              },
            ]}
          >
            <Icon name="info" size={18} color="#EF4444" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Input Fields Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }, shadows.card]}>
          {/* Email Field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.border,
                },
              ]}
            >
              <Icon name="mail" size={20} color={colors.textTertiary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="name@example.com"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
              <TouchableOpacity
                onPress={openForgotModal}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.forgotLink, { color: colors.primary }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.border,
                },
              ]}
            >
              <Icon name="lock" size={20} color={colors.textTertiary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter your password"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Sign In</Text>
                <Icon name="arrow-right" size={18} color="#FFFFFF" strokeWidth={2.4} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider / Guest Option */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
          <Text style={[styles.dividerText, { color: colors.textTertiary }]}>OR</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
        </View>

        {/* Guest / Skip Option */}
        <TouchableOpacity
          style={[
            styles.guestButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={skipAuth}
          activeOpacity={0.7}
        >
          <Icon name="user" size={18} color={colors.primary} />
          <Text style={[styles.guestButtonText, { color: colors.text }]}>
            Continue as Guest / Skip
          </Text>
        </TouchableOpacity>

        {/* Footer: Signup Link */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.footerLink, { color: colors.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Forgot / Reset Password Modal */}
      <Modal
        visible={forgotVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark ? '#242526' : colors.surface,
                borderColor: isDark ? '#3A3B3C' : colors.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {resetStep === 'request' ? 'Forgot Password' : 'Reset Password'}
              </Text>
              <TouchableOpacity onPress={() => setForgotVisible(false)}>
                <Icon name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              {resetStep === 'request'
                ? 'Enter your account email to receive a password reset token.'
                : 'Enter the reset token from your email and choose a new password (min 8 chars).'}
            </Text>

            {resetError ? (
              <Text style={styles.modalError}>{resetError}</Text>
            ) : null}

            {resetStep === 'request' ? (
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: colors.text,
                    borderColor: isDark ? '#3A3B3C' : colors.border,
                    backgroundColor: isDark ? '#1C1E21' : colors.surfaceVariant,
                  },
                ]}
                placeholder="name@example.com"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={resetEmail}
                onChangeText={setResetEmail}
              />
            ) : (
              <>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      color: colors.text,
                      borderColor: isDark ? '#3A3B3C' : colors.border,
                      backgroundColor: isDark ? '#1C1E21' : colors.surfaceVariant,
                    },
                  ]}
                  placeholder="Paste reset token"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  value={resetToken}
                  onChangeText={setResetToken}
                />
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      color: colors.text,
                      borderColor: isDark ? '#3A3B3C' : colors.border,
                      backgroundColor: isDark ? '#1C1E21' : colors.surfaceVariant,
                    },
                  ]}
                  placeholder="New password (8+ characters)"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </>
            )}

            <View style={styles.modalActions}>
              {resetStep === 'confirm' ? (
                <TouchableOpacity onPress={() => setResetStep('request')}>
                  <Text style={[styles.modalSwitchLink, { color: colors.primary }]}>
                    Resend email
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setResetStep('confirm')}>
                  <Text style={[styles.modalSwitchLink, { color: colors.primary }]}>
                    Have a token?
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.modalSubmitBtn,
                  { backgroundColor: colors.primary, opacity: resetBusy ? 0.7 : 1 },
                ]}
                disabled={resetBusy}
                onPress={
                  resetStep === 'request' ? handleRequestReset : handleConfirmReset
                }
              >
                {resetBusy ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>
                    {resetStep === 'request' ? 'Send Reset Link' : 'Update Password'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    alignItems: 'stretch',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  brandTitle: {
    ...typography.titleLarge,
    fontWeight: '800',
    fontSize: 26,
    marginTop: spacing.md,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    ...typography.bodyMedium,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.bodyMedium,
    color: '#EF4444',
    flex: 1,
    fontWeight: '500',
  },
  card: {
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.labelMedium,
    fontWeight: '600',
    fontSize: 13,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 52,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.bodyLarge,
    fontSize: 15,
    paddingVertical: 0,
  },
  primaryButton: {
    height: 52,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    elevation: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...typography.labelSmall,
    fontWeight: '700',
  },
  guestButton: {
    height: 50,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  guestButtonText: {
    ...typography.labelLarge,
    fontWeight: '600',
    fontSize: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  footerText: {
    ...typography.bodyMedium,
  },
  footerLink: {
    ...typography.bodyMedium,
    fontWeight: '700',
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalError: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  modalInput: {
    height: 46,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  modalSwitchLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    height: 42,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
