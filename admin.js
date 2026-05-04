const orderContainer = document.getElementById('orderContainer');
const emptyState = document.getElementById('emptyState');

function loadAdminData() {
    const history = JSON.parse(localStorage.getItem('bk_history') || '[]');
    
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
        localStorage.removeItem('bk_history');
        loadAdminData();
    }
}

function logoutAdmin() {
    sessionStorage.removeItem('admin_logged_in');
    window.location.reload();
}

// Initial Load and Login Logic
document.addEventListener('DOMContentLoaded', () => {
    const loginOverlay = document.getElementById('loginOverlay');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    // Check if already logged in
    if (sessionStorage.getItem('admin_logged_in') === 'true') {
        loginOverlay.style.display = 'none';
        loadAdminData();
    } else {
        // Not logged in, prevent scrolling in background if needed
        document.body.style.overflow = 'hidden';
    }

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('adminEmail').value;
            
            // Allow login with specific email or any valid email for demo purposes
            // Let's require admin@burgerking.com for extra realism
            if (email.toLowerCase() === 'admin@burgerking.com') {
                sessionStorage.setItem('admin_logged_in', 'true');
                loginOverlay.style.opacity = '0';
                document.body.style.overflow = '';
                
                setTimeout(() => {
                    loginOverlay.style.display = 'none';
                    loadAdminData();
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

            let menuData = getMenuData();
            
            if (originalName) {
                // Edit existing
                const idx = menuData.findIndex(i => i.name === originalName);
                if (idx !== -1) {
                    // Preserve rating/reviews/nutrition if editing
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
            loadAdminMenu();
        });
    }
});

/**
 * TAB SWITCHING
 */
function switchAdminTab(tab) {
    const dashTab = document.getElementById('dashboardTab');
    const menuTab = document.getElementById('menuTab');
    const btnDash = document.getElementById('tabDashboard');
    const btnMenu = document.getElementById('tabMenu');

    if (tab === 'dashboard') {
        dashTab.classList.remove('hidden');
        menuTab.classList.add('hidden');
        btnDash.className = "px-4 py-1.5 rounded-full text-sm font-bold bg-white dark:bg-bk-charcoal shadow-sm transition-all outline-none";
        btnMenu.className = "px-4 py-1.5 rounded-full text-sm font-bold opacity-50 hover:opacity-100 transition-all outline-none";
        loadAdminData();
    } else {
        dashTab.classList.add('hidden');
        menuTab.classList.remove('hidden');
        btnDash.className = "px-4 py-1.5 rounded-full text-sm font-bold opacity-50 hover:opacity-100 transition-all outline-none";
        btnMenu.className = "px-4 py-1.5 rounded-full text-sm font-bold bg-white dark:bg-bk-charcoal shadow-sm transition-all outline-none";
        loadAdminMenu();
    }
}

/**
 * MENU MANAGEMENT
 */
function loadAdminMenu() {
    const menuData = getMenuData();
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
        const menuData = getMenuData();
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
        let menuData = getMenuData();
        menuData = menuData.filter(i => i.name !== name);
        saveMenuData(menuData);
        loadAdminMenu();
    }
}

