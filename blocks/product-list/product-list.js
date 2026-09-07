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
 * Applies the current title/price/(optional) category filters to a product list.
 * @param {Array<object>} products
 * @param {object} filters
 * @returns {Array<object>}
 */
function applyFilters(products, filters) {
  return products.filter((product) => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.q && !product.title.toLowerCase().includes(filters.q)) return false;
    if (filters.minPrice != null && product.price < filters.minPrice) return false;
    if (filters.maxPrice != null && product.price > filters.maxPrice) return false;
    return true;
  });
}

/**
 * Reads the initial filter state from the URL so filtered views are shareable/bookmarkable.
 * @param {boolean} withCategory Whether `?category=` applies on this page
 * @returns {object}
 */
function readFiltersFromUrl(withCategory) {
  const params = new URLSearchParams(window.location.search);
  return {
    category: withCategory ? (params.get('category') || '') : '',
    q: (params.get('q') || '').toLowerCase(),
    minPrice: params.has('minPrice') ? Number(params.get('minPrice')) : null,
    maxPrice: params.has('maxPrice') ? Number(params.get('maxPrice')) : null,
  };
}

function writeFiltersToUrl(filters) {
  const url = new URL(window.location.href);
  Object.entries(filters).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined || Number.isNaN(value)) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });
  window.history.replaceState({}, '', url);
}

/**
 * Renders the product list toolbar (title search + price range, plus an
 * optional "All" + per-category pill bar) and the grid it controls. Every
 * change re-filters client-side (no navigation) and syncs the URL.
 * @param {Array<object>} products The products this page can show
 * @param {{showCategoryFilter: boolean}} options
 * @returns {Array<Element>}
 */
function renderToolbar(products, { showCategoryFilter }) {
  const filters = readFiltersFromUrl(showCategoryFilter);
  const toolbar = document.createElement('div');
  toolbar.className = 'product-list-toolbar';
  const gridWrapper = document.createElement('div');

  const rerender = () => {
    gridWrapper.replaceChildren(renderGrid(applyFilters(products, filters)));
    writeFiltersToUrl(filters);
  };

  if (showCategoryFilter) {
    const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
    const pills = document.createElement('div');
    pills.className = 'product-list-filters';
    ['', ...categories].forEach((category) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'product-list-filter';
      button.textContent = category || 'All';
      button.setAttribute('aria-pressed', String(category === filters.category));
      button.addEventListener('click', () => {
        filters.category = category;
        pills.querySelectorAll('.product-list-filter').forEach((btn) => btn.setAttribute('aria-pressed', 'false'));
        button.setAttribute('aria-pressed', 'true');
        rerender();
      });
      pills.append(button);
    });
    toolbar.append(pills);
  }

  const searchRow = document.createElement('div');
  searchRow.className = 'product-list-search-row';

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'product-list-search';
  search.placeholder = 'Search by name';
  search.setAttribute('aria-label', 'Search products by name');
  search.value = filters.q;
  search.addEventListener('input', () => {
    filters.q = search.value.trim().toLowerCase();
    rerender();
  });

  const minPrice = document.createElement('input');
  minPrice.type = 'number';
  minPrice.min = '0';
  minPrice.className = 'product-list-price-input';
  minPrice.placeholder = 'Min price';
  minPrice.setAttribute('aria-label', 'Minimum price');
  if (filters.minPrice != null) minPrice.value = filters.minPrice;
  minPrice.addEventListener('input', () => {
    filters.minPrice = minPrice.value === '' ? null : Number(minPrice.value);
    rerender();
  });

  const maxPrice = document.createElement('input');
  maxPrice.type = 'number';
  maxPrice.min = '0';
  maxPrice.className = 'product-list-price-input';
  maxPrice.placeholder = 'Max price';
  maxPrice.setAttribute('aria-label', 'Maximum price');
  if (filters.maxPrice != null) maxPrice.value = filters.maxPrice;
  maxPrice.addEventListener('input', () => {
    filters.maxPrice = maxPrice.value === '' ? null : Number(maxPrice.value);
    rerender();
  });

  searchRow.append(search, minPrice, maxPrice);
  toolbar.append(searchRow);

  gridWrapper.append(renderGrid(applyFilters(products, filters)));
  return [toolbar, gridWrapper];
}

export default async function decorate(block) {
  const category = authoredCategory(block) || pathCategory();
  const newArrivals = authoredNewArrivals(block) || isNewArrivalsPath();
  block.textContent = '';

  if (newArrivals) {
    const products = await getNewArrivals();
    block.append(renderGrid(products));
    return;
  }

  const products = category
    ? await getProductsByCategory(category)
    : await getProductsByCategory();

  if (!products.length) {
    block.innerHTML = '<p class="product-list-empty">No products found.</p>';
    return;
  }
  block.append(...renderToolbar(products, { showCategoryFilter: !category }));
}
