document.addEventListener('DOMContentLoaded', () => {
    // 1. CẤU HÌNH & HẰNG SỐ
    const CONFIG = {
        DEFAULT_IMG: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        API: {
            HOTELS: '/api/hotels',
            REGISTER: '/api/register',
            LOGIN: '/api/login',
            CONTACT: '/api/contact',
            OFFERS: '/api/offers'
        }
    };

    const dom = {
        searchBtn: document.getElementById('search-button'),
        destInput: document.getElementById('destination'),
        resultsDiv: document.getElementById('results'),
        resultTitle: document.getElementById('result-title'),
        navLogin: document.getElementById('nav-login')
    };

    // Kiểm tra đăng nhập cũ từ localStorage khi tải trang
    const savedUser = localStorage.getItem('user');
    if (savedUser && dom.navLogin) {
        const userObj = JSON.parse(savedUser);
        dom.navLogin.innerText = userObj.full_name || 'Tài khoản';
    }

    // 2. UTILS
    const postData = (url, data) => {
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json());
    };

    const formatCurrency = (amount) => Number(amount).toLocaleString('vi-VN') + ' VND';

    // 3. MODAL UTILS
    window.openModalById = (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'block';
    };

    window.closeModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
    };

    window.onclick = (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    };

    // 4. SEARCH FUNCTION
    function performSearch() {
        const keyword = dom.destInput ? dom.destInput.value.trim() : '';
        let apiUrl = CONFIG.API.HOTELS;

        if (keyword) {
            apiUrl += `?city=${encodeURIComponent(keyword)}`;
            if (dom.resultTitle) dom.resultTitle.innerText = `Kết quả cho: "${keyword}"`;
        }

        if (dom.resultsDiv) {
            dom.resultsDiv.innerHTML = '<p style="text-align:center">⏳ Đang tải dữ liệu...</p>';
            
            fetch(apiUrl)
                .then(res => res.json())
                .then(data => {
                    dom.resultsDiv.innerHTML = '';
                    if (!data || data.length === 0) {
                        dom.resultsDiv.innerHTML = '<p style="text-align:center">Không tìm thấy khách sạn nào.</p>';
                        return;
                    }

                    const html = data.map(hotel => {
                        const img = hotel.image_url || CONFIG.DEFAULT_IMG;
                        // Thay đổi quan trọng: Chuyển hướng sang detail.html
                        return `
                        <div class="hotel-card">
                            <img src="${img}" class="hotel-img" onerror="this.src='${CONFIG.DEFAULT_IMG}'" alt="${hotel.name}">
                            <div class="hotel-info">
                                <h3>${hotel.name}</h3>
                                <p>📍 ${hotel.city}</p>
                                <p style="color:#d82b45; font-weight:bold">${formatCurrency(hotel.price_per_night)}</p>
                                <button class="btn-book" onclick="window.location.href='hotel/detail.html?id=${hotel.hotel_id}'">XEM CHI TIẾT</button>
                            </div>
                        </div>`;
                    }).join('');
                    
                    dom.resultsDiv.innerHTML = html;
                })
                .catch(err => {
                    console.error(err);
                    dom.resultsDiv.innerHTML = '<p style="text-align:center; color:red">Lỗi tải dữ liệu.</p>';
                });
        }
    }

    // 5. CÁC CHỨC NĂNG KHÁC (AUTH, CONTACT, OFFERS)
    
    window.handleRegister = function() {
        const data = {
            fullName: document.getElementById('reg-name').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-pass').value
        };
        postData(CONFIG.API.REGISTER, data)
            .then(d => {
                alert(d.message);
                if (d.success) window.closeModal('register-modal');
            })
            .catch(err => alert('Lỗi kết nối: ' + err));
    };

    window.handleLogin = function() {
        const data = {
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-pass').value
        };

        postData(CONFIG.API.LOGIN, data)
            .then(d => {
                if (d.success) {
                    alert('Chào mừng ' + d.user.full_name);
                    // LƯU USER VÀO LOCALSTORAGE ĐỂ TRANG CHI TIẾT DÙNG
                    localStorage.setItem('user', JSON.stringify(d.user));
                    
                    window.closeModal('login-modal');
                    if(dom.navLogin) dom.navLogin.innerText = d.user.full_name;
                } else {
                    alert(d.message);
                }
            })
            .catch(err => alert('Lỗi đăng nhập: ' + err));
    };

    window.handleContact = function() {
        const data = {
            fullName: document.getElementById('contact-name').value,
            email: document.getElementById('contact-email').value,
            message: document.getElementById('contact-msg').value
        };
        postData(CONFIG.API.CONTACT, data)
            .then(d => { alert(d.message); window.closeModal('contact-modal'); })
            .catch(err => alert('Lỗi gửi liên hệ.'));
    };

    window.openOffers = function() {
        window.openModalById('offers-modal');
        const list = document.getElementById('offers-list');
        list.innerHTML = '<p style="text-align:center">Đang tải...</p>';
        fetch(CONFIG.API.OFFERS)
            .then(res => res.json())
            .then(data => {
                list.innerHTML = '';
                if(!data || data.length === 0) { list.innerHTML = '<p>Không có ưu đãi.</p>'; return; }
                data.forEach(o => {
                    list.innerHTML += `
                        <div class="hotel-card" style="padding:15px; border:1px dashed #d4af37">
                            <img src="${o.image_url}" style="width:100%; height:150px; object-fit:cover" onerror="this.src='${CONFIG.DEFAULT_IMG}'">
                            <h3>${o.title}</h3>
                            <p>${o.description}</p>
                            <strong style="background:#d4af37; color:white; padding:5px;">CODE: ${o.discount_code}</strong>
                        </div>`;
                });
            })
            .catch(() => list.innerHTML = '<p>Lỗi tải ưu đãi.</p>');
    };

