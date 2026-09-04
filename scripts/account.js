const PROFILE = {
  name: 'Jordan Lee',
  email: 'jordan.lee@example.com',
};

const ORDERS = [
  {
    orderId: 'ORD-1F2A3B',
    date: '2026-08-12',
    status: 'Delivered',
    total: 45,
    currency: 'USD',
    itemsCount: 1,
  },
  {
    orderId: 'ORD-9C7D2E',
    date: '2026-08-28',
    status: 'Processing',
    total: 72.5,
    currency: 'USD',
    itemsCount: 2,
  },
];

/** Mocked signed-in profile — no backend/auth in this project. */
export function getProfile() {
  return { ...PROFILE };
}

/** Mocked order history — no backend/auth in this project. */
export function getOrders() {
  return ORDERS.map((order) => ({ ...order }));
}
