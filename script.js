/**
 * BURGER KING AI - CORE LOGIC
 * Features: Menu, Cart, AI Assistant, Order Tracking
 */

// Initialize Lucide Icons
lucide.createIcons();

// SMART LOGIC CONFIG
const BOT_CONFIG = {
    name: "KingHelper",
    greeting: "Hello! I am KingHelper, your smart ordering assistant. How can I help you today?",
    categories: {
        spicy: ["spicy", "pedas", "hot", "terbakar", "cabai"],
        sweet: ["sweet", "manis", "dessert", "gula", "pencuci mulut"],
        savory: ["savory", "gurih", "asin", "salty", "burger", "snack", "nasi"],
        healthy: ["healthy", "sehat", "diet", "vegan", "vegetable", "sayur", "buah"]
    }
};

// MENU DATABASE (Loaded from shared state)
let MENU_DATA = getMenuData();

let cart = [];
let selectedItem = null;
let currentQty = 1;
let currentDiscount = 0;
let activeCategory = 'all';
let selectedPayment = 'Cash'; // Default
let currentOrderRating = 0;

/**
 * THEME LOGIC
 */function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    document.getElementById('moonIcon').classList.toggle('hidden', isDark);
    document.getElementById('sunIcon').classList.toggle('hidden', !isDark);
    localStorage.setItem('bk_theme', isDark ? 'dark' : 'light');
}

// Load Theme Preference
if (localStorage.getItem('bk_theme') === 'dark') {
    document.documentElement.classList.add('dark');
    document.getElementById('moonIcon').classList.add('hidden');
    document.getElementById('sunIcon').classList.remove('hidden');
}

/**
 * MENU & FILTERING
 */
