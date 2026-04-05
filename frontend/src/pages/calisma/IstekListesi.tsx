import { useNavigate, useParams } from 'react-router-dom'
import { useWizardStore } from '@/store/wizardStore'
import ThemeToggle from '@/components/ThemeToggle'

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">İstek Listesi</h1>
          <p className="text-muted mt-1">Bu dönemde çalışacağınız kalemler</p>
        </div>
        <ThemeToggle />
      </div>

      {seciliKalemler.length === 0 ? (
        <div className="p-6 border border-border-default bg-surface-raised rounded-lg text-center text-muted">
          Seçili kalem yok. Wizard&apos;a dönün.
        </div>
      ) : (
        <div className="space-y-3">
          {seciliKalemler.map((ic_kod, idx) => {
            const bilgi = KALEM_ADLARI[ic_kod] ?? { baslik: ic_kod, kod: 0 }
            return (
              <div key={ic_kod} className="flex items-center gap-4 p-4 border border-border-default bg-surface-raised rounded-lg hover:border-accent cursor-pointer transition-colors"
                onClick={() => navigate(`/calisma/${calismaId}/kalem/${ic_kod}`)}>
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-primary">{bilgi.baslik}</p>
                  {bilgi.kod > 0 && <p className="text-xs text-muted">Kod {bilgi.kod}</p>}
                </div>
                <span className="text-muted">→</span>
              </div>
            )
          })}
        </div>
      )}

      <button
        onClick={() => navigate(`/calisma/${calismaId}/kalem/${seciliKalemler[0]}`)}
        disabled={seciliKalemler.length === 0}
        className="mt-8 w-full bg-accent text-white py-2 px-4 rounded-md hover:bg-accent-hover disabled:opacity-50 font-medium"
      >
        Çalışma Kâğıtlarını Aç →
      </button>
      <button
        onClick={() => navigate(`/calisma/${calismaId}/ozet`)}
        className="mt-3 w-full bg-surface-raised border border-accent text-accent py-2 px-4 rounded-md hover:bg-surface-overlay font-medium"
      >
        Mali Kâr Özeti →
      </button>
    </div>
  )
}
