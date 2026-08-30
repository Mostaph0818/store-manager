import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard.api';
import { DashboardStats } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Package,
  AlertOctagon,
  ShoppingCart,
  Clock,
  TrendingUp,
  DollarSign,
  ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardApi.getStats();
        setStats(res.data);
      } catch (err: any) {
        toast.error(err.message || 'فشل تحميل الإحصائيات');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'إجمالي المنتجات',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'from-blue-600 to-indigo-600',
      bgColor: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'منتجات نفدت',
      value: stats?.outOfStockProducts || 0,
      icon: AlertOctagon,
      color: 'from-rose-500 to-red-600',
      bgColor: 'bg-rose-50 text-rose-600',
    },
    {
      title: 'إجمالي الطلبات',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'from-emerald-600 to-teal-600',
      bgColor: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'طلبات جديدة (معلقة)',
      value: stats?.newOrders || 0,
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'إجمالي المبيعات (المستلمة)',
      value: `${Number(stats?.totalRevenue || 0).toLocaleString()} د.ج`,
      icon: TrendingUp,
      color: 'from-emerald-600 to-green-600',
      bgColor: 'bg-emerald-50 text-emerald-700',
    },
    {
      title: 'قيمة المخزون الحالي',
      value: `${Number(stats?.inventoryValue || 0).toLocaleString()} د.ج`,
      icon: DollarSign,
      color: 'from-violet-600 to-purple-600',
      bgColor: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">نظرة عامة على المتجر</h1>
        <p className="text-sm text-slate-500 mt-1">متابعة المبيعات والمخزون وحالة الطلبات لحظيًا</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400">{card.title}</p>
                <p className="text-2xl font-black text-slate-800">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.bgColor}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">آخر الطلبات المستلمة</h2>
            <p className="text-xs text-slate-400 mt-0.5">أحدث 10 طلبات مسجلة</p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 hover:underline"
          >
            <span>عرض كل الطلبات</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats?.recentOrders && stats.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">رقم الطلب</th>
                  <th className="px-6 py-3.5">العميل</th>
                  <th className="px-6 py-3.5">الولاية</th>
                  <th className="px-6 py-3.5">المنتج</th>
                  <th className="px-6 py-3.5">المجموع</th>
                  <th className="px-6 py-3.5">الحالة</th>
                  <th className="px-6 py-3.5">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-700">#{order.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{order.customerName}</td>
                    <td className="px-6 py-4 text-slate-600">{order.wilayaName}</td>
                    <td className="px-6 py-4 text-slate-700">
                      {order.product?.name || `منتج #${order.productId}`} ({order.quantity})
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {Number(order.totalAmount).toLocaleString()} د.ج
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      {new Date(order.createdAt).toLocaleDateString('ar-DZ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-sm">
            لا توجد طلبات مسجلة حتى الآن.
          </div>
        )}
      </div>
    </div>
  );
};
