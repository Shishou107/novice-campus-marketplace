import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
  useColorScheme,
} from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export interface AppInputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function AppInput({
  label,
  error,
  containerStyle,
  inputStyle,
  leftIcon,
  rightIcon,
  onFocus,
  onBlur,
  style,
  placeholderTextColor,
  ...textInputProps
}: AppInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [isFocused, setIsFocused] = useState(false);

  const handleFocus: TextInputProps['onFocus'] = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur: TextInputProps['onBlur'] = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Border color prioritizes error, then active focus, then default border
  const getBorderColor = (): string => {
    if (error) {
      return colors.danger;
    }
    if (isFocused) {
      return colors.primary;
    }
    return colors.border;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surface,
            borderColor: getBorderColor(),
          },
        ]}
      >
        {leftIcon ? <View style={styles.leftIconContainer}>{leftIcon}</View> : null}

        <TextInput
          placeholderTextColor={placeholderTextColor ?? colors.textSecondary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            { color: colors.text },
            inputStyle,
            style,
          ]}
          {...textInputProps}
        />

        {rightIcon ? <View style={styles.rightIconContainer}>{rightIcon}</View> : null}
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    width: '100%',
  },
  label: {
    ...Typography.caption,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    minHeight: Spacing.xl + Spacing.md, // 48px
  },
  input: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 0,
  },
  leftIconContainer: {
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIconContainer: {
    marginLeft: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
});
