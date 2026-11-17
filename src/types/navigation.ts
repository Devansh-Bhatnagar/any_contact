import { Business } from './business';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;
  BusinessDetails: {
    businessId: string;
    initialBusiness?: Business;
  };
  BlockedContacts: undefined;
  DigitalAutomation: undefined;
};

export type MainTabParamList = {
  Contacts: undefined;
  Status: undefined;
  Dialer: undefined;
  Bestie?: undefined;
  Dashboard: undefined;
  Settings: undefined;
};
