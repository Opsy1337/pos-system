import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import Receipt from '../../components/Receipt'

const paymentLabels = { cash: '💵 نقدي', card: '💳 شبكة', transfer: '📱 تحويل' }

export default function SaleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sale, setSale] = useState(null)
  const [settings, setSettings] = useState({})
  const [showReceipt, setShowReceipt] = useState(false)

  useEffect(() => {
    Promise.all([api.get(`/sales/${id}`), api.get('/reports/store-settings')]).then(([sRes, stRes]) => {
      setSale(sRes.data)
      setSettings(stRes.data)
    })
  }, [id])

  if (!sale) return <div className="flex items-center justify-center h-64 text-gray-400">⏳ جاري التحميل...</div>

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">← رجوع</button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">تفاصيل الفاتورة</h1>
          <p className="text-gray-500 font-mono">{sale.invoice_number}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowReceipt(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition">👁️ عرض الإيصال</button>
          <button onClick={() => { setShowReceipt(true); setTimeout(() => window.print(), 300) }} className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-xl font-semibold text-sm transition">🖨️ طباعة</button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'الكاشير', value: sale.cashier?.name || '-', icon: '👤' },
          { label: 'طريقة الدفع', value: paymentLabels[sale.payment_method], icon: '💳' },
          { label: 'التاريخ', value: new Date(sale.created_at).toLocaleDateString('ar-SA'), icon: '📅' },
          { label: 'الوقت', value: new Date(sale.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }), icon: '🕐' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="font-bold text-gray-800">{item.value}</div>
            <div className="text-gray-500 text-xs mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-bold text-gray-800">🛒 الأصناف</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b text-gray-600">
            <tr>
              <th className="px-4 py-3 text-right">المنتج</th>
              <th className="px-4 py-3 text-center">الكمية</th>
              <th className="px-4 py-3 text-center">سعر الوحدة</th>
              <th className="px-4 py-3 text-left">الإجمالي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sale.items?.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold">{item.product_name}</td>
                <td className="px-4 py-3 text-center">{item.quantity}</td>
                <td className="px-4 py-3 text-center">{item.unit_price.toFixed(2)} ر.س</td>
                <td className="px-4 py-3 text-left font-bold">{item.total_price.toFixed(2)} ر.س</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="max-w-xs mr-auto space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>{sale.subtotal?.toFixed(2)} ر.س</span>
            <span>المجموع الفرعي</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>− {(sale.discount_type === 'percent' ? sale.subtotal * sale.discount / 100 : sale.discount).toFixed(2)} ر.س</span>
              <span>الخصم {sale.discount_type === 'percent' ? `(${sale.discount}%)` : ''}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>{sale.tax_amount?.toFixed(2)} ر.س</span>
            <span>ضريبة ({sale.tax_rate}%)</span>
          </div>
          <div className="flex justify-between font-bold text-xl text-gray-900 border-t pt-3">
            <span>{sale.total?.toFixed(2)} ر.س</span>
            <span>الإجمالي</span>
          </div>
        </div>
      </div>

      {sale.notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p className="text-yellow-800 text-sm"><strong>ملاحظات:</strong> {sale.notes}</p>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b no-print">
              <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">🖨️ طباعة</button>
              <h3 className="font-bold">الإيصال</h3>
              <button onClick={() => setShowReceipt(false)} className="text-gray-500 text-xl">✕</button>
            </div>
            <div className="overflow-y-auto max-h-[70vh]">
              <Receipt sale={{ ...sale, settings }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
