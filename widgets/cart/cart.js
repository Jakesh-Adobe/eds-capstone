import {
  getItems, getTotals, onChange, removeItem, updateQty, formatPrice,
} from '../../scripts/cart.js';

function renderItems(list, items) {
  list.innerHTML = items.map((item) => `
    <li class="cart-item" data-sku="${item.sku}">
      ${item.image ? `<img src="${item.image}" alt="" loading="lazy" width="72" height="72">` : '<span class="cart-item-thumb"></span>'}
      <div class="cart-item-detail">
        <a href="${item.path}">${item.name}</a>
        <p class="cart-item-price">${formatPrice(item.price, item.currency)}</p>
        <div class="cart-item-qty">
          <button type="button" class="cart-qty-decrease" aria-label="Decrease quantity">-</button>
          <input type="number" class="cart-qty-input" min="1" max="99" value="${item.qty}" aria-label="${item.name} quantity">
          <button type="button" class="cart-qty-increase" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <p class="cart-item-total">${formatPrice(item.price * item.qty, item.currency)}</p>
      <button type="button" class="cart-item-remove" aria-label="Remove ${item.name}">&times;</button>
    </li>
  `).join('');
}

/**
 * loads and decorates the cart page widget
 * @param {Element} widget The cart widget element
 */
export default function decorate(widget) {
  const empty = widget.querySelector('.cart-empty');
  const content = widget.querySelector('.cart-content');
  const list = widget.querySelector('.cart-items');
  const subtotal = widget.querySelector('.cart-subtotal-value');

  function render() {
    const items = getItems();
    empty.hidden = items.length > 0;
    content.hidden = items.length === 0;
    if (!items.length) return;
    renderItems(list, items);
    subtotal.textContent = formatPrice(getTotals().subtotal, getTotals().currency);
  }

  list.addEventListener('click', (e) => {
    const item = e.target.closest('.cart-item');
    if (!item) return;
    const { sku } = item.dataset;
    if (e.target.closest('.cart-item-remove')) {
      removeItem(sku);
    } else if (e.target.closest('.cart-qty-decrease')) {
      updateQty(sku, Number(item.querySelector('.cart-qty-input').value) - 1);
    } else if (e.target.closest('.cart-qty-increase')) {
      updateQty(sku, Number(item.querySelector('.cart-qty-input').value) + 1);
    }
  });

  list.addEventListener('change', (e) => {
    if (!e.target.classList.contains('cart-qty-input')) return;
    updateQty(e.target.closest('.cart-item').dataset.sku, Number(e.target.value));
  });

  onChange(render);
  render();
}
