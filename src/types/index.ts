export interface User {
  id: number;
  name: string;
  studentId: string;
  phone?: string;
  avatar?: string;
  role?: 'student' | 'admin';
  createdAt?: string;
}

export type ProductCategory = 'book' | 'dorm' | 'tech' | 'vehicle' | 'fashion' | 'other';

export const CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: 'book', label: 'Giáo trình & Sách DNTU' },
  { id: 'dorm', label: 'Đồ dùng KTX' },
  { id: 'tech', label: 'Đồ điện tử & Máy tính' },
  { id: 'vehicle', label: 'Xe cộ đi học' },
  { id: 'fashion', label: 'Đồng phục & Quần áo' },
  { id: 'other', label: 'Vật dụng khác' },
];

export interface Product {
  id: number;
  userId: number;
  title: string;
  description?: string;
  price: number;
  stock: number;
  category: ProductCategory;
  location: string;
  imageUrl?: string;
  status: 'available' | 'sold';
  createdAt?: string;
}

export interface ProductWithSeller extends Product {
  sellerName: string;
  sellerStudentId: string;
  sellerPhone?: string;
  isFavorited?: boolean;
}

export interface AuthSession {
  userId: number | null;
  isLoggedIn: boolean;
  user: User | null;
}

// ----------------------------------------------------------------------
// CÁC THỰC THỂ MỚI THEO YÊU CẦU ĐỀ TÀI CAMPUS MARKETPLACE DNTU
// ----------------------------------------------------------------------

export interface Favorite {
  id: number;
  userId: number;
  productId: number;
  createdAt?: string;
}

export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  product?: ProductWithSeller;
}

export interface MeetingPoint {
  id: number;
  name: string;
  code: string;
  area: string;
  description: string;
  xRatio: number; // 0 - 100% tọa độ ngang trên bản đồ khuôn viên
  yRatio: number; // 0 - 100% tọa độ dọc trên bản đồ khuôn viên
  isActive: boolean;
}

export interface Meetup {
  id: number;
  orderId?: number;
  productId: number;
  buyerId: number;
  sellerId: number;
  meetingPointId: number;
  meetingPointName?: string;
  meetingPointArea?: string;
  scheduledAt: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt?: string;
  productTitle?: string;
  productPrice?: number;
  productImage?: string;
  buyerName?: string;
  sellerName?: string;
}

export interface Order {
  id: number;
  buyerId: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  subtotal: number;
  deliveryFee: number;
  total: number;
  meetingPointId?: number;
  scheduledAt?: string;
  notes?: string;
  createdAt?: string;
  items?: CartItem[];
}

export interface NetworkState {
  isConnected: boolean;
  isDntuWifi: boolean;
  networkName: string;
  isSimulated: boolean;
}

// Danh sách các điểm giao dịch hẹn gặp chuẩn được DNTU phê duyệt trong khuôn viên
export const DNTU_MEETING_POINTS: Omit<MeetingPoint, 'id'>[] = [
  {
    name: 'Cổng chính DNTU (Cổng A)',
    code: 'GATE_A',
    area: 'Khu vực Cổng vào',
    description: 'Bảo vệ cổng chính, thuận tiện cho việc ghé lấy đồ trước/sau giờ học',
    xRatio: 50,
    yRatio: 88,
    isActive: true,
  },
  {
    name: 'Thư viện Trung tâm DNTU (Tầng 1)',
    code: 'LIB_F1',
    area: 'Tòa nhà Thư viện',
    description: 'Sảnh ngoài máy lạnh, có bàn ghế ngồi kiểm tra sách và giáo trình',
    xRatio: 28,
    yRatio: 48,
    isActive: true,
  },
  {
    name: 'Căn tin & Khu tự học sinh viên',
    code: 'CANTEEN',
    area: 'Khu ẩm thực & Dịch vụ',
    description: 'Điểm hẹn phổ biến nhất, đông đúc, an toàn và có chỗ ngồi chờ',
    xRatio: 72,
    yRatio: 45,
    isActive: true,
  },
  {
    name: 'Sảnh Giảng đường A (Khu hiệu bộ)',
    code: 'HALL_A',
    area: 'Khu A',
    description: 'Sảnh đón tầng trệt Giảng đường A, gần thang máy trung tâm',
    xRatio: 38,
    yRatio: 28,
    isActive: true,
  },
  {
    name: 'Sảnh Giảng đường B',
    code: 'HALL_B',
    area: 'Khu B',
    description: 'Hành lang rộng rãi tầng trệt Giảng đường B, thoáng mát',
    xRatio: 64,
    yRatio: 26,
    isActive: true,
  },
  {
    name: 'Nhà thi đấu Thể thao DNTU',
    code: 'SPORT_HALL',
    area: 'Khu Thể chất',
    description: 'Sân bóng rổ / nhà thi đấu đa năng, thuận tiện cho sinh viên KTX',
    xRatio: 82,
    yRatio: 75,
    isActive: true,
  },
];

