import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import toast from 'react-hot-toast'

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='60'%3E%F0%9F%9B%8D%EF%B8%8F%3C/text%3E%3C/svg%3E"
const paymentLabels = { cash: '💵 نقدي', card: '💳 شبكة', transfer: '📱 تحويل' }

const CAT_COLORS = ['#6B7280','#3B82F6','#EF4444','#F59E0B','#10B981','#8B5CF6','#EC4899','#14B8A6']
const CAT_ICONS  = ['🏷️','🥤','🍽️','🍰','🛍️','☕','🧁','🍕','🥗','🍦','🛒','➕']

export default function Admin() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('products')

  // Products
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [pForm, setPForm] = useState({ name: '', price: '', category_id: '', image_url: '', quantity: -1 })
  const fileRef = useRef()

  // Categories
  const [showAddCat, setShowAddCat] = useState(false)
  const [cForm, setCForm] = useState({ name: '', color: '#3B82F6', icon: '🏷️' })

  // Sales
  const [sales, setSales] = useState([])
  const [selectedSale, setSelectedSale] = useState(null)
  const [settings, setSettings] = useState({ currency: 'ر.س', store_name: 'متجري', receipt_footer: 'شكراً لزيارتكم' })

  useEffect(() => { loadAll() }, [])
  useEffect(() => { if (tab === 'sales') loadSales() }, [tab])

  async function loadAll() {
    const [p, c, s] = await Promise.all([
      api.get('/products/?active_only=false'),
      api.get('/categories/all'),
      api.get('/reports/store-settings'),
    ])
    setProducts(p.data)
    setCategories(c.data)
    setSettings(s.data)
  }

  async function loadSales() {
    const { data } = await api.get('/sales/?limit=100')
    setSales(data.sales || [])
  }

  // --- Products ---
  async function addProduct(e) {
    e.preventDefault()
    try {
      await api.post('/products/', {
        ...pForm,
        price: parseFloat(pForm.price),
        category_id: parseInt(pForm.category_id),
        quantity: parseInt(pForm.quantity),
        is_active: true,
      })
      toast.success('تمت الإضافة ✅')
      setShowAddProduct(false)
      setPForm({ name: '', price: '', category_id: '', image_url: '', quantity: -1 })
      loadAll()
    } catch (err) { toast.error(err.response?.data?.detail || 'خطأ') }
  }

  async function deleteProduct(id, name) {
    if (!confirm(`حذف "${name}"؟`)) return
    await api.delete(`/products/${id}`)
    toast.success('تم الحذف')
    loadAll()
  }

  function handleImageFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPForm(f => ({ ...f, image_url: ev.target.result }))
    reader.readAsDataURL(file)
  }

  // --- Categories ---
  async function addCategory(e) {
    e.preventDefault()
    try {
      await api.post('/categories/', { ...cForm, is_active: true })
      toast.success('تمت الإضافة ✅')
      setShowAddCat(false)
      setCForm({ name: '', color: '#3B82F6', icon: '🏷️' })
      loadAll()
    } catch (err) { toast.error(err.response?.data?.detail || 'خطأ') }
  }

  async function deleteCat(id, name) {
    if (!confirm(`حذف تصنيف "${name}"؟`)) return
    try { await api.delete(`/categories/${id}`); toast.success('تم الحذف'); loadAll() }
    catch (err) { toast.error(err.response?.data?.detail || 'لا يمكن الحذف') }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* Header */}
      <div className="bg-gray-900 text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex gap-2">
          <button onClick={() => navigate('/cashier')}
            className="bg-white/10 text-white px-5 py-3 rounded-2xl font-bold text-lg">
            🛒 الكاشير
          </button>
          <button onClick={logout}
            className="bg-white/10 text-white px-5 py-3 rounded-2xl font-bold text-lg">
            خروج
          </button>
        </div>
        <h1 className="font-bold text-xl">⚙️ الإدارة</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b flex-shrink-0">
        {[
          { k: 'products', l: '🏷️ المنتجات' },
          { k: 'categories', l: '📂 التصنيفات' },
          { k: 'sales', l: '📄 الفواتير' },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`flex-1 py-4 font-bold text-lg transition ${tab === t.k ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── PRODUCTS ── */}
        {tab === 'products' && (
          <div className="p-4 space-y-3">
            <button onClick={() => setShowAddProduct(true)}
              className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl text-xl">
              ➕ إضافة منتج
            </button>
            {products.length === 0 && (
              <div className="text-center py-16 text-gray-300">
                <p className="text-5xl mb-3">🏷️</p>
                <p className="text-xl">لا توجد منتجات بعد</p>
              </div>
            )}
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-2xl shadow-sm flex items-center gap-3 p-4">
                <img src={p.image_url || PLACEHOLDER} alt={p.name}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  onError={e => e.target.src = PLACEHOLDER} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-lg truncate">{p.name}</p>
                  <p className="text-blue-600 font-bold">{p.price} {settings.currency}</p>
                  <p className="text-gray-400 text-sm">{p.category?.icon} {p.category?.name}</p>
                </div>
                <button onClick={() => deleteProduct(p.id, p.name)}
                  className="bg-red-50 text-red-500 w-14 h-14 rounded-2xl text-2xl flex items-center justify-center flex-shrink-0">
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── CATEGORIES ── */}
        {tab === 'categories' && (
          <div className="p-4 space-y-3">
            <button onClick={() => setShowAddCat(true)}
              className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl text-xl">
              ➕ إضافة تصنيف
            </button>
            {categories.map(c => (
              <div key={c.id} className="bg-white rounded-2xl shadow-sm flex items-center gap-4 p-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ backgroundColor: c.color + '22' }}>
                  {c.icon}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-lg">{c.name}</p>
                  <div className="w-6 h-3 rounded-full mt-1" style={{ backgroundColor: c.color }} />
                </div>
                <button onClick={() => deleteCat(c.id, c.name)}
                  className="bg-red-50 text-red-500 w-14 h-14 rounded-2xl text-2xl flex items-center justify-center flex-shrink-0">
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── SALES ── */}
        {tab === 'sales' && (
          <div className="p-4 space-y-3">
            {sales.length === 0 ? (
              <div className="text-center py-16 text-gray-300">
                <p className="text-5xl mb-3">📄</p>
                <p className="text-xl">لا توجد فواتير بعد</p>
              </div>
            ) : (
              sales.map(s => (
                <button key={s.id} onClick={() => setSelectedSale(s)}
                  className="w-full bg-white rounded-2xl shadow-sm p-4 text-right flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-lg">{s.invoice_number}</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(s.created_at).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <p className="font-bold text-blue-600 text-xl">{s.total?.toFixed(2)} {settings.currency}</p>
                    <p className="text-gray-400 text-sm">{paymentLabels[s.payment_method]}</p>
                  </div>
                  <span className="text-gray-300 text-2xl">←</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── ADD PRODUCT MODAL ── */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-3">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
              <button onClick={() => setShowAddProduct(false)} className="text-3xl text-gray-300">✕</button>
              <h3 className="font-bold text-2xl">إضافة منتج</h3>
            </div>
            <form onSubmit={addProduct} className="p-5 space-y-4 overflow-y-auto">
              <input value={pForm.name} onChange={e => setPForm(f => ({ ...f, name: e.target.value }))}
                placeholder="اسم المنتج *"
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-4 text-xl text-right focus:outline-none focus:border-blue-500"
                required />

              <input type="number" min="0" step="0.01" value={pForm.price}
                onChange={e => setPForm(f => ({ ...f, price: e.target.value }))}
                placeholder="السعر *"
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-4 text-xl text-right focus:outline-none focus:border-blue-500"
                required />

              <select value={pForm.category_id} onChange={e => setPForm(f => ({ ...f, category_id: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-4 text-xl focus:outline-none focus:border-blue-500"
                required>
                <option value="">التصنيف *</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm text-gray-500 block mb-1">الكمية (فارغ = غير محدود)</label>
                  <input type="number" min="0" value={pForm.quantity === -1 ? '' : pForm.quantity}
                    onChange={e => setPForm(f => ({ ...f, quantity: e.target.value === '' ? -1 : parseInt(e.target.value) }))}
                    placeholder="غير محدود"
                    className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-xl text-right focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="text-sm text-gray-500 block mb-2">صورة المنتج (اختياري)</label>
                <div className="flex gap-3 items-center">
                  <img src={pForm.image_url || PLACEHOLDER} alt="" className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" onError={e => e.target.src = PLACEHOLDER} />
                  <div className="flex-1 space-y-2">
                    <input value={pForm.image_url && !pForm.image_url.startsWith('data:') ? pForm.image_url : ''}
                      onChange={e => setPForm(f => ({ ...f, image_url: e.target.value }))}
                      placeholder="رابط الصورة https://..."
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-right focus:outline-none" />
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                    <button type="button" onClick={() => fileRef.current.click()}
                      className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-gray-400 text-sm">
                      📁 اختر من الجهاز
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit"
                className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl text-xl">
                ✅ إضافة
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD CATEGORY MODAL ── */}
      {showAddCat && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-3">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <button onClick={() => setShowAddCat(false)} className="text-3xl text-gray-300">✕</button>
              <h3 className="font-bold text-2xl">إضافة تصنيف</h3>
            </div>
            <form onSubmit={addCategory} className="p-5 space-y-4">
              <input value={cForm.name} onChange={e => setCForm(f => ({ ...f, name: e.target.value }))}
                placeholder="اسم التصنيف *"
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-4 text-xl text-right focus:outline-none focus:border-blue-500"
                required />

              <div>
                <label className="text-sm text-gray-500 block mb-2">أيقونة</label>
                <div className="flex flex-wrap gap-2">
                  {CAT_ICONS.map(icon => (
                    <button key={icon} type="button" onClick={() => setCForm(f => ({ ...f, icon }))}
                      className={`text-2xl p-2 rounded-xl ${cForm.icon === icon ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-gray-50'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500 block mb-2">اللون</label>
                <div className="flex flex-wrap gap-2">
                  {CAT_COLORS.map(color => (
                    <button key={color} type="button" onClick={() => setCForm(f => ({ ...f, color }))}
                      className={`w-10 h-10 rounded-full transition ${cForm.color === color ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>

              <button type="submit"
                className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl text-xl">
                ✅ إضافة
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── INVOICE DETAIL MODAL ── */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold">🖨️</button>
              <h3 className="font-bold text-xl">{selectedSale.invoice_number}</h3>
              <button onClick={() => setSelectedSale(null)} className="text-3xl text-gray-300">✕</button>
            </div>
            <div className="overflow-y-auto max-h-[70vh]">
              <SaleDetail id={selectedSale.id} settings={settings} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SaleDetail({ id, settings }) {
  const [sale, setSale] = useState(null)
  useEffect(() => { api.get(`/sales/${id}`).then(r => setSale(r.data)) }, [id])
  if (!sale) return <div className="text-center py-8 text-gray-400">⏳</div>
  const payLbl = { cash: 'نقدي', card: 'شبكة', transfer: 'تحويل' }
  return (
    <div className="p-5 font-mono text-sm">
      <div className="text-center mb-4">
        <p className="font-bold text-lg">{settings.store_name}</p>
        <p className="text-gray-400 text-xs">{new Date(sale.created_at).toLocaleString('ar-SA')}</p>
        <p className="text-gray-500 text-xs">{payLbl[sale.payment_method]} • {sale.cashier?.name}</p>
      </div>
      <div className="border-t border-dashed pt-3 mb-3 space-y-2">
        {sale.items?.map((item, i) => (
          <div key={i} className="flex justify-between">
            <span>{item.total_price.toFixed(2)}</span>
            <span>{item.product_name} ×{item.quantity}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-dashed pt-3 space-y-1">
        <div className="flex justify-between text-gray-500"><span>المجموع</span><span>{sale.subtotal?.toFixed(2)}</span></div>
        {sale.discount > 0 && <div className="flex justify-between text-green-600"><span>خصم</span><span>−{sale.discount?.toFixed(2)}</span></div>}
        <div className="flex justify-between text-gray-500"><span>ضريبة {sale.tax_rate}%</span><span>{sale.tax_amount?.toFixed(2)}</span></div>
        <div className="flex justify-between font-bold text-xl border-t pt-2 mt-1">
          <span>{sale.total?.toFixed(2)} {settings.currency}</span>
          <span>الإجمالي</span>
        </div>
      </div>
      <p className="text-center text-gray-400 mt-4 text-xs">{settings.receipt_footer}</p>
    </div>
  )
}
