import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
  useColorScheme,
} from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export type BadgeVariant = 'primary' | 'success' | 'warning';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Badge({
  label,
  variant = 'primary',
  icon,
  style,
  textStyle,
}: BadgeProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const getVariantStyles = (): { backgroundColor: string; textColor: string } => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: colors.successLight,
          textColor: colors.success,
        };
      case 'warning':
        return {
          backgroundColor: colors.warningLight,
          textColor: colors.warning,
        };
      case 'primary':
      default:
        return {
          backgroundColor: colors.primaryLight,
          textColor: colors.primary,
        };
    }
  };

  const { backgroundColor, textColor } = getVariantStyles();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor },
        style,
      ]}
    >
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      <Text
        numberOfLines={1}
        style={[
          styles.text,
          { color: textColor },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.xs,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
