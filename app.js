/**
 * Noctis Wear - Core Application Logic V14 (Payment Gateway Included)
 * Features: Admin, Wishlist, Coupons, Gallery, Reviews, Auth, Payment Simulation
 */

const App = (() => {
    // 1. CONFIGURATION
    const CONFIG = {
        STORAGE_KEY: 'noctis_cart_premium_v3',
        WISHLIST_KEY: 'noctis_wishlist_v1',
        USER_KEY: 'noctis_users_v1',
        SESSION_KEY: 'noctis_session_v1',
        PRODUCTS_KEY: 'noctis_products_custom_v1',
        COUPONS_KEY: 'noctis_coupons_v1',
        TOAST_DURATION: 3000,
        COUPONS: {
            'NOCTIS10': { type: 'percent', value: 0.10 },
            'WELCOME': { type: 'fixed', value: 100 }
        }
    };

    // 2. STATE (DATA)
    const state = {
        products: [
            { 
                id: 1, name: "Lumix Heavy Tee", category: "T-Shirt", price: 590, oldPrice: 890, sale: true, 
                image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=600",
                images: [
                    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=600",
                    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=600",
                    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600"
                ],
                reviews: [
                    { user: "User123", text: "ผ้าดีมากครับ ใส่สบาย", rating: 5 },
                    { user: "Sarah K.", text: "ส่งไว แต่ไซส์ใหญ่กว่าปกตินิดนึง", rating: 4 }
                ],
                sizes: ['S','M','L','XL'], colors: ['#000000','#FFFFFF'] 
            },
            { id: 2, name: "Vortex Oversize", category: "T-Shirt", price: 450, oldPrice: null, sale: false, image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=600", sizes: ['M','L','XL'], colors: ['#1a1a1a','#333333'] },
            { id: 3, name: "Nova Silk Shirt", category: "Shirt", price: 1290, oldPrice: 1590, sale: true, image: "https://images.unsplash.com/photo-1626497764746-6dc36546b388?auto=format&fit=crop&q=80&w=600", sizes: ['S','M','L'], colors: ['#000000','#550000'] },
            { id: 4, name: "Eclipse Hoodie", category: "Hoodie", price: 1500, oldPrice: null, sale: false, image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600", sizes: ['M','L','XL'], colors: ['#000000'] },
            { id: 5, name: "Orion Smart Shirt", category: "Shirt", price: 990, oldPrice: null, sale: false, image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=600", sizes: ['S','M','L','XL'], colors: ['#FFFFFF','#DDDDDD'] },
            { id: 6, name: "Comet Graphic Tee", category: "T-Shirt", price: 390, oldPrice: 590, sale: true, image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&q=80&w=600", sizes: ['S','M','L'], colors: ['#000000','#FFD700'] },
            { id: 7, name: "Nebula Jacket", category: "Hoodie", price: 2100, oldPrice: 2500, sale: true, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600", sizes: ['L','XL'], colors: ['#000000','#222222'] },
            { id: 8, name: "Galaxy Zip Hoodie", category: "Hoodie", price: 1890, oldPrice: null, sale: false, image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=600", sizes: ['M','L','XL'], colors: ['#000000'] }
        ],
        cart: [],
        wishlist: [],
        activeCoupon: null,
        tempProduct: null,
        tempOrder: null, // [NEW] สำหรับพักออเดอร์ก่อนจ่ายเงิน
        users: [],        
        currentUser: null
    };

    const elements = {};

    // 3. INITIALIZATION
    const init = () => {
        cacheDOM();
        loadProducts(); 
        loadCart();
        loadWishlist();
        loadUsers();      
        checkSession();   
        
        injectAuthModal(); 
        injectUserMenu();    
        injectHistoryModal();
        injectModal(); 
        injectPaymentModal(); // [NEW] สร้าง Modal จ่ายเงิน
        
        if (elements.productGrid) {
            renderProducts(state.products);
            bindShopEvents();
        }
        if(!localStorage.getItem(CONFIG.COUPONS_KEY)) {
            const defaultCoupons = [
                { code: 'NOCTIS10', type: 'percent', value: 0.10, active: true },
                { code: 'WELCOME', type: 'fixed', value: 100, active: true }
            ];
            localStorage.setItem(CONFIG.COUPONS_KEY, JSON.stringify(defaultCoupons));
        }
        updateCartCount();
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
        elements.userBtn = document.getElementById('user-account-btn');
    };

    const initScrollAnimations = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
    };

    // 4. STORAGE & DATA LOGIC
    const loadProducts = () => {
        try {
            const stored = localStorage.getItem(CONFIG.PRODUCTS_KEY);
            if (stored) {
                state.products = JSON.parse(stored);
            } else {
                if(state.products.length > 0) {
                     localStorage.setItem(CONFIG.PRODUCTS_KEY, JSON.stringify(state.products));
                }
            }
        } catch(e) { console.error("Error loading products", e); }
    };

    const loadCart = () => { try { const s = localStorage.getItem(CONFIG.STORAGE_KEY); state.cart = s ? JSON.parse(s) : []; } catch(e){ state.cart=[]; } };
    const saveCart = () => { localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.cart)); updateCartCount(); renderCartSidebar(); };
    
    const loadWishlist = () => { try { const s = localStorage.getItem(CONFIG.WISHLIST_KEY); state.wishlist = s ? JSON.parse(s) : []; } catch(e){ state.wishlist=[]; } };
    const saveWishlist = () => { localStorage.setItem(CONFIG.WISHLIST_KEY, JSON.stringify(state.wishlist)); };

    // 5. SHOP LOGIC
    const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num);

    const renderProducts = (items) => {
        if (!elements.productGrid) return;
        if (items.length === 0) {
            elements.productGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px; color:#666;">ไม่พบสินค้า / No Products Found</div>`;
            return;
        }

        elements.productGrid.innerHTML = items.map((item, index) => {
            const saleBadge = item.sale ? `<div class="badge-new" style="background:var(--danger); color:#fff;">SALE</div>` : '';
            const newBadge = item.new && !item.sale ? `<div class="badge-new">NEW</div>` : '';
            const priceHtml = item.oldPrice ? `<span class="old-price">฿${formatNumber(item.oldPrice)}</span>฿${formatNumber(item.price)}` : `฿${formatNumber(item.price)}`;
            const isWishlisted = state.wishlist.includes(item.id);
            const heartClass = isWishlisted ? 'active' : '';
            const imgUrl = item.image || (item.images && item.images[0]);

            return `
            <div class="product-card reveal-on-scroll" style="transition-delay: ${index * 50}ms">
                <div class="product-img-wrapper">
                    ${saleBadge} ${newBadge}
                    <button class="btn-wishlist ${heartClass}" onclick="App.toggleWishlist(event, ${item.id})">
                        <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </button>
                    <img src="${imgUrl}" class="product-img" loading="lazy" alt="${item.name}">
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

    const handleFilter = () => {
        let result = [...state.products];
        const searchTerm = elements.searchInput ? elements.searchInput.value.toLowerCase() : '';
        if (searchTerm) result = result.filter(p => p.name.toLowerCase().includes(searchTerm));
        
        const checkedCats = Array.from(elements.filterCats).filter(cb => cb.checked).map(cb => cb.value);
        if (checkedCats.length) {
            if(checkedCats.includes('wishlist')) {
                result = result.filter(p => state.wishlist.includes(p.id));
            } else {
                result = result.filter(p => checkedCats.includes(p.category));
            }
        }
        
        const priceVal = document.querySelector('input[name="price"]:checked')?.value;
        if (priceVal) {
            if (priceVal === '500') result = result.filter(p => p.price <= 500);
            else if (priceVal === '1000') result = result.filter(p => p.price > 500 && p.price <= 1000);
            else if (priceVal === '1000+') result = result.filter(p => p.price > 1000);
        }
        
        const sortVal = elements.sortSelect.value;
        if (sortVal === 'low-high') result.sort((a,b) => a.price - b.price);
        else if (sortVal === 'high-low') result.sort((a,b) => b.price - a.price);
        
        renderProducts(result);
    };

    const bindShopEvents = () => {
        if(!elements.filterCats) return;
        elements.filterCats.forEach(el => el.addEventListener('change', handleFilter));
        elements.filterPrices.forEach(el => el.addEventListener('change', handleFilter));
        if(elements.sortSelect) elements.sortSelect.addEventListener('change', handleFilter);
        if(elements.searchInput) elements.searchInput.addEventListener('input', handleFilter);
    };

    const toggleWishlist = (e, id) => {
        e.stopPropagation();
        const idx = state.wishlist.indexOf(id);
        if (idx > -1) {
            state.wishlist.splice(idx, 1);
            showToast("Removed from Wishlist");
        } else {
            state.wishlist.push(id);
            showToast("Added to Wishlist ❤️");
        }
        saveWishlist();
        const btn = e.currentTarget;
        btn.classList.toggle('active');
        const isViewingWishlist = document.querySelector('.filter-cat[value="wishlist"]')?.checked;
        if(isViewingWishlist) handleFilter();
    };

    // 6. MODAL & GALLERY
    const injectModal = () => {
        const modalHTML = `
        <div id="variant-modal" class="modal-overlay">
            <div class="checkout-modal variant-box">
                <button class="close-modal-variant" onclick="App.closeModal('variant-modal')">✕</button>
                <div class="product-gallery">
                    <div class="main-img-frame"><img id="modal-main-img" class="main-img-display" src="" alt=""></div>
                    <div id="modal-thumbs" class="thumb-grid"></div>
                </div>
                <div class="product-details-col">
                    <h3 id="modal-title" class="variant-title" style="margin:0 0 10px 0; font-size:1.5rem; color:#fff;">PRODUCT NAME</h3>
                    <div id="modal-price" style="font-size:1.2rem; color:var(--accent); font-weight:bold; margin-bottom:20px;">฿0</div>
                    <div style="margin-bottom:20px;"><label class="option-label">SIZE</label><div id="modal-sizes" class="size-grid"></div></div>
                    <div style="margin-bottom:25px;"><label class="option-label">COLOR</label><div id="modal-colors" class="color-grid"></div></div>
                    <div style="margin-bottom:30px;"><label class="option-label">QUANTITY</label>
                        <div class="qty-control-large"><button class="qty-btn-large" onclick="App.adjustTempQty(-1)">-</button><span id="modal-qty">1</span><button class="qty-btn-large" onclick="App.adjustTempQty(1)">+</button></div>
                    </div>
                    <button class="btn-checkout btn-add-confirm" onclick="App.confirmAddToCart()">เพิ่มลงตะกร้า / ADD TO CART</button>
                    <div class="review-section">
                        <div class="review-header"><span style="font-weight:bold; color:#fff;">REVIEWS</span><span id="avg-rating" class="star-rating">★★★★☆ (4.5)</span></div>
                        <div id="review-list" class="review-list"></div>
                        <form class="review-form" onsubmit="App.submitReview(event)">
                            <input type="text" id="new-review-text" class="review-input" placeholder="เขียนรีวิว... (Write a review)" required>
                            <button type="submit" class="btn-submit-review">SEND</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    };

    const openVariantModal = (id) => {
        const product = state.products.find(p => p.id === id); if (!product) return;
        state.tempProduct = { ...product, selectedSize: product.sizes?.[0] || 'F', selectedColor: product.colors?.[0] || '#000', selectedQty: 1 };
        document.getElementById('modal-title').innerText = product.name;
        document.getElementById('modal-price').innerText = `฿${formatNumber(product.price)}`;
        const images = product.images && product.images.length > 0 ? product.images : [product.image];
        const mainImg = document.getElementById('modal-main-img');
        const thumbContainer = document.getElementById('modal-thumbs');
        mainImg.src = images[0];
        thumbContainer.innerHTML = images.map((img, idx) => `<img src="${img}" class="thumb-img ${idx === 0 ? 'active' : ''}" onclick="App.selectImage(this, '${img}')">`).join('');
        renderReviews(product);
        document.getElementById('modal-sizes').innerHTML = (product.sizes || ['Free Size']).map(s => `<button class="size-btn ${s === state.tempProduct.selectedSize ? 'active' : ''}" onclick="App.selectSize(this, '${s}')">${s}</button>`).join('');
        document.getElementById('modal-colors').innerHTML = (product.colors || ['#000']).map(c => `<div class="color-btn ${c === state.tempProduct.selectedColor ? 'active' : ''}" style="background:${c}" onclick="App.selectColor(this, '${c}')"></div>`).join('');
        document.getElementById('modal-qty').innerText = "1";
        document.getElementById('variant-modal').classList.add('active');
    };

    const selectImage = (el, src) => { document.getElementById('modal-main-img').src = src; document.querySelectorAll('.thumb-img').forEach(img => img.classList.remove('active')); el.classList.add('active'); };

    const renderReviews = (product) => {
        const list = document.getElementById('review-list');
        const ratingDisplay = document.getElementById('avg-rating');
        const reviews = product.reviews || [];
        let avg = 0;
        if(reviews.length > 0) { const total = reviews.reduce((sum, r) => sum + r.rating, 0); avg = (total / reviews.length).toFixed(1); }
        ratingDisplay.innerText = `★ ${avg} (${reviews.length} Reviews)`;
        if(reviews.length === 0) list.innerHTML = `<div style="color:#666; text-align:center; padding:10px;">No reviews yet. Be the first!</div>`;
        else list.innerHTML = reviews.map(r => `<div class="review-item"><div class="review-user">${r.user} <span style="color:var(--accent);">(${r.rating}★)</span></div><div class="review-text">${r.text}</div></div>`).join('');
    };

    const submitReview = (e) => {
        e.preventDefault(); if(!state.tempProduct) return;
        const textInput = document.getElementById('new-review-text'); const text = textInput.value.trim(); if(!text) return;
        const userName = state.currentUser ? state.currentUser.name : "Guest";
        const newReview = { user: userName, text: text, rating: 5 };
        const productIndex = state.products.findIndex(p => p.id === state.tempProduct.id);
        if(productIndex !== -1) {
            if(!state.products[productIndex].reviews) state.products[productIndex].reviews = [];
            state.products[productIndex].reviews.unshift(newReview);
            if(localStorage.getItem(CONFIG.PRODUCTS_KEY)) localStorage.setItem(CONFIG.PRODUCTS_KEY, JSON.stringify(state.products));
            showToast("ขอบคุณสำหรับรีวิวครับ! 🙏"); textInput.value = ""; renderReviews(state.products[productIndex]);
        }
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

    // 7. CART & CHECKOUT
    const renderCartSidebar = () => {
        if (!elements.cartItems) return;
        if (state.cart.length === 0) { elements.cartItems.innerHTML = `<div class="empty-cart-state"><div class="empty-cart-icon">🛒</div><h3 style="margin-bottom:10px;">ตะกร้าว่างเปล่า / EMPTY</h3><button class="btn-primary" onclick="App.toggleCart(false); window.location.href='shop.html'" style="padding:10px 30px; font-size:0.8rem;">ไปเลือกซื้อสินค้า / SHOP NOW</button></div>`; if(elements.cartTotal) elements.cartTotal.style.display = 'none'; return; }
        const subtotal = state.cart.reduce((sum, item) => item.checked ? sum + (item.price * item.qty) : sum, 0);
        let discount = 0;
        if (state.activeCoupon && subtotal > 0) { if (state.activeCoupon.type === 'percent') discount = subtotal * state.activeCoupon.value; else if (state.activeCoupon.type === 'fixed') discount = state.activeCoupon.value; }
        if(discount > subtotal) discount = subtotal; const finalTotal = subtotal - discount;

        elements.cartItems.innerHTML = state.cart.map((item, index) => `<div class="cart-item" style="display:flex; gap:15px; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:15px; align-items:center;"><input type="checkbox" ${item.checked ? 'checked' : ''} onchange="App.toggleItemCheck(${index})" style="transform:scale(1.2); accent-color:var(--accent); cursor:pointer;"><img src="${item.image}" style="width:60px; height:70px; object-fit:cover; border-radius:4px;"><div style="flex:1;"><div style="font-weight:700; font-size:0.9rem;">${item.name}</div><div style="font-size:0.8rem; color:var(--text-muted); margin:4px 0;">${item.size} | <span style="display:inline-block; width:10px; height:10px; background:${item.color}; border-radius:50%; border:1px solid #555;"></span></div><div style="font-size:0.8rem; color:var(--text-muted);">Qty: ${item.qty}</div></div><div style="text-align:right;"><div style="font-weight:600; color:var(--accent);">฿${formatNumber(item.price * item.qty)}</div><div style="color:var(--danger); font-size:0.7rem; cursor:pointer; text-decoration:underline;" onclick="App.removeFromCart(${index})">REMOVE</div></div></div>`).join('');

        const couponHTML = `<div class="coupon-section"><label style="font-size:0.7rem; color:#888;">DISCOUNT CODE (Try: NOCTIS10)</label><div class="coupon-input-group"><input type="text" id="coupon-code" class="coupon-input" placeholder="CODE" value="${state.activeCoupon ? 'APPLIED!' : ''}" ${state.activeCoupon ? 'disabled' : ''}><button class="btn-apply" onclick="${state.activeCoupon ? 'App.removeCoupon()' : 'App.applyCoupon()'}">${state.activeCoupon ? 'CLEAR' : 'APPLY'}</button></div></div>`;
        let summaryHTML = ''; if (discount > 0) summaryHTML += `<div class="discount-row"><span>SUBTOTAL</span><span>฿${formatNumber(subtotal)}</span></div><div class="discount-row"><span>DISCOUNT</span><span>-฿${formatNumber(discount)}</span></div>`;
        if (elements.cartTotal) { elements.cartTotal.style.display = 'block'; const existingCoupon = document.querySelector('.coupon-section'); if(!existingCoupon) elements.cartItems.insertAdjacentHTML('afterend', couponHTML); else existingCoupon.outerHTML = couponHTML; elements.cartTotal.innerHTML = `${summaryHTML}<div style="font-weight:700; font-size:1.2rem; display:flex; justify-content:space-between; margin-top:10px;"><span>TOTAL</span><span style="color:var(--accent);">฿${formatNumber(finalTotal)}</span></div>`; }
    };

   const applyCoupon = () => {
        const input = document.getElementById('coupon-code');
        const code = input.value.trim().toUpperCase();
        
        // [แก้ใหม่] ดึงคูปองจาก LocalStorage
        const storedCoupons = JSON.parse(localStorage.getItem(CONFIG.COUPONS_KEY) || '[]');
        const coupon = storedCoupons.find(c => c.code === code && c.active);

        if (coupon) {
            state.activeCoupon = coupon;
            showToast("🎉 Code Applied!");
            renderCartSidebar();
        } else {
            showToast("❌ Invalid Code");
        }
    };
    const removeCoupon = () => { state.activeCoupon = null; renderCartSidebar(); };
    const toggleItemCheck = (index) => { state.cart[index].checked = !state.cart[index].checked; saveCart(); };
    const removeFromCart = (index) => { state.cart.splice(index, 1); saveCart(); };
    const toggleCart = (show) => { if (elements.cartSidebar) elements.cartSidebar.style.right = show ? '0' : '-100%'; if (show) renderCartSidebar(); };
    const updateCartCount = () => { if (!elements.cartBadge) return; const count = state.cart.reduce((acc, item) => acc + item.qty, 0); elements.cartBadge.innerText = count; elements.cartBadge.style.display = count > 0 ? 'flex' : 'none'; };

    const openCheckout = () => {
        const checkedItems = state.cart.filter(i => i.checked);
        if (checkedItems.length === 0) return showToast("กรุณาเลือกสินค้า / Select items!");
        toggleCart(false); const overlay = document.getElementById('checkout-overlay'); const modal = overlay.querySelector('.checkout-modal');
        const oldSummary = document.getElementById('checkout-summary-box'); if(oldSummary) oldSummary.remove();

        let total = 0; const itemsHtml = checkedItems.map(item => { total += item.price * item.qty; return `<div style="display:flex; justify-content:space-between; margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.1); font-size:0.85rem;"><div style="display:flex; gap:10px;"><img src="${item.image}" style="width:40px; height:50px; object-fit:cover; border-radius:4px;"><div><div style="font-weight:bold; color:#fff;">${item.name}</div><div style="color:#888; font-size:0.75rem;">${item.size} / ${item.qty} pcs</div></div></div><div style="font-weight:bold; color:var(--accent);">฿${formatNumber(item.price * item.qty)}</div></div>`; }).join('');
        let discount = 0; if (state.activeCoupon && total > 0) { if (state.activeCoupon.type === 'percent') discount = total * state.activeCoupon.value; else if (state.activeCoupon.type === 'fixed') discount = state.activeCoupon.value; }
        if(discount > total) discount = total; const finalTotal = total - discount;
        let discountHtml = ''; if(discount > 0) discountHtml = `<div style="display:flex; justify-content:space-between; margin-top:10px; color:var(--danger);"><span>Discount</span><span>-฿${formatNumber(discount)}</span></div>`;
        const summaryHTML = `<div id="checkout-summary-box" style="background:rgba(255,255,255,0.03); padding:15px; border-radius:8px; margin-bottom:20px;"><h4 style="color:#888; font-size:0.8rem; margin-bottom:10px; letter-spacing:1px;">ORDER SUMMARY</h4><div class="summary-scroll" style="max-height:150px; overflow-y:auto; padding-right:5px;">${itemsHtml}</div>${discountHtml}<div style="display:flex; justify-content:space-between; margin-top:15px; padding-top:10px; border-top:1px dashed #444; font-size:1.1rem; font-weight:bold;"><span>TOTAL</span><span style="color:var(--accent);">฿${formatNumber(finalTotal)}</span></div></div>`;
        modal.querySelector('.checkout-header').insertAdjacentHTML('afterend', summaryHTML); overlay.classList.add('active');
    };

    const processCheckout = (e) => {
        e.preventDefault();
        if (!state.currentUser) { showToast("⚠️ กรุณาเข้าสู่ระบบ! / Please Login"); closeCheckout(); const authModal = document.getElementById('auth-modal'); if(authModal) { authModal.classList.add('active'); switchAuthMode('register'); } return; }

        const itemsToBuy = state.cart.filter(i => i.checked);
        let totalAmount = itemsToBuy.reduce((sum, i) => sum + (i.price * i.qty), 0);
        let discount = 0; if (state.activeCoupon) { if (state.activeCoupon.type === 'percent') discount = totalAmount * state.activeCoupon.value; else if (state.activeCoupon.type === 'fixed') discount = state.activeCoupon.value; }
        if(discount > totalAmount) discount = totalAmount; totalAmount -= discount;

        state.tempOrder = { items: itemsToBuy, total: totalAmount, coupon: state.activeCoupon ? "APPLIED" : "NONE" };
        closeCheckout(); openPaymentModal();
    };

    // --- PAYMENT SYSTEM ---
    const injectPaymentModal = () => {
        if(document.getElementById('payment-modal')) return;
        const html = `
        <div id="payment-modal" class="modal-overlay">
            <div class="checkout-modal variant-box">
                <button class="close-modal-variant" onclick="App.closeModal('payment-modal')">✕</button>
                <div class="payment-title">SELECT PAYMENT METHOD</div>
                <div class="payment-methods">
                    <div class="pay-method-btn active" onclick="App.switchPaymentMethod('qr', this)">
                        <svg viewBox="0 0 24 24"><path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h-2v2h2v-2zm-2 2h-2v2h2v-2zm2-2h2v2h-2v-2zm-2 4h2v2h-2v-2zm2 0h-2v2h2v-2z"/></svg><span>Scan QR</span>
                    </div>
                    <div class="pay-method-btn" onclick="App.switchPaymentMethod('cc', this)">
                        <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg><span>Credit Card</span>
                    </div>
                </div>
                <div id="payment-content" class="payment-content">
                    <div class="qr-container">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=NoctisPayment" class="qr-img">
                        <div style="font-size:0.8rem; color:#888; margin-bottom:10px;">SCAN TO PAY: <span style="color:var(--accent);">฿<span id="pay-total">0</span></span></div>
                        <button class="file-upload-btn" onclick="this.innerText='✅ SLIP ATTACHED'">📎 UPLOAD SLIP</button>
                    </div>
                </div>
                <button class="btn-add-confirm" onclick="App.confirmPayment()">CONFIRM PAYMENT</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    };

    const openPaymentModal = () => {
        injectPaymentModal(); if(!state.tempOrder) return;
        document.getElementById('pay-total').innerText = formatNumber(state.tempOrder.total);
        document.getElementById('payment-modal').classList.add('active');
    };

    const switchPaymentMethod = (method, btn) => {
        document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
        const container = document.getElementById('payment-content');
        if(method === 'qr') {
            container.innerHTML = `<div class="qr-container"><img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=NoctisPayment" class="qr-img"><div style="font-size:0.8rem; color:#888; margin-bottom:10px;">SCAN TO PAY: <span style="color:var(--accent);">฿${formatNumber(state.tempOrder.total)}</span></div><button class="file-upload-btn" onclick="this.innerText='✅ SLIP ATTACHED'">📎 UPLOAD SLIP</button></div>`;
        } else {
            container.innerHTML = `<div class="cc-form"><label class="form-label">CARD NUMBER</label><input type="text" class="cc-input" placeholder="0000 0000 0000 0000"><div class="cc-row"><div><label class="form-label">EXPIRY</label><input type="text" class="cc-input" placeholder="MM/YY"></div><div><label class="form-label">CVC</label><input type="text" class="cc-input" placeholder="123"></div></div></div>`;
        }
    };

    const confirmPayment = () => {
        const btn = document.querySelector('#payment-modal .btn-add-confirm');
        btn.innerText = "VERIFYING..."; btn.disabled = true;
        setTimeout(() => {
            if(state.currentUser && state.tempOrder) {
                const newOrder = { id: Date.now(), date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(), items: state.tempOrder.items, total: state.tempOrder.total, coupon: state.tempOrder.coupon, status: 'Paid' };
                state.currentUser.orders = state.currentUser.orders || []; state.currentUser.orders.push(newOrder);
                const userIndex = state.users.findIndex(u => u.email === state.currentUser.email);
                if(userIndex !== -1) { state.users[userIndex] = state.currentUser; localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(state.users)); localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(state.currentUser)); }
            }
            state.cart = state.cart.filter(i => !i.checked); state.activeCoupon = null; state.tempOrder = null; saveCart();
            closeModal('payment-modal'); showToast("🎉 Payment Successful! / ชำระเงินสำเร็จ");
            btn.innerText = "CONFIRM PAYMENT"; btn.disabled = false;
        }, 2000);
    };

    // 8. AUTHENTICATION & UI HELPERS
    const showToast = (msg) => { let t = document.querySelector('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); } t.innerText = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), CONFIG.TOAST_DURATION); };
    const closeModal = (id) => { document.getElementById(id).classList.remove('active'); };
    const closeCheckout = () => closeModal('checkout-overlay');
    const toggleMenu = () => { const nav = document.querySelector('.nav-popup'); if(nav) nav.classList.toggle('active'); };

    const injectAuthModal = () => {
        if(document.getElementById('auth-modal')) return;
        const html = `
        <div id="auth-modal" class="modal-overlay">
            <div class="checkout-modal variant-box" style="text-align:center;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3 id="auth-title" class="variant-title" style="margin:0; color:var(--accent);">เข้าสู่ระบบ / LOGIN</h3>
                    <button class="close-modal-variant" onclick="App.closeModal('auth-modal')">✕</button>
                </div>
                <div id="auth-login">
                    <form onsubmit="App.handleLogin(event)">
                        <input type="email" id="login-email" class="form-input" placeholder="อีเมล / Email" required style="margin-bottom:15px;">
                        <input type="password" id="login-pass" class="form-input" placeholder="รหัสผ่าน / Password" required style="margin-bottom:10px;">
                        <div style="text-align:right; margin-bottom:20px;"><span onclick="App.switchAuthMode('reset')" style="color:#888; font-size:0.8rem; cursor:pointer; text-decoration:underline;">ลืมรหัสผ่าน? / Forgot Password?</span></div>
                        <button type="submit" class="btn-checkout btn-add-confirm">เข้าสู่ระบบ / LOGIN</button>
                    </form>
                    <p style="margin-top:15px; font-size:0.8rem; color:#888;">ยังไม่มีบัญชี? <span onclick="App.switchAuthMode('register')" style="color:var(--accent); cursor:pointer; text-decoration:underline;">สมัครสมาชิก / Register</span></p>
                </div>
                <div id="auth-register" style="display:none;">
                    <form onsubmit="App.handleRegister(event)">
                        <input type="text" id="reg-name" class="form-input" placeholder="ชื่อของคุณ / Your Name" required style="margin-bottom:15px;">
                        <input type="email" id="reg-email" class="form-input" placeholder="อีเมล / Email" required style="margin-bottom:15px;">
                        <input type="password" id="reg-pass" class="form-input" placeholder="รหัสผ่าน / Password" required style="margin-bottom:15px;">
                        <input type="password" id="reg-pass-confirm" class="form-input" placeholder="ยืนยันรหัสผ่าน / Confirm Password" required style="margin-bottom:20px;">
                        <button type="submit" class="btn-checkout btn-add-confirm">สร้างบัญชี / CREATE ACCOUNT</button>
                    </form>
                    <p style="margin-top:15px; font-size:0.8rem; color:#888;">มีบัญชีแล้ว? <span onclick="App.switchAuthMode('login')" style="color:var(--accent); cursor:pointer; text-decoration:underline;">เข้าสู่ระบบ / Login</span></p>
                </div>
                <div id="auth-reset" style="display:none;">
                    <p style="color:#ccc; font-size:0.9rem; margin-bottom:20px;">กรอกอีเมลเพื่อตั้งรหัสผ่านใหม่</p>
                    <form onsubmit="App.handleResetPassword(event)">
                        <input type="email" id="reset-email" class="form-input" placeholder="อีเมลของคุณ / Your Email" required style="margin-bottom:15px;">
                        <input type="password" id="reset-new-pass" class="form-input" placeholder="รหัสผ่านใหม่ / New Password" required style="margin-bottom:15px;">
                        <input type="password" id="reset-confirm-pass" class="form-input" placeholder="ยืนยันรหัสผ่านใหม่ / Confirm New Password" required style="margin-bottom:20px;">
                        <button type="submit" class="btn-checkout btn-add-confirm">เปลี่ยนรหัสผ่าน / UPDATE PASSWORD</button>
                    </form>
                    <p style="margin-top:15px; font-size:0.8rem; color:#888;"><span onclick="App.switchAuthMode('login')" style="color:var(--accent); cursor:pointer; text-decoration:underline;">กลับไปหน้าเข้าสู่ระบบ / Back to Login</span></p>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    };

    const injectUserMenu = () => {
        if(!elements.userBtn) return;
        const menuHTML = `
        <div id="user-dropdown" class="user-dropdown">
            <div class="user-menu-item" style="cursor:default; border-bottom:1px solid rgba(255,215,0,0.2); color:var(--accent);">👤 <span id="menu-user-name">Guest</span></div>
            <div class="user-menu-item" onclick="App.showOrderHistory()">📦 ประวัติการสั่งซื้อ / My Orders</div>
            <div class="user-menu-item" onclick="App.handleLogout()">🚪 ออกจากระบบ / Logout</div>
        </div>`;
        elements.userBtn.style.position = 'relative'; elements.userBtn.insertAdjacentHTML('beforeend', menuHTML);
    };

    const injectHistoryModal = () => {
        if(document.getElementById('history-modal')) return;
        const html = `
        <div id="history-modal" class="modal-overlay">
            <div class="checkout-modal variant-box">
                <div>
                    <h3 class="variant-title" style="margin:0; color:var(--accent);">ประวัติการสั่งซื้อ / MY ORDERS</h3>
                    <button class="close-modal-variant" onclick="App.closeModal('history-modal')">✕</button>
                </div>
                <div id="order-history-list" style="max-height:60vh; overflow-y:auto; padding-right:5px;"></div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    };

    const loadUsers = () => { try { state.users = JSON.parse(localStorage.getItem(CONFIG.USER_KEY) || '[]'); } catch(e){ state.users = []; } };
    const checkSession = () => { try { const session = JSON.parse(localStorage.getItem(CONFIG.SESSION_KEY)); if(session) { state.currentUser = session; updateUserUI(); } } catch(e){} };
    
    const updateUserUI = () => {
        const nameDisplay = document.getElementById('user-name-display'); const menuUserName = document.getElementById('menu-user-name');
        if(nameDisplay && state.currentUser) { nameDisplay.innerText = state.currentUser.name; nameDisplay.style.display = 'block'; if(menuUserName) menuUserName.innerText = state.currentUser.name; if(elements.userBtn) elements.userBtn.style.color = 'var(--accent)'; } 
        else if (nameDisplay) { nameDisplay.style.display = 'none'; if(elements.userBtn) elements.userBtn.style.color = 'var(--text-main)'; }
    };

    const toggleAuthModal = () => { if(state.currentUser) { document.getElementById('user-dropdown').classList.toggle('active'); } else { const modal = document.getElementById('auth-modal'); if(modal) { modal.classList.add('active'); switchAuthMode('login'); } } };
    const switchAuthMode = (mode) => {
        document.getElementById('auth-login').style.display = mode === 'login' ? 'block' : 'none';
        document.getElementById('auth-register').style.display = mode === 'register' ? 'block' : 'none';
        document.getElementById('auth-reset').style.display = mode === 'reset' ? 'block' : 'none';
        const title = document.getElementById('auth-title');
        if (mode === 'login') title.innerText = 'เข้าสู่ระบบ / LOGIN'; else if (mode === 'register') title.innerText = 'สมัครสมาชิก / REGISTER'; else if (mode === 'reset') title.innerText = 'รีเซ็ตรหัสผ่าน / RESET';
    };

    const handleLogin = (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value; const pass = document.getElementById('login-pass').value;
        if(email === 'admin@noctis.com' && pass === '1234') { showToast("👑 ยินดีต้อนรับผู้ดูแลระบบ"); setTimeout(() => { window.location.href = 'admin.html'; }, 1500); return; }
        const user = state.users.find(u => u.email === email && u.pass === pass);
        if(user) { state.currentUser = user; localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(user)); updateUserUI(); closeModal('auth-modal'); showToast(`ยินดีต้อนรับ, ${user.name}`); e.target.reset(); } else { showToast("อีเมลหรือรหัสผ่านไม่ถูกต้อง"); }
    };

    const handleRegister = (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value; const email = document.getElementById('reg-email').value; const pass = document.getElementById('reg-pass').value; const passConfirm = document.getElementById('reg-pass-confirm').value;
        if(pass !== passConfirm) return showToast("⚠️ รหัสผ่านไม่ตรงกัน"); if(state.users.find(u => u.email === email)) return showToast("อีเมลนี้ถูกใช้ไปแล้ว");
        const newUser = { name, email, pass, orders: [] }; state.users.push(newUser); localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(state.users));
        showToast("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ"); switchAuthMode('login'); e.target.reset();
    };

    const handleResetPassword = (e) => {
        e.preventDefault(); const email = document.getElementById('reset-email').value; const newPass = document.getElementById('reset-new-pass').value; const confirmPass = document.getElementById('reset-confirm-pass').value;
        if (newPass !== confirmPass) return showToast("⚠️ รหัสผ่านใหม่ไม่ตรงกัน"); const userIndex = state.users.findIndex(u => u.email === email);
        if (userIndex !== -1) { state.users[userIndex].pass = newPass; localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(state.users)); showToast("🎉 เปลี่ยนรหัสผ่านสำเร็จ!"); switchAuthMode('login'); e.target.reset(); } else { showToast("❌ ไม่พบอีเมลนี้ในระบบ"); }
    };

    const handleLogout = () => { state.currentUser = null; localStorage.removeItem(CONFIG.SESSION_KEY); updateUserUI(); document.getElementById('user-dropdown').classList.remove('active'); showToast("ออกจากระบบแล้ว / LOGGED OUT"); };
    
    const showOrderHistory = () => {
        if(!state.currentUser) return;
        const historyList = document.getElementById('order-history-list'); const orders = state.currentUser.orders || [];
        if(orders.length === 0) { historyList.innerHTML = `<div style="text-align:center; color:#888; padding:20px;">ยังไม่มีประวัติการสั่งซื้อ</div>`; } 
        else {
            historyList.innerHTML = orders.slice().reverse().map(order => `
                <div class="order-card"><div class="order-header"><span>วันที่: ${order.date}</span><span class="status-badge" style="background:${order.status==='Paid'?'#2ecc7122':'#f1c40f22'}; color:${order.status==='Paid'?'#2ecc71':'#f1c40f'};">${order.status || 'Paid'}</span></div>
                    ${order.items.map(item => `<div class="order-item-row"><img src="${item.image}" style="width:30px; height:30px; object-fit:cover; border-radius:4px;"><div><div style="color:#fff; font-size:0.8rem;">${item.name}</div><div style="color:#888; font-size:0.7rem;">${item.size} x ${item.qty}</div></div><div style="margin-left:auto; font-weight:bold;">฿${formatNumber(item.price * item.qty)}</div></div>`).join('')}
                    <div style="text-align:right; margin-top:5px; padding-top:5px; border-top:1px solid rgba(255,255,255,0.1); color:var(--accent);">ยอดรวมสุทธิ: ฿${formatNumber(order.total)}</div></div>`).join('');
        }
        document.getElementById('history-modal').classList.add('active'); document.getElementById('user-dropdown').classList.remove('active');
    };

    // EXPORTS
    return { 
        init, toggleCart, openCheckout, closeCheckout, processCheckout,
        openVariantModal, closeModal, selectSize, selectColor, adjustTempQty, confirmAddToCart,
        removeFromCart, toggleItemCheck, toggleMenu, injectAuthModal,
        toggleAuthModal, handleLogin, handleRegister, switchAuthMode,
        handleLogout, showOrderHistory, handleResetPassword, toggleWishlist, applyCoupon, removeCoupon,
        selectImage, submitReview, loadProducts, switchPaymentMethod, confirmPayment
    };
})();

/* =========================================
   SYSTEM C: ADMIN LOGIC MODULE (Updated V4: Edit System)
   ========================================= */
const AdminApp = (() => {
    const CONFIG = { PRODUCTS_KEY: 'noctis_products_custom_v1', USER_KEY: 'noctis_users_v1' ,COUPONS_KEY: 'noctis_coupons_v1'}
    
    // ตัวแปรเก็บสถานะว่ากำลังแก้ไขสินค้า ID อะไรอยู่ (ถ้า null แปลว่าเพิ่มใหม่)
    let editingProductId = null;

    // --- DATA FETCHING ---
    const getProducts = () => { const stored = localStorage.getItem(CONFIG.PRODUCTS_KEY); return stored ? JSON.parse(stored) : []; };
    const getUsers = () => { return JSON.parse(localStorage.getItem(CONFIG.USER_KEY) || '[]'); };
    
    const getAllOrders = () => {
        const users = getUsers();
        let allOrders = [];
        users.forEach(user => { 
            if (user.orders && user.orders.length > 0) { 
                user.orders.forEach(order => { 
                    allOrders.push({ ...order, customerName: user.name, customerEmail: user.email }); 
                }); 
            } 
        });
        return allOrders.sort((a, b) => b.id - a.id);
    };

    // --- DASHBOARD LOGIC ---
    const renderDashboard = () => {
        const orders = getAllOrders();
        const users = getUsers();
        const totalRevenue = orders.reduce((sum, order) => order.status !== 'Cancelled' ? sum + order.total : sum, 0);
        const totalOrders = orders.length;
        const itemsSold = orders.reduce((sum, order) => order.status === 'Cancelled' ? sum : sum + order.items.reduce((isum, item) => isum + item.qty, 0), 0);
        const totalCustomers = users.length;

        if(document.getElementById('stat-revenue')) document.getElementById('stat-revenue').innerText = `฿${new Intl.NumberFormat().format(totalRevenue)}`;
        if(document.getElementById('stat-orders')) document.getElementById('stat-orders').innerText = new Intl.NumberFormat().format(totalOrders);
        if(document.getElementById('stat-items')) document.getElementById('stat-items').innerText = new Intl.NumberFormat().format(itemsSold);
        if(document.getElementById('stat-users')) document.getElementById('stat-users').innerText = new Intl.NumberFormat().format(totalCustomers);
    };

    // --- RENDER FUNCTIONS (Updated Table) ---
    const renderProducts = () => {
        const list = document.getElementById('admin-product-list'); if(!list) return; const products = getProducts();
        if (products.length === 0) { list.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#666;">No Products Found</td></tr>`; return; }
        
        list.innerHTML = products.map(p => `
            <tr>
                <td><img src="${p.image}" class="admin-img-thumb"></td>
                <td><div style="font-weight:bold; color:#fff;">${p.name}</div><div style="font-size:0.75rem; color:#666;">ID: ${p.id}</div></td>
                <td><span style="background:#222; padding:2px 8px; border-radius:4px; font-size:0.75rem;">${p.category}</span></td>
                <td style="color:var(--accent);">฿${p.price}</td>
                <td>
                    <button class="btn-edit" onclick="AdminApp.openEditModal(${p.id})">EDIT</button>
                    <button class="btn-delete" onclick="AdminApp.deleteProduct(${p.id})">DELETE</button>
                </td>
            </tr>`).join('');
    };

    const renderOrders = () => {
        const list = document.getElementById('admin-order-list'); if(!list) return; const orders = getAllOrders();
        if (orders.length === 0) { list.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#666;">No Orders Yet</td></tr>`; return; }
        list.innerHTML = orders.map(o => {
            const status = o.status || 'Pending'; let statusColor = status==='Shipped'?'#2ecc71':(status==='Cancelled'?'#ff3b3b':'#ffd700');
            return `<tr><td><span style="font-family:monospace; color:#888;">#${o.id}</span><br><span style="font-size:0.7rem; color:#555;">${o.date}</span></td><td><div style="font-weight:bold; color:#fff;">${o.customerName}</div><div style="font-size:0.75rem; color:#666;">${o.customerEmail}</div></td><td><div style="font-size:0.8rem; color:#ccc;">${o.items.map(i => `<div>- ${i.name} (x${i.qty})</div>`).join('')}</div></td><td style="color:var(--accent); font-weight:bold;">฿${new Intl.NumberFormat().format(o.total)}</td><td><span style="color:${statusColor}; font-weight:bold; border:1px solid ${statusColor}; padding:2px 6px; border-radius:4px; font-size:0.7rem;">${status.toUpperCase()}</span></td><td><select onchange="AdminApp.updateOrderStatus(${o.id}, '${o.customerEmail}', this.value)" style="background:#111; color:#fff; border:1px solid #444; padding:5px; border-radius:4px; font-size:0.8rem;"><option value="Pending" ${status === 'Pending' ? 'selected' : ''}>Pending</option><option value="Paid" ${status === 'Paid' ? 'selected' : ''}>Paid</option><option value="Shipped" ${status === 'Shipped' ? 'selected' : ''}>Shipped</option><option value="Cancelled" ${status === 'Cancelled' ? 'selected' : ''}>Cancelled</option></select></td></tr>`
        }).join('');
    };
    // --- COUPON SYSTEM (วางเพิ่มเข้าไป) ---
    const getCoupons = () => JSON.parse(localStorage.getItem(CONFIG.COUPONS_KEY) || '[]');
    
    const renderCoupons = () => {
        const list = document.getElementById('admin-coupon-list');
        if(!list) return;
        const coupons = getCoupons();
        
        if(coupons.length === 0) {
            list.innerHTML = `<tr><td colspan="5" style="text-align:center;">No Coupons Created</td></tr>`;
            return;
        }

        list.innerHTML = coupons.map((c, index) => `
            <tr>
                <td style="color:var(--accent); font-weight:bold;">${c.code}</td>
                <td>${c.type.toUpperCase()}</td>
                <td>${c.type === 'percent' ? (c.value * 100) + '%' : '฿' + c.value}</td>
                <td><span style="color:${c.active ? '#2ecc71':'#e74c3c'}">${c.active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                <td><button class="btn-delete" onclick="AdminApp.deleteCoupon(${index})">DELETE</button></td>
            </tr>
        `).join('');
    };

    const handleAddCoupon = (e) => {
        e.preventDefault();
        const code = document.getElementById('c-code').value.trim().toUpperCase();
        const type = document.getElementById('c-type').value;
        let value = Number(document.getElementById('c-value').value);
        
        if(type === 'percent' && value > 1) value = value / 100; // แปลง 10% เป็น 0.1
        
        const coupons = getCoupons();
        coupons.push({ code, type, value, active: true });
        localStorage.setItem(CONFIG.COUPONS_KEY, JSON.stringify(coupons));
        
        closeModal('add-coupon-modal');
        renderCoupons();
        e.target.reset();
    };

    const deleteCoupon = (index) => {
        if(!confirm("Delete this coupon?")) return;
        const coupons = getCoupons();
        coupons.splice(index, 1);
        localStorage.setItem(CONFIG.COUPONS_KEY, JSON.stringify(coupons));
        renderCoupons();
    };
    
    const openAddCouponModal = () => document.getElementById('add-coupon-modal').classList.add('active');

    // --- CONTROLLER ---
    const init = () => {
        console.log("Admin Panel Initialized");
        if(document.getElementById('section-dashboard')) renderDashboard(); 
        else renderProducts();
    };

    const switchTab = (tabName) => {
        // ... (โค้ดจัดการ class active เดิม) ...
        document.querySelectorAll('.admin-link').forEach(el => el.classList.remove('active')); 
        if(event && event.currentTarget) event.currentTarget.classList.add('active');

        // ซ่อนทุกหน้า
        const sections = ['section-dashboard', 'section-products', 'section-orders', 'section-coupons'];
        sections.forEach(id => { 
            const el = document.getElementById(id); 
            if(el) el.style.display = 'none'; 
        });
        document.getElementById('btn-add-product').style.display = 'none';
        const title = document.getElementById('page-title');

        // แสดงหน้าตามที่เลือก
        if(tabName === 'dashboard') {
            document.getElementById('section-dashboard').style.display = 'grid';
            title.innerText = 'DASHBOARD OVERVIEW';
            renderDashboard();
        } 
        else if(tabName === 'products') {
            document.getElementById('section-products').style.display = 'block';
            document.getElementById('btn-add-product').style.display = 'block';
            title.innerText = 'PRODUCT MANAGEMENT';
            renderProducts();
        } 
        else if(tabName === 'orders') {
            document.getElementById('section-orders').style.display = 'block';
            title.innerText = 'ORDER MANAGEMENT';
            renderOrders();
        }
        // [เพิ่มส่วนนี้]
        else if(tabName === 'coupons') {
            const couponSec = document.getElementById('section-coupons');
            if(couponSec) couponSec.style.display = 'block';
            // เปลี่ยน Title และเพิ่มปุ่ม New Code
            title.innerHTML = `COUPON MANAGEMENT <button class="btn-primary" onclick="AdminApp.openAddCouponModal()" style="font-size:0.8rem; margin-left:15px; padding:5px 15px;">+ NEW CODE</button>`;
            renderCoupons();
        }
    };

    // [NEW] ฟังก์ชันสำหรับบันทึก (ใช้ร่วมกันทั้ง Add และ Edit)
    const handleSaveProduct = (e) => {
        e.preventDefault();
        const name = document.getElementById('p-name').value;
        const cat = document.getElementById('p-cat').value;
        const price = Number(document.getElementById('p-price').value);
        const img = document.getElementById('p-img').value;
        let products = getProducts();

        if (editingProductId) {
            // โหมดแก้ไข: หาตัวเดิมแล้วอัปเดตข้อมูล
            const index = products.findIndex(p => p.id === editingProductId);
            if(index !== -1) {
                products[index] = { ...products[index], name, category: cat, price, image: img };
                alert("อัปเดตสินค้าเรียบร้อย!");
            }
        } else {
            // โหมดเพิ่มใหม่
            const newProduct = { id: Date.now(), name, category: cat, price, image: img, sale: false, sizes: ['S','M','L','XL'], colors: ['#000000'] };
            products.unshift(newProduct);
            alert("เพิ่มสินค้าใหม่เรียบร้อย!");
        }

        localStorage.setItem(CONFIG.PRODUCTS_KEY, JSON.stringify(products));
        renderProducts();
        closeModal();
    };

    // [NEW] เปิด Modal สำหรับแก้ไข
    const openEditModal = (id) => {
        const products = getProducts();
        const product = products.find(p => p.id === id);
        if(!product) return;

        editingProductId = id; // ตั้งค่า ID ที่กำลังแก้
        
        // ใส่ข้อมูลเดิมลงในช่อง
        document.getElementById('p-name').value = product.name;
        document.getElementById('p-cat').value = product.category;
        document.getElementById('p-price').value = product.price;
        document.getElementById('p-img').value = product.image;

        // เปลี่ยนหัวข้อ Modal ให้รู้ว่ากำลังแก้
        document.querySelector('#add-product-modal .variant-title').innerText = "EDIT PRODUCT";
        document.querySelector('#add-product-modal .btn-add-confirm').innerText = "UPDATE PRODUCT";

        document.getElementById('add-product-modal').classList.add('active');
    };

    // เปิด Modal สำหรับเพิ่มใหม่ (ต้องเคลียร์ค่าเก่าออก)
    const openAddModal = () => {
        editingProductId = null; // รีเซ็ต ID เป็น null
        document.getElementById('add-product-modal').classList.add('active');
        document.querySelector('#add-product-modal form').reset(); // ล้างฟอร์ม
        
        // คืนค่าหัวข้อ Modal เป็น Add
        document.querySelector('#add-product-modal .variant-title').innerText = "ADD NEW PRODUCT";
        document.querySelector('#add-product-modal .btn-add-confirm').innerText = "SAVE PRODUCT";
    };

    const deleteProduct = (id) => { if(!confirm("ยืนยันการลบสินค้านี้?")) return; let products = getProducts(); products = products.filter(p => p.id !== id); localStorage.setItem(CONFIG.PRODUCTS_KEY, JSON.stringify(products)); renderProducts(); };
    const updateOrderStatus = (orderId, customerEmail, newStatus) => { const users = getUsers(); const userIndex = users.findIndex(u => u.email === customerEmail); if (userIndex !== -1) { const orderIndex = users[userIndex].orders.findIndex(o => o.id === orderId); if (orderIndex !== -1) { users[userIndex].orders[orderIndex].status = newStatus; localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(users)); if(document.getElementById('section-orders').style.display === 'block') renderOrders(); if(document.getElementById('section-dashboard').style.display === 'grid') renderDashboard(); } } };
    const closeModal = () => document.getElementById('add-product-modal').classList.remove('active');

    return { init, handleSaveProduct, deleteProduct, openAddModal, openEditModal, closeModal, switchTab, updateOrderStatus,handleAddCoupon, deleteCoupon, openAddCouponModal, };
})();

if(document.querySelector('.admin-container')) { document.addEventListener('DOMContentLoaded', AdminApp.init); }