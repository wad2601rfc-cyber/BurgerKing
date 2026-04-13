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

// Initial Load
document.addEventListener('DOMContentLoaded', loadAdminData);
