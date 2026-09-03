/** @odoo-module **/

export function showSignUpModal(productUrl) {
    return new Promise((resolve) => {
        const style = document.createElement("style");
        style.innerHTML = `
        .signup-modal {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
            z-index: 9999;
        }
        .signup-modal.show {
            opacity: 1;
            pointer-events: auto;
        }
        .signup-modal .modal-content {
            background: #fff;
            border-radius: 18px;
            max-width: 500px;
            width: 90%;
            padding: 2rem;
            transform: translateY(20px);
            animation: slideUp 0.3s ease forwards;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .signup-modal .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: none;
        }
        .signup-modal .modal-title {
            font-size: 1.6rem;
            font-weight: 700;
        }
        .signup-modal .btn-close {
            border: none;
            background: transparent;
            font-size: 1.2rem;
            cursor: pointer;
            color: #666;
            transition: color 0.2s;
        }
        .signup-modal .btn-close:hover { color: #000; }
        .signup-modal input[type="email"] {
            padding: 0.8rem;
            font-size: 1rem;
            border-radius: 8px;
            border: 1px solid #ccc;
            width: 100%;
            margin-bottom: 1rem;
            transition: border 0.2s;
        }
        .signup-modal input[type="email"]:focus {
            border-color: #C1FD48;
            outline: none;
        }
        .signup-modal .checkbox-row {
            display: flex;
            align-items: start;
            gap: 0.5rem;
            font-size: 0.85rem;
            color: #555;
            margin-bottom: 1rem;
        }
        .signup-modal .checkbox-row a {
            color: #007BFF;
            text-decoration: none;
        }
        .signup-modal .checkbox-row a:hover {
            text-decoration: underline;
        }
        .signup-modal .btn-neon-green {
            background-color: #C1FD48;
            color: #000;
            font-weight: 700;
            border-radius: 999px;
            padding: 0.75rem 1rem;
            border: none;
            width: 100%;
            transition: transform 0.2s;
            cursor: pointer;
        }
        .signup-modal .btn-neon-green:hover { transform: scale(1.05); }
    `;
        document.head.appendChild(style);

        const modal = document.createElement("div");
        modal.className = "signup-modal";
        modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header pb-0">
                <h5 class="modal-title">Get Your Product</h5>
                <button type="button" class="btn-close" aria-label="Close">&times;</button>
            </div>
            <div class="modal-body">
                <p>Uh oh, Looks like you don’t have an Oaksome account! Sign up or drop your email below and we’ll send your configured product link straight to your inbox.</p>
                <input type="email" id="signup_email" placeholder="Enter your email" required/>
                <div class="checkbox-row">
                    <input type="checkbox" id="agree_checkbox" />
                    <label for="agree_checkbox">By clicking here, you agree to receive our newsletter and accept our <a href="/privacy-policy" target="_blank">Privacy Policy</a>.</label>
                </div>
                <button type="button" class="btn-neon-green" id="send_email_btn">Send to My Inbox</button>
            </div>
        </div>
    `;
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add("show"), 10);
        const closeModal = () => {
            try { modal.classList.remove("show"); } catch (_) { /* noop */ }
            setTimeout(() => {
                try { modal.remove(); } catch (_) { /* already detached */ }
                resolve(null);
            }, 250);
        };
        modal.querySelector(".btn-close").addEventListener("click", closeModal);
        modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

        const emailInput = modal.querySelector("#signup_email");
        const sendButton = modal.querySelector("#send_email_btn");
        const agreeCheckbox = modal.querySelector("#agree_checkbox");

        try {
            const lastEmail = localStorage.getItem("last_config_email");
            if (lastEmail) emailInput.value = lastEmail;
        } catch (_) { /* storage unavailable (private mode / 3rd-party iframe) */ }

        const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        let submitted = false;

        const dismissAndResolve = (email) => {
            if (submitted) return;
            submitted = true;
            try {
                modal.classList.remove("show");
            } catch (_) { /* noop */ }
            // Always remove on the next frame — never depend on the transition firing
            setTimeout(() => {
                try { modal.remove(); } catch (_) { /* already detached */ }
                resolve(email);
            }, 250);
        };

        sendButton.addEventListener("click", () => {
            if (submitted) return;
            const email = emailInput.value.trim();
            if (!email || !EMAIL_RE.test(email)) {
                emailInput.focus();
                alert("Please enter a valid email address.");
                return;
            }
            if (!agreeCheckbox.checked) {
                agreeCheckbox.focus();
                alert("Please accept the terms to continue.");
                return;
            }

            try { localStorage.setItem("last_config_email", email); } catch (_) { /* ignore */ }

            try {
                modal.querySelector(".modal-body").innerHTML = `
                    <div class="text-center py-4">
                        <h5 class="fw-semibold mb-2">We're on it!</h5>
                        <p class="text-muted">We'll send your product link straight to your inbox.</p>
                    </div>`;
            } catch (_) { /* render failed — dismiss anyway */ }

            setTimeout(() => dismissAndResolve(email), 1200);
        });
    });
}
