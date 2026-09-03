import { getMetadata, createOptimizedPicture } from '../../scripts/aem.js';
import { getProductBySku, getRelatedProducts, formatPrice } from '../../scripts/commerce.js';

function renderCard(product) {
  const li = document.createElement('li');
  li.className = 'related-products-card';

  const link = document.createElement('a');
  link.href = product.path;
  if (product.image) link.append(createOptimizedPicture(product.image, product.title, false, [{ width: '300' }]));

  const body = document.createElement('div');
  body.className = 'related-products-body';
  body.innerHTML = `
    <h3><a href="${product.path}">${product.title}</a></h3>
    <p class="related-products-price">${formatPrice(product.price, product.currency)}</p>
  `;

  li.append(link, body);
  return li;
}

/**
 * loads related products from the same category, driven entirely by the current
 * page's `sku`/`category` metadata — the block itself carries no authored rows.
 * @param {Element} block The related-products block element
 */
export default async function decorate(block) {
  block.textContent = '';
  const sku = getMetadata('sku');
  if (!sku) return;

  const current = await getProductBySku(sku);
  if (!current) return;

  const related = await getRelatedProducts(current, 4);
  if (!related.length) return;

  const heading = document.createElement('h2');
  heading.className = 'related-products-heading';
  heading.textContent = 'You may also like';

  const list = document.createElement('ul');
  list.className = 'related-products-grid';
  related.forEach((product) => list.append(renderCard(product)));

  block.append(heading, list);
}
