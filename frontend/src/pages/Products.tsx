import React, { useEffect, useState } from 'react';
import { productsApi } from '../api/products.api';
import { Product } from '../types';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Boxes,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    barcode: '',
    category: '',
    imageUrl: '',
    costPrice: '',
    sellingPrice: '',
    stockQuantity: '',
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productsApi.getAll(search);
      setProducts(res.data);
    } catch (err: any) {
      toast.error(err.message || 'فشل جلب المنتجات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      description: '',
      barcode: '',
      category: '',
      imageUrl: '',
      costPrice: '',
      sellingPrice: '',
      stockQuantity: '10',
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setSelectedProduct(p);
    setFormData({
      name: p.name,
      description: p.description || '',
      barcode: p.barcode || '',
      category: p.category || '',
      imageUrl: p.imageUrl || '',
      costPrice: String(p.costPrice),
      sellingPrice: String(p.sellingPrice),
      stockQuantity: String(p.stockQuantity),
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (p: Product) => {
    setSelectedProduct(p);
    setIsDeleteOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم المنتج');
      return;
    }
    if (Number(formData.sellingPrice) <= 0) {
      toast.error('سعر البيع يجب أن يكون أكبر من 0');
      return;
    }

    try {
      setSubmitting(true);
      await productsApi.create({
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        barcode: formData.barcode?.trim() || undefined,
        category: formData.category?.trim() || undefined,
        imageUrl: formData.imageUrl?.trim() || undefined,
        costPrice: Number(formData.costPrice) || 0,
        sellingPrice: Number(formData.sellingPrice),
        stockQuantity: parseInt(formData.stockQuantity, 10) || 0,
      });
      toast.success('تمت إضافة المنتج بنجاح');
      setIsCreateOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || 'فشل إضافة المنتج');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      setSubmitting(true);
      await productsApi.update(selectedProduct.id, {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        barcode: formData.barcode?.trim() || undefined,
        category: formData.category?.trim() || undefined,
        imageUrl: formData.imageUrl?.trim() || undefined,
        costPrice: Number(formData.costPrice) || 0,
        sellingPrice: Number(formData.sellingPrice),
        stockQuantity: parseInt(formData.stockQuantity, 10) || 0,
      });
      toast.success('تم تعديل المنتج بنجاح');
      setIsEditOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || 'فشل تعديل المنتج');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;
    try {
      setSubmitting(true);
      await productsApi.delete(selectedProduct.id);
      toast.success('تم حذف المنتج بنجاح');
      setIsDeleteOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || 'فشل حذف المنتج');
    } finally {
      setSubmitting(false);
    }
  };

  // Profit calculation helper
  const cost = Number(formData.costPrice) || 0;
  const sell = Number(formData.sellingPrice) || 0;
  const profitPerItem = sell - cost;
  const profitMargin = sell > 0 ? Math.round((profitPerItem / sell) * 100) : 0;

  // Filtered products
  const filteredProducts = products.filter((p) => {
    if (stockFilter === 'in_stock') return !p.isOutOfStock && p.stockQuantity > 0;
    if (stockFilter === 'out_of_stock') return p.isOutOfStock || p.stockQuantity === 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">المنتجات والمخزون</h1>
          <p className="text-sm text-slate-500 mt-1">إضافة وإدارة منتجات المتجر ومتابعة الكميات المتوفرة</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة منتج جديد</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن اسم منتج..."
            className="w-full pl-4 pr-10 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 outline-none text-sm transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStockFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              stockFilter === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            الكل ({products.length})
          </button>
          <button
            onClick={() => setStockFilter('in_stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              stockFilter === 'in_stock'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>متوفر ({products.filter((p) => !p.isOutOfStock && p.stockQuantity > 0).length})</span>
          </button>
          <button
            onClick={() => setStockFilter('out_of_stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              stockFilter === 'out_of_stock'
                ? 'bg-rose-600 text-white'
                : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>نفد ({products.filter((p) => p.isOutOfStock || p.stockQuantity === 0).length})</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">المنتج</th>
                  <th className="px-6 py-3.5">سعر الشراء</th>
                  <th className="px-6 py-3.5">سعر البيع</th>
                  <th className="px-6 py-3.5">الربح المتوقع</th>
                  <th className="px-6 py-3.5">المخزون المتبقي</th>
                  <th className="px-6 py-3.5">الحالة</th>
                  <th className="px-6 py-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const itemProfit = Number(p.sellingPrice) - Number(p.costPrice);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                              <Package className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-800">{p.name}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              {p.category && (
                                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md">
                                  {p.category}
                                </span>
                              )}
                              {p.barcode && (
                                <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                                  #{p.barcode}
                                </span>
                              )}
                            </div>
                            {p.description && (
                              <p className="text-xs text-slate-400 mt-1 line-clamp-1">{p.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono">
                        {Number(p.costPrice).toLocaleString()} د.ج
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 font-mono">
                        {Number(p.sellingPrice).toLocaleString()} د.ج
                      </td>
                      <td className="px-6 py-4 font-mono">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          itemProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          +{itemProfit.toLocaleString()} د.ج
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Boxes className="w-4 h-4 text-slate-400" />
                          <span>{p.stockQuantity} قطعة</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {p.isOutOfStock || p.stockQuantity === 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            نفد المخزون
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            متوفر
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                            title="تعديل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(p)}
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">لم يتم العثور على أي منتجات</p>
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="إضافة منتج جديد للمتجر">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المنتج *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm"
              placeholder="مثال: ساعة ذكية Smart Watch Ultra"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">وصف ومواصفات المنتج (اختياري)</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm"
              placeholder="اللون، الحجم، الضمان..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الباركود (اختياري)</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm font-mono"
                placeholder="123456789"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الفئة (اختياري)</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm"
                placeholder="إلكترونيات"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">رابط الصورة (اختياري)</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm font-mono"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">سعر الشراء / التكلفة (د.ج)</label>
              <input
                type="number"
                step="50"
                min="0"
                required
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm font-mono"
                placeholder="2500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">سعر البيع للعميل (د.ج) *</label>
              <input
                type="number"
                step="50"
                min="1"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm font-mono font-bold text-emerald-700"
                placeholder="4200"
              />
            </div>
          </div>

          {/* Profit Preview Card */}
          {sell > 0 && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                صافي الربح المتوقع للقطعة:
              </span>
              <span className="font-bold font-mono text-emerald-700">
                {profitPerItem.toLocaleString()} د.ج ({profitMargin}%)
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">الكمية الأولية في المخزون</label>
            <input
              type="number"
              min="0"
              required
              value={formData.stockQuantity}
              onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm font-mono"
              placeholder="10"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:bg-emerald-300 shadow-sm"
            >
              {submitting ? 'جاري الحفظ...' : 'حفظ المنتج'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="تعديل بيانات المنتج">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المنتج</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">الوصف (اختياري)</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الباركود (اختياري)</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الفئة (اختياري)</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">رابط الصورة (اختياري)</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">سعر الشراء (د.ج)</label>
              <input
                type="number"
                step="50"
                min="0"
                required
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">سعر البيع (د.ج)</label>
              <input
                type="number"
                step="50"
                min="1"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm font-mono font-bold text-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">كمية المخزون</label>
            <input
              type="number"
              min="0"
              required
              value={formData.stockQuantity}
              onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:bg-emerald-300 shadow-sm"
            >
              {submitting ? 'جاري التعديل...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="تأكيد حذف المنتج"
        message={`هل أنت متأكد من رغبتك في حذف المنتج "${selectedProduct?.name}"؟ لا يمكن التراجع عن هذه العملية.`}
        confirmText="نعم، احذف المنتج"
        isDestructive
        loading={submitting}
      />
    </div>
  );
};
