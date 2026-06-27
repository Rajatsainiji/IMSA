import React from 'react';

const ORDER_STATUS_MAP = {
  pending: 'badge-yellow',
  confirmed: 'badge-blue',
  processing: 'badge-purple',
  shipped: 'badge-blue',
  delivered: 'badge-green',
  cancelled: 'badge-red'
};

const MOVEMENT_TYPE_MAP = {
  stock_in: 'badge-green',
  stock_out: 'badge-red',
  order_deduction: 'badge-red',
  order_return: 'badge-green',
  adjustment: 'badge-yellow',
  initial: 'badge-blue'
};

export function OrderStatusBadge({ status }) {
  return (
    <span className={ORDER_STATUS_MAP[status] || 'badge-gray'}>
      {status?.replace('_', ' ')}
    </span>
  );
}

export function MovementTypeBadge({ type }) {
  return (
    <span className={MOVEMENT_TYPE_MAP[type] || 'badge-gray'}>
      {type?.replace(/_/g, ' ')}
    </span>
  );
}

export function StockLevelBadge({ quantity, reorderLevel }) {
  if (quantity === 0) return <span className="badge-red">Out of Stock</span>;
  if (quantity <= reorderLevel) return <span className="badge-yellow">Low Stock</span>;
  return <span className="badge-green">In Stock</span>;
}
