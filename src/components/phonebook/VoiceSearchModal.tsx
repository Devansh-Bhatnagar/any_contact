import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { PhoneBookContact } from '../../types/phoneBook';
import { Icon } from '../common/Icon';
import {
  findContactForVoiceQuery,
  isVoiceRecognitionAvailable,
  startNativeSpeechRecognition,
  VoiceCallSearchResult,
} from '../../services/voiceSearchService';
import { useTheme } from '../../hooks/useTheme';

interface VoiceSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onCallContact: (contact: PhoneBookContact) => void;
  contacts: PhoneBookContact[];
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  visible,
  onClose,
  onCallContact,
  contacts,
}) => {
  const { isDark } = useTheme();

  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [matchedResult, setMatchedResult] = useState<VoiceCallSearchResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Pulsing ring animations
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const opacityAnim1 = useRef(new Animated.Value(0.7)).current;
  const opacityAnim2 = useRef(new Animated.Value(0.4)).current;

  // Soundwave bars animation
  const barAnim1 = useRef(new Animated.Value(12)).current;
  const barAnim2 = useRef(new Animated.Value(24)).current;
  const barAnim3 = useRef(new Animated.Value(16)).current;
  const barAnim4 = useRef(new Animated.Value(28)).current;
  const barAnim5 = useRef(new Animated.Value(14)).current;

  // Auto trigger ref to prevent double triggers
  const hasTriggeredCallRef = useRef(false);

  // Pulse animation loop
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    let waveLoop: Animated.CompositeAnimation | null = null;

    if (visible && isListening) {
      pulseLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim1, {
              toValue: 1.45,
              duration: 1200,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim1, {
              toValue: 1,
              duration: 1200,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(opacityAnim1, {
              toValue: 0.15,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim1, {
              toValue: 0.6,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseAnim2, {
              toValue: 1.7,
              duration: 1400,
              delay: 300,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim2, {
              toValue: 1,
              duration: 1400,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulseLoop.start();

      // Soundwave bars loop
      const createBarAnim = (anim: Animated.Value, maxH: number, minH: number, dur: number) => {
        return Animated.sequence([
          Animated.timing(anim, {
            toValue: maxH,
            duration: dur,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: minH,
            duration: dur,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
        ]);
      };

      waveLoop = Animated.loop(
        Animated.parallel([
          createBarAnim(barAnim1, 32, 10, 320),
          createBarAnim(barAnim2, 42, 14, 280),
          createBarAnim(barAnim3, 36, 8, 350),
          createBarAnim(barAnim4, 48, 12, 260),
          createBarAnim(barAnim5, 30, 9, 310),
        ])
      );
      waveLoop.start();
    } else {
      pulseAnim1.setValue(1);
      pulseAnim2.setValue(1);
      opacityAnim1.setValue(0.7);
      opacityAnim2.setValue(0.4);
    }

    return () => {
      pulseLoop?.stop();
      waveLoop?.stop();
    };
  }, [visible, isListening]);

  // Handle Voice Recognition Start
  const startListening = async () => {
    setIsListening(true);
    setTranscribedText('');
    setMatchedResult(null);
    setErrorMessage('');
    hasTriggeredCallRef.current = false;

    try {
      if (isVoiceRecognitionAvailable()) {
        const spoken = await startNativeSpeechRecognition("Say 'Call Aarav Sharma' or any contact/business");
        if (spoken) {
          handleSpokenText(spoken);
        }
      } else {
        // Fallback for emulator without Google TTS or test environment
        setTranscribedText('Listening for command...');
      }
    } catch (err: any) {
      setIsListening(false);
      const errMsg = err?.message || '';
      if (errMsg.includes('CANCELLED') || err?.code === 'CANCELLED') {
        setErrorMessage('Speech cancelled. Tap mic to try again or tap a suggestion.');
      } else {
        setErrorMessage('Could not recognize voice. Tap below to speak again.');
      }
    }
  };

  // Process spoken speech text
  const handleSpokenText = (text: string) => {
    setIsListening(false);
    setTranscribedText(text);

    const result = findContactForVoiceQuery(text, contacts);

    if (result) {
      setMatchedResult(result);
      setErrorMessage('');

      // Auto trigger call after brief 400ms visual feedback
      if (!hasTriggeredCallRef.current) {
        hasTriggeredCallRef.current = true;
        setTimeout(() => {
          onClose();
          setTimeout(() => {
            onCallContact(result.contact);
          }, 150);
        }, 550);
      }
    } else {
      setMatchedResult(null);
      setErrorMessage(`No contact or business found for "${text}". Try saying "Call Aarav Sharma" or "Call Fortis".`);
    }
  };

  // Quick suggestion chips
  const handleChipPress = (cmd: string) => {
    handleSpokenText(cmd);
  };

  // Start listening on open
  useEffect(() => {
    if (visible) {
      startListening();
    } else {
      setIsListening(false);
      setTranscribedText('');
      setMatchedResult(null);
      setErrorMessage('');
      hasTriggeredCallRef.current = false;
    }
  }, [visible]);

  if (!visible) return null;

  const quickSuggestions = [
    'Call Aarav Sharma',
    'Call Naresh',
    'Call Fortis Hospital',
    'Call Ambulance',
    'Call Police',
    'Call Jawed Habib',
    'Call Max Hospital',
    'Call Pooja',
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheetContainer,
            { backgroundColor: isDark ? '#1C1D1F' : '#FFFFFF' },
          ]}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.dragHandle} />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon
                name="close"
                size={20}
                color={isDark ? '#9CA3AF' : '#6B7280'}
                strokeWidth={2.4}
              />
            </TouchableOpacity>
          </View>

          {/* Title & Subtitle */}
          <View style={styles.titleArea}>
            <Text style={[styles.title, { color: isDark ? '#F3F4F6' : '#111827' }]}>
              Voice Call Assistant
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Speak like "Call Aarav Sharma" or any business/contact
            </Text>
          </View>

          {/* Central Pulsing Microphone Button */}
          <View style={styles.micCenterWrap}>
            {/* Outer animated ripple 2 */}
            <Animated.View
              style={[
                styles.pulseRing,
                styles.pulseRing2,
                {
                  transform: [{ scale: pulseAnim2 }],
                  opacity: isListening ? opacityAnim2 : 0,
                },
              ]}
            />
            {/* Outer animated ripple 1 */}
            <Animated.View
              style={[
                styles.pulseRing,
                styles.pulseRing1,
                {
                  transform: [{ scale: pulseAnim1 }],
                  opacity: isListening ? opacityAnim1 : 0,
                },
              ]}
            />

            {/* Main Mic Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.micButton,
                { backgroundColor: isListening ? '#0A5C43' : '#10B981' },
              ]}
              onPress={startListening}
            >
              <Icon name="mic" size={38} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Audio Wave Visualizer Bars */}
          {isListening && (
            <View style={styles.waveBarContainer}>
              <Animated.View style={[styles.waveBar, { height: barAnim1 }]} />
              <Animated.View style={[styles.waveBar, { height: barAnim2 }]} />
              <Animated.View style={[styles.waveBar, { height: barAnim3 }]} />
              <Animated.View style={[styles.waveBar, { height: barAnim4 }]} />
              <Animated.View style={[styles.waveBar, { height: barAnim5 }]} />
            </View>
          )}

          {/* Transcribed Text & Status */}
          <View style={styles.statusBox}>
            {isListening && (
              <View style={styles.listeningBadge}>
                <View style={styles.recordingDot} />
                <Text style={styles.listeningText}>Listening... Speak now</Text>
              </View>
            )}

            {transcribedText ? (
              <View style={styles.spokenQuoteBox}>
                <Text style={[styles.spokenQuote, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>
                  “{transcribedText}”
                </Text>
              </View>
            ) : null}

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
          </View>

          {/* Matched Contact Preview Card */}
          {matchedResult && (
            <View
              style={[
                styles.matchedCard,
                {
                  backgroundColor: isDark ? '#242526' : '#F0FDF4',
                  borderColor: '#10B981',
                },
              ]}
            >
              <View style={styles.matchedAvatarWrap}>
                {matchedResult.contact.avatar ? (
                  <Image
                    source={{ uri: matchedResult.contact.avatar }}
                    style={styles.matchedAvatar}
                  />
                ) : (
                  <View style={styles.matchedAvatarFallback}>
                    <Text style={styles.matchedAvatarLetter}>
                      {matchedResult.contact.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.matchedInfo}>
                <Text
                  style={[styles.matchedName, { color: isDark ? '#FFFFFF' : '#111827' }]}
                  numberOfLines={1}
                >
                  {matchedResult.contact.name}
                </Text>
                <Text style={styles.matchedPhone}>
                  {matchedResult.contact.primaryPhone}
                </Text>
                <View style={styles.sourceTag}>
                  <Text style={styles.sourceTagText}>
                    {matchedResult.source === 'my-contact'
                      ? '👤 My Contacts'
                      : matchedResult.source === 'emergency'
                        ? '🚨 Emergency Service'
                        : `🏢 ${matchedResult.contact.category || 'Business'}`}
                  </Text>
                </View>
              </View>

              <View style={styles.callingBadge}>
                <Icon name="phone" size={16} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.callingBadgeText}>Calling...</Text>
              </View>
            </View>
          )}

          {/* Quick Suggestions Rail */}
          <View style={styles.suggestionsSection}>
            <Text
              style={[
                styles.suggestionsHeader,
                { color: isDark ? '#9CA3AF' : '#6B7280' },
              ]}
            >
              Or tap a quick command:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {quickSuggestions.map((suggestion, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isDark ? '#2D3034' : '#F3F4F6',
                      borderColor: isDark ? '#3E4247' : '#E5E7EB',
                    },
                  ]}
                  onPress={() => handleChipPress(suggestion)}
                >
                  <Icon
                    name="phone"
                    size={12}
                    color="#0A5C43"
                    strokeWidth={2.2}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      { color: isDark ? '#E5E7EB' : '#374151' },
                    ]}
                  >
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  sheetHeader: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 4,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    opacity: 0.5,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 6,
  },
  titleArea: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  micCenterWrap: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: 999,
  },
  pulseRing1: {
    width: 106,
    height: 106,
    backgroundColor: '#10B981',
  },
  pulseRing2: {
    width: 130,
    height: 130,
    backgroundColor: '#34D399',
  },
  micButton: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A5C43',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  waveBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 50,
    marginTop: 4,
  },
  waveBar: {
    width: 5,
    backgroundColor: '#0A5C43',
    borderRadius: 3,
  },
  statusBox: {
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    marginVertical: 6,
    paddingHorizontal: 16,
  },
  listeningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  listeningText: {
    color: '#0A5C43',
    fontSize: 13,
    fontWeight: '700',
  },
  spokenQuoteBox: {
    marginTop: 6,
  },
  spokenQuote: {
    fontSize: 17,
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  matchedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    marginVertical: 10,
  },
  matchedAvatarWrap: {
    marginRight: 12,
  },
  matchedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  matchedAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0A5C43',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchedAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  matchedInfo: {
    flex: 1,
  },
  matchedName: {
    fontSize: 16,
    fontWeight: '700',
  },
  matchedPhone: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  sourceTag: {
    marginTop: 4,
  },
  sourceTagText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  callingBadge: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  callingBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  suggestionsSection: {
    width: '100%',
    marginTop: 10,
  },
  suggestionsHeader: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  chipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
