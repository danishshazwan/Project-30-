/* =========================
   auth.js (from old_index.html)
========================= */

function handleLoginSignup(type) {
    let name = type === 'signup' ? document.getElementById('reg-name').value : "Student";
    let email = type === 'signup'
        ? document.getElementById('reg-email').value
        : document.getElementById('login-email').value;

    if (!email) return alert("Enter email");

    window.appData.user = { name: name || "Student", email };
    saveData();

    // Split-page flow (exact UX not possible without redesign), but keep same behavior intention:
    // signup/login -> dashboard
    window.location.href = 'dashboard.html';
}

function signup() {
    handleLoginSignup('signup');
}

function login() {
    handleLoginSignup('login');
}

function logout() {
    window.appData.user = null;
    saveData();
    window.location.href = 'index.html';
}

function loadEditProfile() {
    document.getElementById('edit-name').value = window.appData.user.name;
    document.getElementById('edit-email').value = window.appData.user.email;

    let initials = window.appData.user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    const avatarEl = document.getElementById('edit-avatar');
    if (avatarEl) avatarEl.innerText = initials;
}

function saveProfile() {
    let name = document.getElementById('edit-name').value;
    let email = document.getElementById('edit-email').value;

    if (!name || !email) return alert("Fill all fields");

    window.appData.user.name = name;
    window.appData.user.email = email;

    let file = document.getElementById('edit-image').files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function (e) {
            window.appData.user.image = e.target.result;
            saveData();
            window.location.href = 'profile.html';
        };
        reader.readAsDataURL(file);
    } else {
        saveData();
        window.location.href = 'profile.html';
    }
}

