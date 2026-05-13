// Reads mediaData from localStorage and renders it on dashboard
(function () {
    const w = (typeof window !== 'undefined') ? window : null;
    if (!w) return;

    function safeParseMediaData() {
        try {
            const raw = localStorage.getItem('mediaData');
            if (!raw) return [];
            const arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    function guessMediaType(entry) {
        if (entry && entry.file) {
            // dataURL => image/* or video/*
            const m = String(entry.file).match(/^data:(video\/|image\/)/);
            if (m && m[1]) {
                return m[1] === 'video/' ? 'video' : 'image';
            }
            return 'image';
        }
        return 'link';
    }

    function escapeHtml(str) {
        return String(str)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '<')
            .replaceAll('>', '>')
            .replaceAll('"', '"')
            .replaceAll("'", '&#039;');
    }

    window.renderMediaOnDashboard = function renderMediaOnDashboard() {
        const container = document.getElementById('media-list');
        if (!container) return;

        const mediaData = safeParseMediaData();
        if (mediaData.length === 0) {
            container.innerHTML = "<p style='text-align:center;'>No media yet</p>";
            return;
        }

        const latest = [...mediaData].slice(-8).reverse(); // show last 8

        container.innerHTML = latest
            .map((entry) => {
                const title = entry?.title ? escapeHtml(entry.title) : 'Media';
                const amount = entry?.amount !== undefined && entry?.amount !== null ? ` • RM${escapeHtml(entry.amount)}` : '';
                const date = entry?.date ? new Date(entry.date).toLocaleDateString() : '';
                const meta = `${date}${amount}`;

                if (entry?.file) {
                    const type = guessMediaType(entry);
                    if (type === 'video') {
                        return `
                            <div class="transaction-card" style="padding:12px; margin:0 10px 10px;">
                                <div style="font-weight:800; font-size:13px; margin-bottom:8px;">${title}</div>
                                <video src="${entry.file}" controls preload="metadata" style="width:100%; max-height:180px; border-radius:12px; background:#000;"></video>
                                <div style="font-size:12px; margin-top:8px; color:var(--text-sub);">${escapeHtml(meta)}</div>
                            </div>
                        `;
                    }

                    return `
                        <div class="transaction-card" style="padding:12px; margin:0 10px 10px;">
                            <div style="font-weight:800; font-size:13px; margin-bottom:8px;">${title}</div>
                            <img src="${entry.file}" alt="${title}" style="width:100%; height:140px; object-fit:cover; border-radius:12px;" />
                            <div style="font-size:12px; margin-top:8px; color:var(--text-sub);">${escapeHtml(meta)}</div>
                        </div>
                    `;
                }

                if (entry?.link) {
                    const l = escapeHtml(entry.link);
                    return `
                        <div class="transaction-card" style="padding:12px; margin:0 10px 10px;">
                            <div style="font-weight:800; font-size:13px; margin-bottom:8px;">${title}</div>
                            <a href="${l}" target="_blank" style="color:var(--primary); font-weight:800; word-break:break-word;">${l}</a>
                            <div style="font-size:12px; margin-top:8px; color:var(--text-sub);">${escapeHtml(meta)}</div>
                        </div>
                    `;
                }

                return '';
            })
            .join('') || "";
    };
})();

