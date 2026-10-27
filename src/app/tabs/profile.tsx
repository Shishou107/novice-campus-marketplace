import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AppButton } from '@/components/common/AppButton';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { deleteProduct, getMeetups, getProducts, updateMeetupStatus, updateProductStatus } from '@/services/db';
import { Meetup, ProductWithSeller } from '@/types';
import { formatPrice } from '@/components/ProductCard';

export default function ProfileScreen() {
  const colors = useTheme();
  const { user, isLoggedIn, isLoading: authLoading, logout } = useAuth();

  const [myProducts, setMyProducts] = useState<ProductWithSeller[]>([]);
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'sold' | 'meetups'>('available');
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchUserData = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoadingData(true);
      const [items, userMeetups] = await Promise.all([
        getProducts({ userId: user.id, status: 'all' }),
        getMeetups(user.id),
      ]);
      setMyProducts(items);
      setMeetups(userMeetups);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu cá nhân:', error);
    } finally {
      setIsLoadingData(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchUserData();
      } else {
        setMyProducts([]);
        setMeetups([]);
      }
    }, [user, fetchUserData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  const handleToggleStatus = async (item: ProductWithSeller) => {
    if (!user) return;
    const newStatus = item.status === 'available' ? 'sold' : 'available';
    const actionLabel = newStatus === 'sold' ? 'Đánh dấu đã bán' : 'Mở bán lại';

    Alert.alert('Xác nhận', `Bạn muốn ${actionLabel.toLowerCase()} món đồ này?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đồng ý',
        onPress: async () => {
          const ok = await updateProductStatus(item.id, newStatus, user.id);
          if (ok) {
            setMyProducts((prev) =>
              prev.map((p) => (p.id === item.id ? { ...p, status: newStatus } : p))
            );
          } else {
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái.');
          }
        },
      },
    ]);
  };

  const handleDeleteItem = (productId: number) => {
    if (!user) return;
    Alert.alert('Xóa tin đăng', 'Bạn có chắc chắn muốn xóa bài đăng này không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa vĩnh viễn',
        style: 'destructive',
        onPress: async () => {
          const ok = await deleteProduct(productId, user.id);
          if (ok) {
            setMyProducts((prev) => prev.filter((p) => p.id !== productId));
          } else {
            Alert.alert('Lỗi', 'Không thể xóa bài đăng.');
          }
        },
      },
    ]);
  };

  const handleUpdateMeetup = (
    meetupId: number,
    newStatus: 'confirmed' | 'completed' | 'cancelled'
  ) => {
    const statusLabels = {
      confirmed: 'xác nhận điểm hẹn',
      completed: 'hoàn tất buổi giao dịch',
      cancelled: 'hủy lịch hẹn này',
    };

    Alert.alert('Lịch hẹn DNTU', `Bạn có chắc muốn ${statusLabels[newStatus]}?`, [
      { text: 'Đóng', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          const ok = await updateMeetupStatus(meetupId, newStatus);
          if (ok) {
            fetchUserData();
          } else {
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái lịch hẹn.');
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất khỏi tài khoản?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          setMyProducts([]);
          setMeetups([]);
          await logout();
        },
      },
    ]);
  };

  if (authLoading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Not Logged In State
  if (!isLoggedIn || !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.notLoggedInWrapper}>
          <View style={[styles.welcomeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.acid, borderColor: colors.border }]}>
              <Ionicons name="school" size={44} color="#12140F" />
            </View>

            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>CHỢ SINH VIÊN DNTU</Text>
            </View>

            <Text style={[styles.loginCardTitle, { color: colors.text }]}>Hồ sơ sinh viên DNTU</Text>
            <Text style={[styles.loginCardSubtitle, { color: colors.textSecondary }]}>
              Đăng nhập bằng Mã sinh viên DNTU để đăng bán đồ cũ, hẹn điểm gặp mặt trên Mini Map và quản lý giỏ hàng an toàn trong trường.
            </Text>

            <AppButton
              title="Đăng nhập / Đăng ký"
              onPress={() => router.push('/auth' as any)}
              icon={<Ionicons name="log-in-outline" size={20} color={colors.white} />}
              style={styles.fullWidthBtn}
            />
          </View>

          {/* Campus Rules Guidance */}
          <View style={[styles.guidelineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.guidelineHeader}>
              <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
              <Text style={[styles.guidelineTitle, { color: colors.text }]}>Quy định giao dịch an toàn DNTU</Text>
            </View>
            <Text style={[styles.guidelineItem, { color: colors.textSecondary }]}>
              • 100% tài khoản xác thực qua Mã Sinh Viên chính thức của DNTU.
            </Text>
            <Text style={[styles.guidelineItem, { color: colors.textSecondary }]}>
              • Giao nhận trực tiếp tại các điểm hẹn cố định: Cổng A, Thư viện, Căn tin hoặc Giảng đường.
            </Text>
            <Text style={[styles.guidelineItem, { color: colors.textSecondary }]}>
              • Kiểm tra tình trạng sản phẩm và tồn kho trước khi hoàn tất giao dịch.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Active / Sold / Meetups counts
  const availableItems = myProducts.filter((p) => p.status === 'available');
  const soldItems = myProducts.filter((p) => p.status === 'sold');

  const renderHeader = () => (
    <View style={styles.profileHeaderContent}>
      {/* Student ID Card Badge (ducishere neo-retro student card style) */}
      <View style={[styles.studentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeaderRow}>
          <View style={[styles.cardHeaderTag, { backgroundColor: colors.acid, borderColor: colors.border }]}>
            <Text style={styles.cardHeaderTagText}>DNTU VERIFIED STUDENT</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutIconBtn}>
            <Ionicons name="log-out-outline" size={20} color={colors.price} />
          </TouchableOpacity>
        </View>

        <View style={styles.studentInfoRow}>
          <View style={[styles.userAvatar, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>

          <View style={styles.studentDetails}>
            <Text style={[styles.studentName, { color: colors.text }]}>{user.name}</Text>
            <Text style={[styles.studentIdLabel, { color: colors.textSecondary }]}>
              MSSV: <Text style={{ fontWeight: '800', color: colors.text }}>{user.studentId}</Text>
            </Text>
            {user.phone ? (
              <View style={styles.phoneTag}>
                <Ionicons name="call-outline" size={12} color={colors.primary} />
                <Text style={[styles.phoneTagText, { color: colors.textSecondary }]}>{user.phone}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Stats Row */}
        <View style={[styles.statsRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.statCol}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{myProducts.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tin đăng</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statNumber, { color: colors.success }]}>{soldItems.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Đã thanh lý</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>{meetups.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Lịch hẹn</Text>
          </View>
        </View>
      </View>

      {/* Quick Nav Shortcuts (Giỏ hàng & Món đồ yêu thích) */}
      <View style={styles.quickNavRow}>
        <TouchableOpacity
          onPress={() => router.push('/cart' as any)}
          style={[styles.quickNavCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[styles.quickNavIconWrap, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="cart" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.quickNavTitle, { color: colors.text }]}>Giỏ hàng DNTU</Text>
            <Text style={[styles.quickNavSub, { color: colors.textSecondary }]}>Xem đồ đã chọn</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/favorites' as any)}
          style={[styles.quickNavCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[styles.quickNavIconWrap, { backgroundColor: '#FFECEC' }]}>
            <Ionicons name="heart" size={20} color={colors.price} />
          </View>
          <View>
            <Text style={[styles.quickNavTitle, { color: colors.text }]}>Đã yêu thích</Text>
            <Text style={[styles.quickNavSub, { color: colors.textSecondary }]}>Sản phẩm đã lưu</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Action Button to post new item */}
      <AppButton
        title="Đăng thanh lý món đồ mới"
        variant="primary"
        onPress={() => router.push('/(tabs)/sell' as any)}
        icon={<Ionicons name="add-circle" size={20} color={colors.white} />}
        style={{ marginTop: 2 }}
      />

      {/* 3-Tab Segmented Control (Đang bán | Đã bán | Lịch hẹn) */}
      <View style={[styles.segmentContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('available')}
          style={[
            styles.segmentBtn,
            activeTab === 'available' && [styles.segmentActiveBtn, { backgroundColor: colors.primary }],
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === 'available' ? colors.white : colors.text },
            ]}
          >
            Đang bán ({availableItems.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('sold')}
          style={[
            styles.segmentBtn,
            activeTab === 'sold' && [styles.segmentActiveBtn, { backgroundColor: colors.primary }],
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === 'sold' ? colors.white : colors.text },
            ]}
          >
            Đã bán ({soldItems.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('meetups')}
          style={[
            styles.segmentBtn,
            activeTab === 'meetups' && [styles.segmentActiveBtn, { backgroundColor: colors.primary }],
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              { color: activeTab === 'meetups' ? colors.white : colors.text },
            ]}
          >
            Lịch hẹn ({meetups.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render for Products
  const renderProductItem = (item: ProductWithSeller) => (
    <TouchableOpacity
      key={item.id}
      activeOpacity={0.85}
      onPress={() => router.push(('/product/' + item.id) as any)}
      style={[styles.productItemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      {/* Thumbnail */}
      <View style={[styles.thumbWrapper, { backgroundColor: colors.background }]}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.thumbImage} resizeMode="cover" />
        ) : (
          <Ionicons name="image-outline" size={28} color={colors.textSecondary} />
        )}
      </View>

      {/* Info */}
      <View style={styles.itemInfo}>
        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text
          style={[
            styles.itemPrice,
            { color: item.price === 0 ? colors.success : colors.price },
          ]}
        >
          {item.price === 0 ? 'Tặng 0đ' : formatPrice(item.price)}
        </Text>
        <Text style={[styles.itemLocation, { color: colors.textSecondary }]}>
          📍 {item.location} • {item.createdAt || 'Hôm nay'}
        </Text>

        {/* Action Buttons Row */}
        <View style={styles.itemActionsRow}>
          <TouchableOpacity
            onPress={() => handleToggleStatus(item)}
            style={[styles.actionChip, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            <Ionicons
              name={item.status === 'available' ? 'checkmark-circle-outline' : 'refresh-outline'}
              size={14}
              color={colors.text}
            />
            <Text style={[styles.actionChipText, { color: colors.text }]}>
              {item.status === 'available' ? 'Đã bán' : 'Mở bán'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDeleteItem(item.id)}
            style={[styles.actionChip, { backgroundColor: colors.dangerLight, borderColor: 'transparent' }]}
          >
            <Ionicons name="trash-outline" size={14} color={colors.danger} />
            <Text style={[styles.actionChipText, { color: colors.danger }]}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render for Meetups
  const renderMeetupItem = (item: Meetup) => {
    const isSeller = user?.id === item.sellerId;
    const partnerName = isSeller ? item.buyerName || 'Người mua' : item.sellerName || 'Người bán';
    const statusMap = {
      pending: { label: 'Chờ xác nhận', bg: '#FFF7ED', color: '#EA580C', icon: 'hourglass-outline' },
      confirmed: { label: 'Đã hẹn gặp', bg: '#EEF2FF', color: '#3448EE', icon: 'checkbox-outline' },
      completed: { label: 'Đã hoàn thành', bg: '#F0FDF4', color: '#16A34A', icon: 'checkmark-done-circle' },
      cancelled: { label: 'Đã hủy', bg: '#FEF2F2', color: '#DC2626', icon: 'close-circle-outline' },
    };
    const currentStatus = statusMap[item.status] || statusMap.pending;

    return (
      <View
        key={item.id}
        style={[styles.meetupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={styles.meetupCardHeader}>
          <View style={[styles.meetupRoleTag, { backgroundColor: isSeller ? colors.butter : colors.primaryLight }]}>
            <Text style={[styles.meetupRoleText, { color: isSeller ? colors.text : colors.primary }]}>
              {isSeller ? 'BẠN LÀ NGƯỜI BÁN' : 'BẠN LÀ NGƯỜI MUA'}
            </Text>
          </View>
          <View style={[styles.meetupStatusBadge, { backgroundColor: currentStatus.bg }]}>
            <Ionicons name={currentStatus.icon as any} size={13} color={currentStatus.color} style={{ marginRight: 3 }} />
            <Text style={[styles.meetupStatusText, { color: currentStatus.color }]}>{currentStatus.label}</Text>
          </View>
        </View>

        {/* Product mini banner */}
        <View style={[styles.meetupProductRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {item.productImage ? (
            <Image source={{ uri: item.productImage }} style={styles.meetupProductThumb} resizeMode="cover" />
          ) : (
            <View style={[styles.meetupProductThumb, { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="cube-outline" size={18} color={colors.textSecondary} />
            </View>
          )}
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.meetupProductTitle, { color: colors.text }]} numberOfLines={1}>
              {item.productTitle || 'Sản phẩm giao dịch'}
            </Text>
            <Text style={[styles.meetupProductPrice, { color: colors.price }]}>
              {item.productPrice ? formatPrice(item.productPrice) : '0đ (Tặng)'}
            </Text>
          </View>
        </View>

        {/* Meetup Details */}
        <View style={styles.meetupDetailsBox}>
          <View style={styles.meetupDetailRow}>
            <Ionicons name="location" size={15} color={colors.primary} />
            <Text style={[styles.meetupDetailText, { color: colors.text, fontWeight: '700' }]}>
              {item.meetingPointName || 'Điểm hẹn DNTU'}
              {item.meetingPointArea ? ` (${item.meetingPointArea})` : ''}
            </Text>
          </View>

          <View style={styles.meetupDetailRow}>
            <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
            <Text style={[styles.meetupDetailText, { color: colors.text }]}>
              Thời gian: <Text style={{ fontWeight: '700' }}>{item.scheduledAt}</Text>
            </Text>
          </View>

          <View style={styles.meetupDetailRow}>
            <Ionicons name="person-outline" size={15} color={colors.textSecondary} />
            <Text style={[styles.meetupDetailText, { color: colors.text }]}>
              Đối tác: <Text style={{ fontWeight: '700' }}>{partnerName}</Text>
            </Text>
          </View>

          {item.notes ? (
            <View style={styles.meetupDetailRow}>
              <Ionicons name="information-circle-outline" size={15} color={colors.textSecondary} />
              <Text style={[styles.meetupDetailText, { color: colors.textSecondary }]}>
                Nhận diện: {item.notes}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Action Controls for Meetup */}
        <View style={styles.meetupActionsRow}>
          {item.status === 'pending' ? (
            <TouchableOpacity
              onPress={() => handleUpdateMeetup(item.id, 'confirmed')}
              style={[styles.meetupActionBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="checkmark-done" size={14} color={colors.white} />
              <Text style={[styles.meetupActionBtnText, { color: colors.white }]}>
                {isSeller ? 'Xác nhận điểm hẹn' : 'Xác nhận điểm hẹn (Đối tác)'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {item.status === 'confirmed' ? (
            <TouchableOpacity
              onPress={() => handleUpdateMeetup(item.id, 'completed')}
              style={[styles.meetupActionBtn, { backgroundColor: colors.success }]}
            >
              <Ionicons name="checkmark-circle" size={14} color={colors.white} />
              <Text style={[styles.meetupActionBtnText, { color: colors.white }]}>Đã hoàn thành</Text>
            </TouchableOpacity>
          ) : null}

          {item.status !== 'completed' && item.status !== 'cancelled' ? (
            <TouchableOpacity
              onPress={() => handleUpdateMeetup(item.id, 'cancelled')}
              style={[styles.meetupActionBtn, { backgroundColor: colors.dangerLight }]}
            >
              <Ionicons name="close" size={14} color={colors.danger} />
              <Text style={[styles.meetupActionBtnText, { color: colors.danger }]}>Hủy hẹn</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  const currentItems: any[] =
    activeTab === 'meetups' ? meetups : activeTab === 'available' ? availableItems : soldItems;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList
        data={currentItems}
        keyExtractor={(item: any) => (activeTab === 'meetups' ? `meetup-${item.id}` : `prod-${item.id}`)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }: { item: any }) => {
          if (activeTab === 'meetups') {
            return renderMeetupItem(item as Meetup);
          }
          return renderProductItem(item as ProductWithSeller);
        }}
        ListEmptyComponent={
          isLoadingData ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: Spacing.xl }} />
          ) : (
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons
                name={activeTab === 'meetups' ? 'map-outline' : 'cube-outline'}
                size={44}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyBoxTitle, { color: colors.text }]}>
                {activeTab === 'available'
                  ? 'Chưa có món đồ nào đang bán'
                  : activeTab === 'sold'
                  ? 'Chưa có món đồ nào đã bán'
                  : 'Chưa có lịch hẹn gặp nào'}
              </Text>
              <Text style={[styles.emptyBoxSubtitle, { color: colors.textSecondary }]}>
                {activeTab === 'available'
                  ? 'Bạn có giáo trình cũ hay đồ dùng DNTU không dùng nữa? Đăng bán ngay cho các bạn sinh viên nhé!'
                  : activeTab === 'sold'
                  ? 'Các món đồ khi bạn đánh dấu đã bán xong sẽ được lưu trữ tại đây.'
                  : 'Khi bạn đặt lịch hẹn gặp người bán tại các điểm trong trường DNTU, thông tin lịch hẹn sẽ hiển thị ở đây.'}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notLoggedInWrapper: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
    gap: Spacing.md,
  },
  welcomeCard: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: Spacing.xs,
  },
  badgePill: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(52, 72, 238, 0.1)',
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3448EE',
    letterSpacing: 0.8,
  },
  loginCardTitle: {
    ...Typography.title,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  loginCardSubtitle: {
    ...Typography.body,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  fullWidthBtn: {
    width: '100%',
  },
  guidelineCard: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    padding: Spacing.md,
    gap: Spacing.xs + 2,
  },
  guidelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  guidelineTitle: {
    ...Typography.subTitle,
    fontWeight: '700',
    fontSize: 14,
  },
  guidelineItem: {
    fontSize: 12,
    lineHeight: 18,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl + 30,
    gap: Spacing.sm,
  },
  profileHeaderContent: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  studentCard: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  cardHeaderTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#12140F',
    letterSpacing: 0.8,
  },
  logoutIconBtn: {
    padding: Spacing.xs,
  },
  studentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  studentDetails: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    ...Typography.title,
    fontSize: 18,
    fontWeight: '800',
  },
  studentIdLabel: {
    ...Typography.caption,
  },
  phoneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  phoneTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '60%',
  },
  quickNavRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 2,
  },
  quickNavCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: Spacing.xs + 2,
  },
  quickNavIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickNavTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  quickNavSub: {
    fontSize: 10.5,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    padding: 3,
    marginTop: Spacing.xs,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  segmentActiveBtn: {},
  segmentText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  productItemCard: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    padding: Spacing.sm,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  thumbWrapper: {
    width: 84,
    height: 84,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  itemLocation: {
    fontSize: 11,
  },
  itemActionsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 4,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: 4,
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  meetupCard: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    padding: Spacing.sm + 2,
    gap: Spacing.xs + 2,
  },
  meetupCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meetupRoleTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  meetupRoleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  meetupStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  meetupStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  meetupProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1,
    padding: 6,
    gap: 8,
  },
  meetupProductThumb: {
    width: 38,
    height: 38,
    borderRadius: 4,
  },
  meetupProductTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  meetupProductPrice: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  meetupDetailsBox: {
    gap: 4,
    paddingVertical: 2,
  },
  meetupDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meetupDetailText: {
    fontSize: 12,
  },
  meetupActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs + 2,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 6,
  },
  meetupActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    gap: 4,
  },
  meetupActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  emptyBoxTitle: {
    ...Typography.subTitle,
    fontWeight: '800',
    marginTop: Spacing.xs,
  },
  emptyBoxSubtitle: {
    ...Typography.body,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});


