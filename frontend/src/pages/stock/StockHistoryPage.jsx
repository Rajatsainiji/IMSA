import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import stockService from '../../services/stock.service';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import { MovementTypeBadge } from '../../components/ui/StatusBadge';
import { format } from 'date-fns';

const MOVEMENT_TYPES = ['', 'stock_in', 'stock_out', 'order_deduction', 'order_return', 'adjustment', 'initial'];

export default function StockHistoryPage() {
  const [page, setPage] = useState(1);
  const [movementType, setMovementType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['stock-history-all', page, movementType],
    queryFn: () => stockService.getAllHistory({ page, limit: 20, movementType }).then((r) => r.data)
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock Movement History</h1>
        <p className="text-gray-500 text-sm">Complete audit trail of all stock changes</p>
      </div>

      <div className="card py-4">
        <div className="flex flex-wrap gap-3 items-center">
          <label className="label mb-0">Filter by type:</label>
          <select value={movementType} onChange={(e) => { setMovementType(e.target.value); setPage(1); }} className="input w-48">
            <option value="">All Types</option>
            {MOVEMENT_TYPES.filter(Boolean).map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card p-0">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Product</th>
                <th className="th">Type</th>
                <th className="th">Before</th>
                <th className="th">Change</th>
                <th className="th">After</th>
                <th className="th">Reference</th>
                <th className="th">By</th>
                <th className="th">Date & Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {data?.data?.map((h) => (
                <tr key={h.id} className="tr-hover">
                  <td className="td">
                    <p className="font-medium text-gray-900">{h.product?.name}</p>
                    <p className="font-mono text-xs text-gray-400">{h.product?.sku}</p>
                  </td>
                  <td className="td"><MovementTypeBadge type={h.movementType} /></td>
                  <td className="td text-center text-gray-600">{h.quantityBefore}</td>
                  <td className={`td text-center font-bold ${h.quantityChanged > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {h.quantityChanged > 0 ? '+' : ''}{h.quantityChanged}
                  </td>
                  <td className="td text-center font-semibold">{h.quantityAfter}</td>
                  <td className="td font-mono text-xs text-gray-400">{h.referenceNumber || '—'}</td>
                  <td className="td text-gray-500">{h.user?.name || 'System'}</td>
                  <td className="td text-xs text-gray-400">{format(new Date(h.createdAt), 'MMM d, yyyy HH:mm')}</td>
                </tr>
              ))}
              {!data?.data?.length && (
                <tr><td colSpan={8} className="td text-center text-gray-400 py-8">No history records</td></tr>
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