function renderMenu(items) {
    const grid = document.getElementById('itemGrid');
    if (!grid) return;
    grid.innerHTML = '';
    items.forEach((item) => {
        grid.innerHTML += `
            <div class="glass p-2 md:p-4 rounded-3xl hover-elevate group cursor-pointer animate-fade" onclick="openProductDetail('${item.name}')">
                <div class="relative h-32 md:h-44 rounded-2xl overflow-hidden mb-4">
                    <img src="${item.img}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="${item.name}">
                    ${item.spicy ? '<span class="absolute top-2 right-2 bg-red-600 text-white text-[10px] px-2 py-1 rounded-full font-bold">HOT 🔥</span>' : ''}
                </div>
                <h3 class="font-bold text-sm md:text-base mb-1 truncate">${item.name}</h3>
                <div class="flex justify-between items-center">
                    <span class="text-bk-red font-extrabold text-sm md:text-lg">Rp ${item.price.toLocaleString()}</span>
                    <button class="bg-bk-red text-white p-2 rounded-full shadow-lg active:scale-90 transition-all outline-none">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
    });
    lucide.createIcons();
}

function filterCategory(cat) {
    activeCategory = cat;
    document.querySelectorAll('.category-pill').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(`'${cat}'`)) {
            btn.classList.add('active');
        }
    });
    const filtered = cat === 'all' ? MENU_DATA : MENU_DATA.filter(i => i.category === cat);
    renderMenu(filtered);
}

function handleSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = MENU_DATA.filter(i => i.name.toLowerCase().includes(query));
    renderMenu(filtered);
}

/**
 * PRODUCT DETAIL MODAL
 */
function openProductDetail(name) {
    const item = MENU_DATA.find(i => i.name === name);
    selectedItem = item;
    currentQty = 1;
    
    // Basic Info
    document.getElementById('detailName').innerText = item.name;
    document.getElementById('detailImg').src = item.img;
    document.getElementById('detailImg').alt = item.name;
    document.getElementById('detailPrice').innerText = 'Rp ' + item.price.toLocaleString();
    document.getElementById('detailDesc').innerText = item.desc || "The best choice to satisfy your hunger with real flame-grilled premium quality beef.";
    document.getElementById('detailQty').innerText = currentQty;

    // Nutrition Stats
    const nut = item.nutrition || { cal: '?', pro: '?', fat: '?', carb: '?' };
    document.getElementById('statCal').innerText = nut.cal + ' kcal';
    document.getElementById('statPro').innerText = nut.pro + 'g';
    document.getElementById('statFat').innerText = nut.fat + 'g';
    document.getElementById('statCarb').innerText = nut.carb + 'g';
    
    // Progress Bars (Visual)
    document.getElementById('barCal').style.width = Math.min((nut.cal / 1000) * 100, 100) + '%';
    document.getElementById('barPro').style.width = Math.min((nut.pro / 50) * 100, 100) + '%';
    document.getElementById('barFat').style.width = Math.min((nut.fat / 60) * 100, 100) + '%';
    document.getElementById('barCarb').style.width = Math.min((nut.carb / 100) * 100, 100) + '%';

    // Ratings & Reviews
    const rating = item.rating || 4.5;
    const reviews = item.reviews || 0;
    document.getElementById('detailRating').innerText = rating;
    document.getElementById('detailReviewCount').innerText = `(${reviews} Reviews)`;
    
    // Render Stars (Interactive)
    const starContainer = document.getElementById('starRating');
    starContainer.innerHTML = '';
    for(let i=1; i<=5; i++) {
        const starBtn = document.createElement('button');
        starBtn.className = "star-interaction-btn hover:scale-125 transition-all duration-200 outline-none";
        starBtn.onclick = (e) => {
            e.stopPropagation();
            submitProductRating(i);
        };
        
        const starIcon = document.createElement('i');
        starIcon.setAttribute('data-lucide', 'star');
        starIcon.className = `w-4 h-4 ${i <= Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`;
        starBtn.appendChild(starIcon);
        starContainer.appendChild(starBtn);
    }
    
    // Mock Reviews
    const revList = document.getElementById('reviewList');
    revList.innerHTML = `
        <div class="bg-black/5 dark:bg-white/5 p-3 rounded-2xl text-[10px] mb-2">
            <div class="flex justify-between mb-1"><b>Alex King</b> <span class="opacity-50">2 days ago</span></div>
            <p>"Best ${item.name} ever! The flavor is incredible."</p>
        </div>
        <div class="bg-black/5 dark:bg-white/5 p-3 rounded-2xl text-[10px]">
            <div class="flex justify-between mb-1"><b>Sarah J.</b> <span class="opacity-50">1 week ago</span></div>
            <p>"Fast delivery and still warm. Highly recommended!"</p>
        </div>
    `;

    document.getElementById('detailModal').classList.remove('hidden');
    lucide.createIcons();
}

/**
 * PRODUCT RATING INTERACTION
 */
function submitProductRating(n) {
    if (!selectedItem) return;
    
    // Update visual state of stars in modal
    const stars = document.querySelectorAll('.star-interaction-btn i');
    stars.forEach((s, i) => {
        if (i < n) {
            s.classList.add('fill-yellow-400', 'text-yellow-400');
            s.classList.remove('text-gray-300');
        } else {
            s.classList.remove('fill-yellow-400', 'text-yellow-400');
            s.classList.add('text-gray-300');
        }
    });

    // Update local data (mock)
    selectedItem.rating = ((selectedItem.rating || 4.5) + n) / 2; // Simple math to shift avg
    selectedItem.reviews = (selectedItem.reviews || 0) + 1;
    
    // Update labels
    document.getElementById('detailRating').innerText = selectedItem.rating.toFixed(1);
    document.getElementById('detailReviewCount').innerText = `(${selectedItem.reviews} Reviews)`;

    // Feedback message
    const desc = document.getElementById('detailDesc');
    const originalText = desc.innerText;
    desc.innerHTML = `<span class="text-green-500 font-bold block mb-2 animate-bounce">✨ Thank you for rating this ${n} stars!</span>` + originalText;
    
    setTimeout(() => {
        desc.innerText = originalText;
    }, 2000);
}

function adjustQty(n) {
    currentQty = Math.max(1, currentQty + n);
    document.getElementById('detailQty').innerText = currentQty;
}

function closeModal(id) {
    const el = document.getElementById(id);
    // AR modal uses inline display style; others use 'hidden' class
    if (el.style.display !== undefined && id === 'arModal') {
        el.style.display = 'none';
    } else if (id === 'outletModal') {
        el.classList.add('hidden');
    } else {
        el.classList.add('hidden');
    }
}

/**
 * SHOPPING CART LOGIC
 */
function confirmAddToCart() {
    if (!selectedItem) return;
    const existing = cart.find(c => c.name === selectedItem.name);
    if (existing) {
        existing.qty += currentQty;
    } else {
        cart.push({ ...selectedItem, qty: currentQty });
    }
    updateCartUI();
    closeModal('detailModal');
    
    // Proactive AI Suggestion
    showAiSuggestion(`It would be perfect to add a drink with your <b>${selectedItem.name}</b>! Check them out in the menu.`);
}

function updateCartUI() {
    const countEl = document.getElementById('cartCount');
    if (countEl) countEl.innerText = cart.reduce((sum, item) => sum + item.qty, 0);
    renderCartList();
    calculateTotal();
}

function renderCartList() {
    const list = document.getElementById('cartList');
    if (!list) return;
    list.innerHTML = '';
    cart.forEach((item, index) => {
        list.innerHTML += `
            <div class="flex gap-4 animate-fade">
                <img src="${item.img}" class="w-20 h-20 object-cover rounded-2xl" alt="${item.name}">
                <div class="flex-1">
                    <h4 class="font-bold text-sm text-bk-dark dark:text-white">${item.name}</h4>
                    <p class="text-bk-red font-extrabold">Rp ${item.price.toLocaleString()}</p>
                    <div class="flex items-center gap-2 mt-2">
                        <button onclick="changeCartQty(${index}, -1)" class="w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center outline-none">-</button>
                        <span class="text-sm font-bold">${item.qty}</span>
                        <button onclick="changeCartQty(${index}, 1)" class="w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center outline-none">+</button>
                        <button onclick="removeFromCart(${index})" class="ml-auto text-red-500 outline-none"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
            </div>
        `;
    });
    lucide.createIcons();
}

function changeCartQty(idx, n) {
    cart[idx].qty = Math.max(1, cart[idx].qty + n);
    updateCartUI();
}

function removeFromCart(idx) {
    cart.splice(idx, 1);
    updateCartUI();
}

function calculateTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discount = subtotal * currentDiscount;
    const final = subtotal - discount;
    
    const subEl = document.getElementById('subtotal');
    const discEl = document.getElementById('discount');
    const totalEl = document.getElementById('finalTotal');
    
    if (subEl) subEl.innerText = 'Rp ' + subtotal.toLocaleString();
    if (discEl) discEl.innerText = '- Rp ' + discount.toLocaleString();
    if (totalEl) totalEl.innerText = 'Rp ' + final.toLocaleString();
}

/**
 * PROMO & CHECKOUT
 */
function applyPromo() {
    const code = document.getElementById('promoCode').value;
    const msg = document.getElementById('promoMessage');
    if (code === 'BKNEW20') {
        currentDiscount = 0.2;
        msg.innerText = "Success! 20% Discount applied.";
        msg.className = "text-xs font-bold text-green-500 block";
    } else if (code.trim() === "") {
        currentDiscount = 0;
        msg.classList.add('hidden');
    } else {
        currentDiscount = 0;
        msg.innerText = "Invalid Promo Code";
        msg.className = "text-xs font-bold text-red-500 block";
    }
    calculateTotal();
}

function openCart() {
    document.getElementById('cartSidebar').classList.remove('hidden');
    // Auto-detect location if empty
    if (!document.getElementById('deliveryAddress').value) {
        detectLocation();
    }
}

function closeSidebar() {
    document.getElementById('cartSidebar').classList.add('hidden');
}

function handleCheckout() {
    if (cart.length === 0) return showToast("Your cart is empty!");
    const address = document.getElementById('deliveryAddress').value;
    const phone = document.getElementById('customerPhone').value;
    
    if (!address) return showToast("Please enter a delivery address!");
    if (!phone) return showToast("Please enter your WhatsApp / Phone number for coordination!");
    
    // Simulation Logic
    closeSidebar();
    
    // Reset Rating UI for new order
    currentOrderRating = 0;
    const starIcons = document.querySelectorAll('.star-btn i, .star-btn svg');
    starIcons.forEach(s => {
        s.classList.remove('fill-yellow-400', 'text-yellow-400');
        s.classList.add('text-gray-300');
    });
    document.getElementById('orderFeedback').value = '';

    document.getElementById('trackingModal').classList.remove('hidden');
    lucide.createIcons();
    
    // Save to localStorage History
    const history = JSON.parse(localStorage.getItem('bk_history') || '[]');
    history.push({ 
        items: cart.map(i => `${i.qty}x ${i.name}`), 
        time: new Date().toLocaleString(), 
        total: document.getElementById('finalTotal').innerText,
        payment: selectedPayment,
        address: address,
        phone: phone,
        rating: 0,
        feedback: ""
    });
    localStorage.setItem('bk_history', JSON.stringify(history));
    
    // Clear Cart
    cart = [];
    updateCartUI();
}

/**
 * RATING & FEEDBACK LOGIC
 */
function setOrderRating(n) {
    currentOrderRating = n;
    const starIcons = document.querySelectorAll('.star-btn i, .star-btn svg');
    starIcons.forEach((s, i) => {
        if (i < n) {
            s.classList.add('fill-yellow-400', 'text-yellow-400');
            s.classList.remove('text-gray-300');
        } else {
            s.classList.remove('fill-yellow-400', 'text-yellow-400');
            s.classList.add('text-gray-300');
        }
    });
}

function submitOrderFeedback() {
    const feedback = document.getElementById('orderFeedback').value;
    const history = JSON.parse(localStorage.getItem('bk_history') || '[]');
    
    if (history.length > 0) {
        const lastOrder = history[history.length - 1];
        lastOrder.rating = currentOrderRating;
        lastOrder.feedback = feedback;
        localStorage.setItem('bk_history', JSON.stringify(history));
    }

    if (currentOrderRating > 0) {
        showToast("Thank you for your rating! We appreciate your feedback.");
    }
    
    closeModal('trackingModal');
}

/**
 * NEW FEATURES: LOCATION & PAYMENTS
 */
function detectLocation() {
    const loader = document.getElementById('locationLoader');
    const addressInput = document.getElementById('deliveryAddress');
    const mapContainer = document.getElementById('mapContainer');
    const mapIframe = document.getElementById('mapIframe');

    if (!navigator.geolocation) {
        showToast("Geolocation is not supported by your browser");
        return;
    }

    loader.classList.remove('hidden');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Simulation: set address to coordinates (ideally reverse geocode)
            addressInput.value = `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            
            // Show Map
            mapContainer.classList.remove('hidden');
            mapIframe.src = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
            
            loader.classList.add('hidden');
        },
        () => {
            showToast("Unable to retrieve your location");
            loader.classList.add('hidden');
        }
    );
}

function selectPayment(method) {
    selectedPayment = method;
    // Update UI
    document.querySelectorAll('.payment-card').forEach(card => {
        card.classList.remove('active');
        if (card.querySelector('span').innerText === method) {
            card.classList.add('active');
        }
    });
}

/**
 * KINGHELPER AI LOGIC (LLAMA 3 POWERED)
 */
function toggleChat() {
    document.getElementById('chatWindow').classList.toggle('hidden');
}

function addMessage(text, isUser = false) {
    const history = document.getElementById('chatHistory');
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();

    const div = document.createElement('div');
    div.className = isUser 
        ? "bg-bk-red text-white p-3 rounded-2xl rounded-tr-none self-end max-w-[80%] text-sm animate-fade shadow-md"
        : "bg-white dark:bg-bk-charcoal p-3 rounded-2xl rounded-tl-none self-start max-w-[80%] text-sm animate-fade shadow-sm text-bk-dark dark:text-white";
    div.innerHTML = text;
    history.appendChild(div);
    history.scrollTop = history.scrollHeight;
}

function showTyping() {
    const history = document.getElementById('chatHistory');
    const div = document.createElement('div');
    div.id = 'typingIndicator';
    div.className = "bg-white/50 dark:bg-white/10 p-2 rounded-xl self-start text-[10px] animate-pulse italic";
    div.innerText = "KingHelper is typing...";
    history.appendChild(div);
    history.scrollTop = history.scrollHeight;
}

async function sendChat() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, true);
    input.value = '';
    showTyping();

    // Small delay to simulate "thinking"
    setTimeout(() => {
        const response = processSmartLogic(text);
        addMessage(response);
        setTimeout(() => lucide.createIcons(), 100);
    }, 600);
}

