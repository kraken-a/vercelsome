/** @odoo-module **/


const ALLOWED_ORIGINS = [
    "https://configure.tecnibo.com",
    "https://oaksome-client.vercel.app",
    "https://oaksome-client.vercel.app/en",
    "https://oaksome-client.vercel.app/fr",
    "http://localhost:5173",
    location.origin,
];

const CSRF_TOKEN =
    window.odoo?.csrf_token ||
    document.querySelector('meta[name="csrf_token"]')?.content ||
    "";


async function rpc(route, params) {
    const body = {jsonrpc: "2.0", method: "call", id: Date.now(), params};
    const res = await fetch(route, {
        method: "POST",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRFToken": CSRF_TOKEN,
        },
        body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.error) throw json.error;
    return json.result;
}

function getCurrentTemplateId() {
    const iframe = document.getElementById("product-iframe");
    return iframe ? parseInt(iframe.dataset.templateId, 10) : null;
}

function updateCartBadge(quantity) {
    const badge = document.querySelector(".cart-count");
    if (!badge) return;

    const currentQty = parseInt(badge.textContent || "0", 10);
    const newQty = currentQty + quantity;

    badge.textContent = newQty;
    badge.classList.remove("d-none");
}

function updateFavoriteBadge(quantity) {
    const fav = document.querySelector(".favorite-badge");
    if (!fav) return;

    const currentQty = parseInt(fav.textContent || "0", 10);
    const newQty = currentQty + quantity;

    fav.textContent = newQty;
    fav.classList.remove("d-none");
}

async function loadHtml2Canvas() {
    if (window.html2canvas) return;
    await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function captureIframeScreenshot() {
    try {
        await loadHtml2Canvas();
        const wrapper = document.querySelector(".configurator-card");
        if (!wrapper || !document.body.contains(wrapper)) {
            console.warn("wrapper element not in document");
            return null;
        }

        const canvas = await window.html2canvas(wrapper);
        return canvas.toDataURL("image/png");
    } catch (e) {
        console.error("Screenshot capture failed", e);
        return null;
    }
}

const overlay = document.createElement("div");
Object.assign(overlay.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 9998,
});

const waitNotice = document.createElement("div");

Object.assign(waitNotice.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    padding: "20px 30px",
    background: "#fff",
    color: "#000",
    borderRadius: "12px",
    fontSize: "1.1rem",
    fontWeight: "bold",
    textAlign: "center",
    zIndex: 9999,
    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
});


window.addEventListener("message", (e) => {
    if (e.data?.type === "table_config") {
        console.log(e.data);
    }
});

