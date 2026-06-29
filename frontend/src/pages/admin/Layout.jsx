import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'

const navItems = [
  { to: '/admin', label: 'لوحة التحكم', icon: '📊', end: true },
  { to: '/admin/products', label: 'المنتجات', icon: '🏷️' },
  { to: '/admin/categories', label: 'التصنيفات', icon: '📂' },
  { to: '/admin/sales', label: 'المبيعات', icon: '📄' },
  { to: '/admin/reports', label: 'التقارير', icon: '📈' },
  { to: '/admin/inventory', label: 'المخزون', icon: '📦' },
  { to: '/admin/users', label: 'المستخدمين', icon: '👥' },
  { to: '/admin/settings', label: 'الإعدادات', icon: '⚙️' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 right-0 z-40 w-64 bg-gray-900 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛒</span>
            <div>
              <h1 className="text-white font-bold text-lg">نظام الكاشير</h1>
              <p className="text-gray-400 text-xs">لوحة الإدارة</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to} to={item.to} end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-semibold ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
              }
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700 space-y-2">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.[0]}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{user?.name}</p>
              <p className="text-gray-400 text-xs">مدير</p>
            </div>
          </div>
          <button onClick={() => navigate('/cashier')} className="w-full flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-xl transition text-sm">
            🛒 شاشة الكاشير
          </button>
          <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-gray-700 rounded-xl transition text-sm">
            🚪 تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between lg:hidden flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 text-2xl">☰</button>
          <h1 className="font-bold text-gray-800">نظام الكاشير</h1>
          <span className="text-2xl">🛒</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
