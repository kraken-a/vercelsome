(function() {
  var nav = document.querySelector('nav');
  if (!nav) return;
  var threshold = 80;
  function onScroll() {
    if (window.scrollY > threshold) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
