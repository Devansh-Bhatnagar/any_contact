import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhoneBookContact } from '../../types/phoneBook';
import { Icon } from '../common/Icon';
import { InCallDialpadModal } from './InCallDialpadModal';

export type CallStage =
  | 'trying' // Screen 3: Trying App Call
  | 'app_connected' // Screen 4A: App Call Connected
  | 'not_available' // Screen 4B: App Not Available dialog
  | 'normal_connected'; // Screen 5: Normal Phone Call

interface CallScreenModalProps {
  visible: boolean;
  contact: PhoneBookContact;
  onClose: () => void;
}

export const CallScreenModal: React.FC<CallScreenModalProps> = ({
  visible,
  contact,
  onClose,
}) => {
  const [stage, setStage] = useState<CallStage>('trying');
  const [forceAppAvailable, setForceAppAvailable] = useState<boolean | null>(null);

  // In-call toggles
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaker, setIsSpeaker] = useState<boolean>(false);
  const [isOnHold, setIsOnHold] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [showKeypad, setShowKeypad] = useState<boolean>(false);

  // Timer
  const [callSeconds, setCallSeconds] = useState<number>(0);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Determine availability: manual toggle overrides default contact.hasApp
  const effectiveAppAvailable =
    forceAppAvailable !== null ? forceAppAvailable : contact.hasApp;

  // Reset state when opened
  useEffect(() => {
    if (visible) {
      setStage('trying');
      setCallSeconds(0);
      setIsMuted(false);
      setIsSpeaker(false);
      setIsOnHold(false);
      setIsRecording(false);
      setShowKeypad(false);
    }
  }, [visible]);

  // Pulse animation for Screen 3 connecting
  useEffect(() => {
    if (!visible || stage !== 'trying') return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const spin = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulse.start();
    spin.start();

    // After 2.5s simulated connection attempt
    const timer = setTimeout(() => {
      if (effectiveAppAvailable) {
        setStage('app_connected');
      } else {
        setStage('not_available');
      }
    }, 2400);

    return () => {
      pulse.stop();
      spin.stop();
      clearTimeout(timer);
    };
  }, [visible, stage, effectiveAppAvailable, pulseAnim, rotateAnim]);

  // Timer counter for connected states
  useEffect(() => {
    if (!visible) return;
    if (stage !== 'app_connected' && stage !== 'normal_connected') return;
    if (isOnHold) return;

    const interval = setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, stage, isOnHold]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleEndCall = () => {
    onClose();
  };

  const handleContinueNormalCall = () => {
    setCallSeconds(0);
    setStage('normal_connected');
  };

  const spinInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? 28 : 20);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 34);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={handleEndCall}
    >
      <View style={styles.container}>
        {/* Top Simulation Switcher (Discreet tester pill) with safe area spacing */}
        <View style={[styles.topTesterBar, { paddingTop: topInset + 10 }]}>
          {/* <TouchableOpacity
            style={[
              styles.testerPill,
              {
                backgroundColor: effectiveAppAvailable
                  ? 'rgba(34, 197, 94, 0.22)'
                  : 'rgba(239, 68, 68, 0.22)',
              },
            ]}
            onPress={() => {
              const nextState = !effectiveAppAvailable;
              setForceAppAvailable(nextState);
              if (stage === 'trying') {
                // do nothing, timeout will read new effective value
              } else {
                setStage('trying');
                setCallSeconds(0);
              }
            }}
            activeOpacity={0.7}
          > */}
          {/* <View
              style={[
                styles.testerDot,
                { backgroundColor: effectiveAppAvailable ? '#22C55E' : '#EF4444' },
              ]}
            /> */}
          {/* <Text style={styles.testerText}>
              Simulation: {effectiveAppAvailable ? 'App Available (4A)' : 'App Not Available (4B)'} (Tap to toggle)
            </Text> */}
          {/* </TouchableOpacity> */}
        </View>

        {/* Screen Content Based on Stage */}
        {/* ============================================================== */}
        {/* SCREEN 3: TRYING APP CALL                                     */}
        {/* ============================================================== */}
        {stage === 'trying' && (
          <View style={[styles.bodyContent, { paddingBottom: bottomInset + 20 }]}>
            {/* Center Avatar with white ring border */}
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: contact.avatar }} style={styles.avatarImage} />
            </View>

            {/* Contact Name & Phone */}
            <Text style={styles.contactName}>{contact.name}</Text>
            <Text style={styles.contactPhone}>{contact.primaryPhone}</Text>

            {/* Connecting Spinner / Pulsing ring */}
            <View style={styles.connectingCenter}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.spinningArc,
                  {
                    transform: [{ rotate: spinInterpolation }],
                  },
                ]}
              />
            </View>

            {/* Connecting Texts */}
            <View style={styles.connectingTextWrap}>
              <Text style={styles.connectingTitle}>
                Connecting via{'\n'}Leads Phone Book...
              </Text>
              <Text style={styles.connectingSub}>App Call • • •</Text>
            </View>

            {/* Bottom Red Cancel Button */}
            <View style={styles.bottomActionArea}>
              <TouchableOpacity
                style={styles.cancelCallBtn}
                onPress={handleEndCall}
                activeOpacity={0.8}
              >
                <Icon name="phone-off" size={32} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* SCREEN 4A: APP CALL CONNECTED                                  */}
        {/* ============================================================== */}
        {stage === 'app_connected' && (
          <View style={[styles.bodyContent, { paddingBottom: bottomInset + 20 }]}>
            {/* Avatar */}
            <View style={styles.avatarWrapperSmall}>
              <Image source={{ uri: contact.avatar }} style={styles.avatarImageSmall} />
            </View>

            {/* Name */}
            <Text style={styles.connectedName}>{contact.name}</Text>

            {/* Call Duration Timer */}
            <Text style={styles.timerText}>{formatTimer(callSeconds)}</Text>

            {/* Green Connected Indicator */}
            <View style={styles.greenStatusBadge}>
              <View style={styles.audioWaveIcon}>
                <View style={[styles.waveBar, { height: 10 }]} />
                <View style={[styles.waveBar, { height: 16 }]} />
                <View style={[styles.waveBar, { height: 12 }]} />
              </View>
              <Text style={styles.greenStatusText}>App Call Connected</Text>
            </View>

            {/* 6 In-Call Controls Grid */}
            <View style={styles.controlsGrid}>
              {/* Row 1 */}
              <View style={styles.controlsRow}>
                {/* 1. Mute */}
                <TouchableOpacity
                  style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
                  onPress={() => setIsMuted(!isMuted)}
                >
                  <Icon
                    name={isMuted ? 'mic-off' : 'mic'}
                    size={26}
                    color="#FFFFFF"
                    strokeWidth={2}
                  />
                  <Text style={styles.controlLabel}>{isMuted ? 'Muted' : 'Mute'}</Text>
                </TouchableOpacity>

                {/* 2. Keypad */}
                <TouchableOpacity
                  style={styles.controlBtn}
                  onPress={() => setShowKeypad(true)}
                >
                  <Icon name="keypad" size={26} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.controlLabel}>Keypad</Text>
                </TouchableOpacity>

                {/* 3. Speaker */}
                <TouchableOpacity
                  style={[styles.controlBtn, isSpeaker && styles.controlBtnActive]}
                  onPress={() => setIsSpeaker(!isSpeaker)}
                >
                  <Icon name="speaker" size={26} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.controlLabel}>Speaker</Text>
                </TouchableOpacity>
              </View>

              {/* Row 2 */}
              <View style={styles.controlsRow}>
                {/* 4. Add Call */}
                <TouchableOpacity
                  style={styles.controlBtn}
                  onPress={() => Alert.alert('Add Call', 'Select another contact to merge call.')}
                >
                  <Icon name="user-plus" size={26} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.controlLabel}>Add Call</Text>
                </TouchableOpacity>

                {/* 5. Hold */}
                <TouchableOpacity
                  style={[styles.controlBtn, isOnHold && styles.controlBtnActive]}
                  onPress={() => setIsOnHold(!isOnHold)}
                >
                  <Icon name="pause" size={26} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.controlLabel}>{isOnHold ? 'On Hold' : 'Hold'}</Text>
                </TouchableOpacity>

                {/* 6. Record */}
                <TouchableOpacity
                  style={[styles.controlBtn, isRecording && styles.controlBtnRecordActive]}
                  onPress={() => setIsRecording(!isRecording)}
                >
                  <Icon
                    name="record"
                    size={26}
                    color={isRecording ? '#EF4444' : '#FFFFFF'}
                    strokeWidth={2}
                  />
                  <Text style={[styles.controlLabel, isRecording && { color: '#EF4444' }]}>
                    {isRecording ? 'Rec...' : 'Record'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Red End Call Button */}
            <View style={styles.bottomActionArea}>
              <TouchableOpacity
                style={styles.endCallBtn}
                onPress={handleEndCall}
                activeOpacity={0.8}
              >
                <Icon name="phone-off" size={32} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* SCREEN 4B: APP NOT AVAILABLE DIALOG MODAL                      */}
        {/* ============================================================== */}
        {stage === 'not_available' && (
          <View style={[styles.bodyContent, { paddingBottom: bottomInset + 20 }]}>
            {/* Background dimmed elements */}
            <View style={styles.avatarWrapperSmall}>
              <Image source={{ uri: contact.avatar }} style={styles.avatarImageSmall} />
            </View>
            <Text style={styles.connectedName}>{contact.name}</Text>
            <Text style={styles.contactPhone}>{contact.primaryPhone}</Text>

            {/* Modal Bottom Sheet Card matching Screen 4B */}
            <View style={styles.notAvailableCard}>
              {/* Alert phone icon with red exclamation */}
              <View style={styles.notAvailableIconWrap}>
                <View style={styles.notAvailableIconBg}>
                  <Icon name="phone" size={32} color="#DC2626" strokeWidth={2.2} />
                  <View style={styles.alertBadge}>
                    <Text style={styles.alertExclamation}>!</Text>
                  </View>
                </View>
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.notAvailableTitle}>App Call Not Available</Text>
              <Text style={styles.notAvailableSubtitle}>Routing to Normal Call</Text>

              {/* Explanatory Description */}
              <Text style={styles.notAvailableDesc}>
                App feature is not available for this contact and Leads Phone Book app. Do you want to continue with a normal phone call?
              </Text>

              {/* Primary Green Continue Button */}
              <TouchableOpacity
                style={styles.continueCallBtn}
                onPress={handleContinueNormalCall}
                activeOpacity={0.8}
              >
                <Icon name="phone" size={20} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.continueCallText}>
                  Continue (Normal Call)
                </Text>
              </TouchableOpacity>

              {/* Cancel / End Call Button */}
              <TouchableOpacity
                style={styles.cancelDialogBtn}
                onPress={handleEndCall}
                activeOpacity={0.7}
              >
                <Icon name="close" size={18} color="#475569" strokeWidth={2.2} />
                <Text style={styles.cancelDialogText}>End Call (Cancel)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* SCREEN 5: NORMAL PHONE CALL (AFTER CONTINUE)                   */}
        {/* ============================================================== */}
        {stage === 'normal_connected' && (
          <View style={[styles.bodyContent, { paddingBottom: bottomInset + 20 }]}>
            {/* Avatar */}
            <View style={styles.avatarWrapperSmall}>
              <Image source={{ uri: contact.avatar }} style={styles.avatarImageSmall} />
            </View>

            {/* Name & Phone */}
            <Text style={styles.connectedName}>{contact.name}</Text>
            <Text style={styles.contactPhone}>{contact.primaryPhone}</Text>

            {/* Call Duration Timer */}
            <Text style={styles.timerText}>{formatTimer(callSeconds)}</Text>

            {/* Normal Phone Call Subtitle */}
            <Text style={styles.normalCallingSubtitle}>
              Calling via Normal Phone...
            </Text>

            {/* 6 In-Call Controls Grid */}
            <View style={styles.controlsGrid}>
              {/* Row 1 */}
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
                  onPress={() => setIsMuted(!isMuted)}
                >
                  <Icon
                    name={isMuted ? 'mic-off' : 'mic'}
                    size={26}
                    color="#FFFFFF"
                    strokeWidth={2}
                  />
                  <Text style={styles.controlLabel}>{isMuted ? 'Muted' : 'Mute'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlBtn}
                  onPress={() => setShowKeypad(true)}
                >
                  <Icon name="keypad" size={26} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.controlLabel}>Keypad</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlBtn, isSpeaker && styles.controlBtnActive]}
                  onPress={() => setIsSpeaker(!isSpeaker)}
                >
                  <Icon name="speaker" size={26} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.controlLabel}>Speaker</Text>
                </TouchableOpacity>
              </View>

              {/* Row 2 */}
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={styles.controlBtn}
                  onPress={() => Alert.alert('Add Call', 'Select another contact to merge call.')}
                >
                  <Icon name="user-plus" size={26} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.controlLabel}>Add Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlBtn, isOnHold && styles.controlBtnActive]}
                  onPress={() => setIsOnHold(!isOnHold)}
                >
                  <Icon name="pause" size={26} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.controlLabel}>{isOnHold ? 'On Hold' : 'Hold'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlBtn, isRecording && styles.controlBtnRecordActive]}
                  onPress={() => setIsRecording(!isRecording)}
                >
                  <Icon
                    name="record"
                    size={26}
                    color={isRecording ? '#EF4444' : '#FFFFFF'}
                    strokeWidth={2}
                  />
                  <Text style={[styles.controlLabel, isRecording && { color: '#EF4444' }]}>
                    {isRecording ? 'Rec...' : 'Record'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Red End Call Button */}
            <View style={styles.bottomActionArea}>
              <TouchableOpacity
                style={styles.endCallBtn}
                onPress={handleEndCall}
                activeOpacity={0.8}
              >
                <Icon name="phone-off" size={32} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Dialpad Overlay */}
        <InCallDialpadModal
          visible={showKeypad}
          onClose={() => setShowKeypad(false)}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070D1E', // Deep immersive calling background
  },
  topTesterBar: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    alignItems: 'center',
    zIndex: 10,
  },
  testerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 8,
  },
  testerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  testerText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  bodyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  avatarWrapper: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    marginTop: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarWrapperSmall: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    marginTop: 10,
  },
  avatarImageSmall: {
    width: '100%',
    height: '100%',
  },
  contactName: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    marginTop: 16,
    letterSpacing: 0.3,
  },
  connectedName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
    letterSpacing: 0.3,
  },
  contactPhone: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  connectingCenter: {
    width: 86,
    height: 86,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 18,
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(30, 96, 242, 0.25)',
  },
  spinningArc: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#1E60F2',
    borderTopColor: 'transparent',
    borderRightColor: '#60A5FA',
  },
  connectingTextWrap: {
    alignItems: 'center',
    gap: 8,
  },
  connectingTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  connectingSub: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 1,
  },
  greenStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(22, 163, 74, 0.18)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    marginTop: 12,
  },
  audioWaveIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#22C55E',
    borderRadius: 2,
  },
  greenStatusText: {
    color: '#22C55E',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  normalCallingSubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 15,
    fontWeight: '500',
    marginTop: 10,
    letterSpacing: 0.3,
  },
  controlsGrid: {
    width: '100%',
    paddingHorizontal: 12,
    marginVertical: 18,
    gap: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  controlBtnActive: {
    backgroundColor: '#1E60F2',
  },
  controlBtnRecordActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  controlLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  bottomActionArea: {
    alignItems: 'center',
    gap: 8,
  },
  cancelCallBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  cancelLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  endCallBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  /* Screen 4B Modal Card */
  notAvailableCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    marginTop: 'auto',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  notAvailableIconWrap: {
    marginBottom: 12,
  },
  notAvailableIconBg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  alertBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  alertExclamation: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  notAvailableTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  notAvailableSubtitle: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  notAvailableDesc: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  continueCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  continueCallText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelDialogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 8,
    gap: 6,
  },
  cancelDialogText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
});
