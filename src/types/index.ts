export interface User {
  id: number;
  name: string;
  studentId: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
}

export type ProductCategory = 'book' | 'dorm' | 'tech' | 'vehicle' | 'fashion' | 'other';

export const CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: 'book', label: 'Giáo trình & Sách' },
  { id: 'dorm', label: 'Đồ dùng KTX' },
  { id: 'tech', label: 'Đồ điện tử' },
  { id: 'vehicle', label: 'Xe cộ' },
  { id: 'fashion', label: 'Quần áo & Giày' },
  { id: 'other', label: 'Khác' },
];

export interface Product {
  id: number;
  userId: number;
  title: string;
  description?: string;
  price: number;
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
}

export interface AuthSession {
  userId: number | null;
  isLoggedIn: boolean;
  user: User | null;
}
