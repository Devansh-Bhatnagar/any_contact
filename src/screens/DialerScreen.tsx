import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { Icon } from '../components/common/Icon';
import { usePhoneBook } from '../store/PhoneBookContext';
import { PhoneBookContact } from '../types/phoneBook';
import { CallScreenModal } from '../components/phonebook/CallScreenModal';

interface KeyDef {
  digit: string;
  sub: string;
}

const KEYS: KeyDef[] = [
  { digit: '1', sub: ' ' },
  { digit: '2', sub: 'ABC' },
  { digit: '3', sub: 'DEF' },
  { digit: '4', sub: 'GHI' },
  { digit: '5', sub: 'JKL' },
  { digit: '6', sub: 'MNO' },
  { digit: '7', sub: 'PQRS' },
  { digit: '8', sub: 'TUV' },
  { digit: '9', sub: 'WXYZ' },
  { digit: '*', sub: ' ' },
  { digit: '0', sub: '+' },
  { digit: '#', sub: ' ' },
];

export const DialerScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { contacts, recordContactView } = usePhoneBook();

  const [dialed, setDialed] = useState<string>('');
  const [callingContact, setCallingContact] = useState<PhoneBookContact | null>(null);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 16
  );

  // Key press
  const handleDigitPress = (digit: string) => {
    if (dialed.length < 18) {
      setDialed((prev) => prev + digit);
    }
  };

  // Long press on 0 gives '+'
  const handleDigitLongPress = (digit: string) => {
    if (digit === '0') {
      setDialed((prev) => prev + '+');
    }
  };

  // Backspace
  const handleBackspace = () => {
    setDialed((prev) => prev.slice(0, -1));
  };

  const handleClearAll = () => {
    setDialed('');
  };

  // Live matching contact search
  const matchedContacts = useMemo(() => {
    if (!dialed.trim() || dialed.length < 2) return [];
    const cleanDialed = dialed.replace(/[^0-9]/g, '');
    return contacts
      .filter((c) => {
        const cleanPhone = c.primaryPhone.replace(/[^0-9]/g, '');
        return cleanPhone.includes(cleanDialed);
      })
      .slice(0, 3);
  }, [dialed, contacts]);

  // Handle call initiation
  const handleStartCall = () => {
    if (!dialed.trim()) {
      Alert.alert('Enter Number', 'Please enter a phone number to call.');
      return;
    }

    const matched = matchedContacts.length > 0 ? matchedContacts[0] : null;
    const contactToCall: PhoneBookContact = matched || {
      id: `dialed-${Date.now()}`,
      name: dialed,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&q=80',
      primaryPhone: dialed,
      phoneNumbers: [{ label: 'Mobile', number: dialed }],
      email: '',
      hasApp: false,
    };

    recordContactView(contactToCall);
    setCallingContact(contactToCall);
  };

  // Format dialed number visually
  const formatDisplayNumber = (num: string) => {
    if (num.length <= 5) return num;
    if (num.length <= 10) {
      return `${num.slice(0, 5)} ${num.slice(5)}`;
    }
    return `${num.slice(0, 4)} ${num.slice(4, 9)} ${num.slice(9)}`;
  };

  // Theme colors
  const bgColor = isDark ? '#18191A' : '#FFFFFF';
  const textColor = isDark ? '#E4E6EB' : '#0F172A';
  const subTextColor = isDark ? '#94A3B8' : '#64748B';
  const keyBg = isDark ? '#242526' : '#F0F2F5';
  const headerBorder = isDark ? '#2E2F30' : '#E4E6EB';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Screen Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset + 4,
            borderBottomColor: headerBorder,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: textColor }]}>
          Keypad
        </Text>
      </View>

      <View style={styles.mainContainer}>
        {/* Top Display Area */}
        <View style={styles.topDisplaySection}>
          {/* Matched Contacts Horizontal Carousel */}
          {matchedContacts.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.matchedScrollContent}
              style={styles.matchedScrollView}
            >
              {matchedContacts.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.matchedContactPill,
                    {
                      backgroundColor: isDark ? '#242526' : '#F0F2F5',
                      borderColor: isDark ? '#3A3B3C' : '#E4E6EB',
                    },
                  ]}
                  onPress={() => setDialed(c.primaryPhone)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: c.avatar }} style={styles.matchedAvatar} />
                  <View style={styles.matchedInfo}>
                    <Text
                      style={[styles.matchedName, { color: textColor }]}
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                    <Text style={[styles.matchedPhone, { color: subTextColor }]}>
                      {c.primaryPhone}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Dialed Number Display */}
          <View style={styles.numberDisplayWrap}>
            {dialed ? (
              <Text
                style={[styles.dialedNumberText, { color: textColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatDisplayNumber(dialed)}
              </Text>
            ) : (
              <Text style={[styles.placeholderText, { color: subTextColor }]}>
                Tap numbers to dial
              </Text>
            )}

            {/* Quick Action: Add to Contacts */}
            {dialed.length >= 3 && matchedContacts.length === 0 && (
              <TouchableOpacity
                style={[
                  styles.addContactBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(30, 96, 242, 0.16)'
                      : '#EBF2FE',
                  },
                ]}
                onPress={() =>
                  Alert.alert(
                    'Add Contact',
                    `Save ${dialed} as a new contact?`
                  )
                }
                activeOpacity={0.7}
              >
                <Icon name="plus" size={13} color={colors.primary} strokeWidth={2.5} />
                <Text style={[styles.addContactText, { color: colors.primary }]}>
                  Add to Contacts
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Circular Keypad Grid (Standard Phone Proportions) */}
        <View style={styles.keypadWrapper}>
          <View style={styles.gridContainer}>
            {KEYS.map((k) => (
              <TouchableOpacity
                key={k.digit}
                style={[
                  styles.keyCircle,
                  {
                    backgroundColor: keyBg,
                  },
                ]}
                onPress={() => handleDigitPress(k.digit)}
                onLongPress={() => handleDigitLongPress(k.digit)}
                delayLongPress={350}
                activeOpacity={0.5}
              >
                <Text
                  style={[
                    styles.digitText,
                    {
                      color: textColor,
                      fontSize: k.digit === '*' || k.digit === '#' ? 28 : 29,
                      marginTop: k.digit === '*' ? 6 : 0,
                    },
                  ]}
                >
                  {k.digit}
                </Text>
                {k.sub.trim().length > 0 ? (
                  <Text style={[styles.subText, { color: subTextColor }]}>
                    {k.sub}
                  </Text>
                ) : (
                  <View style={styles.subTextSpacer} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom Action Row: Call Button & Backspace */}
          <View style={styles.bottomControlRow}>
            {/* Left Balance Spacer */}
            <View style={styles.sideControlBtn} />

            {/* Theme Circular Call Button */}
            <TouchableOpacity
              style={[
                styles.callButton,
                { backgroundColor: colors.primary, shadowColor: colors.primary },
              ]}
              onPress={handleStartCall}
              activeOpacity={0.8}
            >
              <Icon name="phone" size={30} color="#FFFFFF" strokeWidth={2.2} />
            </TouchableOpacity>

            {/* Right Backspace Button */}
            <View style={styles.sideControlBtn}>
              {dialed.length > 0 && (
                <TouchableOpacity
                  style={styles.backspaceBtn}
                  onPress={handleBackspace}
                  onLongPress={handleClearAll}
                  delayLongPress={450}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.6}
                >
                  <Icon
                    name="backspace"
                    size={28}
                    color={subTextColor}
                    strokeWidth={1.8}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Screen In-Call Modal */}
      {callingContact && (
        <CallScreenModal
          visible={!!callingContact}
          contact={callingContact}
          onClose={() => setCallingContact(null)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  topDisplaySection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: 120,
  },
  matchedScrollView: {
    maxHeight: 52,
    marginBottom: 8,
  },
  matchedScrollContent: {
    gap: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  matchedContactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
  },
  matchedAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  matchedInfo: {
    justifyContent: 'center',
  },
  matchedName: {
    fontSize: 13,
    fontWeight: '700',
  },
  matchedPhone: {
    fontSize: 11,
  },
  numberDisplayWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  dialedNumberText: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  addContactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  addContactText: {
    fontSize: 13,
    fontWeight: '700',
  },
  keypadWrapper: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  gridContainer: {
    width: 280,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  keyCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  digitText: {
    fontWeight: '500',
    lineHeight: 32,
  },
  subText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: -2,
    textTransform: 'uppercase',
  },
  subTextSpacer: {
    height: 10,
  },
  bottomControlRow: {
    width: 280,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  sideControlBtn: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  backspaceBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
