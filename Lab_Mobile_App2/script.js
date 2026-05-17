/* ================================================================
   lumut_app.js  —  Shared jQuery logic for Lumut Dash
   Depends on:  jQuery 3.x  +  lumut_storage.js
   ================================================================ */

$(function () {

  /* ── Highlight active nav link ────────────────────────────── */
  const page = window.location.pathname.split('/').pop() || 'index.html';
  $('.nav-link').each(function () {
    if ($(this).attr('href') === page) $(this).addClass('active');
  });

  /* ── Auth tabs ────────────────────────────────────────────── */
  $(document).on('click', '.tab', function () {
    const target = $(this).data('tab');
    if (!target) return;
    $('.tab').removeClass('active');
    $(this).addClass('active');
    $('.form-section').removeClass('active');
    $('#' + target).addClass('active');
    $('.msg').hide();
  });

  /* ── Login ────────────────────────────────────────────────── */
  $('#btn-login').on('click', handleLogin);
  $('#login input').on('keydown', function (e) { if (e.key === 'Enter') handleLogin(); });

  function handleLogin() {
    const email    = $('#login-email').val().trim();
    const password = $('#login-password').val();
    const $err     = $('#login-error');
    if (!email || !password) return showMsg($err, 'Please enter your email and password.');
    const user = Storage.verifyLogin(email, password);
    if (!user) return showMsg($err, 'Incorrect email or password.');
    $err.hide();
    Storage.saveSession(user);
    Storage.bumpSession(user.email);
    window.location.href = 'index.html';
  }

  /* ── Sign up ──────────────────────────────────────────────── */
  $('#btn-signup').on('click', handleSignup);
  $('#signup input').on('keydown', function (e) { if (e.key === 'Enter') handleSignup(); });

  function handleSignup() {
    const first   = $('#signup-firstname').val().trim();
    const last    = $('#signup-lastname').val().trim();
    const email   = $('#signup-email').val().trim();
    const pw      = $('#signup-password').val();
    const confirm = $('#signup-confirm').val();
    const $err    = $('#signup-error');
    if (!first || !last || !email || !pw || !confirm) return showMsg($err, 'Please fill in all fields.');
    if (pw.length < 8)   return showMsg($err, 'Password must be at least 8 characters.');
    if (pw !== confirm)  return showMsg($err, 'Passwords do not match.');
    const result = Storage.registerUser(first, last, email, pw);
    if (!result.ok) return showMsg($err, result.error);
    $err.hide();
    const user = { email, name: first + ' ' + last };
    Storage.saveSession(user);
    Storage.bumpSession(email);
    window.location.href = 'index.html';
  }

  /* ── Google login (mock) ──────────────────────────────────── */
  $('.btn-google').on('click', function () {
    const user = { email: 'google@school.edu.my', name: 'Google User' };
    Storage.saveSession(user);
    window.location.href = 'index.html';
  });

  /* ── Logout ───────────────────────────────────────────────── */
  $(document).on('click', '#btn-logout, .link-logout', function (e) {
    e.preventDefault();
    Storage.clearSession();
    window.location.href = 'index.html';
  });

  /* ── Populate navbar user display ────────────────────────── */
  const session = Storage.loadSession();
  if (session) {
    $('#display-name').text(session.name);
    $('#user-pill').show();
  }

  /* ── Dash page: auth vs news ──────────────────────────────── */
  if ($('#auth-page').length) {
    if (session) {
      $('#auth-page').hide();
      $('#news-page').show();
    } else {
      $('#auth-page').css('display', 'flex');
      $('#news-page').hide();
    }
  }

  /* ── Filter cards (news / events / notices etc.) ─────────── */
  $(document).on('click', '.filter-btn', function () {
    const type = $(this).data('filter');
    $('.filter-btn').removeClass('active');
    $(this).addClass('active');
    applyFilter(type);
    Storage.saveFilter(type);
  });

  function applyFilter(type) {
    let visible = 0;
    $('[data-type]').each(function () {
      const match = (type === 'all') || ($(this).data('type') === type);
      $(this).toggleClass('hidden', !match);
      if (match) visible++;
    });
    $('.header-badge').text(visible + ' update' + (visible !== 1 ? 's' : ''));
    $('#no-results').toggle(visible === 0);
  }

  // Restore saved filter on load
  if ($('.filter-btn').length) {
    const saved = Storage.loadFilter();
    applyFilter(saved);
    $(`.filter-btn[data-filter="${saved}"]`).addClass('active');
  }

  /* ── Accordion ────────────────────────────────────────────── */
  $(document).on('click', '.accordion-btn', function () {
    const $body = $(this).next('.accordion-body');
    const isOpen = $body.hasClass('open');
    // Close all
    $('.accordion-body').removeClass('open').hide();
    $('.accordion-btn').removeClass('open');
    if (!isOpen) {
      $body.addClass('open').slideDown(180);
      $(this).addClass('open');
    }
  });

  /* ── Feedback form ────────────────────────────────────────── */
  $('#feedback-form').on('submit', function (e) {
    e.preventDefault();
    const name    = $('#fb-name').val().trim();
    const email   = $('#fb-email').val().trim();
    const type    = $('#fb-type').val();
    const message = $('#fb-message').val().trim();
    const $err    = $('#fb-error');
    const $ok     = $('#fb-success');
    if (!name || !email || !message) return showMsg($err, 'Please fill in all required fields.');
    Storage.saveFeedback({ name, email, type, message });
    $err.hide();
    showMsg($ok, '✅ Thank you! Your message has been received.');
    $('#feedback-form')[0].reset();
  });

  /* ── Contact form ─────────────────────────────────────────── */
  $('#contact-form').on('submit', function (e) {
    e.preventDefault();
    const name    = $('#ct-name').val().trim();
    const email   = $('#ct-email').val().trim();
    const subject = $('#ct-subject').val().trim();
    const message = $('#ct-message').val().trim();
    const $err    = $('#ct-error');
    const $ok     = $('#ct-success');
    if (!name || !email || !subject || !message) return showMsg($err, 'Please fill in all fields.');
    Storage.saveContact({ name, email, subject, message });
    $err.hide();
    showMsg($ok, '✅ Message sent! We will get back to you soon.');
    $('#contact-form')[0].reset();
  });

  /* ── Toast helper ─────────────────────────────────────────── */
  window.showToast = function (msg, delay) {
    const $t = $('#toast');
    if (!$t.length) return;
    $t.text(msg).addClass('show');
    setTimeout(() => $t.removeClass('show'), delay || 2800);
  };

  /* ── Msg helper ───────────────────────────────────────────── */
  function showMsg($el, msg) { $el.text(msg).show(); }

});