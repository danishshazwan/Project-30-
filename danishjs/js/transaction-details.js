// Transaction detail rendering + linking mediaData to the right transaction.
(function () {
    const w = (typeof window !== 'undefined') ? window : null;
    if (!w) return;

    function escapeHtml(str) {
        return String(str)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '<')
            .replaceAll('>', '>')
            .replaceAll('"', '"')
            .replaceAll("'", '&#039;');
    }

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

    function getLastMediaForTransaction(t) {
        const mediaData = safeParseMediaData();
        if (!mediaData.length || !t) return [];

        // We don't persist transactionId with media, so best-effort: match by same title/amount/category and closest date.
        // If user's media is saved right after spending, this heuristic will work.
        const txAmt = String(t.amount);
        const candidates = mediaData.filter(m => {
            if (!m || !m.title) return false;
            if (m.title !== t.title) return false;
            if (m.category && t.category && m.category !== t.category) return false;
            if (m.amount !== undefined && m.amount !== null && String(m.amount) !== txAmt) return false;
            return !!m.file || !!m.link;
        });

        if (candidates.length) {
            // return last 4 newest
            return [...candidates].slice(-4).reverse();
        }

        // fallback: latest 4 media entries
        return [...mediaData].slice(-4).reverse();
    }

    w.viewExpenseDetails = function viewExpenseDetails(id) {
        const t = w.appData?.transactions?.find(x => x.id === id);
        if (!t) return alert('Transaction not found');

        // Create a simple modal on the same page.
        const existing = document.getElementById('tx-details-modal');
        if (existing) existing.remove();

        const media = getLastMediaForTransaction(t);
        const c = w.categoryConfig?.[t.category];

        const mediaHtml = media.length
            ? media.map(entry => {
                const title = entry?.title ? escapeHtml(entry.title) : 'Media';
                if (entry?.file) {
                    const type = String(entry.file).match(/^data:video\//) ? 'video' : 'image';
                    if (type === 'video') {
                        return `
                            <div class="media-thumb">
                                <div style="font-weight:800; font-size:12px;">${title}</div>
                                <video src="${entry.file}" controls preload="metadata" style="width:100%; max-height:140px; border-radius:12px; background:#000;"></video>
                            </div>
                        `;
                    }
                    return `
                        <div class="media-thumb">
                            <div style="font-weight:800; font-size:12px;">${title}</div>
                            <img src="${entry.file}" alt="${title}" style="width:100%; height:120px; object-fit:cover; border-radius:12px;" />
                        </div>
                    `;
                }
                if (entry?.link) {
                    const l = escapeHtml(entry.link);
                    return `
                        <div class="media-thumb">
                            <div style="font-weight:800; font-size:12px;">${title}</div>
                            <a href="${l}" target="_blank" style="color:var(--primary); font-weight:800; word-break:break-word;">${l}</a>
                        </div>
                    `;
                }
                return '';
            }).join('')
            : '<p style="color:var(--text-sub); text-align:center;">No media for this expense</p>';

        const remainBudget = w.appData?.budget - w.appData?.transactions?.reduce((s, x) => s + parseFloat(x.amount), 0);

        const modal = `
            <div id="tx-details-modal" class="modal-overlay" style="display:flex;">
                <div class="modal-content" style="max-width:520px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <div>
                            <h2 style="margin:0; font-size:18px;">${escapeHtml(t.title)}</h2>
                            <p style="margin:6px 0 0; color:var(--text-sub); font-size:12px;">${escapeHtml(t.category)} • ${new Date(t.date).toLocaleDateString()}</p>
                        </div>
                        <button class="btn" type="button" style="background:var(--card-bg); color:var(--primary); border:2px solid var(--primary-light);" onclick="document.getElementById('tx-details-modal')?.remove()">✕</button>
                    </div>

                    <div style="display:flex; gap:12px; align-items:flex-start; margin-bottom:14px;">
                        <div class="t-icon" style="background:${c?.bg || 'var(--card-bg)'}; color:${c?.color || 'var(--primary)'}; width:44px; height:44px; display:flex; align-items:center; justify-content:center; border-radius:14px; flex:0 0 auto;">${c?.icon || '💳'}</div>
                        <div>
                            <div style="font-size:22px; font-weight:900;">-RM${parseFloat(t.amount).toFixed(2)}</div>
                            <div style="font-size:12px; margin-top:4px; color:var(--text-sub);">Budget left: RM${(remainBudget > 0 ? remainBudget : 0).toFixed(2)}</div>
                            ${w.appData?.budget && parseFloat(t.amount) > parseFloat(remainBudget) ? '<div style="margin-top:6px; color:var(--danger-text); font-weight:900;">Over budget alert</div>' : ''}
                        </div>
                    </div>

                    <div style="margin:14px 0 10px; font-weight:900;">Media</div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                        ${mediaHtml}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);

        // close on backdrop click
        const overlay = document.getElementById('tx-details-modal');
        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    };
})();

