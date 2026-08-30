import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersApi } from '../api/orders.api';
import { Order, OrderStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  ArrowRight,
  User,
  Phone,
  MapPin,
  Package,
  Truck,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_ACTIONS: { label: string; value: OrderStatus; color: string }[] = [
  { label: 'قيد الانتظار', value: 'pending', color: 'bg-amber-600 hover:bg-amber-700' },
  { label: 'قيد المعالجة', value: 'processing', color: 'bg-blue-600 hover:bg-blue-700' },
  { label: 'قيد التوصيل', value: 'out_for_delivery', color: 'bg-purple-600 hover:bg-purple-700' },
  { label: 'تم التوصيل', value: 'delivered', color: 'bg-emerald-600 hover:bg-emerald-700' },
  { label: 'إلغاء الطلب (إرجاع المخزون)', value: 'cancelled', color: 'bg-rose-600 hover:bg-rose-700' },
];

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await ordersApi.getById(parseInt(id, 10));
      setOrder(res.data);
    } catch (err: any) {
      toast.error(err.message || 'فشل تحميل بيانات الطلب');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order || order.status === newStatus) return;
    try {
      setUpdating(true);
      const res = await ordersApi.updateStatus(order.id, newStatus);
      setOrder(res.data);
      toast.success(
        newStatus === 'cancelled'
          ? 'تم إلغاء الطلب وإرجاع الكمية إلى المخزون تلقائيًا'
          : 'تم تحديث حالة الطلب بنجاح'
      );
    } catch (err: any) {
      toast.error(err.message || 'فشل تحديث حالة الطلب');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/orders')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى قائمة الطلبات</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">حالة الطلب:</span>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Main Order Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-8">
        {/* Order Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              طلب #{order.id}
            </span>
            <h1 className="text-xl font-black text-slate-800 mt-2">تفاصيل الطلب</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Calendar className="w-4 h-4" />
            <span>{new Date(order.createdAt).toLocaleString('ar-DZ')}</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Info */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-4 h-4" />
              بيانات العميل
            </h2>
            <div className="space-y-2 text-sm">
              <p className="font-bold text-slate-800 text-base">{order.customerName}</p>
              <p className="text-slate-600 flex items-center gap-2 font-mono">
                <Phone className="w-4 h-4 text-slate-400" />
                {order.customerPhone}
              </p>
              <p className="text-slate-600 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <span>
                  ولاية {order.wilayaName} ({order.wilayaCode}) - {order.address}
                </span>
              </p>
            </div>
          </div>

          {/* Delivery & Pricing Info */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Truck className="w-4 h-4" />
              تفاصيل التوصيل والحساب
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>نوع التوصيل:</span>
                <span className="font-semibold text-slate-800">
                  {order.deliveryType === 'home' ? 'توصيل للمنزل' : 'استلام من المكتب'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>تكلفة التوصيل:</span>
                <span className="font-mono font-semibold">{Number(order.deliveryFee).toLocaleString()} د.ج</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>سعر وحدة المنتج:</span>
                <span className="font-mono font-semibold">
                  {Number(order.productUnitPrice).toLocaleString()} د.ج
                </span>
              </div>
              <div className="border-t border-slate-200/80 pt-2 flex justify-between items-center">
                <span className="font-bold text-slate-800">المجموع الكلي:</span>
                <span className="text-lg font-black text-emerald-600 font-mono">
                  {Number(order.totalAmount).toLocaleString()} د.ج
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="border border-slate-100 rounded-2xl p-5 bg-white space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Package className="w-4 h-4" />
            المنتج المطلوب
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800 text-base">
                {order.product?.name || `منتج #${order.productId}`}
              </p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">معرف المنتج: {order.productId}</p>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-700">الكمية: {order.quantity}</p>
              <p className="text-sm font-bold text-emerald-700 font-mono">
                {Number(order.productUnitPrice).toLocaleString()} د.ج / للقطعة
              </p>
            </div>
          </div>
        </div>

        {/* Actions / Change Status */}
        <div className="pt-6 border-t border-slate-100 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">تغيير حالة الطلب</h3>
          <div className="flex flex-wrap gap-2">
            {STATUS_ACTIONS.map((action) => {
              const isCurrent = order.status === action.value;
              return (
                <button
                  key={action.value}
                  disabled={updating || isCurrent}
                  onClick={() => handleStatusChange(action.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                    isCurrent
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : `${action.color} text-white`
                  }`}
                >
                  {isCurrent && <CheckCircle className="w-3.5 h-3.5" />}
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
