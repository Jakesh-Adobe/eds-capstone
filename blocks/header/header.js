import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import {
  getItems, getTotals, onChange, removeItem, formatPrice,
} from '../../scripts/cart.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

const ICONS = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  cart: '<path d="M4 7h16v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7Z"/><path d="M9 11a3 3 0 0 0 6 0"/>',
};

/* icons are inlined rather than loaded from /icons so they inherit currentColor */
function iconMarkup(name) {
  return `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
}

function renderMiniCart(panel) {
  const items = getItems();
  const totals = getTotals();
  if (!items.length) {
    panel.innerHTML = '<p class="mini-cart-empty">Your cart is empty.</p>';
    return;
  }
  const lines = items.map((item) => `
    <li class="mini-cart-item" data-sku="${item.sku}">
      ${item.image ? `<img src="${item.image}" alt="" loading="lazy" width="56" height="56">` : '<span class="mini-cart-thumb"></span>'}
      <span class="mini-cart-detail">
        <a href="${item.path}">${item.name}</a>
        <span class="mini-cart-meta">${item.qty} &times; ${formatPrice(item.price, item.currency)}</span>
      </span>
      <button type="button" class="mini-cart-remove" aria-label="Remove ${item.name}">&times;</button>
    </li>`).join('');
  panel.innerHTML = `
    <ul class="mini-cart-items">${lines}</ul>
    <p class="mini-cart-subtotal"><span>Subtotal</span><span>${formatPrice(totals.subtotal, totals.currency)}</span></p>
    <p class="mini-cart-actions">
      <a class="button secondary" href="/cart">View cart</a>
      <a class="button accent" href="/checkout">Checkout</a>
    </p>`;
  panel.querySelectorAll('.mini-cart-remove').forEach((btn) => {
    btn.addEventListener('click', () => removeItem(btn.closest('.mini-cart-item').dataset.sku));
  });
}

function buildCartTool(link) {
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-cart';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nav-cart-toggle';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-label', 'Cart');
  trigger.innerHTML = `${iconMarkup('cart')}<span class="nav-cart-count" aria-hidden="true">0</span>`;

  const panel = document.createElement('div');
  panel.className = 'mini-cart';
  panel.hidden = true;

  const close = () => {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  };

  trigger.addEventListener('click', () => {
    const open = trigger.getAttribute('aria-expanded') === 'true';
    if (open) {
      close();
      return;
    }
    renderMiniCart(panel);
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
  });

  wrapper.addEventListener('focusout', (e) => {
    if (!wrapper.contains(e.relatedTarget)) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && !panel.hidden) {
      close();
      trigger.focus();
    }
  });

  const syncCount = () => {
    const { count } = getTotals();
    trigger.querySelector('.nav-cart-count').textContent = count;
    trigger.dataset.empty = count === 0;
    trigger.setAttribute('aria-label', `Cart, ${count} item${count === 1 ? '' : 's'}`);
    if (!panel.hidden) renderMiniCart(panel);
  };
  onChange(syncCount);
  syncCount();

  wrapper.append(trigger, panel);
  link.replaceWith(wrapper);
}

/**
 * Turns authored nav-tools links into icon controls based on their target path.
 * @param {Element} navTools The nav tools container
 */
function decorateNavTools(navTools) {
  if (!navTools) return;
  navTools.querySelectorAll('a[href]').forEach((link) => {
    const { pathname } = new URL(link.href, window.location);
    const label = link.textContent.trim();
    if (pathname === '/cart') {
      buildCartTool(link);
    } else if (pathname === '/account') {
      link.classList.add('nav-tool');
      link.setAttribute('aria-label', label || 'My account');
      link.innerHTML = iconMarkup('user');
    } else if (pathname === '/search') {
      link.classList.add('nav-tool');
      link.setAttribute('aria-label', label || 'Search');
      link.innerHTML = iconMarkup('search');
    }
  });
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
    brandLink.href = '/';
    // author may have linked only the text; pull any sibling logo image into the same link
    navBrand.querySelectorAll('picture, img').forEach((logo) => {
      if (!brandLink.contains(logo)) brandLink.prepend(logo);
    });
  } else {
    // no authored link at all — wrap the whole brand (logo + text) in a home link
    const home = document.createElement('a');
    home.href = '/';
    home.append(...navBrand.childNodes);
    navBrand.append(home);
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  decorateNavTools(nav.querySelector('.nav-tools'));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