function processSmartLogic(query) {
    const q = query.toLowerCase();
    let results = [];
    let message = "";

    // 1. Check for Greetings
    if (q.includes("halo") || q.includes("hi") || q.includes("hello") || q.includes("hai")) {
        return "Hello! I'm KingHelper. Looking for something <b>spicy</b>, <b>sweet</b>, <b>savory</b>, or <b>healthy</b> today? Just ask me!";
    }

    // 2. Identify Category
    let foundCategory = null;
    for (const [cat, keywords] of Object.entries(BOT_CONFIG.categories)) {
        if (keywords.some(k => q.includes(k))) {
            foundCategory = cat;
            break;
        }
    }

    if (foundCategory === "spicy") {
        results = MENU_DATA.filter(i => i.spicy);
        message = "Here are some <b>Spicy</b> options for you! 🔥";
    } else if (foundCategory === "sweet") {
        results = MENU_DATA.filter(i => i.category === "dessert");
        message = "Treat yourself with these <b>Sweet</b> delights! 🍦";
    } else if (foundCategory === "healthy") {
        results = MENU_DATA.filter(i => i.category === "health");
        message = "Keep it fresh with our <b>Healthy</b> picks! 🥗";
    } else if (foundCategory === "savory") {
        results = MENU_DATA.filter(i => ["burger", "snack"].includes(i.category) && !i.spicy);
        message = "Classic <b>Savory</b> flavors you'll love! 🍔";
    }

    // 3. Fallback for specific menu item names
    if (results.length === 0) {
        const item = MENU_DATA.find(i => q.includes(i.name.toLowerCase()));
        if (item) {
            results = [item];
            message = `Great choice! Here is more info about <b>${item.name}</b>:`;
        }
    }

    // 4. Final Response Generation
    if (results.length > 0) {
        let html = `${message}<br><br>`;
        results.slice(0, 3).forEach(item => {
            html += `
                <div class="chat-card bg-white/10 p-2 rounded-2xl mb-2 flex flex-col gap-2 border border-white/5">
                    <img src="${item.img}" class="w-full h-24 object-cover rounded-xl">
                    <div class="flex flex-col">
                        <p class="font-bold text-xs">${item.name}</p>
                        <p class="text-bk-red font-extrabold text-[10px]">Rp ${item.price.toLocaleString()}</p>
                        <button onclick="addToCartFromChat('${item.name}')" class="mt-1 w-full bg-bk-red text-white p-1.5 rounded-xl font-bold text-[8px] active:scale-95 transition-all">Add to Cart +</button>
                    </div>
                </div>
            `;
        });
        return html;
    }

    return "I'm sorry, I couldn't find exactly that. You can try asking for <b>spicy</b>, <b>sweet</b>, <b>savory</b>, or <b>healthy</b> food! Or just ask for the <b>menu</b>.";
}

