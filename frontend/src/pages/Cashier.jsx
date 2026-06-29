import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import toast from 'react-hot-toast'

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='60'%3E🛍️%3C/text%3E%3C/svg%3E"

export default function Cashier() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [selectedCat, setSelectedCat] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState(null)
  const [payMethod, setPayMethod] = useState('cash')
  const [cashAmount, setCashAmount] = useState('')
  const [discount, setDiscount] = useState(0)
  const [settings, setSettings] = useState({ currency: 'ر.س', tax_rate: 0, store_name: 'متجري', receipt_footer: 'شكراً لزيارتكم' })

  useEffect(() => { load() }, [])

  async function load() {
    const [c, p, s] = await Promise.all([
      api.get('/categories/'),
      api.get('/products/'),
      api.get('/reports/store-settings'),
    ])
    setCategories(c.data)
    setProducts(p.data)
    setSettings(s.data)
  }

  const filtered = selectedCat
    ? products.filter(p => p.category_id === selectedCat)
    : products

  function addToCart(product) {
    if (product.quantity === 0) { toast.error('نفد المخزون'); return }
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id)
      if (ex) {
        const max = product.quantity === -1 ? 9999 : product.quantity
        if (ex.qty >= max) { toast.error('وصلت للحد الأقصى'); return prev }
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  function changeQty(id, delta) {
    setCart(prev => prev
      .map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0)
    )
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const discountAmt = Math.min(discount, subtotal)
  const total = subtotal - discountAmt
  const change = parseFloat(cashAmount || 0) - total

  async function completeSale() {
    if (!cart.length) return
    try {
      const { data } = await api.post('/sales/', {
        items: cart.map(i => ({ product_id: i.id, quantity: i.qty, unit_price: i.price })),
        discount,
        discount_type: 'amount',
        tax_rate: 0,
        payment_method: payMethod,
      })
      setLastSale({ ...data, settings })
      setCart([])
      setDiscount(0)
      setCashAmount('')
      setShowPayment(false)
      setShowReceipt(true)
      toast.success('تم البيع ✅')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطأ في البيع')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* Header */}
      <div className="bg-blue-600 text-white px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={() => navigate('/admin')}
              className="bg-white/20 text-white px-4 py-2 rounded-xl text-lg font-bold">
              ⚙️
            </button>
          )}
          <button onClick={logout}
            className="bg-white/20 text-white px-4 py-2 rounded-xl text-lg font-bold">
            خروج
          </button>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">{settings.store_name}</p>
          <p className="text-blue-200 text-sm">{user?.name}</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Products Side */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Category Tabs */}
          <div className="flex gap-2 p-3 overflow-x-auto flex-shrink-0 bg-white border-b">
            <button
              onClick={() => setSelectedCat(null)}
              className={`flex-shrink-0 px-5 py-3 rounded-2xl text-lg font-bold transition ${!selectedCat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              الكل
            </button>
            {categories.map(c => (
              <button key={c.id}
                onClick={() => setSelectedCat(selectedCat === c.id ? null : c.id)}
                className={`flex-shrink-0 px-5 py-3 rounded-2xl text-lg font-bold transition whitespace-nowrap ${selectedCat === c.id ? 'text-white' : 'bg-gray-100 text-gray-700'}`}
                style={selectedCat === c.id ? { backgroundColor: c.color } : {}}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-3 gap-3">
              {filtered.map(p => {
                const inCart = cart.find(i => i.id === p.id)
                const soldOut = p.quantity === 0
                return (
                  <button key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={soldOut}
                    className={`bg-white rounded-2xl shadow-sm overflow-hidden text-right border-2 transition active:scale-95 ${soldOut ? 'opacity-40 cursor-not-allowed border-gray-200' : inCart ? 'border-blue-500' : 'border-transparent'}`}
                  >
                    {inCart && (
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center">
                        {inCart.qty}
                      </div>
                    )}
                    <div className="relative">
                      <img
                        src={p.image_url || PLACEHOLDER}
                        alt={p.name}
                        className="w-full aspect-square object-cover"
                        onError={e => { e.target.src = PLACEHOLDER }}
                      />
                      {inCart && (
                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center">
                          {inCart.qty}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-gray-800 text-base leading-tight">{p.name}</p>
                      <p className="text-blue-600 font-bold text-lg mt-1">{p.price} {settings.currency}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Cart Side */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b flex items-center justify-between">
            <button onClick={() => setCart([])} className="text-red-500 text-2xl">🗑️</button>
            <h2 className="font-bold text-xl text-gray-800">السلة</h2>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center py-16 text-gray-300">
                <p className="text-5xl mb-3">🛒</p>
                <p className="text-lg">السلة فارغة</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="bg-gray-50 rounded-2xl p-3">
                  <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-blue-600 font-bold">{(item.price * item.qty).toFixed(2)}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => changeQty(item.id, -1)}
                        className="w-9 h-9 bg-red-100 text-red-600 rounded-xl font-bold text-lg flex items-center justify-center">
                        −
                      </button>
                      <span className="w-6 text-center font-bold text-lg">{item.qty}</span>
                      <button onClick={() => changeQty(item.id, 1)}
                        className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl font-bold text-lg flex items-center justify-center">
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals + Pay */}
          <div className="p-4 border-t space-y-3">
            {discount > 0 && (
              <div className="flex justify-between text-green-600 text-sm font-semibold">
                <span>− {discountAmt.toFixed(2)} {settings.currency}</span>
                <span>خصم</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-2xl text-gray-900">
              <span>{total.toFixed(2)}</span>
              <span>الإجمالي</span>
            </div>
            <button
              onClick={() => cart.length && setShowPayment(true)}
              disabled={!cart.length}
              className="w-full bg-blue-600 disabled:bg-gray-200 text-white font-bold py-5 rounded-2xl text-xl transition"
            >
              💳 ادفع
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <button onClick={() => setShowPayment(false)} className="text-3xl text-gray-400">✕</button>
              <h3 className="font-bold text-2xl">تأكيد الدفع</h3>
            </div>
            <div className="p-5 space-y-4">

              {/* Discount */}
              <div>
                <label className="block text-gray-600 font-semibold mb-2 text-lg">خصم (ر.س)</label>
                <input type="number" min="0" value={discount || ''}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-xl text-right focus:outline-none focus:border-blue-500"
                  placeholder="0" />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-gray-600 font-semibold mb-2 text-lg">طريقة الدفع</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ v: 'cash', l: '💵 نقدي' }, { v: 'card', l: '💳 شبكة' }, { v: 'transfer', l: '📱 تحويل' }].map(m => (
                    <button key={m.v}
                      onClick={() => setPayMethod(m.v)}
                      className={`py-4 rounded-2xl font-bold text-base transition border-2 ${payMethod === m.v ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                      {m.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash input */}
              {payMethod === 'cash' && (
                <div>
                  <label className="block text-gray-600 font-semibold mb-2 text-lg">المبلغ المستلم</label>
                  <input type="number" min="0" value={cashAmount}
                    onChange={e => setCashAmount(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-2xl text-right focus:outline-none focus:border-blue-500"
                    placeholder="0.00" />
                  {cashAmount && (
                    <p className={`text-center mt-2 font-bold text-lg ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {change >= 0 ? `الباقي: ${change.toFixed(2)} ${settings.currency}` : `ناقص: ${Math.abs(change).toFixed(2)} ${settings.currency}`}
                    </p>
                  )}
                </div>
              )}

              {/* Summary */}
              <div className="bg-blue-50 rounded-2xl p-4 text-center">
                <p className="text-gray-500 text-sm">الإجمالي</p>
                <p className="font-bold text-3xl text-blue-600">{total.toFixed(2)} {settings.currency}</p>
              </div>

              <button onClick={completeSale}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-5 rounded-2xl text-xl transition">
                ✅ تأكيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold">🖨️ طباعة</button>
              <h3 className="font-bold text-xl">الإيصال</h3>
              <button onClick={() => setShowReceipt(false)} className="text-2xl text-gray-400">✕</button>
            </div>
            <div className="overflow-y-auto max-h-96 p-4 font-mono text-sm text-center">
              <p className="font-bold text-lg">{lastSale.settings?.store_name}</p>
              <p className="text-gray-400 text-xs mb-2">{lastSale.settings?.store_address}</p>
              <div className="border-t border-dashed py-2 text-xs space-y-1 text-right">
                <div className="flex justify-between"><span>رقم:</span><span className="font-bold">{lastSale.invoice_number}</span></div>
                <div className="flex justify-between"><span>التاريخ:</span><span>{new Date(lastSale.created_at).toLocaleDateString('ar-SA')}</span></div>
                <div className="flex justify-between"><span>الكاشير:</span><span>{lastSale.cashier?.name}</span></div>
              </div>
              <div className="border-t border-dashed py-2 space-y-1">
                {lastSale.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span>{item.total_price.toFixed(2)}</span>
                    <span>{item.product_name} ×{item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed pt-2 text-xs space-y-1 text-right">
                <div className="flex justify-between"><span>المجموع</span><span>{lastSale.subtotal?.toFixed(2)}</span></div>
                {lastSale.discount > 0 && <div className="flex justify-between text-green-600"><span>خصم</span><span>- {lastSale.discount?.toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-base border-t pt-1"><span>الإجمالي</span><span>{lastSale.total?.toFixed(2)} {lastSale.settings?.currency}</span></div>
              </div>
              <p className="mt-3 text-gray-500 text-xs">{lastSale.settings?.receipt_footer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