window.addEventListener("message", async (event) => {
    if (!ALLOWED_ORIGINS.includes(event.origin)) {
        console.warn("Blocked origin:", event.origin);
        return;
    }

    const data = event.data || {};
    const action = data.action;
    const xmlData = data.xmlFile;

    if (!action) return;

    const {showFavoriteNotification} = await import(
        `/oaksome-web/src/js/notification/favourite_notification.js?v=${Date.now()}`
        );

    const hasCookie = (name) => document.cookie.split(';').some(c => c.trim().startsWith(name + '='));
    const isPublicUser = !window.odoo?.session_info?.uid && !hasCookie('odoo_sid') && !hasCookie('session_id');
    let capturedEmail = null;
    let capturedUserId = null;
    if (isPublicUser) {
        const {showSignUpModal} = await import("/oaksome-web/src/js/sign_up.js");
        capturedEmail = await showSignUpModal();
        if (!capturedEmail) return;
        const userResult = await rpc("/shop/send_config_email", {email: capturedEmail});
        capturedUserId = userResult?.user_id || null;
        if (userResult?.session_id) {
            window.parent.postMessage({action: 'odooSession', session_id: userResult.session_id}, '*');
        }
        window.dispatchEvent(new CustomEvent('odoo-auth-updated'));
    }

    if (action === "addToCart") {
        console.log('data : ', data);
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlData.content, "application/xml");
        const articles = Array.isArray(data.aricles) ? data.aricles : [];

        if (!articles.length || !data.name) return;

        const templateId = getCurrentTemplateId();
        console.log('template id : ', templateId);

        const screenshotBase64 = await captureIframeScreenshot();

        document.body.appendChild(overlay);

        waitNotice.innerHTML = `
  <div style="display: flex; flex-direction: column; align-items: center; gap: 14px;">
  <style>
      .cart-svg path { opacity: 0.2; animation: fadePulse 1.6s ease-in-out infinite; }
      .cart-svg path:nth-child(1) { animation-delay: 0s; }
      .cart-svg path:nth-child(2) { animation-delay: 0.2s; }
      .cart-svg path:nth-child(3) { animation-delay: 0.4s; }
      .cart-svg path:nth-child(4) { animation-delay: 0.6s; }
      .cart-svg path:nth-child(5) { animation-delay: 0.8s; }
      @keyframes fadePulse { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.9; } }
  </style>
  <div class="oaksome-loader">

            <svg width="182" height="28" viewBox="0 0 182 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M114.498 25.9151C114.498 25.1179 114.96 24.5929 116.257 24.207C117.231 23.9096 117.838 23.6819 117.838 22.986C117.838 22.5115 117.541 22.1635 116.94 22.1635C116.39 22.1635 115.744 22.5368 115.194 22.9227L114.795 22.3027C115.58 21.765 116.269 21.4297 117.079 21.4297C118.136 21.4297 118.775 22.037 118.775 23.1378V25.7063C118.775 26.4528 119.085 26.6173 119.61 26.6173H119.92V27.3385H119.471C118.673 27.3385 118.174 26.9399 118.098 26.2693H118.06C117.775 27.0665 117.149 27.4524 116.301 27.4524C115.207 27.4524 114.492 26.8261 114.492 25.9214L114.498 25.9151ZM116.453 26.7755C117.301 26.7755 117.851 26.1302 117.851 24.9535V24.1563C117.592 24.5169 117.067 24.6688 116.529 24.8143C115.656 25.0547 115.409 25.4279 115.409 25.8834C115.409 26.4212 115.795 26.7691 116.453 26.7691V26.7755Z"
                      fill="currentColor"/>
                <path d="M122.324 21.5752H123.26V22.4988H123.298C123.747 21.8029 124.481 21.4297 125.228 21.4297C126.189 21.4297 127.087 22.0307 127.087 23.6376V27.3385H126.151V23.859C126.151 22.638 125.753 22.1382 124.93 22.1382C123.943 22.1382 123.26 22.9607 123.26 24.0108V27.3385H122.324V21.5815V21.5752Z"
                      fill="currentColor"/>
                <path d="M129.441 24.4669C129.441 22.6703 130.415 21.424 131.87 21.424C132.718 21.424 133.363 21.9237 133.718 22.6196H133.755V18.8555H134.692V27.3328H133.755V26.2889H133.718C133.319 27.0734 132.667 27.4846 131.82 27.4846C130.409 27.4846 129.441 26.2383 129.441 24.4669ZM132.066 26.7761C133.079 26.7761 133.749 25.8524 133.749 24.4606C133.749 23.0688 133.079 22.1452 132.066 22.1452C131.054 22.1452 130.371 23.0688 130.371 24.4606C130.371 25.8524 131.041 26.7761 132.066 26.7761Z"
                      fill="currentColor"/>
                <path d="M144.82 21.5737H145.718V22.2696H145.769C145.99 21.8457 146.49 21.4219 147.18 21.4219C147.755 21.4219 148.103 21.7825 148.249 22.3835H148.287C148.521 21.8964 149.021 21.4219 149.735 21.4219C150.52 21.4219 150.944 21.9849 150.944 23.2059V27.3307H150.045V23.3957C150.045 22.7378 149.957 22.1368 149.362 22.1368C148.73 22.1368 148.325 22.6998 148.325 23.693V27.3307H147.439V23.3957C147.439 22.7378 147.325 22.1368 146.781 22.1368C146.155 22.1368 145.724 22.6998 145.724 23.693V27.3307H144.826V21.5737H144.82Z"
                      fill="currentColor"/>
                <path d="M153.033 24.4649C153.033 22.6555 154.07 21.4219 155.589 21.4219C157.107 21.4219 158.157 22.6555 158.157 24.4649C158.157 26.2742 157.107 27.4825 155.589 27.4825C154.07 27.4825 153.033 26.2489 153.033 24.4649ZM155.589 26.7613C156.588 26.7613 157.221 25.863 157.221 24.4712C157.221 23.0794 156.588 22.1684 155.589 22.1684C154.589 22.1684 153.956 23.0794 153.956 24.4712C153.956 25.863 154.589 26.7613 155.589 26.7613Z"
                      fill="currentColor"/>
                <path d="M160.769 26.6139H162.477V22.2993H160.769V21.5781H163.413V22.9383H163.451C163.774 22.0779 164.476 21.5781 165.596 21.5781H166.159V22.4259H165.438C164.078 22.4259 163.42 23.0964 163.42 24.4693V26.6139H165.59V27.3351H160.782V26.6139H160.769Z"
                      fill="currentColor"/>
                <path d="M168.525 24.4688C168.525 22.7227 169.512 21.4258 171.157 21.4258C172.65 21.4258 173.523 22.5455 173.523 24.3549H169.461C169.461 25.8352 170.088 26.7589 171.258 26.7589C172.017 26.7589 172.593 26.3603 173.017 25.6138L173.592 26.1642C173.029 26.9993 172.333 27.4864 171.201 27.4864C169.505 27.4864 168.531 26.2022 168.531 24.4688H168.525ZM172.574 23.6716C172.536 22.7733 172.036 22.1407 171.15 22.1407C170.265 22.1407 169.689 22.7037 169.531 23.6716H172.574Z"
                      fill="currentColor"/>
                <path d="M176.072 26.1367H177.356V27.3324H176.072V26.1367ZM178.134 26.1367H179.418V27.3324H178.134V26.1367ZM180.19 26.1367H181.474V27.3324H180.19V26.1367Z"
                      fill="currentColor"/>
                <path d="M77.4563 0.515625H101.844C102.439 0.515625 102.926 1.00275 102.926 1.59743V25.9855C102.926 26.5865 102.439 27.0673 101.844 27.0673H77.4563C76.8616 27.0673 76.3745 26.5802 76.3745 25.9855V1.59743C76.3745 0.996428 76.8616 0.515625 77.4563 0.515625Z"
                      stroke="black" stroke-width="1.03"/>
                <path d="M76.103 13.7891H103.199" stroke="black" stroke-width="1.03"/>
                <path d="M91.1478 7.78901C91.1478 6.92862 90.6354 6.44149 89.6675 6.44149C89.193 6.44149 88.7312 6.54272 88.282 6.66292L87.934 6.07457L90.1419 3.89197H87.3394V3.13281H91.3882V3.70851L89.1424 5.91641L89.1677 5.95436C89.4903 5.87845 89.756 5.82784 90.0787 5.82784C91.1352 5.82784 92.0968 6.40354 92.0968 7.79533C92.0968 9.93997 89.6801 11.1736 87.6367 11.8695L87.352 11.0091C90.0534 10.0728 91.1541 9.04162 91.1541 7.78268L91.1478 7.78901Z"
                      fill="currentColor"/>
                <path d="M13.7878 0.515625C6.45558 0.515625 0.515137 6.45607 0.515137 13.7883C0.515137 21.1205 6.46191 27.0673 13.7941 27.0673C21.1264 27.0673 27.0668 21.1269 27.0668 13.7883C27.0668 6.44974 21.1201 0.515625 13.7878 0.515625Z"
                      stroke="black" stroke-width="1.03"/>
                <path d="M0.243652 13.7891H27.3331" stroke="black" stroke-width="1.03"/>
                <path d="M13.9405 4.311L11.9604 6.03177L11.5112 5.40546L14.105 3.14062H14.8895V11.1182H13.9405V4.311Z"
                      fill="currentColor"/>
                <path d="M52.3043 0.914185C52.0386 0.382772 51.6021 0.382772 51.3364 0.914185L38.747 26.0994C38.4813 26.6308 38.747 27.0673 39.348 27.0673H64.2928C64.8938 27.0673 65.1595 26.6308 64.8938 26.0994L52.3043 0.914185Z"
                      stroke="black" stroke-width="1.03"/>
                <path d="M44.7808 13.7891H58.8695" stroke="black" stroke-width="1.03"/>
                <path d="M51.31 21.4419C52.3602 20.5183 53.2016 19.9109 53.2016 18.8608C53.2016 18.1902 52.8283 17.6398 52.0565 17.6398C51.1582 17.6398 50.6014 18.4242 50.5635 19.873H49.6525C49.7158 17.8675 50.6647 16.8047 52.1451 16.8047C53.3028 16.8047 54.1252 17.5765 54.1252 18.7848C54.1252 20.0944 53.1889 20.8662 52.2463 21.676C50.9747 22.7831 50.5382 23.207 50.4749 24.1686H54.2644V24.9277H49.4058C49.4058 23.0931 49.9941 22.5996 51.31 21.4356V21.4419Z"
                      fill="currentColor"/>
            </svg>
        </div>

  <p style="margin: 0; color: #333; font-size: 1rem;">We're crafting your product…</p>
  </div>
`;

        document.body.appendChild(waitNotice);

        try {
            const result = await rpc("/shop/get_or_create_product_by_config", {
                product_tmpl_id: templateId,
                config_json: data,
                name: data.name,
                image_base64: screenshotBase64,
                user_id: capturedUserId || null,
            });
            console.log(result);

            if (result?.product_id && !result?.already_exists) {
                console.log('product and not eixst');

                if (capturedEmail) {
                    const productUrl = result.shareable_link || result.product_url || `/shop/product/${result.product_id}`;
                    await rpc("/shop/send_config_email", {email: capturedEmail, product_url: productUrl});
                }

                const xmlContent = new XMLSerializer().serializeToString(xmlDoc);
                const xmlBase64 = btoa(unescape(encodeURIComponent(xmlContent)));
                await rpc("/shop/iframe/json_config", {
                    product_id: result.product_id,
                    add_qty: 1,
                    custom_config: {
                        ...data,
                        sub_ids: result.sub_ids || [],
                    },
                    display: true,
                    xml_file: {
                        filename: data.xmlFile?.filename || "config.xml",
                        content_base64: xmlBase64,
                    },
                    user_id: capturedUserId || null,
                });
            }
            console.log('about to show notif');

            showFavoriteNotification(
                result.image_base64 || '',
                result.config_json || data.dimension || {},
                result.product_name || data.name || '',
                result.already_exists || false,
                "addToCart"
            );
            updateCartBadge(1);
            console.log("cart updated");
        } catch (err) {
            console.error("Failed to add product to cart:", err);
        } finally {
            waitNotice.remove();
            overlay.remove();
        }

    } else if (action === "fav") {
        const screenshotBase64 = await captureIframeScreenshot();

        document.body.appendChild(overlay);
        waitNotice.innerHTML = `
  <div style="display: flex; flex-direction: column; align-items: center; gap: 14px;">
  <style>
      .wish-svg path { opacity: 0.2; animation: fadePulse 1.6s ease-in-out infinite; }
      .wish-svg path:nth-child(1) { animation-delay: 0s; }
      .wish-svg path:nth-child(2) { animation-delay: 0.2s; }
      .wish-svg path:nth-child(3) { animation-delay: 0.4s; }
      .wish-svg path:nth-child(4) { animation-delay: 0.6s; }
      .wish-svg path:nth-child(5) { animation-delay: 0.8s; }
      @keyframes fadePulse { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.9; } }
  </style>
  <div class="oaksome-loader">

            <svg width="182" height="28" viewBox="0 0 182 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M114.498 25.9151C114.498 25.1179 114.96 24.5929 116.257 24.207C117.231 23.9096 117.838 23.6819 117.838 22.986C117.838 22.5115 117.541 22.1635 116.94 22.1635C116.39 22.1635 115.744 22.5368 115.194 22.9227L114.795 22.3027C115.58 21.765 116.269 21.4297 117.079 21.4297C118.136 21.4297 118.775 22.037 118.775 23.1378V25.7063C118.775 26.4528 119.085 26.6173 119.61 26.6173H119.92V27.3385H119.471C118.673 27.3385 118.174 26.9399 118.098 26.2693H118.06C117.775 27.0665 117.149 27.4524 116.301 27.4524C115.207 27.4524 114.492 26.8261 114.492 25.9214L114.498 25.9151ZM116.453 26.7755C117.301 26.7755 117.851 26.1302 117.851 24.9535V24.1563C117.592 24.5169 117.067 24.6688 116.529 24.8143C115.656 25.0547 115.409 25.4279 115.409 25.8834C115.409 26.4212 115.795 26.7691 116.453 26.7691V26.7755Z"
                      fill="currentColor"/>
                <path d="M122.324 21.5752H123.26V22.4988H123.298C123.747 21.8029 124.481 21.4297 125.228 21.4297C126.189 21.4297 127.087 22.0307 127.087 23.6376V27.3385H126.151V23.859C126.151 22.638 125.753 22.1382 124.93 22.1382C123.943 22.1382 123.26 22.9607 123.26 24.0108V27.3385H122.324V21.5815V21.5752Z"
                      fill="currentColor"/>
                <path d="M129.441 24.4669C129.441 22.6703 130.415 21.424 131.87 21.424C132.718 21.424 133.363 21.9237 133.718 22.6196H133.755V18.8555H134.692V27.3328H133.755V26.2889H133.718C133.319 27.0734 132.667 27.4846 131.82 27.4846C130.409 27.4846 129.441 26.2383 129.441 24.4669ZM132.066 26.7761C133.079 26.7761 133.749 25.8524 133.749 24.4606C133.749 23.0688 133.079 22.1452 132.066 22.1452C131.054 22.1452 130.371 23.0688 130.371 24.4606C130.371 25.8524 131.041 26.7761 132.066 26.7761Z"
                      fill="currentColor"/>
                <path d="M144.82 21.5737H145.718V22.2696H145.769C145.99 21.8457 146.49 21.4219 147.18 21.4219C147.755 21.4219 148.103 21.7825 148.249 22.3835H148.287C148.521 21.8964 149.021 21.4219 149.735 21.4219C150.52 21.4219 150.944 21.9849 150.944 23.2059V27.3307H150.045V23.3957C150.045 22.7378 149.957 22.1368 149.362 22.1368C148.73 22.1368 148.325 22.6998 148.325 23.693V27.3307H147.439V23.3957C147.439 22.7378 147.325 22.1368 146.781 22.1368C146.155 22.1368 145.724 22.6998 145.724 23.693V27.3307H144.826V21.5737H144.82Z"
                      fill="currentColor"/>
                <path d="M153.033 24.4649C153.033 22.6555 154.07 21.4219 155.589 21.4219C157.107 21.4219 158.157 22.6555 158.157 24.4649C158.157 26.2742 157.107 27.4825 155.589 27.4825C154.07 27.4825 153.033 26.2489 153.033 24.4649ZM155.589 26.7613C156.588 26.7613 157.221 25.863 157.221 24.4712C157.221 23.0794 156.588 22.1684 155.589 22.1684C154.589 22.1684 153.956 23.0794 153.956 24.4712C153.956 25.863 154.589 26.7613 155.589 26.7613Z"
                      fill="currentColor"/>
                <path d="M160.769 26.6139H162.477V22.2993H160.769V21.5781H163.413V22.9383H163.451C163.774 22.0779 164.476 21.5781 165.596 21.5781H166.159V22.4259H165.438C164.078 22.4259 163.42 23.0964 163.42 24.4693V26.6139H165.59V27.3351H160.782V26.6139H160.769Z"
                      fill="currentColor"/>
                <path d="M168.525 24.4688C168.525 22.7227 169.512 21.4258 171.157 21.4258C172.65 21.4258 173.523 22.5455 173.523 24.3549H169.461C169.461 25.8352 170.088 26.7589 171.258 26.7589C172.017 26.7589 172.593 26.3603 173.017 25.6138L173.592 26.1642C173.029 26.9993 172.333 27.4864 171.201 27.4864C169.505 27.4864 168.531 26.2022 168.531 24.4688H168.525ZM172.574 23.6716C172.536 22.7733 172.036 22.1407 171.15 22.1407C170.265 22.1407 169.689 22.7037 169.531 23.6716H172.574Z"
                      fill="currentColor"/>
                <path d="M176.072 26.1367H177.356V27.3324H176.072V26.1367ZM178.134 26.1367H179.418V27.3324H178.134V26.1367ZM180.19 26.1367H181.474V27.3324H180.19V26.1367Z"
                      fill="currentColor"/>
                <path d="M77.4563 0.515625H101.844C102.439 0.515625 102.926 1.00275 102.926 1.59743V25.9855C102.926 26.5865 102.439 27.0673 101.844 27.0673H77.4563C76.8616 27.0673 76.3745 26.5802 76.3745 25.9855V1.59743C76.3745 0.996428 76.8616 0.515625 77.4563 0.515625Z"
                      stroke="black" stroke-width="1.03"/>
                <path d="M76.103 13.7891H103.199" stroke="black" stroke-width="1.03"/>
                <path d="M91.1478 7.78901C91.1478 6.92862 90.6354 6.44149 89.6675 6.44149C89.193 6.44149 88.7312 6.54272 88.282 6.66292L87.934 6.07457L90.1419 3.89197H87.3394V3.13281H91.3882V3.70851L89.1424 5.91641L89.1677 5.95436C89.4903 5.87845 89.756 5.82784 90.0787 5.82784C91.1352 5.82784 92.0968 6.40354 92.0968 7.79533C92.0968 9.93997 89.6801 11.1736 87.6367 11.8695L87.352 11.0091C90.0534 10.0728 91.1541 9.04162 91.1541 7.78268L91.1478 7.78901Z"
                      fill="currentColor"/>
                <path d="M13.7878 0.515625C6.45558 0.515625 0.515137 6.45607 0.515137 13.7883C0.515137 21.1205 6.46191 27.0673 13.7941 27.0673C21.1264 27.0673 27.0668 21.1269 27.0668 13.7883C27.0668 6.44974 21.1201 0.515625 13.7878 0.515625Z"
                      stroke="black" stroke-width="1.03"/>
                <path d="M0.243652 13.7891H27.3331" stroke="black" stroke-width="1.03"/>
                <path d="M13.9405 4.311L11.9604 6.03177L11.5112 5.40546L14.105 3.14062H14.8895V11.1182H13.9405V4.311Z"
                      fill="currentColor"/>
                <path d="M52.3043 0.914185C52.0386 0.382772 51.6021 0.382772 51.3364 0.914185L38.747 26.0994C38.4813 26.6308 38.747 27.0673 39.348 27.0673H64.2928C64.8938 27.0673 65.1595 26.6308 64.8938 26.0994L52.3043 0.914185Z"
                      stroke="black" stroke-width="1.03"/>
                <path d="M44.7808 13.7891H58.8695" stroke="black" stroke-width="1.03"/>
                <path d="M51.31 21.4419C52.3602 20.5183 53.2016 19.9109 53.2016 18.8608C53.2016 18.1902 52.8283 17.6398 52.0565 17.6398C51.1582 17.6398 50.6014 18.4242 50.5635 19.873H49.6525C49.7158 17.8675 50.6647 16.8047 52.1451 16.8047C53.3028 16.8047 54.1252 17.5765 54.1252 18.7848C54.1252 20.0944 53.1889 20.8662 52.2463 21.676C50.9747 22.7831 50.5382 23.207 50.4749 24.1686H54.2644V24.9277H49.4058C49.4058 23.0931 49.9941 22.5996 51.31 21.4356V21.4419Z"
                      fill="currentColor"/>
            </svg>
        </div>
  <p style="margin: 0; color: #333; font-size: 1rem;">We're crafting your wish…</p>
  </div>
`;
        document.body.appendChild(waitNotice);

        try {
            const templateId = getCurrentTemplateId();
            const result = await rpc("/shop/get_or_create_product_by_config", {
                product_tmpl_id: templateId,
                config_json: data,
                name: data.name,
                image_base64: screenshotBase64,
                user_id: capturedUserId || null,
            });

            console.log('result :', result);

            showFavoriteNotification(
                result.image_base64 || '',
                result.config_json || data.dimension || {},
                result.product_name || data.name || '',
                result.already_exists || false,
                "fav"
            );
            updateFavoriteBadge(result.already_exists ? 0 : 1);

            if (!result.already_exists) {
                if (capturedEmail) {
                    const productUrl = result.shareable_link || result.product_url || `/shop/product/${result.product_id}`;
                    await rpc("/shop/send_config_email", {email: capturedEmail, product_url: productUrl});
                }
                const {showShareModal} = await import("/oaksome-web/src/js/sharing_modal.js");
                showShareModal(result?.shareable_link, data.image);
            }

        } catch (err) {
            console.error("❗Failed to favorite config", err);
        } finally {
            waitNotice.remove();
            overlay.remove();
        }
    } else {
        console.warn("action err:", action);
    }
});
