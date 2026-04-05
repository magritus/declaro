import { useNavigate, useParams } from 'react-router-dom'
import { useWizardStore } from '@/store/wizardStore'

const KALEM_ADLARI: Record<string, { baslik: string; kod: number }> = {
  egitim_rehabilitasyon_5_1_i: { baslik: 'Eğitim, Öğretim ve Rehabilitasyon Kazanç İstisnası', kod: 305 },
}

export default function IstekListesi() {
  const { calismaId } = useParams<{ calismaId: string }>()
  const navigate = useNavigate()
  const faz2 = useWizardStore((s) => s.faz2)
  const seciliKalemler = faz2?.secilen_kalemler ?? []

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">İstek Listesi</h1>
        <p className="text-gray-500 mt-1">Bu dönemde çalışacağınız kalemler</p>
      </div>

      {seciliKalemler.length === 0 ? (
        <div className="p-6 border border-gray-200 rounded-lg text-center text-gray-500">
          Seçili kalem yok. Wizard&apos;a dönün.
        </div>
      ) : (
        <div className="space-y-3">
          {seciliKalemler.map((ic_kod, idx) => {
            const bilgi = KALEM_ADLARI[ic_kod] ?? { baslik: ic_kod, kod: 0 }
            return (
              <div key={ic_kod} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer"
                onClick={() => navigate(`/calisma/${calismaId}/kalem/${ic_kod}`)}>
                <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{bilgi.baslik}</p>
                  {bilgi.kod > 0 && <p className="text-xs text-gray-400">Kod {bilgi.kod}</p>}
                </div>
                <span className="text-gray-400">→</span>
              </div>
            )
          })}
        </div>
      )}

      <button
        onClick={() => navigate(`/calisma/${calismaId}/kalem/${seciliKalemler[0]}`)}
        disabled={seciliKalemler.length === 0}
        className="mt-8 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
      >
        Çalışma Kâğıtlarını Aç →
      </button>
      <button
        onClick={() => navigate(`/calisma/${calismaId}/ozet`)}
        className="mt-3 w-full bg-white border border-blue-600 text-blue-600 py-2 px-4 rounded-md hover:bg-blue-50 font-medium"
      >
        Mali Kâr Özeti →
      </button>
    </div>
  )
}
