'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, AlertCircle, Check, X, Copy, QrCode } from 'lucide-react';

interface TwoFactorSetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [remainingBackupCodes, setRemainingBackupCodes] = useState(0);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disable2FACode, setDisable2FACode] = useState('');
  const [copiedBackupCode, setCopiedBackupCode] = useState<number | null>(null);

  // Fetch 2FA status on component mount
  useEffect(() => {
    fetch2FAStatus();
  }, []);

  const fetch2FAStatus = async () => {
    try {
      const response = await fetch('/api/admin/auth/2fa/status');
      if (response.ok) {
        const data = await response.json();
        setTwoFactorEnabled(data.data.twoFactorEnabled);
        setRemainingBackupCodes(data.data.remainingBackupCodes);
        setUserEmail(data.data.email);
        setUserName(data.data.name);
      }
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password updated successfully' });
        setShowPasswordForm(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating password' });
    } finally {
      setLoading(false);
    }
  };

  const setup2FA = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/auth/2fa/setup');
      const data = await response.json();

      if (response.ok) {
        setSetupData(data.data);
        setShow2FASetup(true);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to setup 2FA' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while setting up 2FA' });
    } finally {
      setLoading(false);
    }
  };

  const verify2FASetup = async () => {
    if (!verificationCode || !setupData) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: verificationCode,
          secret: setupData.secret,
          backupCodes: setupData.backupCodes
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: '2FA has been successfully enabled' });
        setShow2FASetup(false);
        setSetupData(null);
        setVerificationCode('');
        fetch2FAStatus();
      } else {
        setMessage({ type: 'error', text: data.error || 'Invalid verification code' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while verifying 2FA' });
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!disablePassword) {
      setMessage({ type: 'error', text: 'Password is required' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: disablePassword,
          code: disable2FACode || undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: '2FA has been successfully disabled' });
        setShow2FADisable(false);
        setDisablePassword('');
        setDisable2FACode('');
        fetch2FAStatus();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to disable 2FA' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while disabling 2FA' });
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedBackupCode(index);
    setTimeout(() => setCopiedBackupCode(null), 2000);
  };

  const copyAllBackupCodes = () => {
    if (setupData) {
      navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
      setMessage({ type: 'success', text: 'All backup codes copied to clipboard' });
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-700 mt-1">Manage admin account and system settings</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg flex items-start space-x-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5 mt-0.5" /> : <X className="w-5 h-5 mt-0.5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Account Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Account Settings</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-700">Logged in as</p>
            <p className="font-medium">{userEmail || 'Loading...'}</p>
            <p className="text-sm text-gray-600">{userName}</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition flex items-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>Change Password</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>

          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} className="mt-4 space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  required
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gold focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                  minLength={8}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gold focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                  minLength={8}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gold focus:border-gold"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gold text-speakeasy-charcoal rounded-md hover:bg-gold/90 transition disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Two-Factor Authentication (2FA)</span>
          </h2>
        </div>
        <div className="p-6 space-y-4">
          {twoFactorEnabled ? (
            <>
              <div className="flex items-center space-x-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">2FA is enabled</span>
              </div>
              {remainingBackupCodes > 0 && (
                <p className="text-sm text-gray-600">
                  You have {remainingBackupCodes} backup {remainingBackupCodes === 1 ? 'code' : 'codes'} remaining
                </p>
              )}
              <button
                onClick={() => setShow2FADisable(true)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
              >
                Disable 2FA
              </button>

              {show2FADisable && (
                <div className="mt-4 p-4 border rounded-lg space-y-4">
                  <p className="text-sm text-gray-700">
                    Enter your password to disable two-factor authentication
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gold focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      2FA Code (Optional, for extra security)
                    </label>
                    <input
                      type="text"
                      value={disable2FACode}
                      onChange={(e) => setDisable2FACode(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gold focus:border-gold"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={disable2FA}
                      disabled={loading || !disablePassword}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition disabled:opacity-50"
                    >
                      {loading ? 'Disabling...' : 'Disable 2FA'}
                    </button>
                    <button
                      onClick={() => {
                        setShow2FADisable(false);
                        setDisablePassword('');
                        setDisable2FACode('');
                      }}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center space-x-2 text-amber-600">
                <AlertCircle className="w-5 h-5" />
                <span>2FA is not enabled</span>
              </div>
              <p className="text-sm text-gray-600">
                Add an extra layer of security to your account by enabling two-factor authentication
              </p>
              <button
                onClick={setup2FA}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition disabled:opacity-50"
              >
                {loading ? 'Setting up...' : 'Enable 2FA'}
              </button>
            </>
          )}

          {/* 2FA Setup Modal */}
          {show2FASetup && setupData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h3 className="text-2xl font-semibold mb-4 flex items-center space-x-2">
                    <QrCode className="w-6 h-6" />
                    <span>Set Up Two-Factor Authentication</span>
                  </h3>

                  <div className="space-y-6">
                    {/* Step 1: QR Code */}
                    <div>
                      <h4 className="font-semibold mb-2">Step 1: Scan QR Code</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Use your authenticator app (Google Authenticator, Authy, etc.) to scan this QR code:
                      </p>
                      <div className="flex justify-center mb-4">
                        <img src={setupData.qrCode} alt="2FA QR Code" className="border p-2 rounded" />
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-600 mb-1">Manual entry key:</p>
                        <code className="text-xs break-all">{setupData.manualEntryKey}</code>
                      </div>
                    </div>

                    {/* Step 2: Backup Codes */}
                    <div>
                      <h4 className="font-semibold mb-2">Step 2: Save Backup Codes</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Save these backup codes in a secure place. You can use them to access your account if you lose your phone:
                      </p>
                      <div className="bg-gray-50 p-4 rounded space-y-2">
                        {setupData.backupCodes.map((code, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <code className="text-sm font-mono">{code}</code>
                            <button
                              onClick={() => copyBackupCode(code, index)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              {copiedBackupCode === index ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={copyAllBackupCodes}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        Copy all backup codes
                      </button>
                    </div>

                    {/* Step 3: Verify */}
                    <div>
                      <h4 className="font-semibold mb-2">Step 3: Verify Setup</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Enter the 6-digit code from your authenticator app:
                      </p>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        maxLength={6}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gold focus:border-gold text-center text-lg font-mono"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 pt-4 border-t">
                      <button
                        onClick={() => {
                          setShow2FASetup(false);
                          setSetupData(null);
                          setVerificationCode('');
                        }}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={verify2FASetup}
                        disabled={loading || verificationCode.length !== 6}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition disabled:opacity-50"
                      >
                        {loading ? 'Verifying...' : 'Enable 2FA'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">System Information</h2>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Environment</span>
            <span className="font-medium">{process.env.NODE_ENV || 'Development'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Database</span>
            <span className="font-medium">PostgreSQL</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email Service</span>
            <span className="font-medium">Email Service Configured</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Gateway</span>
            <span className="font-medium">Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
}