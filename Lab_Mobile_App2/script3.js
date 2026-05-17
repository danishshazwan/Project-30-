 // ── Simple in-memory user store ──────────────────────────────
  // Pre-seeded demo account so you can log in right away
  const users = [
    { email: 'demo@school.edu.my', password: 'demo1234', name: 'Demo User' }
  ];
 
  let currentUser = null;
 
  // ── Tab switcher ─────────────────────────────────────────────
  function switchTab(tab, event) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form-section').forEach(f => f.classList.remove('active'));
    document.getElementById(tab).classList.add('active');
    event.target.classList.add('active');
    // Clear errors on switch
    document.querySelectorAll('.error-msg').forEach(e => e.style.display = 'none');
  }
 
  // ── Show / hide pages ────────────────────────────────────────
  function showPage(page) {
    document.getElementById('auth-page').style.display = page === 'auth' ? 'flex' : 'none';
    document.getElementById('news-page').style.display = page === 'news' ? 'block' : 'none';
  }
 
  // ── LOGIN ────────────────────────────────────────────────────
  function handleLogin() {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl  = document.getElementById('login-error');
 
    if (!email || !password) {
      errorEl.textContent = 'Please enter your email and password.';
      errorEl.style.display = 'block';
      return;
    }
 
    const user = users.find(u => u.email === email && u.password === password);
 
    if (!user) {
      errorEl.textContent = 'Incorrect email or password. Please try again.';
      errorEl.style.display = 'block';
      return;
    }
 
    errorEl.style.display = 'none';
    currentUser = user;
    document.getElementById('display-name').textContent = user.name;
    showPage('news');
  }
 
  // Allow pressing Enter to submit login
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      const loginActive = document.getElementById('login').classList.contains('active');
      const signupActive = document.getElementById('signup').classList.contains('active');
      if (loginActive) handleLogin();
      if (signupActive) handleSignup();
    }
  });
 
  // ── SIGN UP ──────────────────────────────────────────────────
  function handleSignup() {
    const firstName = document.getElementById('signup-firstname').value.trim();
    const lastName  = document.getElementById('signup-lastname').value.trim();
    const email     = document.getElementById('signup-email').value.trim();
    const password  = document.getElementById('signup-password').value;
    const confirm   = document.getElementById('signup-confirm').value;
    const errorEl   = document.getElementById('signup-error');
 
    if (!firstName || !lastName || !email || !password || !confirm) {
      errorEl.textContent = 'Please fill in all fields.';
      errorEl.style.display = 'block';
      return;
    }
    if (password.length < 8) {
      errorEl.textContent = 'Password must be at least 8 characters.';
      errorEl.style.display = 'block';
      return;
    }
    if (password !== confirm) {
      errorEl.textContent = 'Passwords do not match. Please try again.';
      errorEl.style.display = 'block';
      return;
    }
    if (users.find(u => u.email === email)) {
      errorEl.textContent = 'An account with this email already exists.';
      errorEl.style.display = 'block';
      return;
    }
 
    errorEl.style.display = 'none';
    const newUser = { email, password, name: firstName + ' ' + lastName };
    users.push(newUser);
    currentUser = newUser;
    document.getElementById('display-name').textContent = newUser.name;
    showPage('news');
  }
 
  // ── FILTER ───────────────────────────────────────────────────
  function filterCards(type, btn) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
 
    // Show/hide cards
    const cards = document.querySelectorAll('#cards-grid .card');
    let visible = 0;
    cards.forEach(card => {
      const match = type === 'all' || card.dataset.type === type;
      card.classList.toggle('hidden', !match);
      if (match) visible++;
    });
 
    // Update badge count
    document.querySelector('.header-badge').textContent = visible + ' update' + (visible !== 1 ? 's' : '');
 
    // Show empty state if needed
    document.getElementById('no-results').style.display = visible === 0 ? 'block' : 'none';
  }
 
  // ── FILTER ───────────────────────────────────────────────────
  function handleGoogleLogin() {
    // Replace this block with Firebase Google sign-in when ready
    const mockUser = { email: 'google@school.edu.my', name: 'Google User' };
    currentUser = mockUser;
    document.getElementById('display-name').textContent = mockUser.name;
    showPage('news');
  }
 
  // ── LOGOUT ───────────────────────────────────────────────────
  function handleLogout() {
    currentUser = null;
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    showPage('auth');
  }
 
  // ── INIT ─────────────────────────────────────────────────────
  showPage('auth');