import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { NetworkBanner } from '@/components/NetworkBanner';
import { ProductCard } from '@/components/ProductCard';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { getProducts } from '@/services/db';
import { CATEGORIES, ProductCategory, ProductWithSeller } from '@/types';

export default function HomeScreen() {
  const colors = useTheme();
  const { user } = useAuth();

  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchProducts = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await getProducts({ status: 'available', currentUserId: user?.id });
      setProducts(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách sản phẩm:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchProducts(false);
      // Tự động kiểm tra món đồ mới từ các thiết bị khác mỗi 4 giây
      const timer = setInterval(() => {
        fetchProducts(false);
      }, 4000);
      return () => clearInterval(timer);
    }, [fetchProducts])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(false);
  }, [fetchProducts]);

  const handleNavigateToSell = () => {
    router.push('/tabs/sell' as any);
  };

  const handleProductPress = (productId: number) => {
    router.push(('/product/' + productId) as any);
  };

  // Filter products by selected quick category and search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q) ?? false;
        const matchSeller = p.sellerName.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchSeller) return false;
      }
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  const formattedProducts = useMemo(() => {
    if (filteredProducts.length % 2 !== 0) {
      return [
        ...filteredProducts,
        {
          id: -1,
          userId: -1,
          title: '',
          price: 0,
          stock: 0,
          category: 'other' as any,
          location: '',
          status: 'available' as any,
          createdAt: '',
          sellerName: '',
          sellerStudentId: '',
        } as ProductWithSeller,
      ];
    }
    return filteredProducts;
  }, [filteredProducts]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 1. Header Greeting with DNTU branding */}
      <View style={styles.greetingSection}>
        <View style={styles.greetingTextContainer}>
          <View style={[styles.brandPill, { borderColor: colors.primary }]}>
            <Text style={[styles.brandPillText, { color: colors.primary }]}>DNTU CAMPUS MARKETPLACE</Text>
          </View>
          <Text style={[styles.greetingTitle, { color: colors.text }]}>
            {user ? `Chào ${user.name}` : 'Chợ sinh viên DNTU'}
          </Text>
          <Text style={[styles.greetingSubText, { color: colors.textSecondary }]}>
            Mua bán giáo trình & đồ KTX trong khuôn viên trường
          </Text>
        </View>

        {/* Header Right Action Icons */}
        <View style={styles.headerIconsRow}>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push('/favorites' as any)}
            accessibilityLabel="Mục yêu thích"
          >
            <Ionicons name="heart-outline" size={18} color={colors.price} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push('/cart' as any)}
            accessibilityLabel="Giỏ hàng"
          >
            <Ionicons name="cart-outline" size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push('/tabs/profile' as any)}
            accessibilityLabel="Hồ sơ sinh viên"
          >
            <Ionicons name={user ? 'person' : 'person-outline'} size={17} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. DNTU Campus Broadcast Ticker */}
      <View style={[styles.tickerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.tickerDot, { backgroundColor: colors.accent }]} />
        <Text style={[styles.tickerText, { color: colors.text }]} numberOfLines={1}>
          <Text style={{ fontWeight: '800' }}>TIN NHANH DNTU:</Text> Pass sách ĐHBK • Hẹn gặp tại Cổng A, Thư viện, Căn tin • Tiết kiệm cho sinh viên
        </Text>
      </View>

      {/* 3. Real Search Bar Input */}
      <View
        style={[
          styles.realSearchBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={18}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Tìm tên môn học, giáo trình DNTU, đồ dùng..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.realSearchInput, { color: colors.text }]}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 4. Category Quick Filter Bar */}
      <View style={styles.categoriesRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
          keyboardShouldPersistTaps="handled"
        >
          {[
            { id: 'all' as const, label: 'Tất cả' },
            ...CATEGORIES,
          ].map((item) => {
            const isSelected = selectedCategory === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedCategory(item.id)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : colors.surface,
                    borderColor: isSelected
                      ? colors.primary
                      : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color: isSelected
                        ? colors.white
                        : colors.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 5. Hero Promo Card DNTU */}
      <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.heroContent}>
          <View style={[styles.heroBadge, { backgroundColor: colors.butter, borderColor: colors.border }]}>
            <Text style={styles.heroBadgeText}>SƠ ĐỒ HẸN GẶP NỘI BỘ DNTU</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Giao nhận an toàn ngay trong trường
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Thống nhất điểm hẹn tại Cổng A, Thư viện, Căn tin... Kiểm tra đồ trực tiếp trước khi thanh toán.
          </Text>
          <TouchableOpacity
            onPress={handleNavigateToSell}
            style={[styles.heroActionBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add-circle" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.heroActionBtnText}>Đăng thanh lý món đồ ngay</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 6. Section Header */}
      <View style={styles.listSectionHeader}>
        <View style={styles.listTitleRow}>
          <Ionicons name="flash" size={18} color={colors.primary} />
          <Text style={[styles.listSectionTitle, { color: colors.text }]}>
            {selectedCategory === 'all'
              ? 'Món đồ mới đăng tại DNTU'
              : CATEGORIES.find((c) => c.id === selectedCategory)?.label || 'Tin đăng'}
          </Text>
        </View>
        <Text style={[styles.listCountText, { color: colors.textSecondary }]}>
          {filteredProducts.length} món đồ
        </Text>
      </View>
    </View>
  );

  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Đang tải dữ liệu Chợ sinh viên DNTU...
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.emptyIconCircle, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
          <Ionicons name="storefront-outline" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {selectedCategory !== 'all' ? 'Chưa có món đồ trong danh mục này' : 'Chưa có món đồ nào'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Bạn có giáo trình cũ hay đồ dùng KTX không dùng nữa? Hãy là người đầu tiên đăng bán nhé!
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.sellButton, { backgroundColor: colors.primary }]}
          onPress={handleNavigateToSell}
        >
          <Ionicons name="add-circle" size={18} color="#FFFFFF" style={styles.sellButtonIcon} />
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
      <NetworkBanner />
      <FlatList
        data={isLoading && products.length === 0 ? [] : formattedProducts}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.flatListContent}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={renderEmptyComponent()}
        keyboardShouldPersistTaps="handled"
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
                onFavoriteChanged={() => fetchProducts(false)}
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
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  greetingTextContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  brandPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginBottom: 4,
  },
  brandPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  greetingSubText: {
    fontSize: 12.5,
    marginTop: 2,
  },
  headerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  tickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    gap: 8,
  },
  tickerDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  tickerText: {
    flex: 1,
    fontSize: 11.5,
  },
  realSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  realSearchInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
    paddingVertical: 0,
  },
  fakeSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
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
  categoriesRow: {
    marginTop: 2,
  },
  categoryScroll: {
    gap: Spacing.xs + 2,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  categoryChipText: {
    fontSize: 12,
  },
  heroCard: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  heroContent: {
    gap: 6,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  heroBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#12140F',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    marginTop: 4,
  },
  heroActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  listCountText: {
    fontSize: 12,
  },
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    marginHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  sellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  sellButtonIcon: {
    marginRight: 6,
  },
  sellButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
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
