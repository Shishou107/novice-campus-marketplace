const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 5001;
const DATA_FILE = path.join(__dirname, 'data.json');

const INITIAL_DATA = {
  users: [
    {
      id: 1,
      name: 'Nguyễn Đức Huy',
      studentId: 'DNTU202401',
      password: '123456',
      phone: '0987654321',
      avatar: null,
      role: 'student',
      createdAt: '2026-10-27 08:00:00',
    },
    {
      id: 2,
      name: 'Nguyễn Tấn Tài',
      studentId: '1923050065',
      password: '123456',
      phone: '0912345678',
      avatar: null,
      role: 'student',
      createdAt: '2026-10-27 08:00:00',
    },
  ],
  products: [
    {
      id: 1,
      userId: 1,
      title: 'Giáo trình Giải tích 1 + Đề cương ôn thi DNTU',
      description: 'Sách bìa kiếng còn mới 95%, có kèm tập ghi chép giải bài tập và đề thi các năm trước của khoa.',
      price: 35000,
      stock: 2,
      category: 'book',
      location: 'Thư viện DNTU (Tầng 1)',
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
      status: 'available',
      createdAt: '2026-10-27 10:00:00',
    },
    {
      id: 2,
      userId: 1,
      title: 'Nồi cơm điện tử Bear 1.2L dùng phòng KTX DNTU',
      description: 'Nồi nhỏ gọn chống dính siêu bền, công suất 300W thích hợp dùng phòng KTX không sợ quá tải điện.',
      price: 120000,
      stock: 1,
      category: 'dorm',
      location: 'Căn tin & Khu tự học',
      imageUrl: 'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?w=600',
      status: 'available',
      createdAt: '2026-10-27 11:00:00',
    },
    {
      id: 3,
      userId: 1,
      title: 'Máy tính Casio fx-580VN X chính hãng Bitex',
      description: 'Đầy đủ nắp trượt, còn bảo hành 1 năm, phím bấm cực êm, màn hình nét không điểm chết.',
      price: 280000,
      stock: 1,
      category: 'tech',
      location: 'Sảnh Giảng đường A',
      imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600',
      status: 'available',
      createdAt: '2026-10-27 12:00:00',
    },
    {
      id: 4,
      userId: 1,
      title: 'Bộ giỏ móc quần áo + kẹp phơi đồ KTX DNTU',
      description: 'Mình chuyển trọ về quê nên thanh lý rẻ cho bạn sinh viên nào mới vào phòng cần dùng nha!',
      price: 15000,
      stock: 1,
      category: 'dorm',
      location: 'Cổng chính DNTU (Cổng A)',
      imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600',
      status: 'available',
      createdAt: '2026-10-27 13:00:00',
    },
    {
      id: 5,
      userId: 1,
      title: 'Bàn học gấp gọn đa năng có khay đựng ly & iPad',
      description: 'Bàn chân sắt bọc cao su chống trượt chữ U, mặt bàn gỗ công nghiệp ép láng mịn sạch sẽ.',
      price: 49000,
      stock: 3,
      category: 'dorm',
      location: 'Căn tin & Khu tự học',
      imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600',
      status: 'available',
      createdAt: '2026-10-27 14:00:00',
    },
    {
      id: 6,
      userId: 1,
      title: 'Xe đạp cào cào Martin đi học DNTU siêu bền',
      description: 'Xe đạp nhẹ, lốp mới thay, thắng ăn, có gắn kèm giỏ xe và khóa dây an toàn số 4 số.',
      price: 450000,
      stock: 1,
      category: 'vehicle',
      location: 'Cổng chính DNTU (Cổng A)',
      imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600',
      status: 'available',
      createdAt: '2026-10-27 15:00:00',
    },
    {
      id: 7,
      userId: 1,
      title: 'Tai nghe Bluetooth Lenovo Thinkplus bass trầm học bài',
      description: 'Hộp sạc nhỏ gọn, pin trâu 5 tiếng, có sạc Type-C, mic đàm thoại rõ khi học online meeting.',
      price: 95000,
      stock: 1,
      category: 'tech',
      location: 'Thư viện DNTU (Tầng 1)',
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600',
      status: 'available',
      createdAt: '2026-10-27 16:00:00',
    },
    {
      id: 8,
      userId: 1,
      title: 'Áo khoác gió đồng phục DNTU màu xanh size L',
      description: 'Chất vải dù chống mưa nhẹ 2 lớp, mặc mùa mưa đi học cực kỳ tiện, mới giặt thơm tho.',
      price: 65000,
      stock: 2,
      category: 'fashion',
      location: 'Nhà thi đấu Thể thao DNTU',
      imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600',
      status: 'available',
      createdAt: '2026-10-27 17:00:00',
    },
  ],
  meetingPoints: [
    { id: 1, name: 'Cổng chính DNTU (Cổng A)', code: 'GATE_A', area: 'Khu vực Cổng vào', description: 'Gần bốt bảo vệ Cổng A, thuận tiện cho sinh viên đi xe máy hoặc xe buýt ghé nhận đồ nhanh.', xRatio: 0.18, yRatio: 0.85 },
    { id: 2, name: 'Thư viện Trung tâm DNTU (Tầng 1)', code: 'LIB_F1', area: 'Tòa nhà Thư viện', description: 'Sảnh máy lạnh trước cửa vào Thư viện, có ghế ngồi chờ, yên tĩnh và an toàn.', xRatio: 0.5, yRatio: 0.35 },
    { id: 3, name: 'Căn tin & Khu tự học', code: 'CANTEEN', area: 'Khu dịch vụ Sinh viên', description: 'Khu vực bàn ghế thoáng mát, đông đúc sinh viên, dễ nhận diện nhau qua đồng phục.', xRatio: 0.82, yRatio: 0.75 },
    { id: 4, name: 'Sảnh Giảng đường A', code: 'HALL_A', area: 'Khu Hiệu bộ & Giảng đường A', description: 'Sảnh chính tòa nhà A, ngay chân cầu thang máy, địa điểm gặp mặt quen thuộc.', xRatio: 0.35, yRatio: 0.5 },
    { id: 5, name: 'Sảnh Giảng đường B', code: 'HALL_B', area: 'Khu Giảng đường B', description: 'Khu vực ghế đá dưới bóng mát cây xanh trước sảnh B, tiện cho sinh viên sau giờ học.', xRatio: 0.65, yRatio: 0.5 },
    { id: 6, name: 'Nhà thi đấu Thể thao DNTU', code: 'SPORT_HALL', area: 'Khu phức hợp Thể thao', description: 'Cửa chính Nhà thi đấu đa năng, không gian rộng rãi, dễ dàng đỗ xe dừng lại lấy đồ.', xRatio: 0.75, yRatio: 0.2 },
  ],
  meetups: [],
  favorites: [],
  cartItems: [],
};

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf8');
      return INITIAL_DATA;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...INITIAL_DATA, ...parsed };
  } catch {
    return INITIAL_DATA;
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Lỗi khi ghi data.json:', err);
  }
}

