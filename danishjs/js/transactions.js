/* =========================
   transactions.js (from old_index.html)
========================= */

function updateUI() {
    if (!window.appData.user) return;

    let initials = window.appData.user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    let avatar = window.appData.user.image
        ? `<img src="${window.appData.user.image}" style="width:100%; height:100%; border-radius:50%; object-fit: cover;">`
        : initials;

    const dashAvatar = document.getElementById('dash-avatar');
    if (dashAvatar) dashAvatar.innerHTML = avatar;

    const profAvatar = document.getElementById('prof-avatar');
    if (profAvatar) profAvatar.innerHTML = avatar;

    const dashName = document.getElementById('dash-name');
    if (dashName) dashName.innerText = window.appData.user.name;

    const profName = document.getElementById('prof-name');
    if (profName) profName.innerText = window.appData.user.name;

    const profEmail = document.getElementById('prof-email');
    if (profEmail) profEmail.innerText = window.appData.user.email;

    const dashTotalSpent = document.getElementById('dash-total-spent');

    let total = window.appData.transactions.reduce((s, t) => s + parseFloat(t.amount), 0);
    let remain = window.appData.budget - total;
    let income = parseFloat(window.appData.income) || 0;
    let profit = income - total;

    if (dashTotalSpent) dashTotalSpent.innerText = `RM${total.toFixed(2)}`;

    let profitText = document.getElementById('profit-text');
    if (profitText) {
        profitText.innerText = `Profit: RM${profit.toFixed(2)}`;
    } else {
        const balanceSection = document.querySelector('.balance-section');
        if (balanceSection) {
            if (!document.getElementById('profit-text')) {
                balanceSection.insertAdjacentHTML('beforeend', `<div class="profit-badge" id="profit-text"></div>`);
            }
            document.getElementById('profit-text').innerText = `Profit: RM${profit.toFixed(2)}`;
        }
    }

    const budgetRemaining = document.getElementById('budget-remaining');
    if (budgetRemaining) budgetRemaining.innerText = `RM${remain > 0 ? remain.toFixed(2) : "0.00"}`;

    const budgetSpentText = document.getElementById('budget-spent-text');
    if (budgetSpentText) budgetSpentText.innerText = `Spent: RM${total.toFixed(2)}`;

    const budgetTotalText = document.getElementById('budget-total-text');
    if (budgetTotalText) budgetTotalText.innerText = `Total: RM${window.appData.budget}`;

    const budgetBarFill = document.getElementById('budget-bar-fill');
    if (budgetBarFill) {
        let pct = Math.min((total / window.appData.budget) * 100, 100) || 0;
        budgetBarFill.style.width = pct + "%";
    }

    const budgetAlert = document.getElementById('budget-alert');
    const isOverBudget = total > window.appData.budget;
    if (budgetAlert) budgetAlert.style.display = isOverBudget ? 'block' : 'none';

    // If over budget => (notification disabled as requested)

    if (typeof renderTransactions === 'function') renderTransactions();
    if (typeof renderStatsFilters === 'function') renderStatsFilters();
    if (typeof renderStatsData === 'function') renderStatsData();
    if (typeof renderBudgetCategory === 'function') renderBudgetCategory(window.appData.transactions);

    // Render uploaded media on dashboard
    if (typeof window !== 'undefined' && typeof window.renderMediaOnDashboard === 'function') window.renderMediaOnDashboard();

    // Push/redirect notification if budget exceeded
    if (typeof maybeNotifyOverBudgetAndRedirect === 'function') maybeNotifyOverBudgetAndRedirect(total);
}


// If over budget, show a notification in notifications.html (user asked to bring notifications back)
function maybeNotifyOverBudgetAndRedirect(total) {
    try {
        const budget = window?.appData?.budget;
        if (typeof budget !== 'number' || !isFinite(budget)) return;
        const isOverBudget = total > budget;
        if (!isOverBudget) return;

        if (typeof window.addNotification !== 'function') return;

        const already = sessionStorage.getItem('overBudgetNotifiedAt');
        const now = Date.now();
        const recentlyNotified = already && (now - parseInt(already, 10)) < 60000; // 60s guard
        if (recentlyNotified) return;

        sessionStorage.setItem('overBudgetNotifiedAt', String(now));
        window.addNotification({
            title: 'Over Budget 🔔',
            message: `You spent RM${total.toFixed(2)} but budget is RM${budget.toFixed(2)}.`,
            type: 'warning'
        });
        window.location.href = 'notifications.html';
    } catch (e) {
        // ignore
    }
}


