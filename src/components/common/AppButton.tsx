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

export type AppButtonVariant = 'primary' | 'outline' | 'danger' | 'acid' | 'secondary';

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
  activeOpacity = 0.75,
  testID,
}: AppButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const isInteractive = !disabled && !loading;

  const getVariantContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.border,
        };
      case 'danger':
        return {
          backgroundColor: colors.danger,
          borderWidth: 1,
          borderColor: colors.danger,
        };
      case 'acid':
        return {
          backgroundColor: colors.acid,
          borderWidth: 1.5,
          borderColor: colors.border,
        };
      case 'secondary':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: colors.border,
        };
      case 'primary':
      default:
        return {
          backgroundColor: colors.primary,
          borderWidth: 1.5,
          borderColor: colors.primary,
        };
    }
  };

  const getVariantTextColor = (): string => {
    switch (variant) {
      case 'outline':
        return colors.text;
      case 'secondary':
        return colors.text;
      case 'acid':
        return '#12140F';
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
      accessibilityState={{ disabled: !isInteractive }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={textColor}
          style={styles.spinner}
        />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
          <Text
            style={[
              styles.text,
              { color: textColor },
              textStyle,
            ]}
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
    minHeight: 48,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs + 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...Typography.subTitle,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  disabled: {
    opacity: 0.5,
  },
  spinner: {
    marginVertical: Spacing.xs,
  },
});
