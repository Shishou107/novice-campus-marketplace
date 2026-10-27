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
import { Ionicons } from '@expo/vector-icons';

import { NetworkBanner } from '@/components/NetworkBanner';
import { ProductCard } from '@/components/ProductCard';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { getProducts } from '@/services/db';
import { CATEGORIES, ProductCategory, ProductWithSeller } from '@/types';

type PriceFilter = 'all' | 'under50k' | '50k-200k' | 'above200k';
type SortOption = 'newest' | 'priceAsc' | 'priceDesc';

const LOCATION_OPTIONS = [
  'Tất cả vị trí',
  'Thư viện DNTU (Tầng 1)',
  'Căn tin & Tự học',
  'Cổng chính DNTU (Cổng A)',
  'Giảng đường A (DNTU)',
  'Giảng đường B (DNTU)',
  'Nhà thi đấu Thể thao DNTU',
  'Khác',
];

const PRICE_OPTIONS: { id: PriceFilter; label: string }[] = [
  { id: 'all', label: 'Mọi mức giá' },
  { id: 'under50k', label: '< 50.000đ' },
  { id: '50k-200k', label: '50k - 200k' },
  { id: 'above200k', label: '> 200.000đ' },
];

export default function ExploreScreen() {
  const colors = useTheme();
  const { user } = useAuth();

  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('Tất cả vị trí');
  const [selectedPrice, setSelectedPrice] = useState<PriceFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const fetchProducts = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await getProducts({ status: 'available', currentUserId: user?.id });
      setProducts(data);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu khám phá:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchProducts(false);
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

  // Client-side filtering and sorting for instant responsive UI
  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        // 1. Text Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q) ?? false;
          const matchSeller = item.sellerName.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchSeller) return false;
        }

        // 2. Category Filter
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }

        // 3. Location Filter
        if (selectedLocation !== 'Tất cả vị trí') {
          if (!item.location.toLowerCase().includes(selectedLocation.toLowerCase().split(' ')[0])) {
            if (item.location !== selectedLocation) return false;
          }
        }

        // 4. Price Filter
        if (selectedPrice === 'under50k' && item.price >= 50000) return false;
        if (selectedPrice === '50k-200k' && (item.price < 50000 || item.price > 200000)) return false;
        if (selectedPrice === 'above200k' && item.price <= 200000) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priceAsc') return a.price - b.price;
        if (sortBy === 'priceDesc') return b.price - a.price;
        return (b.id || 0) - (a.id || 0); // newest default
      });
  }, [products, searchQuery, selectedCategory, selectedLocation, selectedPrice, sortBy]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'all' ||
    selectedLocation !== 'Tất cả vị trí' ||
    selectedPrice !== 'all';

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLocation('Tất cả vị trí');
    setSelectedPrice('all');
    setSortBy('newest');
  };

  const handleProductPress = (productId: number) => {
    router.push(('/product/' + productId) as any);
  };

  // Header Component for FlatList
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Title Banner & Quick Links */}
      <View style={styles.titleSection}>
        <View style={styles.topBarRow}>
          <View style={styles.brandBadge}>
            <Text style={[styles.brandBadgeText, { color: colors.primary }]}>DNTU CAMPUS EXPLORE</Text>
          </View>
          <View style={styles.topIconGroup}>
            <TouchableOpacity
              onPress={() => router.push('/favorites' as any)}
              style={[styles.headerIconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              accessibilityLabel="Danh sách yêu thích"
            >
              <Ionicons name="heart-outline" size={19} color={colors.price} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/cart' as any)}
              style={[styles.headerIconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              accessibilityLabel="Giỏ hàng"
            >
              <Ionicons name="cart-outline" size={19} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.mainTitle, { color: colors.text }]}>Khám phá đồ sinh viên</Text>
        <Text style={[styles.mainSubtitle, { color: colors.textSecondary }]}>
          Tìm giáo trình DNTU, tài liệu học phần và phụ kiện sinh viên giá rẻ
        </Text>
      </View>

      {/* Styled Search Bar with Retro Border */}
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={{ marginLeft: Spacing.xs }} />
        <TextInput
          placeholder="Tìm tên môn học, giáo trình DNTU, đồ dùng..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Pills Slider */}
      <View style={styles.filterSection}>
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Danh mục</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
          keyboardShouldPersistTaps="handled"
        >
          {[{ id: 'all' as const, label: 'Tất cả' }, ...CATEGORIES].map((item) => {
            const isSelected = selectedCategory === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedCategory(item.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? colors.white : colors.text,
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

      {/* Location Filter Pills */}
      <View style={styles.filterSection}>
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Địa điểm hẹn trong trường</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
          keyboardShouldPersistTaps="handled"
        >
          {LOCATION_OPTIONS.map((item) => {
            const isSelected = selectedLocation === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setSelectedLocation(item)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.surface : colors.background,
                    borderColor: isSelected ? colors.text : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="location-outline"
                  size={12}
                  color={isSelected ? colors.price : colors.textSecondary}
                  style={{ marginRight: 3 }}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? colors.text : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Price & Sort Row */}
      <View style={styles.filterSection}>
        <View style={styles.priceAndSortRow}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Mức giá</Text>
          {/* Quick Sort Toggle */}
          <TouchableOpacity
            onPress={() => {
              if (sortBy === 'newest') setSortBy('priceAsc');
              else if (sortBy === 'priceAsc') setSortBy('priceDesc');
              else setSortBy('newest');
            }}
            style={[styles.sortButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="swap-vertical" size={13} color={colors.primary} />
            <Text style={[styles.sortText, { color: colors.text }]}>
              {sortBy === 'newest' ? 'Mới nhất' : sortBy === 'priceAsc' ? 'Giá thấp -> cao' : 'Giá cao -> thấp'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
          keyboardShouldPersistTaps="handled"
        >
          {PRICE_OPTIONS.map((item) => {
            const isSelected = selectedPrice === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedPrice(item.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? colors.white : colors.text,
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

      {/* Results Header Status */}
      <View style={styles.resultStatsRow}>
        <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
          Tìm thấy <Text style={{ fontWeight: '800', color: colors.text }}>{filteredProducts.length}</Text> món đồ
        </Text>

        {hasActiveFilters ? (
          <TouchableOpacity onPress={resetAllFilters} style={styles.resetBtn}>
            <Ionicons name="reload-outline" size={13} color={colors.primary} />
            <Text style={[styles.resetText, { color: colors.primary }]}>Xóa bộ lọc</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Network Offline / Wi-Fi DNTU State Banner */}
      <NetworkBanner />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang tải kho đồ DNTU...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader()}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ProductCard
                product={item}
                onPress={() => handleProductPress(item.id)}
                onFavoriteChanged={() => fetchProducts(false)}
              />
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Không tìm thấy món đồ phù hợp</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Thử thay đổi từ khóa tìm kiếm hoặc bấm xóa bộ lọc để xem tất cả.
              </Text>
              <TouchableOpacity
                onPress={resetAllFilters}
                style={[styles.emptyResetBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.emptyResetText}>Xem tất cả món đồ</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  headerContainer: {
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  titleSection: {
    gap: 4,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  topIconGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#3448EE',
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  mainTitle: {
    ...Typography.title,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    ...Typography.body,
    fontSize: 13,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.sm,
    height: 48,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: Spacing.xs,
  },
  filterSection: {
    gap: Spacing.xs + 2,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  chipsScroll: {
    gap: Spacing.xs + 2,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md - 2,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  filterChipText: {
    fontSize: 12,
  },
  priceAndSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 4,
  },
  sortText: {
    fontSize: 11,
    fontWeight: '700',
  },
  resultStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  resultCount: {
    fontSize: 12,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl + 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  cardWrapper: {
    width: '48.5%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  emptyTitle: {
    ...Typography.subTitle,
    fontWeight: '800',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptyResetBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  emptyResetText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});


