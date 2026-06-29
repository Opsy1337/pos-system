import { useState, useEffect } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'

export default function StoreSettings() {
  const [form, setForm] = useState({
    store_name: '', store_address: '', store_phone: '',
    tax_rate: 15, currency: 'ر.س', receipt_footer: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [])
  async function load() {
    const res = await api.get('/reports/store-settings')
    setForm(res.data)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put('/reports/store-settings', { ...form, tax_rate: parseFloat(form.tax_rate) })
      toast.success('تم حفظ الإعدادات')
    } catch { toast.error('خطأ في الحفظ') }
    finally { setLoading(false) }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">⚙️ إعدادات المتجر</h1>
        <p className="text-gray-500 text-sm">تظهر هذه البيانات على الإيصالات</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">اسم المتجر *</label>
          <input value={form.store_name} onChange={e => setForm(f => ({ ...f, store_name: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="مثال: كافيه النخبة" required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">العنوان</label>
          <input value={form.store_address} onChange={e => setForm(f => ({ ...f, store_address: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="مثال: الرياض، حي العليا" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">رقم الهاتف</label>
          <input value={form.store_phone} onChange={e => setForm(f => ({ ...f, store_phone: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="مثال: 0501234567" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">نسبة الضريبة (%)</label>
            <input type="number" min="0" max="100" step="0.1" value={form.tax_rate}
              onChange={e => setForm(f => ({ ...f, tax_rate: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">رمز العملة</label>
            <input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="ر.س" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">رسالة نهاية الإيصال</label>
          <textarea value={form.receipt_footer} onChange={e => setForm(f => ({ ...f, receipt_footer: e.target.value }))}
            rows={2}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            placeholder="مثال: شكراً لزيارتكم 😊" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition text-lg">
          {loading ? '⏳ جاري الحفظ...' : '💾 حفظ الإعدادات'}
        </button>
      </form>

      {/* Preview */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-gray-800 mb-4">👁️ معاينة رأس الإيصال</h2>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center font-mono text-sm">
          <div className="text-lg font-bold">{form.store_name || 'اسم المتجر'}</div>
          {form.store_address && <div className="text-gray-500 text-xs mt-1">{form.store_address}</div>}
          {form.store_phone && <div className="text-gray-500 text-xs">📞 {form.store_phone}</div>}
          <div className="border-t border-dashed border-gray-300 mt-2 pt-2 text-gray-400 text-xs">
            ... محتوى الإيصال ...
          </div>
          <div className="border-t border-dashed border-gray-300 mt-2 pt-2 text-gray-600 text-xs">
            {form.receipt_footer || 'رسالة نهاية الإيصال'}
          </div>
        </div>
      </div>
    </div>
  )
}
