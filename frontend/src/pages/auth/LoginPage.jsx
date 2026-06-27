import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import authService from '../../services/auth.service';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.login(form);
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth({ user, accessToken, refreshToken });
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
      <p className="text-gray-500 text-sm mb-6">Sign in to your account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email Address</label>
          <input
            type="email" name="email" value={form.email} onChange={handleChange}
            className="input" placeholder="admin@inventory.com" required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password" name="password" value={form.password} onChange={handleChange}
            className="input" placeholder="••••••••" required
            autoComplete="current-password"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-4">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-blue-600 font-medium hover:underline">Register</Link>
      </p>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        {/* <p className="text-xs text-blue-700 font-medium mb-1">Demo Credentials:</p>
        <p className="text-xs text-blue-600">Admin: admin@inventory.com / Admin@123</p>
        <p className="text-xs text-blue-600">Manager: manager@inventory.com / Admin@123</p> */}
      </div>
    </div>
  );
}
