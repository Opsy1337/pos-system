import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Cashier from './pages/Cashier'
import Admin from './pages/Admin'

function PrivateRoute({ children, adminOnly = false }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/cashier" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/cashier'} replace /> : <Login />} />
      <Route path="/cashier" element={<PrivateRoute><Cashier /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute adminOnly><Admin /></PrivateRoute>} />
      <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/cashier') : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
