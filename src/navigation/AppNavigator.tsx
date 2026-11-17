import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { ContactsScreen } from '../screens/ContactsScreen';
import { StatusScreen } from '../screens/StatusScreen';
import { BestieScreen } from '../screens/BestieScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { DialerScreen } from '../screens/DialerScreen';
import { BusinessDetailsScreen } from '../screens/BusinessDetailsScreen';
import { BlockedContactsScreen } from '../screens/BlockedContactsScreen';
import { DigitalAutomationScreen } from '../screens/DigitalAutomationScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Icon } from '../components/common/Icon';
import { typography } from '../theme/typography';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs: React.FC = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 14);
  const tabHeight = 56 + bottomInset;

  return (
    <Tab.Navigator
      initialRouteName="Contacts"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          ...typography.labelSmall,
          fontWeight: '700',
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          tabBarLabel: 'Contacts',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <Icon
                name="contacts"
                size={22}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Status"
        component={StatusScreen}
        options={{
          tabBarLabel: 'Status',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <Icon
                name="status"
                size={22}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      {/* Center Highlighted Raised Keypad Dialer Tab */}
      <Tab.Screen
        name="Dialer"
        component={DialerScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.centerDialerWrap,
                {
                  backgroundColor: colors.primary,
                  borderColor: isDark ? '#162032' : '#FFFFFF',
                  shadowColor: colors.primary,
                },
                focused && styles.centerDialerFocused,
              ]}
            >
              <Icon
                name="dialpad"
                size={24}
                color="#FFFFFF"
                strokeWidth={2.4}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Favorites',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <Icon
                name={focused ? 'star-fill' : 'star'}
                size={22}
                color={focused ? colors.bestie : color}
                strokeWidth={focused ? 1.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <Icon
                name="settings"
                size={22}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { isAuthenticated, isGuest, isLoading } = useAuth();

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const isUserAuthenticated = isAuthenticated || isGuest;

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.divider,
          notification: colors.accent,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!isUserAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="BusinessDetails"
              component={BusinessDetailsScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="BlockedContacts"
              component={BlockedContactsScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="DigitalAutomation"
              component={DigitalAutomationScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  activeIconWrap: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    backgroundColor: 'rgba(30, 96, 242, 0.12)',
    transform: [{ scale: 1.05 }],
  },
  centerDialerWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -22,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  centerDialerFocused: {
    transform: [{ scale: 1.08 }],
    elevation: 8,
    shadowOpacity: 0.45,
  },
});
