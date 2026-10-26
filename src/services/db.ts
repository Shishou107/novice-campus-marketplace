import * as SQLite from 'expo-sqlite';
import { AuthSession, Product, ProductCategory, ProductWithSeller, User } from '@/types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Lấy hoặc khởi tạo instance SQLite Database kết nối cục bộ
 */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('campus_marketplace.db');
  }
  return dbInstance;
}

/**
 * Khởi tạo cấu trúc các bảng (users, products, session)
 */
export async function initDatabase(): Promise<void> {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      student_id TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      avatar TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      image_url TEXT,
      status TEXT DEFAULT 'available',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_id INTEGER,
      is_logged_in INTEGER DEFAULT 0
    );

    INSERT OR IGNORE INTO session (id, user_id, is_logged_in) VALUES (1, NULL, 0);
  `);
}

/* =======================================================================
 * CÁC HÀM XỬ LÝ TÀI KHOẢN VÀ PHIÊN ĐĂNG NHẬP (AUTH & SESSION)
 * ======================================================================= */

interface DbUserRow {
  id: number;
  name: string;
  student_id: string;
  password?: string;
  phone: string | null;
  avatar: string | null;
  created_at: string;
}

function mapUserRow(row: DbUserRow): User {
  return {
    id: row.id,
    name: row.name,
    studentId: row.student_id,
    phone: row.phone ?? undefined,
    avatar: row.avatar ?? undefined,
    createdAt: row.created_at,
  };
}

/**
 * Đăng ký tài khoản sinh viên mới
 */
export async function registerUser(data: {
  name: string;
  studentId: string;
  password: string;
  phone?: string;
  avatar?: string;
}): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const db = await getDb();

    // Kiểm tra xem mã sinh viên đã được đăng ký chưa
    const existing = await db.getFirstAsync<DbUserRow>(
      'SELECT id FROM users WHERE student_id = ?',
      [data.studentId.trim().toUpperCase()]
    );

    if (existing) {
      return { success: false, error: 'Mã sinh viên này đã được đăng ký tài khoản!' };
    }

    const result = await db.runAsync(
      `INSERT INTO users (name, student_id, password, phone, avatar) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.name.trim(),
        data.studentId.trim().toUpperCase(),
        data.password,
        data.phone ? data.phone.trim() : null,
        data.avatar ?? null,
      ]
    );

    const newUser = await db.getFirstAsync<DbUserRow>(
      'SELECT id, name, student_id, phone, avatar, created_at FROM users WHERE id = ?',
      [result.lastInsertRowId]
    );

    if (!newUser) {
      return { success: false, error: 'Không thể tạo tài khoản, vui lòng thử lại.' };
    }

    // Tự động đăng nhập vào session
    await db.runAsync(
      'UPDATE session SET user_id = ?, is_logged_in = 1 WHERE id = 1',
      [newUser.id]
    );

    return { success: true, user: mapUserRow(newUser) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi khi đăng ký tài khoản' };
  }
}

/**
 * Đăng nhập tài khoản sinh viên
 */
export async function loginUser(
  studentId: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const db = await getDb();

    const userRow = await db.getFirstAsync<DbUserRow>(
      'SELECT id, name, student_id, password, phone, avatar, created_at FROM users WHERE student_id = ?',
      [studentId.trim().toUpperCase()]
    );

    if (!userRow || userRow.password !== password) {
      return { success: false, error: 'Mã sinh viên hoặc mật khẩu không chính xác!' };
    }

    // Cập nhật session đang hoạt động
    await db.runAsync(
      'UPDATE session SET user_id = ?, is_logged_in = 1 WHERE id = 1',
      [userRow.id]
    );

    return { success: true, user: mapUserRow(userRow) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi khi đăng nhập' };
  }
}

/**
 * Đăng xuất khỏi phiên hiện tại
 */
export async function logoutUser(): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE session SET user_id = NULL, is_logged_in = 0 WHERE id = 1');
}

/**
 * Lấy thông tin phiên đăng nhập hiện tại
 */
export async function getCurrentSession(): Promise<AuthSession> {
  try {
    const db = await getDb();

    interface SessionRow {
      user_id: number | null;
      is_logged_in: number;
    }

    const session = await db.getFirstAsync<SessionRow>('SELECT user_id, is_logged_in FROM session WHERE id = 1');

    if (!session || !session.is_logged_in || !session.user_id) {
      return { userId: null, isLoggedIn: false, user: null };
    }

    const userRow = await db.getFirstAsync<DbUserRow>(
      'SELECT id, name, student_id, phone, avatar, created_at FROM users WHERE id = ?',
      [session.user_id]
    );

    if (!userRow) {
      return { userId: null, isLoggedIn: false, user: null };
    }

    return {
      userId: userRow.id,
      isLoggedIn: true,
      user: mapUserRow(userRow),
    };
  } catch {
    return { userId: null, isLoggedIn: false, user: null };
  }
}

