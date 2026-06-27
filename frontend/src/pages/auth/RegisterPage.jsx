import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import authService from '../../services/auth.service';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.register(form);
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth({ user, accessToken, refreshToken });
      toast.success('Registration successful!');
      navigate('/');
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        errors.forEach((e) => toast.error(e.message));
      } else {
        toast.error(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Create account</h2>
      <p className="text-gray-500 text-sm mb-6">Get started with Inventory MS</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input type="text" name="name" value={form.name} onChange={handleChange}
            className="input" placeholder="John Doe" required />
        </div>
        <div>
          <label className="label">Email Address</label>
          <input type="email" name="email" value={form.email} onChange={handleChange}
            className="input" placeholder="you@example.com" required />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange}
            className="input" placeholder="Min 6 chars, uppercase, number" required />
        </div>
        <div>
          <label className="label">Role</label>
          <select name="role" value={form.role} onChange={handleChange} className="input">
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
