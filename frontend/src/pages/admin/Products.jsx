import { useState, useEffect, useRef } from 'react'
import api from '../../api/client'
import Modal from '../../components/Modal'
import toast from 'react-hot-toast'

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='60'%3E🛍️%3C/text%3E%3C/svg%3E"

const emptyForm = { name: '', price: '', category_id: '', image_url: '', quantity: -1, is_active: true }

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  useEffect(() => { load() }, [])

  async function load() {
    const [pRes, cRes] = await Promise.all([
      api.get('/products/?active_only=false'),
      api.get('/categories/all'),
    ])
    setProducts(pRes.data)
    setCategories(cRes.data)
  }

  const filtered = products.filter(p => {
    const ms = !search || p.name.includes(search)
    const mc = !catFilter || p.category_id === parseInt(catFilter)
    return ms && mc
  })

  function openCreate() { setForm(emptyForm); setEditing(null); setShowModal(true) }
  function openEdit(p) {
    setForm({ name: p.name, price: p.price, category_id: p.category_id, image_url: p.image_url || '', quantity: p.quantity, is_active: p.is_active })
    setEditing(p.id)
    setShowModal(true)
  }

  function handleImageFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, image_url: ev.target.result }))
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.price || !form.category_id) { toast.error('يرجى تعبئة الحقول المطلوبة'); return }
    setLoading(true)
    try {
      const payload = { ...form, price: parseFloat(form.price), category_id: parseInt(form.category_id), quantity: parseInt(form.quantity) }
      if (editing) await api.put(`/products/${editing}`, payload)
      else await api.post('/products/', payload)
      toast.success(editing ? 'تم التعديل' : 'تمت الإضافة')
      setShowModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطأ في الحفظ')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('هل تريد حذف هذا المنتج؟')) return
    try {
      await api.delete(`/products/${id}`)
      toast.success('تم الحذف')
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'خطأ') }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🏷️ إدارة المنتجات</h1>
          <p className="text-gray-500 text-sm">{products.length} منتج</p>
        </div>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition">
          ➕ إضافة منتج
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 بحث بالاسم..."
          className="border border-gray-200 rounded-xl px-4 py-2 flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">كل التصنيفات</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="px-4 py-4 text-right font-semibold">المنتج</th>
                <th className="px-4 py-4 text-right font-semibold">التصنيف</th>
                <th className="px-4 py-4 text-right font-semibold">السعر</th>
                <th className="px-4 py-4 text-right font-semibold">الكمية</th>
                <th className="px-4 py-4 text-right font-semibold">الحالة</th>
                <th className="px-4 py-4 text-right font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image_url || PLACEHOLDER} alt={p.name} className="w-12 h-12 object-cover rounded-xl flex-shrink-0" onError={e => e.target.src = PLACEHOLDER} />
                      <span className="font-semibold text-gray-800">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: p.category?.color || '#6B7280' }}>
                      {p.category?.icon} {p.category?.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-blue-600">{p.price.toFixed(2)} ر.س</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.quantity === -1 ? 'bg-green-100 text-green-700' : p.quantity === 0 ? 'bg-red-100 text-red-700' : p.quantity < 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {p.quantity === -1 ? '∞ غير محدود' : p.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.is_active ? '✅ نشط' : '❌ معطل'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition">✏️ تعديل</button>
                      <button onClick={() => handleDelete(p.id)} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition">🗑️ حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-gray-400">لا توجد منتجات</div>}
        </div>
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? '✏️ تعديل المنتج' : '➕ إضافة منتج'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">اسم المنتج *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="مثال: قهوة عربية" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">السعر (ر.س) *</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="0.00" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">التصنيف *</label>
              <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400" required>
                <option value="">اختر تصنيفاً</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">الكمية (-1 = غير محدود)</label>
              <input type="number" min="-1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">الحالة</label>
              <select value={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="true">✅ نشط</option>
                <option value="false">❌ معطل</option>
              </select>
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">صورة المنتج</label>
            <div className="flex gap-3 items-start">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-dashed border-gray-300">
                <img src={form.image_url || PLACEHOLDER} alt="preview" className="w-full h-full object-cover" onError={e => e.target.src = PLACEHOLDER} />
              </div>
              <div className="flex-1 space-y-2">
                <input value={typeof form.image_url === 'string' && !form.image_url.startsWith('data:') ? form.image_url : ''}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="https://... رابط الصورة" />
                <div className="text-center text-xs text-gray-400">أو</div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                <button type="button" onClick={() => fileRef.current.click()}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl py-2 text-sm text-gray-500 hover:text-blue-600 transition">
                  📁 رفع صورة من الجهاز
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition">
              {loading ? '⏳ جاري الحفظ...' : editing ? '💾 حفظ التعديلات' : '➕ إضافة المنتج'}
            </button>
            <button type="button" onClick={() => setShowModal(false)}
              className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
