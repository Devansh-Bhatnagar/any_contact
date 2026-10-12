export type ColorSchemeMode = 'light' | 'dark' | 'system';

export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderSubtle: string;
  divider: string;
  card: string;
  accent: string;
  bestie: string;
  bestieBackground: string;
  success: string;
  warning: string;
  error: string;
  call: string;
  message: string;
  directions: string;
  headerBackground: string;
  indexActiveBackground: string;
  chipBackground: string;
  chipActiveBackground: string;
  chipText: string;
  chipActiveText: string;
  searchBackground: string;
  shadowColor: string;
}

export interface AppTheme {
  isDark: boolean;
  colors: ColorPalette;
}
