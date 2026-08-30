import React, { useEffect, useState } from 'react';
import { settingsApi } from '../api/settings.api';
import { User } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { Key, Copy, RefreshCw, AlertTriangle, Check, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isConfirmRegenOpen, setIsConfirmRegenOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await settingsApi.getSettings();
      setUser(res.data);
    } catch (err: any) {
      toast.error(err.message || 'فشل جلب بيانات الحساب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleCopy = () => {
    if (!user?.apiKey) return;
    navigator.clipboard.writeText(user.apiKey);
    setCopied(true);
    toast.success('تم نسخ مفتاح API بنجاح');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const res = await settingsApi.regenerateApiKey();
      setUser((prev) => (prev ? { ...prev, apiKey: res.data.apiKey } : null));
      toast.success('تم إنشاء مفتاح API جديد وإلغاء المفتاح القديم');
      setIsConfirmRegenOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'فشل إعادة توليد المفتاح');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">الإعدادات وتكامل API</h1>
        <p className="text-sm text-slate-500 mt-1">إدارة حسابك وربط المتجر مع أتمتة n8n</p>
      </div>

      {/* Account Info Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          معلومات الحساب
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">اسم المستخدم</label>
            <p className="font-semibold text-slate-800">{user?.username}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">البريد الإلكتروني</label>
            <p className="font-semibold text-slate-800">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* API Key Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-600" />
            مفتاح API الخاص بـ n8n
          </h2>
        </div>

        {/* Warning Note */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-amber-800 text-xs leading-relaxed">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-bold mb-0.5">تحذير أمان هام:</p>
            <p>
              هذا المفتاح يمنح حق الوصول الكامل لإنشاء وفحص الطلبات والمخزون عبر API. لا تشاركه مع أي
              شخص. يتم استخدامه في الـ Headers: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">x-api-key: YOUR_KEY</code>.
            </p>
          </div>
        </div>

        {/* API Key Box */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">المفتاح الحالي</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={user?.apiKey || ''}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 font-mono text-xs text-slate-700 outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 flex-shrink-0 shadow-sm"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ' : 'نسخ المفتاح'}</span>
            </button>
          </div>
        </div>

        {/* Regenerate Action */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">إذا تم تسريب المفتاح يمكنك إنشاء مفتاح جديد:</span>
          <button
            onClick={() => setIsConfirmRegenOpen(true)}
            className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعادة توليد API Key</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmRegenOpen}
        onClose={() => setIsConfirmRegenOpen(false)}
        onConfirm={handleRegenerate}
        title="تأكيد إعادة توليد API Key"
        message="هل أنت متأكد؟ المفتاح الحالي سيصبح غير صالح فورًا، وستتوقف أي سيناريوهات في n8n تعتمد عليه حتى تقوم بتحديث المفتاح الجديد."
        confirmText="نعم، قم بتوليد مفتاح جديد"
        isDestructive
        loading={regenerating}
      />
    </div>
  );
};
