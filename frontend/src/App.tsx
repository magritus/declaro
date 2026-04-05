import { Routes, Route } from 'react-router-dom'
import Faz0DonemAcilis from '@/pages/wizard/Faz0DonemAcilis'
import Faz1AnaKategoriTarama from '@/pages/wizard/Faz1AnaKategoriTarama'
import Faz2AltKategoriAyirma from '@/pages/wizard/Faz2AltKategoriAyirma'
import IstekListesi from '@/pages/calisma/IstekListesi'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<div className="p-8 text-2xl font-bold">Declaro</div>} />
        <Route path="/calisma/:calismaId/wizard/faz0" element={<Faz0DonemAcilis />} />
        <Route path="/calisma/:calismaId/wizard/faz1" element={<Faz1AnaKategoriTarama />} />
        <Route path="/calisma/:calismaId/wizard/faz2" element={<Faz2AltKategoriAyirma />} />
        <Route path="/calisma/:calismaId/istek-listesi" element={<IstekListesi />} />
      </Routes>
    </div>
  )
}

export default App
