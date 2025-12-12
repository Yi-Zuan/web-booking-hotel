require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Cấu hình để chạy giao diện từ thư mục public
app.use(express.static(path.join(__dirname, 'public')));

// --- KẾT NỐI DATABASE ---
const dbConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
});

dbConnection.connect(err => {
    if (err) console.error('❌ Lỗi kết nối DB:', err.message);
    else console.log('✅ Đã kết nối Database thành công.');
});

// --- 1. API TÌM KIẾM ---
app.get('/api/hotels', (req, res) => {
    const city = req.query.city;
    let sql = 'SELECT * FROM hotels';
    let params = [];
    if (city) {
        sql += ' WHERE city LIKE ?';
        params.push(`%${city}%`);
    }
    dbConnection.query(sql, params, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// --- 2. API CHI TIẾT ---
app.get('/api/hotels/:id', (req, res) => {
    dbConnection.query('SELECT * FROM hotels WHERE hotel_id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: 'Not found' });
        res.json(results[0]);
    });
});

// --- 3. API ĐĂNG KÝ ---
app.post('/api/register', (req, res) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) return res.status(400).json({success: false, message: 'Thiếu thông tin'});
    
    const sql = 'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)';
    dbConnection.query(sql, [fullName, email, password], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Email đã tồn tại hoặc lỗi server' });
        res.json({ success: true, message: 'Đăng ký thành công! Hãy đăng nhập.' });
    });
});

// --- 4. API ĐĂNG NHẬP ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
    dbConnection.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length > 0) {
            res.json({ success: true, user: results[0] });
        } else {
            res.json({ success: false, message: 'Sai email hoặc mật khẩu!' });
        }
    });
});

// --- 5. API LIÊN HỆ ---
app.post('/api/contact', (req, res) => {
    const { fullName, email, message } = req.body;
    const sql = 'INSERT INTO contacts (full_name, email, message) VALUES (?, ?, ?)';
    dbConnection.query(sql, [fullName, email, message], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true, message: 'Tin nhắn đã được gửi!' });
    });
});

// --- 6. API ĐẶT PHÒNG ---
app.post('/api/bookings', (req, res) => {
    const { hotelId, name, phone, dateStart, dateEnd } = req.body;
    const sql = 'INSERT INTO bookings (hotel_id, user_name, user_phone, check_in_date, check_out_date) VALUES (?, ?, ?, ?, ?)';
    dbConnection.query(sql, [hotelId, name, phone, dateStart, dateEnd], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi đặt phòng' });
        res.json({ success: true, message: 'Đặt phòng thành công!' });
    });
});

// --- 7. API ƯU ĐÃI ---
app.get('/api/offers', (req, res) => {
    dbConnection.query('SELECT * FROM offers', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// --- 1. TÌM KIẾM & HIỂN THỊ (FIX LỖI HIỂN THỊ CODE) ---
function performSearch() {
    const keyword = destinationInput.value.trim();
    let apiUrl = '/api/hotels';
    if (keyword) {
        apiUrl += `?city=${encodeURIComponent(keyword)}`;
        if(resultTitle) resultTitle.innerText = `Kết quả cho: "${keyword}"`;
    }
    
    resultsDiv.innerHTML = '<p style="text-align:center">⏳ Đang tải...</p>';
    
    fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
            resultsDiv.innerHTML = '';
            if(data.length === 0) { resultsDiv.innerHTML = '<p style="text-align:center">Không tìm thấy khách sạn nào.</p>'; return; }
            
            data.forEach(hotel => {
                const price = Number(hotel.price_per_night).toLocaleString();
                const img = hotel.image_url || DEFAULT_IMG;
                
                // QUAN TRỌNG: DÙNG DẤU HUYỀN (`) ĐỂ BAO QUANH HTML
                resultsDiv.innerHTML += `
                    <div class="hotel-card">
                        <img src="${img}" class="hotel-img" onerror="this.src='${DEFAULT_IMG}'">
                        <div class="hotel-info">
                            <h3>${hotel.name}</h3>
                            <p>📍 ${hotel.city}</p>
                            <p style="color:#d82b45; font-weight:bold">${price} VND</p>
                            
                            <a href="detail.html?id=${hotel.hotel_id}" class="btn-book" style="text-decoration:none; display:block; margin-top:10px; text-align:center;">
                                XEM CHI TIẾT
                            </a>
                        </div>
                    </div>`;
            });
        });
}

// --- 2. TRA CỨU LỊCH SỬ ĐẶT PHÒNG ---
window.openHistoryModal = function() {
    window.openModalById('history-modal'); // Bạn phải đảm bảo có modal này trong HTML
}

window.viewMyBookings = function() {
    const phone = document.getElementById('history-phone-input').value.trim();
    if (!phone) { alert("Vui lòng nhập SĐT!"); return; }

    const listDiv = document.getElementById('booking-history-list');
    listDiv.innerHTML = '<p style="text-align:center">Đang tra cứu...</p>';

    fetch(`/api/user-bookings?phone=${phone}`)
        .then(res => res.json())
        .then(data => {
            listDiv.innerHTML = '';
            if (data.length === 0) {
                listDiv.innerHTML = '<p style="text-align:center; color:red">Không tìm thấy đơn hàng nào.</p>';
                return;
            }
            data.forEach(item => {
                const checkIn = new Date(item.check_in_date).toLocaleDateString('vi-VN');
                const price = Number(item.price_per_night).toLocaleString();
                listDiv.innerHTML += `
                    <div style="border:1px solid #ddd; padding:10px; margin-bottom:10px; border-radius:5px;">
                        <h4 style="margin:0; color:#d82b45">${item.hotel_name}</h4>
                        <p style="margin:5px 0; font-size:13px">📅 Ngày đến: ${checkIn}</p>
                        <p style="margin:0; font-weight:bold">${price} VND</p>
                    </div>`;
            });
        })
        .catch(err => {
            console.error(err);
            listDiv.innerHTML = '<p style="text-align:center">Lỗi kết nối!</p>';
        });
}
app.listen(PORT, () => {
    console.log(`Server chạy tại cổng ${PORT}`);
});
