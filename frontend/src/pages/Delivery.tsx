import React, { useEffect, useState } from 'react';
import { deliveryApi } from '../api/delivery.api';
import { DeliveryRate } from '../types';
import { Search, Save, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

export const Delivery: React.FC = () => {
  const [rates, setRates] = useState<DeliveryRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingCodes, setSavingCodes] = useState<Record<string, boolean>>({});

  const fetchRates = async () => {
    try {
      setLoading(true);
      const res = await deliveryApi.getAll(search);
      setRates(res.data);
    } catch (err: any) {
      toast.error(err.message || 'فشل جلب أسعار التوصيل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [search]);

  const handlePriceChange = (
    wilayaCode: string,
    field: 'homeDeliveryPrice' | 'deskDeliveryPrice',
    value: string
  ) => {
    setRates((prev) =>
      prev.map((r) => (r.wilayaCode === wilayaCode ? { ...r, [field]: value } : r))
    );
  };

  const handleSaveRow = async (rate: DeliveryRate) => {
    try {
      setSavingCodes((prev) => ({ ...prev, [rate.wilayaCode]: true }));
      await deliveryApi.update(rate.wilayaCode, {
        homeDeliveryPrice: Number(rate.homeDeliveryPrice),
        deskDeliveryPrice: Number(rate.deskDeliveryPrice),
      });
      toast.success(`تم حفظ أسعار ولاية ${rate.wilayaName}`);
    } catch (err: any) {
      toast.error(err.message || 'فشل حفظ السعر');
    } finally {
      setSavingCodes((prev) => ({ ...prev, [rate.wilayaCode]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">أسعار التوصيل (69 ولاية)</h1>
        <p className="text-sm text-slate-500 mt-1">تحديد وتعديل أسعار التوصيل للمنزل والمكتب لجميع الولايات الـ 69 الجزائرية</p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن ولاية بالاسم أو الرقم (مثال: العلمة، بوسعادة، سطيف)..."
          className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm transition-all"
        />
        <Search className="w-5 h-5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
      </div>

      {/* Delivery Rates Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">الرقم</th>
                  <th className="px-6 py-3.5">اسم الولاية</th>
                  <th className="px-6 py-3.5">توصيل للمنزل (د.ج)</th>
                  <th className="px-6 py-3.5">استلام من المكتب (د.ج)</th>
                  <th className="px-6 py-3.5 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rates.map((rate) => (
                  <tr key={rate.wilayaCode} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-700 w-20">
                      {rate.wilayaCode}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-800">{rate.wilayaName}</td>
                    <td className="px-6 py-3.5">
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={rate.homeDeliveryPrice}
                        onChange={(e) =>
                          handlePriceChange(rate.wilayaCode, 'homeDeliveryPrice', e.target.value)
                        }
                        className="w-36 px-3 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none text-sm font-mono"
                      />
                    </td>
                    <td className="px-6 py-3.5">
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={rate.deskDeliveryPrice}
                        onChange={(e) =>
                          handlePriceChange(rate.wilayaCode, 'deskDeliveryPrice', e.target.value)
                        }
                        className="w-36 px-3 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none text-sm font-mono"
                      />
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => handleSaveRow(rate)}
                        disabled={savingCodes[rate.wilayaCode]}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      >
                        {savingCodes[rate.wilayaCode] ? (
                          <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>حفظ</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400">
            <Truck className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">لم يتم العثور على أي ولاية</p>
          </div>
        )}
      </div>
    </div>
  );
};
