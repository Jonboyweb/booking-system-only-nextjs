'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Redirect to admin dashboard
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-prohibition-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-prohibition-cream rounded-lg shadow-2xl p-8 border-2 border-prohibition-gold">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bebas text-prohibition-dark tracking-wider">
              THE BACKROOM LEEDS
            </h1>
            <p className="text-prohibition-brown mt-2 font-crimson">
              Staff Portal
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-prohibition-brown mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-prohibition-gold/30 rounded-md bg-white focus:ring-2 focus:ring-prohibition-gold focus:border-transparent"
                placeholder="admin@backroomleeds.co.uk"
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-prohibition-brown mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-prohibition-gold/30 rounded-md bg-white focus:ring-2 focus:ring-prohibition-gold focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-prohibition-gold text-prohibition-dark py-3 px-4 rounded-md font-medium hover:bg-prohibition-gold/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-prohibition-gold/20 text-center">
            <p className="text-xs text-prohibition-brown/60">
              Authorized personnel only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}