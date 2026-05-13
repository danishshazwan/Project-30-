/* =========================
   app.js (from old_index.html)
========================= */

// STATE
window.appData = JSON.parse(localStorage.getItem('studentTrackerData')) || {
    user: null,
    budget: 500,
    transactions: [],
    darkMode: false,
    income: 0
};

// CATEGORY CONFIG
window.categoryConfig = {
    "Food & Dining": { color: "#f97316", icon: "🍔", bg: "#ffedd5" },
    "Transportation": { color: "#3b82f6", icon: "🚌", bg: "#dbeafe" },
    "Shopping": { color: "#10b981", icon: "🛍️", bg: "#d1fae5" },
    "Education": { color: "#8b5cf6", icon: "📚", bg: "#ede9fe" }
};

// STATS STATE
window.currentStatsFilter = 'month';
window.statsYear = new Date().getFullYear();
window.statsMonth = new Date().getMonth();
window.statsWeek = Math.ceil(new Date().getDate() / 7);

window.monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
window.shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function saveData() {
    localStorage.setItem('studentTrackerData', JSON.stringify(window.appData));
    if (typeof updateUI === 'function') updateUI();
    // Notify cross-feature listeners (goals/savings/reports)
    window.dispatchEvent(new Event('studentTransactionsChanged'));
}


// NOTE: do NOT force navigation here.
// In multi-page setup each HTML file is a separate entry point.
// Initialization must be centralized via appInitForPage().

function appInitForPage() {
    // dark mode sync
    if (window.appData?.darkMode) document.body.classList.add('dark-mode');

    // auth protection (skip public pages)
    const publicPageIds = new Set([
        'index',
        'landing-page',
        'login-page',
        'signup-page'
    ]);

    // detect current page by first matching known root ids
    const knownPageIds = [
        'dashboard-page',
        'stats-page',
        'budget-page',
        'profile-page',
        'edit-profile-page',
        'add-expense-page',
        'income-page',
        'goals-page',
        'savings-page',
        'reports-page',
        'notifications-page',
        'media-links-page'
    ];

    const currentId = knownPageIds.find(id => document.getElementById(id));

    if (!currentId) {
        // For pages that don't match known roots, still allow init for public index.
        if (publicPageIds.has('index')) {
            if (typeof navTo === 'function') {
                // If index uses SPA landing markup
                const landing = document.getElementById('landing-page');
                if (landing) navTo('landing-page');
            }
        }
        return;
    }

    const isPublic = publicPageIds.has(currentId);
    if (!isPublic) {
        if (!window.appData?.user) {
            window.location.href = 'login.html';
            return;
        }
    }

    // render based on page
    if (typeof updateUI === 'function') {
        updateUI();
    }

    // stats/budget/profile specific render in case updateUI is partial
    if (currentId === 'stats-page') {
        if (typeof renderStatsFilters === 'function') renderStatsFilters();
        if (typeof renderStatsData === 'function') renderStatsData();
    }

    if (currentId === 'budget-page') {
        if (typeof renderBudgetCategory === 'function') renderBudgetCategory(window.appData.transactions);
    }

    if (currentId === 'profile-page' && typeof loadEditProfile === 'function') {
        // profile.html uses same avatar ids handled inside updateUI()
    }

    if (currentId === 'edit-profile-page' && typeof loadEditProfile === 'function') {
        loadEditProfile();
    }
}

// keep old API names for single-page compatibility
window.appInitForPage = appInitForPage;


/* =========================
   NAV (single-page style; kept for exact behavior)
========================= */
function navTo(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('active');

    let isNav = el.classList.contains('nav-screen');
    const bottomNav = document.getElementById('bottom-nav');
    if (bottomNav) bottomNav.style.display = isNav ? 'flex' : 'none';
    if (id === "edit-profile-page" && typeof loadEditProfile === 'function') loadEditProfile();
}

function switchTab(id, el) {
    navTo(id);
    document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
    if (el) el.classList.add('active');
}

