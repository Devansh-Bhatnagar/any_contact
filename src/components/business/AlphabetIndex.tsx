import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { ALPHABET_LETTERS } from '../../constants/alphabet';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../theme/typography';
import { borderRadius } from '../../theme/spacing';

interface AlphabetIndexProps {
  availableLetters: Set<string>;
  onSelectLetter: (letter: string) => void;
  activeLetter?: string;
}

export const AlphabetIndex: React.FC<AlphabetIndexProps> = ({
  availableLetters,
  onSelectLetter,
  activeLetter,
}) => {
  const { colors } = useTheme();
  const [touchLetter, setTouchLetter] = useState<string | null>(null);
  const containerLayoutRef = useRef<{ y: number; height: number }>({ y: 0, height: 0 });

  const handleTouch = (event: GestureResponderEvent) => {
    const { locationY } = event.nativeEvent;
    const { height } = containerLayoutRef.current;
    if (height <= 0) return;

    const letterHeight = height / ALPHABET_LETTERS.length;
    const index = Math.floor(locationY / letterHeight);
    const clampedIndex = Math.max(0, Math.min(ALPHABET_LETTERS.length - 1, index));
    const selectedLetter = ALPHABET_LETTERS[clampedIndex];

    if (selectedLetter) {
      setTouchLetter(selectedLetter);
      onSelectLetter(selectedLetter);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => handleTouch(evt),
      onPanResponderMove: (evt) => handleTouch(evt),
      onPanResponderRelease: () => {
        setTimeout(() => setTouchLetter(null), 300);
      },
      onPanResponderTerminate: () => {
        setTouchLetter(null);
      },
    })
  ).current;

  return (
    <View
      style={styles.wrapper}
      pointerEvents="box-none"
    >
      {/* Active Letter Popout Bubble */}
      {touchLetter && (
        <View
          style={[
            styles.popoutBubble,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.shadowColor,
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.popoutText}>{touchLetter}</Text>
        </View>
      )}

      {/* A-Z Index Column */}
      <View
        style={[styles.container, { backgroundColor: `${colors.background}CC` }]}
        {...panResponder.panHandlers}
        onLayout={(e) => {
          const { y, height } = e.nativeEvent.layout;
          containerLayoutRef.current = { y, height };
        }}
      >
        {ALPHABET_LETTERS.map((letter) => {
          const isAvailable = availableLetters.has(letter);
          const isCurrent = (touchLetter || activeLetter) === letter;

          return (
            <View
              key={`letter-${letter}`}
              style={[
                styles.letterItem,
                isCurrent && {
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.full,
                },
              ]}
            >
              <Text
                style={[
                  styles.letterText,
                  {
                    color: isCurrent
                      ? '#FFFFFF'
                      : isAvailable
                      ? colors.text
                      : colors.textTertiary,
                    fontWeight: isAvailable ? '700' : '400',
                    opacity: isAvailable ? 1 : 0.35,
                  },
                ]}
              >
                {letter}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 2,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 99,
  },
  container: {
    paddingVertical: 4,
    paddingHorizontal: 3,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'space-between',
    maxHeight: '85%',
  },
  letterItem: {
    width: 16,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    ...typography.indexLetter,
    fontSize: 9,
    textAlign: 'center',
  },
  popoutBubble: {
    position: 'absolute',
    right: 48,
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  popoutText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
});
