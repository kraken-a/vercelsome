/** @odoo-module **/

let _shareModalInitialized = false;
let _shareModal = null;

export function initSharing() {
    if (_shareModalInitialized) return _shareModal;
    _shareModalInitialized = true;

    if (!document.getElementById("share-modal-style")) {
        const style = document.createElement("style");
        style.id = "share-modal-style";
        style.innerHTML = `
            .share-modal {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
                z-index: 9999;
            }
            .share-modal.visible { opacity:1; visibility: visible; }

            .share-content {
                background: #fff;
                border-radius: 20px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                display: flex;
                flex-direction: row;
                width: 90%;
                max-width: 800px;
                transform: translateY(20px);
                transition: transform 0.3s ease;
                overflow: hidden;
                position: relative;
            }
            .share-modal.visible .share-content { transform: translateY(0); }

            .share-image-wrapper {
                flex: 1;
                background: #f5f5f5;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .share-image-wrapper img {
                max-width: 100%;
                max-height: 100%;
                object-fit: cover;
            }

            .share-info {
                flex: 1;
                padding: 2rem;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }

            .share-text h2 { font-size: 1.5rem; margin-bottom: 0.5rem; }
            .share-text p { font-size: 0.95rem; margin-bottom: 1.5rem; }

            .share-link-wrapper {
                display:flex;
                align-items:center;
                background:#f7f7f7;
                border-radius:8px;
                padding:0.5rem;
                margin-bottom:1rem;
                gap:0.5rem;
            }
            #share-link { flex:1; border:none; background:transparent; font-size:0.9rem; outline:none; }
            #copy-link { background:#C1FD48; border:none; border-radius:8px; padding:0.5rem 1rem; cursor:pointer; }

            .share-buttons {
                display:grid;
                grid-template-columns:repeat(auto-fit, minmax(45px, 1fr));
                gap:0.6rem;
            }
            .share-buttons button {
                background:#eee;
                border:none;
                border-radius:12px;
                padding:0.6rem;
                font-size:1.2rem;
                cursor:pointer;
            }
            .share-buttons button:hover { background:#C1FD48; transform: scale(1.1); }

            .share-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background:none;
                border:none;
                font-size:1.8rem;
                cursor:pointer;
            }
            .share-buttons button i.fab.fa-facebook-f { color: #1877F2; }
            .share-buttons button i.fab.fa-x-twitter { color: #000000; }
            .share-buttons button i.fab.fa-whatsapp { color: #25D366; }
            .share-buttons button i.fab.fa-telegram-plane { color: #0088cc; }
            .share-buttons button i.fab.fa-linkedin-in { color: #0A66C2; }
            .share-buttons button i.fab.fa-vk { color: #4C75A3; }
            .share-buttons button i.fab.fa-instagram { color: #E4405F; }

            .share-buttons button:focus {
                outline: none;
                box-shadow: none;
            }

            @media (max-width: 600px) {
                .share-content { flex-direction: column; }
            }
        `;
        document.head.appendChild(style);
    }

    _shareModal = document.createElement("div");
    _shareModal.id = "share-modal";
    _shareModal.className = "share-modal";
    _shareModal.innerHTML = `
        <div class="share-content">
            <div class="share-image-wrapper">
                <img id="share-image" src="" alt="Share Image" />
            </div>
            <div class="share-info">
                <button class="share-close">&times;</button>
                <div class="share-text">
                    <h2>Share your Unique Design</h2>
                    <p>Show your friends your custom masterpiece.</p>
                </div>
                <div class="share-link-wrapper">
                    <input id="share-link" type="text" readonly />
                    <button id="copy-link">📋</button>
                </div>
                <div class="share-buttons">
                    <button style="background-color:white;" data-share="facebook"><i class="fab fa-facebook-f"></i></button>
                    <button style="background-color:white;" data-share="instagram"><i class="fab fa-instagram"></i></button>
                    <button style="background-color:white;" data-share="x"><i class="fab fa-x-twitter"></i></button>
                    <button style="background-color:white;" data-share="whatsapp"><i class="fab fa-whatsapp"></i></button>
                    <button style="background-color:white;" data-share="telegram"><i class="fab fa-telegram-plane"></i></button>
                    <button style="background-color:white;" data-share="linkedin"><i class="fab fa-linkedin-in"></i></button>
                    <button style="background-color:white;" data-share="vk"><i class="fab fa-vk"></i></button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(_shareModal);

    const closeModal = () => _shareModal.classList.remove("visible");

    _shareModal.querySelector(".share-close").onclick = closeModal;
    _shareModal.onclick = (e) => { if (e.target === _shareModal) closeModal(); };

    _shareModal.querySelector("#copy-link").onclick = () => {
        const input = _shareModal.querySelector("#share-link");
        input.select();
        document.execCommand("copy");
    };

    const openShare = (url) => window.open(url, "_blank", "width=600,height=400");

    const patterns = {
        facebook: (u) => `https://www.facebook.com/sharer/sharer.php?u=${u}`,
        instagram: (u) => `https://www.instagram.com/?url=${u}`,
        x: (u) => `https://twitter.com/intent/tweet?url=${u}`,
        whatsapp: (u) => `https://api.whatsapp.com/send?text=${u}`,
        telegram: (u) => `https://t.me/share/url?url=${u}`,
        linkedin: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
        vk: (u) => `https://vk.com/share.php?url=${u}`,
    };

    _shareModal.querySelector(".share-buttons").onclick = (e) => {
        const btn = e.target.closest("button[data-share]");
        if (!btn) return;
        const type = btn.dataset.share;
        const link = encodeURIComponent(_shareModal.querySelector("#share-link").value);
        if (patterns[type]) openShare(patterns[type](link));
    };

    return _shareModal;
}

export function showShareModal(shareableLink, imageUrl = null) {
    const modal = initSharing();

    modal.querySelector("#share-link").value = shareableLink || window.location.href;

    const img = modal.querySelector("#share-image");
    img.src = imageUrl || "";
    img.style.display = imageUrl ? "block" : "none";

    modal.classList.add("visible");
}

export function bindShareButtons(containerSelector = "body") {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    container.addEventListener("click", (e) => {
        const btn = e.target.closest(".share-btn");
        if (!btn) return;

        const productId = btn.dataset.productId;
        if (!productId) return;

        showShareModal(`${window.location.origin}/custom/product/${productId}`);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    bindShareButtons();
});
