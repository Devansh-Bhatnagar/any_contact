import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from './Icon';
import { borderRadius } from '../../theme/spacing';

interface BestieButtonProps {
  isBestie: boolean;
  onPress: () => void;
  size?: number;
  iconSize?: number;
  showBackground?: boolean;
}

export const BestieButton: React.FC<BestieButtonProps> = ({
  isBestie,
  onPress,
  size = 36,
  iconSize = 18,
  showBackground = false,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Micro-bounce animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.35,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          backgroundColor: showBackground
            ? isBestie
              ? colors.bestieBackground
              : colors.surfaceVariant
            : 'transparent',
        },
      ]}
      accessibilityLabel={isBestie ? 'Remove from Besties' : 'Add to Besties'}
      accessibilityRole="button"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Icon
          name={isBestie ? 'star-fill' : 'star'}
          size={iconSize}
          color={isBestie ? colors.bestie : colors.textTertiary}
          strokeWidth={isBestie ? 1.5 : 1.8}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
