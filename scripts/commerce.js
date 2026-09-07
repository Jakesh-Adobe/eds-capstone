/*
 * Client-side commerce data layer. Products/categories live only in AEM page
 * metadata surfaced through /query-index.json — never a mock/external API.
 */

const INDEX_PATH = '/query-index.json';
let indexPromise;

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Fetches and caches the site's query index.
 * @returns {Promise<Array<object>>} raw index rows
 */
async function fetchIndex() {
  if (!indexPromise) {
    indexPromise = fetch(`${window.hlx.codeBasePath}${INDEX_PATH}`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => json.data || [])
      .catch(() => []);
  }
  return indexPromise;
}

/**
 * Maps a raw index row (page metadata) to a product record.
 * @param {object} row A row from /query-index.json
 */
function normalizeProduct(row) {
  return {
    sku: row.sku,
    title: row.title || row.sku,
    description: row.description || '',
    image: row.image || '',
    path: row.path,
    category: row.category || '',
    price: toNumber(row.price),
    currency: row.currency || 'USD',
  };
}

/**
 * All indexed pages that carry a `sku` are treated as products.
 * @returns {Promise<Array<object>>}
 */
export async function getAllProducts() {
  const rows = await fetchIndex();
  return rows.filter((row) => row.sku).map(normalizeProduct);
}

/**
 * Products belonging to a category slug (e.g. `plants`).
 * @param {string} category The category slug; falsy returns all products
 * @returns {Promise<Array<object>>}
 */
export async function getProductsByCategory(category) {
  const products = await getAllProducts();
  if (!category) return products;
  return products.filter((product) => product.category === category);
}

/**
 * Distinct category slugs present across all products, alphabetically sorted.
 * @returns {Promise<Array<string>>}
 */
export async function getAllCategories() {
  const products = await getAllProducts();
  const categories = new Set(products.map((product) => product.category).filter(Boolean));
  return [...categories].sort();
}

/**
 * A single product by SKU.
 * @param {string} sku
 * @returns {Promise<object|undefined>}
 */
export async function getProductBySku(sku) {
  const products = await getAllProducts();
  return products.find((product) => product.sku === sku);
}

/**
 * Other products in the same category as the given product.
 * @param {object} product
 * @param {number} [limit]
 * @returns {Promise<Array<object>>}
 */
export async function getRelatedProducts(product, limit = 4) {
  if (!product) return [];
  const products = await getProductsByCategory(product.category);
  return products.filter((p) => p.sku !== product.sku).slice(0, limit);
}

export { formatPrice } from './cart.js';
