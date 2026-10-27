import * as SQLite from 'expo-sqlite';
import {
  AuthSession,
  CartItem,
  DNTU_MEETING_POINTS,
  MeetingPoint,
  Meetup,
  ProductCategory,
  ProductWithSeller,
  User,
} from '@/types';

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
 * Tự động tạo dữ liệu mẫu DNTU nếu hệ thống chưa có
 */
async function seedInitialData(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    // 1. Seed danh sách điểm hẹn trong khuôn viên trường DNTU
    const meetingPointCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM meeting_points'
    );
    if (!meetingPointCount || meetingPointCount.count === 0) {
      for (const pt of DNTU_MEETING_POINTS) {
        await db.runAsync(
          `INSERT INTO meeting_points (name, code, area, description, x_ratio, y_ratio, is_active)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [pt.name, pt.code, pt.area, pt.description, pt.xRatio, pt.yRatio]
        );
      }
    }

    // 2. Seed sản phẩm mẫu nếu chưa có
    const countResult = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM products');
    if (countResult && countResult.count > 0) {
      return;
    }

    let demoUser = await db.getFirstAsync<{ id: number }>('SELECT id FROM users WHERE student_id = ?', ['DNTU202401']);
    let userId = demoUser?.id;

    if (!userId) {
      const res = await db.runAsync(
        `INSERT INTO users (name, student_id, password, phone, avatar) 
         VALUES (?, ?, ?, ?, ?)`,
        ['Nguyễn Đức Huy', 'DNTU202401', '123456', '0987654321', null]
      );
      userId = res.lastInsertRowId;
    }

    const demoProducts = [
      {
        title: 'Giáo trình Giải tích 1 + Đề cương ôn thi DNTU',
        description: 'Sách bìa kiếng còn mới 95%, có kèm tập ghi chép giải bài tập và đề thi các năm trước của khoa.',
        price: 35000,
        stock: 2,
        category: 'book',
        location: 'Thư viện DNTU (Tầng 1)',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
      },
      {
        title: 'Nồi cơm điện tử Bear 1.2L dùng phòng KTX DNTU',
        description: 'Nồi nhỏ gọn chống dính siêu bền, công suất 300W thích hợp dùng phòng KTX không sợ quá tải điện.',
        price: 120000,
        stock: 1,
        category: 'dorm',
        location: 'Căn tin & Khu tự học',
        imageUrl: 'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?w=600',
      },
      {
        title: 'Máy tính Casio fx-580VN X chính hãng Bitex',
        description: 'Đầy đủ nắp trượt, còn bảo hành 1 năm, phím bấm cực êm, màn hình nét không điểm chết.',
        price: 280000,
        stock: 1,
        category: 'tech',
        location: 'Sảnh Giảng đường A',
        imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600',
      },
      {
        title: 'Bộ giỏ móc quần áo + kẹp phơi đồ KTX DNTU',
        description: 'Mình chuyển trọ về quê nên thanh lý rẻ cho bạn sinh viên nào mới vào phòng cần dùng nha!',
        price: 15000,
        stock: 1,
        category: 'dorm',
        location: 'Cổng chính DNTU (Cổng A)',
        imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600',
      },
      {
        title: 'Bàn học gấp gọn đa năng có khay đựng ly & iPad',
        description: 'Bàn chân sắt bọc cao su chống trượt chữ U, mặt bàn gỗ công nghiệp ép láng mịn sạch sẽ.',
        price: 49000,
        stock: 3,
        category: 'dorm',
        location: 'Căn tin & Khu tự học',
        imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600',
      },
      {
        title: 'Xe đạp cào cào Martin đi học DNTU siêu bền',
        description: 'Xe đạp nhẹ, lốp mới thay, thắng ăn, có gắn kèm giỏ xe và khóa dây an toàn số 4 số.',
        price: 450000,
        stock: 1,
        category: 'vehicle',
        location: 'Cổng chính DNTU (Cổng A)',
        imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600',
      },
      {
        title: 'Tai nghe Bluetooth Lenovo Thinkplus bass trầm học bài',
        description: 'Hộp sạc nhỏ gọn, pin trâu 5 tiếng, có sạc Type-C, mic đàm thoại rõ khi học online meeting.',
        price: 95000,
        stock: 1,
        category: 'tech',
        location: 'Thư viện DNTU (Tầng 1)',
        imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600',
      },
      {
        title: 'Áo khoác gió đồng phục DNTU màu xanh size L',
        description: 'Chất vải dù chống mưa nhẹ 2 lớp, mặc mùa mưa đi học cực kỳ tiện, mới giặt thơm tho.',
        price: 65000,
        stock: 2,
        category: 'fashion',
        location: 'Nhà thi đấu Thể thao DNTU',
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600',
      },
    ];

    for (const p of demoProducts) {
      await db.runAsync(
        `INSERT INTO products (user_id, title, description, price, stock, category, location, image_url, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
        [userId, p.title, p.description, p.price, p.stock, p.category, p.location, p.imageUrl]
      );
    }
  } catch (err) {
    console.warn('Seed data error:', err);
  }
}

