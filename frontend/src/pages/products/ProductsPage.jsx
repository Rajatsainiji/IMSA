import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import productService from '../../services/product.service';
import categoryService from '../../services/category.service';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { StockLevelBadge } from '../../components/ui/StatusBadge';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const INITIAL_FORM = {
  name: '', sku: '', description: '', categoryId: '', unit: 'pcs',
  costPrice: '', sellingPrice: '', reorderLevel: 10
};

function ProductForm({ form, setForm, categories, onSubmit, loading, isEdit }) {
  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Product Name *</label>
          <input name="name" value={form.name} onChange={handle} className="input" required placeholder="e.g. Wireless Mouse" />
        </div>
        <div>
          <label className="label">SKU *</label>
          <input name="sku" value={form.sku} onChange={handle} className="input" required placeholder="ELEC-001" />
        </div>
        <div>
          <label className="label">Unit</label>
          <input name="unit" value={form.unit} onChange={handle} className="input" placeholder="pcs" />
        </div>
        <div>
          <label className="label">Category</label>
          <select name="categoryId" value={form.categoryId} onChange={handle} className="input">
            <option value="">No Category</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Reorder Level</label>
          <input type="number" name="reorderLevel" value={form.reorderLevel} onChange={handle} className="input" min="0" />
        </div>
        <div>
          <label className="label">Cost Price ($)</label>
          <input type="number" name="costPrice" value={form.costPrice} onChange={handle} className="input" min="0" step="0.01" placeholder="0.00" />
        </div>
        <div>
          <label className="label">Selling Price ($)</label>
          <input type="number" name="sellingPrice" value={form.sellingPrice} onChange={handle} className="input" min="0" step="0.01" placeholder="0.00" />
        </div>
        <div className="col-span-2">
          <label className="label">Description</label>
          <textarea name="description" value={form.description} onChange={handle} className="input" rows={2} placeholder="Optional description" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formLoading, setFormLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, categoryId],
    queryFn: () => productService.getAll({ page, limit: 10, search, categoryId }).then((r) => r.data)
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll().then((r) => r.data.data)
  });

  const openCreate = () => { setEditProduct(null); setForm(INITIAL_FORM); setShowModal(true); };
  const openEdit = (p) => {
    setEditProduct(p);
    setForm({
      name: p.name, sku: p.sku, description: p.description || '',
      categoryId: p.categoryId || '', unit: p.unit,
      costPrice: p.costPrice, sellingPrice: p.sellingPrice, reorderLevel: p.reorderLevel
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editProduct) {
        await productService.update(editProduct.id, form);
        toast.success('Product updated');
      } else {
        await productService.create(form);
        toast.success('Product created');
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowModal(false);
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) errors.forEach((e) => toast.error(e.message));
      else toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm">{data?.meta?.pagination?.total || 0} products total</p>
        </div>
        {hasRole('admin', 'manager') && (
          <button onClick={openCreate} className="btn-primary">+ Add Product</button>
        )}
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text" placeholder="Search by name or SKU..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input max-w-xs"
          />
          <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }} className="input w-48">
            <option value="">All Categories</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Product</th>
                <th className="th">SKU</th>
                <th className="th">Category</th>
                <th className="th">Price</th>
                <th className="th">Stock</th>
                <th className="th">Status</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {data?.data?.map((product) => (
                <tr key={product.id} className="tr-hover">
                  <td className="td">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.unit}</p>
                  </td>
                  <td className="td font-mono text-xs">{product.sku}</td>
                  <td className="td text-gray-500">{product.category?.name || '—'}</td>
                  <td className="td">
                    <p className="font-medium">${parseFloat(product.sellingPrice).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">Cost: ${parseFloat(product.costPrice).toFixed(2)}</p>
                  </td>
                  <td className="td">
                    <p className="font-semibold">{product.stock?.quantity ?? '—'}</p>
                    <p className="text-xs text-gray-400">Reorder at {product.reorderLevel}</p>
                  </td>
                  <td className="td">
                    <StockLevelBadge quantity={product.stock?.quantity || 0} reorderLevel={product.reorderLevel} />
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/products/${product.id}`)} className="btn btn-secondary btn-sm">View</button>
                      {hasRole('admin', 'manager') && (
                        <button onClick={() => openEdit(product)} className="btn btn-secondary btn-sm">Edit</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.data?.length && (
                <tr><td colSpan={7} className="td text-center text-gray-400 py-8">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4">
          <Pagination meta={data?.meta} onPageChange={setPage} />
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editProduct ? 'Edit Product' : 'Add Product'} size="lg">
        <ProductForm form={form} setForm={setForm} categories={categories} onSubmit={handleSubmit} loading={formLoading} isEdit={!!editProduct} />
      </Modal>
    </div>
  );
}
