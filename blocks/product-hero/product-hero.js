import { getMetadata } from '../../scripts/aem.js';
import { addItem, formatPrice } from '../../scripts/cart.js';

/**
 * loads and decorates the product hero, wiring the CTA to the cart
 * @param {Element} block The product-hero block element
 */
export default function decorate(block) {
  /* merge every authored row into exactly one image column + one content column,
     so it still lays out side-by-side even if the image/copy were authored as
     separate rows instead of a single 2-column row */
  const image = document.createElement('div');
  image.className = 'product-hero-image';
  const content = document.createElement('div');
  content.className = 'product-hero-content';

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const target = (col.children.length === 1 && col.querySelector('picture'))
        ? image
        : content;
      while (col.firstChild) target.append(col.firstChild);
    });
  });

  block.replaceChildren(image, content);
  if (!content.hasChildNodes()) return;

  const sku = getMetadata('sku');
  const price = getMetadata('price');
  const currency = getMetadata('currency') || 'USD';
  const heading = content.querySelector('h1, h2');
  const name = heading ? heading.textContent.trim() : document.title;
  const heroImage = image.querySelector('img')?.src || '';

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
        sku, name, price, currency, image: heroImage, path: window.location.pathname,
      });
      const original = cta.textContent;
      cta.textContent = 'Added';
      setTimeout(() => { cta.textContent = original; }, 1500);
    });
  }
}
