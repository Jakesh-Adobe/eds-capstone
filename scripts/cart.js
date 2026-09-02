const STORAGE_KEY = 'eds-cart';
const STORAGE_VERSION = 1;
const MAX_QTY = 99;
const CHANGE_EVENT = 'cart:change';

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toText(value) {
  return typeof value === 'string' ? value : '';
}

function clampQty(value) {
  const qty = Math.round(toNumber(value, 1));
  return Math.min(Math.max(qty, 1), MAX_QTY);
}

/* localStorage is user-writable, so every field is coerced before use */
function sanitizeItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const sku = toText(raw.sku).trim();
  if (!sku) return null;
  return {
    sku,
    name: toText(raw.name).trim() || sku,
    price: Math.max(toNumber(raw.price), 0),
    currency: toText(raw.currency).trim() || 'USD',
    image: toText(raw.image),
    path: toText(raw.path),
    variant: toText(raw.variant),
    qty: clampQty(raw.qty),
  };
}

function read() {
  let parsed;
  try {
    parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
  if (!parsed || parsed.v !== STORAGE_VERSION || !Array.isArray(parsed.items)) return [];
  return parsed.items.map(sanitizeItem).filter(Boolean);
}

export function getItems() {
  return read();
}

export function getCount() {
  return read().reduce((sum, item) => sum + item.qty, 0);
}

export function getTotals() {
  const items = read();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return {
    count: items.reduce((sum, item) => sum + item.qty, 0),
    subtotal,
    shipping: 0,
    total: subtotal,
    currency: items[0]?.currency || 'USD',
  };
}

function write(items) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ v: STORAGE_VERSION, items }),
    );
  } catch {
    // quota exceeded or storage disabled — keep the in-memory result usable
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, {
    detail: { items, totals: getTotals() },
  }));
  return items;
}

export function addItem(product, qty = 1) {
  const item = sanitizeItem({ ...product, qty });
  if (!item) return read();
  const items = read();
  const existing = items.find((i) => i.sku === item.sku && i.variant === item.variant);
  if (existing) {
    existing.qty = clampQty(existing.qty + item.qty);
  } else {
    items.push(item);
  }
  return write(items);
}

export function updateQty(sku, qty) {
  const items = read();
  const item = items.find((i) => i.sku === sku);
  if (!item) return items;
  if (toNumber(qty, 1) < 1) return write(items.filter((i) => i.sku !== sku));
  item.qty = clampQty(qty);
  return write(items);
}

export function removeItem(sku) {
  return write(read().filter((i) => i.sku !== sku));
}

export function clear() {
  return write([]);
}

export function onChange(callback) {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

export function formatPrice(value, currency = 'USD') {
  try {
    return new Intl.NumberFormat(document.documentElement.lang || 'en', {
      style: 'currency',
      currency,
    }).format(toNumber(value));
  } catch {
    return `$${toNumber(value).toFixed(2)}`;
  }
}

/* lets blocks add to cart without importing this module */
window.addEventListener('cart:add', (e) => addItem(e.detail, e.detail?.qty));

/* keep the badge in sync when the cart changes in another tab */
window.addEventListener('storage', (e) => {
  if (e.key !== STORAGE_KEY) return;
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, {
    detail: { items: read(), totals: getTotals() },
  }));
});
