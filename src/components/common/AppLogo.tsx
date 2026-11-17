import React from 'react';
import { View, StyleSheet, Image, ImageSourcePropType } from 'react-native';

interface AppLogoProps {
  size?: number;
  showShadow?: boolean;
}

const APP_LOGO_IMAGE: ImageSourcePropType = require('../../assets/images/app-logo.png');

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 48,
  showShadow = true,
}) => {
  const borderRadius = Math.round(size * 0.22);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
        },
        showShadow && styles.shadow,
      ]}
    >
      <Image
        source={APP_LOGO_IMAGE}
        style={{
          width: size,
          height: size,
          borderRadius,
        }}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  shadow: {
    shadowColor: '#1E60F2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
});
