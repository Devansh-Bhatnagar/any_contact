import { Business } from './business';

export type RootStackParamList = {
  MainTabs: undefined;
  BusinessDetails: {
    businessId: string;
    initialBusiness?: Business;
  };
};

export type MainTabParamList = {
  Contacts: undefined;
  Bestie: undefined;
  Dashboard: undefined;
  Settings: undefined;
};
