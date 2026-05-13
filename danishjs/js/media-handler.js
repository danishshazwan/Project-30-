/* =========================
   media-handler.js (from old_index.html)
========================= */

function saveMedia() {
    // supports multi-upload (max 30 mixed images/videos)
    // and multiple hyperlinks (max 10) provided via window.__mediaLinkDrafts

    const fileInput = document.getElementById('media-file');
    const mediaTitleEl = document.getElementById('media-title');
    const mediaAmountEl = document.getElementById('media-amount');
    const categoryMediaEl = document.getElementById('add-category-media');

    const title = mediaTitleEl?.value || '';
    const amount = mediaAmountEl?.value || '';
    const category = categoryMediaEl?.value || '';

    const files = fileInput?.files ? Array.from(fileInput.files) : [];
    const linksDrafts = window.__mediaLinkDrafts || [];

    // Also keep backwards compat: if old UI has single #media-link value
    const singleLinkVal = document.getElementById('media-link')?.value?.trim?.() || '';
    const links = [...linksDrafts];
    if (singleLinkVal && !links.includes(singleLinkVal)) links.push(singleLinkVal);

    const mediaData = JSON.parse(localStorage.getItem('mediaData')) || [];

    if (files.length === 0 && links.length === 0) {
        return alert('Please upload media or add a hyperlink');
    }

    // enforce caps
    const limitedFiles = files.slice(0, 30);
    const limitedLinks = links.slice(0, 10);

    let pending = 0;

    const saveEntry = (fileDataUrl, linkVal) => {
        mediaData.push({
            file: fileDataUrl || null,
            link: linkVal || '',
            title,
            amount,
            category,
            date: new Date().toISOString()
        });
        localStorage.setItem('mediaData', JSON.stringify(mediaData));
    };

    // Save files (each file becomes an entry)
    if (limitedFiles.length > 0) {
        pending += limitedFiles.length;
        limitedFiles.forEach((f) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                // Pair with link(s): we create entries per file only (links saved separately)
                saveEntry(e.target.result, '');
                pending--;
                if (pending === 0) {
                    // Save links after files
                    limitedLinks.forEach((l) => saveEntry(null, l));
                    // clear drafts
                    window.__mediaLinkDrafts = [];
                    const mediaLinkList = document.getElementById('media-link-list');
                    if (mediaLinkList) mediaLinkList.innerHTML = '';
                    const linkInput = document.getElementById('media-link');
                    if (linkInput) linkInput.value = '';
                    alert('Media saved successfully');
                }
            };
            reader.readAsDataURL(f);
        });
    } else {
        // no files: save links immediately
        limitedLinks.forEach((l) => saveEntry(null, l));
        window.__mediaLinkDrafts = [];
        const mediaLinkList = document.getElementById('media-link-list');
        if (mediaLinkList) mediaLinkList.innerHTML = '';
        alert('Media saved successfully');
    }
}