// Function to show automated suggestions
function showAiSuggestion(text) {
    if (document.getElementById('chatWindow').classList.contains('hidden')) {
        toggleChat();
    }
    addMessage(text);
}

/**
 * ADD TO CART FROM CHAT
 * Called by the "Add to Cart +" buttons rendered inside the AI chat window.
 */
function addToCartFromChat(name) {
    const item = MENU_DATA.find(i => i.name === name);
    if (!item) return;

    const existing = cart.find(c => c.name === item.name);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...item, qty: 1 });
    }
    updateCartUI();
    showToast(`${item.name} added to cart! 🍔`);
}

/**
 * UTILITIES & PERSISTENCE
 */
/**
 * CUSTOM TOAST NOTIFICATION SYSTEM
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-msg flex items-center gap-3 p-4 rounded-2xl shadow-2xl relative overflow-hidden`;
    
    // Icon selection
    let icon = 'info';
    if (message.toLowerCase().includes('success') || message.toLowerCase().includes('thank')) icon = 'check-circle';
    if (message.toLowerCase().includes('empty') || message.toLowerCase().includes('not supported') || message.toLowerCase().includes('unable') || message.toLowerCase().includes('enter')) icon = 'alert-circle';

    toast.innerHTML = `
        <i data-lucide="${icon}" class="w-6 h-6 ${icon === 'check-circle' ? 'text-green-500' : 'text-bk-red'}"></i>
        <div class="flex-1">
            <p class="text-xs font-bold leading-tight">${message}</p>
        </div>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    // Auto remove
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

function copyPromo() {
    navigator.clipboard.writeText('BKNEW20').then(() => {
        showToast('Promo code BKNEW20 copied! Use it at checkout.');
    });
}

function openHistory() {
    const modal = document.getElementById('historyModal');
    const listEl = document.getElementById('historyList');
    const emptyEl = document.getElementById('historyEmpty');
    const countEl = document.getElementById('historyCount');

    const history = JSON.parse(localStorage.getItem('bk_history') || '[]');

    modal.classList.remove('hidden');

    if (history.length === 0) {
        listEl.innerHTML = '';
        listEl.classList.add('hidden');
        emptyEl.classList.remove('hidden');
        countEl.innerText = '';
        lucide.createIcons();
        return;
    }

    listEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');
    countEl.innerText = `${history.length} order${history.length > 1 ? 's' : ''} found`;

    const starsHtml = (rating) => {
        if (!rating || rating === 0) return '<span class="text-[10px] opacity-40 italic">Not rated</span>';
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += `<i data-lucide="star" class="w-3 h-3 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}"></i>`;
        }
        return html;
    };

    listEl.innerHTML = [...history].reverse().map((order, idx) => `
        <div class="bg-black/5 dark:bg-white/5 p-4 rounded-[20px] border border-black/5 dark:border-white/5 animate-fade" style="animation-delay:${idx * 0.05}s">
            <div class="flex items-center justify-between mb-2">
                <span class="bg-bk-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full">#ORD-${history.length - idx}</span>
                <span class="text-[10px] opacity-40 font-bold">${order.time}</span>
            </div>
            <p class="font-extrabold text-sm mb-1 leading-snug">${order.items.join(', ')}</p>
            <div class="flex items-center justify-between mt-3">
                <div class="flex items-center gap-1">${starsHtml(order.rating)}</div>
                <span class="text-bk-red font-extrabold text-base">${order.total}</span>
            </div>
            ${order.feedback ? `<p class="mt-2 text-[10px] italic opacity-60 border-l-2 border-bk-red pl-2">"${order.feedback}"</p>` : ''}
            <div class="mt-2 flex flex-wrap gap-2 text-[10px] opacity-50">
                <span class="flex items-center gap-1"><i data-lucide="credit-card" class="w-3 h-3"></i>${order.payment || 'Cash'}</span>
                <span class="flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3"></i>${order.address || '-'}</span>
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

function clearHistoryFromModal() {
    if (!confirm('Are you sure you want to clear all order history?')) return;
    localStorage.removeItem('bk_history');
    openHistory();
    showToast('Order history cleared.');
}

/**
 * AR & 3D PREVIEW
 */
