import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography: Record<string, TextStyle> = {
  titleLarge: {
    fontFamily,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  titleMedium: {
    fontFamily,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 26,
  },
  titleSmall: {
    fontFamily,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 22,
  },
  bodyLarge: {
    fontFamily,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  labelLarge: {
    fontFamily,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelSmall: {
    fontFamily,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  sectionHeader: {
    fontFamily,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  indexLetter: {
    fontFamily,
    fontSize: 11,
    fontWeight: '700',
  },
};
