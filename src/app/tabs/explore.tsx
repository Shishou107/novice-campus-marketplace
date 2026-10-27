import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

import { ProductCard } from '@/components/ProductCard';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getProducts } from '@/services/db';
import { CATEGORIES, ProductCategory, ProductWithSeller } from '@/types';

type CategoryFilter = ProductCategory | 'all';

// Icon minh họa cho từng danh mục
const CATEGORY_ICONS: Record<CategoryFilter, keyof typeof Ionicons.glyphMap> = {
  all: 'apps-outline',
  book: 'book-outline',
  dorm: 'bed-outline',
  tech: 'laptop-outline',
  vehicle: 'bicycle-outline',
  fashion: 'shirt-outline',
  other: 'cube-outline',
};

export default function ExploreScreen() {
  const colors = useTheme();

  // State tìm kiếm và lọc
  const [keyword, setKeyword] = useState<string>('');
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  // State dữ liệu và giao diện
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // 1. Debounce 300ms cho ô tìm kiếm từ khóa
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword]);

  // 3. Truy vấn sản phẩm trực tiếp từ SQLite Database
  const fetchProducts = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      try {
        const data = await getProducts({
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          search: debouncedKeyword.length > 0 ? debouncedKeyword : undefined,
          status: 'available',
        });
        setProducts(data);
      } catch (error) {
        console.error('Lỗi khi tìm kiếm sản phẩm:', error);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [selectedCategory, debouncedKeyword]
  );

  // Kích hoạt tìm kiếm mỗi khi debounceKeyword hoặc selectedCategory thay đổi
  useEffect(() => {
    fetchProducts(true);
  }, [fetchProducts]);

  // Tự động cập nhật dữ liệu khi tab được focus
  useFocusEffect(
    useCallback(() => {
      fetchProducts(false);
    }, [fetchProducts])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(false);
  }, [fetchProducts]);

  const handleClearSearch = () => {
    setKeyword('');
    setDebouncedKeyword('');
  };

  const handleResetFilters = () => {
    setKeyword('');
    setDebouncedKeyword('');
    setSelectedCategory('all');
  };

  const handleProductPress = (productId: number) => {
    router.push(('/product/' + productId) as any);
  };

  // Cân bằng lưới 2 cột: thêm phần tử đệm nếu số lượng lẻ
  const formattedProducts = useMemo(() => {
    if (products.length % 2 !== 0) {
      return [
        ...products,
        {
          id: -1,
          userId: -1,
          title: '',
          price: 0,
          category: 'other' as ProductCategory,
          location: '',
          status: 'available' as const,
          createdAt: '',
          sellerName: '',
          sellerStudentId: '',
        } as ProductWithSeller,
      ];
    }
    return products;
  }, [products]);

  // Header của trang chứa Ô tìm kiếm, Thanh lọc danh mục và Dòng đếm kết quả
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Tiêu đề màn hình */}
      <View style={styles.titleSection}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>
          Khám phá & Tìm kiếm 🔍
        </Text>
        <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
          Tra cứu giáo trình, đồ KTX & đồ sinh viên giá rẻ
        </Text>
      </View>

      {/* 1. Ô tìm kiếm (SearchBar) với icon kính lúp và nút xóa nhanh */}
      <View
        style={[
          styles.searchBarContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          placeholder="Tìm theo tên giáo trình, đồ dùng..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
        />
        {keyword.length > 0 && (
          <TouchableOpacity
            onPress={handleClearSearch}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Xóa từ khóa"
          >
            <Ionicons name="close-circle" size={19} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Thanh lọc Danh mục: Hàng cuộn ngang chứa "Tất cả" + CATEGORIES */}
      <View style={styles.categoriesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {/* Chip "Tất cả" */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedCategory('all')}
            style={[
              styles.categoryChip,
              selectedCategory === 'all'
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name={CATEGORY_ICONS.all}
              size={15}
              color={selectedCategory === 'all' ? '#FFFFFF' : colors.textSecondary}
              style={styles.chipIcon}
            />
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === 'all'
                  ? styles.categoryChipTextActive
                  : { color: colors.text },
              ]}
            >
              Tất cả
            </Text>
          </TouchableOpacity>

          {/* Danh sách các chip từ CATEGORIES */}
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const iconName = CATEGORY_ICONS[cat.id] || 'cube-outline';
            return (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.8}
                onPress={() => setSelectedCategory(cat.id)}
                style={[
                  styles.categoryChip,
                  isSelected
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={15}
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  style={styles.chipIcon}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected
                      ? styles.categoryChipTextActive
                      : { color: colors.text },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Dòng đếm kết quả: "Tìm thấy X món đồ" */}
      <View style={styles.resultMetaRow}>
        <Text style={[styles.resultCountText, { color: colors.textSecondary }]}>
          Tìm thấy <Text style={[styles.resultCountHighlight, { color: colors.primary }]}>{products.length}</Text> món đồ
          {selectedCategory !== 'all' && (
            <Text> • {CATEGORIES.find((c) => c.id === selectedCategory)?.label}</Text>
          )}
          {debouncedKeyword.length > 0 && (
            <Text> cho "{debouncedKeyword}"</Text>
          )}
        </Text>

        {(selectedCategory !== 'all' || debouncedKeyword.length > 0) && (
          <TouchableOpacity onPress={handleResetFilters} style={styles.resetButton}>
            <Text style={[styles.resetButtonText, { color: colors.primary }]}>
              Đặt lại
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Giao diện khi không tìm thấy kết quả
  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Đang tìm kiếm đồ dùng...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconCircle, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="search" size={42} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Không tìm thấy đồ dùng phù hợp với từ khóa của bạn
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Hãy thử tìm với từ khóa chung chung hơn hoặc chọn danh mục "Tất cả".
        </Text>
        {(keyword.length > 0 || selectedCategory !== 'all') && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleResetFilters}
            style={[styles.resetActionBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.resetActionBtnText}>Xem tất cả đồ dùng</Text>
          </TouchableOpacity>
        )}
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
  titleSection: {
    marginBottom: Spacing.sm,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  // 1. Ô tìm kiếm (SearchBar)
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginTop: Spacing.xs,
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
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 2,
    marginLeft: Spacing.xs,
  },
  // 2. Thanh lọc danh mục
  categoriesSection: {
    marginBottom: Spacing.sm,
    marginHorizontal: -Spacing.md, // Cho phép vuốt tràn sang 2 mép
  },
  categoryScrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipIcon: {
    marginRight: 5,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // 3. Dòng đếm kết quả
  resultMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  resultCountText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  resultCountHighlight: {
    fontWeight: '700',
  },
  resetButton: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '600',
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
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl * 1.5,
    paddingBottom: Spacing.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
    lineHeight: 22,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  resetActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  resetActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
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