// --- TÍNH NĂNG: XEM LỊCH SỬ ---
    
    // 1. Hàm mở Modal
    window.openHistoryModal = function() {
        // Đóng các modal khác nếu đang mở
        const modals = document.querySelectorAll('.modal');
        modals.forEach(m => m.style.display = 'none');
        
        // Mở modal lịch sử
        window.openModalById('history-modal');
    }

    // 2. Hàm gọi API và hiển thị dữ liệu
    window.viewMyBookings = function() {
        const phone = document.getElementById('history-phone-input').value.trim();
        const listDiv = document.getElementById('booking-history-list');

        if (!phone) {
            alert("Vui lòng nhập số điện thoại!");
            return;
        }

        listDiv.innerHTML = '<p style="text-align:center">⏳ Đang tìm kiếm...</p>';

        // Gọi API bạn vừa viết ở Bước 2
        fetch(`/api/user-bookings?phone=${phone}`)
            .then(res => res.json())
            .then(data => {
                listDiv.innerHTML = ''; // Xóa nội dung cũ
                
                if (data.length === 0) {
                    listDiv.innerHTML = `<p style="text-align:center; color:red">Không tìm thấy đơn nào với SĐT: <b>${phone}</b></p>`;
                    return;
                }

                // Vẽ từng đơn hàng ra
                data.forEach(item => {
                    const checkIn = new Date(item.check_in_date).toLocaleDateString('vi-VN');
                    const checkOut = new Date(item.check_out_date).toLocaleDateString('vi-VN');
                    const created = new Date(item.created_at).toLocaleDateString('vi-VN');
                    const img = item.image_url || 'https://via.placeholder.com/150';
                    const price = item.price_per_night ? Number(item.price_per_night).toLocaleString() : '---';

                    listDiv.innerHTML += `
                        <div style="display:flex; gap:15px; border:1px solid #eee; padding:15px; border-radius:8px; margin-bottom:15px; background:#fff; align-items:center;">
                            <img src="${img}" style="width:80px; height:80px; object-fit:cover; border-radius:6px; box-shadow:0 2px 5px rgba(0,0,0,0.1)">
                            <div style="flex:1">
                                <h4 style="margin:0 0 5px 0; color:#1a1a1a;">${item.hotel_name}</h4>
                                <div style="font-size:13px; color:#555;">
                                    <p><i class="fa-solid fa-calendar-check"></i> <b>${checkIn}</b> - <b>${checkOut}</b></p>
                                    <p><i class="fa-solid fa-user"></i> Khách: ${item.user_name}</p>
                                    <p style="font-size:12px; color:#999; margin-top:3px">Ngày đặt: ${created}</p>
                                </div>
                            </div>
                            <div style="text-align:right;">
                                <span style="background:#e6fffa; color:#00b894; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:bold; border:1px solid #00b894">Thành công</span>
                                <p style="margin-top:8px; font-weight:bold; color:#d4af37; font-size:15px;">${price} đ</p>
                            </div>
                        </div>`;
                });
            })
            .catch(err => {
                console.error(err);
                listDiv.innerHTML = '<p style="text-align:center; color:red">Lỗi kết nối server!</p>';
            });
    }
    // Init
    if (dom.searchBtn) dom.searchBtn.addEventListener('click', (e) => { e.preventDefault(); performSearch(); });
    performSearch();
});