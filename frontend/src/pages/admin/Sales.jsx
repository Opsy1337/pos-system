import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'

const paymentLabels = { cash: '💵 نقدي', card: '💳 شبكة', transfer: '📱 تحويل' }
const paymentColors = { cash: 'bg-green-100 text-green-700', card: 'bg-blue-100 text-blue-700', transfer: 'bg-purple-100 text-purple-700' }

export default function Sales() {
  const [sales, setSales] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ start_date: '', end_date: '', payment_method: '' })
  const [page, setPage] = useState(0)
  const navigate = useNavigate()
  const limit = 20

  useEffect(() => { load() }, [page, filters])

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ skip: page * limit, limit })
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      if (filters.payment_method) params.append('payment_method', filters.payment_method)
      const { data } = await api.get(`/sales/?${params}`)
      setSales(data.sales || [])
      setTotal(data.total || 0)
    } finally { setLoading(false) }
  }

  function applyFilters(e) { e.preventDefault(); setPage(0); load() }
  function resetFilters() { setFilters({ start_date: '', end_date: '', payment_method: '' }); setPage(0) }

  const totalRevenue = sales.reduce((s, sale) => s + sale.total, 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📄 سجل المبيعات</h1>
        <p className="text-gray-500 text-sm">{total} فاتورة</p>
      </div>

      {/* Filters */}
      <form onSubmit={applyFilters} className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">من تاريخ</label>
          <input type="date" value={filters.start_date} onChange={e => setFilters(f => ({ ...f, start_date: e.target.value }))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">إلى تاريخ</label>
          <input type="date" value={filters.end_date} onChange={e => setFilters(f => ({ ...f, end_date: e.target.value }))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">طريقة الدفع</label>
          <select value={filters.payment_method} onChange={e => setFilters(f => ({ ...f, payment_method: e.target.value }))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">الكل</option>
            <option value="cash">نقدي</option>
            <option value="card">شبكة</option>
            <option value="transfer">تحويل</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">🔍 بحث</button>
        <button type="button" onClick={resetFilters} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">↺ إعادة</button>
      </form>

      {/* Summary */}
      {sales.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'عدد الفواتير', value: sales.length, icon: '📄', color: 'blue' },
            { label: 'إجمالي المعروض', value: `${totalRevenue.toFixed(2)} ر.س`, icon: '💰', color: 'green' },
            { label: 'متوسط الفاتورة', value: `${(totalRevenue / sales.length).toFixed(2)} ر.س`, icon: '📊', color: 'purple' },
          ].map((s, i) => (
            <div key={i} className={`bg-${s.color}-50 border border-${s.color}-100 rounded-2xl p-4 text-center`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`font-bold text-${s.color}-700 text-lg`}>{s.value}</div>
              <div className={`text-${s.color}-500 text-xs`}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">⏳ جاري التحميل...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b text-gray-600">
                <tr>
                  <th className="px-4 py-4 text-right font-semibold">رقم الفاتورة</th>
                  <th className="px-4 py-4 text-right font-semibold">الكاشير</th>
                  <th className="px-4 py-4 text-right font-semibold">طريقة الدفع</th>
                  <th className="px-4 py-4 text-right font-semibold">المجموع</th>
                  <th className="px-4 py-4 text-right font-semibold">الإجمالي</th>
                  <th className="px-4 py-4 text-right font-semibold">التاريخ والوقت</th>
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sales.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => navigate(`/admin/sales/${s.id}`)}>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{s.invoice_number}</td>
                    <td className="px-4 py-3">{s.cashier?.name || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${paymentColors[s.payment_method]}`}>
                        {paymentLabels[s.payment_method]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.subtotal?.toFixed(2)} ر.س</td>
                    <td className="px-4 py-3 font-bold text-gray-800">{s.total?.toFixed(2)} ر.س</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(s.created_at).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td className="px-4 py-3">
                      <span className="text-blue-600 hover:underline text-xs font-semibold">تفاصيل ←</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sales.length === 0 && <div className="text-center py-12 text-gray-400">لا توجد مبيعات</div>}
          </div>
        )}
        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="bg-gray-100 hover:bg-gray-200 disabled:opacity-40 px-4 py-2 rounded-xl font-semibold transition">→ السابق</button>
            <span className="text-gray-500">صفحة {page + 1} من {Math.ceil(total / limit)}</span>
            <button disabled={(page + 1) * limit >= total} onClick={() => setPage(p => p + 1)} className="bg-gray-100 hover:bg-gray-200 disabled:opacity-40 px-4 py-2 rounded-xl font-semibold transition">← التالي</button>
          </div>
        )}
      </div>
    </div>
  )
}
