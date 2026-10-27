import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { NetworkProvider } from '@/context/NetworkContext';

export default function RootLayout() {
  return (
    <NetworkProvider>
      <AuthProvider>
        <FavoritesProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="tabs" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="product/[id]" />
            <Stack.Screen name="cart" />
            <Stack.Screen name="favorites" />
            <Stack.Screen
              name="meetup-modal"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
          </Stack>
        </FavoritesProvider>
      </AuthProvider>
    </NetworkProvider>
  );
}
