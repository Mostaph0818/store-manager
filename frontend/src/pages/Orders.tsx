import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi, OrdersFilter } from '../api/orders.api';
import { Order, OrderStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Search, Filter, Eye, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS: { label: string; value: OrderStatus | '' }[] = [
  { label: 'جميع الحالات', value: '' },
  { label: 'قيد الانتظار', value: 'pending' },
  { label: 'قيد المعالجة', value: 'processing' },
  { label: 'قيد التوصيل', value: 'out_for_delivery' },
  { label: 'تم التوصيل', value: 'delivered' },
  { label: 'ملغى', value: 'cancelled' },
];

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });

  // Filters
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [search, setSearch] = useState('');
  const [wilayaCode, setWilayaCode] = useState('');

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const filter: OrdersFilter = {
        page,
        limit: pagination.limit,
        status: status || undefined,
        search: search || undefined,
        wilayaCode: wilayaCode || undefined,
        sortOrder: 'desc',
      };
      const res = await ordersApi.getAll(filter);
      setOrders(res.data.orders);
      setPagination(res.data.pagination);
    } catch (err: any) {
      toast.error(err.message || 'فشل تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [status, search, wilayaCode]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">إدارة الطلبات</h1>
        <p className="text-sm text-slate-500 mt-1">متابعة وتحديث حالات طلبات العملاء الواردة</p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم العميل..."
            className="w-full pl-4 pr-10 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus | '')}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-emerald-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Wilaya Filter */}
          <input
            type="text"
            value={wilayaCode}
            onChange={(e) => setWilayaCode(e.target.value)}
            placeholder="رمز الولاية (مثلاً 16)"
            className="w-36 px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">رقم الطلب</th>
                    <th className="px-6 py-3.5">العميل</th>
                    <th className="px-6 py-3.5">الهاتف</th>
                    <th className="px-6 py-3.5">الولاية</th>
                    <th className="px-6 py-3.5">المنتج</th>
                    <th className="px-6 py-3.5">الكمية</th>
                    <th className="px-6 py-3.5">المجموع</th>
                    <th className="px-6 py-3.5">الحالة</th>
                    <th className="px-6 py-3.5">التاريخ</th>
                    <th className="px-6 py-3.5 text-center">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-semibold text-slate-700">#{order.id}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{order.customerName}</td>
                      <td className="px-6 py-4 font-mono text-slate-600">{order.customerPhone}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {order.wilayaCode} - {order.wilayaName}
                      </td>
                      <td className="px-6 py-4 text-slate-800">
                        {order.product?.name || `منتج #${order.productId}`}
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold">{order.quantity}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 font-mono">
                        {Number(order.totalAmount).toLocaleString()} د.ج
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                        {new Date(order.createdAt).toLocaleDateString('ar-DZ')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          to={`/orders/${order.id}`}
                          className="inline-flex items-center justify-center p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  عرض صفحة {pagination.page} من إجمالي {pagination.totalPages} (إجمالي {pagination.total} طلب)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchOrders(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fetchOrders(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-slate-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">لم يتم العثور على أي طلبات تطابق هذا البحث</p>
          </div>
        )}
      </div>
    </div>
  );
};
