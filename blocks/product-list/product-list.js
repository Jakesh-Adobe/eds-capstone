import { createOptimizedPicture } from '../../scripts/aem.js';
import { getProductsByCategory, formatPrice } from '../../scripts/commerce.js';

/**
 * Category slug from the current page path, e.g. /category/plants -> "plants".
 * @returns {string|null}
 */
function pathCategory() {
  const match = window.location.pathname.match(/^\/category\/([^/]+)/);
  return match ? match[1] : null;
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

export default async function decorate(block) {
  const category = authoredCategory(block) || pathCategory();
  block.textContent = '';

  const products = await getProductsByCategory(category);
  if (!products.length) {
    block.innerHTML = '<p class="product-list-empty">No products found.</p>';
    return;
  }

  const list = document.createElement('ul');
  list.className = 'product-list-grid';
  products.forEach((product) => list.append(renderCard(product)));
  block.append(list);
}
