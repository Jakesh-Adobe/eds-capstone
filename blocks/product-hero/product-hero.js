import { getMetadata } from '../../scripts/aem.js';
import { addItem, formatPrice } from '../../scripts/cart.js';

/**
 * loads and decorates the product hero, wiring the CTA to the cart
 * @param {Element} block The product-hero block element
 */
export default function decorate(block) {
  const row = block.children[0];
  if (!row) return;

  [...row.children].forEach((col) => {
    col.className = (col.children.length === 1 && col.querySelector('picture'))
      ? 'product-hero-image'
      : 'product-hero-content';
  });

  const content = block.querySelector('.product-hero-content');
  if (!content) return;

  const sku = getMetadata('sku');
  const price = getMetadata('price');
  const currency = getMetadata('currency') || 'USD';
  const heading = content.querySelector('h1, h2');
  const name = heading ? heading.textContent.trim() : document.title;
  const image = block.querySelector('.product-hero-image img')?.src || '';

  if (price && heading) {
    const priceEl = document.createElement('p');
    priceEl.className = 'product-hero-price';
    priceEl.textContent = formatPrice(price, currency);
    heading.insertAdjacentElement('afterend', priceEl);
  }

  const cta = content.querySelector('a.button');
  if (cta && sku) {
    cta.addEventListener('click', (e) => {
      e.preventDefault();
      addItem({
        sku, name, price, currency, image, path: window.location.pathname,
      });
      const original = cta.textContent;
      cta.textContent = 'Added';
      setTimeout(() => { cta.textContent = original; }, 1500);
    });
  }
}
