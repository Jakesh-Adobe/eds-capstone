const PROFILE = {
  name: 'Jordan Lee',
  email: 'jordan.lee@example.com',
};

const ORDERS_KEY = 'eds-orders';

/** Mocked signed-in profile — no backend/auth in this project. */
export function getProfile() {
  return { ...PROFILE };
}

/** Orders placed in this browser, newest first — no backend/auth in this project. */
export function getOrders() {
  let parsed;
  try {
    parsed = JSON.parse(window.localStorage.getItem(ORDERS_KEY));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return [...parsed].reverse();
}

/** Appends a placed order to local order history. */
export function addOrder(order) {
  const orders = getOrders().reverse();
  orders.push(order);
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // quota exceeded or storage disabled — order won't persist, but confirmation still shows
  }
}