/**
 * Khởi tạo cấu trúc các bảng (users, products, session, favorites, cart_items, meeting_points, meetups, orders)
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
      role TEXT DEFAULT 'student',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      stock INTEGER DEFAULT 1,
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

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      UNIQUE(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meeting_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      area TEXT NOT NULL,
      description TEXT,
      x_ratio REAL NOT NULL,
      y_ratio REAL NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS meetups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER NOT NULL,
      buyer_id INTEGER NOT NULL,
      seller_id INTEGER NOT NULL,
      meeting_point_id INTEGER NOT NULL,
      scheduled_at TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
      FOREIGN KEY (meeting_point_id) REFERENCES meeting_points (id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      subtotal INTEGER NOT NULL,
      delivery_fee INTEGER DEFAULT 0,
      total INTEGER NOT NULL,
      meeting_point_id INTEGER,
      scheduled_at TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  await seedInitialData(db);
  // Đảm bảo không còn sản phẩm 0đ trong hệ thống
  await db.runAsync("UPDATE products SET price = 15000, title = 'Bộ giỏ móc quần áo + kẹp phơi đồ KTX DNTU' WHERE price = 0");
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
  role?: string;
  created_at: string;
}

function mapUserRow(row: DbUserRow): User {
  return {
    id: row.id,
    name: row.name,
    studentId: row.student_id,
    phone: row.phone ?? undefined,
    avatar: row.avatar ?? undefined,
    role: (row.role as 'student' | 'admin') || 'student',
    createdAt: row.created_at,
  };
}

export async function registerUser(data: {
  name: string;
  studentId: string;
  password: string;
  phone?: string;
  avatar?: string;
}): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const db = await getDb();

    const existing = await db.getFirstAsync<DbUserRow>(
      'SELECT id FROM users WHERE student_id = ?',
      [data.studentId.trim().toUpperCase()]
    );

    if (existing) {
      return { success: false, error: 'Mã sinh viên này đã được đăng ký tài khoản!' };
    }

    const result = await db.runAsync(
      `INSERT INTO users (name, student_id, password, phone, avatar, role) 
       VALUES (?, ?, ?, ?, ?, 'student')`,
      [
        data.name.trim(),
        data.studentId.trim().toUpperCase(),
        data.password,
        data.phone ? data.phone.trim() : null,
        data.avatar ?? null,
      ]
    );

    const newUser = await db.getFirstAsync<DbUserRow>(
      'SELECT id, name, student_id, phone, avatar, role, created_at FROM users WHERE id = ?',
      [result.lastInsertRowId]
    );

    if (!newUser) {
      return { success: false, error: 'Không thể tạo tài khoản, vui lòng thử lại.' };
    }

    await db.runAsync('UPDATE session SET user_id = ?, is_logged_in = 1 WHERE id = 1', [newUser.id]);

    return { success: true, user: mapUserRow(newUser) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi khi đăng ký tài khoản' };
  }
}

export async function loginUser(
  studentId: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const db = await getDb();

    const userRow = await db.getFirstAsync<DbUserRow>(
      'SELECT id, name, student_id, password, phone, avatar, role, created_at FROM users WHERE student_id = ?',
      [studentId.trim().toUpperCase()]
    );

    if (!userRow || userRow.password !== password) {
      return { success: false, error: 'Mã sinh viên hoặc mật khẩu không chính xác!' };
    }

    await db.runAsync('UPDATE session SET user_id = ?, is_logged_in = 1 WHERE id = 1', [userRow.id]);

    return { success: true, user: mapUserRow(userRow) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi khi đăng nhập' };
  }
}

export async function logoutUser(): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE session SET user_id = NULL, is_logged_in = 0 WHERE id = 1');
}

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
      'SELECT id, name, student_id, phone, avatar, role, created_at FROM users WHERE id = ?',
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
  stock?: number;
  category: string;
  location: string;
  image_url: string | null;
  status: string;
  created_at: string;
  seller_name?: string;
  seller_student_id?: string;
  seller_phone?: string | null;
  is_favorited?: number;
}

function mapProductWithSeller(row: DbProductRow): ProductWithSeller {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    price: row.price,
    stock: row.stock ?? 1,
    category: row.category as ProductCategory,
    location: row.location,
    imageUrl: row.image_url ?? undefined,
    status: row.status as 'available' | 'sold',
    createdAt: row.created_at,
    sellerName: row.seller_name ?? 'Sinh viên DNTU',
    sellerStudentId: row.seller_student_id ?? '',
    sellerPhone: row.seller_phone ?? undefined,
    isFavorited: Boolean(row.is_favorited),
  };
}

export async function createProduct(data: {
  userId: number;
  title: string;
  description?: string;
  price: number;
  stock?: number;
  category: ProductCategory;
  location: string;
  imageUrl?: string;
}): Promise<{ success: boolean; productId?: number; error?: string }> {
  try {
    const db = await getDb();

    const result = await db.runAsync(
      `INSERT INTO products (user_id, title, description, price, stock, category, location, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
      [
        data.userId,
        data.title.trim(),
        data.description ? data.description.trim() : null,
        data.price,
        data.stock ?? 1,
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

export async function getProducts(options?: {
  category?: ProductCategory | 'all';
  search?: string;
  userId?: number;
  status?: 'available' | 'sold' | 'all';
  currentUserId?: number;
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
    conditions.push("p.status = 'available'");
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const favUserId = options?.currentUserId ?? 0;

  const sql = `
    SELECT 
      p.*,
      u.name AS seller_name,
      u.student_id AS seller_student_id,
      u.phone AS seller_phone,
      (SELECT COUNT(*) FROM favorites f WHERE f.product_id = p.id AND f.user_id = ?) AS is_favorited
    FROM products p
    LEFT JOIN users u ON p.user_id = u.id
    ${whereClause}
    ORDER BY p.id DESC
  `;

  const rows = await db.getAllAsync<DbProductRow>(sql, [favUserId, ...params]);
  return rows.map(mapProductWithSeller);
}

export async function getProductById(id: number, currentUserId?: number): Promise<ProductWithSeller | null> {
  const db = await getDb();
  const favUserId = currentUserId ?? 0;

  const sql = `
    SELECT 
      p.*,
      u.name AS seller_name,
      u.student_id AS seller_student_id,
      u.phone AS seller_phone,
      (SELECT COUNT(*) FROM favorites f WHERE f.product_id = p.id AND f.user_id = ?) AS is_favorited
    FROM products p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
    LIMIT 1
  `;

  const row = await db.getFirstAsync<DbProductRow>(sql, [favUserId, id]);
  return row ? mapProductWithSeller(row) : null;
}

export async function updateProductStatus(
  id: number,
  status: 'available' | 'sold',
  userId: number
): Promise<boolean> {
  const db = await getDb();
  const result = await db.runAsync('UPDATE products SET status = ? WHERE id = ? AND user_id = ?', [
    status,
    id,
    userId,
  ]);
  return result.changes > 0;
}

export async function deleteProduct(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  const result = await db.runAsync('DELETE FROM products WHERE id = ? AND user_id = ?', [id, userId]);
  return result.changes > 0;
}

/* =======================================================================
 * PHÂN HỆ 4 — YÊU THÍCH (FAVORITES)
 * ======================================================================= */

