import { getOrders } from '../../scripts/account.js';
import { formatPrice } from '../../scripts/cart.js';

/**
 * loads and decorates the account orders widget (mocked order history, no auth)
 * @param {Element} widget The account-orders widget element
 */
export default function decorate(widget) {
  const orders = getOrders();
  const empty = widget.querySelector('.account-orders-empty');
  const table = widget.querySelector('.account-orders-table');

  if (!orders.length) {
    empty.hidden = false;
    return;
  }

  table.hidden = false;
  table.querySelector('tbody').innerHTML = orders.map((order) => `
    <tr>
      <td>${order.orderId}</td>
      <td>${new Date(order.date).toLocaleDateString()}</td>
      <td>${order.status}</td>
      <td>${order.itemsCount}</td>
      <td>${formatPrice(order.total, order.currency)}</td>
    </tr>
  `).join('');
}
