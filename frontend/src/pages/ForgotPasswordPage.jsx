import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { toastError, toastSuccess } from '../lib/toast';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('request');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  async function requestOtp(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password/request', { email });
      toastSuccess('OTP sent (check email / server console).');
      setStep('reset');
    } catch (err) {
      toastError(err?.response?.data?.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password/reset', { email, otp, newPassword });
      toastSuccess('Password updated. Please login.');
      navigate('/auth?mode=login', { replace: true });
    } catch (err) {
      toastError(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-md">
      <Card className="glass p-6">
        <div className="mb-4">
          <div className="font-display text-2xl font-bold">Forgot password</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {step === 'request'
              ? 'Enter your email to receive a 6-digit OTP.'
              : 'Enter the OTP and set a new password.'}
          </div>
        </div>

        {step === 'request' ? (
          <form className="space-y-4" onSubmit={requestOtp}>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                className="mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                required
              />
            </div>

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Please wait…' : 'Send OTP'}
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={resetPassword}>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                className="mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">OTP</label>
              <Input
                className="mt-1"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit OTP"
                inputMode="numeric"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">New password</label>
              <Input
                className="mt-1"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                required
              />
            </div>

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Please wait…' : 'Reset password'}
            </Button>

            <button
              type="button"
              onClick={() => setStep('request')}
              className="inline-flex items-center justify-center w-full rounded-xl px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-primary/10"
            >
              Resend OTP
            </button>
          </form>
        )}

        <Link
          to="/auth?mode=login"
          className="mt-4 inline-flex items-center justify-center w-full rounded-xl px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-primary/10"
        >
          Back to login
        </Link>
      </Card>
    </div>
  );
}
