/**
 * Noctis Wear - Core Application Logic V7 (Final Ultimate)
 * Features: Auth, Real Checkout History, Empty State, User Dropdown
 */

const App = (() => {
    const CONFIG = {
        STORAGE_KEY: 'noctis_cart_premium_v3', // Key ตะกร้า
        TOAST_DURATION: 3000,
        USER_KEY: 'noctis_users_v1',     
        SESSION_KEY: 'noctis_session_v1'
    };

    // ✅ อัปเดต: เพิ่มข้อมูล Sizes และ Colors ให้สินค้า
    const state = {
        products: [
            { id: 1, name: "Lumix Heavy Tee", category: "T-Shirt", price: 590, oldPrice: 890, sale: true, new: false, image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=600", sizes: ['S','M','L','XL'], colors: ['#000000','#FFFFFF'] },
            { id: 2, name: "Vortex Oversize", category: "T-Shirt", price: 450, oldPrice: null, sale: false, new: true, image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=600", sizes: ['M','L','XL'], colors: ['#1a1a1a','#333333'] },
            { id: 3, name: "Nova Silk Shirt", category: "Shirt", price: 1290, oldPrice: 1590, sale: true, new: false, image: "https://images.unsplash.com/photo-1626497764746-6dc36546b388?auto=format&fit=crop&q=80&w=600", sizes: ['S','M','L'], colors: ['#000000','#550000'] },
            { id: 4, name: "Eclipse Hoodie", category: "Hoodie", price: 1500, oldPrice: null, sale: false, new: true, image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600", sizes: ['M','L','XL'], colors: ['#000000'] },
            { id: 5, name: "Orion Smart Shirt", category: "Shirt", price: 990, oldPrice: null, sale: false, new: false, image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=600", sizes: ['S','M','L','XL'], colors: ['#FFFFFF','#DDDDDD'] },
            { id: 6, name: "Comet Graphic Tee", category: "T-Shirt", price: 390, oldPrice: 590, sale: true, new: false, image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&q=80&w=600", sizes: ['S','M','L'], colors: ['#000000','#FFD700'] },
            { id: 7, name: "Nebula Jacket", category: "Hoodie", price: 2100, oldPrice: 2500, sale: true, new: false, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600", sizes: ['L','XL'], colors: ['#000000','#222222'] },
            {  id: 8, name: "Galaxy Zip Hoodie", category: "Hoodie", price: 1890, oldPrice: null, sale: false, new: true, image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=600", sizes: ['M','L','XL'], colors: ['#000000'] }
        ],
        cart: [],
        tempProduct: null, 
        users: [],        
        currentUser: null
    };

    const elements = {};

    const init = () => {
        cacheDOM();
        loadCart();
        loadUsers();      
        checkSession();   
        injectAuthModal(); 
        
        // --- [เพิ่มใหม่] Inject ส่วนประกอบเสริม ---
        injectUserMenu();    
        injectHistoryModal();
        
        if (elements.productGrid) {
            renderProducts(state.products);
            bindShopEvents();
        }
        bindGlobalEvents();
        updateCartCount();
        injectModal(); 
        initScrollAnimations();
    };

    const cacheDOM = () => {
        elements.productGrid = document.getElementById('product-grid');
        elements.resultCount = document.getElementById('result-count');
        elements.cartSidebar = document.getElementById('cart-sidebar');
        elements.cartItems = document.getElementById('cart-items');
        elements.cartTotal = document.getElementById('cart-total');
        elements.cartBadge = document.getElementById('cart-count-badge');
        elements.filterCats = document.querySelectorAll('.filter-cat');
        elements.filterPrices = document.querySelectorAll('input[name="price"]');
        elements.sortSelect = document.getElementById('sort-select');
        elements.userNameDisplay = document.getElementById('user-name-display');
        elements.searchInput = document.getElementById('search-input');
        elements.userBtn = document.getElementById('user-account-btn'); // [เพิ่ม] ปุ่ม User
    };

    const initScrollAnimations = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
    };

    const loadCart = () => {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
            state.cart = stored ? JSON.parse(stored) : [];
        } catch (e) { state.cart = []; }
    };

    const saveCart = () => {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.cart));
        updateCartCount();
        renderCartSidebar();
    };

    // --- HTML Modal Injection ---
    const injectModal = () => {
        const modalHTML = `
        <div id="variant-modal" class="modal-overlay">
            <div class="checkout-modal variant-box">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:15px;">
                    <h3 class="variant-title" style="margin:0; font-size:1.1rem; letter-spacing:1px;">SELECT OPTIONS</h3>
                    <button class="close-modal-variant" onclick="App.closeModal('variant-modal')">✕</button>
                </div>
                <div style="margin-bottom:20px;">
                    <label class="option-label">SIZE</label>
                    <div id="modal-sizes" class="size-grid"></div>
                </div>
                <div style="margin-bottom:25px;">
                    <label class="option-label">COLOR</label>
                    <div id="modal-colors" class="color-grid"></div>
                </div>
                <div style="margin-bottom:30px;">
                    <label class="option-label">QUANTITY</label>
                    <div class="qty-control-large">
                        <button class="qty-btn-large" onclick="App.adjustTempQty(-1)">-</button>
                        <span id="modal-qty">1</span>
                        <button class="qty-btn-large" onclick="App.adjustTempQty(1)">+</button>
                    </div>
                </div>
                <button class="btn-checkout btn-add-confirm" onclick="App.confirmAddToCart()">ADD TO CART</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    };

    const injectUserMenu = () => {
        // [เพิ่มใหม่] เมนู Dropdown ใต้ปุ่ม User
        if(!elements.userBtn) return;
        const menuHTML = `
        <div id="user-dropdown" class="user-dropdown">
            <div class="user-menu-item" style="cursor:default; border-bottom:1px solid rgba(255,215,0,0.2); color:var(--accent);">
                👤 <span id="menu-user-name">Guest</span>
            </div>
            <div class="user-menu-item" onclick="App.showOrderHistory()">
                📦 My Orders
            </div>
            <div class="user-menu-item" onclick="App.handleLogout()">
                🚪 Logout
            </div>
        </div>`;
        elements.userBtn.style.position = 'relative'; 
        elements.userBtn.insertAdjacentHTML('beforeend', menuHTML);
    };

    const injectHistoryModal = () => {
        // [เพิ่มใหม่] หน้าต่างประวัติการซื้อ
        if(document.getElementById('history-modal')) return;
        const html = `
        <div id="history-modal" class="modal-overlay">
            <div class="checkout-modal variant-box" style="max-width:600px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3 class="variant-title" style="margin:0; color:var(--accent);">MY ORDERS</h3>
                    <button class="close-modal-variant" onclick="App.closeModal('history-modal')">✕</button>
                </div>
                <div id="order-history-list" style="max-height:60vh; overflow-y:auto; padding-right:5px;">
                    </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    };

    const renderProducts = (items) => {
        if (!elements.productGrid) return;
        elements.productGrid.innerHTML = items.map((item, index) => {
            const saleBadge = item.sale ? `<div class="badge-new" style="background:var(--danger); color:#fff;">SALE</div>` : '';
            const newBadge = item.new && !item.sale ? `<div class="badge-new">NEW</div>` : '';
            const priceHtml = item.oldPrice ? `<span class="old-price">฿${formatNumber(item.oldPrice)}</span>฿${formatNumber(item.price)}` : `฿${formatNumber(item.price)}`;
            return `
            <div class="product-card reveal-on-scroll" style="transition-delay: ${index * 50}ms">
                <div class="product-img-wrapper">
                    ${saleBadge} ${newBadge}
                    <img src="${item.image}" class="product-img" loading="lazy" alt="${item.name}">
                    <div class="card-overlay">
                        <button class="btn-icon" onclick="App.openVariantModal(${item.id})">ADD TO CART</button>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-category">${item.category}</div>
                    <div class="product-title">${item.name}</div>
                    <div class="product-price">${priceHtml}</div>
                </div>
            </div>`;
        }).join('');
        initScrollAnimations();
        if (elements.resultCount) elements.resultCount.innerText = `SHOWING ${items.length} RESULTS`;
    };

    // --- Variant Logic ---
    const openVariantModal = (id) => {
        const product = state.products.find(p => p.id === id); if (!product) return;
        state.tempProduct = { ...product, selectedSize: product.sizes[0], selectedColor: product.colors[0], selectedQty: 1 };
        document.getElementById('modal-sizes').innerHTML = product.sizes.map(s => `<button class="size-btn ${s === state.tempProduct.selectedSize ? 'active' : ''}" onclick="App.selectSize(this, '${s}')">${s}</button>`).join('');
        document.getElementById('modal-colors').innerHTML = product.colors.map(c => `<div class="color-btn ${c === state.tempProduct.selectedColor ? 'active' : ''}" style="background:${c}" onclick="App.selectColor(this, '${c}')"></div>`).join('');
        document.getElementById('modal-qty').innerText = "1";
        document.getElementById('variant-modal').classList.add('active');
    };

    const selectSize = (el, size) => { document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active')); el.classList.add('active'); state.tempProduct.selectedSize = size; };
    const selectColor = (el, color) => { document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active')); el.classList.add('active'); state.tempProduct.selectedColor = color; };
    const adjustTempQty = (change) => { let newQty = state.tempProduct.selectedQty + change; if (newQty < 1) newQty = 1; state.tempProduct.selectedQty = newQty; document.getElementById('modal-qty').innerText = newQty; };

    const confirmAddToCart = () => {
        const { id, name, price, image, selectedSize, selectedColor, selectedQty } = state.tempProduct;
        const existing = state.cart.find(i => i.id === id && i.size === selectedSize && i.color === selectedColor);
        if (existing) existing.qty += selectedQty; else state.cart.push({ id, name, price, image, size: selectedSize, color: selectedColor, qty: selectedQty, checked: true });
        saveCart(); closeModal('variant-modal'); showToast(`ADDED: ${name}`); toggleCart(true);
    };

    // --- Cart Logic (Updated: Empty State) ---
    const renderCartSidebar = () => {
        if (!elements.cartItems) return;
        
        // [เพิ่มใหม่] เช็คถ้าตะกร้าว่าง
        if (state.cart.length === 0) {
            elements.cartItems.innerHTML = `
                <div class="empty-cart-state">
                    <div class="empty-cart-icon">🛒</div>
                    <h3 style="margin-bottom:10px;">YOUR CART IS EMPTY</h3>
                    <button class="btn-primary" onclick="App.toggleCart(false); window.location.href='shop.html'" style="padding:10px 30px; font-size:0.8rem;">GO SHOPPING</button>
                </div>`;
            if(elements.cartTotal) elements.cartTotal.querySelector('span:last-child').innerText = `฿0`;
            return;
        }

        const total = state.cart.reduce((sum, item) => item.checked ? sum + (item.price * item.qty) : sum, 0);
        elements.cartItems.innerHTML = state.cart.map((item, index) => `
            <div class="cart-item" style="display:flex; gap:15px; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:15px; align-items:center;">
                <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="App.toggleItemCheck(${index})" style="transform:scale(1.2); accent-color:var(--accent); cursor:pointer;">
                <img src="${item.image}" style="width:60px; height:70px; object-fit:cover; border-radius:4px;">
                <div style="flex:1;">
                    <div style="font-weight:700; font-size:0.9rem;">${item.name}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted); margin:4px 0;">${item.size} | <span style="display:inline-block; width:10px; height:10px; background:${item.color}; border-radius:50%; border:1px solid #555;"></span></div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">Qty: ${item.qty}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:600; color:var(--accent);">฿${formatNumber(item.price * item.qty)}</div>
                    <div style="color:var(--danger); font-size:0.7rem; cursor:pointer; text-decoration:underline;" onclick="App.removeFromCart(${index})">REMOVE</div>
                </div>
            </div>`).join('');

        if (elements.cartTotal) elements.cartTotal.querySelector('span:last-child').innerText = `฿${formatNumber(total)}`;
    };

    const toggleItemCheck = (index) => { state.cart[index].checked = !state.cart[index].checked; saveCart(); };
    
    // --- Shop Filter Logic (With Search) ---
    const bindShopEvents = () => {
        const handleFilter = () => {
            let result = [...state.products];
            // Search Logic
            const searchTerm = elements.searchInput ? elements.searchInput.value.toLowerCase() : '';
            if (searchTerm) result = result.filter(p => p.name.toLowerCase().includes(searchTerm));
            
            // Category Logic
            const checkedCats = Array.from(elements.filterCats).filter(cb => cb.checked).map(cb => cb.value);
            if (checkedCats.length) result = result.filter(p => checkedCats.includes(p.category));
            
            // Price Logic
            const priceVal = document.querySelector('input[name="price"]:checked')?.value;
            if (priceVal) {
                if (priceVal === '500') result = result.filter(p => p.price <= 500);
                else if (priceVal === '1000') result = result.filter(p => p.price > 500 && p.price <= 1000);
                else if (priceVal === '1000+') result = result.filter(p => p.price > 1000);
            }
            
            // Sort Logic
            const sortVal = elements.sortSelect.value;
            if (sortVal === 'low-high') result.sort((a,b) => a.price - b.price);
            else if (sortVal === 'high-low') result.sort((a,b) => b.price - a.price);
            
            renderProducts(result);
        };
        elements.filterCats.forEach(el => el.addEventListener('change', handleFilter));
        elements.filterPrices.forEach(el => el.addEventListener('change', handleFilter));
        elements.sortSelect.addEventListener('change', handleFilter);
        if(elements.searchInput) elements.searchInput.addEventListener('input', handleFilter);
    };

    const bindGlobalEvents = () => {}; 
    const removeFromCart = (index) => { state.cart.splice(index, 1); saveCart(); };
    const toggleCart = (show) => { if (elements.cartSidebar) elements.cartSidebar.style.right = show ? '0' : '-100%'; if (show) renderCartSidebar(); };
    const updateCartCount = () => { if (!elements.cartBadge) return; const count = state.cart.reduce((acc, item) => acc + item.qty, 0); elements.cartBadge.innerText = count; elements.cartBadge.style.display = count > 0 ? 'flex' : 'none'; };
    const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num);
    const showToast = (msg) => { let t = document.querySelector('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); } t.innerText = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), CONFIG.TOAST_DURATION); };

    // --- Checkout & History Logic ---
    const openCheckout = () => {
        const checkedItems = state.cart.filter(i => i.checked);
        if (checkedItems.length === 0) return showToast("Select items to checkout!");
        toggleCart(false);
        const overlay = document.getElementById('checkout-overlay');
        const modal = overlay.querySelector('.checkout-modal');
        const oldSummary = document.getElementById('checkout-summary-box');
        if(oldSummary) oldSummary.remove();

        let total = 0;
        const itemsHtml = checkedItems.map(item => {
            total += item.price * item.qty;
            return `<div style="display:flex; justify-content:space-between; margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.1); font-size:0.85rem;"><div style="display:flex; gap:10px;"><img src="${item.image}" style="width:40px; height:50px; object-fit:cover; border-radius:4px;"><div><div style="font-weight:bold; color:#fff;">${item.name}</div><div style="color:#888; font-size:0.75rem;">${item.size} / ${item.qty} pcs</div></div></div><div style="font-weight:bold; color:var(--accent);">฿${formatNumber(item.price * item.qty)}</div></div>`;
        }).join('');
        
        const summaryHTML = `<div id="checkout-summary-box" style="background:rgba(255,255,255,0.03); padding:15px; border-radius:8px; margin-bottom:20px;"><h4 style="color:#888; font-size:0.8rem; margin-bottom:10px; letter-spacing:1px;">ORDER SUMMARY</h4><div class="summary-scroll" style="max-height:150px; overflow-y:auto; padding-right:5px;">${itemsHtml}</div><div style="display:flex; justify-content:space-between; margin-top:15px; padding-top:10px; border-top:1px dashed #444; font-size:1.1rem; font-weight:bold;"><span>TOTAL</span><span style="color:var(--accent);">฿${formatNumber(total)}</span></div></div>`;
        modal.querySelector('.checkout-header').insertAdjacentHTML('afterend', summaryHTML);
        overlay.classList.add('active');
    };

    const processCheckout = (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.innerText = "PROCESSING...";
        btn.disabled = true;

        setTimeout(() => {
            const itemsToBuy = state.cart.filter(i => i.checked);
            const totalAmount = itemsToBuy.reduce((sum, i) => sum + (i.price * i.qty), 0);

            // [เพิ่มใหม่] บันทึก Order ลง User History
            if(state.currentUser) {
                const newOrder = {
                    id: Date.now(),
                    date: new Date().toLocaleDateString(),
                    items: itemsToBuy,
                    total: totalAmount
                };
                
                state.currentUser.orders = state.currentUser.orders || [];
                state.currentUser.orders.push(newOrder);
                
                // Update Database (LocalStorage)
                const userIndex = state.users.findIndex(u => u.email === state.currentUser.email);
                if(userIndex !== -1) {
                    state.users[userIndex] = state.currentUser;
                    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(state.users));
                    localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(state.currentUser));
                }
            }

            state.cart = state.cart.filter(i => !i.checked);
            saveCart();
            closeCheckout();
            showToast("🎉 Order Placed Successfully!");
            btn.innerText = originalText;
            btn.disabled = false;
            e.target.reset();
        }, 1500);
    };

    const showOrderHistory = () => {
        // [เพิ่มใหม่] เปิดหน้าต่าง History
        if(!state.currentUser) return;
        const historyList = document.getElementById('order-history-list');
        const orders = state.currentUser.orders || [];

        if(orders.length === 0) {
            historyList.innerHTML = `<div style="text-align:center; color:#888; padding:20px;">No orders yet.</div>`;
        } else {
            historyList.innerHTML = orders.slice().reverse().map(order => `
                <div class="order-card">
                    <div class="order-header"><span>DATE: ${order.date}</span><span class="status-badge">COMPLETED</span></div>
                    ${order.items.map(item => `<div class="order-item-row"><img src="${item.image}" style="width:30px; height:30px; object-fit:cover; border-radius:4px;"><div><div style="color:#fff; font-size:0.8rem;">${item.name}</div><div style="color:#888; font-size:0.7rem;">${item.size} x ${item.qty}</div></div><div style="margin-left:auto; font-weight:bold;">฿${formatNumber(item.price * item.qty)}</div></div>`).join('')}
                    <div style="text-align:right; margin-top:5px; padding-top:5px; border-top:1px solid rgba(255,255,255,0.1); color:var(--accent);">TOTAL: ฿${formatNumber(order.total)}</div>
                </div>`).join('');
        }
        document.getElementById('history-modal').classList.add('active');
        // ปิดเมนู User เมื่อเปิด History
        document.getElementById('user-dropdown').classList.remove('active');
    };

    const handleLogout = () => {
        state.currentUser = null;
        localStorage.removeItem(CONFIG.SESSION_KEY);
        updateUserUI();
        document.getElementById('user-dropdown').classList.remove('active');
        showToast("LOGGED OUT");
    };

    const toggleMenu = () => { const nav = document.querySelector('.nav-popup'); if(nav) nav.classList.toggle('active'); };
    const closeModal = (id) => { document.getElementById(id).classList.remove('active'); };
    const closeCheckout = () => closeModal('checkout-overlay');

    // --- Auth Logic ---
    const loadUsers = () => { try { state.users = JSON.parse(localStorage.getItem(CONFIG.USER_KEY) || '[]'); } catch(e){ state.users = []; } };
    const checkSession = () => { try { const session = JSON.parse(localStorage.getItem(CONFIG.SESSION_KEY)); if(session) { state.currentUser = session; updateUserUI(); } } catch(e){} };
    
    const updateUserUI = () => {
        const nameDisplay = document.getElementById('user-name-display');
        const menuUserName = document.getElementById('menu-user-name');
        if(nameDisplay && state.currentUser) {
            nameDisplay.innerText = state.currentUser.name;
            nameDisplay.style.display = 'block';
            if(menuUserName) menuUserName.innerText = state.currentUser.name;
            if(elements.userBtn) elements.userBtn.style.color = 'var(--accent)';
        } else if (nameDisplay) {
            nameDisplay.style.display = 'none';
            if(elements.userBtn) elements.userBtn.style.color = 'var(--text-main)';
        }
    };

    const toggleAuthModal = () => {
        if(state.currentUser) {
            // [เพิ่มใหม่] เปิด Dropdown แทน confirm
            const dropdown = document.getElementById('user-dropdown');
            dropdown.classList.toggle('active');
        } else {
            const modal = document.getElementById('auth-modal');
            if(modal) {
                modal.classList.add('active');
                switchAuthMode('login');
            }
        }
    };

    const switchAuthMode = (mode) => {
        document.getElementById('auth-login').style.display = mode === 'login' ? 'block' : 'none';
        document.getElementById('auth-register').style.display = mode === 'register' ? 'block' : 'none';
        document.getElementById('auth-title').innerText = mode === 'login' ? 'LOGIN' : 'REGISTER';
    };

    const handleLogin = (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;
        const user = state.users.find(u => u.email === email && u.pass === pass);
        if(user) {
            state.currentUser = user;
            localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(user));
            updateUserUI();
            closeModal('auth-modal');
            showToast(`WELCOME BACK, ${user.name}`);
            e.target.reset();
        } else { showToast("INVALID EMAIL OR PASSWORD"); }
    };

    const handleRegister = (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;
        if(state.users.find(u => u.email === email)) return showToast("EMAIL ALREADY EXISTS");
        const newUser = { name, email, pass, orders: [] }; // เริ่มต้น Orders ว่าง
        state.users.push(newUser);
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(state.users));
        showToast("REGISTER SUCCESS! PLEASE LOGIN");
        switchAuthMode('login');
        e.target.reset();
    };

    const injectAuthModal = () => {
        if(document.getElementById('auth-modal')) return;
        const html = `
        <div id="auth-modal" class="modal-overlay">
            <div class="checkout-modal variant-box" style="text-align:center;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3 id="auth-title" class="variant-title" style="margin:0; color:var(--accent);">LOGIN</h3>
                    <button class="close-modal-variant" onclick="App.closeModal('auth-modal')">✕</button>
                </div>
                <div id="auth-login">
                    <form onsubmit="App.handleLogin(event)">
                        <input type="email" id="login-email" class="form-input" placeholder="Email" required style="margin-bottom:15px;">
                        <input type="password" id="login-pass" class="form-input" placeholder="Password" required style="margin-bottom:20px;">
                        <button type="submit" class="btn-checkout btn-add-confirm">LOGIN</button>
                    </form>
                    <p style="margin-top:15px; font-size:0.8rem; color:#888;">New here? <span onclick="App.switchAuthMode('register')" style="color:var(--accent); cursor:pointer; text-decoration:underline;">Register</span></p>
                </div>
                <div id="auth-register" style="display:none;">
                    <form onsubmit="App.handleRegister(event)">
                        <input type="text" id="reg-name" class="form-input" placeholder="Your Name" required style="margin-bottom:15px;">
                        <input type="email" id="reg-email" class="form-input" placeholder="Email" required style="margin-bottom:15px;">
                        <input type="password" id="reg-pass" class="form-input" placeholder="Password" required style="margin-bottom:20px;">
                        <button type="submit" class="btn-checkout btn-add-confirm">CREATE ACCOUNT</button>
                    </form>
                    <p style="margin-top:15px; font-size:0.8rem; color:#888;">Have an account? <span onclick="App.switchAuthMode('login')" style="color:var(--accent); cursor:pointer; text-decoration:underline;">Login</span></p>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    };

    return { 
        init, toggleCart, openCheckout, closeCheckout, processCheckout,
        openVariantModal, closeModal, selectSize, selectColor, adjustTempQty, confirmAddToCart,
        removeFromCart, toggleItemCheck, toggleMenu, injectAuthModal,
        toggleAuthModal, handleLogin, handleRegister, switchAuthMode,
        // [New Export]
        handleLogout, showOrderHistory
    };
})();

document.addEventListener('DOMContentLoaded', App.init);