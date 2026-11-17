import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Icon } from '../common/Icon';

interface InCallDialpadModalProps {
  visible: boolean;
  onClose: () => void;
}

const KEYS = [
  { digit: '1', sub: '' },
  { digit: '2', sub: 'ABC' },
  { digit: '3', sub: 'DEF' },
  { digit: '4', sub: 'GHI' },
  { digit: '5', sub: 'JKL' },
  { digit: '6', sub: 'MNO' },
  { digit: '7', sub: 'PQRS' },
  { digit: '8', sub: 'TUV' },
  { digit: '9', sub: 'WXYZ' },
  { digit: '*', sub: '' },
  { digit: '0', sub: '+' },
  { digit: '#', sub: '' },
];

export const InCallDialpadModal: React.FC<InCallDialpadModalProps> = ({
  visible,
  onClose,
}) => {
  const [dialed, setDialed] = useState<string>('');

  const handlePress = (digit: string) => {
    setDialed((prev) => prev + digit);
  };

  const handleBackspace = () => {
    setDialed((prev) => prev.slice(0, -1));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Keypad</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Icon name="close" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Dialed Display */}
              <View style={styles.displayArea}>
                <Text style={styles.displayText} numberOfLines={1}>
                  {dialed || ' '}
                </Text>
              </View>

              {/* 3x4 Grid */}
              <View style={styles.grid}>
                {KEYS.map((k) => (
                  <TouchableOpacity
                    key={k.digit}
                    style={styles.keyButton}
                    onPress={() => handlePress(k.digit)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.keyDigit}>{k.digit}</Text>
                    {k.sub ? <Text style={styles.keySub}>{k.sub}</Text> : null}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.backspaceBtn}
                  onPress={handleBackspace}
                  disabled={dialed.length === 0}
                >
                  <Icon
                    name="arrow-left"
                    size={22}
                    color={dialed.length > 0 ? '#FFFFFF' : 'rgba(255,255,255,0.3)'}
                  />
                </TouchableOpacity>

                <TouchableOpacity style={styles.hideButton} onPress={onClose}>
                  <Text style={styles.hideText}>Hide</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  displayArea: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  displayText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  keyButton: {
    width: '29%',
    aspectRatio: 1.25,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyDigit: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  keySub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 12,
  },
  hideButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  hideText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  backspaceBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