export async function toggleFavorite(userId: number, productId: number): Promise<boolean> {
  const db = await getDb();
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM favorites WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );

  if (existing) {
    await db.runAsync('DELETE FROM favorites WHERE user_id = ? AND product_id = ?', [userId, productId]);
    return false; // đã bỏ yêu thích
  } else {
    await db.runAsync('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)', [userId, productId]);
    return true; // đã thêm yêu thích
  }
}

export async function getFavoriteProducts(userId: number): Promise<ProductWithSeller[]> {
  const db = await getDb();
  const sql = `
    SELECT 
      p.*,
      u.name AS seller_name,
      u.student_id AS seller_student_id,
      u.phone AS seller_phone,
      1 AS is_favorited
    FROM favorites f
    INNER JOIN products p ON f.product_id = p.id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE f.user_id = ?
    ORDER BY f.id DESC
  `;
  const rows = await db.getAllAsync<DbProductRow>(sql, [userId]);
  return rows.map(mapProductWithSeller);
}

/* =======================================================================
 * PHÂN HỆ 5 — GIỎ HÀNG & CHECKOUT (CART & STOCK)
 * ======================================================================= */

export async function addToCart(
  userId: number,
  productId: number,
  quantity = 1
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();

  // Kiểm tra tồn kho
  const prod = await db.getFirstAsync<{ stock: number; status: string }>(
    'SELECT stock, status FROM products WHERE id = ?',
    [productId]
  );

  if (!prod || prod.status !== 'available' || prod.stock <= 0) {
    return { success: false, error: 'Món đồ đã hết hàng hoặc đã thanh lý!' };
  }

  const existing = await db.getFirstAsync<{ id: number; quantity: number }>(
    'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > prod.stock) {
      return { success: false, error: `Số lượng vượt quá tồn kho (còn ${prod.stock} món)!` };
    }
    await db.runAsync('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing.id]);
  } else {
    if (quantity > prod.stock) {
      return { success: false, error: `Chỉ còn ${prod.stock} món trong kho!` };
    }
    await db.runAsync('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [
      userId,
      productId,
      quantity,
    ]);
  }

  return { success: true };
}

