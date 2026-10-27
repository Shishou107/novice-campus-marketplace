import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/common/AppButton';
import { CampusMap } from '@/components/CampusMap';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useNetwork } from '@/context/NetworkContext';
import { useTheme } from '@/hooks/use-theme';
import { createMeetup, getMeetingPoints, getProductById } from '@/services/db';
import { MeetingPoint, ProductWithSeller } from '@/types';
import { formatPrice } from '@/components/ProductCard';

const TIME_SLOTS = [
  '09:30 - Ra chơi ca sáng',
  '11:30 - Giờ nghỉ trưa',
  '14:45 - Ra chơi ca chiều',
  '16:45 - Tan học ca chiều',
  'Giờ khác (Hẹn riêng qua chat/SĐT)',
];

export default function MeetupModalScreen() {
  const router = useRouter();
  const colors = useTheme();
  const { user, isLoggedIn } = useAuth();
  const { isConnected } = useNetwork();
  const { productId } = useLocalSearchParams<{ productId: string }>();

  const [product, setProduct] = useState<ProductWithSeller | null>(null);
  const [meetingPoints, setMeetingPoints] = useState<MeetingPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<MeetingPoint | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(TIME_SLOTS[1]);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const points = await getMeetingPoints();
        setMeetingPoints(points);
        if (points.length > 0) {
          setSelectedPoint(points[1] || points[0]); // Mặc định Thư viện hoặc Cổng
        }

        if (productId) {
          const prod = await getProductById(parseInt(productId, 10));
          setProduct(prod);
        }
      } catch (err) {
        console.error('Lỗi khi tải điểm hẹn:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [productId]);

  const handleConfirmMeetup = async () => {
    if (!isLoggedIn || !user) {
      Alert.alert('Yêu cầu tài khoản', 'Vui lòng đăng nhập tài khoản sinh viên trước khi đặt lịch hẹn.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/auth' as any) },
      ]);
      return;
    }

    if (!selectedPoint) {
      Alert.alert('Chưa chọn địa điểm', 'Vui lòng chọn 1 điểm hẹn giao dịch trên sơ đồ trường DNTU.');
      return;
    }

    if (!product) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin sản phẩm.');
      return;
    }

    if (user.id === product.userId) {
      Alert.alert('Thông báo', 'Bạn không thể tự hẹn mua món đồ do chính mình đăng bán.');
      return;
    }

    if (!isConnected) {
      Alert.alert('Mất mạng', 'Bạn đang ngoại tuyến. Vui lòng kết nối Wi-Fi trường DNTU để gửi yêu cầu hẹn gặp.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createMeetup({
        productId: product.id,
        buyerId: user.id,
        sellerId: product.userId,
        meetingPointId: selectedPoint.id,
        scheduledAt: selectedTimeSlot,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        Alert.alert(
          'Hẹn gặp thành công! 📍',
          `Đã tạo lịch hẹn tại "${selectedPoint.name}" vào khung giờ "${selectedTimeSlot}". Người bán sẽ nhận được thông tin để cùng gặp bạn!`,
          [
            {
              text: 'Xong',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Không thể tạo lịch hẹn', res.error || 'Vui lòng thử lại.');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Đã có lỗi xảy ra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.campusTag, { backgroundColor: colors.acid, borderColor: colors.border }]}>
            <Text style={styles.campusTagText}>DNTU CAMPUS MINI-MAP</Text>
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Hẹn gặp giao dịch tại DNTU</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <Ionicons name="close" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Đang tải bản đồ khuôn viên...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Tóm tắt sản phẩm đang hẹn */}
          {product ? (
            <View style={[styles.productSummaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.summaryIconCircle, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="bag-handle-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.summaryInfo}>
                <Text style={[styles.summaryTitle, { color: colors.text }]} numberOfLines={1}>
                  {product.title}
                </Text>
                <Text style={[styles.summaryPrice, { color: product.price === 0 ? colors.success : colors.price }]}>
                  {formatPrice(product.price)} • Người bán: {product.sellerName}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Sơ đồ khuôn viên DNTU thu nhỏ */}
          <View style={styles.mapSection}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="map" size={17} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Chọn điểm gặp trên sơ đồ</Text>
            </View>

            <CampusMap
              meetingPoints={meetingPoints}
              selectedPointId={selectedPoint?.id ?? null}
              onSelectPoint={(pt) => setSelectedPoint(pt)}
            />
          </View>

          {/* Chi tiết điểm hẹn được chọn */}
          {selectedPoint ? (
            <View style={[styles.selectedPointCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
              <View style={styles.pointHeaderRow}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pointName, { color: colors.text }]}>{selectedPoint.name}</Text>
                  <Text style={[styles.pointArea, { color: colors.primary }]}>Khu vực: {selectedPoint.area}</Text>
                </View>
                <View style={[styles.selectedPill, { backgroundColor: colors.acid, borderColor: colors.border }]}>
                  <Text style={styles.selectedPillText}>ĐANG CHỌN</Text>
                </View>
              </View>
              <Text style={[styles.pointDesc, { color: colors.textSecondary }]}>{selectedPoint.description}</Text>
            </View>
          ) : null}

          {/* 2. Chọn khung thời gian hẹn */}
          <View style={styles.timeSection}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="time" size={17} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Khung giờ hẹn thuận tiện</Text>
            </View>

            <View style={styles.timeSlotsGrid}>
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedTimeSlot === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    onPress={() => setSelectedTimeSlot(slot)}
                    style={[
                      styles.timeSlotChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="alarm-outline"
                      size={13}
                      color={isSelected ? colors.white : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.timeSlotText,
                        {
                          color: isSelected ? colors.white : colors.text,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 3. Ghi chú thêm cho người bán */}
          <View style={styles.notesSection}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="create-outline" size={17} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Ghi chú nhận diện (tùy chọn)</Text>
            </View>

            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="VD: Mình mặc áo sơ mi trắng mang balo đen đợi trước cửa thư viện nhé..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={2}
              style={[
                styles.notesInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />
          </View>

          {/* Cam kết quy định DNTU */}
          <View style={[styles.rulesCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark" size={18} color={colors.textSecondary} />
            <Text style={[styles.rulesText, { color: colors.textSecondary }]}>
              Quy tắc DNTU: Hai bên kiểm tra món đồ trực tiếp và thanh toán tiền mặt/chuyển khoản khi đã hài lòng.
            </Text>
          </View>

          {/* Nút gửi yêu cầu hẹn gặp */}
          <AppButton
            title="Xác nhận hẹn gặp tại trường"
            variant="primary"
            onPress={handleConfirmMeetup}
            loading={isSubmitting}
            icon={<Ionicons name="checkmark-circle" size={20} color={colors.white} />}
            style={styles.submitBtn}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.sm,
    ...Typography.body,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1.5,
  },
  headerLeft: {
    flex: 1,
  },
  campusTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginBottom: 2,
  },
  campusTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#12140F',
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...Typography.subTitle,
    fontWeight: '800',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl + 20,
    gap: Spacing.md,
  },
  productSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  summaryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryInfo: {
    flex: 1,
    gap: 2,
  },
  summaryTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  summaryPrice: {
    fontSize: 12,
    fontWeight: '800',
  },
  mapSection: {
    gap: Spacing.xs + 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  selectedPointCard: {
    borderRadius: Radius.md,
    borderWidth: 2,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  pointHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs + 2,
  },
  pointName: {
    fontSize: 15,
    fontWeight: '800',
  },
  pointArea: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 1,
  },
  selectedPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  selectedPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#12140F',
  },
  pointDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  timeSection: {
    gap: Spacing.xs + 2,
  },
  timeSlotsGrid: {
    gap: Spacing.xs,
  },
  timeSlotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: Spacing.xs + 2,
  },
  timeSlotText: {
    fontSize: 12.5,
  },
  notesSection: {
    gap: Spacing.xs + 2,
  },
  notesInput: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.sm,
    fontSize: 13,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  rulesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.xs + 2,
  },
  rulesText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  submitBtn: {
    marginTop: Spacing.xs,
  },
});

