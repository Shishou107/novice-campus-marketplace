import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export default function TabLayout() {
  const colors = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1.5,
          height: Platform.OS === 'ios' ? 88 : 66,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          elevation: 4,
          shadowColor: colors.cardShadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: -0.2,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '800',
          fontSize: 18,
          letterSpacing: -0.3,
        },
        headerTintColor: colors.primary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size - 1}
              color={typeof color === 'string' ? color : undefined}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Khám phá',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'compass' : 'compass-outline'}
              size={size - 1}
              color={typeof color === 'string' ? color : undefined}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Đăng bán',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'add-circle' : 'add-circle-outline'}
              size={size + 2}
              color={typeof color === 'string' ? color : undefined}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ sơ',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size - 1}
              color={typeof color === 'string' ? color : undefined}
            />
          ),
        }}
      />
    </Tabs>
  );
}
