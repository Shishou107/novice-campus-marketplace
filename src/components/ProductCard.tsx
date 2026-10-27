import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductWithSeller, CATEGORIES } from '@/types';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { toggleFavorite } from '@/services/db';

export interface ProductCardProps {
  product: ProductWithSeller;
  onPress: () => void;
  onFavoriteChanged?: () => void;
}

/**
 * Format price in Vietnamese format with dot separator (e.g., 50.000 đ)
 */
export const formatPrice = (price?: number | null): string => {
  if (price === undefined || price === null || isNaN(price) || price === 0) return '0 đ';
  return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đ';
};

/**
 * Friendly relative time string for post age
 */
export const formatRelativeTime = (timeInput?: string | number | Date | null): string => {
  if (!timeInput) return '';
  const date =
    typeof timeInput === 'string' || typeof timeInput === 'number'
      ? new Date(timeInput)
      : timeInput;

  if (isNaN(date.getTime())) return String(timeInput);

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin}m trước`;
  if (diffHour < 24) return `${diffHour}h trước`;
  if (diffDay < 7) return `${diffDay}d trước`;

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
};

/**
 * Shorten full Vietnamese name for compact 2-column mobile cards
 */
export const getShortSellerName = (name?: string): string => {
  if (!name) return 'Sinh viên DNTU';
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length > 2) {
    return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
  }
  return trimmed;
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, onFavoriteChanged }) => {
  const colors = useTheme();
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [isFav, setIsFav] = useState<boolean>(Boolean(product.isFavorited));

  const categoryLabel = CATEGORIES.find((c) => c.id === product.category)?.label;
  const badgeText = product.location || categoryLabel || product.category;
  const sellerDisplayName = getShortSellerName(product.sellerName);
  const postTime = formatRelativeTime(product.createdAt);
  const hasValidImage = Boolean(product.imageUrl) && !imageError;
  const isFree = product.price === 0;

  const handleToggleFav = async () => {
    if (!user) return;
    const nextState = !isFav;
    setIsFav(nextState);
    await toggleFavorite(user.id, product.id);
    onFavoriteChanged?.();
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, giá ${formatPrice(product.price)}`}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.cardShadow,
        },
        pressed && styles.pressed,
      ]}
    >
      {/* Aspect ratio square container */}
      <View style={[styles.imageContainer, { backgroundColor: colors.background }]}>
        {hasValidImage ? (
          <Image
            source={{ uri: product.imageUrl as string }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons
              name="book-outline"
              size={32}
              color={colors.textSecondary}
            />
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>Đồ dùng DNTU</Text>
          </View>
        )}

        {/* Location tag with retro editorial badge */}
        {badgeText ? (
          <View style={[styles.badgeContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons
              name="location-sharp"
              size={10}
              color={colors.primary}
              style={styles.badgeIcon}
            />
            <Text style={[styles.badgeText, { color: colors.text }]} numberOfLines={1}>
              {badgeText}
            </Text>
          </View>
        ) : null}

        {/* Favorite Heart Button */}
        <TouchableOpacity
          onPress={handleToggleFav}
          style={[styles.favBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          accessibilityLabel="Lưu yêu thích"
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={13}
            color={isFav ? colors.price : colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Acid Lime FREE Badge */}
        {isFree ? (
          <View style={[styles.freeTag, { backgroundColor: colors.acid, borderColor: colors.border }]}>
            <Text style={styles.freeTagText}>0Đ TẶNG</Text>
          </View>
        ) : null}
      </View>

      {/* Details Container */}
      <View style={styles.contentContainer}>
        {/* Price row */}
        <View style={styles.priceRow}>
          <Text
            style={[
              styles.price,
              { color: isFree ? colors.success : colors.price },
            ]}
            numberOfLines={1}
          >
            {isFree ? 'Tặng miễn phí' : formatPrice(product.price)}
          </Text>
        </View>

        {/* Product Title: Max 2 lines */}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {product.title}
        </Text>

        {/* Sub-row: Seller name and post time */}
        <View style={styles.subRow}>
          <Ionicons name="person-circle-outline" size={13} color={colors.textSecondary} style={{ marginRight: 3 }} />
          <Text style={[styles.sellerName, { color: colors.textSecondary }]} numberOfLines={1}>
            {sellerDisplayName}
          </Text>
          {postTime ? (
            <>
              <Text style={[styles.dotSeparator, { color: colors.textSecondary }]}>•</Text>
              <Text style={[styles.timeText, { color: colors.textSecondary }]} numberOfLines={1}>
                {postTime}
              </Text>
            </>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1.05,
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  placeholderText: {
    fontSize: 11,
    fontWeight: '500',
  },
  badgeContainer: {
    position: 'absolute',
    top: Spacing.xs + 2,
    left: Spacing.xs + 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs + 3,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    maxWidth: '70%',
  },
  favBtn: {
    position: 'absolute',
    top: Spacing.xs + 2,
    right: Spacing.xs + 2,
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeTag: {
    position: 'absolute',
    bottom: Spacing.xs + 2,
    right: Spacing.xs + 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  freeTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#12140F',
    letterSpacing: 0.6,
  },
  badgeIcon: {
    marginRight: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  contentContainer: {
    padding: Spacing.sm,
    gap: Spacing.xs - 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  title: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    minHeight: 36,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  sellerName: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '500',
  },
  dotSeparator: {
    marginHorizontal: Spacing.xs - 1,
    fontSize: 10,
  },
  timeText: {
    fontSize: 11,
  },
});

export default ProductCard;
