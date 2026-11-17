import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface HeaderOptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  topInset?: number;
  onDelete: () => void;
  onToggleHideBlocked: () => void;
  onToggleHideOtherApps: () => void;
  onTotalCallTime: () => void;
  onViewTags: () => void;
  onSettings: () => void;
  onViewBlockedContacts?: () => void;
}

export const HeaderOptionsMenu: React.FC<HeaderOptionsMenuProps> = ({
  visible,
  onClose,
  topInset = 40,
  onDelete,
  onToggleHideBlocked,
  onToggleHideOtherApps,
  onTotalCallTime,
  onViewTags,
  onSettings,
  onViewBlockedContacts,
}) => {
  const { isDark } = useTheme();

  if (!visible) return null;

  const menuItems = [
    { label: 'Delete', action: onDelete },
    { label: 'Blocked contacts', action: onViewBlockedContacts || onToggleHideBlocked },
    { label: 'Hide blocked calls', action: onToggleHideBlocked },
    { label: 'Hide calls from other apps', action: onToggleHideOtherApps },
    { label: 'Total call time', action: onTotalCallTime },
    { label: 'View and edit tags', action: onViewTags },
    { label: 'Settings', action: onSettings },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.menuCard,
                {
                  top: topInset + (Platform.OS === 'android' ? 12 : 8),
                  backgroundColor: isDark ? '#242526' : '#FFFFFF',
                  borderColor: isDark ? '#3A3B3C' : '#E4E6EB',
                },
              ]}
            >
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => {
                    onClose();
                    setTimeout(() => {
                      item.action();
                    }, 120);
                  }}
                  activeOpacity={0.65}
                >
                  <Text
                    style={[
                      styles.menuText,
                      { color: isDark ? '#E4E6EB' : '#050505' },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  menuCard: {
    position: 'absolute',
    right: 16,
    width: 242,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  menuItem: {
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
});
