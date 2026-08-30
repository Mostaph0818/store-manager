import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Store, Lock, Mail, ArrowLeft } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/30">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-emerald-500/25">
            <Store className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">تسجيل الدخول</h2>
          <p className="text-sm text-slate-500 mt-1">مرحبًا بك مجددًا في Store Manager</p>
        </div>

        {/* Real Google Sign In Button */}
        <div className="flex justify-center mb-5">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (!credentialResponse.credential) {
                toast.error('فشل الحصول على بيانات Google');
                return;
              }
              try {
                await loginWithGoogle(credentialResponse.credential);
                toast.success('تم تسجيل الدخول عبر حساب Google بنجاح!');
                navigate('/');
              } catch (err: any) {
                toast.error(err.message || 'فشل تسجيل الدخول باستخدام Google');
              }
            }}
            onError={() => {
              toast.error('فشل تسجيل الدخول باستخدام Google');
            }}
            width="368"
            text="continue_with"
            shape="rectangular"
            theme="outline"
          />
        </div>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400">أو بالبريد الإلكتروني</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@storemanager.local"
                required
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm transition-all text-right"
              />
              <Mail className="w-5 h-5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm transition-all text-right"
              />
              <Lock className="w-5 h-5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:bg-emerald-300"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>دخول</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          ليس لديك حساب؟{' '}
          <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
            إنشاء حساب جديد
          </Link>
        </div>
      </div>
    </div>
  );
};
