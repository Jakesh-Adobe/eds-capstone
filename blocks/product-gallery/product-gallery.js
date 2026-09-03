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

  /* swap the whole <picture> (not just the <img> src) — the <source> srcsets
     take priority over the fallback <img>, so only replacing img.src would
     leave the previous image showing in browsers that support <picture> */
  const setMainImage = (img) => {
    viewer.replaceChildren(createOptimizedPicture(img.src, img.alt, true, [{ width: '1000' }]));
  };
  setMainImage(images[0]);

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
      setMainImage(img);
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
