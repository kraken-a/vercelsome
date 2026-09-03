// Accordéon pages légales (CGV, PDC & Cookies) — composant charté Figma.
// Réutilise les .legal-section numérotées : wrappe le contenu sous le h2 + toggle +/×.
(function () {
    var wrap = document.querySelector('.legal-acc');
    if (!wrap) return;
    var secs = wrap.querySelectorAll('.legal-section');
    for (var i = 0; i < secs.length; i++) {
        (function (sec, idx) {
            var h2 = sec.querySelector('h2, h3');
            if (!h2) return;
            var body = document.createElement('div');
            body.className = 'legal-body';
            while (h2.nextSibling) body.appendChild(h2.nextSibling);
            sec.appendChild(body);

            var tg = document.createElement('span');
            tg.className = 'legal-toggle';
            tg.setAttribute('aria-hidden', 'true');
            h2.appendChild(tg);

            h2.setAttribute('role', 'button');
            h2.setAttribute('tabindex', '0');
            if (idx !== 0) sec.classList.add('collapsed');
            var collapsed = sec.classList.contains('collapsed');
            tg.textContent = collapsed ? '+' : '×';
            h2.setAttribute('aria-expanded', collapsed ? 'false' : 'true');

            function toggle() {
                var c = sec.classList.toggle('collapsed');
                tg.textContent = c ? '+' : '×';
                h2.setAttribute('aria-expanded', c ? 'false' : 'true');
            }

            h2.addEventListener('click', toggle);
            h2.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle();
                }
            });
        })(secs[i], i);
    }
})();
