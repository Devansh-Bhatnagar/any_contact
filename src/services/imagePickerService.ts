import { Alert, NativeModules, PermissionsAndroid, Platform } from 'react-native';

const { ImagePicker } = NativeModules;

export interface PickedImageResult {
  uri: string;
  fileName: string;
  type: string;
}

export class ImagePickerService {
  /**
   * Check whether the native Android ImagePicker module is available
   */
  static isAvailable(): boolean {
    return Platform.OS === 'android' && !!ImagePicker && !!ImagePicker.pickFromGallery;
  }

  /**
   * Pick an image from the device's mobile gallery / photo picker
   */
  static async pickFromGallery(): Promise<PickedImageResult | null> {
    if (!this.isAvailable()) {
      Alert.alert(
        'Rebuild Required',
        'Mobile image upload module requires an app rebuild (npx react-native run-android).'
      );
      return null;
    }

    try {
      const result: PickedImageResult = await ImagePicker.pickFromGallery();
      if (result && result.uri) {
        return result;
      }
      return null;
    } catch (err: any) {
      if (err?.code === 'CANCELLED') {
        return null;
      }
      console.warn('Gallery picker error:', err);
      Alert.alert('Upload Failed', err?.message || 'Could not select image from gallery.');
      return null;
    }
  }

  /**
   * Capture a new photo using the device's camera
   */
  static async captureFromCamera(): Promise<PickedImageResult | null> {
    if (!this.isAvailable() || !ImagePicker.captureFromCamera) {
      Alert.alert(
        'Rebuild Required',
        'Mobile camera module requires an app rebuild (npx react-native run-android).'
      );
      return null;
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'Leads Phone Book needs camera access to take your photo.',
            buttonPositive: 'Allow',
            buttonNegative: 'Cancel',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Denied',
            'Please allow camera permission in Settings to take photos.'
          );
          return null;
        }
      } catch (err) {
        console.warn('Camera permission error:', err);
        return null;
      }
    }

    try {
      const result: PickedImageResult = await ImagePicker.captureFromCamera();
      if (result && result.uri) {
        return result;
      }
      return null;
    } catch (err: any) {
      if (err?.code === 'CANCELLED') {
        return null;
      }
      console.warn('Camera capture error:', err);
      Alert.alert('Camera Failed', err?.message || 'Could not capture photo.');
      return null;
    }
  }

  /**
   * Prompt user to select an image from Gallery or Camera
   */
  static promptSelectImage(
    onSelected: (image: PickedImageResult) => void,
    options?: { hasExistingImage?: boolean; onRemove?: () => void }
  ): void {
    const buttons: Array<{
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }> = [
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const picked = await this.pickFromGallery();
          if (picked) onSelected(picked);
        },
      },
      {
        text: 'Take Photo (Camera)',
        onPress: async () => {
          const captured = await this.captureFromCamera();
          if (captured) onSelected(captured);
        },
      },
    ];

    if (options?.hasExistingImage && options.onRemove) {
      buttons.push({
        text: 'Remove Photo',
        style: 'destructive',
        onPress: options.onRemove,
      });
    }

    buttons.push({
      text: 'Cancel',
      style: 'cancel',
    });

    Alert.alert(
      'Upload Photo',
      'Select a photo from your mobile device',
      buttons,
      { cancelable: true }
    );
  }
}

