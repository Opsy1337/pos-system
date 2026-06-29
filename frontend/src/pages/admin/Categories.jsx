import { useState, useEffect } from 'react'
import api from '../../api/client'
import Modal from '../../components/Modal'
import toast from 'react-hot-toast'

const COLORS = ['#EF4444','#F97316','#F59E0B','#10B981','#3B82F6','#6366F1','#8B5CF6','#EC4899','#6B7280','#14B8A6']
const ICONS = ['☕','🧊','🍽️','🥪','🍰','➕','🛍️','🍕','🍔','🥤','🍦','🥗','🍜','🥐','🍩']
const emptyForm = { name: '', color: '#3B82F6', icon: '🏷️', is_active: true }

export default function Categories() {
  const [cats, setCats] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [])
  async function load() {
    const res = await api.get('/categories/all')
    setCats(res.data)
  }

  function openCreate() { setForm(emptyForm); setEditing(null); setShowModal(true) }
  function openEdit(c) { setForm({ name: c.name, color: c.color, icon: c.icon, is_active: c.is_active }); setEditing(c.id); setShowModal(true) }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (editing) await api.put(`/categories/${editing}`, form)
      else await api.post('/categories/', form)
      toast.success(editing ? 'تم التعديل' : 'تمت الإضافة')
      setShowModal(false)
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'خطأ') }
    finally { setLoading(false) }
  }

  async function handleDelete(id) {
    if (!confirm('هل تريد حذف هذا التصنيف؟')) return
    try { await api.delete(`/categories/${id}`); toast.success('تم الحذف'); load() }
    catch (err) { toast.error(err.response?.data?.detail || 'خطأ في الحذف') }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📂 إدارة التصنيفات</h1>
          <p className="text-gray-500 text-sm">{cats.length} تصنيف</p>
        </div>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2">
          ➕ إضافة تصنيف
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cats.map(c => (
          <div key={c.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <div className="h-3" style={{ backgroundColor: c.color }} />
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{c.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{c.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {c.is_active ? 'نشط' : 'معطل'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(c)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-xl text-sm font-semibold transition">✏️ تعديل</button>
                <button onClick={() => handleDelete(c.id)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl text-sm font-semibold transition">🗑️ حذف</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'تعديل التصنيف' : 'إضافة تصنيف'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">اسم التصنيف *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="مثال: مشروبات" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">الأيقونة</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(icon => (
                <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))}
                  className={`text-2xl p-2 rounded-xl transition ${form.icon === icon ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'}`}>
                  {icon}
                </button>
              ))}
              <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                className="w-16 border border-gray-300 rounded-xl px-2 py-1 text-center text-2xl focus:outline-none"
                placeholder="🏷️" maxLength={2} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">اللون</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COLORS.map(color => (
                <button key={color} type="button" onClick={() => setForm(f => ({ ...f, color }))}
                  className={`w-8 h-8 rounded-full transition ${form.color === color ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
            <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              className="w-full h-10 rounded-xl cursor-pointer border border-gray-300" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">الحالة</label>
            <select value={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="true">✅ نشط</option>
              <option value="false">❌ معطل</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl">
              {loading ? '⏳...' : editing ? '💾 حفظ' : '➕ إضافة'}
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl">إلغاء</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
