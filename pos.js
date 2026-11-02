/* ====================================================
   Nexus POS & E-Commerce - Unified Core Engine
   Developed & Architected by: محمد © 2026
   ================================================    */

let users = JSON.parse(localStorage.getItem('users')) || [
    { username: 'محمد', password: 'mm-123', role: 'admin', avatar: '' }
];

// مصفوفة المنتجات الأساسية الافتراضية لضمان ظهور المنتجات فوراً لأي عميل عالمياً
let defaultInventory = [
    { id: 1, name: 'قلم حبر جاف', price: 15, currency: 'YER', stock: 50, desc: 'قلم كتابة سلس للاستخدام اليومي.', image: 'https://via.placeholder.com/150' },
    { id: 2, name: 'دفتر مذكرات', price: 50, currency: 'YER', stock: 30, desc: 'دفتر ملاحظات بغلاف أنيق ومتين.', image: 'https://via.placeholder.com/150' }
];

let inventory = JSON.parse(localStorage.getItem('pos_inventory'));
if (!inventory || inventory.length === 0) {
    inventory = defaultInventory;
    localStorage.setItem('pos_inventory', JSON.stringify(inventory));
}

let cart = JSON.parse(localStorage.getItem('store_cart')) || [];
let storeOrders = JSON.parse(localStorage.getItem('store_orders')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
    }

    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'index.html' || currentPage === '') {
        // إذا كان الرابط الرئيسي للمتجر (يعرض الواجهة والمنتجات للعملاء مباشرة)
        renderStoreProducts();
        renderStoreCart();
        
        // إذا كان هناك مدير مسجل دخول ويريد الوصول للوحة التحكم عبر مسار آخر يمكن التوجيه، 
        // أما الآن فالواجهة مخصصة للعملاء للتسوق عالمياً.
    } else if (currentPage === 'store.html') {
        renderStoreProducts();
        renderStoreCart();
    } else if (currentPage === 'login.html') {
        // صفحة تسجيل الدخول للموظفين
    }

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const u = document.getElementById('loginUser').value.trim();
            const p = document.getElementById('loginPass').value.trim();
            const foundUser = users.find(user => user.username === u && user.password === p);
            if (foundUser) {
                localStorage.setItem('currentUser', JSON.stringify(foundUser));
                window.location.href = 'index.html';
            } else {
                alert('❌ اسم المستخدم أو كلمة المرور غير صحيحة!');
            }
        });
    }
});

function toggleDarkMode() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

function logoutSystem() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// --- إدارة المنتجات (إضافة منتج جديد يظهر فوق المنتجات السابقة تلقائياً) ---
function addNewProduct() {
    const name = document.getElementById('newProdName').value.trim();
    const price = parseFloat(document.getElementById('newProdPrice').value);
    const currency = document.getElementById('newProdCurrency').value;
    const stock = parseInt(document.getElementById('newProdStock').value);
    const desc = document.getElementById('newProdDesc') ? document.getElementById('newProdDesc').value.trim() : '';
    const imageInput = document.getElementById('newProdImage');

    if (!name || isNaN(price) || isNaN(stock)) { alert('الرجاء إدخال بيانات المنتج الأساسية!'); return; }

    let imageSrc = 'https://via.placeholder.com/150';
    if (imageInput && imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            saveProductData(name, price, currency, stock, desc, e.target.result);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        saveProductData(name, price, currency, stock, desc, imageSrc);
    }
}

function saveProductData(name, price, currency, stock, desc, image) {
    const newId = inventory.length > 0 ? inventory[inventory.length - 1].id + 1 : 1;
    // إضافة المنتج الجديد في بداية المصفوفة لظهر فوق المنتجات السابقة تلقائياً
    inventory.unshift({ id: newId, name, price, currency, stock, desc, image });
    localStorage.setItem('pos_inventory', JSON.stringify(inventory));
    renderStoreProducts();
    alert('✅ تم إضافة المنتج ونشره في المتجر بنجاح.');
}

// --- واجهة المتجر الإلكتروني للزبائن ---
function renderStoreProducts() {
    const grid = document.getElementById('storeProductsGrid');
    if (!grid) return;
    grid.innerHTML = "";
    inventory.forEach(product => {
        const card = document.createElement('div');
        card.className = `product-card ${product.stock === 0 ? 'out-of-stock' : ''}`;
        card.innerHTML = `
            <div style="width:100%; height:120px; overflow:hidden; border-radius:6px; margin-bottom:8px; background:#111;">
                <img src="${product.image || 'https://via.placeholder.com/150'}" alt="${product.name}" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <h4 style="font-size: 13px; margin-bottom: 4px;">${product.name}</h4>
            <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 6px;">${product.desc || ''}</p>
            <p class="price" style="color:var(--primary-gold); font-weight:bold; font-size:13px; margin-bottom:6px;">${product.price} ${product.currency}</p>
            <p style="font-size: 11px; color:${product.stock > 0 ? 'var(--text-muted)' : '#ef4444'}; margin-bottom:8px;">المتوفر: <b>${product.stock}</b></p>
            <button onclick="addToStoreCart(${product.id})" style="width:100%; padding:6px; background:${product.stock > 0 ? 'var(--primary-gold)' : '#444'}; color:#000; border:none; border-radius:4px; font-weight:bold; cursor:${product.stock > 0 ? 'pointer' : 'not-allowed'};" ${product.stock === 0 ? 'disabled' : ''}>
                ${product.stock > 0 ? 'إضافة للسلة 🛒' : 'نفذت الكمية ❌'}
            </button>
        `;
        grid.appendChild(card);
    });
}

