import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import PanoramaOperacional from './pages/PanoramaOperacional'
import Dashboard from './pages/Dashboard'
import Projetos from './pages/Projetos'
import Furos from './pages/Furos'
import Relatorios from './pages/Relatorios'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              {/* Telas com sidebar (AppLayout) */}
              <Route element={<AppLayout />}>
                <Route path="/"            element={<Navigate to="/panorama" replace />} />
                <Route path="/panorama"    element={<PanoramaOperacional />} />
                <Route path="/dashboard"   element={<Dashboard />} />
                <Route path="/projetos"    element={<Projetos />} />
                <Route path="/furos"       element={<Furos />} />
                <Route path="/relatorios"  element={<Relatorios />} />
                <Route path="/usuarios"    element={<div className="text-primary font-semibold">Usuários — em breve</div>} />
                <Route path="/campanhas/:id" element={<div className="text-primary font-semibold p-4">Ficha da campanha — em breve</div>} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
