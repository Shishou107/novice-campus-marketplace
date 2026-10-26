import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
  useColorScheme,
} from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export type AppButtonVariant = 'primary' | 'outline' | 'danger';

export interface AppButtonProps {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: AppButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  activeOpacity?: number;
  testID?: string;
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  activeOpacity = 0.7,
  testID,
}: AppButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const isInteractive = !disabled && !loading;

  // Determine button container styles based on variant
  const getVariantContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.primary,
        };
      case 'danger':
        return {
          backgroundColor: colors.danger,
          borderWidth: 1,
          borderColor: colors.danger,
        };
      case 'primary':
      default:
        return {
          backgroundColor: colors.primary,
          borderWidth: 1,
          borderColor: colors.primary,
        };
    }
  };

  // Determine button text color based on variant
  const getVariantTextColor = (): string => {
    switch (variant) {
      case 'outline':
        return colors.primary;
      case 'danger':
      case 'primary':
      default:
        return colors.white;
    }
  };

  const textColor = getVariantTextColor();

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={!isInteractive}
      activeOpacity={activeOpacity}
      style={[
        styles.button,
        getVariantContainerStyle(),
        !isInteractive && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
          <Text
            numberOfLines={1}
            style={[styles.text, { color: textColor }, textStyle]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + Spacing.xs, // 12px
    paddingHorizontal: Spacing.md,           // 16px
    minHeight: Spacing.xl + Spacing.md,      // 48px standard touch target
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...Typography.subTitle,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
