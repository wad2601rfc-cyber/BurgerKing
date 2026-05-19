const orderContainer = document.getElementById('orderContainer');
const emptyState = document.getElementById('emptyState');

let adminHistory = [];

function loadAdminData() {
    const history = adminHistory;
    
    if (history.length === 0) {
        emptyState.classList.remove('hidden');
        orderContainer.innerHTML = '';
        updateStats(0, 0, 0);
        return;
    }

    emptyState.classList.add('hidden');
    
    let totalRevenue = 0;
    let totalRating = 0;
    let ratedOrders = 0;

    // Sort: most recent first
    const sortedHistory = [...history].reverse();
    
    orderContainer.innerHTML = sortedHistory.map((order, idx) => {
        // Stats calculation
        const priceNum = parseInt(order.total.replace(/[^0-9]/g, ''));
        totalRevenue += priceNum;
        
        if (order.rating > 0) {
            totalRating += order.rating;
            ratedOrders++;
        }

        return `
            <div class="glass p-6 rounded-[30px] border border-black/5 dark:border-white/5 animate-fade" style="animation-delay: ${idx * 0.05}s">
                <div class="flex flex-col md:flex-row justify-between gap-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="bg-bk-red text-white text-[10px] px-2 py-0.5 rounded-full font-bold">#ORD-${history.length - idx}</span>
                            <span class="text-xs opacity-50 font-bold">${order.time}</span>
                        </div>
                        <h4 class="font-extrabold text-lg mb-2">${order.items.join(', ')}</h4>
                        
                        <div class="flex flex-wrap gap-4 text-xs">
                            <div class="flex items-center gap-1 opacity-70">
                                <i data-lucide="phone" class="w-3 h-3 text-bk-red"></i>
                                ${order.phone || 'No phone'}
                            </div>
                            <div class="flex items-center gap-1 opacity-70">
                                <i data-lucide="map-pin" class="w-3 h-3 text-bk-red"></i>
                                ${order.address || 'No address'}
                            </div>
                            <div class="flex items-center gap-1">
                                ${(() => {
                                    const p = order.payment || 'Cash';
                                    const isEwallet = ['GoPay','OVO','DANA','ShopeePay'].includes(p);
                                    const isCard = ['Visa','Mastercard','BCA Card'].includes(p);
                                    const color = isEwallet ? 'text-blue-500' : isCard ? 'text-orange-500' : 'text-green-500';
                                    const icon = isEwallet ? 'smartphone' : isCard ? 'credit-card' : 'banknote';
                                    return `<i data-lucide="${icon}" class="w-3 h-3 ${color}"></i><span class="font-bold ${color}">${p}</span>`;
                                })()}
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col items-end gap-2">
                        <span class="text-xl font-extrabold text-bk-red">${order.total}</span>
                        <div class="flex items-center gap-1 bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full">
                            <span class="text-xs font-bold">${order.rating > 0 ? order.rating + '.0' : 'Unrated'}</span>
                            <i data-lucide="star" class="w-3 h-3 ${order.rating > 0 ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}"></i>
                        </div>
                    </div>
                </div>

                ${order.feedback ? `
                <div class="mt-4 p-4 bg-bk-yellow dark:bg-white/5 rounded-2xl italic text-xs border-l-4 border-bk-red">
                    " ${order.feedback} "
                </div>
                ` : ''}
            </div>
        `;
    }).join('');

    const avgRating = ratedOrders > 0 ? (totalRating / ratedOrders).toFixed(1) : "0.0";
    updateStats(totalRevenue, history.length, avgRating);
    lucide.createIcons();
}

function updateStats(revenue, orders, rating) {
    document.getElementById('statRevenue').innerText = 'Rp ' + revenue.toLocaleString();
    document.getElementById('statOrders').innerText = orders;
    document.getElementById('statRating').innerText = rating;
}

function clearHistory() {
    if (confirm("Are you sure you want to clear ALL order data? This cannot be undone.")) {
        if (typeof db !== 'undefined') {
            db.ref('orders').remove();
        } else {
            localStorage.removeItem('bk_history');
        }
        adminHistory = [];
        loadAdminData();
    }
}

function logoutAdmin() {
    sessionStorage.removeItem('admin_logged_in');
    window.location.reload();
}