let db = loadData();

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname || '';
  const query = parsedUrl.query || {};

  try {
    // 1. Health check
    if (pathname === '/api/health' && req.method === 'GET') {
      return sendJson(res, 200, { status: 'ok', serverTime: new Date().toISOString() });
    }

    // 2. Full Sync
    if (pathname === '/api/sync' && req.method === 'GET') {
      return sendJson(res, 200, db);
    }

    // 3. Auth
    if (pathname === '/api/users' && req.method === 'GET') {
      return sendJson(res, 200, db.users.map(({ password, ...u }) => u));
    }

    if (pathname === '/api/users/login' && req.method === 'POST') {
      const { studentId, password } = await parseBody(req);
      const user = db.users.find(
        (u) => u.studentId.toUpperCase() === (studentId || '').trim().toUpperCase() && u.password === password
      );
      if (!user) {
        return sendJson(res, 400, { success: false, error: 'Mã sinh viên hoặc mật khẩu không chính xác' });
      }
      const { password: _, ...cleanUser } = user;
      return sendJson(res, 200, { success: true, user: cleanUser });
    }

    if (pathname === '/api/users/register' && req.method === 'POST') {
      const { name, studentId, password, phone, avatar } = await parseBody(req);
      const exists = db.users.some(
        (u) => u.studentId.toUpperCase() === (studentId || '').trim().toUpperCase()
      );
      if (exists) {
        return sendJson(res, 400, { success: false, error: 'Mã sinh viên này đã được đăng ký' });
      }
      const newUser = {
        id: db.users.length ? Math.max(...db.users.map((u) => u.id)) + 1 : 1,
        name: (name || '').trim(),
        studentId: (studentId || '').trim().toUpperCase(),
        password,
        phone: phone ? phone.trim() : null,
        avatar: avatar || null,
        role: 'student',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      db.users.push(newUser);
      saveData(db);
      const { password: _, ...cleanUser } = newUser;
      return sendJson(res, 200, { success: true, user: cleanUser });
    }

    // 4. Products
    if (pathname === '/api/products' && req.method === 'GET') {
      const currentUserId = query.currentUserId ? parseInt(query.currentUserId, 10) : 0;
      const enriched = db.products.map((p) => {
        const seller = db.users.find((u) => u.id === p.userId);
        const isFavorited = db.favorites.some((f) => f.userId === currentUserId && f.productId === p.id);
        return {
          ...p,
          sellerName: seller ? seller.name : 'Sinh viên DNTU',
          sellerStudentId: seller ? seller.studentId : '',
          sellerPhone: seller ? seller.phone : undefined,
          isFavorited,
        };
      });
      return sendJson(res, 200, enriched);
    }

    if (pathname === '/api/products' && req.method === 'POST') {
      const body = await parseBody(req);
      const newProduct = {
        id: db.products.length ? Math.max(...db.products.map((p) => p.id)) + 1 : 1,
        userId: body.userId,
        title: body.title,
        description: body.description || null,
        price: body.price,
        stock: body.stock || 1,
        category: body.category,
        location: body.location,
        imageUrl: body.imageUrl || null,
        status: 'available',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      db.products.unshift(newProduct);
      saveData(db);
      return sendJson(res, 200, { success: true, productId: newProduct.id, product: newProduct });
    }

    // 5. Meetups (CRITICAL FOR CROSS-CLIENT SYNC)
    if (pathname === '/api/meetups' && req.method === 'GET') {
      const userId = query.userId ? parseInt(query.userId, 10) : 0;
      let list = db.meetups;
      if (userId) {
        list = list.filter((m) => m.buyerId === userId || m.sellerId === userId);
      }
      const enriched = list.map((m) => {
        const prod = db.products.find((p) => p.id === m.productId);
        const pt = db.meetingPoints.find((mp) => mp.id === m.meetingPointId);
        const buyer = db.users.find((u) => u.id === m.buyerId);
        const seller = db.users.find((u) => u.id === m.sellerId);
        return {
          ...m,
          productTitle: prod ? prod.title : 'Sản phẩm giao dịch',
          productPrice: prod ? prod.price : 0,
          productImage: prod ? prod.imageUrl : undefined,
          meetingPointName: pt ? pt.name : 'Điểm hẹn DNTU',
          meetingPointArea: pt ? pt.area : undefined,
          buyerName: buyer ? buyer.name : 'Người mua',
          sellerName: seller ? seller.name : 'Người bán',
        };
      });
      return sendJson(res, 200, enriched);
    }

    if (pathname === '/api/meetups' && req.method === 'POST') {
      const body = await parseBody(req);
      const newMeetup = {
        id: db.meetups.length ? Math.max(...db.meetups.map((m) => m.id)) + 1 : 1,
        orderId: body.orderId || null,
        productId: body.productId,
        buyerId: body.buyerId,
        sellerId: body.sellerId,
        meetingPointId: body.meetingPointId,
        scheduledAt: body.scheduledAt,
        status: 'pending',
        notes: body.notes || null,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      db.meetups.unshift(newMeetup);
      saveData(db);
      return sendJson(res, 200, { success: true, meetupId: newMeetup.id, meetup: newMeetup });
    }

    if (pathname.startsWith('/api/meetups/') && pathname.endsWith('/status') && req.method === 'PUT') {
      const parts = pathname.split('/');
      const meetupId = parseInt(parts[3], 10);
      const { status } = await parseBody(req);
      const meetup = db.meetups.find((m) => m.id === meetupId);
      if (!meetup) {
        return sendJson(res, 404, { success: false, error: 'Không tìm thấy lịch hẹn' });
      }
      meetup.status = status;
      // If completed, optionally set product to sold
      if (status === 'completed') {
        const prod = db.products.find((p) => p.id === meetup.productId);
        if (prod) {
          prod.stock = Math.max(0, (prod.stock || 1) - 1);
          if (prod.stock === 0) prod.status = 'sold';
        }
      }
      saveData(db);
      return sendJson(res, 200, { success: true, status });
    }

    // 6. Favorites
    if (pathname === '/api/favorites' && req.method === 'GET') {
      const userId = query.userId ? parseInt(query.userId, 10) : 0;
      const ids = db.favorites.filter((f) => f.userId === userId).map((f) => f.productId);
      return sendJson(res, 200, ids);
    }

    if (pathname === '/api/favorites/toggle' && req.method === 'POST') {
      const { userId, productId } = await parseBody(req);
      const idx = db.favorites.findIndex((f) => f.userId === userId && f.productId === productId);
      let isFav = false;
      if (idx >= 0) {
        db.favorites.splice(idx, 1);
        isFav = false;
      } else {
        db.favorites.push({ userId, productId, createdAt: new Date().toISOString() });
        isFav = true;
      }
      saveData(db);
      return sendJson(res, 200, { success: true, isFavorited: isFav });
    }

    // Default 404
    return sendJson(res, 404, { error: 'Not Found' });
  } catch (err) {
    console.error('Server error:', err);
    return sendJson(res, 500, { error: 'Internal Server Error', details: err.message });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[DNTU Campus Sync Server] Running on http://0.0.0.0:${PORT}`);
  console.log(`[DNTU Campus Sync Server] Accessible locally at http://192.168.1.9:${PORT}`);
});
