import { useState, useEffect } from 'react'
import api from '../../api/client'
import Modal from '../../components/Modal'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const emptyForm = { username: '', name: '', password: '', role: 'cashier', is_active: true }

export default function Users() {
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)
  const { user: currentUser } = useAuth()

  useEffect(() => { load() }, [])
  async function load() { const res = await api.get('/users/'); setUsers(res.data) }

  function openCreate() { setForm(emptyForm); setEditing(null); setShowModal(true) }
  function openEdit(u) { setForm({ username: u.username, name: u.name, password: '', role: u.role, is_active: u.is_active }); setEditing(u.id); setShowModal(true) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!editing && !form.password) { toast.error('كلمة المرور مطلوبة'); return }
    setLoading(true)
    try {
      if (editing) await api.put(`/users/${editing}`, form)
      else await api.post('/users/', form)
      toast.success(editing ? 'تم التعديل' : 'تم إضافة المستخدم')
      setShowModal(false)
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'خطأ') }
    finally { setLoading(false) }
  }

  async function handleDelete(id) {
    if (id === currentUser.id) { toast.error('لا يمكنك حذف حسابك'); return }
    if (!confirm('هل تريد حذف هذا المستخدم؟')) return
    try { await api.delete(`/users/${id}`); toast.success('تم الحذف'); load() }
    catch (err) { toast.error(err.response?.data?.detail || 'خطأ') }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">👥 إدارة المستخدمين</h1>
          <p className="text-gray-500 text-sm">{users.length} مستخدم</p>
        </div>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2">
          ➕ إضافة مستخدم
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => (
          <div key={u.id} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold ${u.role === 'admin' ? 'bg-purple-600' : 'bg-blue-500'}`}>
                {u.name[0]}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">{u.name}</p>
                <p className="text-gray-500 text-sm font-mono">@{u.username}</p>
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {u.role === 'admin' ? '👑 مدير' : '💼 كاشير'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {u.is_active ? 'نشط' : 'معطل'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-4">أُضيف: {new Date(u.created_at).toLocaleDateString('ar-SA')}</p>
            <div className="flex gap-2">
              <button onClick={() => openEdit(u)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-xl text-sm font-semibold transition">✏️ تعديل</button>
              {u.id !== currentUser.id && (
                <button onClick={() => handleDelete(u.id)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl text-sm font-semibold transition">🗑️ حذف</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'تعديل المستخدم' : 'إضافة مستخدم'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">الاسم الكامل *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="مثال: أحمد محمد" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">اسم المستخدم *</label>
            <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="مثال: ahmed" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">كلمة المرور {editing && '(اتركها فارغة للإبقاء على القديمة)'}</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">الصلاحية</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="cashier">💼 كاشير</option>
                <option value="admin">👑 مدير</option>
              </select>
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
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl">
              {loading ? '⏳...' : editing ? '💾 حفظ' : '➕ إضافة'}
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="px-6 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200">إلغاء</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