function initAdminFirebase() {
    // Sync Menu
    initFirebaseData(() => {
        if (!document.getElementById('menuTab').classList.contains('hidden')) {
            loadAdminMenu();
        }
    });

    // Sync Orders
    if (typeof db !== 'undefined') {
        db.ref('orders').on('value', (snapshot) => {
            const val = snapshot.val();
            if (val) {
                adminHistory = Object.values(val).sort((a, b) => a.timestamp - b.timestamp);
            } else {
                adminHistory = [];
            }
            if (!document.getElementById('dashboardTab').classList.contains('hidden')) {
                loadAdminData();
            }
        });
        
        // Sync Chats
        db.ref('chats').on('value', (snapshot) => {
            const val = snapshot.val();
            renderAdminChatList(val);
            if (activeChatCustomer && val && val[activeChatCustomer]) {
                renderAdminChatHistory(val[activeChatCustomer]);
            }
        });
    } else {
        adminHistory = JSON.parse(localStorage.getItem('bk_history') || '[]');
        loadAdminData();
    }
}

// Initial Load and Login Logic
document.addEventListener('DOMContentLoaded', () => {
    const loginOverlay = document.getElementById('loginOverlay');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    // Check if already logged in
    if (sessionStorage.getItem('admin_logged_in') === 'true') {
        loginOverlay.style.display = 'none';
        initAdminFirebase();
    } else {
        // Not logged in, prevent scrolling in background if needed
        document.body.style.overflow = 'hidden';
    }

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('adminEmail').value;
            
            if (email.toLowerCase() === 'admin@burgerking.com') {
                sessionStorage.setItem('admin_logged_in', 'true');
                loginOverlay.style.opacity = '0';
                document.body.style.overflow = '';
                
                setTimeout(() => {
                    loginOverlay.style.display = 'none';
                    initAdminFirebase();
                }, 300);
            } else {
                loginError.classList.remove('hidden');
            }
        });
    }

    // Handle Menu Form Submission
    const menuForm = document.getElementById('menuForm');
    if (menuForm) {
        menuForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const originalName = document.getElementById('editOriginalName').value;
            const item = {
                name: document.getElementById('itemName').value,
                price: parseInt(document.getElementById('itemPrice').value),
                category: document.getElementById('itemCategory').value,
                spicy: document.getElementById('itemSpicy').checked,
                img: document.getElementById('itemImg').value,
                desc: document.getElementById('itemDesc').value,
                nutrition: { cal: 500, pro: 20, fat: 20, carb: 40 }, // Default nutrition
                rating: 5.0,
                reviews: 0
            };

            let menuData = [...MENU_DATA];
            
            if (originalName) {
                // Edit existing
                const idx = menuData.findIndex(i => i.name === originalName);
                if (idx !== -1) {
                    item.nutrition = menuData[idx].nutrition;
                    item.rating = menuData[idx].rating;
                    item.reviews = menuData[idx].reviews;
                    menuData[idx] = item;
                }
            } else {
                // Add new
                menuData.unshift(item);
            }

            saveMenuData(menuData);
            closeMenuModal();
        });
    }
});

/**
 * TAB SWITCHING
 */
function switchAdminTab(tab) {
    const tabs = ['dashboard', 'menu', 'chat'];
    tabs.forEach(t => {
        document.getElementById(t + 'Tab').classList.add('hidden');
        document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1)).className = "px-4 py-1.5 rounded-full text-sm font-bold opacity-50 hover:opacity-100 transition-all outline-none";
    });

    document.getElementById(tab + 'Tab').classList.remove('hidden');
    document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).className = "px-4 py-1.5 rounded-full text-sm font-bold bg-white dark:bg-bk-charcoal shadow-sm transition-all outline-none";

    if (tab === 'dashboard') loadAdminData();
    if (tab === 'menu') loadAdminMenu();
}

/**
 * MENU MANAGEMENT
 */