/* =======================================================================
 * CÁC HÀM XỬ LÝ SẢN PHẨM MUA BÁN (PRODUCTS CRUD)
 * ======================================================================= */

interface DbProductRow {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  price: number;
  category: string;
  location: string;
  image_url: string | null;
  status: string;
  created_at: string;
  seller_name?: string;
  seller_student_id?: string;
  seller_phone?: string | null;
}

function mapProductWithSeller(row: DbProductRow): ProductWithSeller {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    price: row.price,
    category: row.category as ProductCategory,
    location: row.location,
    imageUrl: row.image_url ?? undefined,
    status: row.status as 'available' | 'sold',
    createdAt: row.created_at,
    sellerName: row.seller_name ?? 'Sinh viên ẩn danh',
    sellerStudentId: row.seller_student_id ?? '',
    sellerPhone: row.seller_phone ?? undefined,
  };
}

/**
 * Đăng tin bán sản phẩm mới
 */
export async function createProduct(data: {
  userId: number;
  title: string;
  description?: string;
  price: number;
  category: ProductCategory;
  location: string;
  imageUrl?: string;
}): Promise<{ success: boolean; productId?: number; error?: string }> {
  try {
    const db = await getDb();

    const result = await db.runAsync(
      `INSERT INTO products (user_id, title, description, price, category, location, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'available')`,
      [
        data.userId,
        data.title.trim(),
        data.description ? data.description.trim() : null,
        data.price,
        data.category,
        data.location.trim(),
        data.imageUrl ?? null,
      ]
    );

    return { success: true, productId: result.lastInsertRowId };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi khi đăng tin' };
  }
}

/**
 * Lấy danh sách sản phẩm (có thể lọc theo danh mục, từ khóa tìm kiếm hoặc theo người bán)
 */
export async function getProducts(options?: {
  category?: ProductCategory | 'all';
  search?: string;
  userId?: number;
  status?: 'available' | 'sold' | 'all';
}): Promise<ProductWithSeller[]> {
  const db = await getDb();

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options?.category && options.category !== 'all') {
    conditions.push('p.category = ?');
    params.push(options.category);
  }

  if (options?.search && options.search.trim().length > 0) {
    conditions.push('(p.title LIKE ? OR p.description LIKE ?)');
    const searchTerm = `%${options.search.trim()}%`;
    params.push(searchTerm, searchTerm);
  }

  if (options?.userId) {
    conditions.push('p.user_id = ?');
    params.push(options.userId);
  }

  if (options?.status && options.status !== 'all') {
    conditions.push('p.status = ?');
    params.push(options.status);
  } else if (!options?.userId) {
    // Mặc định ở trang chủ chỉ hiển thị đồ còn bán (available)
    conditions.push("p.status = 'available'");
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      p.*,
      u.name AS seller_name,
      u.student_id AS seller_student_id,
      u.phone AS seller_phone
    FROM products p
    LEFT JOIN users u ON p.user_id = u.id
    ${whereClause}
    ORDER BY p.id DESC
  `;

  const rows = await db.getAllAsync<DbProductRow>(sql, params);
  return rows.map(mapProductWithSeller);
}

/**
 * Lấy chi tiết một sản phẩm theo ID kèm thông tin người bán
 */
export async function getProductById(id: number): Promise<ProductWithSeller | null> {
  const db = await getDb();

  const sql = `
    SELECT 
      p.*,
      u.name AS seller_name,
      u.student_id AS seller_student_id,
      u.phone AS seller_phone
    FROM products p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
    LIMIT 1
  `;

  const row = await db.getFirstAsync<DbProductRow>(sql, [id]);
  return row ? mapProductWithSeller(row) : null;
}

/**
 * Cập nhật trạng thái sản phẩm (ví dụ: đã bán xong)
 */
export async function updateProductStatus(
  id: number,
  status: 'available' | 'sold',
  userId: number
): Promise<boolean> {
  const db = await getDb();
  const result = await db.runAsync(
    'UPDATE products SET status = ? WHERE id = ? AND user_id = ?',
    [status, id, userId]
  );
  return result.changes > 0;
}

/**
 * Xóa một sản phẩm
 */
export async function deleteProduct(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  const result = await db.runAsync(
    'DELETE FROM products WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.changes > 0;
}
