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
                id: 1, name: "Lumix Heavy Tee", category: "T-Shirt", price: 590, oldPrice: 890, sale: true, stock: 3, // เหลือ 3 ชิ้น (Low Stock)
                image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=600",
                images: ["https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=600"],
                reviews: [], sizes: ['S','M','L','XL'], colors: ['#000000','#FFFFFF'] 
            },
            { 
                id: 2, name: "Vortex Oversize", category: "T-Shirt", price: 450, oldPrice: null, sale: false, stock: 0, // หมด (Sold Out)
                image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=600", 
                sizes: ['M','L','XL'], colors: ['#1a1a1a','#333333'] 
            },
            // ... สินค้าอื่นๆ ให้สมมติ stock: 100 ไว้ก่อนก็ได้ครับ
            { id: 3, name: "Nova Silk Shirt", category: "Shirt", price: 1290, oldPrice: 1590, sale: true, stock: 15, image: "https://images.unsplash.com/photo-1626497764746-6dc36546b388?auto=format&fit=crop&q=80&w=600", sizes: ['S','M','L'], colors: ['#000000','#550000'] },
            { id: 4, name: "Eclipse Hoodie", category: "Hoodie", price: 1500, oldPrice: null, sale: false, stock: 8, image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600", sizes: ['M','L','XL'], colors: ['#000000'] },
            { id: 5, name: "Orion Smart Shirt", category: "Shirt", price: 990, oldPrice: null, sale: false, stock: 2, image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=600", sizes: ['S','M','L','XL'], colors: ['#FFFFFF','#DDDDDD'] },
            { id: 6, name: "Comet Graphic Tee", category: "T-Shirt", price: 390, oldPrice: 590, sale: true, stock: 50, image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&q=80&w=600", sizes: ['S','M','L'], colors: ['#000000','#FFD700'] },
            { id: 7, name: "Nebula Jacket", category: "Hoodie", price: 2100, oldPrice: 2500, sale: true, stock: 4, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600", sizes: ['L','XL'], colors: ['#000000','#222222'] },
            { id: 8, name: "Galaxy Zip Hoodie", category: "Hoodie", price: 1890, oldPrice: null, sale: false, stock: 12, image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=600", sizes: ['M','L','XL'], colors: ['#000000'] }
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
        initSlider();
        renderHomeProducts();
        
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
            // Logic ป้ายสถานะ (เหมือนเดิม)
            const stock = item.stock !== undefined ? item.stock : 10;
            let badgeHTML = '';
            let cardClass = '';

            if (stock === 0) {
                badgeHTML = `<div class="badge-stock badge-sold">SOLD OUT</div>`;
                cardClass = 'sold-out';
            } else if (stock < 5) {
                badgeHTML = `<div class="badge-stock badge-low">LOW STOCK: ${stock}</div>`;
            } else if (item.sale) {
                badgeHTML = `<div class="badge-stock badge-sale">SALE -${Math.floor(((item.oldPrice - item.price)/item.oldPrice)*100)}%</div>`;
            } else if (item.new) {
                badgeHTML = `<div class="badge-stock badge-new">NEW DROP</div>`;
            }

            const colorsHTML = item.colors ? item.colors.map(c => `<div class="color-dot" style="background:${c};"></div>`).join('') : '';
            const priceHtml = item.oldPrice ? `<span class="old-price">฿${formatNumber(item.oldPrice)}</span>฿${formatNumber(item.price)}` : `฿${formatNumber(item.price)}`;
            const isWishlisted = state.wishlist.includes(item.id) ? 'active' : '';
            const imgUrl = item.image || (item.images && item.images[0]);

            // [UPDATED] ส่วน Card Overlay เปลี่ยนเป็น 2 ปุ่ม
            return `
            <div class="product-card reveal-on-scroll ${cardClass}" style="transition-delay: ${index * 50}ms">
                <div class="product-img-wrapper">
                    ${badgeHTML}
                    <button class="btn-wishlist ${isWishlisted}" onclick="App.toggleWishlist(event, ${item.id})">
                        <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </button>
                    <img src="${imgUrl}" class="product-img" loading="lazy" alt="${item.name}">
                    
                    ${stock > 0 ? `
                    <div class="card-overlay">
                        <div class="card-actions">
                            <button class="btn-view" onclick="App.openVariantModal(${item.id})">VIEW DETAILS</button>
                            <button class="btn-quick" onclick="App.quickAdd(event, ${item.id})">＋</button>
                        </div>
                    </div>` : ''}
                </div>
                
                <div class="product-info">
                    <div class="product-category">${item.category}</div>
                    <div class="product-title">${item.name}</div>
                    <div class="product-price">${priceHtml}</div>
                    ${colorsHTML ? `<div class="card-colors">${colorsHTML}</div>` : ''}
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
    // [NEW] Quick Add System
    const quickAdd = (e, id) => {
        e.stopPropagation(); // กันไม่ให้ไปกดโดน Card แล้วเปิด Modal ซ้อน
        
        const product = state.products.find(p => p.id === id);
        if (!product) return;

        // เช็คสต็อกก่อน
        if (product.stock === 0) return showToast("❌ สินค้าหมด / Out of Stock");

        // เลือก Option แรกสุดเป็นค่า Default (เช่น ไซส์ S, สีดำ)
        const defaultSize = product.sizes ? product.sizes[0] : 'F';
        const defaultColor = product.colors ? product.colors[0] : '#000';

        // Logic เดียวกับ confirmAddToCart
        const exist = state.cart.find(i => i.id === id && i.size === defaultSize && i.color === defaultColor);
        if (exist) {
            exist.qty++;
        } else {
            state.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                size: defaultSize,
                color: defaultColor,
                qty: 1,
                checked: true
            });
        }

        saveCart();
        showToast(`⚡ FAST ADD: ${product.name} (${defaultSize})`);
        toggleCart(true); // เปิดตะกร้าโชว์เลย
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

     // [NEW] Hero Slider Logic
    let currentSlide = 0;
    let sliderInterval;

    const initSlider = () => {
        const slides = document.querySelectorAll('.hero-slide');
        const dotsContainer = document.getElementById('slider-dots');
        if(!slides.length || !dotsContainer) return;

        // สร้างจุด (Dots) ตามจำนวนภาพ
        dotsContainer.innerHTML = Array.from(slides).map((_, i) => 
            `<div class="slider-dot ${i===0?'active':''}" onclick="App.goToSlide(${i})"></div>`
        ).join('');

        // เริ่มจับเวลาเลื่อนอัตโนมัติ (ทุก 5 วินาที)
        startSlider();
    };

    const showSlide = (index) => {
        const slides = document.querySelectorAll('.hero-slide');
        const dots = document.querySelectorAll('.slider-dot');
        if(!slides.length) return;

        if (index >= slides.length) currentSlide = 0;
        else if (index < 0) currentSlide = slides.length - 1;
        else currentSlide = index;

        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));

        slides[currentSlide].classList.add('active');
        if(dots[currentSlide]) dots[currentSlide].classList.add('active');
    };

    const nextSlide = () => { showSlide(currentSlide + 1); resetSliderTimer(); };
    const prevSlide = () => { showSlide(currentSlide - 1); resetSliderTimer(); };
    const goToSlide = (i) => { showSlide(i); resetSliderTimer(); };

    const startSlider = () => {
        if(sliderInterval) clearInterval(sliderInterval);
        sliderInterval = setInterval(() => { showSlide(currentSlide + 1); }, 5000);
    };

    const resetSliderTimer = () => { startSlider(); };

    // [Bonus] ฟังก์ชัน Copy Code คูปอง
    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        showToast(`📋 COPIED: ${code}`);
    };

    // [NEW] Render Home Products
    const renderHomeProducts = () => {
        const container = document.getElementById('home-trending-grid');
        if(!container) return;

        // ดึงสินค้า 4 ชิ้นแรกมาโชว์
        const featured = state.products.slice(0, 4);
        
        container.innerHTML = featured.map((item, index) => {
            const priceHtml = item.oldPrice ? `<span class="old-price">฿${formatNumber(item.oldPrice)}</span>฿${formatNumber(item.price)}` : `฿${formatNumber(item.price)}`;
            return `
            <div class="product-card reveal-on-scroll" style="transition-delay: ${index * 100}ms">
                <div class="product-img-wrapper">
                    ${item.sale ? `<div class="badge-stock badge-sale">HOT</div>` : ''}
                    <img src="${item.image}" class="product-img">
                    <div class="card-overlay">
                        <div class="card-actions">
                            <button class="btn-view" onclick="window.location.href='shop.html'">SHOP NOW</button>
                        </div>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-title">${item.name}</div>
                    <div class="product-price">${priceHtml}</div>
                </div>
            </div>`;
        }).join('');
        
        initScrollAnimations();
    };

    // EXPORTS (แก้ให้เป็นตัวพิมพ์ใหญ่ตามนี้ครับ)
    return { 
        init, toggleCart, openCheckout, closeCheckout, processCheckout,
        openVariantModal, closeModal, selectSize, selectColor, adjustTempQty, confirmAddToCart,
        removeFromCart, toggleItemCheck, toggleMenu, injectAuthModal,
        toggleAuthModal, handleLogin, handleRegister, switchAuthMode,
        handleLogout, showOrderHistory, handleResetPassword, toggleWishlist, applyCoupon, removeCoupon,
        selectImage, submitReview, loadProducts, switchPaymentMethod, confirmPayment, 
        
        quickAdd, 
        initSlider,  // แก้จาก initslider เป็น initSlider (S ตัวใหญ่)
        nextSlide,   // แก้จาก nextslide เป็น nextSlide (S ตัวใหญ่)
        prevSlide,   // แก้จาก prevslide เป็น prevSlide (S ตัวใหญ่)
        goToSlide, 
        copyCode 
    };
})();

/* =========================================
   SYSTEM: ADMIN LOGIC (V20: Dashboard Completed)
   ========================================= */
const AdminApp = (() => {
    const CONFIG = { PRODUCTS_KEY: 'noctis_products_custom_v1', USER_KEY: 'noctis_users_v1', COUPONS_KEY: 'noctis_coupons_v1' };
    let editingProductId = null;

    const getData = (key) => JSON.parse(localStorage.getItem(key) || '[]');
    const saveData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    // 1. DASHBOARD LOGIC (สมบูรณ์แบบ)
    const renderDashboard = () => {
        const orders = []; 
        const products = getData(CONFIG.PRODUCTS_KEY);
        getData(CONFIG.USER_KEY).forEach(u => u.orders?.forEach(o => orders.push({...o, customer: u.name})));
        
        // --- A. สรุปตัวเลข 4 กล่องบน ---
        if(document.getElementById('stat-revenue')) document.getElementById('stat-revenue').innerText = `฿${new Intl.NumberFormat().format(orders.reduce((s,o)=>o.status!=='Cancelled'?s+o.total:s,0))}`;
        if(document.getElementById('stat-orders')) document.getElementById('stat-orders').innerText = orders.length;
        if(document.getElementById('stat-items')) document.getElementById('stat-items').innerText = orders.reduce((s,o)=>o.status!=='Cancelled'?s+o.items.length:s,0);
        if(document.getElementById('stat-users')) document.getElementById('stat-users').innerText = getData(CONFIG.USER_KEY).length;

        // --- B. ตารางออเดอร์ล่าสุด (Recent Orders) ---
        const recentTable = document.getElementById('dash-recent-orders');
        if(recentTable) {
            const recentOrders = orders.sort((a,b) => b.id - a.id).slice(0, 5); // ดึงมาแค่ 5 อันล่าสุด
            
            if(recentOrders.length === 0) {
                recentTable.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#666; padding:20px;">No Orders Yet</td></tr>`;
            } else {
                recentTable.innerHTML = recentOrders.map(o => `
                    <tr>
                        <td><span style="color:var(--accent); font-family:monospace;">#${o.id.toString().slice(-6)}</span></td>
                        <td>${o.customer}</td>
                        <td>฿${new Intl.NumberFormat().format(o.total)}</td>
                        <td><span style="font-size:0.7rem; padding:2px 6px; border-radius:4px; border:1px solid ${o.status==='Paid'?'#2ecc71':(o.status==='Shipped'?'#3498db':'#666')}; color:${o.status==='Paid'?'#2ecc71':(o.status==='Shipped'?'#3498db':'#aaa')};">${o.status}</span></td>
                    </tr>
                `).join('');
            }
        }

        // --- C. สินค้าขายดี (Top Selling Products) ---
        const topList = document.getElementById('dash-top-products');
        if(topList) {
            // 1. นับจำนวนขายของแต่ละสินค้า
            const salesCount = {};
            orders.forEach(o => {
                if(o.status !== 'Cancelled') {
                    o.items.forEach(item => {
                        salesCount[item.name] = (salesCount[item.name] || 0) + item.qty;
                    });
                }
            });

            // 2. เรียงลำดับจากมากไปน้อย
            const sortedProducts = Object.entries(salesCount)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5); // เอาแค่ 5 อันดับแรก

            if(sortedProducts.length === 0) {
                topList.innerHTML = `<div style="text-align:center; color:#666; padding:20px;">No Sales Data</div>`;
            } else {
                // หาค่ามากสุดเพื่อทำหลอด Progress Bar
                const maxSales = sortedProducts[0][1];

                topList.innerHTML = sortedProducts.map(([name, qty]) => {
                    const productInfo = products.find(p => p.name === name);
                    const imgUrl = productInfo ? productInfo.image : 'https://via.placeholder.com/40';
                    const percent = (qty / maxSales) * 100;

                    return `
                    <div class="top-item">
                        <img src="${imgUrl}" class="top-img">
                        <div class="top-info">
                            <div style="display:flex; justify-content:space-between;">
                                <span class="top-name">${name}</span>
                                <span class="top-sales">${qty} sold</span>
                            </div>
                            <div class="top-bar-bg">
                                <div class="top-bar-fill" style="width: ${percent}%"></div>
                            </div>
                        </div>
                    </div>`;
                }).join('');
            }
        }
    };

    // 2. PRODUCTS
    const renderProducts = () => {
        const list = document.getElementById('admin-product-list'); if(!list) return;
        const products = getData(CONFIG.PRODUCTS_KEY);
        list.innerHTML = products.map(p => {
            const stock = p.stock !== undefined ? p.stock : 0;
            const stockColor = stock === 0 ? '#ff3b3b' : (stock < 5 ? '#e67e22' : '#2ecc71');
            
            return `
            <tr>
                <td><img src="${p.image}" class="admin-img-thumb"></td>
                <td><div style="font-weight:bold; color:#fff;">${p.name}</div></td>
                <td><span style="background:#222; padding:2px 8px; border-radius:4px; font-size:0.75rem;">${p.category}</span></td>
                <td style="color:var(--accent);">฿${p.price}</td>
                <td style="color:${stockColor}; font-weight:bold;">${stock}</td>
                <td>
                    <button class="btn-edit" onclick="AdminApp.openEditModal(${p.id})">EDIT</button>
                    <button class="btn-delete" onclick="AdminApp.deleteProduct(${p.id})">DEL</button>
                </td>
            </tr>`;
        }).join('');
    };

   const handleSaveProduct = (e) => {
        e.preventDefault();
        const name = document.getElementById('p-name').value;
        const cat = document.getElementById('p-cat').value;
        const price = Number(document.getElementById('p-price').value);
        const stock = Number(document.getElementById('p-stock').value); // [NEW] รับค่า Stock
        const img = document.getElementById('p-img').value;
        
        let products = getData(CONFIG.PRODUCTS_KEY);
        
        if(editingProductId){ 
            const idx = products.findIndex(p => p.id === editingProductId); 
            if(idx !== -1) {
                // อัปเดตข้อมูลเดิม + stock
                products[idx] = {...products[idx], name, category:cat, price, stock, image:img}; 
            }
        } else { 
            // เพิ่มสินค้าใหม่ + stock
            products.unshift({
                id: Date.now(), 
                name, 
                category: cat, 
                price, 
                stock, // บันทึก stock
                image: img, 
                sale: false, 
                sizes: ['S','M','L'], 
                colors: ['#000000']
            }); 
        }
        
        saveData(CONFIG.PRODUCTS_KEY, products); 
        renderProducts(); 
        closeModal('add-product-modal');
    };

    const deleteProduct = (id) => { if(!confirm("Delete?")) return; saveData(CONFIG.PRODUCTS_KEY, getData(CONFIG.PRODUCTS_KEY).filter(p=>p.id!==id)); renderProducts(); };
    
    // 3. ORDERS
    const renderOrders = () => {
        const list = document.getElementById('admin-order-list'); if(!list) return;
        const orders = []; getData(CONFIG.USER_KEY).forEach(u => u.orders?.forEach(o => orders.push({...o, email: u.email})));
        list.innerHTML = orders.sort((a,b)=>b.id-a.id).map(o => `<tr><td>#${o.id}</td><td>${o.email}</td><td>${o.items.length} Items</td><td>฿${o.total}</td><td>${o.status}</td><td><select onchange="AdminApp.updateOrderStatus(${o.id}, '${o.email}', this.value)" style="background:#111; color:#fff; border:1px solid #444; padding:2px;"><option value="Pending" ${o.status==='Pending'?'selected':''}>Pending</option><option value="Paid" ${o.status==='Paid'?'selected':''}>Paid</option><option value="Shipped" ${o.status==='Shipped'?'selected':''}>Shipped</option><option value="Cancelled" ${o.status==='Cancelled'?'selected':''}>Cancelled</option></select></td></tr>`).join('');
    };

    const updateOrderStatus = (orderId, email, newStatus) => {
        const users = getData(CONFIG.USER_KEY); const uIdx = users.findIndex(u => u.email === email);
        if(uIdx !== -1) { const oIdx = users[uIdx].orders.findIndex(o => o.id === orderId); if(oIdx !== -1) { users[uIdx].orders[oIdx].status = newStatus; saveData(CONFIG.USER_KEY, users); renderOrders(); renderDashboard(); } }
    };

    // 4. COUPONS
    const renderCoupons = () => {
        const list = document.getElementById('admin-coupon-list'); if(!list) return;
        const coupons = getData(CONFIG.COUPONS_KEY);
        list.innerHTML = coupons.map((c, i) => `<tr><td>${c.code}</td><td>${c.type}</td><td>${c.value}</td><td>${c.active?'ACTIVE':'INACTIVE'}</td><td><button class="btn-delete" onclick="AdminApp.deleteCoupon(${i})">DEL</button></td></tr>`).join('');
    };

    const handleAddCoupon = (e) => {
        e.preventDefault();
        const code = document.getElementById('c-code').value.toUpperCase(), type = document.getElementById('c-type').value;
        let val = Number(document.getElementById('c-value').value); if(type==='percent' && val > 1) val = val/100;
        const coupons = getData(CONFIG.COUPONS_KEY); coupons.push({code, type, value:val, active:true}); saveData(CONFIG.COUPONS_KEY, coupons);
        closeModal('add-coupon-modal'); renderCoupons(); e.target.reset();
    };

    const deleteCoupon = (i) => { if(confirm("Delete?")) { const c=getData(CONFIG.COUPONS_KEY); c.splice(i,1); saveData(CONFIG.COUPONS_KEY, c); renderCoupons(); }};

    // 5. CUSTOMERS
    const renderCustomers = () => {
        const list = document.getElementById('admin-customer-list'); if(!list) return;
        const users = getData(CONFIG.USER_KEY);
        if(users.length === 0) { list.innerHTML = `<tr><td colspan="5" style="text-align:center;">No Customers Yet</td></tr>`; return; }
        list.innerHTML = users.map((u, i) => {
            const totalSpent = u.orders ? u.orders.reduce((acc, o) => o.status !== 'Cancelled' ? acc + o.total : acc, 0) : 0;
            return `<tr><td><div style="font-weight:bold; color:#fff;">${u.name}</div></td><td>${u.email}</td><td>${u.orders?u.orders.length:0} Orders</td><td style="color:var(--accent);">฿${new Intl.NumberFormat().format(totalSpent)}</td><td><button class="btn-edit" onclick="AdminApp.viewCustomer('${u.email}')">VIEW</button><button class="btn-delete" onclick="AdminApp.deleteUser(${i})">BLOCK</button></td></tr>`;
        }).join('');
    };
    const viewCustomer = (email) => {
        const user = getData(CONFIG.USER_KEY).find(u => u.email === email); if(!user) return;
        document.querySelector('#customer-info').innerHTML = `<div style="font-size:1.1rem; font-weight:bold; color:#fff;">${user.name}</div><div style="color:#888; font-size:0.9rem;">${user.email}</div>`;
        const list = document.getElementById('customer-order-list');
        list.innerHTML = (user.orders || []).length === 0 ? `<tr><td colspan="5" style="text-align:center;">No History</td></tr>` : 
        user.orders.slice().reverse().map(o => `<tr><td>#${o.id}</td><td>${o.date}</td><td>${o.items.length} items</td><td style="color:var(--accent);">฿${new Intl.NumberFormat().format(o.total)}</td><td><span style="font-size:0.8rem; padding:2px 6px; border-radius:4px; border:1px solid ${o.status==='Paid'?'#2ecc71':'#e74c3c'}; color:${o.status==='Paid'?'#2ecc71':'#e74c3c'};">${o.status}</span></td></tr>`).join('');
        document.getElementById('customer-modal').classList.add('active');
    };
    const deleteUser = (i) => { if(confirm("Block user?")) { const u=getData(CONFIG.USER_KEY); u.splice(i,1); saveData(CONFIG.USER_KEY, u); renderCustomers(); renderDashboard(); }};

    // CONTROLLER
    const switchTab = (tab) => {
        document.querySelectorAll('.admin-link').forEach(el => el.classList.remove('active')); if(event) event.currentTarget.classList.add('active');
        ['section-dashboard','section-products','section-orders','section-coupons','section-customers'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display='none'; });
        
        const btnAction = document.getElementById('btn-add-product');
        const title = document.getElementById('page-title');
        btnAction.style.display = 'none'; btnAction.onclick = null;

        if(tab === 'dashboard') { document.getElementById('section-dashboard').style.display='grid'; title.innerText='DASHBOARD OVERVIEW'; renderDashboard(); }
        else if(tab === 'products') { document.getElementById('section-products').style.display='block'; btnAction.style.display='block'; btnAction.innerText = '+ ADD PRODUCT'; btnAction.onclick = () => AdminApp.openAddModal(); title.innerText='PRODUCT MANAGEMENT'; renderProducts(); }
        else if(tab === 'orders') { document.getElementById('section-orders').style.display='block'; title.innerText='ORDER MANAGEMENT'; renderOrders(); }
        else if(tab === 'coupons') { document.getElementById('section-coupons').style.display='block'; btnAction.style.display='block'; btnAction.innerText = '+ NEW CODE'; btnAction.onclick = () => AdminApp.openAddCouponModal(); title.innerText='COUPON MANAGEMENT'; renderCoupons(); }
        else if(tab === 'customers') { document.getElementById('section-customers').style.display='block'; title.innerText='CUSTOMER LIST'; renderCustomers(); }
    };

  const openEditModal = (id) => { 
        const p = getData(CONFIG.PRODUCTS_KEY).find(x => x.id === id); 
        if(!p) return; 
        
        editingProductId = id; 
        document.getElementById('p-name').value = p.name; 
        document.getElementById('p-cat').value = p.category; 
        document.getElementById('p-price').value = p.price; 
        document.getElementById('p-stock').value = p.stock !== undefined ? p.stock : 10; // [NEW] ใส่ค่า stock
        document.getElementById('p-img').value = p.image; 
        
        document.getElementById('add-product-modal').classList.add('active'); 
        document.querySelector('#add-product-modal .variant-title').innerText = "EDIT PRODUCT"; 
        document.querySelector('#add-product-modal .btn-add-confirm').innerText = "UPDATE PRODUCT";
    };
    const openAddModal = () => { editingProductId=null; document.querySelector('#add-product-modal form').reset(); document.getElementById('add-product-modal').classList.add('active'); document.querySelector('#add-product-modal .variant-title').innerText="ADD NEW PRODUCT"; document.querySelector('#add-product-modal .btn-add-confirm').innerText="SAVE PRODUCT";};
    const openAddCouponModal = () => document.getElementById('add-coupon-modal').classList.add('active');
    const closeModal = (id) => document.getElementById(id ? id : 'add-product-modal').classList.remove('active');

    const init = () => { if(document.querySelector('.admin-container')) renderDashboard(); };


    return { init, handleSaveProduct, deleteProduct, openAddModal, openEditModal, closeModal, switchTab, updateOrderStatus, handleAddCoupon, deleteCoupon, openAddCouponModal, deleteUser, viewCustomer };
})();

// [FIXED] Initialize App correctly based on page
document.addEventListener('DOMContentLoaded', () => {
    if(document.querySelector('.admin-container')) {
        // ถ้าเจอคลาส admin-container ให้รันระบบหลังบ้าน
        if(typeof AdminApp !== 'undefined') AdminApp.init();
    } else {
        // ถ้าไม่เจอ (แสดงว่าเป็นหน้า Shop) ให้รันระบบหน้าร้าน
        if(typeof App !== 'undefined') App.init();
    }
});