import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useNetwork } from '@/context/NetworkContext';
import { useTheme } from '@/hooks/use-theme';

export function NetworkBanner() {
  const colors = useTheme();
  const {
    isConnected,
    isDntuWifi,
    networkName,
    isSimulated,
    setSimulatedDntuWifi,
    setSimulatedOffline,
  } = useNetwork();

  const [modalVisible, setModalVisible] = useState(false);

  // Khi ngoại tuyến (offline)
  if (!isConnected) {
    return (
      <>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setModalVisible(true)}
          style={[styles.offlineBanner, { backgroundColor: colors.butter, borderColor: colors.border }]}
        >
          <Ionicons name="cloud-offline" size={16} color="#12140F" />
          <Text style={styles.offlineText} numberOfLines={1}>
            <Text style={{ fontWeight: '800' }}>Đang ngoại tuyến:</Text> Hiển thị dữ liệu đã lưu (Chạm để xem cài đặt mạng)
          </Text>
        </TouchableOpacity>
        {renderModal()}
      </>
    );
  }

  // Khi trực tuyến nhưng KHÔNG thuộc Wi-Fi trường DNTU (cảnh báo nhẹ nhàng theo yêu cầu phân hệ 2)
  if (!isDntuWifi) {
    return (
      <>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setModalVisible(true)}
          style={[styles.wifiNoticeBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="wifi-outline" size={14} color={colors.warning} />
          <Text style={[styles.wifiNoticeText, { color: colors.textSecondary }]} numberOfLines={1}>
            Mạng: <Text style={{ color: colors.text, fontWeight: '700' }}>{networkName}</Text> (Chạm kiểm tra Wi-Fi DNTU)
          </Text>
        </TouchableOpacity>
        {renderModal()}
      </>
    );
  }

  function renderModal() {
    return (
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalHeaderIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Kiểm soát Mạng trường DNTU</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Xác thực điều kiện truy cập mạng nội bộ Đại học Công nghệ Đồng Nai
              </Text>
            </View>

            <View style={[styles.statusBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Trạng thái kết nối:</Text>
                <View style={styles.statusValueRow}>
                  <View
                    style={[
                      styles.indicatorDot,
                      { backgroundColor: isConnected ? colors.success : colors.danger },
                    ]}
                  />
                  <Text style={[styles.statusValue, { color: isConnected ? colors.success : colors.danger }]}>
                    {isConnected ? 'Trực tuyến' : 'Ngoại tuyến (Offline)'}
                  </Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Điểm truy cập:</Text>
                <Text style={[styles.statusValue, { color: colors.text }]}>{networkName}</Text>
              </View>

              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Quyền đăng tin & hẹn gặp:</Text>
                <Text style={[styles.statusValue, { color: isDntuWifi ? colors.primary : colors.warning }]}>
                  {isDntuWifi ? '✓ Hợp lệ (Wi-Fi DNTU)' : '⚠ Chỉ xem dữ liệu đã lưu'}
                </Text>
              </View>
            </View>

            {/* Mục kiểm thử / Demo dành cho giảng viên và hội đồng nghiệm thu */}
            <View style={styles.demoSection}>
              <Text style={[styles.demoTitle, { color: colors.text }]}>Bảng điều khiển kiểm thử Demo</Text>
              <Text style={[styles.demoDesc, { color: colors.textSecondary }]}>
                Cho phép chuyển đổi trạng thái mạng tức thì để kiểm chứng tiêu chí hoạt động offline và xác thực Wi-Fi DNTU:
              </Text>

              <View style={[styles.toggleRow, { borderColor: colors.border }]}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>Mô phỏng Wi-Fi trường DNTU</Text>
                <Switch
                  value={isDntuWifi && isConnected}
                  onValueChange={(val) => setSimulatedDntuWifi(val)}
                  trackColor={{ false: '#CCCCCC', true: colors.primary }}
                />
              </View>

              <View style={[styles.toggleRow, { borderColor: colors.border }]}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>Chế độ Ngoại tuyến (Mất mạng)</Text>
                <Switch
                  value={!isConnected}
                  onValueChange={(val) => setSimulatedOffline(val)}
                  trackColor={{ false: '#CCCCCC', true: colors.danger }}
                />
              </View>

              {isSimulated ? (
                <Text style={[styles.simulatedNote, { color: colors.accent }]}>
                  * Đang ở chế độ mô phỏng phục vụ nghiệm thu đề án.
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={[styles.closeModalBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.closeModalBtnText}>Đóng bảng điều khiển</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
        style={[styles.connectedPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={[styles.greenDot, { backgroundColor: colors.success }]} />
        <Text style={[styles.connectedPillText, { color: colors.textSecondary }]}>
          Wi-Fi DNTU: <Text style={{ color: colors.text, fontWeight: '700' }}>Đã xác thực</Text>
        </Text>
        <Ionicons name="settings-outline" size={13} color={colors.textSecondary} style={{ marginLeft: 3 }} />
      </TouchableOpacity>
      {renderModal()}
    </>
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
    flex: 1,
    fontSize: 12,
    color: '#12140F',
    fontWeight: '600',
  },
  wifiNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
    gap: 6,
  },
  wifiNoticeText: {
    flex: 1,
    fontSize: 11.5,
  },
  connectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginVertical: 4,
    gap: 5,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
  },
  connectedPillText: {
    fontSize: 11,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 20, 15, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radius.lg,
    borderWidth: 2,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalHeader: {
    alignItems: 'center',
    gap: 6,
  },
  modalHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  modalTitle: {
    ...Typography.title,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalSubtitle: {
    ...Typography.caption,
    textAlign: 'center',
    lineHeight: 16,
  },
  statusBox: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm + 2,
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
  },
  statusValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  statusValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  demoSection: {
    gap: Spacing.xs,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  demoDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  toggleLabel: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  simulatedNote: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 4,
  },
  closeModalBtn: {
    paddingVertical: 11,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: 4,
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13.5,
  },
});

