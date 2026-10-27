import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 15,
                    fontWeight: '600',
                    paddingBottom: 15,
                },
                headerStyle: {
                    backgroundColor: colors.surface,
                },
                headerTintColor: colors.text,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Trang chủ',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={typeof color === 'string' ? color : undefined} />
                    ),
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Khám phá',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="compass-outline" size={size} color={typeof color === 'string' ? color : undefined} />
                    ),
                }}
            />
            <Tabs.Screen
                name="sell"
                options={{
                    title: 'Đăng bán',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="add-circle-outline" size={size} color={typeof color === 'string' ? color : undefined} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Hồ sơ',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={typeof color === 'string' ? color : undefined} />
                    ),
                }}
            />
        </Tabs>
    );
}