function loadAdminMenu() {
    const menuData = MENU_DATA;
    const grid = document.getElementById('adminMenuGrid');
    
    grid.innerHTML = menuData.map(item => `
        <div class="glass p-4 rounded-3xl flex gap-4 items-center">
            <img src="${item.img}" class="w-20 h-20 object-cover rounded-2xl" alt="${item.name}">
            <div class="flex-1">
                <div class="flex justify-between items-start">
                    <h4 class="font-bold text-sm leading-tight">${item.name}</h4>
                    ${item.spicy ? '<span class="text-[10px] bg-bk-red text-white px-1.5 py-0.5 rounded-full font-bold">HOT</span>' : ''}
                </div>
                <p class="text-xs opacity-60 capitalize">${item.category}</p>
                <p class="text-bk-red font-extrabold text-sm mt-1">Rp ${item.price.toLocaleString()}</p>
            </div>
            <div class="flex flex-col gap-2">
                <button onclick="openMenuModal('${item.name}')" class="p-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 rounded-xl transition-all outline-none">
                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                </button>
                <button onclick="deleteMenuItem('${item.name}')" class="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-all outline-none">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

function openMenuModal(name = null) {
    const modal = document.getElementById('menuModal');
    const title = document.getElementById('menuModalTitle');
    const form = document.getElementById('menuForm');
    
    form.reset();
    document.getElementById('editOriginalName').value = '';
    title.innerText = 'Add Menu Item';
    
    if (name) {
        const menuData = MENU_DATA;
        const item = menuData.find(i => i.name === name);
        if (item) {
            title.innerText = 'Edit Menu Item';
            document.getElementById('editOriginalName').value = item.name;
            document.getElementById('itemName').value = item.name;
            document.getElementById('itemPrice').value = item.price;
            document.getElementById('itemCategory').value = item.category;
            document.getElementById('itemSpicy').checked = item.spicy || false;
            document.getElementById('itemImg').value = item.img;
            document.getElementById('itemDesc').value = item.desc || '';
        }
    }
    
    modal.classList.remove('hidden');
}

function closeMenuModal() {
    document.getElementById('menuModal').classList.add('hidden');
}

function deleteMenuItem(name) {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
        let menuData = [...MENU_DATA];
        menuData = menuData.filter(i => i.name !== name);
        saveMenuData(menuData);
    }
}

/**
 * LIVE CHAT MANAGEMENT
 */
let activeChatCustomer = null;

function renderAdminChatList(chats) {
    const list = document.getElementById('adminChatList');
    list.innerHTML = '';
    
    if (!chats) {
        list.innerHTML = '<div class="opacity-50 text-center text-xs font-bold mt-10">No active chats</div>';
        return;
    }
    
    Object.keys(chats).forEach(customerId => {
        const msgs = Object.values(chats[customerId]).sort((a,b) => a.timestamp - b.timestamp);
        const lastMsg = msgs[msgs.length - 1];
        const isActive = activeChatCustomer === customerId;
        
        list.innerHTML += `
            <div onclick="selectAdminChat('${customerId}')" class="p-3 rounded-2xl cursor-pointer transition-all border ${isActive ? 'bg-bk-red text-white border-bk-red shadow-md' : 'bg-white/50 dark:bg-white/5 border-transparent hover:bg-black/5'}">
                <h4 class="font-bold text-sm truncate">${customerId}</h4>
                <p class="text-[10px] opacity-70 truncate mt-1">${lastMsg.text}</p>
            </div>
        `;
    });
}

function selectAdminChat(customerId) {
    activeChatCustomer = customerId;
    document.getElementById('adminChatHeader').classList.remove('hidden');
    document.getElementById('adminChatInputContainer').classList.remove('hidden');
    document.getElementById('adminChatTitle').innerText = customerId;
    
    // re-trigger render to update active state in list
    if (typeof db !== 'undefined') {
        db.ref('chats').once('value').then(snap => renderAdminChatList(snap.val()));
        db.ref('chats/' + customerId).once('value').then(snap => {
            renderAdminChatHistory(snap.val());
        });
    }
    lucide.createIcons();
}

function renderAdminChatHistory(data) {
    const history = document.getElementById('adminChatHistory');
    history.innerHTML = '<div class="text-center text-[10px] font-bold opacity-40 my-2">Chat History</div>';
    
    if (data) {
        const messages = Object.values(data).sort((a,b) => a.timestamp - b.timestamp);
        messages.forEach(msg => {
            const isAdmin = msg.sender === 'admin';
            history.innerHTML += `
                <div class="p-3 rounded-2xl max-w-[85%] text-sm shadow-sm animate-fade ${isAdmin ? 'bg-bk-red text-white rounded-tr-none self-end' : 'bg-gray-200 dark:bg-white/10 rounded-tl-none self-start'}">
                    ${msg.text}
                    <div class="text-[8px] opacity-50 mt-1 ${isAdmin ? 'text-right' : 'text-left'}">${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
            `;
        });
        history.scrollTop = history.scrollHeight;
    }
}

function sendAdminChat() {
    const input = document.getElementById('adminChatInput');
    const text = input.value.trim();
    if (!text || !activeChatCustomer || typeof db === 'undefined') return;
    
    const msgData = {
        sender: 'admin',
        text: text,
        timestamp: Date.now()
    };
    
    db.ref('chats/' + activeChatCustomer).push(msgData);
    input.value = '';
}
