import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import orderService from '../../services/order.service';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { OrderStatusBadge } from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getById(id).then((r) => r.data.data)
  });

  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    try {
      await orderService.updateStatus(id, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await orderService.cancel(id, { reason: cancelReason });
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled and stock restored');
      setCancelModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <PageLoader />;
  if (!order) return <div className="card text-center py-8 text-gray-400">Order not found</div>;

  const canCancel = ['pending', 'confirmed', 'processing'].includes(order.status);
  const currentStepIndex = STATUS_FLOW.indexOf(order.status);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/orders')} className="btn btn-secondary btn-sm">← Back</button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-gray-500 text-sm">
            Created {format(new Date(order.createdAt), 'MMMM d, yyyy HH:mm')} by {order.user?.name}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Progress Stepper */}
      {order.status !== 'cancelled' && (
        <div className="card">
          <div className="flex items-center justify-between">
            {STATUS_FLOW.map((step, i) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < currentStepIndex ? 'bg-green-500 text-white' :
                    i === currentStepIndex ? 'bg-blue-500 text-white' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {i < currentStepIndex ? '✓' : i + 1}
                  </div>
                  <p className={`text-xs mt-1 capitalize ${i <= currentStepIndex ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                    {step}
                  </p>
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${i < currentStepIndex ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Order Items</h2>
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Product</th>
                  <th className="th">Unit Price</th>
                  <th className="th">Qty</th>
                  <th className="th">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="td">
                      <p className="font-medium">{item.product?.name || item.productSnapshot?.name}</p>
                      <p className="font-mono text-xs text-gray-400">{item.product?.sku || item.productSnapshot?.sku}</p>
                    </td>
                    <td className="td">${parseFloat(item.unitPrice).toFixed(2)}</td>
                    <td className="td text-center">{item.quantity}</td>
                    <td className="td font-semibold">${parseFloat(item.totalPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={3} className="td text-right font-semibold text-gray-900">Total</td>
                  <td className="td font-bold text-lg">${parseFloat(order.totalAmount).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {order.notes && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-2">Notes</h2>
              <p className="text-gray-600 text-sm">{order.notes}</p>
            </div>
          )}

          {order.status === 'cancelled' && order.cancellationReason && (
            <div className="card border-red-100 bg-red-50">
              <h2 className="font-semibold text-red-700 mb-2">Cancellation Reason</h2>
              <p className="text-red-600 text-sm">{order.cancellationReason}</p>
              {order.cancelledAt && (
                <p className="text-red-400 text-xs mt-1">
                  Cancelled on {format(new Date(order.cancelledAt), 'MMM d, yyyy HH:mm')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Customer + Actions */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">Customer</h2>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-400">Name</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              {order.customerEmail && (
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm text-blue-600">{order.customerEmail}</p>
                </div>
              )}
              {order.customerPhone && (
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm">{order.customerPhone}</p>
                </div>
              )}
            </div>
          </div>

          {hasRole('admin', 'manager') && order.status !== 'cancelled' && order.status !== 'delivered' && (
            <div className="card space-y-2">
              <h2 className="font-semibold text-gray-900 mb-3">Actions</h2>
              {STATUS_FLOW.indexOf(order.status) < STATUS_FLOW.length - 1 && (
                <button
                  onClick={() => handleStatusUpdate(STATUS_FLOW[currentStepIndex + 1])}
                  disabled={loading}
                  className="btn-primary w-full capitalize"
                >
                  Mark as {STATUS_FLOW[currentStepIndex + 1]}
                </button>
              )}
              {canCancel && (
                <button onClick={() => setCancelModal(true)} className="btn-danger w-full" disabled={loading}>
                  Cancel Order
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal isOpen={cancelModal} onClose={() => setCancelModal(false)} title="Cancel Order">
        <div className="space-y-4">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              ⚠️ Cancelling this order will automatically restore stock for all items.
            </p>
          </div>
          <form onSubmit={handleCancel} className="space-y-4">
            <div>
              <label className="label">Cancellation Reason (optional)</label>
              <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                className="input" rows={3} placeholder="Why is this order being cancelled?" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setCancelModal(false)} className="btn btn-secondary flex-1">Keep Order</button>
              <button type="submit" disabled={loading} className="btn-danger flex-1">
                {loading ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
