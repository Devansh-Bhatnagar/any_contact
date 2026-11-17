import { ChatMessage } from '../components/phonebook/WhatsAppChatModal';

export interface RecentChatItem {
  id: string;
  name: string;
  phone: string;
  avatarType: 'letter' | 'peacock' | 'vi' | 'anshu' | 'kotak' | 'hotel' | 'you' | 'image';
  avatarUrl?: string;
  avatarLetter?: string;
  avatarBg?: string;
  subtitleType: 'photo' | 'document' | 'text';
  subtitleText: string;
  subtitleDocName?: string;
  time: string;
  timestamp?: number; // Epoch timestamp for chronological sorting
  isReadByRecipient?: boolean; // blue double tick
  unreadCount?: number;
  isFavorite?: boolean;
  isGroup?: boolean;
  messages: ChatMessage[];
}

// Exact 7 WhatsApp chats from user screenshot
export const INITIAL_RECENT_CHATS: RecentChatItem[] = [
  {
    id: 'chat-laddu',
    name: 'Laddu',
    phone: '+91 98765 43210',
    avatarType: 'letter',
    avatarLetter: 'L',
    avatarBg: '#0A5C43',
    subtitleType: 'photo',
    subtitleText: 'Photo',
    time: '5:11 PM',
    isFavorite: true,
    messages: [
      {
        id: 'msg-l1',
        sender: 'contact',
        text: '📷 Photo',
        time: '5:10 PM',
      },
      {
        id: 'msg-l2',
        sender: 'contact',
        text: 'Check this new photo! Looks amazing ✨',
        time: '5:11 PM',
      },
    ],
  },
  {
    id: 'chat-vi',
    name: 'Vi Care - Alerts',
    phone: '199',
    avatarType: 'vi',
    avatarBg: '#E60000',
    subtitleType: 'text',
    subtitleText: 'Incoming Call Expiry! Hello, incoming calls on your Vi number ...',
    time: 'Yesterday',
    unreadCount: 1,
    messages: [
      {
        id: 'msg-vi1',
        sender: 'contact',
        text: 'Incoming Call Expiry! Hello, incoming calls on your Vi number will stop soon. Recharge now with ₹179 pack to enjoy unlimited calls and high-speed data.',
        time: 'Yesterday',
      },
    ],
  },
  {
    id: 'chat-test',
    name: 'tester',
    phone: '+91 98112 34567',
    avatarType: 'anshu',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&q=80',
    subtitleType: 'document',
    subtitleText: 'app-arm64-v8a-release.apk',
    subtitleDocName: 'app-arm64-v8a-release.apk',
    time: 'Yesterday',
    isReadByRecipient: true,
    isFavorite: true,
    messages: [
      {
        id: 'msg-anshu1',
        sender: 'me',
        text: '📄 app-arm64-v8a-release.apk (34.8 MB)',
        time: 'Yesterday',
        status: 'read',
      },
      {
        id: 'msg-anshu2',
        sender: 'me',
        text: 'Here is the release build apk for testing on device.',
        time: 'Yesterday',
        status: 'read',
      },
    ],
  },
  {
    id: 'chat-kotak',
    name: 'Kotak Mahindra Bank',
    phone: '1860 266 2666',
    avatarType: 'kotak',
    avatarBg: '#003366',
    subtitleType: 'text',
    subtitleText: 'Hi Devansh Bhatnagar, Need funds soon? Your ₹50,000 Kotak ...',
    time: 'Yesterday',
    unreadCount: 2,
    messages: [
      {
        id: 'msg-k1',
        sender: 'contact',
        text: 'Hi Devansh Bhatnagar, Need funds soon? Your ₹50,000 Kotak pre-approved personal loan is ready with instant disbursal! Click to claim now.',
        time: 'Yesterday',
      },
    ],
  },
  {
    id: 'chat-kailash',
    name: 'Hotel Kailash Premium',
    phone: '+91 99887 76655',
    avatarType: 'hotel',
    avatarBg: '#1A535C',
    subtitleType: 'text',
    subtitleText: 'This business is now using a secure service from Meta to ma...',
    time: 'Yesterday',
    messages: [
      {
        id: 'msg-hk1',
        sender: 'contact',
        text: 'This business is now using a secure service from Meta to manage this chat. Tap to learn more.',
        time: 'Yesterday',
      },
      {
        id: 'msg-hk2',
        sender: 'contact',
        text: 'Namaste Devansh ji! Welcome to Hotel Kailash Premium. How may we assist your luxury stay reservation today?',
        time: 'Yesterday',
      },
    ],
  },
  {
    id: 'chat-you',
    name: '+91 79061 700000 (You)',
    phone: '+91 79061 70000',
    avatarType: 'you',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&q=80',
    subtitleType: 'photo',
    subtitleText: 'Photo',
    time: 'Tuesday',
    isReadByRecipient: true,
    isFavorite: true,
    messages: [
      {
        id: 'msg-you1',
        sender: 'me',
        text: '📷 Photo',
        time: 'Tuesday',
        status: 'read',
      },
      {
        id: 'msg-you2',
        sender: 'me',
        text: 'Personal notes and saved photo reference.',
        time: 'Tuesday',
        status: 'read',
      },
    ],
  },
];
