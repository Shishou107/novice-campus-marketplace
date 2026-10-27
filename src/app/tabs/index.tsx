import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { ProductCard } from '@/components/ProductCard';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { getProducts } from '@/services/db';
import { ProductWithSeller } from '@/types';

export default function HomeScreen() {
  const colors = useTheme();
  const { user } = useAuth();

  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Lấy dữ liệu sản phẩm trực tiếp từ SQLite (chỉ lấy đồ available)
  const fetchProducts = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await getProducts({ status: 'available' });
      setProducts(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách sản phẩm:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Tự động load dữ liệu mới nhất khi người dùng mở hoặc chuyển tab quay lại
  useFocusEffect(
    useCallback(() => {
      fetchProducts(false);
    }, [fetchProducts])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(false);
  }, [fetchProducts]);

  const handleNavigateToExplore = () => {
    try {
      router.push('/(tabs)/explore' as any);
    } catch {
      router.push('/tabs/explore' as any);
    }
  };

  const handleNavigateToSell = () => {
    try {
      router.push('/(tabs)/sell' as any);
    } catch {
      router.push('/tabs/sell' as any);
    }
  };

  const handleProductPress = (productId: number) => {
    router.push(('/product/' + productId) as any);
  };

  // Cân bằng lưới 2 cột: thêm phần tử đệm nếu số lượng lẻ để không bị giãn ô cuối
  const formattedProducts = React.useMemo(() => {
    if (products.length % 2 !== 0) {
      return [
        ...products,
        {
          id: -1,
          userId: -1,
          title: '',
          price: 0,
          category: 'other' as any,
          location: '',
          status: 'available' as any,
          createdAt: '',
          sellerName: '',
          sellerStudentId: '',
        } as ProductWithSeller,
      ];
    }
    return products;
  }, [products]);

  // Header của danh sách bao gồm Lời chào, Search bar giả và Banner
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 1. Header Trang chủ: Lời chào kèm tên người dùng nếu đã đăng nhập */}
      <View style={styles.greetingSection}>
        <View style={styles.greetingTextContainer}>
          <Text style={[styles.greetingTitle, { color: colors.text }]}>
            Chợ sinh viên Novice 👋
          </Text>
          {user ? (
            <View style={styles.userBadgeRow}>
              <Ionicons name="sparkles" size={14} color={colors.primary} />
              <Text style={[styles.greetingUserText, { color: colors.primary }]}>
                Xin chào, {user.name}
              </Text>
            </View>
          ) : (
            <Text style={[styles.greetingSubText, { color: colors.textSecondary }]}>
              Khám phá đồ dùng ký túc xá giá sinh viên
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.headerAvatarButton, { backgroundColor: colors.primaryLight }]}
          activeOpacity={0.8}
          onPress={() => {
            try {
              router.push('/(tabs)/profile' as any);
            } catch {
              router.push('/tabs/profile' as any);
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Trang cá nhân"
        >
          <Ionicons
            name={user ? 'person' : 'person-outline'}
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* 1. Thanh tìm kiếm giả (Search input thanh lịch chuyển sang tab Khám phá) */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleNavigateToExplore}
        style={[
          styles.fakeSearchBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Chạm để chuyển sang tab Khám phá"
      >
        <Ionicons
          name="search-outline"
          size={19}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        <Text style={[styles.searchPlaceholder, { color: colors.textSecondary }]}>
          Tìm giáo trình, đồ gia dụng, xe máy KTX...
        </Text>
        <View style={[styles.searchActionBadge, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="arrow-forward" size={14} color={colors.primary} />
        </View>
      </TouchableOpacity>

      {/* 2. Banner nổi bật nhỏ gọn gàng */}
      <View
        style={[
          styles.bannerCard,
          {
            backgroundColor: colors.primaryLight,
            borderColor: colors.primary + '30',
          },
        ]}
      >
        <View style={[styles.bannerIconBox, { backgroundColor: colors.primary }]}>
          <Ionicons name="school" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.bannerContent}>
          <View style={styles.bannerTagRow}>
            <Text style={[styles.bannerTag, { color: colors.primary }]}>
              DÀNH CHO SINH VIÊN KTX
            </Text>
          </View>
          <Text style={[styles.bannerTitle, { color: colors.text }]}>
            Trao đổi giáo trình & đồ dùng sinh viên tiết kiệm, uy tín trong ký túc xá
          </Text>
        </View>
      </View>

      {/* Tiêu đề phần danh sách sản phẩm */}
      <View style={styles.listSectionHeader}>
        <View style={styles.listTitleRow}>
          <Ionicons name="flame" size={20} color={colors.price} />
          <Text style={[styles.listSectionTitle, { color: colors.text }]}>
            Tin đăng mới nhất
          </Text>
        </View>
        {products.length > 0 && (
          <Text style={[styles.listCountText, { color: colors.textSecondary }]}>
            {products.length} món đồ
          </Text>
        )}
      </View>
    </View>
  );

  // 3. Giao diện thông báo dễ thương khi danh sách sản phẩm trống
  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Đang tải dữ liệu chợ sinh viên...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconCircle, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="storefront-outline" size={48} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Chưa có món đồ nào
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Chưa có món đồ nào, bạn hãy là người đầu tiên đăng bán nhé!
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.sellButton, { backgroundColor: colors.primary }]}
          onPress={handleNavigateToSell}
          accessibilityRole="button"
          accessibilityLabel="Chuyển sang trang đăng bán"
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" style={styles.sellButtonIcon} />
          <Text style={styles.sellButtonText}>Đăng bán ngay</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <StatusBar style="auto" />
      <FlatList
        data={isLoading && products.length === 0 ? [] : formattedProducts}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.flatListContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
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
          if (item.id === -1) {
            return <View style={styles.cardPlaceholder} />;
          }
          return (
            <View style={styles.cardItemWrapper}>
              <ProductCard
                product={item}
                onPress={() => handleProductPress(item.id)}
              />
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: Spacing.xl * 2,
  },
  headerContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  // 1. Header greeting
  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  greetingTextContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  userBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  greetingUserText: {
    fontSize: 14,
    fontWeight: '600',
  },
  greetingSubText: {
    fontSize: 13,
    marginTop: 2,
  },
  headerAvatarButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 1. Thanh tìm kiếm giả (Search input thanh lịch)
  fakeSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
  },
  searchActionBadge: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  // 2. Banner nổi bật
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTagRow: {
    marginBottom: 2,
  },
  bannerTag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  // Section Title
  listSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  listCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // 3. Grid 2 cột
  columnWrapper: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  cardItemWrapper: {
    flex: 1,
  },
  cardPlaceholder: {
    flex: 1,
  },
  // Trạng thái trống (Empty state)
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl * 1.5,
    paddingBottom: Spacing.xl,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  sellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radius.full,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  sellButtonIcon: {
    marginRight: 6,
  },
  sellButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 13,
  },
});
