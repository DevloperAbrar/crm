import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth.js';
import { roleHomeRoute } from '../../routes/roleBasedRoutes.js';
import AuthLayout from '../../components/layout/AuthLayout.jsx';

export default function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const wrapRef = useRef(null);
  const [btnWidth, setBtnWidth] = useState(320);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const update = () => setBtnWidth(Math.min(400, Math.max(200, Math.floor(el.offsetWidth))));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle(credentialResponse.credential);
      toast.success(`Welcome back, ${user.name || 'there'}!`);
      navigate(roleHomeRoute[user.role] || '/leads');
    } catch (err) {
      const msg = err.response?.data?.message || 'Google sign-in failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl font-semibold tracking-tight text-brand-500">Welcome back</h2>
      <p className="mt-1.5 text-sm text-gray-500">Sign in to your workspace to continue.</p>

      <div className="mt-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Team Leads &amp; BDEs
        </p>

        <div
          ref={wrapRef}
          className={`flex justify-center transition-opacity ${
            loading ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setError('Google sign-in was cancelled or failed.');
              toast.error('Google sign-in was cancelled or failed.');
            }}
            theme="outline"
            size="large"
            shape="rectangular"
            text="signin_with"
            width={String(btnWidth)}
          />
        </div>

        <p className="mt-3 text-xs text-gray-500 leading-relaxed">
          Use the Google account your admin registered. Accounts that haven&apos;t been added
          can&apos;t sign in.
        </p>

        {loading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Signing you in...
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="my-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">Administrator?</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <Link
        to="/admin-login"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-brand-500 transition-colors hover:bg-gray-50"
      >
        <ShieldCheck size={16} className="text-accent-500" />
        Admin login
      </Link>
    </AuthLayout>
  );
}