// Simple notifications center (localStorage driven)
(function () {
    const w = (typeof window !== 'undefined') ? window : null;
    if (!w) return;

    const STORAGE_KEY = 'studentTrackerNotifications';

    function loadNotifications() {
        try {   
            const raw = localStorage.getItem(STORAGE_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    function saveNotifications(arr) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    }

    function addNotification({ title, message, type = 'warning', date = new Date().toISOString(), meta = {} }) {
        const list = loadNotifications();
        list.push({ title, message, type, date, meta });
        // cap size
        const capped = list.slice(-20);
        saveNotifications(capped);
        renderNotifications();
    }

    function deleteAllNow() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            // ignore
        }
        // Force a reload so UI MUST re-read storage
        setTimeout(() => {
            try {
                location.reload();
            } catch (e) {
                // fallback render
                if (typeof w.renderNotifications === 'function') w.renderNotifications();
            }
        }, 50);
    }

    function clearAllNotifications() {
        deleteAllNow();
    }




    function renderNotifications() { 
        // debug hook
        // console.log('renderNotifications', loadNotifications());
        const page = document.getElementById('notifications-page');
        if (!page) return;

        const root = page.querySelector('.card');
        if (!root) return;

        const list = loadNotifications().slice().reverse();

        const headerRow = `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:10px;">
                <div style="font-weight:900; color:var(--text-main);">Notifications</div>
                <button type="button"
                    style="width:auto; padding:10px 14px; margin-bottom:0; background: var(--danger-bg); color: var(--danger-text); border:none; border-radius:14px; font-weight:900; cursor:pointer;"
                    onclick="window.deleteAllNow && window.deleteAllNow()">
                    Delete All
                </button>
            </div>
        `;

        if (list.length === 0) {
            root.innerHTML = headerRow + '<p style="margin:0;">No new notifications 🔔</p>';
            return;
        }

        root.innerHTML = headerRow + list.map((n) => {
            const title = n?.title ? String(n.title) : 'Notification';
            const msg = n?.message ? String(n.message) : '';
            const d = n?.date ? new Date(n.date).toLocaleString() : '';
            return `
                <div style="padding:12px; background:var(--card-bg); border:1px solid var(--border-color); border-radius:14px; margin-bottom:10px;">
                    <div style="font-weight:900; color:var(--text-main); margin-bottom:4px;">${escapeHtml(title)}</div>
                    <div style="font-size:13px; color:var(--text-sub);">${escapeHtml(msg)}</div>
                    ${d ? `<div style="font-size:11px; color:var(--text-sub); margin-top:6px;">${escapeHtml(d)}</div>` : ''}
                </div>
            `;
        }).join('');
    }


    function escapeHtml(str) {
        return String(str)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '<')
            .replaceAll('>', '>')
            .replaceAll('"', '"')
            .replaceAll("'", '&#039;');
    }

    w.addNotification = addNotification;
    w.renderNotifications = renderNotifications;

    // auto render when notifications page loads
    if (typeof window.appInitForPage === 'function' || true) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', renderNotifications);
        } else {
            renderNotifications();
        }
    }
})();

