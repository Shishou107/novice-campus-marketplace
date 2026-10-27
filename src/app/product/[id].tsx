import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { AppButton, Badge } from '@/components/common';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getProductById } from '@/services/db';
import { CATEGORIES, ProductWithSeller } from '@/types';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useTheme();

  const [product, setProduct] = useState<ProductWithSeller | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchProduct() {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getProductById(Number(id));
        if (isMounted) {
          setProduct(data);
        }
      } catch (error) {
        console.error('Lỗi khi tải chi tiết sản phẩm:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Xử lý gọi điện thoại cho người bán
  const handleContactSeller = () => {
    if (!product) return;

    if (product.status === 'sold') {
      Alert.alert('Thông báo', 'Món đồ này đã bán.');
      return;
    }

    if (!product.sellerPhone) {
      Alert.alert(
        'Chưa có số điện thoại',
        `Người bán (${product.sellerName}) chưa cập nhật số điện thoại. Bạn có thể tìm gặp qua Mã SV: ${product.sellerStudentId}.`
      );
      return;
    }

    const cleanPhone = product.sellerPhone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Lỗi', 'Không thể khởi động ứng dụng gọi điện trên thiết bị.');
    });
  };

  // Định dạng ngày đăng
  const formatPostTime = (dateString?: string) => {
    if (!dateString) return 'Vừa xong';
    try {
      const date = new Date(dateString.replace(' ', 'T'));
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.notFoundTitle, { color: colors.text }]}>Không tìm thấy sản phẩm</Text>
        <Text style={[styles.notFoundSubtitle, { color: colors.textSecondary }]}>
          Món đồ này có thể đã bị xóa hoặc không tồn tại.
        </Text>
        <AppButton
          title="Quay lại"
          onPress={() => router.back()}
          style={styles.backHomeButton}
          variant="outline"
        />
      </View>
    );
  }

  const isSold = product.status === 'sold';
  const categoryItem = CATEGORIES.find((cat) => cat.id === product.category);
  const categoryLabel = categoryItem?.label || 'Đồ sinh viên';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Ảnh sản phẩm lớn ở đỉnh màn hình (chiều cao 300px, contentFit cover) */}
        <View style={styles.imageContainer}>
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.productImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.border }]}>
              <Ionicons name="image-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>
                Không có hình ảnh
              </Text>
            </View>
          )}

          {/* Badge ĐÃ BÁN to trên ảnh nếu status === 'sold' */}
          {isSold && (
            <View style={[styles.soldOverlayBadge, { backgroundColor: colors.danger }]}>
              <Text style={styles.soldBadgeText}>ĐÃ BÁN</Text>
            </View>
          )}

          {/* Nút mũi tên Back tròn ở góc trên bên trái ảnh */}
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                top: insets.top + Spacing.sm,
              },
            ]}
            onPress={() => router.back()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Nội dung chi tiết */}
        <View style={styles.contentWrapper}>
          {/* Giá tiền nổi bật với màu Colors.light.price (font to đậm) */}
          <View style={styles.priceRow}>
            <Text style={[styles.priceText, { color: Colors.light.price }]}>
              {product.price === 0 ? 'Tặng miễn phí' : `${product.price.toLocaleString('vi-VN')} ₫`}
            </Text>
            {isSold && (
              <Badge
                label="ĐÃ BÁN"
                variant="warning"
                style={styles.statusBadge}
              />
            )}
          </View>

          {/* Tiêu đề món đồ */}
          <Text style={[styles.title, { color: colors.text }]}>{product.title}</Text>

          {/* Hàng badge: Danh mục, Vị trí KTX, Thời gian đăng tin */}
          <View style={styles.badgesRow}>
            <Badge label={categoryLabel} variant="primary" />

            <View style={[styles.chipTag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="location-outline" size={14} color={colors.primary} />
              <Text style={[styles.chipTagText, { color: colors.text }]}>
                {product.location}
              </Text>
            </View>

            <View style={[styles.chipTag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.chipTagText, { color: colors.textSecondary }]}>
                {formatPostTime(product.createdAt)}
              </Text>
            </View>
          </View>

          {/* Đường ngăn cách */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Khối thông tin Người bán: Họ tên, Mã sinh viên */}
          <View style={[styles.sellerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.sellerAvatar, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
            <View style={styles.sellerInfo}>
              <Text style={[styles.sellerName, { color: colors.text }]}>{product.sellerName}</Text>
              <Text style={[styles.sellerStudentId, { color: colors.textSecondary }]}>
                MSSV: {product.sellerStudentId}
              </Text>
            </View>
            <Badge label="Sinh viên" variant="success" />
          </View>

          {/* Đoạn văn bản mô tả chi tiết tình trạng món đồ */}
          <View style={[styles.descSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mô tả chi tiết</Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {product.description?.trim() || 'Người bán không để lại mô tả chi tiết cho món đồ này.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Thanh cố định dưới đáy màn hình (Bottom Action Bar) */}
      <View
        style={[
          styles.bottomActionBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, Spacing.sm),
          },
        ]}
      >
        <AppButton
          title={isSold ? 'Món đồ đã được bán' : 'Liên hệ người bán'}
          onPress={handleContactSeller}
          disabled={isSold}
          style={[styles.contactButton, isSold && styles.disabledButton]}
          icon={<Ionicons name="call" size={20} color={colors.white} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  notFoundTitle: {
    ...Typography.title,
    marginTop: Spacing.md,
  },
  notFoundSubtitle: {
    ...Typography.body,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  backHomeButton: {
    minWidth: 160,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 300,
  },
  imagePlaceholder: {
    width: '100%',
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  soldOverlayBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  soldBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
  backButton: {
    position: 'absolute',
    left: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  contentWrapper: {
    padding: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  priceText: {
    fontSize: 26,
    fontWeight: '800',
  },
  statusBadge: {
    alignSelf: 'center',
  },
  title: {
    ...Typography.title,
    fontSize: 20,
    lineHeight: 28,
    marginBottom: Spacing.sm,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  chipTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.xs - 1,
    paddingHorizontal: Spacing.sm,
  },
  chipTagText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  sellerAvatar: {
    width: 46,
    height: 46,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    ...Typography.subTitle,
    fontWeight: '700',
  },
  sellerStudentId: {
    ...Typography.caption,
    marginTop: 2,
  },
  descSection: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  sectionTitle: {
    ...Typography.subTitle,
    marginBottom: Spacing.sm,
  },
  descriptionText: {
    ...Typography.body,
    lineHeight: 22,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  contactButton: {
    width: '100%',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
