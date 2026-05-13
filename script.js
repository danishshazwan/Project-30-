/* ===== PROJECT 30% - SCRIPT.JS ===== */
/* Cyberpunk Futuristic Interactions */

'use strict';

// ===== LOADING SCREEN =====
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loading-screen');
    if (loader) {
      loader.classList.add('hidden');
    }
  }, 2000);
});

// ===== CUSTOM CURSOR =====
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');
const mouseGlow = document.querySelector('.mouse-glow');

let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  if (cursorDot) {
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top = mouseY + 'px';
  }

  if (mouseGlow) {
    mouseGlow.style.left = mouseX + 'px';
    mouseGlow.style.top = mouseY + 'px';
  }
});

// Smooth ring follow
function animateRing() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;

  if (cursorRing) {
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top = ringY + 'px';
  }

  requestAnimationFrame(animateRing);
}
animateRing();

// Cursor hover effects
document.querySelectorAll('a, button, .profile-card, .about-card, .btn-futuristic, .modal-close, .social-btn').forEach(el => {
  el.addEventListener('mouseenter', () => {
    if (cursorRing) cursorRing.classList.add('hovered');
    if (cursorDot) cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)';
  });
  el.addEventListener('mouseleave', () => {
    if (cursorRing) cursorRing.classList.remove('hovered');
    if (cursorDot) cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
  });
});

// ===== STAR CANVAS =====
function initStars() {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  const stars = [];
  const starCount = Math.min(180, Math.floor((W * H) / 7000));

  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.2,
      alpha: Math.random(),
      speed: Math.random() * 0.3 + 0.05,
      pulse: Math.random() * Math.PI * 2,
      color: Math.random() > 0.7 ? '#b300ff' : Math.random() > 0.5 ? '#00fff7' : '#ffffff'
    });
  }

  function drawStars() {
    ctx.clearRect(0, 0, W, H);

    stars.forEach(s => {
      s.pulse += s.speed * 0.05;
      const alpha = (Math.sin(s.pulse) + 1) / 2 * 0.8 + 0.1;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');

      // Handle hex colors
      if (s.color.startsWith('#')) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
      }
      ctx.fill();
      ctx.globalAlpha = 1;

      // Tiny glow for bright stars
      if (s.r > 1) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2.5);
        grad.addColorStop(0, 'rgba(0,212,255,0.15)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fill();
      }
    });

    requestAnimationFrame(drawStars);
  }

  drawStars();

  window.addEventListener('resize', () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });
}

initStars();