export async function updateCartQuantity(cartItemId: number, quantity: number): Promise<boolean> {
  const db = await getDb();
  if (quantity <= 0) {
    await db.runAsync('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
  } else {
    await db.runAsync('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, cartItemId]);
  }
  return true;
}

export async function removeFromCart(cartItemId: number): Promise<boolean> {
  const db = await getDb();
  await db.runAsync('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
  return true;
}

export async function getCartItems(userId: number): Promise<CartItem[]> {
  const db = await getDb();
  const sql = `
    SELECT 
      c.id AS cart_id,
      c.user_id,
      c.product_id,
      c.quantity,
      p.id,
      p.user_id AS seller_user_id,
      p.title,
      p.description,
      p.price,
      p.stock,
      p.category,
      p.location,
      p.image_url,
      p.status,
      p.created_at,
      u.name AS seller_name,
      u.student_id AS seller_student_id,
      u.phone AS seller_phone
    FROM cart_items c
    INNER JOIN products p ON c.product_id = p.id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE c.user_id = ?
    ORDER BY c.id DESC
  `;

  interface DbCartRow extends DbProductRow {
    cart_id: number;
    product_id: number;
    quantity: number;
  }

  const rows = await db.getAllAsync<DbCartRow>(sql, [userId]);
  return rows.map((r) => ({
    id: r.cart_id,
    userId: r.user_id,
    productId: r.product_id,
    quantity: r.quantity,
    product: mapProductWithSeller(r),
  }));
}

export async function clearCart(userId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM cart_items WHERE user_id = ?', [userId]);
}

/* =======================================================================
 * PHÂN HỆ 6 — MINI MAP & LỊCH HẸN KHUÔN VIÊN TRƯỜNG DNTU
 * ======================================================================= */

export async function getMeetingPoints(): Promise<MeetingPoint[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    code: string;
    area: string;
    description: string;
    x_ratio: number;
    y_ratio: number;
    is_active: number;
  }>('SELECT * FROM meeting_points WHERE is_active = 1 ORDER BY id ASC');

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    area: r.area,
    description: r.description,
    xRatio: r.x_ratio,
    yRatio: r.y_ratio,
    isActive: Boolean(r.is_active),
  }));
}

