import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductWithSeller, CATEGORIES } from '@/types';
import { Colors, Radius, Spacing } from '@/constants/theme';

export interface ProductCardProps {
  product: ProductWithSeller;
  onPress: () => void;
}

/**
 * Format price in Vietnamese format with dot separator (e.g., 50.000 đ)
 */
export const formatPrice = (price?: number | null): string => {
  if (price === undefined || price === null || isNaN(price)) return '0 đ';
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
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
};

/**
 * Shorten full Vietnamese name for compact 2-column mobile cards
 */
export const getShortSellerName = (name?: string): string => {
  if (!name) return 'Sinh viên';
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length > 2) {
    return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
  }
  return trimmed;
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const [imageError, setImageError] = useState(false);

  // Tag at corner: Location badge (e.g. "KTX Khu B") or Category label
  const categoryLabel = CATEGORIES.find((c) => c.id === product.category)?.label;
  const badgeText = product.location || categoryLabel || product.category;
  const sellerDisplayName = getShortSellerName(product.sellerName);
  const postTime = formatRelativeTime(product.createdAt);
  const hasValidImage = Boolean(product.imageUrl) && !imageError;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, giá ${formatPrice(product.price)}`}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      {/* 1:1 Aspect ratio image / placeholder */}
      <View style={styles.imageContainer}>
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
              size={36}
              color={Colors.light.textSecondary}
            />
            <Text style={styles.placeholderText}>Đồ dùng SV</Text>
          </View>
        )}

        {/* Small corner tag/badge: Category or Location (e.g. "KTX Khu B") */}
        {badgeText ? (
          <View style={styles.badgeContainer}>
            <Ionicons
              name="location-sharp"
              size={10}
              color={Colors.light.white}
              style={styles.badgeIcon}
            />
            <Text style={styles.badgeText} numberOfLines={1}>
              {badgeText}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Details Container */}
      <View style={styles.contentContainer}>
        {/* Price: Bold red Colors.light.price with dot separation */}
        <Text style={styles.price} numberOfLines={1}>
          {formatPrice(product.price)}
        </Text>

        {/* Product Title: Max 2 lines */}
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        {/* Sub-row: Shortened seller name and post time */}
        <View style={styles.subRow}>
          <Text style={styles.sellerName} numberOfLines={1}>
            {sellerDisplayName}
          </Text>
          {postTime ? (
            <>
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.timeText} numberOfLines={1}>
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
  // Responsive card container for 2-column grids
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    shadowColor: Colors.light.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  // Smooth press feedback opacity
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  // 1:1 Aspect ratio square container
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    backgroundColor: Colors.light.background,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  // Fallback placeholder for student items
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    gap: Spacing.xs,
  },
  placeholderText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  // Small top corner tag (category or location badge)
  badgeContainer: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    maxWidth: '85%',
  },
  badgeIcon: {
    marginRight: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.white,
  },
  // Body details
  contentContainer: {
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  // Bold red price Colors.light.price
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.price,
    letterSpacing: 0.2,
  },
  // Maximum 2 lines product title Colors.light.text
  title: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: Colors.light.text,
    minHeight: 36, // Keep card heights aligned in 2-column grids
  },
  // Secondary metadata row
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  sellerName: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  dotSeparator: {
    marginHorizontal: Spacing.xs,
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  timeText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
});

export default ProductCard;