function renderTransactions() {
    let list = document.getElementById('transaction-list');
    if (!list) return;

    list.innerHTML = '';
    if (window.appData.transactions.length === 0) {
        list.innerHTML = "<p style='text-align:center;'>No expenses yet</p>";
        return;
    }

    [...window.appData.transactions].reverse().forEach(t => {
        let c = window.categoryConfig[t.category];
        if (!c) return;

        list.innerHTML += `
        <div class="transaction-card" style="cursor:pointer;" onclick="viewExpenseDetails(${t.id})">
            <div class="t-icon" style="background:${c.bg}; color:${c.color};">${c.icon}</div>
            <div class="t-details"><h4>${t.title}</h4><p style="font-size:12px;">${t.category} • ${new Date(t.date).toLocaleDateString()}</p></div>
            <div style="text-align:right;">
                <div class="t-amount">-RM${parseFloat(t.amount).toFixed(2)}</div>
                <div style="font-size:12px; margin-top: 5px;">
                    <span onclick="event.stopPropagation(); editExpense(${t.id})" style="cursor:pointer; margin-right: 5px;">✏️</span>
                    <span onclick="event.stopPropagation(); deleteExpense(${t.id})" style="cursor:pointer;">🗑️</span>
                </div>
            </div>
        </div>`;
    });
}

function saveExpense() {
    let amt = document.getElementById('add-amount').value;
    let title = document.getElementById('add-title').value || "Expense";
    let cat = document.getElementById('add-category').value;

    if (!amt || amt <= 0) return alert("Invalid amount");

    window.appData.transactions.push({
        id: Date.now(),
        amount: amt,
        title,
        category: cat,
        date: new Date().toISOString()
    });

    document.getElementById('add-amount').value = '';
    if (document.getElementById('add-title')) document.getElementById('add-title').value = '';

    saveData();

    // Ensure real-time listeners update
    window.dispatchEvent(new Event('studentTransactionsChanged'));

    // In split page flow, go back to dashboard
    window.location.href = 'dashboard.html';
}


function editExpense(id) {
    let t = window.appData.transactions.find(x => x.id === id);
    if (!t) return;

    let amt = prompt("Edit amount:", t.amount);
    if (amt === null) return;
    t.amount = parseFloat(amt);
    t.title = prompt("Edit title:", t.title) || t.title;
    saveData();
    window.dispatchEvent(new Event('studentTransactionsChanged'));
}


function deleteExpense(id) {
    window.appData.transactions = window.appData.transactions.filter(t => t.id !== id);
    saveData();
    window.dispatchEvent(new Event('studentTransactionsChanged'));
}


function promptBudget() {
    let val = prompt("Set budget:", window.appData.budget);
    if (val && !isNaN(val)) {
        window.appData.budget = parseFloat(val);
        saveData();
    }
}

function toggleTheme() {
    window.appData.darkMode = !window.appData.darkMode;
    document.body.classList.toggle('dark-mode');
    saveData();
}

function changeStatsTab(period, el) {
    if (el) {
        document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }
    window.currentStatsFilter = period;
    renderStatsFilters();
    renderStatsData();
}

function setStatsFilter(type, value) {
    if (type === 'year') window.statsYear = value;
    if (type === 'month') window.statsMonth = value;
    if (type === 'week') window.statsWeek = value;
    renderStatsFilters();
    renderStatsData();
}

function renderStatsFilters() {
    let row1 = '';
    let row2 = '';

    const targetYears = [2026, 2027];

    if (window.currentStatsFilter === 'year') {
        targetYears.forEach(y => {
            row1 += `<div class="filter-pill ${window.statsYear === y ? 'active' : ''}" onclick="setStatsFilter('year', ${y})">${y}</div>`;
        });
    } else if (window.currentStatsFilter === 'month') {
        targetYears.forEach(y => {
            row1 += `<div class="filter-pill ${window.statsYear === y ? 'active' : ''}" onclick="setStatsFilter('year', ${y})">${y}</div>`;
        });
        window.shortMonthNames.forEach((m, index) => {
            row2 += `<div class="filter-pill ${window.statsMonth === index ? 'active' : ''}" onclick="setStatsFilter('month', ${index})">${m}</div>`;
        });
    } else if (window.currentStatsFilter === 'week') {
        window.shortMonthNames.forEach((m, index) => {
            row1 += `<div class="filter-pill ${window.statsMonth === index ? 'active' : ''}" onclick="setStatsFilter('month', ${index})">${m}</div>`;
        });
        for (let w = 1; w <= 5; w++) {
            let label = `W${w} ${window.shortMonthNames[window.statsMonth]}`;
            row2 += `<div class="filter-pill ${window.statsWeek === w ? 'active' : ''}" onclick="setStatsFilter('week', ${w})">${label}</div>`;
        }
    }

    const fr1 = document.getElementById('filter-row-1');
    const fr2 = document.getElementById('filter-row-2');
    if (fr1) fr1.innerHTML = row1;
    if (fr2) {
        fr2.innerHTML = row2;
        fr2.style.display = row2 ? 'flex' : 'none';
    }

    let periodText = "Total Spending";
    if (window.currentStatsFilter === 'year') periodText = `Spending in ${window.statsYear}`;
    if (window.currentStatsFilter === 'month') periodText = `Spending in ${window.monthNames[window.statsMonth]} ${window.statsYear}`;
    if (window.currentStatsFilter === 'week') periodText = `Spending Week ${window.statsWeek}, ${window.shortMonthNames[window.statsMonth]} ${window.statsYear}`;

    const labelEl = document.getElementById('stats-period-label');
    if (labelEl) labelEl.innerText = periodText;
}

