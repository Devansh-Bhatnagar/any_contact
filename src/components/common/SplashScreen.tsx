import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  StatusBar,
  TouchableWithoutFeedback,
} from 'react-native';
import Video from 'react-native-video';

interface SplashScreenProps {
  onFinish: () => void;
}

const SPLASH_VIDEO = require('../../assets/images/aycontact_video.mp4');

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const isFinishedRef = useRef(false);

  const handleFinish = useCallback(() => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    Animated.timing(splashOpacity, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      onFinish();
    });
  }, [splashOpacity, onFinish]);

  // Auto-skip after exactly 5 seconds
  useEffect(() => {
    const autoSkipTimer = setTimeout(() => {
      handleFinish();
    }, 5000);

    return () => clearTimeout(autoSkipTimer);
  }, [handleFinish]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: splashOpacity,
        },
      ]}
    >
      <StatusBar hidden={true} barStyle="light-content" />

      {/* Tapping anywhere allows the user to dismiss instantly */}
      <TouchableWithoutFeedback onPress={handleFinish}>
        <View style={styles.videoWrap}>
          <Video
            source={SPLASH_VIDEO}
            style={styles.video}
            resizeMode="cover"
            paused={false}
            repeat={false}
            muted={false}
            volume={1.0}
            ignoreSilentSwitch="ignore"
            playInBackground={false}
            playWhenInactive={false}
            progressUpdateInterval={100}
            onProgress={(data) => {
              if (data.currentTime >= 5.0) {
                handleFinish();
              }
            }}
            onEnd={handleFinish}
            onError={handleFinish}
          />
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrap: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
  video: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
});
