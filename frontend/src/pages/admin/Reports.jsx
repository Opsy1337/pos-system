import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'
import api from '../../api/client'

const COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316']

export default function Reports() {
  const [monthly, setMonthly] = useState([])
  const [daily, setDaily] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [summary, setSummary] = useState(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  useEffect(() => { loadMonthly() }, [year])
  useEffect(() => { loadDaily() }, [year, month])
  useEffect(() => { loadSummary() }, [dateRange])
  useEffect(() => { loadTopProducts() }, [dateRange])

  async function loadMonthly() {
    const res = await api.get(`/reports/monthly?year=${year}`)
    setMonthly(res.data)
  }
  async function loadDaily() {
    const res = await api.get(`/reports/daily?year=${year}&month=${month}`)
    setDaily(res.data)
  }
  async function loadSummary() {
    const params = new URLSearchParams()
    if (dateRange.start) params.append('start_date', dateRange.start)
    if (dateRange.end) params.append('end_date', dateRange.end)
    const res = await api.get(`/reports/summary?${params}`)
    setSummary(res.data)
  }
  async function loadTopProducts() {
    const params = new URLSearchParams({ limit: 10 })
    if (dateRange.start) params.append('start_date', dateRange.start)
    if (dateRange.end) params.append('end_date', dateRange.end)
    const res = await api.get(`/reports/top-products?${params}`)
    setTopProducts(res.data)
  }

  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  const paymentLabels = { cash: 'نقدي', card: 'شبكة', transfer: 'تحويل' }
  const pieData = Object.entries(summary?.by_payment_method || {}).map(([k, v]) => ({ name: paymentLabels[k] || k, value: Math.round(v) }))

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">📈 التقارير والإحصائيات</h1>

      {/* Date Range Filter */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">من تاريخ</label>
          <input type="date" value={dateRange.start} onChange={e => setDateRange(d => ({ ...d, start: e.target.value }))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">إلى تاريخ</label>
          <input type="date" value={dateRange.end} onChange={e => setDateRange(d => ({ ...d, end: e.target.value }))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <button onClick={() => setDateRange({ start: '', end: '' })} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">↺ الكل</button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الإيرادات', value: `${summary.total_revenue?.toFixed(2)} ر.س`, icon: '💰', color: 'bg-blue-50 border-blue-100 text-blue-700' },
            { label: 'عدد الفواتير', value: summary.total_sales, icon: '📄', color: 'bg-green-50 border-green-100 text-green-700' },
            { label: 'متوسط الفاتورة', value: `${summary.avg_sale?.toFixed(2)} ر.س`, icon: '📊', color: 'bg-purple-50 border-purple-100 text-purple-700' },
            { label: 'إيرادات الشبكة', value: `${(summary.by_payment_method?.card || 0).toFixed(2)} ر.س`, icon: '💳', color: 'bg-orange-50 border-orange-100 text-orange-700' },
          ].map((c, i) => (
            <div key={i} className={`${c.color} border rounded-2xl p-4`}>
              <div className="text-3xl mb-2">{c.icon}</div>
              <div className="font-bold text-xl">{c.value}</div>
              <div className="text-sm opacity-80 mt-1">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">📊 المبيعات السنوية</h2>
            <select value={year} onChange={e => setYear(parseInt(e.target.value))}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {monthly.length === 0 ? (
            <div className="text-center py-12 text-gray-400">لا توجد بيانات</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthly}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [`${v} ر.س`, 'المبيعات']} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4">💳 توزيع طرق الدفع</h2>
          {pieData.length === 0 ? (
            <div className="text-center py-12 text-gray-400">لا توجد بيانات</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => [`${v} ر.س`, '']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Daily Chart */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-bold text-gray-800">📅 المبيعات اليومية</h2>
          <div className="flex gap-2">
            <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none">
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(parseInt(e.target.value))}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        {daily.length === 0 ? (
          <div className="text-center py-12 text-gray-400">لا توجد بيانات لهذا الشهر</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={daily}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={d => d.split('-')[2]} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`${v} ر.س`, 'المبيعات']} labelFormatter={l => `يوم ${l.split('-')[2]}`} />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-4">🏆 أكثر المنتجات مبيعاً</h2>
        {topProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">لا توجد بيانات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-right">#</th>
                  <th className="px-4 py-3 text-right">المنتج</th>
                  <th className="px-4 py-3 text-center">الكمية المباعة</th>
                  <th className="px-4 py-3 text-left">الإيرادات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topProducts.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xl">{['🥇','🥈','🥉','4','5','6','7','8','9','10'][i]}</td>
                    <td className="px-4 py-3 font-semibold">{p.name}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="h-2 bg-blue-100 rounded-full w-20 overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(p.qty / topProducts[0].qty) * 100}%` }} />
                        </div>
                        <span>{p.qty}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-left font-bold text-blue-600">{p.revenue.toFixed(2)} ر.س</td>
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
