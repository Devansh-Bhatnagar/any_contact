import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { Icon } from '../components/common/Icon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface StatusItem {
  id: string;
  contactName: string;
  avatar: string;
  timeAgo: string;
  mediaUrl: string;
  caption?: string;
  isViewed: boolean;
  isMine?: boolean;
  viewsCount?: number;
}

const INITIAL_STATUSES: StatusItem[] = [];

export const StatusScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [myStatus, setMyStatus] = useState<StatusItem | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyList, setStoryList] = useState<StatusItem[]>([]);
  const [showAddStatusModal, setShowAddStatusModal] = useState<boolean>(false);
  const [newStatusCaption, setNewStatusCaption] = useState<string>('');
  const [showViewedUpdates, setShowViewedUpdates] = useState<boolean>(true);
  const [replyText, setReplyText] = useState<string>('');
  const [showMenu, setShowMenu] = useState<boolean>(false);

  // Story progress animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 16
  );
  const bottomPadding = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? 16 : 24
  );

  // Filter into Recent and Viewed
  const recentUpdates = statuses.filter((s) => !s.isViewed && !s.isMine);
  const viewedUpdates = statuses.filter((s) => s.isViewed && !s.isMine);

  // Open Story Viewer
  const handleOpenStory = (item: StatusItem, list: StatusItem[]) => {
    setStoryList(list);
    const idx = list.findIndex((s) => s.id === item.id);
    setActiveStoryIndex(idx !== -1 ? idx : 0);
    setReplyText('');

    // Mark as viewed in local state
    setStatuses((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, isViewed: true } : s))
    );
  };

  // Story Timer
  useEffect(() => {
    if (activeStoryIndex !== null && storyList[activeStoryIndex]) {
      progressAnim.setValue(0);
      const animation = Animated.timing(progressAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      });

      animation.start(({ finished }) => {
        if (finished) {
          handleNextStory();
        }
      });

      return () => animation.stop();
    }
  }, [activeStoryIndex, storyList]);

  const handleNextStory = () => {
    if (activeStoryIndex === null) return;
    if (activeStoryIndex < storyList.length - 1) {
      const nextIdx = activeStoryIndex + 1;
      const nextItem = storyList[nextIdx];
      setActiveStoryIndex(nextIdx);
      if (nextItem && !nextItem.isMine) {
        setStatuses((prev) =>
          prev.map((s) => (s.id === nextItem.id ? { ...s, isViewed: true } : s))
        );
      }
    } else {
      setActiveStoryIndex(null);
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIndex === null) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    } else {
      progressAnim.setValue(0);
    }
  };

  // Add New Status
  const handleCreateStatus = () => {
    const caption = newStatusCaption.trim();
    if (!caption) {
      Alert.alert('Status text', 'Please type a message for your status.');
      return;
    }

    const created: StatusItem = {
      id: `my-status-${Date.now()}`,
      contactName: 'My Status',
      avatar: '',
      timeAgo: 'Just now',
      mediaUrl: '',
      caption: caption,
      isViewed: false,
      isMine: true,
      viewsCount: 0,
    };

    setMyStatus(created);
    setNewStatusCaption('');
    setShowAddStatusModal(false);
    Alert.alert('Status Updated', 'Your status update has been published!');
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    Alert.alert('Reply Sent', `Reply sent to ${storyList[activeStoryIndex!]?.contactName}!`);
    setReplyText('');
    handleNextStory();
  };

  // Theme colors
  const bgColor = isDark ? '#18191A' : '#FFFFFF';
  const headerBg = isDark ? '#18191A' : '#FFFFFF';
  const headerBorder = isDark ? '#2E2F30' : '#E4E6EB';
  const headerTextColor = isDark ? '#E4E6EB' : '#050505';
  const subTextColor = isDark ? '#B0B3B8' : '#65676B';
  const sectionTitleColor = isDark ? '#94A3B8' : '#64748B';
  const cardBorder = isDark ? '#3A3B3C' : '#E4E6EB';

  const currentStory = activeStoryIndex !== null ? storyList[activeStoryIndex] : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* WhatsApp Updates Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding + 6,
            borderBottomColor: headerBorder,
            backgroundColor: headerBg,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: headerTextColor }]}>
          Status
        </Text>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => Alert.alert('Search', 'Search contact statuses')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name="search"
              size={21}
              color={isDark ? '#E4E6EB' : '#1C1E21'}
              strokeWidth={2}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setShowMenu((prev) => !prev)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name="more-vertical"
              size={20}
              color={isDark ? '#E4E6EB' : '#1C1E21'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3-Dots Dropdown Menu */}
      {showMenu && (
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <View style={styles.menuBackdrop}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.dropdownMenuCard,
                  {
                    top: topPadding + 52,
                    backgroundColor: isDark ? '#242526' : '#FFFFFF',
                    borderColor: isDark ? '#3A3B3C' : '#E4E6EB',
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    Alert.alert('Status Privacy', 'Who can see my status updates:\n• My contacts\n• My contacts except...\n• Only share with...');
                  }}
                >
                  <Text style={[styles.menuItemText, { color: headerTextColor }]}>
                    Status privacy
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    Alert.alert('Settings', 'Status storage & auto-download settings');
                  }}
                >
                  <Text style={[styles.menuItemText, { color: headerTextColor }]}>
                    Settings
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Scrollable Status Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding + 80 },
        ]}
      >
        {/* 1. My Status Section */}
        <TouchableOpacity
          style={styles.statusRow}
          onPress={() => {
            if (myStatus) {
              handleOpenStory(myStatus, [myStatus]);
            } else {
              setShowAddStatusModal(true);
            }
          }}
          activeOpacity={0.7}
        >
          {/* Avatar with Ring / Add Badge */}
          <View style={styles.avatarWrap}>
            <View
              style={[
                styles.avatarRing,
                myStatus
                  ? { borderColor: colors.primary, borderWidth: 2.5 }
                  : { borderColor: 'transparent' },
              ]}
            >
              {myStatus?.avatar ? (
                <Image
                  source={{ uri: myStatus.avatar }}
                  style={styles.avatarImg}
                />
              ) : (
                <View
                  style={[
                    styles.avatarImg,
                    {
                      backgroundColor: isDark ? '#242526' : '#E2E8F0',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}
                >
                  <Icon
                    name="user"
                    size={24}
                    color={isDark ? '#94A3B8' : '#64748B'}
                    strokeWidth={2}
                  />
                </View>
              )}
            </View>

            {!myStatus && (
              <View
                style={[
                  styles.addPlusBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Icon name="plus" size={13} color="#FFFFFF" strokeWidth={3} />
              </View>
            )}
          </View>

          <View style={styles.statusInfoCol}>
            <Text style={[styles.contactNameText, { color: headerTextColor }]}>
              My status
            </Text>
            <Text style={[styles.statusTimeText, { color: subTextColor }]}>
              {myStatus
                ? `${myStatus.timeAgo} • ${myStatus.viewsCount || 0} views`
                : 'Tap to add status update'}
            </Text>
          </View>

          {/* Right Action: 3-dots if user has status, else camera */}
          {myStatus ? (
            <TouchableOpacity
              style={styles.myStatusOptionsBtn}
              onPress={() =>
                Alert.alert(
                  'My Status',
                  `Views: ${myStatus.viewsCount || 0}\nShared with your contacts`,
                  [
                    { text: 'Delete', style: 'destructive', onPress: () => setMyStatus(null) },
                    { text: 'Close', style: 'cancel' },
                  ]
                )
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="more-vertical" size={18} color={subTextColor} />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>

        {/* 2. Recent Updates Section */}
        {recentUpdates.length > 0 && (
          <View style={styles.sectionWrap}>
            <Text
              style={[
                styles.sectionHeaderTitle,
                { color: sectionTitleColor },
              ]}
            >
              Recent updates
            </Text>

            {recentUpdates.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.statusRow}
                onPress={() => handleOpenStory(item, recentUpdates)}
                activeOpacity={0.7}
              >
                {/* Active Story Colored Ring */}
                <View style={styles.avatarWrap}>
                  <View
                    style={[
                      styles.avatarRing,
                      {
                        borderColor: colors.primary,
                        borderWidth: 2.5,
                      },
                    ]}
                  >
                    <Image source={{ uri: item.avatar }} style={styles.avatarImg} />
                  </View>
                </View>

                <View style={styles.statusInfoCol}>
                  <Text
                    style={[styles.contactNameText, { color: headerTextColor }]}
                    numberOfLines={1}
                  >
                    {item.contactName}
                  </Text>
                  <Text style={[styles.statusTimeText, { color: subTextColor }]}>
                    {item.timeAgo}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 3. Viewed Updates Section */}
        {viewedUpdates.length > 0 && (
          <View style={styles.sectionWrap}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => setShowViewedUpdates((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.sectionHeaderTitle,
                  { color: sectionTitleColor },
                ]}
              >
                Viewed updates
              </Text>
              <Icon
                name={showViewedUpdates ? 'chevron-down' : 'chevron-right'}
                size={16}
                color={sectionTitleColor}
              />
            </TouchableOpacity>

            {showViewedUpdates &&
              viewedUpdates.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.statusRow}
                  onPress={() => handleOpenStory(item, viewedUpdates)}
                  activeOpacity={0.7}
                >
                  {/* Viewed Gray Ring */}
                  <View style={styles.avatarWrap}>
                    <View
                      style={[
                        styles.avatarRing,
                        {
                          borderColor: isDark ? '#3A3B3C' : '#CBD5E1',
                          borderWidth: 1.8,
                        },
                      ]}
                    >
                      <Image source={{ uri: item.avatar }} style={styles.avatarImg} />
                    </View>
                  </View>

                  <View style={styles.statusInfoCol}>
                    <Text
                      style={[styles.contactNameText, { color: headerTextColor }]}
                      numberOfLines={1}
                    >
                      {item.contactName}
                    </Text>
                    <Text style={[styles.statusTimeText, { color: subTextColor }]}>
                      {item.timeAgo}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* Empty state when no contact updates */}
        {recentUpdates.length === 0 && viewedUpdates.length === 0 && (
          <View style={styles.noUpdatesWrap}>
            <View
              style={[
                styles.noUpdatesCircle,
                { backgroundColor: isDark ? '#242526' : '#F0F2F5' },
              ]}
            >
              <Icon
                name="status"
                size={30}
                color={subTextColor}
                strokeWidth={1.8}
              />
            </View>
            <Text
              style={[
                styles.noUpdatesTitle,
                { color: headerTextColor },
              ]}
            >
              No status updates
            </Text>
            <Text
              style={[
                styles.noUpdatesSubText,
                { color: subTextColor },
              ]}
            >
              Status updates from your contacts will appear here.
            </Text>
          </View>
        )}

        {/* WhatsApp End-to-End Encryption Security Note */}
        <View style={styles.encryptionFooter}>
          <Icon name="lock" size={13} color={subTextColor} />
          <Text style={[styles.encryptionFooterText, { color: subTextColor }]}>
            Your status updates are end-to-end encrypted
          </Text>
        </View>
      </ScrollView>

      {/* Floating Action Buttons (WhatsApp FABs) */}
      <View style={[styles.fabsContainer, { bottom: bottomPadding + 16 }]}>
        {/* Pencil / Text Status FAB */}
        <TouchableOpacity
          style={[
            styles.fabPencil,
            {
              backgroundColor: isDark ? '#242526' : '#EEF2F7',
              borderColor: cardBorder,
            },
          ]}
          onPress={() => setShowAddStatusModal(true)}
          activeOpacity={0.8}
        >
          <Icon
            name="edit"
            size={18}
            color={isDark ? '#E4E6EB' : '#1E60F2'}
            strokeWidth={2}
          />
        </TouchableOpacity>

        {/* Camera Status FAB */}
        <TouchableOpacity
          style={[
            styles.fabCamera,
            { backgroundColor: colors.primary },
          ]}
          onPress={() => setShowAddStatusModal(true)}
          activeOpacity={0.85}
        >
          <Icon name="camera" size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Full-Screen WhatsApp Story Viewer Modal */}
      {currentStory && (
        <Modal
          visible={!!currentStory}
          animationType="fade"
          transparent={false}
          onRequestClose={() => setActiveStoryIndex(null)}
          statusBarTranslucent={true}
        >
          <StatusBar barStyle="light-content" />
          <View style={styles.storyViewerContainer}>
            {/* Story Background Media Image or Text Status */}
            {currentStory.mediaUrl ? (
              <Image
                source={{ uri: currentStory.mediaUrl }}
                style={styles.storyMediaImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.storyMediaImage, styles.storyTextBackground]}>
                <Text style={styles.storyCenteredText}>
                  {currentStory.caption}
                </Text>
              </View>
            )}

            {/* Dark Gradient / Vignette Overlay for Headers and Captions */}
            <View style={styles.storyTopOverlay} />
            <View style={styles.storyBottomOverlay} />

            {/* Top Multi-Segmented Progress Bar */}
            <View style={[styles.progressBarRow, { paddingTop: topPadding + 6 }]}>
              {storyList.map((story, i) => {
                const isActive = i === activeStoryIndex;
                const isPast = i < (activeStoryIndex || 0);

                return (
                  <View key={story.id} style={styles.progressTrack}>
                    {isActive ? (
                      <Animated.View
                        style={[
                          styles.progressFill,
                          {
                            width: progressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', '100%'],
                            }),
                          },
                        ]}
                      />
                    ) : (
                      <View
                        style={[
                          styles.progressFill,
                          { width: isPast ? '100%' : '0%' },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>

            {/* Story Header */}
            <View style={styles.storyHeader}>
              <TouchableOpacity
                style={styles.storyHeaderLeft}
                onPress={() => setActiveStoryIndex(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="arrow-left" size={22} color="#FFFFFF" strokeWidth={2.4} />
                {currentStory.avatar ? (
                  <Image
                    source={{ uri: currentStory.avatar }}
                    style={styles.storyHeaderAvatar}
                  />
                ) : (
                  <View
                    style={[
                      styles.storyHeaderAvatar,
                      {
                        backgroundColor: '#0F5132',
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                    ]}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
                      {currentStory.contactName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.storyHeaderInfo}>
                  <Text style={styles.storyHeaderName} numberOfLines={1}>
                    {currentStory.contactName}
                  </Text>
                  <Text style={styles.storyHeaderTime}>
                    {currentStory.timeAgo}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.storyCloseBtn}
                onPress={() => setActiveStoryIndex(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={22} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Touch areas: Left Tap (Prev) & Right Tap (Next) */}
            <View style={styles.touchNavigationWrap}>
              <TouchableOpacity
                style={styles.touchNavLeft}
                onPress={handlePrevStory}
                activeOpacity={1}
              />
              <TouchableOpacity
                style={styles.touchNavRight}
                onPress={handleNextStory}
                activeOpacity={1}
              />
            </View>

            {/* Caption Overlay */}
            {currentStory.mediaUrl && currentStory.caption ? (
              <View style={styles.captionContainer}>
                <View style={styles.captionBadge}>
                  <Text style={styles.captionText}>
                    {currentStory.caption}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* WhatsApp Story Bottom Reply Input Bar */}
            {!currentStory.isMine && (
              <View
                style={[
                  styles.storyReplyBar,
                  { paddingBottom: Math.max(bottomPadding, 12) },
                ]}
              >
                <View style={styles.replyInputBox}>
                  <TextInput
                    style={styles.replyTextInput}
                    placeholder={`Reply to ${currentStory.contactName}...`}
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    value={replyText}
                    onChangeText={setReplyText}
                  />
                  <TouchableOpacity
                    style={styles.replySendBtn}
                    onPress={handleSendReply}
                    activeOpacity={0.8}
                  >
                    <Icon name="send" size={17} color="#FFFFFF" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </Modal>
      )}

      {/* Add New Status Modal */}
      <Modal
        visible={showAddStatusModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddStatusModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAddStatusModal(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.addStatusCard,
                  {
                    backgroundColor: isDark ? '#242526' : '#FFFFFF',
                    borderColor: cardBorder,
                  },
                ]}
              >
                <View style={styles.addStatusHeader}>
                  <Text
                    style={[
                      styles.addStatusTitle,
                      { color: headerTextColor },
                    ]}
                  >
                    Add Status Update
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowAddStatusModal(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="close" size={20} color={subTextColor} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[
                    styles.addStatusInput,
                    {
                      backgroundColor: isDark ? '#18191A' : '#F0F2F5',
                      borderColor: cardBorder,
                      color: headerTextColor,
                    },
                  ]}
                  placeholder="What's on your mind? Type status..."
                  placeholderTextColor={subTextColor}
                  value={newStatusCaption}
                  onChangeText={setNewStatusCaption}
                  multiline
                  maxLength={150}
                  autoFocus
                />

                <View style={styles.addStatusActions}>
                  <TouchableOpacity
                    style={[
                      styles.addStatusBtnCancel,
                      { backgroundColor: isDark ? '#3A3B3C' : '#E4E6EB' },
                    ]}
                    onPress={() => setShowAddStatusModal(false)}
                  >
                    <Text style={[styles.addStatusBtnText, { color: headerTextColor }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.addStatusBtnSubmit,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={handleCreateStatus}
                  >
                    <Text style={[styles.addStatusBtnText, { color: '#FFFFFF' }]}>
                      Share Status
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerActionBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },
  dropdownMenuCard: {
    position: 'absolute',
    right: 14,
    width: 170,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 100,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    paddingTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 14,
  },
  avatarWrap: {
    position: 'relative',
    width: 58,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  addPlusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  statusInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  contactNameText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  statusTimeText: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  myStatusOptionsBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionWrap: {
    marginTop: 10,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  encryptionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 28,
    paddingHorizontal: 20,
  },
  encryptionFooterText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  fabsContainer: {
    position: 'absolute',
    right: 20,
    alignItems: 'center',
    gap: 12,
  },
  fabPencil: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  fabCamera: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  storyViewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  storyMediaImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
  },
  storyTopOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  storyBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  progressBarRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 4,
    zIndex: 10,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    zIndex: 10,
  },
  storyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  storyHeaderAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  storyHeaderInfo: {
    justifyContent: 'center',
    flex: 1,
  },
  storyHeaderName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  storyHeaderTime: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 1,
  },
  storyCloseBtn: {
    padding: 6,
  },
  touchNavigationWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 5,
  },
  touchNavLeft: {
    width: '35%',
    height: '100%',
  },
  touchNavRight: {
    width: '65%',
    height: '100%',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    zIndex: 10,
    alignItems: 'center',
  },
  captionBadge: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    maxWidth: '92%',
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
    textAlign: 'center',
  },
  storyReplyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 10,
    zIndex: 10,
  },
  replyInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  replyTextInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14.5,
    paddingVertical: 4,
  },
  replySendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1E60F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  addStatusCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  addStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  addStatusTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  addStatusInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  addStatusActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  addStatusBtnCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addStatusBtnSubmit: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addStatusBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  noUpdatesWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 54,
    paddingHorizontal: 32,
    gap: 8,
  },
  noUpdatesCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  noUpdatesTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  noUpdatesSubText: {
    fontSize: 13.5,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 19,
  },
  storyTextBackground: {
    backgroundColor: '#0F5132',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  storyCenteredText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 34,
  },
});
