import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/common/AppButton';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useNetwork } from '@/context/NetworkContext';
import { useTheme } from '@/hooks/use-theme';
import { clearCart, getCartItems, removeFromCart, updateCartQuantity } from '@/services/db';
import { CartItem } from '@/types';
import { formatPrice } from '@/components/ProductCard';

export default function CartScreen() {
  const colors = useTheme();
  const { user, isLoggedIn } = useAuth();
  const { isConnected } = useNetwork();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const items = await getCartItems(user.id);
      setCartItems(items);
    } catch (err) {
      console.error('Lỗi khi tải giỏ hàng:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [fetchCart])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCart();
  };

  const handleQuantityChange = async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(item);
      return;
    }

    if (item.product && newQty > item.product.stock) {
      Alert.alert('Vượt tồn kho', `Sản phẩm này chỉ còn ${item.product.stock} món.`);
      return;
    }

    await updateCartQuantity(item.id, newQty);
    setCartItems((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, quantity: newQty } : c))
    );
  };

  const handleRemoveItem = (item: CartItem) => {
    Alert.alert('Xóa món đồ', 'Bạn muốn bỏ món đồ này khỏi giỏ hàng?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          await removeFromCart(item.id);
          setCartItems((prev) => prev.filter((c) => c.id !== item.id));
        },
      },
    ]);
  };

  const handleClearCart = () => {
    if (!user || cartItems.length === 0) return;
    Alert.alert('Dọn sạch giỏ hàng', 'Bạn có chắc muốn xóa tất cả món đồ trong giỏ?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Dọn sạch',
        style: 'destructive',
        onPress: async () => {
          await clearCart(user.id);
          setCartItems([]);
        },
      },
    ]);
  };

  const handleProceedCheckout = () => {
    if (!isLoggedIn || !user) {
      Alert.alert('Yêu cầu tài khoản', 'Vui lòng đăng nhập tài khoản sinh viên trước khi đặt đơn.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/auth' as any) },
      ]);
      return;
    }

    if (cartItems.length === 0) return;

    if (!isConnected) {
      Alert.alert('Mất mạng', 'Bạn đang ngoại tuyến. Vui lòng kết nối Wi-Fi trường DNTU để hẹn gặp và đặt hàng.');
      return;
    }

    // Mở màn hình hẹn gặp trên bản đồ cho sản phẩm đầu tiên hoặc tạo đơn
    const firstItem = cartItems[0];
    router.push({
      pathname: '/meetup-modal',
      params: { productId: firstItem.productId.toString() },
    });
  };

  // Tính toán theo công thức đề bài:
  // Tạm tính = Tổng(Giá sản phẩm * Số lượng)
  // Tổng tiền = Tạm tính + Phí giao hàng (0đ khi gặp trực tiếp tại trường DNTU)
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );
  const deliveryFee = 0; // 0đ khi giao nhận trực tiếp tại khuôn viên DNTU
  const total = subtotal + deliveryFee;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>Giỏ hàng sinh viên</Text>

        {cartItems.length > 0 ? (
          <TouchableOpacity onPress={handleClearCart} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang tải giỏ hàng...</Text>
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="cart-outline" size={54} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Giỏ hàng đang trống</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Khám phá giáo trình và đồ dùng sinh viên DNTU đang được pass lại với giá rẻ!
          </Text>
          <AppButton
            title="Khám phá ngay"
            onPress={() => router.push('/(tabs)/explore' as any)}
            icon={<Ionicons name="compass-outline" size={18} color={colors.white} />}
            style={{ marginTop: Spacing.sm }}
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => {
              const prod = item.product;
              if (!prod) return null;
              return (
                <View style={[styles.cartItemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {/* Thumbnail */}
                  <View style={[styles.thumbWrapper, { backgroundColor: colors.background }]}>
                    {prod.imageUrl ? (
                      <Image source={{ uri: prod.imageUrl }} style={styles.thumbImage} resizeMode="cover" />
                    ) : (
                      <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
                      {prod.title}
                    </Text>
                    <Text style={[styles.itemPrice, { color: prod.price === 0 ? colors.success : colors.price }]}>
                      {prod.price === 0 ? 'Tặng 0đ' : formatPrice(prod.price)}
                    </Text>
                    <Text style={[styles.itemStock, { color: colors.textSecondary }]}>
                      Tồn kho: còn {prod.stock} món • {prod.location}
                    </Text>

                    {/* Quantity Controls */}
                    <View style={styles.quantityRow}>
                      <View style={[styles.qtyBox, { borderColor: colors.border }]}>
                        <TouchableOpacity
                          onPress={() => handleQuantityChange(item, -1)}
                          style={styles.qtyBtn}
                        >
                          <Ionicons name="remove" size={14} color={colors.text} />
                        </TouchableOpacity>

                        <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>

                        <TouchableOpacity
                          onPress={() => handleQuantityChange(item, 1)}
                          style={styles.qtyBtn}
                        >
                          <Ionicons name="add" size={14} color={colors.text} />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity onPress={() => handleRemoveItem(item)} style={styles.itemTrashBtn}>
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
          />

          {/* Sticky Checkout Summary Footer */}
          <View style={[styles.checkoutFooter, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View style={styles.calcRow}>
              <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Tạm tính:</Text>
              <Text style={[styles.calcValue, { color: colors.text }]}>{formatPrice(subtotal)}</Text>
            </View>

            <View style={styles.calcRow}>
              <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Phí gặp trực tiếp DNTU:</Text>
              <Text style={[styles.calcValue, { color: colors.success }]}>0 đ (Miễn phí)</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.calcRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Tổng thanh toán:</Text>
              <Text style={[styles.totalValue, { color: colors.price }]}>{formatPrice(total)}</Text>
            </View>

            <AppButton
              title="Hẹn điểm gặp tại trường DNTU"
              variant="primary"
              onPress={handleProceedCheckout}
              icon={<Ionicons name="map" size={18} color={colors.white} />}
              style={styles.checkoutBtn}
            />
          </View>
        </View>
      )}
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
  },
  loadingText: {
    marginTop: Spacing.sm,
    ...Typography.body,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1.5,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    ...Typography.subTitle,
    fontWeight: '800',
  },
  clearBtn: {
    padding: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.title,
    fontSize: 20,
    fontWeight: '800',
  },
  emptySubtitle: {
    ...Typography.body,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl + 20,
    gap: Spacing.sm,
  },
  cartItemCard: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    padding: Spacing.sm,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  thumbWrapper: {
    width: 80,
    height: 80,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  itemPrice: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  itemStock: {
    fontSize: 10.5,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  qtyText: {
    paddingHorizontal: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  itemTrashBtn: {
    padding: 4,
  },
  checkoutFooter: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm + 2,
    paddingBottom: Spacing.md + 6,
    borderTopWidth: 1.5,
    gap: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 12,
  },
  calcValue: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 2,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '900',
  },
  checkoutBtn: {
    marginTop: 4,
  },
});
