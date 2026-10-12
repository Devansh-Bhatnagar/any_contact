import { Linking, Platform, Alert, Share } from 'react-native';

export class LinkingService {
  /**
   * Initiates a phone call via device dialer
   */
  static async makeCall(phone: string): Promise<void> {
    const cleaned = phone.replace(/[^0-9+]/g, '');
    const url = `tel:${cleaned}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to Call', `Dialer is not available for ${phone}`);
      }
    } catch (error) {
      Alert.alert('Error', `Could not initiate call: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Opens SMS messenger app
   */
  static async sendMessage(phone: string, defaultBody = ''): Promise<void> {
    const cleaned = phone.replace(/[^0-9+]/g, '');
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const bodyParam = defaultBody ? `${separator}body=${encodeURIComponent(defaultBody)}` : '';
    const url = `sms:${cleaned}${bodyParam}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to Send SMS', `SMS client is not available on this device.`);
      }
    } catch (error) {
      Alert.alert('Error', `Could not open SMS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Opens WhatsApp Direct Chat
   */
  static async openWhatsApp(phone: string, text = ''): Promise<void> {
    const cleaned = phone.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(text);
    const appUrl = `whatsapp://send?phone=${cleaned}${text ? `&text=${encodedText}` : ''}`;
    const webUrl = `https://api.whatsapp.com/send?phone=${cleaned}${text ? `&text=${encodedText}` : ''}`;

    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      try {
        await Linking.openURL(webUrl);
      } catch (err) {
        Alert.alert('WhatsApp Error', 'Could not open WhatsApp on this device.');
      }
    }
  }

  /**
   * Opens Google Maps or Apple Maps or Browser Fallback
   */
  static async openDirections(latitude: number, longitude: number, label: string): Promise<void> {
    const encodedLabel = encodeURIComponent(label);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    const scheme = Platform.select({
      ios: `maps:0,0?q=${encodedLabel}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${encodedLabel})`,
    });

    try {
      if (scheme) {
        const supported = await Linking.canOpenURL(scheme);
        if (supported) {
          await Linking.openURL(scheme);
          return;
        }
      }
      // Fallback to web maps
      await Linking.openURL(googleMapsUrl);
    } catch (error) {
      // Direct web fallback
      try {
        await Linking.openURL(googleMapsUrl);
      } catch (err) {
        Alert.alert('Directions Error', 'Unable to open maps application.');
      }
    }
  }

  /**
   * Opens external web URL (Chrome / default browser)
   */
  static async openWebsite(url: string): Promise<void> {
    try {
      let target = url.trim();
      if (!target.startsWith('http://') && !target.startsWith('https://')) {
        target = `https://${target}`;
      }
      await Linking.openURL(target);
    } catch (error) {
      Alert.alert('Unable to open link', `Could not open ${url}`);
    }
  }

  /**
   * Opens Email client with recipient and optional subject/body
   */
  static async openEmail(email: string, subject = '', body = ''): Promise<void> {
    const cleanEmail = email.trim();
    const queryParams: string[] = [];
    if (subject) queryParams.push(`subject=${encodeURIComponent(subject)}`);
    if (body) queryParams.push(`body=${encodeURIComponent(body)}`);
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const mailtoUrl = `mailto:${cleanEmail}${queryString}`;

    try {
      const supported = await Linking.canOpenURL(mailtoUrl);
      if (supported) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert('Email Client Unavailable', `Please email directly to: ${cleanEmail}`);
      }
    } catch (error) {
      Alert.alert('Error', `Could not launch email app: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Opens Instagram Profile or Link (App with Web fallback)
   */
  static async openInstagram(handleOrUrl: string): Promise<void> {
    const clean = handleOrUrl.trim().replace(/^@/, '');
    let username = clean;
    let webUrl = clean;

    if (clean.includes('instagram.com/')) {
      const parts = clean.split('instagram.com/');
      username = parts[1].split('/')[0].split('?')[0];
      webUrl = clean.startsWith('http') ? clean : `https://${clean}`;
    } else {
      webUrl = `https://www.instagram.com/${clean}/`;
    }

    const appUrl = `instagram://user?username=${username}`;

    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      try {
        await Linking.openURL(webUrl);
      } catch (err) {
        Alert.alert('Instagram Error', 'Could not open Instagram profile.');
      }
    }
  }

  /**
   * Opens Facebook Page or Profile (App with Web fallback)
   */
  static async openFacebook(pageOrUrl: string): Promise<void> {
    let clean = pageOrUrl.trim();
    let webUrl = clean.startsWith('http') ? clean : `https://${clean.startsWith('facebook.com') ? clean : `facebook.com/${clean}`}`;

    // App scheme
    const appUrl = `fb://facewebmodal/f?href=${encodeURIComponent(webUrl)}`;

    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      try {
        await Linking.openURL(webUrl);
      } catch (err) {
        Alert.alert('Facebook Error', 'Could not open Facebook page.');
      }
    }
  }

  /**
   * Opens YouTube Channel or Video (App with Web fallback)
   */
  static async openYouTube(channelOrUrl: string): Promise<void> {
    let clean = channelOrUrl.trim();
    let webUrl = clean.startsWith('http') ? clean : `https://${clean.startsWith('youtube.com') ? clean : `youtube.com/${clean.startsWith('@') ? clean : `@${clean}`}`}`;

    const appUrl = Platform.select({
      ios: `youtube://${clean.replace(/^https?:\/\/(www\.)?youtube\.com\//, '')}`,
      android: `vnd.youtube:${clean.replace(/^https?:\/\/(www\.)?youtube\.com\//, '')}`,
    });

    try {
      if (appUrl && (await Linking.canOpenURL(appUrl))) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      try {
        await Linking.openURL(webUrl);
      } catch (err) {
        Alert.alert('YouTube Error', 'Could not open YouTube channel.');
      }
    }
  }

  /**
   * Opens LinkedIn Profile or Company (App with Web fallback)
   */
  static async openLinkedIn(profileOrUrl: string): Promise<void> {
    let clean = profileOrUrl.trim();
    let webUrl = clean.startsWith('http') ? clean : `https://${clean.startsWith('linkedin.com') ? clean : `linkedin.com/company/${clean}`}`;

    const appUrl = `linkedin://${clean.replace(/^https?:\/\/(www\.)?linkedin\.com\//, '')}`;

    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      try {
        await Linking.openURL(webUrl);
      } catch (err) {
        Alert.alert('LinkedIn Error', 'Could not open LinkedIn page.');
      }
    }
  }

  /**
   * Native Share sheet
   */
  static async shareBusiness(name: string, phone: string, address: string, city: string): Promise<void> {
    try {
      await Share.share({
        title: name,
        message: `${name}\n📍 ${address}, ${city}\n📞 ${phone}\nShared via Business Contacts App`,
      });
    } catch (error) {
      // Ignored if cancelled
    }
  }
}
