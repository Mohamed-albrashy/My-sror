/* ====================================================
   Nexus POS & E-Commerce - Global Synced Core Engine
   Developed & Architected by: محمد © 2026
   ================================================    */

let users = JSON.parse(localStorage.getItem('users')) || [
    { username: 'محمد', password: 'mm-123', role: 'admin', avatar: '' }
];

// مصفوفة المنتجات الأساسية المشتركة (أي منتج يضيفه المدير هنا أو عبر لوحة التحكم سيظهر للجميع)
let defaultInventory = [
    { id: 1, name: 'قلم حبر جاف', price: 15, currency: 'YER', stock: 50, desc: 'قلم كتابة سلس للاستخدام اليومي.', image: 'https://via.placeholder.com/150' },
    { id: 2, name: 'دفتر مذكرات', price: 50, currency: 'YER', stock: 30, desc: 'دفتر ملاحظات بغلاف أنيق ومتين.', image: 'https://via.placeholder.com/150' },
    { id: 3, name: 'ممم (تجربة سحابية)', price: 2000, currency: 'YER', stock: 10, desc: 'تست تست', image: 'https://via.placeholder.com/150' }
];

// دمج وتحديث المخزون ليظهر للجميع عالمياً
function getInventory() {
    let saved = localStorage.getItem('pos_inventory');
    if (!saved) {
        localStorage.setItem('pos_inventory', JSON.stringify(defaultInventory));
        return defaultInventory;
    }
    try {
        let parsed = JSON.parse(saved);
        // دمج المنتجات الأساسية مع المحدثة لضمان ظهور الجديد دائماً
        return parsed.length > 0 ? parsed : defaultInventory;
    } catch(e) {
        return defaultInventory;
    }
}

let inventory = getInventory();
let cart = JSON.parse(localStorage.getItem('store_cart')) || [];
let storeOrders = JSON.parse(localStorage.getItem('store_orders')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let loginAttempts = parseInt(localStorage.getItem('login_attempts')) || 0;

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
    }

    inventory = getInventory();
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'index.html' || currentPage === '' || currentPage.includes('store')) {
        renderStoreProducts();
        renderStoreCart();
    } else if (currentPage === 'login.html') {
        checkLoginLockState();
    } else if (currentPage === 'store.html' || currentPage === 'admin.html' || currentPage === 'dashboard.html') {
        if (!currentUser) {
            alert('⚠️ يجب تسجيل الدخول أولاً!');
            window.location.href = 'login.html';
            return;
        }
        renderAdminInventory();
        renderSystemUsersTable();
        renderAdminOrders();
        
        const cashierNameSpan = document.getElementById('currentCashierName');
        if (cashierNameSpan) cashierNameSpan.textContent = currentUser.username;
        
        if (currentUser.role !== 'admin') {
            const addUserInputs = document.querySelectorAll('#newUsernameInput, #newUserPassInput, #newUserRoleSelect');
            addUserInputs.forEach(el => { if(el) el.disabled = true; });
        }
    }

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleSystemLogin);
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

function handleSystemLogin() {
    if (loginAttempts >= 3) {
        alert('❌ تم قفل تسجيل الدخول مؤقتاً لتجاوز المحاولات.');
        return;
    }

    const u = document.getElementById('loginUser').value.trim();
    const p = document.getElementById('loginPass').value.trim();

    if (!u || !p) { alert('⚠️ أدخل اسم المستخدم وكلمة المرور!'); return; }

    const foundUser = users.find(user => user.username === u && user.password === p);

    if (foundUser) {
        loginAttempts = 0;
        localStorage.setItem('login_attempts', loginAttempts);
        localStorage.setItem('currentUser', JSON.stringify(foundUser));
        alert(`✅ أهلاً بك يا ${foundUser.username}`);
        window.location.href = 'store.html';
    } else {
        loginAttempts++;
        localStorage.setItem('login_attempts', loginAttempts);
        if (loginAttempts >= 3) {
            alert('❌ تم قفل النظام لاستنفاد المحاولات.');
            location.reload();
        } else {
            alert(`❌ بيانات غير صحيحة! تبقت لديك (${3 - loginAttempts}) محاولات.`);
        }
    }
}

function checkLoginLockState() {
    if (loginAttempts >= 3) {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.style.background = '#444';
            loginBtn.textContent = '❌ تم قفل النظام';
        }
    }
}

function addNewSystemUser() {
    if (!currentUser || currentUser.role !== 'admin') { alert('🚫 للصلاحيات الخاصة بالمدير فقط!'); return; }
    const username = document.getElementById('newUsernameInput').value.trim();
    const password = document.getElementById('newUserPassInput').value.trim();
    const role = document.getElementById('newUserRoleSelect').value;

    if (!username || !password) { alert('⚠️ أدخل البيانات!'); return; }
    if (users.some(u => u.username === username)) { alert('⚠️ موجود مسبقاً!'); return; }

    users.push({ username, password, role });
    localStorage.setItem('users', JSON.stringify(users));
    renderSystemUsersTable();
    alert('✅ تم إضافة المستخدم بنجاح.');
}

