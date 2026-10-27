import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MeetingPoint } from '@/types';

interface CampusMapProps {
  meetingPoints: MeetingPoint[];
  selectedPointId: number | null;
  onSelectPoint: (point: MeetingPoint) => void;
}

export function CampusMap({
  meetingPoints,
  selectedPointId,
  onSelectPoint,
}: CampusMapProps) {
  const colors = useTheme();

  return (
    <View style={styles.container}>
      {/* Sơ đồ khuôn viên trường DNTU (Vector Styled Campus Layout) */}
      <View
        style={[
          styles.mapBoard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Lưới tọa độ phong cách kiến trúc bản đồ */}
        <View style={styles.gridOverlay} />

        {/* Các khối kiến trúc mô phỏng khuôn viên DNTU */}
        <View style={[styles.buildingBlock, styles.bGate, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <Text style={[styles.buildingCode, { color: colors.textSecondary }]}>CỔNG A (DNTU)</Text>
        </View>

        <View style={[styles.buildingBlock, styles.bHallA, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <Text style={[styles.buildingCode, { color: colors.textSecondary }]}>GIẢNG ĐƯỜNG A</Text>
        </View>

        <View style={[styles.buildingBlock, styles.bHallB, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <Text style={[styles.buildingCode, { color: colors.textSecondary }]}>GIẢNG ĐƯỜNG B</Text>
        </View>

        <View style={[styles.buildingBlock, styles.bLib, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <Text style={[styles.buildingCode, { color: colors.textSecondary }]}>THƯ VIỆN</Text>
        </View>

        <View style={[styles.buildingBlock, styles.bCanteen, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <Text style={[styles.buildingCode, { color: colors.textSecondary }]}>CĂN TIN & TỰ HỌC</Text>
        </View>

        <View style={[styles.buildingBlock, styles.bSport, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <Text style={[styles.buildingCode, { color: colors.textSecondary }]}>NHÀ THI ĐẤU</Text>
        </View>

        {/* Con đường nội bộ trung tâm kết nối các tòa nhà */}
        <View style={[styles.campusPathV, { backgroundColor: colors.border }]} />
        <View style={[styles.campusPathH, { backgroundColor: colors.border }]} />

        {/* Các Marker điểm hẹn giao dịch DNTU */}
        {meetingPoints.map((point) => {
          const isSelected = selectedPointId === point.id;
          return (
            <TouchableOpacity
              key={point.id}
              activeOpacity={0.8}
              onPress={() => onSelectPoint(point)}
              style={[
                styles.markerWrapper,
                {
                  left: `${point.xRatio}%`,
                  top: `${point.yRatio}%`,
                },
              ]}
            >
              <View
                style={[
                  styles.markerPin,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.primary,
                    borderColor: '#12140F',
                    transform: [{ scale: isSelected ? 1.25 : 1 }],
                  },
                ]}
              >
                <Ionicons
                  name={isSelected ? 'checkmark' : 'location'}
                  size={isSelected ? 13 : 11}
                  color={isSelected ? '#12140F' : colors.white}
                />
              </View>

              <View
                style={[
                  styles.markerLabelBox,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.markerLabelText,
                    {
                      color: isSelected ? colors.white : colors.text,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {point.name.replace(' (DNTU)', '').replace(' DNTU', '')}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Chú thích góc bản đồ */}
        <View style={[styles.mapLegend, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="map-outline" size={12} color={colors.primary} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>SƠ ĐỒ KHUÔN VIÊN DNTU</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  mapBoard: {
    width: '100%',
    height: 310,
    borderRadius: Radius.lg,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.25,
  },
  buildingBlock: {
    position: 'absolute',
    borderWidth: 1.5,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  buildingCode: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  bGate: {
    left: '28%',
    top: '84%',
    width: '44%',
    height: 28,
  },
  bHallA: {
    left: '12%',
    top: '16%',
    width: '34%',
    height: 48,
  },
  bHallB: {
    left: '54%',
    top: '16%',
    width: '34%',
    height: 48,
  },
  bLib: {
    left: '8%',
    top: '44%',
    width: '32%',
    height: 44,
  },
  bCanteen: {
    left: '58%',
    top: '42%',
    width: '34%',
    height: 46,
  },
  bSport: {
    left: '68%',
    top: '70%',
    width: '28%',
    height: 34,
  },
  campusPathV: {
    position: 'absolute',
    left: '49%',
    top: '18%',
    width: 6,
    height: '66%',
    borderRadius: Radius.full,
  },
  campusPathH: {
    position: 'absolute',
    left: '15%',
    top: '40%',
    width: '70%',
    height: 5,
    borderRadius: Radius.full,
  },
  markerWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    zIndex: 10,
  },
  markerPin: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  markerLabelBox: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginTop: 2,
    maxWidth: 95,
  },
  markerLabelText: {
    fontSize: 9,
    textAlign: 'center',
  },
  mapLegend: {
    position: 'absolute',
    bottom: Spacing.xs + 2,
    left: Spacing.xs + 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: 4,
    zIndex: 5,
  },
  legendText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
