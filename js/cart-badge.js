(() => {
  function updateCartBadge() {
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem('carrinho')) || []; } catch {}
    const count = Array.isArray(cart) ? cart.reduce((sum, item) => {
      const quantity = Number(item?.quantidade);
      return sum + (Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 0);
    }, 0) : 0;
    document.querySelectorAll('header nav a[href$="carrinho.html"]').forEach(link => {
      let badge = link.querySelector('.cart-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'cart-badge';
        badge.setAttribute('aria-hidden', 'true');
        link.appendChild(badge);
        link.classList.add('cart-menu-link');
      }
      badge.textContent = String(count);
      link.setAttribute('aria-label', `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`);
    });
  }
  window.addEventListener('acalma:cart-updated', updateCartBadge);
  window.addEventListener('storage', event => {
    if (event.key === 'carrinho' || event.key === null) updateCartBadge();
  });
  window.addEventListener('pageshow', updateCartBadge);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updateCartBadge);
  else updateCartBadge();
})();
