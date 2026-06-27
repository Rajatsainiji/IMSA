import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import productService from '../../services/product.service';
import stockService from '../../services/stock.service';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { MovementTypeBadge, StockLevelBadge } from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const [stockModal, setStockModal] = useState(null); // 'add' | 'remove' | 'adjust'
  const [stockForm, setStockForm] = useState({ quantity: '', newQuantity: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getById(id).then((r) => r.data.data)
  });

  const { data: historyData } = useQuery({
    queryKey: ['stock-history', id],
    queryFn: () => stockService.getHistory(id, { limit: 20 }).then((r) => r.data)
  });

  const handleStockAction = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (stockModal === 'add') {
        await stockService.addStock(id, { quantity: parseInt(stockForm.quantity), notes: stockForm.notes });
        toast.success('Stock added successfully');
      } else if (stockModal === 'remove') {
        await stockService.removeStock(id, { quantity: parseInt(stockForm.quantity), notes: stockForm.notes });
        toast.success('Stock removed successfully');
      } else if (stockModal === 'adjust') {
        await stockService.adjustStock(id, { newQuantity: parseInt(stockForm.newQuantity), notes: stockForm.notes });
        toast.success('Stock adjusted successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['stock-history', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setStockModal(null);
      setStockForm({ quantity: '', newQuantity: '', notes: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <PageLoader />;
  if (!product) return <div className="card text-center py-8 text-gray-400">Product not found</div>;

  const stock = product.stock;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/products')} className="btn btn-secondary btn-sm">← Back</button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-gray-500 text-sm font-mono">{product.sku}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Product Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Category', product.category?.name || '—'],
                ['Unit', product.unit],
                ['Cost Price', `$${parseFloat(product.costPrice).toFixed(2)}`],
                ['Selling Price', `$${parseFloat(product.sellingPrice).toFixed(2)}`],
                ['Reorder Level', product.reorderLevel],
                ['Status', product.isActive ? 'Active' : 'Inactive']
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="font-medium text-gray-800">{value}</p>
                </div>
              ))}
            </div>
            {product.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">Description</p>
                <p className="text-gray-700 text-sm mt-1">{product.description}</p>
              </div>
            )}
          </div>

          {/* Stock History */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Stock Movement History</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="th">Type</th>
                    <th className="th">Before</th>
                    <th className="th">Change</th>
                    <th className="th">After</th>
                    <th className="th">Notes</th>
                    <th className="th">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyData?.data?.map((h) => (
                    <tr key={h.id}>
                      <td className="td"><MovementTypeBadge type={h.movementType} /></td>
                      <td className="td text-center">{h.quantityBefore}</td>
                      <td className={`td text-center font-bold ${h.quantityChanged > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {h.quantityChanged > 0 ? '+' : ''}{h.quantityChanged}
                      </td>
                      <td className="td text-center">{h.quantityAfter}</td>
                      <td className="td text-xs text-gray-400 max-w-xs truncate">{h.notes || '—'}</td>
                      <td className="td text-xs text-gray-400">{format(new Date(h.createdAt), 'MMM d, yyyy HH:mm')}</td>
                    </tr>
                  ))}
                  {!historyData?.data?.length && (
                    <tr><td colSpan={6} className="td text-center text-gray-400 py-6">No history yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Stock Panel */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Current Stock</h2>
            <div className="text-center py-4">
              <p className="text-5xl font-bold text-gray-900">{stock?.quantity ?? 0}</p>
              <p className="text-gray-400 text-sm mt-1">{product.unit} available</p>
              <div className="mt-3">
                <StockLevelBadge quantity={stock?.quantity || 0} reorderLevel={product.reorderLevel} />
              </div>
            </div>
            {stock?.lastRestockedAt && (
              <p className="text-xs text-gray-400 text-center mt-2">
                Last restocked: {format(new Date(stock.lastRestockedAt), 'MMM d, yyyy')}
              </p>
            )}
          </div>

          {hasRole('admin', 'manager') && (
            <div className="card space-y-2">
              <h2 className="font-semibold text-gray-900 mb-3">Stock Actions</h2>
              <button onClick={() => setStockModal('add')} className="btn-success w-full">+ Add Stock</button>
              <button onClick={() => setStockModal('remove')} className="btn-danger w-full">- Remove Stock</button>
              {hasRole('admin') && (
                <button onClick={() => setStockModal('adjust')} className="btn btn-secondary w-full">⚙ Adjust Stock</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stock Action Modal */}
      <Modal
        isOpen={!!stockModal}
        onClose={() => setStockModal(null)}
        title={stockModal === 'add' ? 'Add Stock' : stockModal === 'remove' ? 'Remove Stock' : 'Adjust Stock'}
      >
        <form onSubmit={handleStockAction} className="space-y-4">
          {stockModal === 'adjust' ? (
            <div>
              <label className="label">New Quantity</label>
              <input type="number" min="0" value={stockForm.newQuantity}
                onChange={(e) => setStockForm({ ...stockForm, newQuantity: e.target.value })}
                className="input" required placeholder={`Current: ${stock?.quantity || 0}`} />
            </div>
          ) : (
            <div>
              <label className="label">Quantity</label>
              <input type="number" min="1" value={stockForm.quantity}
                onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                className="input" required placeholder="Enter quantity" />
            </div>
          )}
          <div>
            <label className="label">Notes (optional)</label>
            <textarea value={stockForm.notes}
              onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
              className="input" rows={2} placeholder="Reason for this change" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStockModal(null)} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading}
              className={`flex-1 ${stockModal === 'add' ? 'btn-success' : 'btn-danger'}`}>
              {loading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