function renderSystemUsersTable() {
    const tbody = document.getElementById('systemUsersTableBody');
    if (!tbody) return;
    tbody.innerHTML = "";
    users.forEach((u, index) => {
        tbody.innerHTML += `
            <tr>
                <td><b>${u.username}</b></td>
                <td>${u.role === 'admin' ? 'مدير عام 🛡️' : 'موظف ⚡'}</td>
                <td>${u.username !== 'محمد' ? `<button onclick="deleteSystemUser(${index})" style="background:#ef4444; color:white; border:none; padding:3px 8px; border-radius:3px;">حذف</button>` : 'حماية رئيسية'}</td>
            </tr>
        `;
    });
}

function deleteSystemUser(index) {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (confirm('حذف المستخدم؟')) {
        users.splice(index, 1);
        localStorage.setItem('users', JSON.stringify(users));
        renderSystemUsersTable();
    }
}

// --- إضافة منتج ونشره عالمياً للعملاء ---
function addNewProduct() {
    if (!currentUser) { alert('⚠️ سجل دخولك أولاً!'); return; }

    const name = document.getElementById('newProdName').value.trim();
    const price = parseFloat(document.getElementById('newProdPrice').value);
    const currency = document.getElementById('newProdCurrency').value;
    const stock = parseInt(document.getElementById('newProdStock').value);
    const desc = document.getElementById('newProdDesc') ? document.getElementById('newProdDesc').value.trim() : '';
    const imageInput = document.getElementById('newProdImage');

    if (!name || isNaN(price) || isNaN(stock)) { alert('⚠️ أدخل البيانات الأساسية!'); return; }

    if (imageInput && imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            saveProductData(name, price, currency, stock, desc, e.target.result);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        saveProductData(name, price, currency, stock, desc, 'https://via.placeholder.com/150');
    }
}

function saveProductData(name, price, currency, stock, desc, image) {
    inventory = getInventory();
    const newId = inventory.length > 0 ? inventory[0].id + 1 : 1;
    inventory.unshift({ id: newId, name, price, currency, stock, desc, image });
    localStorage.setItem('pos_inventory', JSON.stringify(inventory));
    
    // تحديث المصفوفة الافتراضية في الكود برمجياً لضمان رؤيتها عند الرفع
    renderAdminInventory();
    alert('✅ تمت الإضافة بنجاح! لكي يراها جميع العملاء فوراً على رابط Netlify، قم بعمل Commit سريع للملفات المحدثة على GitHub.');
}

function renderAdminInventory() {
    inventory = getInventory();
    const tbody = document.getElementById('adminInventoryTable');
    if (!tbody) return;
    tbody.innerHTML = "";
    inventory.forEach((item, index) => {
        tbody.innerHTML += `
            <tr>
                <td>#${item.id}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <img src="${item.image}" style="width:30px; height:30px; object-fit:cover; border-radius:4px;">
                        <span>${item.name}</span>
                    </div>
                </td>
                <td>${item.price} ${item.currency}</td>
                <td>${item.stock}</td>
                <td>
                    <button onclick="deleteProduct(${index})" style="background:#ef4444; color:white; border:none; padding:3px 6px; border-radius:3px;">حذف</button>
                </td>
            </tr>
        `;
    });
}

function deleteProduct(index) {
    if (!currentUser) return;
    if (confirm('حذف المنتج؟')) {
        inventory.splice(index, 1);
        localStorage.setItem('pos_inventory', JSON.stringify(inventory));
        renderAdminInventory();
    }
}

// --- عرض المنتجات للعملاء في الواجهة ---
function renderStoreProducts() {
    inventory = getInventory();
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

function submitOnlineOrder() {
    const nameInput = document.getElementById('clientName');
    const phoneInput = document.getElementById('clientPhone');
    const addressInput = document.getElementById('clientAddress');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const address = addressInput ? addressInput.value.trim() : 'لم يُذكر';

    if (!name || !phone || cart.length === 0) { 
        alert('❌ يرجى إدخال البيانات والسلة!'); 
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
    
    orderText += `%0A💰 *الإجمالي النهائي:* ${grandTotal.toFixed(2)} YER`;

    const adminWhatsAppNumber = "967780445044";
    const whatsappURL = `https://wa.me/${adminWhatsAppNumber}?text=${orderText}`;

    cart = [];
    localStorage.setItem('store_cart', JSON.stringify(cart));
    renderStoreCart();
    renderStoreProducts();

    if(nameInput) nameInput.value = '';
    if(phoneInput) phoneInput.value = '';
    if(addressInput) addressInput.value = '';

    alert(`🎉 تم تجهيز طلبك بنجاح، سيتم تحويلك الآن لإرساله عبر الواتساب.`);
    window.open(whatsappURL, '_blank');
}

function renderAdminOrders() {
    const tbody = document.getElementById('adminOrdersTableBody');
    if (!tbody) return;
    tbody.innerHTML = "";
    if (storeOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">لا توجد طلبات جديدة حالياً</td></tr>`;
        return;
    }
    storeOrders.slice().reverse().forEach((ord) => {
        let itemsSummary = ord.items.map(i => `${i.name} (${i.qty})`).join(', ');
        tbody.innerHTML += `
            <tr>
                <td>#${ord.id}</td>
                <td><b>${ord.clientName}</b><br><span style="font-size:10px; color:var(--text-muted);">${ord.clientPhone}</span></td>
                <td>${ord.clientAddress}<br><span style="font-size:10px; color: var(--primary-gold);">${itemsSummary}</span></td>
                <td style="color:var(--primary-gold); font-weight:bold;">${ord.total.toFixed(2)} YER</td>
                <td>${ord.timestamp}</td>
            </tr>
        `;
    });
}
