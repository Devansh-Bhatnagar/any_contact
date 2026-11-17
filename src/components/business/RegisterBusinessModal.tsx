import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../store/AuthContext';
import { useBusinesses } from '../../store/BusinessContext';
import { Icon } from '../common/Icon';
import { ALL_CATEGORIES, CATEGORY_COLORS } from '../../constants/categories';
import { ImagePickerService } from '../../services/imagePickerService';
import { isValidEmailFormat } from '../../services/authService';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { Business } from '../../types/business';
import { getOfferColor } from '../../constants/offerColors';
import { OFFER_FLAG_IMAGE } from '../../constants/imageAssets';

interface RegisterBusinessModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (business: Business) => void;
  editingBusiness?: Business | null;
}

const DEFAULT_SELECTABLE_CATEGORIES = ALL_CATEGORIES.filter((c) => c !== 'All');

const PRESET_OFFERS = [
  'Buy 1 Get 1 Free ',
  'Christmas offer flat 80% off',
  'Flat 50% Off ',
  'Flat 20% Off',
  'Special Festival Offer',
  'Free Home Delivery',
  'Combo Deal',
];

export const RegisterBusinessModal: React.FC<RegisterBusinessModalProps> = ({
  visible,
  onClose,
  onSuccess,
  editingBusiness = null,
}) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { addBusiness, updateBusiness, categories: liveCategories } = useBusinesses();
  const insets = useSafeAreaInsets();

  const selectableCategories = React.useMemo(() => {
    const merged = Array.from(
      new Set([
        ...liveCategories.filter((c) => c && c !== 'All'),
        ...DEFAULT_SELECTABLE_CATEGORIES,
      ])
    );
    return merged.length > 0 ? merged : DEFAULT_SELECTABLE_CATEGORIES;
  }, [liveCategories]);

  const isEditing = Boolean(editingBusiness);

  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState<string>('Professional Services');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [openingHours, setOpeningHours] = useState('9:00 AM - 8:00 PM');
  const [website, setWebsite] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [offers, setOffers] = useState<string[]>([]);
  const [customOfferText, setCustomOfferText] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setErrorMessage(null);

    if (editingBusiness) {
      setCompanyName(editingBusiness.name || '');
      setCategory(editingBusiness.category || selectableCategories[0] || 'Other');
      setPhone(editingBusiness.phone || '');
      setEmail(editingBusiness.email || '');
      setOwnerName(editingBusiness.ownerName || '');
      setCity(editingBusiness.city || '');
      setAddress(editingBusiness.address || '');
      setDescription(editingBusiness.description || '');
      setOpeningHours(editingBusiness.openingHours || '9:00 AM - 8:00 PM');
      setWebsite(editingBusiness.website || '');
      setImageUri(editingBusiness.image || undefined);
      const existingOffers =
        editingBusiness.offers && editingBusiness.offers.length > 0
          ? editingBusiness.offers
          : editingBusiness.promotions?.map((p) => p.title).filter(Boolean) || [];
      setOffers(existingOffers);
      setCustomOfferText('');
      return;
    }

    if (!ownerName && user?.name && user.role !== 'GUEST') {
      setOwnerName(user.name);
    }
    if (!email && user?.email) {
      setEmail(user.email);
    }
    if (!phone && user?.phone) {
      setPhone(user.phone);
    }
    if (!selectableCategories.includes(category) && selectableCategories.length > 0) {
      setCategory(selectableCategories[0]);
    }
    setOffers([]);
    setCustomOfferText('');
  }, [visible, editingBusiness, user, selectableCategories]);

  const resetForm = () => {
    setCompanyName('');
    setCategory('Professional Services');
    setPhone(user?.phone || '');
    setEmail(user?.email || '');
    setOwnerName(user?.name && user.role !== 'GUEST' ? user.name : '');
    setCity('');
    setAddress('');
    setDescription('');
    setOpeningHours('9:00 AM - 8:00 PM');
    setWebsite('');
    setImageUri(undefined);
    setOffers([]);
    setCustomOfferText('');
    setErrorMessage(null);
  };

  const handleTogglePresetOffer = (preset: string) => {
    if (offers.includes(preset)) {
      setOffers(offers.filter((o) => o !== preset));
    } else {
      setOffers([...offers, preset]);
    }
  };

  const handleAddCustomOffer = () => {
    const trimmed = customOfferText.trim();
    if (!trimmed) return;
    if (!offers.includes(trimmed)) {
      setOffers([...offers, trimmed]);
    }
    setCustomOfferText('');
  };

  const handleRemoveOffer = (offerToRemove: string) => {
    setOffers(offers.filter((o) => o !== offerToRemove));
  };

  const handlePickBusinessImage = () => {
    ImagePickerService.promptSelectImage(
      (picked) => {
        setImageUri(picked.uri);
      },
      {
        hasExistingImage: !!imageUri,
        onRemove: () => setImageUri(undefined),
      }
    );
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!companyName.trim()) {
      setErrorMessage('Please enter your business name');
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setErrorMessage('Please enter a valid business phone number');
      return;
    }
    if (email.trim() && !isValidEmailFormat(email)) {
      setErrorMessage('Please enter a valid business email address');
      return;
    }
    if (!city.trim()) {
      setErrorMessage('Please enter your business city');
      return;
    }
    if (!address.trim()) {
      setErrorMessage('Please enter your business address');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        companyName: companyName.trim(),
        category,
        phone: phone.trim(),
        email: email.trim().toLowerCase() || undefined,
        ownerName: ownerName.trim() || undefined,
        city: city.trim(),
        address: address.trim(),
        description:
          description.trim() ||
          `${companyName.trim()} - ${category} services in ${city.trim()}.`,
        openingHours: openingHours.trim() || '9:00 AM - 8:00 PM',
        website: website.trim() || undefined,
        imageUri,
        offers: offers.length > 0 ? offers : undefined,
      };

      let result: Business | null = null;
      if (editingBusiness) {
        result = await updateBusiness(editingBusiness.id, payload);
      } else {
        result = await addBusiness(payload);
      }

      if (result) {
        resetForm();
        onClose();
        onSuccess?.(result);

        if (editingBusiness) {
          Alert.alert(
            'Business Updated!',
            `"${result.name}" changes have been saved.`
          );
        } else {
          Alert.alert(
            'Business Registered!',
            result.isLiveBackend
              ? `"${result.name}" has been submitted for approval (${result.status || 'PENDING'}).`
              : `"${result.name}" has been added to Business Contacts directory.`
          );
        }
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
        (editingBusiness
          ? 'Could not update business. Please try again.'
          : 'Could not register business. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 20
  );

  const bgColor = isDark ? '#18191A' : colors.background;
  const surfaceColor = isDark ? '#242526' : colors.surface;
  const inputBg = isDark ? '#1C1E21' : colors.surfaceVariant;
  const borderColor = isDark ? '#3A3B3C' : colors.border;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: bgColor }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: topPadding + 10,
              backgroundColor: surfaceColor,
              borderBottomColor: colors.divider,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-left" size={22} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {isEditing ? 'Edit Business' : 'Register Business'}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              {isEditing
                ? 'Update your business profile'
                : 'List your business on Leads Phone Book'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Business Image / Logo Upload Section */}
          <View style={[styles.photoCard, { backgroundColor: surfaceColor }, shadows.subtle]}>
            <TouchableOpacity
              style={[
                styles.photoBox,
                {
                  backgroundColor: inputBg,
                  borderColor: imageUri ? colors.primary : borderColor,
                },
              ]}
              onPress={handlePickBusinessImage}
              activeOpacity={0.8}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.photoPreview} resizeMode="cover" />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <View style={[styles.photoIconCircle, { backgroundColor: `${colors.primary}18` }]}>
                    <Icon name="camera" size={24} color={colors.primary} />
                  </View>
                  <Text style={[styles.photoUploadTitle, { color: colors.text }]}>
                    Upload Logo / Shop Photo
                  </Text>
                  <Text style={[styles.photoUploadSub, { color: colors.textTertiary }]}>
                    Tap to pick from Gallery or Camera
                  </Text>
                </View>
              )}

              {imageUri ? (
                <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
                  <Icon name="camera" size={14} color="#FFFFFF" />
                </View>
              ) : null}
            </TouchableOpacity>

            {imageUri ? (
              <TouchableOpacity
                onPress={handlePickBusinessImage}
                style={styles.changePhotoBtn}
              >
                <Text style={[styles.changePhotoText, { color: colors.primary }]}>
                  Change or Remove Photo
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Error Banner */}
          {errorMessage ? (
            <View
              style={[
                styles.errorCard,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                  borderColor: '#EF4444',
                },
              ]}
            >
              <Icon name="info" size={18} color="#EF4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form Fields Card */}
          <View style={[styles.formCard, { backgroundColor: surfaceColor }, shadows.subtle]}>
            {/* Business Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Business Name <Text style={styles.req}>*</Text>
              </Text>
              <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor }]}>
                <Icon name="briefcase" size={18} color={colors.textTertiary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g. Sharma Electronics & Mobile"
                  placeholderTextColor={colors.textTertiary}
                  value={companyName}
                  onChangeText={(val) => {
                    setCompanyName(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                />
              </View>
            </View>

            {/* Category Pills */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Business Category <Text style={styles.req}>*</Text>
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
              >
                {selectableCategories.map((cat) => {
                  const active = category === cat;
                  const catColor = CATEGORY_COLORS[cat] || colors.primary;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: active ? catColor : inputBg,
                          borderColor: active ? catColor : borderColor,
                        },
                      ]}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          { color: active ? '#FFFFFF' : colors.textSecondary },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Phone Number <Text style={styles.req}>*</Text>
              </Text>
              <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor }]}>
                <Icon name="phone" size={18} color={colors.textTertiary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={colors.textTertiary}
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Owner Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Owner / Contact Person
              </Text>
              <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor }]}>
                <Icon name="user" size={18} color={colors.textTertiary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g. Rajesh Sharma"
                  placeholderTextColor={colors.textTertiary}
                  value={ownerName}
                  onChangeText={setOwnerName}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Business Email (Optional)
              </Text>
              <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor }]}>
                <Icon name="mail" size={18} color={colors.textTertiary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="contact@business.com"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* City */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                City <Text style={styles.req}>*</Text>
              </Text>
              <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor }]}>
                <Icon name="map-pin" size={18} color={colors.textTertiary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g. Jaipur"
                  placeholderTextColor={colors.textTertiary}
                  value={city}
                  onChangeText={(val) => {
                    setCity(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                />
              </View>
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Full Address <Text style={styles.req}>*</Text>
              </Text>
              <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor }]}>
                <Icon name="building" size={18} color={colors.textTertiary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Shop No, Market / Street Name"
                  placeholderTextColor={colors.textTertiary}
                  value={address}
                  onChangeText={(val) => {
                    setAddress(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                />
              </View>
            </View>

            {/* Opening Hours */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Opening Hours
              </Text>
              <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor }]}>
                <Icon name="clock" size={18} color={colors.textTertiary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="9:00 AM - 8:00 PM"
                  placeholderTextColor={colors.textTertiary}
                  value={openingHours}
                  onChangeText={setOpeningHours}
                />
              </View>
            </View>

            {/* Website */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Website (Optional)
              </Text>
              <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor }]}>
                <Icon name="globe" size={18} color={colors.textTertiary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="https://yourbusiness.com"
                  placeholderTextColor={colors.textTertiary}
                  value={website}
                  onChangeText={setWebsite}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                About Your Business & Services
              </Text>
              <View
                style={[
                  styles.textAreaWrap,
                  { backgroundColor: inputBg, borderColor },
                ]}
              >
                <TextInput
                  style={[styles.textArea, { color: colors.text }]}
                  placeholder="Describe your products, services, or specialties..."
                  placeholderTextColor={colors.textTertiary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Special Offers & Deals (Optional) */}
            <View style={styles.inputGroup}>
              <View style={styles.offerHeaderRow}>
                <Image
                  source={OFFER_FLAG_IMAGE}
                  style={{ width: 28, height: 24 }}
                  resizeMode="contain"
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Special Offers & Deals (Optional)
                  </Text>
                  <Text style={[styles.subLabelText, { color: colors.textTertiary }]}>
                    Add discounts, "Buy 1 Get 1 Free", or festive offers
                  </Text>
                </View>
              </View>

              {/* Quick Preset Offer Chips */}
              <View style={styles.presetsBox}>
                <Text style={[styles.presetsTitleText, { color: colors.textTertiary }]}>
                  Quick suggestions (tap to toggle):
                </Text>
                <View style={styles.presetChipsWrap}>
                  {PRESET_OFFERS.map((preset, pIdx) => {
                    const isSelected = offers.includes(preset);
                    const chipColor = getOfferColor(preset, pIdx);
                    return (
                      <TouchableOpacity
                        key={preset}
                        style={[
                          styles.presetChip,
                          {
                            backgroundColor: isSelected
                              ? (isDark ? chipColor.badgeBgDark : chipColor.badgeBg)
                              : inputBg,
                            borderColor: isSelected ? chipColor.primary : borderColor,
                          },
                        ]}
                        onPress={() => handleTogglePresetOffer(preset)}
                        activeOpacity={0.7}
                      >
                        {isSelected && (
                          <Icon
                            name="check"
                            size={12}
                            color={chipColor.primary}
                            strokeWidth={2.2}
                          />
                        )}
                        <Text
                          style={[
                            styles.presetChipText,
                            {
                              color: isSelected
                                ? (isDark ? chipColor.textDark : chipColor.text)
                                : colors.textSecondary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {preset}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Custom Offer Text Input */}
              <View style={[styles.customOfferWrap, { backgroundColor: inputBg, borderColor }]}>
                <Icon name="tag" size={16} color={colors.textTertiary} />
                <TextInput
                  style={[styles.customOfferInput, { color: colors.text }]}
                  placeholder="Type custom offer (e.g. 1 Par 1 Free)..."
                  placeholderTextColor={colors.textTertiary}
                  value={customOfferText}
                  onChangeText={setCustomOfferText}
                  onSubmitEditing={handleAddCustomOffer}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[
                    styles.addOfferBtn,
                    {
                      backgroundColor: customOfferText.trim()
                        ? colors.primary
                        : (isDark ? '#334155' : '#E2E8F0'),
                    },
                  ]}
                  onPress={handleAddCustomOffer}
                  disabled={!customOfferText.trim()}
                  activeOpacity={0.8}
                >
                  <Icon
                    name="plus"
                    size={14}
                    color={customOfferText.trim() ? '#FFFFFF' : colors.textTertiary}
                    strokeWidth={2.4}
                  />
                  <Text
                    style={[
                      styles.addOfferBtnText,
                      { color: customOfferText.trim() ? '#FFFFFF' : colors.textTertiary },
                    ]}
                  >
                    Add
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Active Selected Offers List with Flag Icons */}
              {offers.length > 0 && (
                <View style={styles.selectedOffersContainer}>
                  <Text style={[styles.selectedOffersLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Active Offers on Business ({offers.length}):
                  </Text>
                  <View style={styles.selectedOffersChipsRow}>
                    {offers.map((offerItem, idx) => {
                      const itemColor = getOfferColor(offerItem, idx);
                      return (
                        <View
                          key={`${offerItem}-${idx}`}
                          style={[
                            styles.selectedOfferChip,
                            {
                              backgroundColor: isDark ? itemColor.badgeBgDark : itemColor.badgeBg,
                              borderColor: isDark ? itemColor.borderDark : itemColor.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.selectedOfferText,
                              { color: isDark ? itemColor.textDark : itemColor.text },
                            ]}
                            numberOfLines={1}
                          >
                            {offerItem}
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleRemoveOffer(offerItem)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={styles.removeOfferBtn}
                          >
                            <Icon name="close" size={12} color={isDark ? itemColor.textDark : itemColor.primary} strokeWidth={2.4} />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: colors.primary },
                submitting && styles.submitDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Icon name="check-circle" size={18} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.submitText}>
                    {isEditing ? 'Save Changes' : 'Register Business'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    ...typography.titleMedium,
    fontWeight: '800',
    fontSize: 18,
  },
  headerSub: {
    ...typography.bodySmall,
    fontSize: 12,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  photoCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  photoBox: {
    width: '100%',
    height: 136,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    gap: 6,
  },
  photoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  photoUploadTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
  },
  photoUploadSub: {
    ...typography.bodySmall,
    fontSize: 12,
  },
  editBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  changePhotoBtn: {
    paddingVertical: 4,
  },
  changePhotoText: {
    ...typography.labelMedium,
    fontWeight: '700',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.bodyMedium,
    color: '#EF4444',
    flex: 1,
    fontWeight: '500',
  },
  formCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    ...typography.labelMedium,
    fontWeight: '600',
    fontSize: 13,
  },
  req: {
    color: '#EF4444',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.bodyMedium,
    fontSize: 15,
    paddingVertical: 0,
  },
  textAreaWrap: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 84,
  },
  textArea: {
    ...typography.bodyMedium,
    fontSize: 15,
    minHeight: 68,
  },
  categoryList: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  offerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  offerFlagIconBox: {
    width: 26,
    height: 26,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subLabelText: {
    fontSize: 11.5,
    marginTop: 1,
  },
  presetsBox: {
    gap: 6,
    marginTop: 2,
  },
  presetsTitleText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  presetChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  presetChipText: {
    fontSize: 12,
  },
  customOfferWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    gap: spacing.sm,
    marginTop: 4,
  },
  customOfferInput: {
    flex: 1,
    ...typography.bodyMedium,
    fontSize: 14,
    paddingVertical: 0,
  },
  addOfferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  addOfferBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  selectedOffersContainer: {
    gap: 6,
    marginTop: 4,
  },
  selectedOffersLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectedOffersChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectedOfferChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: 6,
    maxWidth: '100%',
  },
  selectedOfferText: {
    fontSize: 12.5,
    fontWeight: '600',
    flexShrink: 1,
  },
  removeOfferBtn: {
    padding: 2,
  },
  submitBtn: {
    height: 52,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    elevation: 3,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

