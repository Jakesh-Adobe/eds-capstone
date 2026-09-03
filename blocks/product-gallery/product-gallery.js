import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * loads and decorates the product gallery as a single filmstrip row: the
 * selected image grows, the rest stay visible at a smaller size.
 * @param {Element} block The product-gallery block element
 */
export default function decorate(block) {
  const images = [...block.querySelectorAll('picture > img')];
  if (!images.length) return;

  const list = document.createElement('ul');
  list.className = 'product-gallery-items';

  images.forEach((img, idx) => {
    const item = document.createElement('li');
    item.className = 'product-gallery-item';
    item.setAttribute('aria-current', idx === 0 ? 'true' : 'false');

    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `View image ${idx + 1}`);
    button.append(createOptimizedPicture(img.src, img.alt, idx === 0, [{ width: '800' }]));
    button.addEventListener('click', () => {
      list.querySelectorAll('.product-gallery-item').forEach((el) => el.setAttribute('aria-current', 'false'));
      item.setAttribute('aria-current', 'true');
    });

    item.append(button);
    list.append(item);
  });

  block.textContent = '';
  block.append(list);
}
