import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Meetup, ProductCategory, ProductWithSeller, User } from '@/types';

/**
 * Tự động phát hiện địa chỉ IP của máy chủ đồng bộ giữa các máy (LAN IP)
 */
export function getServerBaseUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:5001`;
  }

  // Trên Expo Go (Android/iOS vật lý qua mạng Wi-Fi trường DNTU)
  const hostUri = Constants.expoConfig?.hostUri || '';
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:5001`;
    }
  }

  // Mặc định IP Wi-Fi nội bộ
  return 'http://192.168.1.9:5001';
}

const TIMEOUT_MS = 3000;

async function requestWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Kiểm tra trạng thái máy chủ đồng bộ
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await requestWithTimeout(`${getServerBaseUrl()}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Tải danh sách lịch hẹn từ Server (đồng bộ giữa các thiết bị)
 */
export async function apiGetMeetups(userId: number): Promise<Meetup[] | null> {
  try {
    const res = await requestWithTimeout(`${getServerBaseUrl()}/api/meetups?userId=${userId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data as Meetup[];
  } catch {
    return null;
  }
}

/**
 * Tạo lịch hẹn mới lên Server để người bán ở thiết bị khác nhận được
 */
export async function apiCreateMeetup(data: {
  orderId?: number;
  productId: number;
  buyerId: number;
  sellerId: number;
  meetingPointId: number;
  scheduledAt: string;
  notes?: string;
}): Promise<{ success: boolean; meetupId?: number } | null> {
  try {
    const res = await requestWithTimeout(`${getServerBaseUrl()}/api/meetups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Cập nhật trạng thái lịch hẹn (Xác nhận / Hoàn thành / Hủy)
 */
export async function apiUpdateMeetupStatus(
  meetupId: number,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
): Promise<boolean | null> {
  try {
    const res = await requestWithTimeout(`${getServerBaseUrl()}/api/meetups/${meetupId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch {
    return null;
  }
}

/**
 * Tải danh sách sản phẩm từ Server
 */
export async function apiGetProducts(currentUserId?: number): Promise<ProductWithSeller[] | null> {
  try {
    const res = await requestWithTimeout(
      `${getServerBaseUrl()}/api/products${currentUserId ? `?currentUserId=${currentUserId}` : ''}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data as ProductWithSeller[];
  } catch {
    return null;
  }
}

/**
 * Đăng bán sản phẩm mới lên Server
 */
export async function apiCreateProduct(data: {
  userId: number;
  title: string;
  description?: string;
  price: number;
  stock?: number;
  category: ProductCategory;
  location: string;
  imageUrl?: string;
}): Promise<{ success: boolean; productId?: number } | null> {
  try {
    const res = await requestWithTimeout(`${getServerBaseUrl()}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Đồng bộ Yêu thích
 */
export async function apiToggleFavorite(userId: number, productId: number): Promise<boolean | null> {
  try {
    const res = await requestWithTimeout(`${getServerBaseUrl()}/api/favorites/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Boolean(data.isFavorited);
  } catch {
    return null;
  }
}

export async function apiGetFavoriteIds(userId: number): Promise<number[] | null> {
  try {
    const res = await requestWithTimeout(`${getServerBaseUrl()}/api/favorites?userId=${userId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Đồng bộ Đăng nhập / Đăng ký qua Server
 */
export async function apiLogin(studentId: string, password: string): Promise<{ success: boolean; user?: User; error?: string } | null> {
  try {
    const res = await requestWithTimeout(`${getServerBaseUrl()}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, password }),
    });
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

export async function apiRegister(data: {
  name: string;
  studentId: string;
  password: string;
  phone?: string;
  avatar?: string;
}): Promise<{ success: boolean; user?: User; error?: string } | null> {
  try {
    const res = await requestWithTimeout(`${getServerBaseUrl()}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json;
  } catch {
    return null;
  }
}

export async function apiGetUsers(): Promise<User[] | null> {
  try {
    const res = await requestWithTimeout(`${getServerBaseUrl()}/api/users`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

