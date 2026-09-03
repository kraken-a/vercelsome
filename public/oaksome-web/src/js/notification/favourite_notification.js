/** @odoo-module **/

export function showFavoriteNotification(imageBase64, configDimensions, name, alreadyExists = false, action = '') {
    const productName = name || '';

    console.log('productName ',productName);
    const dimension = configDimensions
        ? `W: ${configDimensions.width} x D: ${configDimensions.depth} x H: ${configDimensions.height} mm`
        : '';

    console.log('dimension ',dimension);
    const isPublicUser = window.odoo?.session_info?.is_public;

    if (alreadyExists) {
        console.log('already exist');
        let modal = document.querySelector('#favorite-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'favorite-modal';
            modal.className = 'favorite-modal hidden';
            modal.style.position = 'fixed';
            modal.style.top = '20px';
            modal.style.left = '50%';
            modal.style.transform = 'translateX(-50%)';
            modal.style.zIndex = '1100';
            modal.style.background = 'white';
            modal.style.color = 'black';
            modal.style.border = action === "addToCart" ? '1px solid #158AFF' : '1px solid #FFA500';
            modal.style.borderRadius = '8px';
            modal.style.padding = '1rem 1.5rem';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
            modal.style.fontFamily = 'PP Air, sans-serif';
            modal.style.fontSize = '14px';
            modal.style.opacity = '0';
            modal.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            modal.innerHTML = `
                <div class="favorite-modal-content" style="display:flex; align-items:center;">
                    <div class="favorite-modal-icon" style="margin-right:8px; color:${action === "addToCart" ? "#158AFF" : "#FFA500"};">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M1 21h22L12 2 1 21z"/>
                        </svg>
                    </div>
                    <div class="favorite-modal-text"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const textBox = modal.querySelector('.favorite-modal-text');
        textBox.textContent = action === "addToCart"
            ? `Produit déjà dans le panier: ${productName}`
            : `Déjà dans vos favoris: ${productName}`;

        modal.classList.remove('hidden');
        modal.style.opacity = '1';
        modal.style.transform = 'translateX(-50%) translateY(0)';

        clearTimeout(modal.hideTimer);
        modal.hideTimer = setTimeout(() => {
            modal.style.opacity = '0';
            modal.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => modal.classList.add('hidden'), 300);
        }, 2500);

        return;
    }

    const oldModal = document.querySelector('#wishlist-empty-modal');
    if (oldModal) oldModal.remove();
    const oldBlur = document.querySelector('.wishlist-blur-layer');
    if (oldBlur) oldBlur.remove();

    const blurLayer = document.createElement('div');
    blurLayer.className = 'wishlist-blur-layer';
    blurLayer.style.position = 'fixed';
    blurLayer.style.inset = '0';
    blurLayer.style.backdropFilter = 'blur(12px)';
    blurLayer.style.backgroundColor = 'rgba(0,0,0,0.3)';
    blurLayer.style.zIndex = '1040';
    document.body.appendChild(blurLayer);

    const modal = document.createElement('div');
    modal.id = 'wishlist-empty-modal';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.zIndex = '1050';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';

    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog modal-dialog-centered';
    dialog.style.maxWidth = '923px';
    dialog.style.transform = 'translateX(-150%)';
    dialog.style.opacity = '0';
    dialog.style.animation = 'slideIn 0.4s forwards';
    dialog.style.zIndex = '1051';

    const buttonIcon = `
    <svg width="16" height="19" viewBox="0 0 16 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.9837 15.7733C15.9431 14.9577 15.87 14.15 15.8212 13.3344C15.675 11.1807 15.5287 9.02688 15.3744 6.8731C15.35 5.68535 14.5781 4.63222 13.4325 4.22838C13.0018 4.09377 12.5631 3.99875 12.1243 3.9354C12.0593 1.75787 10.2474 0.0237549 8.01299 0C5.7542 0.0237549 3.91792 1.78954 3.87729 3.99083C3.76354 3.99083 3.64167 3.99875 3.52792 4.00667C2.31727 4.0621 1.261 4.80642 0.838491 5.91498C0.692238 6.32674 0.610988 6.76224 0.610988 7.19775C0.505361 8.71015 0.399735 10.2146 0.294108 11.727C0.204732 13.0177 0.139729 14.3084 0.025977 15.5912C-0.193402 17.2382 1.00099 18.7506 2.69102 18.9644C2.8454 18.9802 2.99166 18.9881 3.14603 18.9881C6.38796 19.004 9.62177 19.004 12.8637 18.9881C14.5619 19.0198 15.9594 17.7133 16 16.0583C16 15.9633 16 15.8683 15.9919 15.7733H15.9837ZM6.25796 1.53615C7.2086 0.84726 8.49237 0.791832 9.50801 1.38571C10.483 1.9004 11.0924 2.8981 11.0843 3.98291H4.93356C4.92544 3.00104 5.42107 2.0746 6.26608 1.53615H6.25796ZM12.9206 17.9825C12.1406 17.9983 11.3605 17.9825 10.5805 17.9825H3.12166C2.08977 18.0221 1.20412 17.2936 1.06599 16.2959C1.03349 15.8604 1.04162 15.4249 1.09037 14.9894C1.17163 13.6591 1.26912 12.3288 1.3585 11.0065C1.44788 9.64451 1.53725 8.28256 1.64288 6.92061C1.67538 5.81996 2.62602 4.95687 3.74729 4.99646C3.74729 4.99646 3.74729 4.99646 3.75542 4.99646H3.88542L3.79604 8.20338C3.79604 8.4726 4.00729 8.69431 4.28355 8.70223H4.2998C4.56793 8.70223 4.79543 8.48843 4.79543 8.22713L4.88481 4.99646C6.95672 4.99646 9.03675 4.99646 11.1087 4.99646L11.198 8.22713C11.198 8.48843 11.4255 8.70223 11.6937 8.70223H11.7099C11.9862 8.70223 12.2056 8.4726 12.1974 8.20338L12.1081 4.99646H12.2137C13.1399 4.96478 13.9687 5.54282 14.2368 6.398C14.31 6.6593 14.3587 6.93645 14.3668 7.21359C14.5375 9.62075 14.7 12.0279 14.8625 14.443C14.895 14.9498 14.9437 15.4486 14.9519 15.9554C14.9844 17.0481 14.0987 17.9587 12.9774 17.9904C12.9531 17.9904 12.9368 17.9904 12.9124 17.9904L12.9206 17.9825Z" fill="currentColor"/>
    </svg>
    `;

    const redirectButton = action === "addToCart"
        ? `<a href="/my-cart" class="btn btn-primary btn-sm">Voir mon panier</a>`
        : `<a href="/my-wishlist" class="btn btn-primary btn-sm">Voir ma Wishlist</a>`;

    dialog.innerHTML = `
        <div class="modal-content horizontal-notif">
            <button class="modal-close-btn" style="
                position: absolute;
                top: 8px;
                right: 8px;
                border: none;
                background: transparent;
                font-size: 18px;
                cursor: pointer;
                ">×</button>

            <div class="product-image">
                <img src="${imageBase64 || '/images/placeholder.png'}" alt="${productName}">
            </div>
            <div class="product-info">
                <h5 class="notif-title">Le produit a été</h5>
                <h5 class="notif-title">ajouté au panier</h5>
                    <p class="product-name" style="display:flex; justify-content:space-between; width:100%;">
                        <span>${productName}</span>
                        <span style="color:#0C524E; font-weight:700;">1 372 € <span style="color:#999;
                         text-decoration:line-through; font-weight:400;">— 875€</span></span>
                    </p>
                    <p class="product-dimensions">Dimensions: ${dimension}</p>
                <div class="notif-buttons">
                    ${
                        isPublicUser
                            ? `<a href="/web/login" class="btn btn-outline-primary btn-sm">
                                   ${buttonIcon}
                                   <span>Se connecter</span>
                               </a>`
                            : `<button type="button" class="btn btn-outline-primary btn-sm js-continue-shopping">
                                   ${buttonIcon}
                                   <span>Continuer mes achats</span>
                               </button>`
                    }
                    <a href="${action === "addToCart" ? "/my-cart" : "/my-wishlist"}"
                       class="btn btn-primary btn-sm">
                        ${buttonIcon}
                        <span>${action === "addToCart" ? "Voir mon panier" : "Voir ma Wishlist"}</span>
                    </a>
                  </div>
            </div>
        </div>
    `;

    modal.appendChild(dialog);
    document.body.appendChild(modal);

    blurLayer.addEventListener('click', () => {
        dialog.style.animation = 'slideOut 0.4s forwards';
        setTimeout(() => {
            modal.remove();
            blurLayer.remove();
        }, 400);
    });
    const continueBtn = dialog.querySelector('.js-continue-shopping');
    const closeBtn = dialog.querySelector('.modal-close-btn');

    const closeModal = () => {
        dialog.style.animation = 'slideOut 0.4s forwards';
        setTimeout(() => {
            modal.remove();
            blurLayer.remove();
        }, 400);
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (continueBtn) continueBtn.addEventListener('click', closeModal);

    function loadBootstrap() {
        return new Promise((resolve, reject) => {
            if (window.bootstrap) return resolve(window.bootstrap);
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js';
            script.onload = () => resolve(window.bootstrap);
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    (async () => {
        const bootstrap = await loadBootstrap();
        new bootstrap.Modal(modal, { backdrop: false, keyboard: false }).show();
    })();
}
