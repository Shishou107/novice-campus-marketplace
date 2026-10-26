
export const Colors = {
    light: {
        primary: '#2563EB',
        primaryLight: '#EFF6FF',
        accent: '#F97316',
        price: '#DC2626',
        danger: '#DC2626',
        dangerLight: '#FEE2E2',
        success: '#16A34A',
        successLight: '#DCFCE7',
        warning: '#D97706',
        warningLight: '#FEF3C7',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        text: '#0F172A',
        textSecondary: '#64748B',
        border: '#E2E8F0',
        cardShadow: '#000000',
        white: '#FFFFFF',
    },
    dark: {
        primary: '#3B82F6',
        primaryLight: '#1E293B',
        accent: '#FB923C',
        price: '#EF4444',
        danger: '#EF4444',
        dangerLight: '#7F1D1D',
        success: '#22C55E',
        successLight: '#14532D',
        warning: '#F59E0B',
        warningLight: '#78350F',
        background: '#0F172A',
        surface: '#1E293B',
        text: '#F8FAFC',
        textSecondary: '#94A3B8',
        border: '#334155',
        cardShadow: '#000000',
        white: '#FFFFFF',
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
    },
    subTitle: {
        fontSize: 16,
        fontWeight: '600' as const,
    },
    body: {
        fontSize: 14,
        fontWeight: '400' as const,
    },
    caption: {
        fontSize: 12,
        fontWeight: '400' as const,
    },
};
