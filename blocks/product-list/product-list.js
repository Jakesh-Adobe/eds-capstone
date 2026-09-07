import { createOptimizedPicture } from '../../scripts/aem.js';
import { getProductsByCategory, getNewArrivals, formatPrice } from '../../scripts/commerce.js';

/**
 * Category slug from the current page path, e.g. /category/plants -> "plants".
 * @returns {string|null}
 */
function pathCategory() {
  const match = window.location.pathname.match(/^\/category\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * True on the dedicated /new-arrivals page.
 * @returns {boolean}
 */
function isNewArrivalsPath() {
  return window.location.pathname.replace(/\/$/, '') === '/new-arrivals';
}

/**
 * Reads an optional authored override: a link to a category page picks the
 * category explicitly, so the block can also be used e.g. on the home page.
 * @param {Element} block The product-list block element
 * @returns {string|null}
 */
function authoredCategory(block) {
  const link = block.querySelector('a[href*="/category/"]');
  if (!link) return null;
  const { pathname } = new URL(link.href, window.location.href);
  return pathname.split('/').filter(Boolean)[1] || null;
}

/**
 * Reads an optional authored override: a link to /new-arrivals picks that mode
 * explicitly, so the block can also be used e.g. on the home page.
 * @param {Element} block The product-list block element
 * @returns {boolean}
 */
function authoredNewArrivals(block) {
  const link = block.querySelector('a[href*="/new-arrivals"]');
  return !!link;
}

function renderCard(product) {
  const li = document.createElement('li');
  li.className = 'product-list-card';

  const imageLink = document.createElement('a');
  imageLink.className = 'product-list-image';
  imageLink.href = product.path;
  if (product.image) {
    imageLink.append(createOptimizedPicture(product.image, product.title, false, [{ width: '400' }]));
  }

  const body = document.createElement('div');
  body.className = 'product-list-body';
  body.innerHTML = `
    <h3><a href="${product.path}">${product.title}</a></h3>
    <p class="product-list-price">${formatPrice(product.price, product.currency)}</p>
  `;

  li.append(imageLink, body);
  return li;
}

function renderGrid(products) {
  const list = document.createElement('ul');
  list.className = 'product-list-grid';
  if (!products.length) {
    list.innerHTML = '<li class="product-list-empty">No products found.</li>';
    return list;
  }
  products.forEach((product) => list.append(renderCard(product)));
  return list;
}

/**
 * Renders an "All" + one pill per category filter bar. Selecting a pill
 * re-renders the grid client-side (no navigation) and syncs `?category=`.
 * @param {Array<object>} products All products across every category
 * @returns {Element}
 */
function renderFilters(products) {
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
  const params = new URLSearchParams(window.location.search);
  const active = params.get('category') || '';

  const bar = document.createElement('div');
  bar.className = 'product-list-filters';

  const gridWrapper = document.createElement('div');
  gridWrapper.append(renderGrid(active ? products.filter((p) => p.category === active) : products));

  const buttons = ['', ...categories].map((category) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'product-list-filter';
    button.textContent = category || 'All';
    button.setAttribute('aria-pressed', String(category === active));
    button.addEventListener('click', () => {
      bar.querySelectorAll('.product-list-filter').forEach((btn) => btn.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
      const filtered = category ? products.filter((p) => p.category === category) : products;
      gridWrapper.replaceChildren(renderGrid(filtered));
      const url = new URL(window.location.href);
      if (category) url.searchParams.set('category', category);
      else url.searchParams.delete('category');
      window.history.replaceState({}, '', url);
    });
    return button;
  });

  bar.append(...buttons);
  return [bar, gridWrapper];
}

export default async function decorate(block) {
  const category = authoredCategory(block) || pathCategory();
  const newArrivals = authoredNewArrivals(block) || isNewArrivalsPath();
  block.textContent = '';

  if (category) {
    const products = await getProductsByCategory(category);
    block.append(renderGrid(products));
    return;
  }

  if (newArrivals) {
    const products = await getNewArrivals();
    block.append(renderGrid(products));
    return;
  }

  const products = await getProductsByCategory();
  if (!products.length) {
    block.innerHTML = '<p class="product-list-empty">No products found.</p>';
    return;
  }
  block.append(...renderFilters(products));
}
