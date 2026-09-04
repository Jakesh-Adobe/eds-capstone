import {
  getItems, getTotals, formatPrice, clear,
} from '../../scripts/cart.js';

function renderItems(list, items) {
  list.innerHTML = items.map((item) => `
    <li class="checkout-item">
      ${item.image ? `<img src="${item.image}" alt="" loading="lazy" width="56" height="56">` : ''}
      <span class="checkout-item-detail">
        <span>${item.name}</span>
        <span class="checkout-item-meta">${item.qty} &times; ${formatPrice(item.price, item.currency)}</span>
      </span>
      <span class="checkout-item-total">${formatPrice(item.price * item.qty, item.currency)}</span>
    </li>
  `).join('');
}

/**
 * loads and decorates the checkout summary widget (no payment gateway)
 * @param {Element} widget The checkout widget element
 */
export default function decorate(widget) {
  const empty = widget.querySelector('.checkout-empty');
  const content = widget.querySelector('.checkout-content');
  const confirmation = widget.querySelector('.checkout-confirmation');
  const list = widget.querySelector('.checkout-items');
  const subtotalEl = widget.querySelector('.checkout-subtotal');
  const totalEl = widget.querySelector('.checkout-total-value');
  const placeOrder = widget.querySelector('.checkout-place-order');
  const orderIdEl = widget.querySelector('.checkout-order-id');

  const items = getItems();
  if (!items.length) {
    empty.hidden = false;
    return;
  }

  const totals = getTotals();
  content.hidden = false;
  renderItems(list, items);
  subtotalEl.textContent = formatPrice(totals.subtotal, totals.currency);
  totalEl.textContent = formatPrice(totals.total, totals.currency);

  placeOrder.addEventListener('click', () => {
    orderIdEl.textContent = `ORD-${Date.now().toString(36).toUpperCase()}`;
    content.hidden = true;
    confirmation.hidden = false;
    clear();
  });
}
