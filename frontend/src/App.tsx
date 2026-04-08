import { useEffect } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useAuth } from '@/hooks/useAuth'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ProfilePage from '@/pages/profile/ProfilePage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminKatalogPage from '@/pages/admin/AdminKatalogPage'
import AdminRoute from '@/components/AdminRoute'
import Faz0DonemAcilis from '@/pages/wizard/Faz0DonemAcilis'
import Faz1AnaKategoriTarama from '@/pages/wizard/Faz1AnaKategoriTarama'
import Faz2AltKategoriAyirma from '@/pages/wizard/Faz2AltKategoriAyirma'
import IstekListesi from '@/pages/calisma/IstekListesi'
import MaliKarOzeti from '@/pages/calisma/MaliKarOzeti'
import KalemSayfasi from '@/pages/kalem/KalemSayfasi'
import Home from '@/pages/Home'
import MukellefListesi from '@/pages/mukellef/MukellefListesi'
import MukellefDetay from '@/pages/mukellef/MukellefDetay'
import DonemDetay from '@/pages/donem/DonemDetay'

const STEP_COMPONENTS: Record<string, React.ComponentType> = {
  'donem-acilis': Faz0DonemAcilis,
  'ana-kategori': Faz1AnaKategoriTarama,
  'alt-kategori': Faz2AltKategoriAyirma,
}

function WizardStepRouter() {
  const { stepKey } = useParams<{ stepKey: string }>()
  const Component = stepKey ? STEP_COMPONENTS[stepKey] : undefined
  if (!Component) return <Navigate to="donem-acilis" replace />
  return <Component />
}

function LegacyRedirect({ targetKey }: { targetKey: string }) {
  const { calismaId } = useParams<{ calismaId: string }>()
  return <Navigate to={`/calisma/${calismaId}/wizard/${targetKey}`} replace />
}

function App() {
  const { init } = useAuth()

  useEffect(() => {
    init()
  }, [init])

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/mukellef" element={<MukellefListesi />} />
            <Route path="/mukellef/:mukellefId" element={<MukellefDetay />} />
            <Route path="/donem/:donemId" element={<DonemDetay />} />

            {/* Dinamik wizard route */}
            <Route path="/calisma/:calismaId/wizard/:stepKey" element={<WizardStepRouter />} />

            {/* Eski URL'ler için redirect (backward compat) */}
            <Route path="/calisma/:calismaId/wizard/faz0" element={<LegacyRedirect targetKey="donem-acilis" />} />
            <Route path="/calisma/:calismaId/wizard/faz1" element={<LegacyRedirect targetKey="ana-kategori" />} />
            <Route path="/calisma/:calismaId/wizard/faz2" element={<LegacyRedirect targetKey="alt-kategori" />} />

            <Route path="/calisma/:calismaId/istek-listesi" element={<IstekListesi />} />
            <Route path="/calisma/:calismaId/ozet" element={<MaliKarOzeti />} />
            <Route path="/calisma/:calismaId/kalem/:icKod" element={<KalemSayfasi />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/katalog" element={<AdminKatalogPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}

export default App
