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
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/common/AppButton';
import { ProductCard } from '@/components/ProductCard';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { getFavoriteProducts } from '@/services/db';
import { ProductWithSeller } from '@/types';

export default function FavoritesScreen() {
  const colors = useTheme();
  const { user, isLoggedIn } = useAuth();

  const [favorites, setFavorites] = useState<ProductWithSeller[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const items = await getFavoriteProducts(user.id);
      setFavorites(items);
    } catch (err) {
      console.error('Lỗi khi tải danh sách yêu thích:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>Món đồ đã lưu ❤️</Text>

        <View style={{ width: 36 }} />
      </View>

      {!isLoggedIn || !user ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="heart-outline" size={48} color={colors.price} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Đăng nhập để xem danh sách yêu thích</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Lưu lại các cuốn giáo trình hay món đồ KTX bạn đang quan tâm để xem lại sau.
          </Text>
          <AppButton
            title="Đăng nhập ngay"
            onPress={() => router.push('/auth' as any)}
            style={{ marginTop: Spacing.sm }}
          />
        </View>
      ) : isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang tải danh sách yêu thích...</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="heart-dislike-outline" size={48} color={colors.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Chưa có món đồ yêu thích nào</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Chạm vào biểu tượng trái tim ở các món đồ trong chợ sinh viên DNTU để lưu tại đây nhé!
          </Text>
          <AppButton
            title="Khám phá ngay"
            onPress={() => router.push('/(tabs)/explore' as any)}
            style={{ marginTop: Spacing.sm }}
          />
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
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
          renderItem={({ item }) => (
            <View style={styles.cardCol}>
              <ProductCard
                product={item}
                onPress={() => router.push(('/product/' + item.id) as any)}
                onFavoriteChanged={fetchFavorites}
              />
            </View>
          )}
        />
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.title,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl + 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  cardCol: {
    width: '48.5%',
  },
});

