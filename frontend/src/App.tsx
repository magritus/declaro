import { Routes, Route } from 'react-router-dom'
import Faz0DonemAcilis from '@/pages/wizard/Faz0DonemAcilis'
import Faz1AnaKategoriTarama from '@/pages/wizard/Faz1AnaKategoriTarama'
import Faz2AltKategoriAyirma from '@/pages/wizard/Faz2AltKategoriAyirma'
import IstekListesi from '@/pages/calisma/IstekListesi'
import KalemSayfasi from '@/pages/kalem/KalemSayfasi'
import Home from '@/pages/Home'
import MukellefListesi from '@/pages/mukellef/MukellefListesi'
import MukellefDetay from '@/pages/mukellef/MukellefDetay'
import DonemDetay from '@/pages/donem/DonemDetay'

function App() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mukellef" element={<MukellefListesi />} />
        <Route path="/mukellef/:mukellefId" element={<MukellefDetay />} />
        <Route path="/donem/:donemId" element={<DonemDetay />} />
        <Route path="/calisma/:calismaId/wizard/faz0" element={<Faz0DonemAcilis />} />
        <Route path="/calisma/:calismaId/wizard/faz1" element={<Faz1AnaKategoriTarama />} />
        <Route path="/calisma/:calismaId/wizard/faz2" element={<Faz2AltKategoriAyirma />} />
        <Route path="/calisma/:calismaId/istek-listesi" element={<IstekListesi />} />
        <Route path="/calisma/:calismaId/kalem/:icKod" element={<KalemSayfasi />} />
      </Routes>
    </div>
  )
}

export default App
