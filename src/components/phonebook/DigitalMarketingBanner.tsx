import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';

export interface DigitalMarketingBannerProps {
  onPress?: () => void;
}

const BANNER_HEIGHT = 60;
const PILL_RADIUS = BANNER_HEIGHT / 2; // 30

export const DigitalMarketingBanner: React.FC<DigitalMarketingBannerProps> = ({
  onPress,
}) => {
  const [layoutWidth, setLayoutWidth] = useState<number | null>(null);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0 && width !== layoutWidth) {
      setLayoutWidth(width);
    }
  };

  return (
    <View style={styles.outerWrapper}>
      <View style={styles.shadowContainer}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          onLayout={handleLayout}
          style={styles.pillContainer}
        >
          <Svg
            width="100%"
            height="100%"
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            <Defs>
              {/* 1. Base Metallic Vertical Gradient */}
              <SvgLinearGradient id="metallicVertical" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.96} />
                <Stop offset="8%" stopColor="#EFF3F7" stopOpacity={1} />
                <Stop offset="25%" stopColor="#DFE4EA" stopOpacity={1} />
                <Stop offset="50%" stopColor="#CBD1D9" stopOpacity={1} />
                <Stop offset="75%" stopColor="#A4ABB6" stopOpacity={1} />
                <Stop offset="92%" stopColor="#838A95" stopOpacity={1} />
                <Stop offset="100%" stopColor="#676E7A" stopOpacity={1} />
              </SvgLinearGradient>

              {/* 2. Cylindrical Curvature Horizontal Gradient (Vignette dark ends, bright metallic center) */}
              <SvgLinearGradient id="cylindricalSheen" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#3E4450" stopOpacity={0.46} />
                <Stop offset="6%" stopColor="#5E6572" stopOpacity={0.28} />
                <Stop offset="18%" stopColor="#9CA3AF" stopOpacity={0.06} />
                <Stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.34} />
                <Stop offset="82%" stopColor="#9CA3AF" stopOpacity={0.06} />
                <Stop offset="94%" stopColor="#5E6572" stopOpacity={0.28} />
                <Stop offset="100%" stopColor="#3E4450" stopOpacity={0.46} />
              </SvgLinearGradient>

              {/* 3. Upper Specular Gloss Sheen */}
              <SvgLinearGradient id="glossHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.82} />
                <Stop offset="35%" stopColor="#FFFFFF" stopOpacity={0.25} />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
              </SvgLinearGradient>

              {/* 4. Outer Beveled Stroke */}
              <SvgLinearGradient id="beveledBorder" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.92} />
                <Stop offset="35%" stopColor="#CCD2DA" stopOpacity={0.82} />
                <Stop offset="75%" stopColor="#7B828E" stopOpacity={0.78} />
                <Stop offset="100%" stopColor="#4E545F" stopOpacity={0.88} />
              </SvgLinearGradient>
            </Defs>

            {/* Base Metallic Rect */}
            <Rect
              x="0.75"
              y="0.75"
              width={layoutWidth ? layoutWidth - 1.5 : '99.5%'}
              height={BANNER_HEIGHT - 1.5}
              rx={PILL_RADIUS}
              ry={PILL_RADIUS}
              fill="url(#metallicVertical)"
              stroke="url(#beveledBorder)"
              strokeWidth={1.5}
            />

            {/* Cylindrical Sheen Layer */}
            <Rect
              x="1.5"
              y="1.5"
              width={layoutWidth ? layoutWidth - 3 : '99%'}
              height={BANNER_HEIGHT - 3}
              rx={PILL_RADIUS - 1}
              ry={PILL_RADIUS - 1}
              fill="url(#cylindricalSheen)"
            />

            {/* Glossy Upper Highlight */}
            <Rect
              x={layoutWidth ? PILL_RADIUS * 0.45 : '14%'}
              y="2"
              width={layoutWidth ? layoutWidth - PILL_RADIUS * 0.9 : '72%'}
              height={BANNER_HEIGHT * 0.4}
              rx={BANNER_HEIGHT * 0.2}
              ry={BANNER_HEIGHT * 0.2}
              fill="url(#glossHighlight)"
            />
          </Svg>

          {/* Centered Typography */}
          <View style={styles.textWrap} pointerEvents="none">
            <Text style={styles.titleLine}>Digital Marketing</Text>
            <Text style={styles.titleLine}>Automation</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  shadowContainer: {
    borderRadius: PILL_RADIUS,
    backgroundColor: '#9AA0AC',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  pillContainer: {
    height: BANNER_HEIGHT,
    borderRadius: PILL_RADIUS,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#CCD1D9',
  },
  textWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleLine: {
    fontSize: 18,
    fontWeight: '800',
    color: '#21252D',
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
});
