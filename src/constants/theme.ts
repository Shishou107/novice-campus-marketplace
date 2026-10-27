export const Colors = {
  light: {
    primary: '#3448EE',
    primaryLight: '#E8EBFF',
    accent: '#DFFF74',
    acid: '#DFFF74',
    butter: '#EBE890',
    pink: '#FF8ACB',
    price: '#DC2626',
    danger: '#DC2626',
    dangerLight: '#FEE2E2',
    success: '#16A34A',
    successLight: '#DCFCE7',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    background: '#F2F1DF',
    surface: '#FBFBF2',
    text: '#12140F',
    textSecondary: '#686B60',
    border: '#E1DEC8',
    cardShadow: '#2A2B1F',
    white: '#FFFFFF',
    ink: '#12140F',
    paper: '#F2F1DF',
    paperBright: '#FBFBF2',
  },
  dark: {
    primary: '#96A6FF',
    primaryLight: '#1E2548',
    accent: '#BFDC6E',
    acid: '#BFDC6E',
    butter: '#677057',
    pink: '#F6A2D3',
    price: '#EF4444',
    danger: '#EF4444',
    dangerLight: '#7F1D1D',
    success: '#22C55E',
    successLight: '#14532D',
    warning: '#F59E0B',
    warningLight: '#78350F',
    background: '#151B20',
    surface: '#20292E',
    text: '#F4F3E8',
    textSecondary: '#AAB8B6',
    border: '#2B353C',
    cardShadow: '#000000',
    white: '#FFFFFF',
    ink: '#F4F3E8',
    paper: '#151B20',
    paperBright: '#20292E',
  },
} as const;

export type ThemeColors = typeof Colors.light;
export type ThemeColor = keyof ThemeColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  sm: 6,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

export const Typography = {
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  mono: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
  },
};
