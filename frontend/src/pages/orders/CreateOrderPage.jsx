import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import orderService from '../../services/order.service';
import productService from '../../services/product.service';
import toast from 'react-hot-toast';

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: '', customerEmail: '', customerPhone: '', notes: ''
  });
  const [items, setItems] = useState([{ productId: '', quantity: 1 }]);

  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => productService.getAll({ limit: 100, isActive: true }).then((r) => r.data.data)
  });

  const products = productsData || [];

  const addItem = () => setItems([...items, { productId: '', quantity: 1 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    setItems(updated);
  };

  const getProductStock = (productId) => {
    const p = products.find((p) => p.id === parseInt(productId));
    return p?.stock?.quantity ?? 0;
  };

  const getProductPrice = (productId) => {
    const p = products.find((p) => p.id === parseInt(productId));
    return parseFloat(p?.sellingPrice || 0);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      if (!item.productId) return sum;
      return sum + getProductPrice(item.productId) * parseInt(item.quantity || 0);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (!validItems.length) { toast.error('Add at least one valid item'); return; }

    setLoading(true);
    try {
      const res = await orderService.create({
        ...form,
        items: validItems.map((i) => ({ productId: parseInt(i.productId), quantity: parseInt(i.quantity) }))
      });
      const order = res.data.data;
      toast.success(`Order ${order.orderNumber} placed successfully!`);
      navigate(`/orders/${order.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/orders')} className="btn btn-secondary btn-sm">← Back</button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
          <p className="text-gray-500 text-sm">Stock will be deducted automatically</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Details */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Customer Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Customer Name *</label>
              <input className="input" required value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="John Doe" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} placeholder="john@example.com" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} placeholder="+1 555 0000" />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional order notes" />
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Order Items</h2>
            <button type="button" onClick={addItem} className="btn btn-secondary btn-sm">+ Add Item</button>
          </div>

          <div className="space-y-3">
            {items.map((item, i) => {
              const stock = item.productId ? getProductStock(item.productId) : null;
              const price = item.productId ? getProductPrice(item.productId) : 0;
              return (
                <div key={i} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-6">
                    {i === 0 && <label className="label">Product *</label>}
                    <select value={item.productId} onChange={(e) => updateItem(i, 'productId', e.target.value)} className="input" required>
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.stock?.quantity || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <label className="label">Qty</label>}
                    <input type="number" min="1" max={stock || undefined} value={item.quantity}
                      onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                      className="input" required />
                  </div>
                  <div className="col-span-3">
                    {i === 0 && <label className="label">Subtotal</label>}
                    <div className="input bg-gray-50 text-right font-medium">
                      ${(price * (parseInt(item.quantity) || 0)).toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-1">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="btn btn-danger btn-sm w-full">×</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-end">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">${calculateTotal().toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/orders')} className="btn btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
