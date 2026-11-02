/* ====================================================
   Nexus POS & E-Commerce - Unified Core Engine
   Developed & Architected by: محمد © 2026
   ================================================    */

let users = JSON.parse(localStorage.getItem('users')) || [
    { username: 'محمد', password: 'mm-123', role: 'admin', avatar: '' }
];

let inventory = JSON.parse(localStorage.getItem('pos_inventory')) || [
    { id: 1, name: 'قلم حبر جاف', price: 15, currency: 'YER', stock: 50, desc: 'قلم كتابة سلس للاستخدام اليومي.', image: 'https://via.placeholder.com/150' },
    { id: 2, name: 'دفتر مذكرات', price: 50, currency: 'YER', stock: 30, desc: 'دفتر ملاحظات بغلاف أنيق ومتين.', image: 'https://via.placeholder.com/150' }
];

let cart = JSON.parse(localStorage.getItem('store_cart')) || [];
let storeOrders = JSON.parse(localStorage.getItem('store_orders')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
    }

    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'index.html' || currentPage === '') {
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }
        renderAdminInventory();
        renderSystemUsersTable();
        renderAdminOrders();
        const cashierNameSpan = document.getElementById('currentCashierName');
        if (cashierNameSpan) cashierNameSpan.textContent = currentUser.username;
    } else if (currentPage === 'store.html') {
        renderStoreProducts();
        renderStoreCart();
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

// --- إدارة المستخدمين والصلاحيات (إضافة، تعديل، حذف) ---
function addNewSystemUser() {
    if (!currentUser || currentUser.role !== 'admin') { alert('عذراً، هذه الصلاحية للمدير العام فقط!'); return; }
    const username = document.getElementById('newUsernameInput').value.trim();
    const password = document.getElementById('newUserPassInput').value.trim();
    const role = document.getElementById('newUserRoleSelect').value;

    if (!username || !password) { alert('أدخل اسم المستخدم وكلمة المرور!'); return; }
    if (users.some(u => u.username === username)) { alert('اسم المستخدم موجود مسبقاً!'); return; }

    users.push({ username, password, role });
    localStorage.setItem('users', JSON.stringify(users));
    document.getElementById('newUsernameInput').value = "";
    document.getElementById('newUserPassInput').value = "";
    renderSystemUsersTable();
    alert('✅ تم إضافة المستخدم وتحديد صلاحيته بنجاح.');
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
                    <select onchange="updateUserRole(${index}, this.value)" style="background:var(--card-bg); color:inherit; border:1px solid var(--border-color); padding:3px; border-radius:4px;">
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>مدير عام</option>
                        <option value="cashier" ${u.role === 'cashier' ? 'selected' : ''}>موظف / كاشير</option>
                    </select>
                </td>
                <td>
                    ${u.username !== 'محمد' ? `<button onclick="deleteSystemUser(${index})" style="background:#ef4444; color:white; border:none; padding:3px 8px; border-radius:3px; cursor:pointer;">حذف</button>` : 'محمي رئيسي'}
                </td>
            </tr>
        `;
    });
}

function updateUserRole(index, newRole) {
    users[index].role = newRole;
    localStorage.setItem('users', JSON.stringify(users));
    alert('✅ تم تحديث صلاحية المستخدم بنجاح.');
}

function deleteSystemUser(index) {
    if (confirm('هل تريد حذف هذا المستخدم؟')) {
        users.splice(index, 1);
        localStorage.setItem('users', JSON.stringify(users));
        renderSystemUsersTable();
    }
}

// --- إدارة المنتجات (إضافة، تعديل، حذف) ---
function addNewProduct() {
    if (!currentUser || currentUser.role !== 'admin') { alert('عذراً، إضافة المنتجات مقتصرة على المدير العام فقط!'); return; }
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
    inventory.push({ id: newId, name, price, currency, stock, desc, image });
    localStorage.setItem('pos_inventory', JSON.stringify(inventory));
    renderAdminInventory();
    alert('✅ تم إضافة المنتج ونشره في المتجر بنجاح.');
}

function renderAdminInventory() {
    const tbody = document.getElementById('adminInventoryTable');
    if (!tbody) return;
    tbody.innerHTML = "";
    inventory.forEach((item, index) => {
        tbody.innerHTML += `
            <tr>
                <td>#${item.id}</td>
                <td><input type="text" id="edit_name_${index}" value="${item.name}" style="width:100px; background:transparent; color:inherit; border:1px solid var(--border-color); padding:3px;"></td>
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
    if (!currentUser || currentUser.role !== 'admin') return;
    inventory[index].name = document.getElementById(`edit_name_${index}`).value;
    inventory[index].price = parseFloat(document.getElementById(`edit_price_${index}`).value);
    inventory[index].stock = parseInt(document.getElementById(`edit_stock_${index}`).value);
    localStorage.setItem('pos_inventory', JSON.stringify(inventory));
    renderAdminInventory();
    alert('✅ تم تحديث بيانات المنتج بنجاح.');
}

function deleteProduct(index) {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (confirm('هل تريد حذف هذا المنتج نهائياً؟')) {
        inventory.splice(index, 1);
        localStorage.setItem('pos_inventory', JSON.stringify(inventory));
        renderAdminInventory();
    }
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
    document.getElementById('cartSubTotal').textContent = subTotal.toFixed(2);
    document.getElementById('cartTax').textContent = tax.toFixed(2);
    document.getElementById('cartGrandTotal').textContent = grandTotal.toFixed(2);
}

// --- إرسال الطلب وحفظه محلياً أو عبر الواتساب للرقم 780445044 ---
function submitOnlineOrder() {
    const name = document.getElementById('clientName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    const address = document.getElementById('clientAddress') ? document.getElementById('clientAddress').value.trim() : 'لم يُذكر';

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
    orderText += `📍 *العنوان:* ${address}%0A`;
    orderText += `💰 *الإجمالي:* ${grandTotal.toFixed(2)} YER%0A`;

    // توجيه الطلب إلى رقم الواتساب المطلوب: 780445044 (مع كود اليمن 967)
    const adminWhatsAppNumber = "967780445044";
    const whatsappURL = `https://wa.me/${adminWhatsAppNumber}?text=${orderText}`;

    cart = [];
    localStorage.setItem('store_cart', JSON.stringify(cart));
    renderStoreCart();
    renderStoreProducts();

    alert(`🎉 شكراً لك يا ${name}! تم حفظ طلبك بنجاح. (إذا توفر إنترنت، سيتم تحويلك للواتساب لإرساله للمدير).`);
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
    storeOrders.slice().reverse().forEach((ord, idx) => {
        tbody.innerHTML += `
            <tr>
                <td>#${ord.id}</td>
                <td><b>${ord.clientName}</b><br><span style="font-size:10px; color:var(--text-muted);">${ord.clientPhone}</span></td>
                <td>${ord.clientAddress}</td>
                <td style="color:var(--primary-gold); font-weight:bold;">${ord.total.toFixed(2)} YER</td>
                <td>${ord.timestamp}</td>
            </tr>
        `;
    });
}
