/**
 * decorates the product specs key/value table for styling (zebra rows, key/value classes)
 * @param {Element} block The product-specs block element
 */
export default function decorate(block) {
  [...block.children].forEach((row, idx) => {
    row.classList.add('product-specs-row');
    if (idx % 2 === 1) row.classList.add('product-specs-row-alt');
    const [key, value] = row.children;
    if (key) key.classList.add('product-specs-key');
    if (value) value.classList.add('product-specs-value');
  });
}
