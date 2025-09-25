'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isBackupCode, setIsBackupCode] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    console.log('Login attempt with:', { email, userAgent: navigator.userAgent });
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', // Ensure cookies are sent/received
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Check if 2FA is required
      if (data.requiresTwoFactor) {
        setShowTwoFactor(true);
        setLoading(false);
        return;
      }

      // Success - use Next.js router to navigate
      console.log('Login successful, redirecting to dashboard...');

      // Check if cookies are accessible (for debugging)
      console.log('Document cookies:', document.cookie);

      // Small delay to ensure cookie is set before navigation
      await new Promise(resolve => setTimeout(resolve, 100));

      router.push('/admin/dashboard');
      router.refresh(); // Refresh to ensure middleware picks up the new cookie

    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  const handle2FAVerification = async () => {
    if (!twoFactorCode) {
      setError('Please enter your verification code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', // Ensure cookies are sent/received
        body: JSON.stringify({
          email,
          code: twoFactorCode,
          isBackupCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '2FA verification failed');
      }

      // Success - redirect to dashboard
      console.log('2FA verification successful, redirecting to dashboard...');
      router.push('/admin/dashboard');
      router.refresh();

    } catch (err) {
      console.error('2FA verification error:', err);
      setError(err instanceof Error ? err.message : '2FA verification failed');
      setLoading(false);
    }
  };

  const resetLogin = () => {
    setShowTwoFactor(false);
    setTwoFactorCode('');
    setIsBackupCode(false);
    setPassword('');
    setError('');
  };

  // Show 2FA verification form
  if (showTwoFactor) {
    return (
      <div className="min-h-screen bg-speakeasy-charcoal flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-speakeasy-cream rounded-lg shadow-2xl p-8 border-2 border-gold">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bebas text-speakeasy-charcoal tracking-wider">
                THE BACKROOM LEEDS
              </h1>
              <div className="mt-4 flex justify-center">
                <Shield className="w-12 h-12 text-gold" />
              </div>
              <p className="text-burgundy mt-2 font-crimson">
                Two-Factor Authentication
              </p>
            </div>

            {/* 2FA Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-burgundy mb-2">
                  {isBackupCode ? 'Backup Code' : 'Verification Code'}
                </label>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => {
                    if (isBackupCode) {
                      setTwoFactorCode(e.target.value.toUpperCase());
                    } else {
                      setTwoFactorCode(e.target.value.replace(/\D/g, ''));
                    }
                  }}
                  className="w-full px-4 py-2 border border-gold/30 rounded-md bg-white focus:ring-2 focus:ring-gold focus:border-transparent text-center text-lg font-mono"
                  placeholder={isBackupCode ? 'XXXXXXXX' : '000000'}
                  maxLength={isBackupCode ? 8 : 6}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handle2FAVerification();
                    }
                  }}
                />
                {!isBackupCode && (
                  <p className="text-xs text-gray-600 mt-1">
                    Enter the 6-digit code from your authenticator app
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="use-backup"
                  checked={isBackupCode}
                  onChange={(e) => {
                    setIsBackupCode(e.target.checked);
                    setTwoFactorCode('');
                  }}
                  className="mr-2"
                />
                <label htmlFor="use-backup" className="text-sm text-burgundy">
                  Use a backup code instead
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handle2FAVerification}
                disabled={loading || !twoFactorCode}
                className="w-full bg-gold text-speakeasy-charcoal py-3 px-4 rounded-md font-medium hover:bg-gold-light transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>

              <button
                type="button"
                onClick={resetLogin}
                className="w-full bg-gray-200 text-gray-700 py-2 px-3 rounded-md text-sm hover:bg-gray-300 transition"
              >
                Back to Login
              </button>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gold/20 text-center">
              <p className="text-xs text-burgundy/60">
                Lost your authenticator device? Use a backup code or contact your administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show regular login form
  return (
    <div className="min-h-screen bg-speakeasy-charcoal flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-speakeasy-cream rounded-lg shadow-2xl p-8 border-2 border-gold">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bebas text-speakeasy-charcoal tracking-wider">
              THE BACKROOM LEEDS
            </h1>
            <p className="text-burgundy mt-2 font-crimson">
              Staff Portal
            </p>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-burgundy mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gold/30 rounded-md bg-white focus:ring-2 focus:ring-gold focus:border-transparent"
                placeholder="admin@backroomleeds.co.uk"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLogin();
                  }
                }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-burgundy mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gold/30 rounded-md bg-white focus:ring-2 focus:ring-gold focus:border-transparent"
                placeholder="Enter your password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLogin();
                  }
                }}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading || !email || !password}
              className="w-full bg-gold text-speakeasy-charcoal py-3 px-4 rounded-md font-medium hover:bg-gold-light transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Quick fill for testing */}
            <button
              type="button"
              onClick={() => {
                setEmail('admin@backroomleeds.co.uk');
                setPassword('admin123');
              }}
              className="w-full bg-gray-200 text-gray-700 py-2 px-3 rounded-md text-sm hover:bg-gray-300 transition"
            >
              Fill Test Credentials
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gold/20 text-center">
            <p className="text-xs text-burgundy/60">
              Authorized personnel only
            </p>
            <p className="text-xs text-burgundy/60 mt-2">
              Default: admin@backroomleeds.co.uk / admin123
            </p>
            <div className="mt-3 flex items-center justify-center space-x-1">
              <Shield className="w-3 h-3 text-burgundy/40" />
              <p className="text-xs text-burgundy/40">
                Protected by Two-Factor Authentication
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}