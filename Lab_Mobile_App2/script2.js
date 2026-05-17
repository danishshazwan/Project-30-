/* ================================================================
   lumut_storage.js  —  localStorage helpers for Lumut Dash
   All keys are namespaced "ld:" to avoid collisions.
   ================================================================ */

const Storage = (function () {
  const NS = 'ld:';

  function _key(k)      { return NS + k; }
  function _set(k, v)   { localStorage.setItem(_key(k), JSON.stringify(v)); }
  function _get(k)      { try { return JSON.parse(localStorage.getItem(_key(k))); } catch { return null; } }
  function _del(k)      { localStorage.removeItem(_key(k)); }

  /* ── Users ──────────────────────────────────────────────── */
  const DEMO = [{ email: 'demo@school.edu.my', password: 'demo1234', name: 'Demo User', memberSince: new Date().toISOString(), sessions: 0, articlesRead: 0 }];

  function getUsers()        { return _get('users') || DEMO; }
  function saveUsers(u)      { _set('users', u); }
  function findUser(email)   { return getUsers().find(u => u.email === email) || null; }

  function registerUser(first, last, email, password) {
    const users = getUsers();
    if (users.find(u => u.email === email)) return { ok: false, error: 'An account with this email already exists.' };
    users.push({ email, password, name: first + ' ' + last, memberSince: new Date().toISOString(), sessions: 0, articlesRead: 0 });
    saveUsers(users);
    return { ok: true };
  }

  function verifyLogin(email, password) {
    const u = findUser(email);
    return (u && u.password === password) ? u : null;
  }

  function bumpSession(email) {
    const users = getUsers();
    const i = users.findIndex(u => u.email === email);
    if (i !== -1) {
      users[i].sessions   = (users[i].sessions  || 0) + 1;
      users[i].lastLogin  = new Date().toISOString();
      if (!users[i].memberSince) users[i].memberSince = new Date().toISOString();
      saveUsers(users);
    }
  }

  /* ── Session ────────────────────────────────────────────── */
  function saveSession(user)  { _set('session', { email: user.email, name: user.name }); }
  function loadSession()      { return _get('session'); }
  function clearSession()     { _del('session'); }

  /* ── Filter preference ──────────────────────────────────── */
  function saveFilter(t)  { _set('filter', t); }
  function loadFilter()   { return _get('filter') || 'all'; }

  /* ── Preferences ────────────────────────────────────────── */
  const PREF_DEFAULTS = {
    role: 'student', avatar: '🎓', bio: '',
    notifyNews: true, notifyEvents: true, notifyNotices: true,
    compactCards: false, showAvatars: true, language: 'en',
  };
  function getPrefs()         { return Object.assign({}, PREF_DEFAULTS, _get('prefs') || {}); }
  function savePrefs(p)       { _set('prefs', p); }
  function setPref(key, val)  { const p = getPrefs(); p[key] = val; savePrefs(p); }
  function resetPrefs()       { _del('prefs'); }

  /* ── Feedback submissions ───────────────────────────────── */
  function saveFeedback(entry) {
    const all = _get('feedback') || [];
    all.push({ ...entry, id: Date.now(), date: new Date().toISOString() });
    _set('feedback', all);
  }
  function getFeedback() { return _get('feedback') || []; }

  /* ── Calendar events ────────────────────────────────────── */
  const DEFAULT_EVENTS = [
    { id: 1, date: '2026-05-20', title: 'Sports Day', type: 'event' },
    { id: 2, date: '2026-06-01', title: 'Exam Week Begins', type: 'notice' },
    { id: 3, date: '2026-06-10', title: 'Art Exhibition', type: 'event' },
    { id: 4, date: '2026-07-04', title: 'School Holiday', type: 'notice' },
    { id: 5, date: '2026-05-08', title: 'Science Fair', type: 'news' },
  ];
  function getCalEvents()       { return _get('calEvents') || DEFAULT_EVENTS; }
  function saveCalEvents(evts)  { _set('calEvents', evts); }

  /* ── Contact messages ───────────────────────────────────── */
  function saveContact(msg) {
    const all = _get('contacts') || [];
    all.push({ ...msg, id: Date.now(), date: new Date().toISOString() });
    _set('contacts', all);
  }

  /* ── Public API ─────────────────────────────────────────── */
  return {
    getUsers, saveUsers, findUser, registerUser, verifyLogin, bumpSession,
    saveSession, loadSession, clearSession,
    saveFilter, loadFilter,
    getPrefs, savePrefs, setPref, resetPrefs,
    saveFeedback, getFeedback,
    getCalEvents, saveCalEvents,
    saveContact,
  };
})();