function addToStoreCart(productId) {
    const product = inventory.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        if (cartItem.qty < product.stock) cartItem.qty += 1;
        else { alert('الحد الأقصى للمخزون!'); return; }
    } else {
        cart.push({ id: product.id, name: product.name, price: product.price, currency: product.currency, qty: 1 });
    }
    localStorage.setItem('store_cart', JSON.stringify(cart));
    renderStoreCart();
}

function renderStoreCart() {
    const container = document.getElementById('storeCartItems');
    if (!container) return;
    container.innerHTML = "";
    let subTotal = 0;
    if (cart.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center; margin-top: 25px;">السلة فارغة</p>`;
        updateCartTotals(0);
        return;
    }
    cart.forEach((item, index) => {
        let itemTotal = item.price * item.qty;
        subTotal += itemTotal;
        container.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:12px; border-bottom:1px solid var(--border-color); padding-bottom:4px;">
                <span><b>${item.name}</b> (${item.qty}) - ${itemTotal} ${item.currency}</span>
                <button onclick="removeFromStoreCart(${index})" style="background:#ef4444; color:white; border:none; padding:2px 5px; border-radius:3px; cursor:pointer;">✕</button>
            </div>
        `;
    });
    updateCartTotals(subTotal);
}

function removeFromStoreCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('store_cart', JSON.stringify(cart));
    renderStoreCart();
}

function updateCartTotals(subTotal) {
    let tax = subTotal * 0.15;
    let grandTotal = subTotal + tax;
    const subElem = document.getElementById('cartSubTotal');
    const taxElem = document.getElementById('cartTax');
    const grandElem = document.getElementById('cartGrandTotal');
    if (subElem) subElem.textContent = subTotal.toFixed(2);
    if (taxElem) taxElem.textContent = tax.toFixed(2);
    if (grandElem) grandElem.textContent = grandTotal.toFixed(2);
}

// --- إرسال الطلب عبر الواتساب للرقم المطلوب 967780445044 ---
function submitOnlineOrder() {
    const nameInput = document.getElementById('clientName');
    const phoneInput = document.getElementById('clientPhone');
    const addressInput = document.getElementById('clientAddress');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const address = addressInput ? addressInput.value.trim() : 'لم يُذكر';

    if (!name || !phone || cart.length === 0) { 
        alert('❌ يرجى إدخال الاسم، رقم الهاتف، والتأكد من وجود منتجات في السلة!'); 
        return; 
    }

    let subTotal = 0;
    cart.forEach(item => { subTotal += (item.price * item.qty); });
    let tax = subTotal * 0.15;
    let grandTotal = subTotal + tax;

    const newOrder = {
        id: Math.floor(1000 + Math.random() * 9000),
        clientName: name,
        clientPhone: phone,
        clientAddress: address,
        items: [...cart],
        total: grandTotal,
        timestamp: new Date().toLocaleString()
    };

    storeOrders.push(newOrder);
    localStorage.setItem('store_orders', JSON.stringify(storeOrders));

    let orderText = `🛒 *طلب شراء جديد*%0A`;
    orderText += `👤 *الاسم:* ${name}%0A`;
    orderText += `📞 *الهاتف:* ${phone}%0A`;
    orderText += `📍 *العنوان:* ${address}%0A%0A`;
    orderText += `🛍️ *المنتجات المطلوبة:*%0A`;
    
    cart.forEach(item => {
        orderText += `- ${item.name} (الكمية: ${item.qty}) = ${item.price * item.qty} ${item.currency}%0A`;
    });
    
    orderText += `%0A💰 *الإجمالي النهائي (شامل الضريبة):* ${grandTotal.toFixed(2)} YER`;

    // توجيه الطلب إلى رقم الواتساب المطلوب بدقة
    const adminWhatsAppNumber = "967780445044";
    const whatsappURL = `https://wa.me/${adminWhatsAppNumber}?text=${orderText}`;

    cart = [];
    localStorage.setItem('store_cart', JSON.stringify(cart));
    renderStoreCart();
    renderStoreProducts();

    if(nameInput) nameInput.value = '';
    if(phoneInput) phoneInput.value = '';
    if(addressInput) addressInput.value = '';

    alert(`🎉 شكراً لك يا ${name}! تم تجهيز طلبك بنجاح، سيتم تحويلك الآن لإرساله عبر الواتساب.`);
    window.open(whatsappURL, '_blank');
}
