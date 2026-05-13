/* =========================
   reports.js (Functional Reports Feature)
   - Dynamic reports from real transaction & savings data
   - Chart.js integration (expense by category)
   - Filters: Daily / Weekly / Monthly / Yearly
   - Auto update on new transactions/savings
   ========================= */

(function () {
  const CHART_COLORS = [
    'rgba(79,70,229,0.9)',
    'rgba(16,185,129,0.9)',
    'rgba(249,115,22,0.9)',
    'rgba(59,130,246,0.9)',
    'rgba(139,92,246,0.9)',
  ];

  const STORAGE_KEY = 'studentTrackerReportsCache';

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '<')
      .replaceAll('>', '>')
      .replaceAll('"', '"')
      .replaceAll("'", '&#039;');
  }

  function formatRM(n) {
    const num = Number(n) || 0;
    return `RM${num.toFixed(2)}`;
  }

  function safeParseReportsCache() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveReportsCache(obj) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch {
      // ignore
    }
  }

  // date helpers
  function parseDate(d) {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  }

  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function endOfDay(d) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  }

  function startOfWeekMonday(d) {
    // Monday-based week: Mon..Sun
    const x = startOfDay(d);
    const day = x.getDay(); // 0=Sun..6=Sat
    const diffToMonday = (day === 0 ? -6 : 1 - day);
    x.setDate(x.getDate() + diffToMonday);
    return x;
  }

  function endOfWeekMonday(d) {
    const start = startOfWeekMonday(d);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return endOfDay(end);
  }

  /** filter transactions by period */
  function filterByPeriod(transactions, period, anchorDate = new Date()) {
    const now = anchorDate;

    return transactions.filter((t) => {
      const dt = parseDate(t.date);
      if (!dt) return false;

      if (period === 'daily') {
        return dt >= startOfDay(now) && dt <= endOfDay(now);
      }

      if (period === 'weekly') {
        const start = startOfWeekMonday(now);
        const end = endOfWeekMonday(now);
        return dt >= start && dt <= end;
      }

      if (period === 'monthly') {
        return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
      }

      if (period === 'yearly') {
        return dt.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }


  function loadSavingsTotal() {
    try {
      const raw = localStorage.getItem('studentTrackerSavings');
      if (!raw) return 0;
      const obj = JSON.parse(raw);
      return Number(obj?.current) || 0;
    } catch {
      return 0;
    }
  }

  function getHighestSpendingCategory(transactions, categoryConfig) {
    const totals = {};
    transactions.forEach((t) => {
      const cat = t.category;
      totals[cat] = (totals[cat] || 0) + Number(t.amount) || 0;
    });

    let best = null;
    let bestAmount = -Infinity;
    Object.keys(totals).forEach((cat) => {
      const val = totals[cat];
      if (val > bestAmount) {
        bestAmount = val;
        best = cat;
      }
    });

    if (!best) return { category: '-', amount: 0 };
    return { category: best, amount: totals[best] || 0, color: categoryConfig?.[best]?.color };
  }

  function computeMonthlyWeeklySummary(transactions) {
    // Monthly summary = current month.
    // Weekly summary = current week (Mon..Sun).
    const now = new Date();

    const monthlyTotal = filterByPeriod(transactions, 'monthly', now).reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const weeklyTotal = filterByPeriod(transactions, 'weekly', now).reduce((s, t) => s + (Number(t.amount) || 0), 0);

    return { monthlyTotal, weeklyTotal };
  }


  let chartInstance = null;

  function renderExpenseCategoryChart(expenseByCat) {
    const canvas = document.getElementById('reports-chart');

    // Always destroy previous chart to avoid stale chart when filter changes
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }

    if (!canvas || typeof Chart === 'undefined') return;


    const categories = expenseByCat.map((x) => x.category);
    const values = expenseByCat.map((x) => x.amount);

    const bgColors = categories.map((cat, idx) => {
      const c = window.categoryConfig?.[cat];
      return c?.color ? `rgba(${hexToRgb(c.color).join(',')},0.85)` : CHART_COLORS[idx % CHART_COLORS.length];
    });

    const data = {
      labels: categories,
      datasets: [
        {
          label: 'Expenses',
          data: values,
          backgroundColor: bgColors,
          borderWidth: 0,
          borderRadius: 12,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${formatRM(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#6b7280', maxRotation: 0, autoSkip: false },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: {
            color: '#6b7280',
            callback: (v) => `RM${v}`,
          },
        },
      },
    };

    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data,
      options,
    });
  }

  function hexToRgb(hex) {
    const h = String(hex).replace('#', '').trim();
    if (h.length === 3) {
      const r = parseInt(h[0] + h[0], 16);
      const g = parseInt(h[1] + h[1], 16);
      const b = parseInt(h[2] + h[2], 16);
      return [r, g, b];
    }
    if (h.length === 6) {
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return [r, g, b];
    }
    return [79, 70, 229];
  }

  function computeReportsForPeriod(period) {
    const transactions = window.appData?.transactions || [];
    const income = Number(window.appData?.income) || 0;
    const categoryConfig = window.categoryConfig || {};

    const filteredExpenses = filterByPeriod(transactions, period);

    const totalExpenses = filteredExpenses.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const totalIncome = income; // requirement says total income; in this app income is monthly input; keep as real stored value
    const totalSavings = loadSavingsTotal();

    const highest = getHighestSpendingCategory(filteredExpenses, categoryConfig);

    const { monthlyTotal, weeklyTotal } = computeMonthlyWeeklySummary(transactions);

    // Expense by category for chart + analytics
    const totalsByCat = {};
    filteredExpenses.forEach((t) => {
      const cat = t.category;
      totalsByCat[cat] = (totalsByCat[cat] || 0) + (Number(t.amount) || 0);
    });

    const expenseByCat = Object.keys(totalsByCat)
      .map((cat) => ({ category: cat, amount: totalsByCat[cat] }))
      .sort((a, b) => b.amount - a.amount);

    return {
      period,
      totalIncome,
      totalExpenses,
      totalSavings,
      highestSpendingCategory: highest,
      monthlySummary: monthlyTotal,
      weeklySummary: weeklyTotal,
      expenseByCat,
    };
  }

  function setFilterButtonsActive(period) {
    const btns = document.querySelectorAll('[data-report-period]');
    btns.forEach((b) => {
      const p = b.getAttribute('data-report-period');
      if (p === period) b.classList.add('active');
      else b.classList.remove('active');
    });
  }


  function renderReports() {
    if (!document.getElementById('reports-page')) return;

    const period = window.__activeReportPeriod || 'monthly';

    const reports = computeReportsForPeriod(period);


    // summary fields (containers we add)
    const elIncome = document.getElementById('report-total-income');
    const elExpenses = document.getElementById('report-total-expenses');
    const elSavings = document.getElementById('report-total-savings');
    const elHighest = document.getElementById('report-highest-category');
    const elMonthly = document.getElementById('report-monthly-summary');
    const elWeekly = document.getElementById('report-weekly-summary');
    const list = document.getElementById('report-category-analytics');

    if (elIncome) elIncome.innerText = formatRM(reports.totalIncome);
    if (elExpenses) elExpenses.innerText = formatRM(reports.totalExpenses);
    if (elSavings) elSavings.innerText = formatRM(reports.totalSavings);
    if (elHighest) elHighest.innerText = `${reports.highestSpendingCategory.category} (${formatRM(reports.highestSpendingCategory.amount)})`;
    if (elMonthly) elMonthly.innerText = formatRM(reports.monthlySummary);
    if (elWeekly) elWeekly.innerText = formatRM(reports.weeklySummary);

    if (list) {
      if (!reports.expenseByCat.length) {
        list.innerHTML = '<p style="color: var(--text-sub); text-align:center; margin: 10px 0;">No expenses for this period.</p>';
      } else {
        const total = reports.expenseByCat.reduce((s, x) => s + x.amount, 0) || 1;
        list.innerHTML = reports.expenseByCat
          .slice(0, 8)
          .map((x, idx) => {
            const c = window.categoryConfig?.[x.category];
            const bg = c?.bg || 'var(--card-bg)';
            const color = c?.color || 'var(--primary)';
            const icon = c?.icon || '💳';
            const pct = Math.min((x.amount / total) * 100, 100);
            return `
              <div class="card" style="margin: 0 0 12px; padding: 14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                  <div style="display:flex; align-items:center; gap: 10px;">
                    <span style="background:${bg}; padding: 6px; border-radius: 10px;">${icon}</span>
                    <div style="font-weight:900; color:var(--text-main); font-size: 13px;">${escapeHtml(x.category)}</div>
                  </div>
                  <div style="font-weight:900; color:var(--text-main); font-size: 13px;">${formatRM(x.amount)}</div>
                </div>
                <div class="progress-bar" style="height:6px;"><div class="progress-fill" style="width:${pct}%; background:${color};"></div></div>
              </div>
            `;
          })
          .join('');
      }
    }

    // Chart (expense by category)
    renderExpenseCategoryChart(reports.expenseByCat);

    saveReportsCache({ last: reports, cachedAt: Date.now() });
  }

  function setPeriod(period, btnEl) {
    window.__activeReportPeriod = period;

    // Always sync UI active state (avoid relying on inline class only)
    setFilterButtonsActive(period);

    // Some browsers may not add/remove classes if inline onclick passes stale element.
    // Ensure clicked button also gets active class.
    if (btnEl && btnEl.classList) btnEl.classList.add('active');

    renderReports();
  }



  function initReportsPage() {
    // expose for inline onclick (override to ensure latest implementation)
    window.setReportPeriod = setPeriod;

    // default active if none
    const active = document.querySelector('[data-report-period].active');
    const fallback = document.querySelector('[data-report-period="monthly"]');

    const initialPeriod = active
      ? active.getAttribute('data-report-period')
      : (fallback ? fallback.getAttribute('data-report-period') : 'monthly');

    window.__activeReportPeriod = initialPeriod || 'monthly';
    setFilterButtonsActive(window.__activeReportPeriod);

    // keep any inline active classes consistent
    if (active && active.classList) active.classList.add('active');

    renderReports();
  }


  window.addEventListener('studentTransactionsChanged', () => {
    if (document.getElementById('reports-page')) renderReports();
  });

  window.addEventListener('studentSavingsChanged', () => {
    if (document.getElementById('reports-page')) renderReports();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initReportsPage);
  else initReportsPage();

  window.initReportsPage = initReportsPage;
})();

