import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function NotFoundScreen() {
  const colors = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Không tìm thấy trang' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.errorCode, { color: colors.primary }]}>404</Text>
          <Text style={[styles.title, { color: colors.text }]}>Trang không tồn tại</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Liên kết bạn vừa truy cập không hợp lệ hoặc đã bị gỡ bỏ khỏi hệ thống DNTU Campus Marketplace.
          </Text>

          <Link href="/tabs" style={[styles.button, { backgroundColor: colors.primary }]}>
            <Text style={styles.buttonText}>Quay về Trang chủ DNTU</Text>
          </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius.lg,
    borderWidth: 2,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  errorCode: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    ...Typography.title,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  button: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
