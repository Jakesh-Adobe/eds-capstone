import { getMetadata } from '../../scripts/aem.js';

function titleCase(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Derives the breadcrumb trail entirely from the current page's URL/metadata —
 * the block is authored empty on category, shop, new-arrivals, and product pages.
 * @returns {Array<{label: string, href: string|null}>}
 */
function buildCrumbs() {
  const crumbs = [{ label: 'Home', href: '/' }];
  const path = window.location.pathname.replace(/\/$/, '');
  const sku = getMetadata('sku');

  if (sku) {
    // product detail page
    crumbs.push({ label: 'Shop All', href: '/shop' });
    const category = getMetadata('category');
    if (category) crumbs.push({ label: titleCase(category), href: `/category/${category}` });
    crumbs.push({ label: document.title, href: null });
    return crumbs;
  }

  const categoryMatch = path.match(/^\/category\/([^/]+)/);
  if (categoryMatch) {
    crumbs.push({ label: 'Shop All', href: '/shop' });
    crumbs.push({ label: titleCase(categoryMatch[1]), href: null });
    return crumbs;
  }

  if (path === '/shop') {
    crumbs.push({ label: 'Shop All', href: null });
    return crumbs;
  }

  if (path === '/new-arrivals') {
    crumbs.push({ label: 'New Arrivals', href: null });
    return crumbs;
  }

  return crumbs;
}

export default function decorate(block) {
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');

  const list = document.createElement('ol');
  list.className = 'breadcrumbs-list';

  buildCrumbs().forEach((crumb, idx, all) => {
    const li = document.createElement('li');
    li.className = 'breadcrumbs-item';
    if (crumb.href && idx !== all.length - 1) {
      const link = document.createElement('a');
      link.href = crumb.href;
      link.textContent = crumb.label;
      li.append(link);
    } else {
      li.textContent = crumb.label;
      li.setAttribute('aria-current', 'page');
    }
    list.append(li);
  });

  nav.append(list);
  block.append(nav);
}
