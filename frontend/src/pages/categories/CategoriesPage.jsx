import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import categoryService from '../../services/category.service';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll().then((r) => r.data.data)
  });

  const openCreate = () => { setEditCategory(null); setForm({ name: '', description: '' }); setShowModal(true); };
  const openEdit = (cat) => { setEditCategory(cat); setForm({ name: cat.name, description: cat.description || '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editCategory) {
        await categoryService.update(editCategory.id, form);
        toast.success('Category updated');
      } else {
        await categoryService.create(form);
        toast.success('Category created');
      }
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this category?')) return;
    try {
      await categoryService.delete(id);
      toast.success('Category deactivated');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm">{categories?.length || 0} categories</p>
        </div>
        {hasRole('admin', 'manager') && (
          <button onClick={openCreate} className="btn-primary">+ Add Category</button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories?.map((cat) => (
          <div key={cat.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{cat.description || 'No description'}</p>
              </div>
              <span className={`badge ${cat.isActive ? 'badge-green' : 'badge-red'}`}>
                {cat.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            {hasRole('admin', 'manager') && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button onClick={() => openEdit(cat)} className="btn btn-secondary btn-sm flex-1">Edit</button>
                {hasRole('admin') && (
                  <button onClick={() => handleDelete(cat.id)} className="btn btn-danger btn-sm flex-1">Delete</button>
                )}
              </div>
            )}
          </div>
        ))}
        {!categories?.length && (
          <div className="col-span-3 card text-center py-8 text-gray-400">No categories yet</div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editCategory ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Electronics" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : editCategory ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
