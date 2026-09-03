(function () {
    'use strict';

    let overlayEl = null;

    const LIVECHAT_STYLES = `
    .oaksome-chat-trigger {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 85px;
        height: 62px;
        cursor: pointer;
        z-index: 9998;
        background-color: #f5f5f5;
        color: #158AFF;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 4px;
        border-radius: 0px;
        opacity: 0;
        pointer-events: none;
        transform: translateY(10px);
        transition: opacity 0.25s ease, transform 0.25s ease;
    }
    .oaksome-chat-trigger.visible {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
    }
    .oaksome-chat-trigger:hover {
        opacity: 0.65;
    }
    .oaksome-chat-trigger-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-family: 'Yet Grotesk', sans-serif;
        line-height: 1;
    }
    .oaksome-chat-trigger svg {
        width: 22px;
        height: 22px;
        color: #158AFF;
    }

        .o-mail-ChatWindow {
            height: 422.62px;
            width: 340px;
            border-radius: 0px !important;
            overflow: hidden !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.12) !important;
            border: 1px solid #e0ddd8 !important;
            font-family: 'Yet Grotesk', sans-serif !important;
            bottom: 5rem !important;
            right: 2rem !important;
            padding-top: 0 !important;
        }
        .o-mail-ChatWindow > :first-child {
            margin-top: 0 !important;
            padding-top: 0 !important;
        }
        .o-mail-ChatWindow-header {
            display: none !important;
            height: 0 !important;
            min-height: 0 !important;
            max-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            overflow: hidden !important;
        }
        .oaksome-chat-topbar {
            display: flex;
            flex-direction: column;
            padding: 0;
            background: #ffffff;
        }
        .oaksome-chat-back {
            cursor: pointer;
            font-size: 20px;
            color: #2c2c2c;
            line-height: 1;
            font-family: 'Yet Grotesk', sans-serif;
            transition: opacity 0.15s ease;
            background: none;
            border: none;
            padding: 16px 16px 8px 16px;
            margin: 0;
            align-self: flex-start;
        }
        .oaksome-chat-back:hover { opacity: 0.6; }
        .oaksome-chat-topline { height: 1px; background: black; margin: 15px 10px 0px 10px; }
        .o-mail-Thread { background-color: white !important; padding-top: 0 !important; }
        .o-mail-Message-avatar,
        .o-mail-Message-sidebar,
        .o-mail-Message-avatarContainer,
        [class*="avatarContainer"],
        [class*="avatar"] {
            display: none !important;
            width: 0 !important;
            min-width: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
        }
        .o-mail-Message { font-family: 'Yet Grotesk', sans-serif !important; }
        .o-mail-Message:not(.o-selfAuthored) .o-mail-Message-bubble,
        .o-mail-Message:not(.o-selfAuthored) .o-mail-Message-content {
            background-color: #f6f5f0 !important;
            color: #2c2c2c !important;
            border-radius: 1px !important;
            border: none !important;
            padding: 12px 16px !important;
            font-size: 14px !important;
        }
        .o-mail-Message.o-selfAuthored .o-mail-Message-bubble,
        .o-mail-Message.o-selfAuthored .o-mail-Message-content {
            background-color: #f6f5f0 !important;
            color: #2c2c2c !important;
            border-radius: 12px !important;
            border: none !important;
            padding: 12px 16px !important;
            font-size: 14px !important;
        }
        .o-discuss-TypingDots,
        .o-mail-Typing,
        [class*="typing"],
        [class*="Typing"] {
            background-color: #f6f5f0 !important;
            border-radius: 12px !important;
            padding: 8px 14px !important;
        }
        .o-mail-Composer,
        .o-livechat-Composer {
            border-top: 1px solid #e0ddd8 !important;
            background: #ffffff !important;
            padding: 8px 12px !important;
            display: flex !important;
            align-items: flex-end !important;
            flex-wrap: wrap !important;
        }
        .o-mail-Composer-input,
        .o-mail-Composer textarea {
            border: none !important;
            background: transparent !important;
            font-family: 'Yet Grotesk', sans-serif !important;
            font-size: 14px !important;
            color: #2c2c2c !important;
            box-shadow: none !important;
            outline: none !important;
            flex: 1 !important;
        }
        .o-mail-Composer-input::placeholder,
        .o-mail-Composer textarea::placeholder { color: #999 !important; }
        .o-mail-Composer-actions {
            display: flex !important;
            align-items: center !important;
            order: 98 !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            background: transparent !important;
            height: auto !important;
            overflow: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            position: static !important;
        }
        // .o-mail-Composer-actions button[aria-label="Emojis"],
        // .o-mail-Composer-actions .fa-smile-o,
        // .o-mail-Composer-actions .o-mail-Composer-emoji,
        // .o-mail-Composer-actions [title="Add Emojis"],
        // .o-mail-Composer-actions [title="Emojis"] { display: none !important; }
        .o-mail-Composer-attachFiles {
            border: none !important;
            background: transparent !important;
            padding: 4px !important;
            color: #999 !important;
        }
        .o-mail-Composer-send,
        .o-mail-Composer button[aria-label="Send"],
        .o-mail-Composer .o-mail-Composer-toolButtons button:last-child { display: none !important; }
        .oaksome-attach-btn {
            width: 24px;
            height: 24px;
            background: transparent;
            border: none;
            padding: 16px;
            cursor: pointer;
            color: #999;
            font-size: 18px;
            order: 98;
            flex-shrink: 0;
            transition: color 0.15s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            align-self: center;
        }
        .oaksome-attach-btn:hover { color: #2c2c2c; }
        .oaksome-send-btn {
            background-color: #0C524E;
            color: #ffffff;
            border-radius: 50%;
            width: 48.96px;
            height: 48px;
            min-width: 36px;
            min-height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            padding: 0;
            cursor: pointer;
            transition: background-color 0.45s ease;
            font-size: 16px;
            order: 99;
            flex-shrink: 0;
        }
        .oaksome-send-btn:hover { background-color: black; }
        .o-mail-Thread::-webkit-scrollbar { width: 4px; }
        .o-mail-Thread::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }

        .lc-prechat-overlay {
            position: fixed;
            bottom: 7rem;
            right: 2rem;
            width: 457px;
            height: 462px;
            background: white;
            color: black;
            border-radius: 0;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
            padding: 20px;
            z-index: 10000;
            font-family: "PP Air", ui-monospace, SFMono-Regular, Menlo, monospace;
            animation: lc-pop-in 160ms ease-out;
            box-sizing: border-box;
        }
        @keyframes lc-pop-in {
            from { transform: scale(0.95) translateY(10px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .lc-prechat-top-line { height: 1px; background: black; margin: 0 10px 12px 10px; }
        .lc-prechat-header {
            display: grid;
            grid-template-columns: 24px 1fr 24px;
            align-items: start;
            margin-bottom: 24px;
        }
        .lc-prechat-close { font-size: 20px; cursor: pointer; user-select: none; line-height: 1; }
        .lc-prechat-title {
            text-align: center;
            font-size: 30px;
            font-weight: 700;
            text-transform: uppercase;
            font-family: 'Yet Grotesk';
            line-height: 32px;
        }
        .lc-prechat-info {
            font-size: 13px;
            line-height: 100%;
            margin-bottom: 0;
            font-family: 'PP Air';
            text-transform: uppercase;
        }
        .lc-prechat-info .faq { color: #158AFF; text-decoration: none; }
        .lc-prechat-buttons { display: flex; flex-direction: column; gap: 12px; }
        .lc-prechat-btn {
            width: 100%;
            height: 60px;
            appearance: none;
            background: transparent;
            border: 1px solid #158AFF;
            border-radius: 25px;
            padding: 12px;
            font-size: 12px;
            cursor: pointer;
            color: #158AFF;
            text-transform: uppercase;
            transition: background 120ms ease, transform 80ms ease;
        }
        .lc-prechat-btn:hover { background: rgba(21, 138, 255, 0.12); }
        .lc-prechat-btn:active { transform: scale(0.97); }
        .lc-prechat-info .gap { display: inline-block; width: 20px; }

        .o-livechat-LivechatButton {
            position: fixed !important;
            bottom: -9999px !important;
            right: -9999px !important;
            opacity: 0 !important;
            pointer-events: none !important;
            width: 0 !important;
            height: 0 !important;
            overflow: hidden !important;
        }
    `;

    const CHAT_TRIGGER_HTML = `
    <span class="oaksome-chat-trigger-label">chat</span>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
`;


    const SCROLL_THRESHOLD = 300;

    function updateChatButtonVisibility() {
        const btn = document.querySelector('.oaksome-chat-trigger');
        if (!btn) return;
        const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
        btn.classList.toggle('visible', scrollTop > SCROLL_THRESHOLD);
    }

    function injectStyles() {
        if (document.getElementById('oaksome-livechat-styles')) return;
        const style = document.createElement('style');
        style.id = 'oaksome-livechat-styles';
        style.textContent = LIVECHAT_STYLES;
        document.head.appendChild(style);
    }

    function findInShadow(selector, root) {
        let results = [];
        root.querySelectorAll(selector).forEach(el => results.push(el));
        root.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) results.push(...findInShadow(selector, el.shadowRoot));
        });
        return results;
    }

    function getLivechatButton() {
        return findInShadow('.o-livechat-LivechatButton', document)[0] || null;
    }

    function showPrechatOverlay() {
        if (overlayEl) return;

        overlayEl = document.createElement('div');
        overlayEl.className = 'lc-prechat-overlay';
        overlayEl.innerHTML = `
            <div class="lc-prechat-top-line"></div>
            <div class="lc-prechat-header">
                <div></div>
                <div class="lc-prechat-title mt-4 pt-3">Do you need assistance ?</div>
                <div class="lc-prechat-close" data-action="close">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.2478 5.63601L12.8839 12L19.2478 18.3639L18.364 19.2478L12 12.8839L5.63604 19.2478L4.75215 18.3639L11.1161 12L4.75216 5.63601L5.63604 4.75213L12 11.1161L18.364 4.75213L19.2478 5.63601Z" fill="black" stroke="black" stroke-width="0.25"/>
                    </svg>
                </div>
            </div>
            <div class="lc-prechat-info mt-5 mb-3">
                FROM MON TO <span class="gap"></span> FRI 10:00 - 20:00 CET
            </div>
            <div class="lc-prechat-info mt-4">
                <a href="/questions"><span class="faq">CONSULTE OUR FAQ</span></a>
                OR CONTACT US :
            </div>
            <div class="lc-prechat-buttons mt-2">
                <button class="lc-prechat-btn" data-action="contact">Contact form</button>
                <button class="lc-prechat-btn" data-action="livechat">Live chat</button>
                <button class="lc-prechat-btn" data-action="whatsapp">Whatsapp assistance</button>
            </div>
        `;

        overlayEl.addEventListener('click', (ev) => {
            const actionEl = ev.target.closest('[data-action]');
            if (!actionEl) return;
            const action = actionEl.dataset.action;

            overlayEl.remove();
            overlayEl = null;

            if (action === 'close') return;
            if (action === 'contact') {
                window.location.href = '/contact';
                return;
            }
            if (action === 'whatsapp') {
                window.open('https://wa.me/+32492333007', '_blank');
                return;
            }
            if (action === 'livechat') {
                const btn = getLivechatButton();
                if (btn) {
                    btn.dataset.oaksomeBypass = 'true';
                    btn.click();
                }
            }
        });

        document.body.appendChild(overlayEl);
    }

    function interceptLivechatClick() {
        const btn = getLivechatButton();
        if (!btn || btn.dataset.oaksomeIntercepted === 'true') return;
        btn.dataset.oaksomeIntercepted = 'true';

        btn.addEventListener('click', (ev) => {
            if (btn.dataset.oaksomeBypass === 'true') {
                btn.dataset.oaksomeBypass = 'false';
                return;
            }
            ev.preventDefault();
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            showPrechatOverlay();
        }, {capture: true});
    }

    function handleChatClick() {
        const chatWindows = findInShadow('.o-mail-ChatWindow', document);
        if (chatWindows.length > 0) {
            chatWindows.forEach(win => {
                const backBtn = win.querySelector('.oaksome-chat-back');
                if (backBtn) backBtn.click();
            });
            return;
        }
        showPrechatOverlay();
    }

    function injectChatButton() {
        if (document.querySelector('.oaksome-chat-trigger')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'oaksome-chat-trigger';
        wrapper.innerHTML = CHAT_TRIGGER_HTML;
        wrapper.addEventListener('click', handleChatClick);
        document.body.appendChild(wrapper);
    }

    function injectTopBar() {
        const chatWindows = findInShadow('.o-mail-ChatWindow', document);
        chatWindows.forEach(win => {
            if (win.querySelector('.oaksome-chat-topbar')) return;
            const topbar = document.createElement('div');
            topbar.className = 'oaksome-chat-topbar';
            topbar.innerHTML = `
                <div class="oaksome-chat-topline"></div>
                <button class="oaksome-chat-back">
                    <svg width="7" height="11" viewBox="0 0 7 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.41953 5.31012L6.01953 9.91012L5.30953 10.6201L-0.000468267 5.31012L5.30953 0.00011724L6.01953 0.710117L1.41953 5.31012Z" fill="black"/>
                    </svg>
                </button>`;
            win.prepend(topbar);
            topbar.querySelector('.oaksome-chat-back').addEventListener('click', () => {
                const closeBtn = win.querySelector('.o-mail-ChatWindow-header .fa-close, .o-mail-ChatWindow-header .fa-times, .o-mail-ChatWindow-header [title="Close"]');
                if (closeBtn) {
                    (closeBtn.closest('button, [role="button"], .cursor-pointer, div') || closeBtn).click();
                }
            });
        });
    }

    function injectSendButton() {
        const composers = findInShadow('.o-mail-Composer', document);
        composers.forEach(composer => {
            if (!composer.querySelector('.oaksome-attach-btn')) {
                const attachBtn = document.createElement('button');
                attachBtn.className = 'oaksome-attach-btn';
                attachBtn.innerHTML = `<svg width="18" height="8" viewBox="0 0 18 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.61846 8H4.07453C2.94327 8 1.9822 7.60736 1.19132 6.8319C0.400445 6.05644 0 5.10429 0 4.00491C0 2.90552 0.390434 1.95337 1.18131 1.1681C1.9822 0.382822 2.94327 0 4.06452 0H7.60845V0.981595H4.06452C3.21357 0.981595 2.49277 1.27607 1.8921 1.86503C1.29143 2.45399 0.991101 3.17055 0.991101 3.99509C0.991101 4.81963 1.29143 5.5362 1.8921 6.12515C2.49277 6.71411 3.22358 7.00859 4.06452 7.00859H7.60845V7.99018L7.61846 8ZM5.49611 4.49571V3.51411H12.5039V4.49571H5.49611ZM10.3815 8V7.01841H13.9255C14.7764 7.01841 15.4972 6.72393 16.0979 6.13497C16.6986 5.54601 16.9989 4.82945 16.9989 4.00491C16.9989 3.18037 16.6986 2.4638 16.0979 1.87485C15.4972 1.28589 14.7664 0.991411 13.9255 0.991411H10.3815V0H13.9255C15.0567 0 16.0178 0.392638 16.8087 1.1681C17.6096 1.94356 18 2.89571 18 3.99509C18 5.09448 17.5996 6.04663 16.8087 6.82209C16.0178 7.60736 15.0467 7.99018 13.9255 7.99018H10.3815V8Z" fill="black"/></svg>`;
                attachBtn.title = 'Attach file';
                attachBtn.addEventListener('click', () => {
                    const nativeAttach = composer.querySelector('.o-mail-Composer-attachFiles, [title="Attach files"]');
                    if (nativeAttach) nativeAttach.click();
                });
                composer.appendChild(attachBtn);
            }
            if (!composer.querySelector('.oaksome-send-btn')) {
                const btn = document.createElement('button');
                btn.className = 'oaksome-send-btn';
                btn.innerHTML = `<svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.3423 16.5941L7.57366 16.5935L7.56688 1.51324L0.555325 8.5248L-0.00131034 7.96713L7.96575 6.96182e-05L15.9254 7.9745L15.3683 8.53165L8.36322 1.51361L8.3423 16.5941Z" fill="#F6F5F0"/></svg>`;
                btn.title = 'Send';
                btn.addEventListener('click', () => {
                    const textarea = composer.querySelector('.o-mail-Composer-input, textarea');
                    if (textarea) {
                        textarea.focus();
                        textarea.dispatchEvent(new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            keyCode: 13,
                            which: 13,
                            bubbles: true
                        }));
                    }
                });
                composer.appendChild(btn);
            }
        });
    }

    function forcePositionAndStyles() {
        const chatWindows = findInShadow('.o-mail-ChatWindow', document);
        chatWindows.forEach(win => {
            win.style.setProperty('bottom', '7rem', 'important');
            win.style.setProperty('right', '2rem', 'important');
            win.classList.remove('bottom-0');
            win.classList.remove('rounded-top-3');
            win.style.setProperty('padding-top', '0', 'important');
            const header = win.querySelector('.o-mail-ChatWindow-header');
            if (header) {
                header.style.setProperty('display', 'none', 'important');
                header.style.setProperty('height', '0', 'important');
                header.style.setProperty('overflow', 'hidden', 'important');
            }
        });
    }

    function tick() {
        injectStyles();
        walkAndInject(document);
        forcePositionAndStyles();
        injectTopBar();
        injectSendButton();
        interceptLivechatClick();
        injectChatButton();
        updateChatButtonVisibility();
    }

    function injectShadowStyles(shadowRoot) {
        if (!shadowRoot || shadowRoot.querySelector('#oaksome-livechat-styles')) return;
        const style = document.createElement('style');
        style.id = 'oaksome-livechat-styles';
        style.textContent = LIVECHAT_STYLES;
        shadowRoot.appendChild(style);
    }

    function walkAndInject(root) {
        if (!root) return;
        root.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) {
                injectShadowStyles(el.shadowRoot);
                walkAndInject(el.shadowRoot);
            }
        });
    }

    const styleObserver = new MutationObserver(tick);
    styleObserver.observe(document.body, {childList: true, subtree: true});

    const shadowObserver = new MutationObserver(tick);
    const observedRoots = new WeakSet();

    window.addEventListener('scroll', updateChatButtonVisibility, {passive: true});
    window.addEventListener('resize', updateChatButtonVisibility);

    function observeShadowRoots(root) {
        if (!root) return;
        root.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot && !observedRoots.has(el.shadowRoot)) {
                shadowObserver.observe(el.shadowRoot, {childList: true, subtree: true});
                observedRoots.add(el.shadowRoot);
                observeShadowRoots(el.shadowRoot);
            }
        });
    }

    setInterval(() => {
        observeShadowRoots(document);
        tick();
    }, 200);

    tick();
})();