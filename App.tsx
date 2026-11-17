import React, { useState } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/themeContext';
import { AuthProvider } from './src/store/AuthContext';
import { BusinessProvider } from './src/store/BusinessContext';
import { PhoneBookProvider } from './src/store/PhoneBookContext';
import { useTheme } from './src/hooks/useTheme';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SplashScreen } from './src/components/common/SplashScreen';

import { usePhoneBook } from './src/store/PhoneBookContext';

const ThemedAppContent: React.FC = () => {
  const { isDark } = useTheme();
  const { isSplashFinished, setSplashFinished } = usePhoneBook();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <View style={styles.container}>
        <AppNavigator />
        {!isSplashFinished && (
          <SplashScreen onFinish={() => setSplashFinished(true)} />
        )}
      </View>
    </>
  );
};

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <BusinessProvider>
            <PhoneBookProvider>
              <ThemedAppContent />
            </PhoneBookProvider>
          </BusinessProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
