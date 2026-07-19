import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { Login } from './pages/Login'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Estoque } from './pages/Estoque'
import { Vendas } from './pages/Vendas'
import { Conteudo } from './pages/Conteudo'

function Gate() {
  const { status } = useAuth()

  if (status === 'loading' || status === 'checking-admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-soft">
        <p className="text-sm text-ink-muted">Carregando…</p>
      </div>
    )
  }

  if (status !== 'admin') {
    return <Login />
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="estoque" element={<Estoque />} />
        <Route path="vendas" element={<Vendas />} />
        <Route path="conteudo" element={<Conteudo />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
