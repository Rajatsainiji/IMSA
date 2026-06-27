import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import productService from '../../services/product.service';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import { StockLevelBadge } from '../../components/ui/StatusBadge';

export default function StockPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, '', filter],
    queryFn: () => productService.getAll({ page, limit: 15, search, isActive: true }).then((r) => r.data)
  });

  const products = data?.data || [];

  const filtered = filter === 'low'
    ? products.filter((p) => p.stock?.quantity > 0 && p.stock?.quantity <= p.reorderLevel)
    : filter === 'out'
      ? products.filter((p) => p.stock?.quantity === 0)
      : products;

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Overview</h1>
          <p className="text-gray-500 text-sm">Monitor and manage inventory levels</p>
        </div>
        <button onClick={() => navigate('/stock/history')} className="btn btn-secondary">View History</button>
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-3">
          <input type="text" placeholder="Search products..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input max-w-xs" />
          <div className="flex gap-2">
            {['all', 'low', 'out'].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}>
                {f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : 'Out of Stock'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-0">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Product</th>
                <th className="th">SKU</th>
                <th className="th">Current Stock</th>
                <th className="th">Reorder Level</th>
                <th className="th">Status</th>
                <th className="th">Last Restocked</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.map((product) => (
                <tr key={product.id} className="tr-hover">
                  <td className="td">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.category?.name || 'No category'}</p>
                  </td>
                  <td className="td font-mono text-xs">{product.sku}</td>
                  <td className="td">
                    <span className={`text-xl font-bold ${product.stock?.quantity === 0 ? 'text-red-600' : product.stock?.quantity <= product.reorderLevel ? 'text-yellow-600' : 'text-gray-900'}`}>
                      {product.stock?.quantity ?? 0}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">{product.unit}</span>
                  </td>
                  <td className="td text-gray-500">{product.reorderLevel}</td>
                  <td className="td">
                    <StockLevelBadge quantity={product.stock?.quantity || 0} reorderLevel={product.reorderLevel} />
                  </td>
                  <td className="td text-xs text-gray-400">
                    {product.stock?.lastRestockedAt
                      ? new Date(product.stock.lastRestockedAt).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="td">
                    <button onClick={() => navigate(`/products/${product.id}`)} className="btn btn-secondary btn-sm">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={7} className="td text-center text-gray-400 py-8">No products found</td></tr>
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
