import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { PhoneBookContact } from '../types/phoneBook';

const { ContactsModule } = NativeModules;

export class DeviceContactsService {
  /**
   * Check if READ_CONTACTS permission is granted
   */
  static async checkPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }
    try {
      return await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS
      );
    } catch (err) {
      console.warn('Error checking contacts permission:', err);
      return false;
    }
  }

  /**
   * Request READ_CONTACTS permission using native Android dialog
   */
  static async requestPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        {
          title: 'Contacts Access Permission',
          message:
            'Leads Phone Book needs access to your contacts to display them in My Contacts and allow you to make calls.',
          buttonPositive: 'Allow',
          buttonNegative: 'Don’t Allow',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Error requesting contacts permission:', err);
      return false;
    }
  }

  /**
   * Fetch device contacts via ContactsContract and ContentResolver (native module)
   */
  static async fetchContacts(): Promise<PhoneBookContact[]> {
    if (Platform.OS === 'android') {
      if (!ContactsModule || !ContactsModule.getContacts) {
        console.warn('ContactsModule is not available on Android');
        return [];
      }
      try {
        const rawContacts = await ContactsModule.getContacts();
        if (Array.isArray(rawContacts)) {
          return rawContacts.map((c: any) => ({
            id: String(c.id || Math.random().toString()),
            name: String(c.name || 'Unknown'),
            avatar: String(c.avatar || ''),
            category: c.category || undefined,
            distance: c.distance || undefined,
            primaryPhone: String(c.primaryPhone || ''),
            phoneNumbers: Array.isArray(c.phoneNumbers)
              ? c.phoneNumbers.map((p: any) => ({
                  label: String(p.label || 'Mobile'),
                  number: String(p.number || ''),
                }))
              : c.primaryPhone
              ? [{ label: 'Mobile', number: String(c.primaryPhone) }]
              : [],
            email: String(c.email || ''),
            hasApp: typeof c.hasApp === 'boolean' ? c.hasApp : true,
            isFavorite: !!c.isFavorite,
          }));
        }
        return [];
      } catch (err) {
        console.warn('Error querying native device contacts:', err);
        throw err;
      }
    }
    return [];
  }
}

