/* ====================================================
   Nexus POS & E-Commerce - Synchronized Core Engine
   Developed & Architected by: محمد © 2026
   ================================================    */

let users = JSON.parse(localStorage.getItem('users')) || [
    { username: 'محمد', password: 'mm_12', role: 'admin', avatar: '' }
];

let defaultInventory = [
    { id: 1, name: 'قلم حبر جاف', price: 15, currency: 'YER', stock: 50, desc: 'قلم كتابة سلس للاستخدام اليومي.', image: 'https://via.placeholder.com/150' },
    { id: 2, name: 'دفتر مذكرات', price: 50, currency: 'YER', stock: 30, desc: 'دفتر ملاحظات بغلاف أنيق ومتين.', image: 'https://via.placeholder.com/150' }
];

// دالة جلب المنتجات لضمان مزامنتها دائماً
function getInventory() {
    let saved = localStorage.getItem('pos_inventory');
    if (!saved) {
        localStorage.setItem('pos_inventory', JSON.stringify(defaultInventory));
        return defaultInventory;
    }
    try {
        return JSON.parse(saved);
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

    // تحديث المخزون تلقائياً عند تحميل أي صفحة لضمان مزامنة التعديلات
    inventory = getInventory();

    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'index.html' || currentPage === '' || currentPage.includes('store')) {
        // واجهة المتجر الرئيسية للعملاء (تحديث وعرض المنتجات فوراً)
        renderStoreProducts();
        renderStoreCart();
    } else if (currentPage === 'login.html') {
        checkLoginLockState();
    } else if (currentPage === 'store.html' || currentPage === 'admin.html' || currentPage === 'dashboard.html') {
        if (!currentUser) {
            alert('⚠️ يجب تسجيل الدخول أولاً للوصول إلى لوحة التحكم!');
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

// الاستماع لأي تحديثات تحدث في الذاكرة لتحديث المتجر تلقائياً
window.addEventListener('storage', (e) => {
    if (e.key === 'pos_inventory') {
        inventory = getInventory();
        renderStoreProducts();
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
        alert('❌ تم تجاوز الحد الأقصى للمحاولات (3 محاولات). تم قفل تسجيل الدخول مؤقتاً!');
        return;
    }

    const userInput = document.getElementById('loginUser');
    const passInput = document.getElementById('loginPass');
    if (!userInput || !passInput) return;

    const u = userInput.value.trim();
    const p = passInput.value.trim();

    if (!u || !p) {
        alert('⚠️ الرجاء إدخال اسم المستخدم وكلمة المرور!');
        return;
    }

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
        const remaining = 3 - loginAttempts;
        if (loginAttempts >= 3) {
            alert('❌ تم قفل النظام لاستنفاد المحاولات.');
            location.reload();
        } else {
            alert(`❌ بيانات غير صحيحة! تبقت لديك (${remaining}) محاولات.`);
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
    if (!currentUser || currentUser.role !== 'admin') { 
        alert('🚫 عذراً، إضافة مستخدمين جدد مقتصرة على المدير العام فقط!'); 
        return; 
    }

    const usernameInput = document.getElementById('newUsernameInput');
    const passwordInput = document.getElementById('newUserPassInput');
    const roleSelect = document.getElementById('newUserRoleSelect');
    if (!usernameInput || !passwordInput) return;

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const role = roleSelect ? roleSelect.value : 'cashier';

    if (!username || !password) { alert('⚠️ أدخل اسم المستخدم وكلمة المرور!'); return; }
    if (users.some(u => u.username === username)) { alert('⚠️ اسم المستخدم موجود مسبقاً!'); return; }

    users.push({ username, password, role });
    localStorage.setItem('users', JSON.stringify(users));
    usernameInput.value = "";
    passwordInput.value = "";
    renderSystemUsersTable();
    alert('✅ تم إضافة المستخدم بنجاح.');
}

function renderSystemUsersTable() {
    const tbody = document.getElementById('systemUsersTableBody');
    if (!tbody) return;
    tbody.innerHTML = "";
    users.forEach((u, index) => {
        let roleName = u.role === 'admin' ? 'مدير عام 🛡️' : 'موظف / كاشير ⚡';
        tbody.innerHTML += `
            <tr>
                <td><b>${u.username}</b></td>
                <td>
                    ${currentUser.role === 'admin' ? `
                    <select onchange="updateUserRole(${index}, this.value)" style="background:var(--card-bg); color:inherit; border:1px solid var(--border-color); padding:3px; border-radius:4px;">
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>مدير عام</option>
                        <option value="cashier" ${u.role === 'cashier' ? 'selected' : ''}>موظف / كاشير</option>
                    </select>` : roleName}
                </td>
                <td>
                    ${currentUser.role === 'admin' && u.username !== 'محمد' ? `<button onclick="deleteSystemUser(${index})" style="background:#ef4444; color:white; border:none; padding:3px 8px; border-radius:3px; cursor:pointer;">حذف</button>` : 'محمي رئيسي'}
                </td>
            </tr>
        `;
    });
}

function updateUserRole(index, newRole) {
    if (!currentUser || currentUser.role !== 'admin') return;
    users[index].role = newRole;
    localStorage.setItem('users', JSON.stringify(users));
    alert('✅ تم التحديث بنجاح.');
}

function deleteSystemUser(index) {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (confirm('هل تريد حذف هذا المستخدم؟')) {
        users.splice(index, 1);
        localStorage.setItem('users', JSON.stringify(users));
        renderSystemUsersTable();
    }
}

// --- إضافة منتج ونشره فوراً للعملاء ---
function addNewProduct() {
    if (!currentUser) { alert('⚠️ يجب تسجيل الدخول أولاً!'); return; }

    const name = document.getElementById('newProdName').value.trim();
    const price = parseFloat(document.getElementById('newProdPrice').value);
    const currency = document.getElementById('newProdCurrency').value;
    const stock = parseInt(document.getElementById('newProdStock').value);
    const desc = document.getElementById('newProdDesc') ? document.getElementById('newProdDesc').value.trim() : '';
    const imageInput = document.getElementById('newProdImage');

    if (!name || isNaN(price) || isNaN(stock)) { 
        alert('⚠️ الرجاء إدخال بيانات المنتج الأساسية!'); 
        return; 
    }

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
    
    document.getElementById('newProdName').value = '';
    document.getElementById('newProdPrice').value = '';
    document.getElementById('newProdStock').value = '';
    if(document.getElementById('newProdDesc')) document.getElementById('newProdDesc').value = '';
    if(document.getElementById('newProdImage')) document.getElementById('newProdImage').value = '';

    renderAdminInventory();
    alert('✅ تم إضافة المنتج ونشره للعملاء في واجهة المتجر فوراً!');
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
                        <img src="${item.image || 'https://via.placeholder.com/50'}" style="width:30px; height:30px; object-fit:cover; border-radius:4px;">
                        <input type="text" id="edit_name_${index}" value="${item.name}" style="width:90px; background:transparent; color:inherit; border:1px solid var(--border-color); padding:3px;">
                    </div>
                </td>
                <td><input type="number" id="edit_price_${index}" value="${item.price}" style="width:60px; background:transparent; color:inherit; border:1px solid var(--border-color); padding:3px;"> ${item.currency}</td>
                <td><input type="number" id="edit_stock_${index}" value="${item.stock}" style="width:50px; background:transparent; color:inherit; border:1px solid var(--border-color); padding:3px;"></td>
                <td>
                    <button onclick="updateProduct(${index})" style="background:#f59e0b; color:black; border:none; padding:3px 6px; border-radius:3px; cursor:pointer; font-weight:bold;">تعديل</button>
                    <button onclick="deleteProduct(${index})" style="background:#ef4444; color:white; border:none; padding:3px 6px; border-radius:3px; cursor:pointer;">حذف</button>
                </td>
            </tr>
        `;
    });
}

function updateProduct(index) {
    if (!currentUser) return;
    inventory[index].name = document.getElementById(`edit_name_${index}`).value;
    inventory[index].price = parseFloat(document.getElementById(`edit_price_${index}`).value);
    inventory[index].stock = parseInt(document.getElementById(`edit_stock_${index}`).value);
    localStorage.setItem('pos_inventory', JSON.stringify(inventory));
    renderAdminInventory();
    alert('✅ تم التحديث بنجاح.');
}

function deleteProduct(index) {
    if (!currentUser) return;
    if (confirm('هل تريد حذف هذا المنتج نهائياً؟')) {
        inventory.splice(index, 1);
        localStorage.setItem('pos_inventory', JSON.stringify(inventory));
        renderAdminInventory();
    }
}

// --- عرض المنتجات في واجهة المتجر للعملاء فوراً ---
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

function renderAdminOrders() {
    const tbody = document.getElementById('adminOrdersTableBody');
    if (!tbody) return;
    tbody.innerHTML = "";
    if (storeOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">لا توجد طلبات أونلاين جديدة حالياً</td></tr>`;
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
