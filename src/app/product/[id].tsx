import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/common/AppButton';
import { ProductCard } from '@/components/ProductCard';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import {
  addToCart,
  deleteProduct,
  getProductById,
  getProducts,
  toggleFavorite,
  updateProductStatus,
} from '@/services/db';
import { CATEGORIES, ProductWithSeller } from '@/types';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useTheme();
  const { user, isLoggedIn } = useAuth();

  const [product, setProduct] = useState<ProductWithSeller | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductWithSeller[]>([]);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [isAddingCart, setIsAddingCart] = useState<boolean>(false);
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);

  const productId = id ? parseInt(id, 10) : NaN;

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function fetchDetail() {
        if (isNaN(productId)) {
          if (isMounted) setIsLoading(false);
          return;
        }

        try {
          if (isMounted) setIsLoading(true);
          const data = await getProductById(productId, user?.id);
          if (isMounted) {
            setProduct(data);
            setIsFavorited(Boolean(data?.isFavorited));
            if (data) {
              const related = await getProducts({
                category: data.category,
                status: 'available',
                currentUserId: user?.id,
              });
              if (isMounted) {
                setRelatedProducts(related.filter((item) => item.id !== data.id).slice(0, 4));
              }
            }
          }
        } catch (error) {
          console.error('Lỗi khi tải chi tiết sản phẩm:', error);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }

      fetchDetail();

      return () => {
        isMounted = false;
      };
    }, [productId, user])
  );

  const isOwner = user && product && user.id === product.userId;

  const handleToggleFav = async () => {
    if (!isLoggedIn || !user) {
      Alert.alert('Yêu cầu tài khoản', 'Đăng nhập để lưu món đồ yêu thích.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/auth' as any) },
      ]);
      return;
    }

    if (!product) return;
    const nextState = !isFavorited;
    setIsFavorited(nextState);
    await toggleFavorite(user.id, product.id);
  };

  const handleAddToCart = async () => {
    if (!isLoggedIn || !user) {
      Alert.alert('Yêu cầu tài khoản', 'Vui lòng đăng nhập trước khi thêm vào giỏ hàng.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/auth' as any) },
      ]);
      return;
    }

    if (!product) return;
    if (isOwner) {
      Alert.alert('Thông báo', 'Bạn không thể thêm món đồ của chính mình vào giỏ hàng.');
      return;
    }

    try {
      setIsAddingCart(true);
      const res = await addToCart(user.id, product.id, 1);
      if (res.success) {
        Alert.alert('Thành công', `Đã thêm "${product.title}" vào giỏ hàng của bạn!`, [
          { text: 'Tiếp tục xem', style: 'cancel' },
          { text: 'Xem giỏ hàng', onPress: () => router.push('/cart' as any) },
        ]);
      } else {
        Alert.alert('Lỗi', res.error || 'Không thể thêm vào giỏ hàng.');
      }
    } finally {
      setIsAddingCart(false);
    }
  };

  const handleMeetup = () => {
    if (!product) return;
    if (!isLoggedIn) {
      Alert.alert('Yêu cầu tài khoản', 'Đăng nhập tài khoản sinh viên để hẹn điểm gặp tại trường.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/auth' as any) },
      ]);
      return;
    }
    if (isOwner) {
      Alert.alert('Thông báo', 'Bạn không thể hẹn mua món đồ do chính mình đăng.');
      return;
    }

    router.push({
      pathname: '/meetup-modal',
      params: { productId: product.id.toString() },
    });
  };

  const handleCall = () => {
    if (!product?.sellerPhone) {
      Alert.alert('Thông báo', 'Người bán chưa cung cấp số điện thoại.');
      return;
    }
    Linking.openURL(`tel:${product.sellerPhone}`);
  };

  const handleZalo = () => {
    if (!product?.sellerPhone) {
      Alert.alert('Thông báo', 'Người bán chưa cung cấp số điện thoại liên hệ.');
      return;
    }
    const cleanPhone = product.sellerPhone.replace(/[^0-9]/g, '');
    Linking.openURL(`https://zalo.me/${cleanPhone}`).catch(() => {
      Linking.openURL(`sms:${cleanPhone}`);
    });
  };

  const handleCopyPhone = () => {
    if (!product?.sellerPhone) return;
    Clipboard.setString(product.sellerPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `[Chợ SV DNTU] Pass đồ: ${product.title} - Giá: ${
          product.price === 0 ? 'Tặng 0đ' : `${product.price.toLocaleString('vi-VN')}đ`
        } tại ${product.location}!`,
      });
    } catch {
      // bỏ qua
    }
  };

  const handleToggleSold = async () => {
    if (!product || !user) return;
    const newStatus = product.status === 'available' ? 'sold' : 'available';
    const actionText = newStatus === 'sold' ? 'Đánh dấu đã thanh lý' : 'Mở bán lại';

    Alert.alert('Xác nhận', `Bạn có chắc muốn ${actionText.toLowerCase()} món đồ này?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đồng ý',
        onPress: async () => {
          setIsActionLoading(true);
          const ok = await updateProductStatus(product.id, newStatus, user.id);
          setIsActionLoading(false);
          if (ok) {
            setProduct((prev) => (prev ? { ...prev, status: newStatus } : null));
            Alert.alert('Thành công', `Đã cập nhật trạng thái món đồ.`);
          } else {
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái.');
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!product || !user) return;
    Alert.alert('Xóa bài đăng', 'Bạn có chắc chắn muốn xóa tin đăng này? Thao tác này không thể hoàn tác.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa vĩnh viễn',
        style: 'destructive',
        onPress: async () => {
          setIsActionLoading(true);
          const ok = await deleteProduct(product.id, user.id);
          setIsActionLoading(false);
          if (ok) {
            Alert.alert('Thành công', 'Đã xóa bài đăng.', [
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]);
          } else {
            Alert.alert('Lỗi', 'Không thể xóa bài đăng.');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang tải chi tiết món đồ...</Text>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={56} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Không tìm thấy sản phẩm</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Món đồ này có thể đã bị xóa hoặc người bán đã gỡ bỏ.
        </Text>
        <AppButton title="Quay lại" onPress={() => router.back()} style={{ marginTop: Spacing.md }} />
      </SafeAreaView>
    );
  }

  const categoryLabel = CATEGORIES.find((c) => c.id === product.category)?.label || product.category;
  const isFree = product.price === 0;
  const isSold = product.status === 'sold';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Top Floating Navigation Header */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.circleButton, { backgroundColor: colors.background, borderColor: colors.border }]}
          accessibilityLabel="Quay lại"
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Chi tiết món đồ DNTU
        </Text>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            onPress={handleToggleFav}
            style={[styles.circleButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            accessibilityLabel="Yêu thích"
          >
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorited ? colors.price : colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/cart' as any)}
            style={[styles.circleButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            accessibilityLabel="Giỏ hàng"
          >
            <Ionicons name="cart-outline" size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            style={[styles.circleButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            accessibilityLabel="Chia sẻ"
          >
            <Ionicons name="share-social-outline" size={17} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Product Image Container */}
        <View style={[styles.imageWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.background }]}>
              <Ionicons name="image-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>Chưa có ảnh sản phẩm</Text>
            </View>
          )}

          {/* Badges Overlay */}
          <View style={styles.imageBadgesRow}>
            <View style={[styles.pillBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="bookmark-outline" size={12} color={colors.primary} />
              <Text style={[styles.pillBadgeText, { color: colors.text }]}>{categoryLabel}</Text>
            </View>

            <View style={[styles.pillBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="location-sharp" size={12} color={colors.price} />
              <Text style={[styles.pillBadgeText, { color: colors.text }]}>{product.location}</Text>
            </View>
          </View>

          {isSold ? (
            <View style={[styles.soldOverlay, { backgroundColor: 'rgba(18, 20, 15, 0.75)' }]}>
              <View style={[styles.soldBadge, { backgroundColor: colors.butter, borderColor: colors.border }]}>
                <Text style={styles.soldBadgeText}>ĐÃ THANH LÝ</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Pricing, Stock & Title Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.priceRow}>
            {isFree ? (
              <View style={[styles.acidFreeTag, { backgroundColor: colors.acid, borderColor: colors.border }]}>
                <Ionicons name="gift-outline" size={16} color="#12140F" />
                <Text style={styles.acidFreeText}>TẶNG 0Đ MIỄN PHÍ</Text>
              </View>
            ) : (
              <Text style={[styles.priceLarge, { color: colors.price }]}>
                {product.price.toLocaleString('vi-VN')} <Text style={styles.currency}>đ</Text>
              </Text>
            )}

            <View style={[styles.statusIndicator, { backgroundColor: isSold ? colors.border : colors.successLight }]}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isSold ? colors.textSecondary : colors.success },
                ]}
              />
              <Text style={[styles.statusText, { color: isSold ? colors.textSecondary : colors.success }]}>
                {isSold ? 'Đã bán' : 'Đang mở bán'}
              </Text>
            </View>
          </View>

          <Text style={[styles.productTitle, { color: colors.text }]}>{product.title}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              Tồn kho: <Text style={{ fontWeight: '700', color: colors.text }}>{product.stock} món</Text> • Đăng tại: {product.location}
            </Text>
          </View>
        </View>

        {/* Nút Gọi hành động nhanh Mini Map Hẹn gặp */}
        {!isOwner && !isSold ? (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleMeetup}
            style={[styles.miniMapPromoBanner, { backgroundColor: colors.surface, borderColor: colors.primary }]}
          >
            <View style={[styles.miniMapIconCircle, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="map" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.miniMapPromoTag}>
                <Text style={styles.miniMapPromoTagText}>TÍNH NĂNG ĐẶC BIỆT DNTU</Text>
              </View>
              <Text style={[styles.miniMapPromoTitle, { color: colors.text }]}>Hẹn gặp tại điểm trong trường</Text>
              <Text style={[styles.miniMapPromoSub, { color: colors.textSecondary }]}>
                Chọn Cổng A, Thư viện, Căn tin... trên sơ đồ DNTU để gặp nhận đồ an toàn
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        ) : null}

        {/* Description Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: colors.primary }]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mô tả chi tiết</Text>
          </View>
          <Text style={[styles.descriptionText, { color: colors.text }]}>
            {product.description?.trim() ? product.description : 'Người bán không để lại mô tả bổ sung.'}
          </Text>
        </View>

        {/* Seller Info Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: colors.accent }]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Thông tin người bán</Text>
          </View>

          <View style={styles.sellerRow}>
            <View style={[styles.sellerAvatar, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
              <Ionicons name="person" size={26} color={colors.primary} />
            </View>

            <View style={styles.sellerInfo}>
              <View style={styles.sellerNameRow}>
                <Text style={[styles.sellerName, { color: colors.text }]}>{product.sellerName}</Text>
                <View style={[styles.verifiedChip, { backgroundColor: colors.successLight }]}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                  <Text style={[styles.verifiedText, { color: colors.success }]}>Sinh viên DNTU</Text>
                </View>
              </View>

              <Text style={[styles.studentIdText, { color: colors.textSecondary }]}>
                Mã sinh viên: <Text style={{ fontWeight: '700', color: colors.text }}>{product.sellerStudentId || 'N/A'}</Text>
              </Text>

              {product.sellerPhone ? (
                <TouchableOpacity onPress={handleCopyPhone} style={styles.phoneRow}>
                  <Ionicons name="call-outline" size={13} color={colors.primary} />
                  <Text style={[styles.phoneText, { color: colors.primary }]}>{product.sellerPhone}</Text>
                  <Text style={[styles.copyHint, { color: colors.textSecondary }]}>
                    {copiedPhone ? '• Đã sao chép!' : '• Chạm để sao chép'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Safety Notice Banner */}
          <View style={[styles.safetyBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.safetyText, { color: colors.textSecondary }]}>
              Mẹo an toàn DNTU: Nên hẹn gặp tại Cổng trường hoặc Thư viện để kiểm tra đồ trực tiếp trước khi thanh toán.
            </Text>
          </View>
        </View>

        {/* Owner Controls */}
        {isOwner ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: Spacing.sm }]}>
              Quản lý bài đăng của bạn
            </Text>
            <View style={styles.ownerButtonsRow}>
              <AppButton
                title={product.status === 'available' ? 'Đánh dấu đã bán' : 'Mở bán lại'}
                variant={product.status === 'available' ? 'secondary' : 'primary'}
                onPress={handleToggleSold}
                loading={isActionLoading}
                icon={<Ionicons name="checkmark-done-circle-outline" size={18} color={colors.text} />}
                style={{ flex: 1 }}
              />
              <AppButton
                title="Xóa tin"
                variant="danger"
                onPress={handleDelete}
                loading={isActionLoading}
                icon={<Ionicons name="trash-outline" size={18} color={colors.white} />}
                style={{ flex: 0.8 }}
              />
            </View>
          </View>
        ) : null}

        {/* Related Products */}
        {relatedProducts.length > 0 ? (
          <View style={styles.relatedSection}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionAccent, { backgroundColor: colors.butter }]} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Món đồ cùng danh mục tại DNTU</Text>
            </View>
            <View style={styles.relatedGrid}>
              {relatedProducts.map((item) => (
                <View key={item.id} style={styles.relatedCol}>
                  <ProductCard
                    product={item}
                    onPress={() => {
                      router.push(('/product/' + item.id) as any);
                    }}
                  />
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      {!isOwner && !isSold ? (
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            onPress={handleAddToCart}
            style={[styles.cartActionBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            <Ionicons name="cart-outline" size={20} color={colors.text} />
            <Text style={[styles.cartActionText, { color: colors.text }]}>
              {isAddingCart ? '...' : 'Thêm giỏ'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleZalo}
            style={[styles.smallActionBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            <Ionicons name="chatbubbles-outline" size={18} color={colors.text} />
            <Text style={[styles.smallActionText, { color: colors.text }]}>Zalo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCall}
            style={[styles.smallActionBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            <Ionicons name="call-outline" size={18} color={colors.text} />
            <Text style={[styles.smallActionText, { color: colors.text }]}>Gọi</Text>
          </TouchableOpacity>

          <AppButton
            title="Hẹn gặp tại trường"
            variant="primary"
            onPress={handleMeetup}
            icon={<Ionicons name="map" size={17} color={colors.white} />}
            style={styles.meetupMainBtn}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.body,
  },
  emptyTitle: {
    ...Typography.title,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1.5,
  },
  headerTitle: {
    ...Typography.subTitle,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.xs,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 110,
    gap: Spacing.md,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1.2,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  placeholderText: {
    ...Typography.caption,
  },
  imageBadgesRow: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 4,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  soldOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  soldBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#12140F',
    letterSpacing: 1,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLarge: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  currency: {
    fontSize: 18,
    fontWeight: '700',
  },
  acidFreeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
  },
  acidFreeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#12140F',
    letterSpacing: 0.5,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  productTitle: {
    ...Typography.title,
    fontSize: 20,
    lineHeight: 26,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    ...Typography.caption,
  },
  miniMapPromoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    borderRadius: Radius.lg,
    borderWidth: 2,
    gap: Spacing.sm,
  },
  miniMapIconCircle: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMapPromoTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(52, 72, 238, 0.1)',
    marginBottom: 2,
  },
  miniMapPromoTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#3448EE',
  },
  miniMapPromoTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  miniMapPromoSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionAccent: {
    width: 4,
    height: 16,
    borderRadius: Radius.full,
  },
  sectionTitle: {
    ...Typography.subTitle,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  descriptionText: {
    ...Typography.body,
    lineHeight: 22,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sellerAvatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  sellerInfo: {
    flex: 1,
    gap: 3,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  sellerName: {
    ...Typography.subTitle,
    fontWeight: '700',
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 3,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
  },
  studentIdText: {
    ...Typography.caption,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '700',
  },
  copyHint: {
    fontSize: 11,
  },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.xs + 2,
    marginTop: Spacing.xs,
  },
  safetyText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  ownerButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  relatedSection: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  relatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  relatedCol: {
    width: '48%',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md + 6,
    borderTopWidth: 1.5,
    gap: 6,
  },
  cartActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: 2,
  },
  cartActionText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  smallActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: 2,
  },
  smallActionText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  meetupMainBtn: {
    flex: 1,
  },
});