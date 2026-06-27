import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import orderService from '../../services/order.service';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import { OrderStatusBadge } from '../../components/ui/StatusBadge';
import { format } from 'date-fns';

const ORDER_STATUSES = ['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, status, search],
    queryFn: () => orderService.getAll({ page, limit: 10, status, search }).then((r) => r.data)
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm">{data?.meta?.pagination?.total || 0} orders total</p>
        </div>
        <button onClick={() => navigate('/orders/new')} className="btn-primary">+ New Order</button>
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-3">
          <input type="text" placeholder="Search by order#, customer..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input max-w-xs" />
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input w-48">
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card p-0">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Order #</th>
                <th className="th">Customer</th>
                <th className="th">Items</th>
                <th className="th">Total</th>
                <th className="th">Status</th>
                <th className="th">Date</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {data?.data?.map((order) => (
                <tr key={order.id} className="tr-hover">
                  <td className="td font-mono text-sm">{order.orderNumber}</td>
                  <td className="td">
                    <p className="font-medium text-gray-900">{order.customerName}</p>
                    <p className="text-xs text-gray-400">{order.customerEmail || '—'}</p>
                  </td>
                  <td className="td text-center">{order.items?.length || 0}</td>
                  <td className="td font-semibold">${parseFloat(order.totalAmount).toFixed(2)}</td>
                  <td className="td"><OrderStatusBadge status={order.status} /></td>
                  <td className="td text-xs text-gray-400">{format(new Date(order.createdAt), 'MMM d, yyyy')}</td>
                  <td className="td">
                    <button onClick={() => navigate(`/orders/${order.id}`)} className="btn btn-secondary btn-sm">View</button>
                  </td>
                </tr>
              ))}
              {!data?.data?.length && (
                <tr><td colSpan={7} className="td text-center text-gray-400 py-8">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4">
          <Pagination meta={data?.meta} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
