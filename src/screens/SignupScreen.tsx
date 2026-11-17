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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../store/AuthContext';
import { isValidEmailFormat } from '../services/authService';
import { AppLogo } from '../components/common/AppLogo';
import { Icon } from '../components/common/Icon';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export const SignupScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { register } = useAuth();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20
  );

  const handleRegister = async () => {
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address');
      return;
    }
    if (!isValidEmailFormat(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (!password) {
      setErrorMessage('Please create a password');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await register(trimmedName, trimmedEmail, password, trimmedPhone || undefined);
    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Registration failed. Please try again.');
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
          { paddingTop: topPadding + 10, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>

        {/* Branding & Header */}
        <View style={styles.header}>
          <AppLogo size={64} showShadow />
          <Text style={[styles.brandTitle, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
            Join Leads Phone Book to connect, discover businesses, and call effortlessly.
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
            <View style={{ flex: 1 }}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              {errorMessage.toLowerCase().includes('already registered') && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  style={{ marginTop: 4 }}
                >
                  <Text style={[styles.errorLink, { color: colors.primary }]}>
                    Click here to Sign In →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : null}

        {/* Form Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }, shadows.card]}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.border,
                },
              ]}
            >
              <Icon name="user" size={18} color={colors.textTertiary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email Address */}
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
              <Icon name="mail" size={18} color={colors.textTertiary} />
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

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number (Optional)</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.border,
                },
              ]}
            >
              <Icon name="phone" size={18} color={colors.textTertiary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.textTertiary}
                value={phone}
                onChangeText={(val) => {
                  setPhone(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.border,
                },
              ]}
            >
              <Icon name="lock" size={18} color={colors.textTertiary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="At least 8 characters (min 6 local)"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm Password</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.border,
                },
              ]}
            >
              <Icon name="lock" size={18} color={colors.textTertiary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Re-enter your password"
                placeholderTextColor={colors.textTertiary}
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Create Account</Text>
                <Icon name="arrow-right" size={18} color="#FFFFFF" strokeWidth={2.4} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer: Sign In Link */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.footerLink, { color: colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandTitle: {
    ...typography.titleLarge,
    fontWeight: '800',
    fontSize: 24,
    marginTop: spacing.sm,
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
  errorLink: {
    ...typography.bodyMedium,
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  inputGroup: {
    gap: 5,
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
    height: 50,
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
    marginTop: spacing.sm,
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    ...typography.bodyMedium,
  },
  footerLink: {
    ...typography.bodyMedium,
    fontWeight: '700',
  },
});