function renderStatsData() {
    const categoryConfig = window.categoryConfig;

    let filteredTransactions = window.appData.transactions.filter(t => {
        let tDate = new Date(t.date);
        let tYear = tDate.getFullYear();
        let tMonth = tDate.getMonth();
        let tWeek = Math.ceil(tDate.getDate() / 7);

        if (window.currentStatsFilter === 'year') return tYear === window.statsYear;
        if (window.currentStatsFilter === 'month') return tYear === window.statsYear && tMonth === window.statsMonth;
        if (window.currentStatsFilter === 'week') return tYear === window.statsYear && tMonth === window.statsMonth && tWeek === window.statsWeek;
        return true;
    });

    let total = filteredTransactions.reduce((s, t) => s + parseFloat(t.amount), 0);
    const totalEl = document.getElementById('stats-total-spent');
    if (totalEl) totalEl.innerText = `RM${total.toFixed(2)}`;

    let catTotals = {};
    filteredTransactions.forEach(t => {
        catTotals[t.category] = (catTotals[t.category] || 0) + parseFloat(t.amount);
    });

    let html = '';
    Object.keys(categoryConfig).forEach(cat => {
        let spent = catTotals[cat] || 0;
        if (spent === 0) return;
        let c = categoryConfig[cat];
        let pct = Math.min((spent / (total || 1)) * 100, 100) || 0;

        html += `
        <div class="card" style="margin: 0 20px 10px; padding: 15px;">
            <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-weight:700; color:var(--text-main); font-size: 14px;">
                <div style="display:flex; align-items:center; gap: 8px;">
                    <span style="background:${c.bg}; padding: 5px; border-radius: 8px;">${c.icon}</span> ${cat}
                </div>
                <div>RM${spent.toFixed(2)}</div>
            </div>
            <div class="progress-bar" style="height: 6px;">
                <div class="progress-fill" style="width:${pct}%; background:${c.color};"></div>
            </div>
        </div>`;
    });

    if (html === '') html = '<p style="text-align:center; padding: 30px 20px; color:var(--text-sub);">No transactions for this period 🍃</p>';
    const listEl = document.getElementById('stats-category-list');
    if (listEl) listEl.innerHTML = html;
}

function renderBudgetCategory(transactions) {
    let budgetList = document.getElementById('budget-category-list');
    if (!budgetList) return;

    let currentMonth = new Date().getMonth();
    let catTotals = {};

    transactions
        .filter(t => new Date(t.date).getMonth() === currentMonth)
        .forEach(t => {
            catTotals[t.category] = (catTotals[t.category] || 0) + parseFloat(t.amount);
        });

    let html = '';
    Object.keys(window.categoryConfig).forEach(cat => {
        let spent = catTotals[cat] || 0;
        if (spent === 0) return;
        let c = window.categoryConfig[cat];
        let pct = Math.min((spent / window.appData.budget) * 100, 100) || 0;

        html += `
        <div class="card" style="margin: 0 20px 10px; padding: 15px;">
            <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-weight:700; color:var(--text-main); font-size: 14px;">
                <div>${c.icon} ${cat}</div><div>RM${spent.toFixed(2)}</div>
            </div>
            <div class="progress-bar" style="height: 6px;"><div class="progress-fill" style="width:${pct}%; background:${c.color};"></div></div>
        </div>`;
    });

    budgetList.innerHTML = html;
}

function downloadStats() {
    if (window.appData.transactions.length === 0) return alert("No data");

    let csv = "Date,Title,Category,Amount\n";
    window.appData.transactions.forEach(t => {
        csv += `${new Date(t.date).toLocaleDateString()},${t.title},${t.category},${t.amount}\n`;
    });

    let blob = new Blob([csv], { type: 'text/csv' });
    let link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "report.csv";
    link.click();
}

function saveIncome() {
    let income = document.getElementById('income-input')?.value || document.getElementById('income-amount')?.value;
    window.appData.income = income;
    saveData();
    window.dispatchEvent(new Event('studentTransactionsChanged'));
    alert('Income Saved');
    window.location.href = 'dashboard.html';
}