// ===== FLOATING PARTICLES =====
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const particleCount = 20;

  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    p.style.cssText = `
      position: absolute;
      width: ${Math.random() * 3 + 1}px;
      height: ${Math.random() * 3 + 1}px;
      background: ${Math.random() > 0.5 ? 'var(--neon-cyan)' : 'var(--neon-purple)'};
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      opacity: ${Math.random() * 0.5 + 0.1};
      animation: particleFloat ${Math.random() * 10 + 8}s ease-in-out infinite;
      animation-delay: ${-Math.random() * 10}s;
      box-shadow: 0 0 6px currentColor;
      pointer-events: none;
    `;
    container.appendChild(p);
  }

  // Add keyframes dynamically
  if (!document.getElementById('particle-style')) {
    const style = document.createElement('style');
    style.id = 'particle-style';
    style.textContent = `
      @keyframes particleFloat {
        0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
        25% { transform: translate(${Math.random() * 60 - 30}px, ${-Math.random() * 80 - 20}px) scale(1.5); opacity: 0.6; }
        50% { transform: translate(${Math.random() * 60 - 30}px, ${-Math.random() * 120 - 40}px) scale(0.8); opacity: 0.3; }
        75% { transform: translate(${Math.random() * 40 - 20}px, ${-Math.random() * 60 - 10}px) scale(1.2); opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
  }
}

createParticles();

// ===== TYPING ANIMATION =====
function initTyping() {
  const el = document.getElementById('typing-text');
  if (!el) return;

  const text = el.getAttribute('data-text') || el.textContent;
  el.textContent = '';
  let i = 0;

  function typeChar() {
    if (i < text.length) {
      el.textContent += text[i];
      i++;
      setTimeout(typeChar, 60 + Math.random() * 40);
    }
  }

  setTimeout(typeChar, 1400);
}

initTyping();

// ===== MODAL SYSTEM =====
const modal = document.getElementById('jobsheet-modal');
const modalOpenBtns = document.querySelectorAll('[data-modal="open"]');
const modalCloseBtn = document.querySelector('.modal-close');

function openModal() {
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

modalOpenBtns.forEach(btn => btn.addEventListener('click', openModal));
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ===== DYNAMIC MOUSE LIGHTING =====
document.addEventListener('mousemove', (e) => {
  const cards = document.querySelectorAll('.profile-card, .about-card');
  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty('--mouse-x', x + 'px');
    card.style.setProperty('--mouse-y', y + 'px');
  });
});

// ===== CARD TILT EFFECT =====
function initCardTilt() {
  const cards = document.querySelectorAll('.about-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      card.style.transform = `
        translateY(-8px)
        rotateX(${-y * 10}deg)
        rotateY(${x * 10}deg)
      `;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s ease';
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s ease, border-color 0.4s ease, box-shadow 0.4s ease';
    });
  });
}

initCardTilt();

// ===== SCROLL REVEAL =====
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal, .about-card, .section-title');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible', 'revealed');
        }, i * 150);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  elements.forEach(el => observer.observe(el));
}

initScrollReveal();

// ===== BUTTON SCAN EFFECT =====
document.querySelectorAll('.btn-futuristic').forEach(btn => {
  const scan = document.createElement('div');
  scan.className = 'btn-scan';
  btn.appendChild(scan);
});

// ===== GLITCH TEXT ON TITLE =====
function initGlitch() {
  const title = document.querySelector('.hero-title');
  if (!title) return;

  setInterval(() => {
    if (Math.random() > 0.85) {
      title.style.transform = `skewX(${(Math.random() - 0.5) * 2}deg)`;
      title.style.filter = `drop-shadow(${Math.random() * 4 - 2}px 0 rgba(255,0,100,0.5)) drop-shadow(0 0 30px rgba(0, 212, 255, 0.4))`;
      setTimeout(() => {
        title.style.transform = '';
        title.style.filter = 'drop-shadow(0 0 30px rgba(0, 212, 255, 0.4))';
      }, 80);
    }
  }, 3000);
}

initGlitch();

// ===== GLASS REFLECTION ON MODAL =====
function initGlassReflect() {
  const panel = document.querySelector('.modal-panel');
  if (!panel) return;

  const reflect = document.createElement('div');
  reflect.className = 'glass-reflect';
  panel.appendChild(reflect);
}

initGlassReflect();

// ===== ANIMATED LINES (background SVG) =====
function initAnimatedLines() {
  const canvas = document.getElementById('lineCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const lines = [];
  const lineCount = 6;

  for (let i = 0; i < lineCount; i++) {
    lines.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5,
      len: Math.random() * 150 + 50,
      alpha: Math.random() * 0.15 + 0.03,
      color: Math.random() > 0.5 ? '0,212,255' : '179,0,255',
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.01 + 0.002
    });
  }

  function drawLines() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    lines.forEach(l => {
      l.angle += l.speed;
      l.x += Math.cos(l.angle) * 0.3;
      l.y += Math.sin(l.angle) * 0.3;

      if (l.x < 0) l.x = canvas.width;
      if (l.x > canvas.width) l.x = 0;
      if (l.y < 0) l.y = canvas.height;
      if (l.y > canvas.height) l.y = 0;

      const grad = ctx.createLinearGradient(
        l.x, l.y,
        l.x + Math.cos(l.angle) * l.len,
        l.y + Math.sin(l.angle) * l.len
      );
      grad.addColorStop(0, `rgba(${l.color},0)`);
      grad.addColorStop(0.5, `rgba(${l.color},${l.alpha})`);
      grad.addColorStop(1, `rgba(${l.color},0)`);

      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(
        l.x + Math.cos(l.angle) * l.len,
        l.y + Math.sin(l.angle) * l.len
      );
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    requestAnimationFrame(drawLines);
  }

  drawLines();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

initAnimatedLines();

// ===== GLOW TRAIL =====
const glowTrails = [];
const MAX_TRAILS = 12;

document.addEventListener('mousemove', (e) => {
  glowTrails.push({ x: e.clientX, y: e.clientY, alpha: 1 });
  if (glowTrails.length > MAX_TRAILS) glowTrails.shift();
});

// ===== NEON SCANLINE FLASH =====
function scanlineFlash() {
  const flash = document.createElement('div');
  flash.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent);
    z-index: 9999;
    pointer-events: none;
    animation: scanFlash 0.8s ease forwards;
  `;
  document.body.appendChild(flash);

  if (!document.getElementById('scanFlash-style')) {
    const s = document.createElement('style');
    s.id = 'scanFlash-style';
    s.textContent = `
      @keyframes scanFlash {
        0% { top: 0; opacity: 1; }
        100% { top: 100vh; opacity: 0; }
      }
    `;
    document.head.appendChild(s);
  }

  setTimeout(() => flash.remove(), 800);
}

// Random scanline flash
setInterval(() => {
  if (Math.random() > 0.6) scanlineFlash();
}, 6000);

// ===== STATUS BAR TIME =====
function updateStatus() {
  const el = document.getElementById('status-time');
  if (!el) return;

  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  el.textContent = `${h}:${m}:${s}`;
}

updateStatus();
setInterval(updateStatus, 1000);

// ===== CONSOLE EASTER EGG =====
console.log('%c PROJECT 30% ', 'background:#00d4ff;color:#000;font-family:monospace;font-size:20px;padding:4px 12px;border-radius:4px;font-weight:bold;');
console.log('%c Developed by Danish & Hafiz ', 'color:#b300ff;font-family:monospace;font-size:12px;');
console.log('%c ◈ SYSTEM ONLINE ◈ ', 'color:#00fff7;font-family:monospace;');