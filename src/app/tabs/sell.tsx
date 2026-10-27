import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { AppButton, AppInput } from '@/components/common';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { createProduct } from '@/services/db';
import { CATEGORIES, ProductCategory } from '@/types';

const LOCATION_PRESETS = [
  'KTX Khu A',
  'KTX Khu B',
  'Giảng đường',
  'Khác',
];

const QUICK_PRICES = [
  { label: 'Tặng 0đ', value: 0 },
  { label: '20.000đ', value: 20000 },
  { label: '50.000đ', value: 50000 },
  { label: '100.000đ', value: 100000 },
  { label: '200.000đ', value: 200000 },
];

export default function SellScreen() {
  const colors = useTheme();
  const { user, isLoggedIn, isLoading } = useAuth();

  // Form states
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [priceDisplay, setPriceDisplay] = useState('');
  const [priceValue, setPriceValue] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('book');
  const [selectedLocationPreset, setSelectedLocationPreset] = useState<string>('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // UI status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    price?: string;
    location?: string;
  }>({});

  // 1. Kiểm tra trạng thái đang tải dữ liệu auth
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // 1. Kiểm tra đăng nhập: nếu chưa đăng nhập, hiển thị thông báo kèm nút sang /auth
  if (!isLoggedIn || !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.authNoticeWrapper}>
          <View style={[styles.authIconCircle, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="lock-closed-outline" size={54} color={colors.primary} />
          </View>
          <Text style={[styles.authTitle, { color: colors.text }]}>
            Yêu cầu tài khoản sinh viên
          </Text>
          <Text style={[styles.authSubtitle, { color: colors.textSecondary }]}>
            Bạn cần đăng nhập tài khoản sinh viên trước khi đăng bán đồ
          </Text>
          <AppButton
            title="Đăng nhập ngay"
            onPress={() => router.push('/auth' as any)}
            style={styles.authButton}
            icon={<Ionicons name="log-in-outline" size={20} color={colors.white} />}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Chọn ảnh từ thư viện
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Quyền truy cập ảnh',
          'Vui lòng cấp quyền truy cập thư viện ảnh để tải ảnh sản phẩm lên.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Lỗi khi chọn ảnh:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh từ thư viện. Vui lòng thử lại.');
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
  };

  // Định dạng giá bán tự động (VND)
  const handlePriceChange = (text: string) => {
    const rawNumber = text.replace(/[^0-9]/g, '');
    if (!rawNumber) {
      setPriceDisplay('');
      setPriceValue(0);
      return;
    }
    const num = parseInt(rawNumber, 10);
    setPriceValue(num);
    setPriceDisplay(num.toLocaleString('vi-VN'));
    if (errors.price) {
      setErrors((prev) => ({ ...prev, price: undefined }));
    }
  };

  const handleQuickPriceSelect = (val: number) => {
    setPriceValue(val);
    setPriceDisplay(val.toLocaleString('vi-VN'));
    if (errors.price) {
      setErrors((prev) => ({ ...prev, price: undefined }));
    }
  };

  // Chọn vị trí mẫu
  const handleSelectLocationPreset = (preset: string) => {
    setSelectedLocationPreset(preset);
    if (preset === 'Khác') {
      setLocation('');
    } else {
      setLocation(preset);
      if (errors.location) {
        setErrors((prev) => ({ ...prev, location: undefined }));
      }
    }
  };

  // Xử lý đăng bán
  const handleSubmit = async () => {
    const newErrors: { title?: string; price?: string; location?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề món đồ';
    } else if (title.trim().length < 4) {
      newErrors.title = 'Tiêu đề quá ngắn (tối thiểu 4 ký tự)';
    }

    if (priceDisplay.trim() === '') {
      newErrors.price = 'Vui lòng nhập giá bán (hoặc 0đ nếu tặng)';
    }

    if (!location.trim()) {
      newErrors.location = 'Vui lòng chọn hoặc nhập vị trí giao dịch';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert('Chưa đủ thông tin', 'Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createProduct({
        userId: user.id,
        title: title.trim(),
        description: description.trim() || undefined,
        price: priceValue,
        category: selectedCategory,
        location: location.trim(),
        imageUrl: imageUri || undefined,
      });

      if (response.success) {
        // Reset form
        setTitle('');
        setPriceDisplay('');
        setPriceValue(0);
        setImageUri(null);
        setSelectedCategory('book');
        setSelectedLocationPreset('');
        setLocation('');
        setDescription('');
        setErrors({});

        Alert.alert(
          'Đăng bán thành công! 🎉',
          'Món đồ của bạn đã được đăng lên chợ sinh viên thành công.',
          [
            {
              text: 'Về Trang chủ',
              onPress: () => {
                try {
                  router.push('/(tabs)' as any);
                } catch {
                  router.push('/tabs' as any);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Đăng tin thất bại', response.error || 'Đã có lỗi xảy ra.');
      }
    } catch (err: any) {
      console.error('Lỗi khi đăng tin sản phẩm:', err);
      Alert.alert('Lỗi', err?.message || 'Không thể tạo tin đăng lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Đăng tin bán đồ</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Chia sẻ sách vở, đồ dùng sinh viên với giá tiết kiệm
            </Text>
          </View>

          {/* Khung tải ảnh */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Hình ảnh sản phẩm</Text>

            {imageUri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                <View style={styles.previewActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={handlePickImage}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="image-outline" size={16} color={colors.primary} />
                    <Text style={[styles.actionButtonText, { color: colors.primary }]}>Đổi ảnh</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}
                    onPress={handleRemoveImage}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={[styles.actionButtonText, { color: colors.danger }]}>Gỡ ảnh</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.uploadBox,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={handlePickImage}
                activeOpacity={0.7}
              >
                <View style={[styles.uploadIconCircle, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="camera-outline" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.uploadText, { color: colors.primary }]}>Chọn ảnh từ thư viện</Text>
                <Text style={[styles.uploadSubtext, { color: colors.textSecondary }]}>
                  Ảnh rõ nét sẽ giúp bạn thanh lý nhanh hơn (tỉ lệ 4:3)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Thông tin cơ bản: Tiêu đề & Giá bán */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Thông tin món đồ</Text>

            <AppInput
              label="Tiêu đề món đồ *"
              placeholder="VD: Giáo trình Giải tích 1 - Thầy Hùng"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              error={errors.title}
              leftIcon={<Ionicons name="book-outline" size={20} color={colors.textSecondary} />}
            />

            <AppInput
              label="Giá bán (VND) *"
              placeholder="0 (Nhập 0 nếu tặng miễn phí)"
              keyboardType="numeric"
              value={priceDisplay}
              onChangeText={handlePriceChange}
              error={errors.price}
              leftIcon={<Ionicons name="pricetag-outline" size={20} color={colors.textSecondary} />}
              rightIcon={
                <Text style={[styles.currencySuffix, { color: colors.primary }]}>₫</Text>
              }
            />

            {/* Gợi ý giá nhanh */}
            <View style={styles.quickPricesWrapper}>
              <Text style={[styles.subHint, { color: colors.textSecondary }]}>Chọn nhanh:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPricesList}>
                {QUICK_PRICES.map((item) => {
                  const isSelected = priceValue === item.value && priceDisplay !== '';
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.quickPriceChip,
                        {
                          backgroundColor: isSelected ? colors.primaryLight : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => handleQuickPriceSelect(item.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.quickPriceText,
                          { color: isSelected ? colors.primary : colors.textSecondary },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Chọn Danh mục */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Danh mục sản phẩm *</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                    activeOpacity={0.7}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={16} color={colors.white} style={{ marginRight: 4 }} />
                    )}
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: isSelected ? colors.white : colors.text },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Chọn Vị trí trong trường */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Vị trí nhận đồ trong trường *</Text>
            
            <View style={styles.locationPresetsWrapper}>
              {LOCATION_PRESETS.map((preset) => {
                const isSelected =
                  selectedLocationPreset === preset || (preset !== 'Khác' && location === preset);
                return (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.locationPresetChip,
                      {
                        backgroundColor: isSelected ? colors.primaryLight : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleSelectLocationPreset(preset)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.locationPresetText,
                        { color: isSelected ? colors.primary : colors.text },
                      ]}
                    >
                      {preset}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <AppInput
              label="Địa điểm chi tiết *"
              placeholder="VD: KTX Khu A, KTX Khu B, Giảng đường H1..."
              value={location}
              onChangeText={(text) => {
                setLocation(text);
                setSelectedLocationPreset('Khác');
                if (errors.location) setErrors((prev) => ({ ...prev, location: undefined }));
              }}
              error={errors.location}
              leftIcon={<Ionicons name="navigate-outline" size={20} color={colors.textSecondary} />}
            />
          </View>

          {/* Mô tả chi tiết món đồ */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Mô tả chi tiết</Text>
            <AppInput
              label=""
              placeholder="Mô tả tình trạng món đồ (mới 95%, có ghi chú hay không, phụ kiện kèm theo, cách thức nhận hàng...)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={styles.descriptionInput}
            />
          </View>

          {/* Nút Đăng bán ngay */}
          <View style={styles.submitSection}>
            <AppButton
              title="Đăng bán ngay"
              onPress={handleSubmit}
              loading={isSubmitting}
              icon={<Ionicons name="cloud-upload-outline" size={20} color={colors.white} />}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl + Spacing.lg,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authNoticeWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  authIconCircle: {
    width: 96,
    height: 96,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  authTitle: {
    ...Typography.title,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  authSubtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  authButton: {
    width: '100%',
    maxWidth: 280,
  },
  header: {
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  headerTitle: {
    ...Typography.title,
  },
  headerSubtitle: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  card: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    ...Typography.subTitle,
    marginBottom: Spacing.md,
  },
  uploadBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  uploadIconCircle: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  uploadText: {
    ...Typography.subTitle,
    fontWeight: '600',
  },
  uploadSubtext: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: Radius.md,
  },
  previewActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    width: '100%',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  actionButtonText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  currencySuffix: {
    ...Typography.subTitle,
    fontWeight: '700',
  },
  quickPricesWrapper: {
    marginTop: -Spacing.xs,
    marginBottom: Spacing.xs,
  },
  subHint: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  quickPricesList: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  quickPriceChip: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  quickPriceText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  categoryChipText: {
    ...Typography.body,
    fontWeight: '500',
  },
  locationPresetsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  locationPresetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  locationPresetText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  descriptionInput: {
    minHeight: 90,
    paddingTop: Spacing.sm,
  },
  submitSection: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
});