function openAR() {
    const modal = document.getElementById('arModal');
    const title = document.getElementById('arTitle');
    
    title.innerText = document.getElementById('detailName').innerText;
    
    // Use display:flex so model-viewer has proper dimensions to render
    modal.style.display = 'flex';
    lucide.createIcons();
}

/**
 * STORE LOCATOR (OUTLETS)
 */
const OUTLET_DATA = [
    { name: "BK Senayan City", lat: -6.2274, lng: 106.7974, address: "Jl. Asia Afrika No.19, Jakarta Pusat" },
    { name: "BK Grand Indonesia", lat: -6.1951, lng: 106.8203, address: "Grand Indonesia, West Mall, Lt 5" },
    { name: "BK Pondok Indah Mall", lat: -6.2657, lng: 106.7828, address: "PIM 2, Lantai 3, Jakarta Selatan" },
    { name: "BK Kelapa Gading", lat: -6.1578, lng: 106.9069, address: "Mall Kelapa Gading 3, Lt. Dasar" },
    { name: "BK Central Park", lat: -6.1774, lng: 106.7907, address: "CP Mall, Urban Kitchen, Lt 2" }
];

let map = null;

function openOutlets() {
    const modal = document.getElementById('outletModal');
    modal.classList.remove('hidden');
    
    setTimeout(() => {
        initStoreMap();
        renderOutletList();
    }, 300);
}

function initStoreMap() {
    if (map) return;
    map = L.map('outletMap').setView([-6.1951, 106.8203], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const bkIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style='background-color: #D62300; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3)'>BK</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    OUTLET_DATA.forEach(outlet => {
        L.marker([outlet.lat, outlet.lng], { icon: bkIcon })
            .addTo(map)
            .bindPopup(`<b>${outlet.name}</b><br>${outlet.address}`);
    });
}

function renderOutletList() {
    const list = document.getElementById('outletList');
    list.innerHTML = OUTLET_DATA.map(outlet => `
        <div onclick="focusOutlet(${outlet.lat}, ${outlet.lng})" class="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:bg-bk-red hover:text-white transition-all cursor-pointer group">
            <h5 class="font-extrabold text-sm uppercase">${outlet.name}</h5>
            <p class="text-[10px] opacity-60 group-hover:text-white/80">${outlet.address}</p>
        </div>
    `).join('');
}

function focusOutlet(lat, lng) {
    if (map) {
        map.flyTo([lat, lng], 16, { duration: 1.5 });
    }
}

// BOOTSTRAP
document.addEventListener('DOMContentLoaded', () => {
    filterCategory('all');
});
