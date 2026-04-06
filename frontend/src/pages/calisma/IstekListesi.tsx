import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useWizardStore } from '@/store/wizardStore'
import { useCalisma } from '@/api/calisma'
import { useKatalogKalemler, KalemSchema } from '@/api/kalem'
import { apiClient } from '@/api/client'
import ThemeToggle from '@/components/ThemeToggle'
import KalemInfoModal from '@/components/KalemInfoModal'

interface InfoState {
  schema: KalemSchema
  yiakv: string
}

export default function IstekListesi() {
  const { calismaId } = useParams<{ calismaId: string }>()
  const navigate = useNavigate()
  const faz2 = useWizardStore((s) => s.faz2)
  const [infoModal, setInfoModal] = useState<InfoState | null>(null)
  const [infoYukleniyor, setInfoYukleniyor] = useState<string | null>(null)

  const { data: calisma, isLoading } = useCalisma(calismaId ? Number(calismaId) : undefined)
  const { data: katalog = [] } = useKatalogKalemler()

  const seciliKalemler = (calisma?.istek_listesi ?? faz2?.secilen_kalemler) ?? []
  const katalogMap = Object.fromEntries(katalog.map((k) => [k.ic_kod, k]))

  const acikInfo = async (icKod: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setInfoYukleniyor(icKod)
    try {
      const { data } = await apiClient.get<KalemSchema>(`/katalog/kalemler/${icKod}`)
      const yiakv = katalogMap[icKod]?.yiakv_etkisi ?? ''
      setInfoModal({ schema: data, yiakv })
    } finally {
      setInfoYukleniyor(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">İstek Listesi</h1>
          <p className="text-muted mt-1">Bu dönemde çalışacağınız kalemler</p>
        </div>
        <ThemeToggle />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : seciliKalemler.length === 0 ? (
        <div className="p-6 border border-border-default bg-surface-raised rounded-lg text-center text-muted">
          Seçili kalem yok. Wizard&apos;a dönün.
        </div>
      ) : (
        <div className="space-y-3">
          {seciliKalemler.map((ic_kod, idx) => {
            const kalem = katalogMap[ic_kod]
            const baslik = kalem?.baslik ?? ic_kod
            const kodlar = kalem?.beyanname_kodlari
              ? [...new Set(kalem.beyanname_kodlari.map((b) => b.kod))].join('/')
              : ''
            const yukleniyor = infoYukleniyor === ic_kod
            return (
              <div
                key={ic_kod}
                className="flex items-center gap-3 p-4 border border-border-default bg-surface-raised rounded-lg hover:border-accent/60 transition-colors group"
              >
                <div
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate(`/calisma/${calismaId}/kalem/${ic_kod}`)}
                >
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-primary leading-snug">{baslik}</p>
                    {kodlar && <p className="text-xs text-muted mt-0.5">Beyanname satırı: {kodlar}</p>}
                  </div>
                  <span className="text-muted group-hover:text-accent transition-colors flex-shrink-0 text-sm">→</span>
                </div>
                <button
                  onClick={(e) => acikInfo(ic_kod, e)}
                  disabled={yukleniyor}
                  className="flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors px-2 py-1 rounded border border-border-default hover:border-accent flex-shrink-0"
                  title="Mevzuat ve uygulama rehberi"
                >
                  {yukleniyor
                    ? <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    : 'ℹ Detay'}
                </button>
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

      {infoModal && (
        <KalemInfoModal
          kalem={infoModal.schema}
          yiakv={infoModal.yiakv}
          onClose={() => setInfoModal(null)}
        />
      )}
    </div>
  )
}
