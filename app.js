/**
 * Noctis Wear - Core Application Logic
 * Updated: Variant System, Real Images & Checkout Summary
 */

const App = (() => {
    const CONFIG = {
        STORAGE_KEY: 'noctis_cart_premium_v3', // เปลี่ยน Key เพื่อรีเซ็ตตะกร้าให้รองรับระบบใหม่
        TOAST_DURATION: 3000
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
        tempProduct: null // เก็บค่าชั่วคราวขณะเลือกไซส์
    };

    const elements = {};

    const init = () => {
        cacheDOM();
        loadCart();
        if (elements.productGrid) {
            renderProducts(state.products);
            bindShopEvents();
        }
        bindGlobalEvents();
        updateCartCount();
        injectModal(); // สร้าง Modal รอไว้
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

    // --- สร้าง HTML Modal สำหรับเลือก Option ---
    // --- [UPDATED] Modal HTML Structure ---
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
                        <button class="qty-btn-large" onclick="App.adjustTempQty(-1)">
                            <svg width="14" height="2" viewBox="0 0 14 2" fill="none"><rect width="14" height="2" fill="currentColor"/></svg>
                        </button>
                        <span id="modal-qty">1</span>
                        <button class="qty-btn-large" onclick="App.adjustTempQty(1)">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M6 8H0V6H6V0H8V6H14V8H8V14H6V8Z" fill="currentColor"/></svg>
                        </button>
                    </div>
                </div>

                <button class="btn-checkout btn-add-confirm" onclick="App.confirmAddToCart()">ADD TO CART</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    };

    const renderProducts = (items) => {
        if (!elements.productGrid) return;
        elements.productGrid.innerHTML = items.map((item, index) => {
            const saleBadge = item.sale ? `<div class="badge-new" style="background:var(--danger); color:#fff;">SALE</div>` : '';
            const newBadge = item.new && !item.sale ? `<div class="badge-new">NEW</div>` : '';
            const priceHtml = item.oldPrice ? `<span class="old-price">฿${formatNumber(item.oldPrice)}</span>฿${formatNumber(item.price)}` : `฿${formatNumber(item.price)}`;
            
            // เปลี่ยนปุ่ม Add เป็น Open Modal
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
        const product = state.products.find(p => p.id === id);
        if (!product) return;

        // Reset Temp State
        state.tempProduct = {
            ...product,
            selectedSize: product.sizes[0],
            selectedColor: product.colors[0],
            selectedQty: 1
        };

        // Render Sizes
        const sizeContainer = document.getElementById('modal-sizes');
        sizeContainer.innerHTML = product.sizes.map(s => 
            `<button class="size-btn ${s === state.tempProduct.selectedSize ? 'active' : ''}" 
              onclick="App.selectSize(this, '${s}')">${s}</button>`
        ).join('');

        // Render Colors
        const colorContainer = document.getElementById('modal-colors');
        colorContainer.innerHTML = product.colors.map(c => 
            `<div class="color-btn ${c === state.tempProduct.selectedColor ? 'active' : ''}" 
              style="background:${c};" onclick="App.selectColor(this, '${c}')"></div>`
        ).join('');

        document.getElementById('modal-qty').innerText = "1";
        document.getElementById('variant-modal').classList.add('active');
    };

    const selectSize = (el, size) => {
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
        state.tempProduct.selectedSize = size;
    };

    const selectColor = (el, color) => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
        state.tempProduct.selectedColor = color;
    };

    const adjustTempQty = (change) => {
        let newQty = state.tempProduct.selectedQty + change;
        if (newQty < 1) newQty = 1;
        state.tempProduct.selectedQty = newQty;
        document.getElementById('modal-qty').innerText = newQty;
    };

    const confirmAddToCart = () => {
        const { id, name, price, image, selectedSize, selectedColor, selectedQty } = state.tempProduct;
        
        // เช็คว่ามีสินค้านี้ (ID + Size + Color เดียวกัน) ในตะกร้าหรือยัง
        const existing = state.cart.find(i => i.id === id && i.size === selectedSize && i.color === selectedColor);
        
        if (existing) {
            existing.qty += selectedQty;
        } else {
            state.cart.push({
                id, name, price, image,
                size: selectedSize,
                color: selectedColor,
                qty: selectedQty,
                checked: true // เลือกเป็นค่าเริ่มต้น
            });
        }
        
        saveCart();
        closeModal('variant-modal');
        showToast(`ADDED: ${name} (${selectedSize})`);
        toggleCart(true);
    };

    // --- Cart Logic Updates ---
    const renderCartSidebar = () => {
        if (!elements.cartItems) return;
        const total = state.cart.reduce((sum, item) => item.checked ? sum + (item.price * item.qty) : sum, 0);
        
        elements.cartItems.innerHTML = state.cart.map((item, index) => `
            <div class="cart-item" style="display:flex; gap:15px; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:15px; align-items:center;">
                
                <input type="checkbox" ${item.checked ? 'checked' : ''} 
                    onchange="App.toggleItemCheck(${index})" 
                    style="transform:scale(1.2); accent-color:var(--accent); cursor:pointer;">

                <img src="${item.image}" style="width:60px; height:70px; object-fit:cover; border-radius:4px;">
                
                <div style="flex:1;">
                    <div style="font-weight:700; font-size:0.9rem;">${item.name}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted); margin:4px 0;">
                        Size: <span style="color:#fff;">${item.size}</span> | 
                        Color: <span style="display:inline-block; width:10px; height:10px; background:${item.color}; border-radius:50%; border:1px solid #555;"></span>
                    </div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">Qty: ${item.qty}</div>
                </div>

                <div style="text-align:right;">
                    <div style="font-weight:600; color:var(--accent);">฿${formatNumber(item.price * item.qty)}</div>
                    <div style="color:var(--danger); font-size:0.7rem; cursor:pointer; text-decoration:underline; margin-top:5px;" 
                         onclick="App.removeFromCart(${index})">REMOVE</div>
                </div>
            </div>`).join('');

        if (elements.cartTotal) elements.cartTotal.querySelector('span:last-child').innerText = `฿${formatNumber(total)}`;
    };

    const toggleItemCheck = (index) => {
        state.cart[index].checked = !state.cart[index].checked;
        saveCart();
    };

    const bindShopEvents = () => {
        const handleFilter = () => {
            let result = [...state.products];
            // ... (Filter Logic คงเดิม) ...
            const checkedCats = Array.from(elements.filterCats).filter(cb => cb.checked).map(cb => cb.value);
            if (checkedCats.length) result = result.filter(p => checkedCats.includes(p.category));
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
        elements.filterCats.forEach(el => el.addEventListener('change', handleFilter));
        elements.filterPrices.forEach(el => el.addEventListener('change', handleFilter));
        elements.sortSelect.addEventListener('change', handleFilter);
    };

    const bindGlobalEvents = () => {}; // Event ย่อยถูก bind ใน HTML onclick แล้ว

    const removeFromCart = (index) => { state.cart.splice(index, 1); saveCart(); };

    const toggleCart = (show) => {
        if (elements.cartSidebar) elements.cartSidebar.style.right = show ? '0' : '-100%';
        if (show) renderCartSidebar();
    };

    const updateCartCount = () => {
        if (!elements.cartBadge) return;
        const count = state.cart.reduce((acc, item) => acc + item.qty, 0);
        elements.cartBadge.innerText = count;
        elements.cartBadge.style.display = count > 0 ? 'flex' : 'none';
    };

    const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num);

    const showToast = (msg) => {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), CONFIG.TOAST_DURATION);
    };

    // --- Checkout Logic Updated ---
    const openCheckout = () => {
        const checkedItems = state.cart.filter(i => i.checked);
        if (checkedItems.length === 0) return showToast("Select items to checkout!");
        
        toggleCart(false);
        const overlay = document.getElementById('checkout-overlay');
        const modal = overlay.querySelector('.checkout-modal');
        
        // สร้าง Summary HTML แทรกเข้าไปใน Modal
        let summaryHTML = `<div class="checkout-summary" style="background:rgba(255,255,255,0.05); padding:15px; border-radius:8px; margin-bottom:20px;">
            <h4 style="margin-bottom:10px; color:var(--accent);">ORDER SUMMARY</h4>`;
        
        let total = 0;
        checkedItems.forEach(item => {
            total += item.price * item.qty;
            summaryHTML += `
            <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.05);">
                <div style="display:flex; gap:10px;">
                    <img src="${item.image}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
                    <div>
                        <div style="color:#fff;">${item.name}</div>
                        <div style="color:#888;">${item.size} / ${item.qty} pcs</div>
                    </div>
                </div>
                <div style="font-weight:bold;">฿${formatNumber(item.price * item.qty)}</div>
            </div>`;
        });
        
        summaryHTML += `<div style="text-align:right; font-size:1.1rem; font-weight:bold; margin-top:10px;">TOTAL: <span style="color:var(--accent);">฿${formatNumber(total)}</span></div></div>`;

        // ลบ Summary เก่าถ้ามี แล้วใส่ใหม่
        const existingSummary = modal.querySelector('.checkout-summary');
        if(existingSummary) existingSummary.remove();
        
        modal.querySelector('.checkout-header').insertAdjacentHTML('afterend', summaryHTML);
        overlay.classList.add('active');
    };

    const closeModal = (id) => {
        document.getElementById(id).classList.remove('active');
    };
    
    // Alias for old checkout close
    const closeCheckout = () => closeModal('checkout-overlay');

    const processCheckout = (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.innerText = "PROCESSING...";
        btn.disabled = true;

        setTimeout(() => {
            // ลบเฉพาะสินค้าที่ Check
            state.cart = state.cart.filter(i => !i.checked);
            saveCart();
            closeCheckout();
            showToast("🎉 Order Placed Successfully!");
            btn.innerText = originalText;
            btn.disabled = false;
            e.target.reset();
        }, 1500);
    };

    return { 
        init, toggleCart, openCheckout, closeCheckout, processCheckout,
        openVariantModal, closeModal, selectSize, selectColor, adjustTempQty, confirmAddToCart,
        removeFromCart, toggleItemCheck
    };
})();

document.addEventListener('DOMContentLoaded', App.init);