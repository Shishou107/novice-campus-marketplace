import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';
import { useNetwork } from '@/context/NetworkContext';
import { useTheme } from '@/hooks/use-theme';

export function NetworkBanner() {
  const colors = useTheme();
  const { isConnected } = useNetwork();

  // Khi có kết nối mạng bình thường (Wi-Fi, 4G, v.v.), không hiển thị gì
  if (isConnected) {
    return null;
  }

  // Chỉ hiển thị thông báo nhẹ khi mất kết nối mạng
  return (
    <View style={[styles.offlineBanner, { backgroundColor: colors.butter, borderColor: colors.border }]}>
      <Ionicons name="cloud-offline-outline" size={15} color="#12140F" />
      <Text style={styles.offlineText} numberOfLines={1}>
        <Text style={{ fontWeight: '800' }}>Ngoại tuyến:</Text> Đang hiển thị dữ liệu đã lưu trong bộ nhớ
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderBottomWidth: 1.5,
    gap: 8,
  },
  offlineText: {
    fontSize: 12,
    color: '#12140F',
    flex: 1,
  },
});
