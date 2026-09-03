/** @odoo-module **/

export function showAddedNotification(productName, quantity) {

    console.log('notification is up');
    const message = `${quantity} item${quantity > 1 ? 's' : ''} Added to your cart: ${productName}`;

    const notif = document.createElement('div');
    notif.style.position = 'fixed';
    notif.style.top = '20px';
    notif.style.right = '20px';
    notif.style.maxWidth = '380px';
    notif.style.padding = '25px 40px';
    notif.style.background = 'linear-gradient(45deg, #ff6ec4, #7873f5, #4ade80, #facc15)';
    notif.style.backgroundSize = '400% 400%';
    notif.style.color = '#fff';
    notif.style.fontSize = '20px';
    notif.style.fontWeight = '700';
    notif.style.borderRadius = '16px';
    notif.style.boxShadow = '0 12px 30px rgba(255, 110, 196, 0.6), 0 8px 20px rgba(120, 115, 245, 0.5)';
    notif.style.zIndex = 10000;
    notif.style.opacity = '1';
    notif.style.transition = 'opacity 0.6s ease, transform 0.3s ease';
    notif.style.display = 'flex';
    notif.style.alignItems = 'center';
    notif.style.gap = '20px';
    notif.style.cursor = 'default';
    notif.style.userSelect = 'none';
    notif.style.overflow = 'visible';

    //FIXME gradient transition)
    notif.animate(
        [
            { backgroundPosition: '0% 50%' },
            { backgroundPosition: '100% 50%' },
            { backgroundPosition: '0% 50%' }
        ],
        {
            duration: 8000,
            iterations: Infinity,
            easing: 'ease-in-out'
        }
    );

    //FIXME Very cool sparkles
    const sparklesContainer = document.createElement('div');
    sparklesContainer.style.position = 'absolute';
    sparklesContainer.style.top = '0';
    sparklesContainer.style.left = '0';
    sparklesContainer.style.width = '100%';
    sparklesContainer.style.height = '100%';
    sparklesContainer.style.pointerEvents = 'none';
    notif.appendChild(sparklesContainer);

    for (let i = 0; i < 10; i++) {
        const sparkle = document.createElement('div');
        sparkle.style.position = 'absolute';
        const size = 4 + Math.random() * 4;
        sparkle.style.width = `${size}px`;
        sparkle.style.height = `${size}px`;
        sparkle.style.background = 'white';
        sparkle.style.borderRadius = '50%';
        sparkle.style.opacity = Math.random() * 0.7 + 0.3;
        sparkle.style.top = `${Math.random() * 100}%`;
        sparkle.style.left = `${Math.random() * 100}%`;
        sparkle.style.filter = 'drop-shadow(0 0 6px white)';
        sparkle.style.animation = `sparkle-flicker ${1 + Math.random() * 2}s infinite ease-in-out`;
        sparklesContainer.appendChild(sparkle);
    }

    if (!document.getElementById('sparkle-style')) {
        const style = document.createElement('style');
        style.id = 'sparkle-style';
        style.textContent = `
            @keyframes sparkle-flicker {
                0%, 100% { opacity: 0.3; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.4); }
            }
        `;
        document.head.appendChild(style);
    }

    //FIXME clickable notification cuz why not
    const iconLink = document.createElement('a');
    iconLink.href = '/my-cart';    //FIXME change to base

    iconLink.style.display = 'inline-block';
    iconLink.style.cursor = 'pointer';
    iconLink.style.flexShrink = '0';
    iconLink.style.filter = 'drop-shadow(0 0 4px #fff)';
    iconLink.style.transition = 'transform 0.3s ease';

    iconLink.innerHTML = `
        <svg style="width:36px; height:36px; fill:#fff;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M7 18c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zm10 0c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zM7.16 14.26l10.43-1.63 1.11-5.15H6.21L5.21 4H2v2h2l3.6 7.59-1.35 2.44c-.16.29-.25.63-.25.97 0 1.1.9 2 2 2h12v-2H7.42c-.12 0-.24-.06-.32-.16z"/>
        </svg>
    `;

    notif.appendChild(iconLink);

    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    notif.appendChild(messageDiv);

    //FIXME get bigger
    notif.addEventListener('mouseenter', () => {
        notif.style.transform = 'scale(1.1)';
        iconLink.style.transform = 'scale(1.3)';
        clearTimeout(hideTimeout);
    });
    notif.addEventListener('mouseleave', () => {
        notif.style.transform = 'scale(1)';
        iconLink.style.transform = 'scale(1)';
        hideTimeout = setTimeout(() => {
            notif.style.opacity = '0';
            setTimeout(() => notif.remove(), 700);
        }, 3000);
    });

    let hideTimeout = setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 700);
    }, 6000);


    const closeBtn = document.createElement('button');
    closeBtn.textContent = '❌';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '8px';
    closeBtn.style.right = '12px';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.color = '#fff';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = 'none';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.zIndex = '10001';
    closeBtn.style.padding = '0';
    closeBtn.style.lineHeight = '1';

    closeBtn.addEventListener('click', () => {
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 300);
    });

    notif.appendChild(closeBtn);

    console.log("Appending notification:", notif);
    document.body.appendChild(notif);
}

//export class CustomAddToCartNotification extends Component {
//    static template = "oaksome_backend.CustomAddToCartNotification";
//
//    static props = {
//        lines: Array,
//        currency_id: Number,
//    };
//
//    getFormattedPrice(line) {
//        return formatCurrency(line.line_price_total, this.props.currency_id);
//    }
//
//    getProductSummary(line) {
//        return `${line.quantity} × ${line.name}`;
//    }
//
//    mounted() {
//        setTimeout(() => this.destroy(), 4000);
//    }
//}
