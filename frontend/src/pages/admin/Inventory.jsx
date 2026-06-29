import { useState, useEffect } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [inventory, setInventory] = useState([])
  const [editQty, setEditQty] = useState({})

  useEffect(() => { load() }, [])

  async function load() {
    const [prodsRes, invRes] = await Promise.all([
      api.get('/products/?active_only=true'),
      api.get('/reports/inventory'),
    ])
    setProducts(prodsRes.data.filter(p => p.quantity !== -1))
    setInventory(invRes.data)
  }

  async function updateQty(id, qty) {
    try {
      await api.patch(`/products/${id}/quantity?qty=${parseInt(qty)}`)
      toast.success('تم تحديث الكمية')
      load()
      setEditQty(e => { const n = { ...e }; delete n[id]; return n })
    } catch { toast.error('خطأ في التحديث') }
  }

  const allTracked = products
  const lowStock = allTracked.filter(p => p.quantity > 0 && p.quantity < 5)
  const outOfStock = allTracked.filter(p => p.quantity === 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📦 إدارة المخزون</h1>
        <p className="text-gray-500 text-sm">المنتجات التي لها كمية محددة</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-1">❌</div>
          <div className="font-bold text-red-700 text-2xl">{outOfStock.length}</div>
          <div className="text-red-500 text-sm">نفد المخزون</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-1">⚠️</div>
          <div className="font-bold text-yellow-700 text-2xl">{lowStock.length}</div>
          <div className="text-yellow-500 text-sm">مخزون منخفض</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-1">✅</div>
          <div className="font-bold text-green-700 text-2xl">{allTracked.length - outOfStock.length - lowStock.length}</div>
          <div className="text-green-500 text-sm">متوفر</div>
        </div>
      </div>

      {/* Alerts */}
      {outOfStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <h3 className="font-bold text-red-800 mb-2">🚨 منتجات نفد مخزونها:</h3>
          <div className="flex flex-wrap gap-2">
            {outOfStock.map(p => (
              <span key={p.id} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">{p.name}</span>
            ))}
          </div>
        </div>
      )}
      {lowStock.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <h3 className="font-bold text-yellow-800 mb-2">⚠️ مخزون منخفض (أقل من 5):</h3>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(p => (
              <span key={p.id} className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">{p.name} ({p.quantity})</span>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-bold text-gray-800">جدول المخزون</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-gray-600">
              <tr>
                <th className="px-4 py-3 text-right font-semibold">المنتج</th>
                <th className="px-4 py-3 text-right font-semibold">التصنيف</th>
                <th className="px-4 py-3 text-center font-semibold">الكمية الحالية</th>
                <th className="px-4 py-3 text-right font-semibold">الحالة</th>
                <th className="px-4 py-3 text-center font-semibold">تحديث الكمية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allTracked.map(p => {
                const status = p.quantity === 0 ? { label: 'نفد', color: 'bg-red-100 text-red-700' }
                  : p.quantity < 5 ? { label: `منخفض (${p.quantity})`, color: 'bg-yellow-100 text-yellow-700' }
                  : { label: 'متوفر', color: 'bg-green-100 text-green-700' }
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.category?.name || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${status.color}`}>{p.quantity}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-center">
                        <input
                          type="number" min="0"
                          value={editQty[p.id] !== undefined ? editQty[p.id] : p.quantity}
                          onChange={e => setEditQty(q => ({ ...q, [p.id]: e.target.value }))}
                          className="w-20 border border-gray-300 rounded-xl px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <button onClick={() => updateQty(p.id, editQty[p.id] !== undefined ? editQty[p.id] : p.quantity)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition">
                          حفظ
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {allTracked.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>📦 لا توجد منتجات بكمية محددة</p>
              <p className="text-sm mt-1">اضبط الكمية من صفحة المنتجات لإضافة منتجات هنا</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
