/* =========================
   savings.js (Multiple Savings Goals Feature)
   - Multiple savings goals with purpose/category
   - Deposit & withdraw
   - Savings progress tracking
   - Activity/history log
   - Real-time dashboard update
   - localStorage persistence
   - Notifications integration
   ========================= */

(function () {
  const STORAGE_KEY_SAVINGS_GOALS = 'studentTrackerSavingsGoals';
  const STORAGE_KEY_SAVINGS_HISTORY = 'studentTrackerSavingsHistoryV2';

  // Back-compat: legacy single savings storage
  const LEGACY_CURRENT_KEY = 'studentTrackerSavings';
  const LEGACY_HISTORY_KEY = 'studentTrackerSavingsHistory';


  // ---- Unified multi-goal savings model ----
  // Storage format:
  // studentTrackerSavingsGoals: { goals: [{id,name,purpose,targetAmount,currentAmount,createdAt,updatedAt}] }
  // studentTrackerSavingsHistoryV2: [{id,goalId,type,amount,dateTime,purpose,name}] (amount is always positive; type decides sign)

  function loadSavingsGoals() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SAVINGS_GOALS);
      const obj = raw ? JSON.parse(raw) : null;
      const goals = obj?.goals;
      return Array.isArray(goals) ? goals : [];
    } catch {
      return [];
    }
  }

  function saveSavingsGoals(goals) {
    localStorage.setItem(STORAGE_KEY_SAVINGS_GOALS, JSON.stringify({ goals }));
    window.dispatchEvent(new Event('studentSavingsChanged'));
  }

  function loadSavingsHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SAVINGS_HISTORY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveSavingsHistory(history) {
    localStorage.setItem(STORAGE_KEY_SAVINGS_HISTORY, JSON.stringify(history));
    window.dispatchEvent(new Event('studentSavingsChanged'));
  }

  function normalizeToMoney(value) {
    const n = Number(value);
    if (!isFinite(n)) return NaN;
    return n;
  }

  function ensureLegacyMigratedOnce() {
    // If legacy storage exists and v2 is empty, migrate it into a single goal.
    try {
      const migratedFlagKey = 'studentTrackerSavingsMigratedV2';
      const already = localStorage.getItem(migratedFlagKey);
      if (already) return;

      const goalsV2 = loadSavingsGoals();
      if (goalsV2.length > 0) {
        localStorage.setItem(migratedFlagKey, '1');
        return;
      }

      const legacyRaw = localStorage.getItem(LEGACY_CURRENT_KEY);
      const legacyHistRaw = localStorage.getItem(LEGACY_HISTORY_KEY);
      const legacyCurrent = legacyRaw ? JSON.parse(legacyRaw)?.current : null;
      const legacyHistory = legacyHistRaw ? JSON.parse(legacyHistRaw) : null;

      const legacyCurrentNum = typeof legacyCurrent === 'number' ? legacyCurrent : 0;

      if (legacyCurrentNum > 0 || Array.isArray(legacyHistory) || legacyHistRaw) {
        const now = new Date().toISOString();
        const goal = {
          id: Date.now(),
          name: 'My Savings',
          purpose: 'Others',
          targetAmount: 0,
          currentAmount: legacyCurrentNum,
          createdAt: now,
          updatedAt: now,
        };
        const v2History = (Array.isArray(legacyHistory) ? legacyHistory : []).map((h) => ({
          id: h.id || Date.now(),
          goalId: goal.id,
          type: h.type === 'add' ? 'add' : h.type === 'withdraw' ? 'withdraw' : 'reset',
          amount: Number(h.amount) || 0,
          dateTime: h.dateTime || now,
          purpose: goal.purpose,
          name: goal.name,
        }));

        saveSavingsGoals([goal]);
        saveSavingsHistory(v2History);
      }

      localStorage.setItem(migratedFlagKey, '1');
    } catch {
      // ignore
    }
  }


  // ---- Multi-goal savings storage + operations ----
  // This module fully owns the savings UI logic via prompt/onclick handlers,
  // while keeping the existing HTML IDs untouched.

  function getAllSavingsGoals() {
    ensureLegacyMigratedOnce();
    return loadSavingsGoals();
  }

  function setAllSavingsGoals(goals) {
    saveSavingsGoals(goals);
  }

  function listSavingsForPurpose(purpose) {
    const goals = getAllSavingsGoals();
    if (!purpose) return goals;
    const p = String(purpose).trim().toLowerCase();
    return goals.filter((g) => String(g.purpose || '').trim().toLowerCase() === p);
  }

  function getSavingsTotalsByRange(history, rangeFn) {
    let totalAdded = 0;
    for (const h of history) {
      if (h.type !== 'add') continue;
      const dt = new Date(h.dateTime);
      if (!dt || isNaN(dt.getTime())) continue;
      if (!rangeFn(dt)) continue;
      totalAdded += Number(h.amount) || 0;
    }
    return totalAdded;
  }

  function computeSavingsDashboardTotals() {
    const goals = getAllSavingsGoals();
    const history = loadSavingsHistory();
    const now = new Date();

    const totalSavings = goals.reduce((s, g) => s + (Number(g.currentAmount) || 0), 0);

    const monthlySavings = getSavingsTotalsByRange(history, (dt) => isSameMonth(dt, now));

    const weeklySavings = getSavingsTotalsByRange(history, (dt) => {
      return isSameMonth(dt, now) && getWeekIndex(dt) === getWeekIndex(now) && dt.getFullYear() === now.getFullYear();
    });

    return { totalSavings, monthlySavings, weeklySavings, history, goals };
  }


  function updateGoalCurrentAmount(goal, newCurrent) {
    goal.currentAmount = Math.max(0, Number(newCurrent) || 0);
    goal.updatedAt = new Date().toISOString();
  }

  function persistHistoryAndDispatch(history) {
    saveSavingsHistory(history);
  }

  function addSavingsHistoryEntry({ goalId, type, amount, purpose, name }) {
    const history = loadSavingsHistory();
    history.push({
      id: Date.now(),
      goalId,
      type,
      amount: Math.abs(Number(amount) || 0),
      dateTime: new Date().toISOString(),
      purpose,
      name,
    });
    persistHistoryAndDispatch(history);
    return history;
  }


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

  function isSameMonth(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  }

  function getWeekIndex(d) {
    // simple week-of-month compatible-ish with existing stats approach
    return Math.ceil(d.getDate() / 7);
  }

  function getActiveSavingsGoal() {
    const name = document.getElementById('savings-name')?.value?.trim?.() || '';
    const purpose = document.getElementById('savings-purpose')?.value?.trim?.() || '';
    const target = document.getElementById('savings-target')?.value?.trim?.() || '';
    const current = document.getElementById('savings-current')?.value?.trim?.() || '';

    // Prefer explicit active goal id stored in-memory.
    const explicitId = window.__activeSavingsGoalId;
    const goals = getAllSavingsGoals();
    if (explicitId) {
      const byId = goals.find((g) => g.id === explicitId);
      if (byId) return byId;
    }

    // Try match by purpose/category first.
    if (purpose) {
      const byPurpose = goals.slice().sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      const found = byPurpose.find((g) => String(g.purpose || '').trim().toLowerCase() === String(purpose).trim().toLowerCase());
      if (found) return found;
    }

    // Then match by name.
    if (name) {
      const byName = goals.slice().sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      const found = byName.find((g) => String(g.name || '').trim().toLowerCase() === String(name).trim().toLowerCase());
      if (found) return found;
    }

    // If user filled inputs and there is no goal, create one.
    if (name || purpose) {
      const now = new Date().toISOString();
      const parsedTarget = normalizeToMoney(target);
      const parsedCurrent = normalizeToMoney(current);

      const targetAmount = isFinite(parsedTarget) && parsedTarget >= 0 ? parsedTarget : 0;
      const initialCurrent = isFinite(parsedCurrent) && parsedCurrent >= 0 ? parsedCurrent : 0;

      const goalsNow = getAllSavingsGoals();
      const newGoal = {
        id: Date.now(),
        name: name || 'Savings',
        purpose: purpose || 'Others',
        targetAmount,
        currentAmount: initialCurrent,
        createdAt: now,
        updatedAt: now,
      };

      goalsNow.push(newGoal);
      setAllSavingsGoals(goalsNow);
      window.__activeSavingsGoalId = newGoal.id;
      return newGoal;
    }

    return null;
  }

  function computeTotals() {
    const { goals, history } = computeSavingsDashboardTotals();

    // Savings shown are total current, monthly/weekly totals based on history additions only.
    // (Matches previous behavior and keeps current UI stable.)
    const totalSavings = goals.reduce((s, g) => s + (Number(g.currentAmount) || 0), 0);

    const now = new Date();
    const monthlySavings = getSavingsTotalsByRange(history, (dt) => isSameMonth(dt, now));
    const weeklySavings = getSavingsTotalsByRange(history, (dt) => {
      return isSameMonth(dt, now) && getWeekIndex(dt) === getWeekIndex(now) && dt.getFullYear() === now.getFullYear();
    });

    return { totalSavings, monthlySavings, weeklySavings, history };
  }


  function renderSavings() {
    if (!document.getElementById('savings-page')) return;

    const totalEl = document.getElementById('savings-total');
    const monthlyEl = document.getElementById('savings-monthly');
    const weeklyEl = document.getElementById('savings-weekly');
    const historyEl = document.getElementById('savings-history');

    const { totalSavings, monthlySavings, weeklySavings, history } = computeTotals();

    if (totalEl) totalEl.innerText = formatRM(totalSavings);
    if (monthlyEl) monthlyEl.innerText = formatRM(monthlySavings);
    if (weeklyEl) weeklyEl.innerText = formatRM(weeklySavings);

    if (!historyEl) return;

    const activePurpose = document.getElementById('savings-purpose')?.value?.trim?.();

    const shownHistory = activePurpose
      ? history.filter((h) => String(h.purpose || '').trim().toLowerCase() === String(activePurpose).trim().toLowerCase())
      : history;

    if (!shownHistory.length) {
      historyEl.innerHTML = '<p style="color: var(--text-sub); text-align:center; margin: 10px 0;">No savings activity yet.</p>';
      return;
    }

    historyEl.innerHTML = shownHistory
      .slice()
      .reverse()
      .map((h) => {
        const dt = new Date(h.dateTime);
        const dtText = isNaN(dt.getTime()) ? h.dateTime : dt.toLocaleString();
        const amountText = h.type === 'withdraw' ? `-${formatRM(h.amount)}` : h.type === 'reset' ? formatRM(h.amount) : `+${formatRM(h.amount)}`;
        const typeColor =
          h.type === 'add' ? 'var(--success-text)' : h.type === 'withdraw' ? 'var(--danger-text)' : 'var(--text-main)';

        return `
          <div class="card" style="margin: 0 0 12px; padding: 14px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap: 12px;">
              <div>
                <div style="font-weight: 900; color: var(--text-main); font-size: 14px;">${escapeHtml(h.type.toUpperCase())}</div>
                <div style="font-size: 12px; color: var(--text-sub); margin-top: 4px;">${escapeHtml(dtText)}</div>
              </div>
              <div style="font-weight: 900; color: ${typeColor};">${escapeHtml(amountText)}</div>
            </div>
          </div>
        `;
      })
      .join('');
  }


  function addSavings() {
    const goal = getActiveSavingsGoal();
    if (!goal) return alert('Please enter Savings Name/Title and Purpose/Category');

    const amountStr = prompt('Add savings amount (RM):', '0');
    if (amountStr === null) return;
    const amount = normalizeToMoney(amountStr);
    if (!isFinite(amount) || amount <= 0) return alert('Amount must be > 0');

    goal.currentAmount = Number(goal.currentAmount || 0) + amount;
    goal.updatedAt = new Date().toISOString();

    const goals = getAllSavingsGoals();
    const idx = goals.findIndex((g) => g.id === goal.id);
    if (idx >= 0) goals[idx] = goal;
    else goals.push(goal);
    setAllSavingsGoals(goals);

    addSavingsHistoryEntry({
      goalId: goal.id,
      type: 'add',
      amount,
      purpose: goal.purpose,
      name: goal.name,
    });

    if (typeof window.addNotification === 'function') {
      window.addNotification({ title: 'Savings updated ✅', message: `Added RM${amount.toFixed(2)} to ${goal.name}`, type: 'success' });
    }

    renderSavings();
  }

  function withdrawSavings() {
    const goal = getActiveSavingsGoal();
    if (!goal) return alert('Please enter Savings Name/Title and Purpose/Category');

    const amountStr = prompt('Withdraw savings amount (RM):', '0');
    if (amountStr === null) return;
    const amount = normalizeToMoney(amountStr);
    if (!isFinite(amount) || amount <= 0) return alert('Amount must be > 0');

    const newCurrent = Number(goal.currentAmount || 0) - amount;
    if (newCurrent < 0) return alert('Insufficient savings');

    goal.currentAmount = newCurrent;
    goal.updatedAt = new Date().toISOString();

    const goals = getAllSavingsGoals();
    const idx = goals.findIndex((g) => g.id === goal.id);
    if (idx >= 0) goals[idx] = goal;
    else goals.push(goal);
    setAllSavingsGoals(goals);

    addSavingsHistoryEntry({
      goalId: goal.id,
      type: 'withdraw',
      amount,
      purpose: goal.purpose,
      name: goal.name,
    });

    if (typeof window.addNotification === 'function') {
      window.addNotification({ title: 'Savings updated 🔄', message: `Withdrew RM${amount.toFixed(2)} from ${goal.name}`, type: 'warning' });
    }

    renderSavings();
  }

  function resetSavings() {
    const goal = getActiveSavingsGoal();
    if (!goal) return alert('Please enter Savings Name/Title and Purpose/Category');

    if (!confirm('Reset savings to RM0 for this goal? This will also record activity log.')) return;

    const amount = Number(goal.currentAmount || 0);

    if (amount <= 0) return;

    goal.currentAmount = 0;
    goal.updatedAt = new Date().toISOString();

    const goals = getAllSavingsGoals();
    const idx = goals.findIndex((g) => g.id === goal.id);
    if (idx >= 0) goals[idx] = goal;
    else goals.push(goal);
    setAllSavingsGoals(goals);

    addSavingsHistoryEntry({
      goalId: goal.id,
      type: 'reset',
      amount,
      purpose: goal.purpose,
      name: goal.name,
    });

    if (typeof window.addNotification === 'function') {
      window.addNotification({ title: 'Savings reset 🧹', message: `Reset ${goal.name} to RM0.00`, type: 'warning' });
    }

    renderSavings();
  }


  function initSavingsPage() {
    window.addSavings = window.addSavings || addSavings;
    window.withdrawSavings = window.withdrawSavings || withdrawSavings;
    window.resetSavings = window.resetSavings || resetSavings;

    const addBtn = document.getElementById('add-savings-btn');
    const withdrawBtn = document.getElementById('withdraw-savings-btn');
    const resetBtn = document.getElementById('reset-savings-btn');

    if (addBtn) addBtn.onclick = addSavings;
    if (withdrawBtn) withdrawBtn.onclick = withdrawSavings;
    if (resetBtn) resetBtn.onclick = resetSavings;

    renderSavings();
  }

  window.addEventListener('studentSavingsChanged', () => {
    if (document.getElementById('savings-page')) renderSavings();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSavingsPage);
  else initSavingsPage();

  window.initSavingsPage = initSavingsPage;
})();

