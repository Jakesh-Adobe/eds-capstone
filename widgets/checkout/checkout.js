import {
  getItems, getTotals, formatPrice, clear,
} from '../../scripts/cart.js';
import { addOrder } from '../../scripts/account.js';

const FIELD_ERRORS = {
  name: 'Please enter your full name.',
  email: 'Please enter a valid email address.',
  phone: 'Please enter a valid phone number.',
  address: 'Please enter your street address.',
  city: 'Please enter your city.',
  state: 'Please enter your state or province.',
  zip: 'Please enter a valid ZIP / postal code.',
};

function validateField(input) {
  const error = input.closest('.checkout-field').querySelector('.checkout-field-error');
  const valid = input.checkValidity();
  input.setAttribute('aria-invalid', String(!valid));
  error.textContent = valid ? '' : FIELD_ERRORS[input.name];
  return valid;
}

/**
 * Validates every field in the shipping form and returns the values if valid.
 * @param {HTMLFormElement} form The checkout shipping form
 * @returns {object|null} shipping details, or null if the form is invalid
 */
function validateForm(form) {
  const inputs = [...form.querySelectorAll('input')];
  const results = inputs.map((input) => validateField(input));
  if (results.includes(false)) {
    inputs[results.indexOf(false)].focus();
    return null;
  }
  return Object.fromEntries(inputs.map((input) => [input.name, input.value.trim()]));
}

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
  const form = widget.querySelector('.checkout-form');
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

  form.querySelectorAll('input').forEach((input) => {
    input.addEventListener('blur', () => validateField(input));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const shipping = validateForm(form);
    if (!shipping) return;

    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    addOrder({
      orderId,
      date: new Date().toISOString(),
      status: 'Processing',
      total: totals.total,
      currency: totals.currency,
      itemsCount: totals.count,
      shipping,
    });
    orderIdEl.textContent = orderId;
    content.hidden = true;
    confirmation.hidden = false;
    clear();
  });
}
