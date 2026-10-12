import React, { useState, memo } from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import {
  CATEGORY_LOCAL_IMAGES,
  DEFAULT_BUSINESS_LOGO,
} from '../../constants/imageAssets';

export interface BusinessAvatarProps {
  image?: string | null;
  category?: string;
  name?: string;
  size?: number;
  borderRadius?: number;
  style?: StyleProp<ImageStyle>;
  fallbackColor?: string;
}

export const BusinessAvatar: React.FC<BusinessAvatarProps> = memo(
  ({
    image,
    category,
    name,
    size = 46,
    borderRadius: customRadius,
    style,
    fallbackColor,
  }) => {
    const [loadError, setLoadError] = useState(false);

    const radius = customRadius !== undefined ? customRadius : size / 2;
    const localAsset =
      (category && CATEGORY_LOCAL_IMAGES[category]) ||
      CATEGORY_LOCAL_IMAGES['Other'] ||
      DEFAULT_BUSINESS_LOGO;

    // Determine the source to use:
    // If image is a custom non-unsplash URI (e.g. data: or user-uploaded) and has not errored, try it.
    // Otherwise, use the reliable local bundled asset immediately.
    const isCustomUri =
      typeof image === 'string' &&
      image.trim().length > 0 &&
      !image.includes('images.unsplash.com');

    const source = isCustomUri && !loadError ? { uri: image } : localAsset;

    const initials = name
      ? name
          .split(' ')
          .slice(0, 2)
          .map((w) => w.charAt(0))
          .join('')
          .toUpperCase()
      : '';

    return (
      <View
        style={[
          styles.container,
          { width: size, height: size, borderRadius: radius },
        ]}
      >
        <Image
          source={source}
          style={[
            styles.image,
            { width: size, height: size, borderRadius: radius },
            style,
          ]}
          resizeMode="cover"
          onError={() => setLoadError(true)}
        />
        {/* If for any reason both image and fallback fail, show initials */}
        {loadError && !localAsset && initials ? (
          <View
            style={[
              styles.fallbackInitialsBox,
              {
                width: size,
                height: size,
                borderRadius: radius,
                backgroundColor: fallbackColor ? `${fallbackColor}20` : '#E2E8F0',
              },
            ]}
          >
            <Text
              style={[
                styles.initialsText,
                { color: fallbackColor || '#475569', fontSize: Math.max(12, size * 0.35) },
              ]}
            >
              {initials}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackInitialsBox: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontWeight: '700',
  },
});
