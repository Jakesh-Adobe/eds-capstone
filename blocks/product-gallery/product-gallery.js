import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * loads and decorates the product gallery: a main viewer plus clickable thumbnails
 * @param {Element} block The product-gallery block element
 */
export default function decorate(block) {
  const images = [...block.querySelectorAll('picture > img')];
  if (!images.length) return;

  const viewer = document.createElement('div');
  viewer.className = 'product-gallery-viewer';
  viewer.append(createOptimizedPicture(images[0].src, images[0].alt, true, [{ width: '1000' }]));

  const thumbs = document.createElement('ul');
  thumbs.className = 'product-gallery-thumbs';

  images.forEach((img, idx) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'product-gallery-thumb';
    button.setAttribute('aria-label', `View image ${idx + 1}`);
    button.setAttribute('aria-current', idx === 0 ? 'true' : 'false');
    button.append(createOptimizedPicture(img.src, img.alt, false, [{ width: '150' }]));
    button.addEventListener('click', () => {
      const mainImg = viewer.querySelector('img');
      mainImg.src = img.src;
      mainImg.alt = img.alt;
      thumbs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', 'false'));
      button.setAttribute('aria-current', 'true');
    });
    li.append(button);
    thumbs.append(li);
  });

  block.textContent = '';
  block.append(viewer);
  if (images.length > 1) block.append(thumbs);
}
