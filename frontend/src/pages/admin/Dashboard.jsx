import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import api from '../../api/client'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [daily, setDaily] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [recentSales, setRecentSales] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const start = `${year}-${month}-01`
      const end = now.toISOString().split('T')[0]

      const [sumRes, dailyRes, topRes, salesRes] = await Promise.all([
        api.get(`/reports/summary?start_date=${start}&end_date=${end}`),
        api.get(`/reports/daily?year=${year}&month=${now.getMonth() + 1}`),
        api.get('/reports/top-products?limit=5'),
        api.get('/sales/?limit=5'),
      ])
      setSummary(sumRes.data)
      setDaily(dailyRes.data)
      setTopProducts(topRes.data)
      setRecentSales(salesRes.data.sales || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const paymentLabels = { cash: 'نقدي', card: 'شبكة', transfer: 'تحويل' }
  const paymentColors = { cash: 'bg-green-100 text-green-700', card: 'bg-blue-100 text-blue-700', transfer: 'bg-purple-100 text-purple-700' }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-4xl animate-bounce mb-3">📊</div>
        <p className="text-gray-500">جاري التحميل...</p>
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
          <p className="text-gray-500 text-sm">مبيعات الشهر الحالي</p>
        </div>
        <button onClick={load} className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-semibold">
          🔄 تحديث
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المبيعات', value: `${summary?.total_revenue?.toFixed(2)} ر.س`, icon: '💰', color: 'from-blue-500 to-blue-600' },
          { label: 'عدد الفواتير', value: summary?.total_sales, icon: '📄', color: 'from-green-500 to-green-600' },
          { label: 'متوسط الفاتورة', value: `${summary?.avg_sale?.toFixed(2)} ر.س`, icon: '📊', color: 'from-purple-500 to-purple-600' },
          { label: 'أكثر طريقة دفع', value: Object.entries(summary?.by_payment_method || {}).sort((a, b) => b[1] - a[1])[0]?.[0] ? paymentLabels[Object.entries(summary?.by_payment_method || {}).sort((a, b) => b[1] - a[1])[0]?.[0]] : '-', icon: '💳', color: 'from-orange-500 to-orange-600' },
        ].map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="text-3xl mb-2">{card.icon}</div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-white/80 text-sm mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Payment Breakdown */}
      {summary?.by_payment_method && Object.keys(summary.by_payment_method).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4">توزيع طرق الدفع</h2>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(summary.by_payment_method).map(([method, amount]) => (
              <div key={method} className={`flex items-center gap-2 px-4 py-2 rounded-full ${paymentColors[method] || 'bg-gray-100 text-gray-700'}`}>
                <span className="font-bold">{paymentLabels[method] || method}</span>
                <span>{amount.toFixed(2)} ر.س</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4">📈 المبيعات اليومية</h2>
          {daily.length === 0 ? (
            <div className="text-center py-12 text-gray-400">لا توجد بيانات هذا الشهر</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={daily}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={d => d.split('-')[2]} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} ر.س`, 'المبيعات']} labelFormatter={l => `يوم ${l.split('-')[2]}`} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4">🏆 أكثر المنتجات مبيعاً</h2>
          {topProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">لا توجد بيانات</div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xl">{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-gray-800">{p.name}</span>
                      <span className="text-gray-500">{p.qty} وحدة</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(p.revenue / topProducts[0].revenue) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-blue-600 w-20 text-left">{p.revenue.toFixed(0)} ر.س</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">🕐 آخر المبيعات</h2>
          <button onClick={() => navigate('/admin/sales')} className="text-blue-600 text-sm font-semibold hover:underline">عرض الكل</button>
        </div>
        {recentSales.length === 0 ? (
          <div className="text-center py-8 text-gray-400">لا توجد مبيعات بعد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b text-right">
                  <th className="pb-3 font-semibold">رقم الفاتورة</th>
                  <th className="pb-3 font-semibold">الكاشير</th>
                  <th className="pb-3 font-semibold">طريقة الدفع</th>
                  <th className="pb-3 font-semibold">الإجمالي</th>
                  <th className="pb-3 font-semibold">التاريخ</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentSales.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-3 font-mono font-bold text-blue-600">{s.invoice_number}</td>
                    <td className="py-3">{s.cashier?.name || '-'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${paymentColors[s.payment_method] || 'bg-gray-100'}`}>
                        {paymentLabels[s.payment_method] || s.payment_method}
                      </span>
                    </td>
                    <td className="py-3 font-bold">{s.total?.toFixed(2)} ر.س</td>
                    <td className="py-3 text-gray-500">{new Date(s.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="py-3">
                      <button onClick={() => navigate(`/admin/sales/${s.id}`)} className="text-blue-600 hover:underline text-xs">تفاصيل</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