export async function createMeetup(data: {
  productId: number;
  buyerId: number;
  sellerId: number;
  meetingPointId: number;
  scheduledAt: string;
  notes?: string;
  orderId?: number;
}): Promise<{ success: boolean; meetupId?: number; error?: string }> {
  try {
    const db = await getDb();

    const res = await db.runAsync(
      `INSERT INTO meetups (order_id, product_id, buyer_id, seller_id, meeting_point_id, scheduled_at, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        data.orderId ?? null,
        data.productId,
        data.buyerId,
        data.sellerId,
        data.meetingPointId,
        data.scheduledAt,
        data.notes ?? null,
      ]
    );

    return { success: true, meetupId: res.lastInsertRowId };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Không thể tạo lịch hẹn gặp.' };
  }
}

export async function getMeetups(userId: number): Promise<Meetup[]> {
  const db = await getDb();
  const sql = `
    SELECT 
      m.*,
      mp.name AS meeting_point_name,
      mp.area AS meeting_point_area,
      p.title AS product_title,
      p.price AS product_price,
      p.image_url AS product_image,
      b.name AS buyer_name,
      s.name AS seller_name
    FROM meetups m
    LEFT JOIN meeting_points mp ON m.meeting_point_id = mp.id
    LEFT JOIN products p ON m.product_id = p.id
    LEFT JOIN users b ON m.buyer_id = b.id
    LEFT JOIN users s ON m.seller_id = s.id
    WHERE m.buyer_id = ? OR m.seller_id = ?
    ORDER BY m.id DESC
  `;

  interface DbMeetupRow {
    id: number;
    order_id: number | null;
    product_id: number;
    buyer_id: number;
    seller_id: number;
    meeting_point_id: number;
    scheduled_at: string;
    status: string;
    notes: string | null;
    created_at: string;
    meeting_point_name?: string;
    meeting_point_area?: string;
    product_title?: string;
    product_price?: number;
    product_image?: string | null;
    buyer_name?: string;
    seller_name?: string;
  }

  const rows = await db.getAllAsync<DbMeetupRow>(sql, [userId, userId]);
  return rows.map((r) => ({
    id: r.id,
    orderId: r.order_id ?? undefined,
    productId: r.product_id,
    buyerId: r.buyer_id,
    sellerId: r.seller_id,
    meetingPointId: r.meeting_point_id,
    meetingPointName: r.meeting_point_name,
    meetingPointArea: r.meeting_point_area,
    scheduledAt: r.scheduled_at,
    status: r.status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
    productTitle: r.product_title,
    productPrice: r.product_price,
    productImage: r.product_image ?? undefined,
    buyerName: r.buyer_name,
    sellerName: r.seller_name,
  }));
}

export async function updateMeetupStatus(
  meetupId: number,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
): Promise<boolean> {
  const db = await getDb();
  const res = await db.runAsync('UPDATE meetups SET status = ? WHERE id = ?', [status, meetupId]);
  return res.changes > 0;
}
