/* =========================
   goals.js (Monthly Spending Goals Feature)
   - Monthly spending target tracker (auto from transactions)
   - Progress bar auto update (no UI redesign; uses existing markup/containers)
   - Compare current month vs previous month
   - Warning when over budget
   - Monthly analytics
   - localStorage persistence
   - Notifications integration
   ========================= */

(function () {
  const STORAGE_KEY = 'studentTrackerMonthlyGoals';

  // Back-compat: if older key exists, keep it but do not rely on its structure.
  const LEGACY_KEY = 'studentTrackerGoals';


  /** @returns {Array} */
  function loadGoals() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  /** @param {Array} goals */
  function saveGoals(goals) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    window.dispatchEvent(new Event('studentGoalsChanged'));
  }

  /** Normalize money input */
  function toNonNegNumber(value) {
    const n = Number(value);
    if (!isFinite(n)) return NaN;
    return n;
  }

  /** Compute percentage based on formula */
  function computePercentage(currentAmount, targetAmount) {
    if (!(targetAmount > 0)) return 0;
    const pct = (currentAmount / targetAmount) * 100;
    if (!isFinite(pct)) return 0;
    return Math.max(0, pct);
  }

  function monthKeyToRange(monthKey) {
    const [y, m] = String(monthKey).split('-').map((x) => parseInt(x, 10));
    if (!isFinite(y) || !isFinite(m) || m < 1 || m > 12) return null;
    const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, m, 0, 23, 59, 59, 999);
    return { start, end };
  }

  function computeMonthSpend(monthKey) {
    const range = monthKeyToRange(monthKey);
    if (!range) return 0;
    const txs = window.appData?.transactions || [];
    let sum = 0;
    for (const t of txs) {
      const dt = new Date(t.date);
      if (isNaN(dt.getTime())) continue;
      if (dt >= range.start && dt <= range.end) {
        sum += Number(t.amount) || 0;
      }
    }
    return sum;
  }


  function getGoalStatus(goal) {
    if (goal.currentAmount >= goal.targetAmount) return 'Completed';
    return 'In Progress';
  }


  function formatRM(n) {
    const num = Number(n) || 0;
    return `RM${num.toFixed(2)}`;
  }

  /** Create default goal object */
  function createGoal({ name, targetAmount, currentAmount, dueDate }) {
    return {
      id: Date.now(),
      name: String(name || '').trim(),
      targetAmount: targetAmount,
      currentAmount: currentAmount,
      dueDate: dueDate, // ISO string
      createdAt: new Date().toISOString(),
    };
  }

  /** Render goals list (no redesign; uses containers we add) */
  function renderGoals() {
    const list = document.getElementById('goals-list');
    const totals = document.getElementById('goals-summary');
    if (!list) return;

    const goals = loadGoals();

    if (totals) {
      const completed = goals.filter((g) => g.currentAmount >= g.targetAmount).length;
      totals.innerText = `${completed} completed • ${goals.length} total`;
    }

    if (goals.length === 0) {
      list.innerHTML = '<p style="color: var(--text-sub); text-align:center; margin: 10px 0;">No goals yet. Create one above.</p>';
      return;
    }

    list.innerHTML = goals
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((g) => {
        const pctRaw = computePercentage(g.currentAmount, g.targetAmount);
        const pct = Math.min(pctRaw, 100);
        const status = getGoalStatus(g);

        let statusColor = 'var(--primary)';
        if (status === 'Completed') statusColor = 'var(--success-text)';
        if (status === 'Overdue') statusColor = 'var(--danger-text)';

        const dueText = g.dueDate ? new Date(g.dueDate).toLocaleDateString() : '-';

        return `
          <div class="card" style="margin: 0 0 15px; padding: 16px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap: 12px;">
              <div style="flex:1;">
                <div style="font-weight:900; color:var(--text-main); font-size: 15px; margin-bottom: 6px;">${escapeHtml(g.name)}</div>
                <div style="font-size: 13px; color: var(--text-sub); margin-bottom: 6px;">Target: ${formatRM(g.targetAmount)} • Due: ${escapeHtml(dueText)}</div>
                <div style="font-size: 13px; color: var(--text-sub); margin-bottom: 10px;">Saved: <b style="color:var(--text-main)">${formatRM(g.currentAmount)}</b></div>
              </div>
              <div style="flex:0 0 auto; text-align:right;">
                <div style="font-size: 12px; color: ${statusColor}; font-weight: 900; margin-bottom: 8px;">${status}</div>
                <div style="font-size: 12px; color: var(--text-sub); font-weight: 700;">${pct.toFixed(2)}%</div>
              </div>
            </div>

            <div class="progress-bar" style="height: 7px; margin-top: 6px;">
              <div class="progress-fill" style="width:${pct}%; background: var(--primary);"></div>
            </div>

            <div style="display:flex; gap: 10px; margin-top: 12px; flex-wrap: wrap;">
              <button type="button" class="btn" style="width:auto; flex:1; background: var(--primary); color:white; padding: 12px 14px; border:none; border-radius: 14px; margin-bottom:0;" onclick="window.addContributionToGoal(${g.id})">Add Contribution</button>
              <button type="button" class="btn" style="width:auto; flex:1; background: var(--card-bg); color: var(--primary); border: 2px solid var(--primary-light); padding: 12px 14px; border-radius: 14px; margin-bottom:0;" onclick="window.editGoal(${g.id})">Edit</button>
              <button type="button" class="btn" style="width:auto; flex:1; background: var(--danger-bg); color: var(--danger-text); border:none; padding: 12px 14px; border-radius: 14px; margin-bottom:0;" onclick="window.deleteGoal(${g.id})">Delete</button>
            </div>
          </div>
        `;
      })
      .join('');
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '<')
      .replaceAll('>', '>')
      .replaceAll('"', '"')
      .replaceAll("'", '&#039;');
  }

  /** Create goal handler from form */
  function handleCreateGoalFromForm() {
    const monthEl = document.getElementById('goal-month');
    const targetEl = document.getElementById('goal-target');

    if (!monthEl || !targetEl) return;

    const monthKey = String(monthEl.value || '').trim(); // YYYY-MM
    const targetAmount = toNonNegNumber(targetEl.value);

    if (!monthKey) return alert('Please select a month');
    if (!/^[0-9]{4}-[0-9]{2}$/.test(monthKey)) return alert('Invalid month format');
    if (!isFinite(targetAmount) || targetAmount <= 0) return alert('Target amount must be more than RM0');

    const [y, m] = monthKey.split('-').map((x) => parseInt(x, 10));
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);

    const goals = loadGoals();

    const idx = goals.findIndex((g) => g.monthKey === monthKey);
    const currentAmount = computeMonthSpend(monthKey);

    const goal = {
      id: idx >= 0 ? goals[idx].id : Date.now(),
      name: monthKey,
      monthKey,
      targetAmount,
      currentAmount,
      createdAt: idx >= 0 ? goals[idx].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (idx >= 0) goals[idx] = goal;
    else goals.push(goal);

    saveGoals(goals);

    monthEl.value = '';
    targetEl.value = '';
  }


  /** Public: edit monthly goal target (currentAmount is auto-calculated) */
  function editGoal(id) {
    const goals = loadGoals();
    const g = goals.find((x) => x.id === id);
    if (!g) return alert('Goal not found');

    const monthKey = g.monthKey || g.name; // legacy fallback
    const targetAmountStr = prompt('Target amount (RM):', String(g.targetAmount));
    if (targetAmountStr === null) return;
    const targetAmount = toNonNegNumber(targetAmountStr);
    if (!isFinite(targetAmount) || targetAmount <= 0) return alert('Target amount must be more than RM0');

    g.targetAmount = targetAmount;
    g.currentAmount = computeMonthSpend(monthKey);
    g.updatedAt = new Date().toISOString();
    g.monthKey = monthKey;
    g.name = monthKey;

    saveGoals(goals);
  }


  /** Public: delete goal */
  function deleteGoal(id) {
    if (!confirm('Delete this goal?')) return;
    const goals = loadGoals().filter((x) => x.id !== id);
    saveGoals(goals);
  }

  /** Public: add contribution (UI compatibility no-op)
   * Monthly goals are auto-tracked from real transactions.
   */
  function addContributionToGoal(id) {
    const goals = loadGoals();
    const g = goals.find((x) => x.id === id);
    if (!g) return;

    alert('This is auto-tracked from your expenses. Add/update expenses for this month to change progress.');
  }


  function maybeRenderGoalMonthComparison() {
    const el = document.getElementById('goal-compare-text');
    if (!el) return;

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;

    const currentSpend = computeMonthSpend(currentMonthKey);
    const prevSpend = computeMonthSpend(prevMonthKey);

    const diff = currentSpend - prevSpend;
    const diffText = diff === 0 ? 'same as last month' : diff > 0 ? `+${formatRM(diff)} vs last month` : `-${formatRM(Math.abs(diff))} vs last month`;

    el.innerText = `This month: ${formatRM(currentSpend)} (${diffText})`;
  }

  /** Wire init */
  function initGoalsPage() {
    // expose handlers for inline onclick
    window.addGoal = window.addGoal || handleCreateGoalFromForm;
    window.editGoal = window.editGoal || editGoal;
    window.deleteGoal = window.deleteGoal || deleteGoal;
    window.addContributionToGoal = window.addContributionToGoal || addContributionToGoal;

    // Button mapping (if exists)
    const createBtn = document.getElementById('create-goal-btn');
    if (createBtn) {
      createBtn.onclick = handleCreateGoalFromForm;
    }

    renderGoals();
    maybeRenderGoalMonthComparison();
  }



  // Auto re-render on changes
  window.addEventListener('studentGoalsChanged', () => {
    if (document.getElementById('goals-page')) renderGoals();
  });

  // Start on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGoalsPage);
  } else {
    initGoalsPage();
  }

  // Expose init in case app.js wants it
  window.initGoalsPage = initGoalsPage;
})();

