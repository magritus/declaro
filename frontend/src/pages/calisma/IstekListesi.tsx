import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useWizardStore } from '@/store/wizardStore'
import { useCalisma, useYenidenAc, useIstekListesiGuncelle, useKalemSonuclari } from '@/api/calisma'
import { useKatalogKalemler, KalemSchema } from '@/api/kalem'
import { apiClient } from '@/api/client'
import KalemInfoModal from '@/components/KalemInfoModal'
import { downloadWithAuth } from '@/lib/downloadWithAuth'

interface InfoState {
  schema: KalemSchema
  yiakv: string
}

// ic_kod → base + instance no (e.g. "foo_2" → {base: "foo", no: 2})
function parseIcKod(ic_kod: string): { base: string; no: number | null } {
  const m = ic_kod.match(/^(.+)_(\d+)$/)
  if (m) return { base: m[1], no: parseInt(m[2]) }
  return { base: ic_kod, no: null }
}

interface KalemGrup {
  base: string
  coklu: boolean
  instances: string[]  // ordered ic_kods
}

function grupla(istekListesi: string[], katalogMap: Record<string, { coklu_instance?: boolean }>): KalemGrup[] {
  const gruplar: KalemGrup[] = []
  const goruldu = new Set<string>()

  for (const ic_kod of istekListesi) {
    if (goruldu.has(ic_kod)) continue
    const { base, no } = parseIcKod(ic_kod)
    const kalem = katalogMap[base] ?? katalogMap[ic_kod]
    const coklu = !!(kalem?.coklu_instance)

    if (coklu) {
      // coklu_instance: group base entry + all _N variants together
      const instances = istekListesi.filter((k) => {
        if (k === base) return true  // legacy entry without suffix
        const p = parseIcKod(k)
        return p.base === base && p.no !== null
      })
      instances.forEach((k) => goruldu.add(k))
      gruplar.push({ base, coklu: true, instances })
    } else if (no !== null) {
      // _N suffix but not coklu_instance — treat as normal
      goruldu.add(ic_kod)
      gruplar.push({ base: ic_kod, coklu: false, instances: [ic_kod] })
    } else {
      goruldu.add(ic_kod)
      gruplar.push({ base: ic_kod, coklu: false, instances: [ic_kod] })
    }
  }

  return gruplar
}

export default function IstekListesi() {
  const { calismaId } = useParams<{ calismaId: string }>()
  const navigate = useNavigate()
  const getFaz2 = useWizardStore((s) => s.getFaz2)
  const faz2 = getFaz2(calismaId ?? '')
  const [infoModal, setInfoModal] = useState<InfoState | null>(null)
  const [infoYukleniyor, setInfoYukleniyor] = useState<string | null>(null)
  const [downloadHata, setDownloadHata] = useState<string | null>(null)

  const calismaIdNum = calismaId ? Number(calismaId) : undefined
  const { data: calisma, isLoading } = useCalisma(calismaIdNum)
  const { data: katalog = [] } = useKatalogKalemler()
  const { data: kalemSonuclari } = useKalemSonuclari(calismaIdNum)
  const yenidenAc = useYenidenAc(calismaIdNum)
  const istekListesiGuncelle = useIstekListesiGuncelle(calismaIdNum)

  const seciliKalemler: string[] = (calisma?.istek_listesi ?? faz2?.secilen_kalemler) ?? []
  const katalogMap = Object.fromEntries(katalog.map((k) => [k.ic_kod, k]))

  const gruplar = grupla(seciliKalemler, katalogMap)

  const acikInfo = async (icKod: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const { base } = parseIcKod(icKod)
    const lookupKod = katalogMap[icKod] ? icKod : base
    setInfoYukleniyor(icKod)
    try {
      const { data } = await apiClient.get<KalemSchema>(`/katalog/kalemler/${lookupKod}`)
      const yiakv = katalogMap[lookupKod]?.yiakv_etkisi ?? ''
      setInfoModal({ schema: data, yiakv })
    } finally {
      setInfoYukleniyor(null)
    }
  }

  const ytbEkle = (base: string) => {
    const mevcutNolar = seciliKalemler
      .map((k) => parseIcKod(k))
      .filter((p) => p.base === base && p.no !== null)
      .map((p) => p.no as number)
    // Next number: max existing + 1, or count of instances + 1
    const existingCount = seciliKalemler.filter((k) => {
      if (k === base) return true
      const p = parseIcKod(k)
      return p.base === base && p.no !== null
    }).length
    const yeniNo = mevcutNolar.length > 0 ? Math.max(...mevcutNolar) + 1 : existingCount + 1
    const yeniKod = `${base}_${yeniNo}`
    istekListesiGuncelle.mutate([...seciliKalemler, yeniKod])
  }

  const instanceKaldir = (ic_kod: string) => {
    const yeni = seciliKalemler.filter((k) => k !== ic_kod)
    istekListesiGuncelle.mutate(yeni)
  }

  let globalIdx = 0

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">İstek Listesi</h1>
        <p className="text-muted mt-1">Bu dönemde çalışacağınız kalemler</p>
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
        <div className="space-y-4">
          {gruplar.map((grup) => {
            const baseKalem = katalogMap[grup.base]

            if (grup.coklu) {
              // Multi-instance group
              return (
                <div key={grup.base} className="border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950 flex items-center justify-between">
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      {baseKalem?.baslik ?? grup.base}
                    </span>
                    <button
                      onClick={() => ytbEkle(grup.base)}
                      disabled={istekListesiGuncelle.isPending}
                      className="text-xs font-medium text-blue-700 dark:text-blue-300 hover:text-white hover:bg-blue-600 border border-blue-300 dark:border-blue-600 hover:border-blue-600 px-2.5 py-1 rounded-md transition-colors"
                    >
                      + Ekle
                    </button>
                  </div>
                  <div className="divide-y divide-border-default">
                    {grup.instances.map((ic_kod) => {
                      const { no } = parseIcKod(ic_kod)
                      const idx = ++globalIdx
                      const yukleniyor = infoYukleniyor === ic_kod
                      const kodlar = baseKalem?.beyanname_kodlari
                        ? [...new Set(baseKalem.beyanname_kodlari.map((b) => b.kod))].join('/')
                        : ''
                      return (
                        <div key={ic_kod} className="flex items-center gap-3 p-3 bg-surface-raised hover:bg-surface-overlay transition-colors group">
                          <div
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                            onClick={() => navigate(`/calisma/${calismaId}/kalem/${ic_kod}`)}
                          >
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {idx}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-primary leading-snug">{baseKalem?.baslik ?? ic_kod}</p>
                                {no && (
                                  <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                                    #{no}
                                  </span>
                                )}
                              </div>
                              {(kodlar || kalemSonuclari?.[ic_kod] != null) && (
                                <p className="text-xs text-muted mt-0.5">
                                  {kodlar && <span>Beyanname satırı: {kodlar}</span>}
                                  {kalemSonuclari?.[ic_kod] != null && (
                                    <span className={kodlar ? ' · ' : ''}>
                                      Faydalanılan: <span className="font-medium text-accent">{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(kalemSonuclari[ic_kod]!)} TL</span>
                                    </span>
                                  )}
                                </p>
                              )}
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
                          {grup.instances.length > 1 && (
                            <button
                              onClick={() => instanceKaldir(ic_kod)}
                              disabled={istekListesiGuncelle.isPending}
                              className="text-xs text-red-500 hover:text-red-700 border border-transparent hover:border-red-300 px-2 py-1 rounded transition-colors flex-shrink-0"
                              title="Bu instance'ı kaldır"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            }

            // Normal single kalem
            const ic_kod = grup.instances[0]
            const kalem = katalogMap[ic_kod]
            const baslik = kalem?.baslik ?? ic_kod
            const kodlar = kalem?.beyanname_kodlari
              ? [...new Set(kalem.beyanname_kodlari.map((b) => b.kod))].join('/')
              : ''
            const yukleniyor = infoYukleniyor === ic_kod
            const idx = ++globalIdx
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
                    {idx}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-primary leading-snug">{baslik}</p>
                    {(kodlar || kalemSonuclari?.[ic_kod] != null) && (
                      <p className="text-xs text-muted mt-0.5">
                        {kodlar && <span>Beyanname satırı: {kodlar}</span>}
                        {kalemSonuclari?.[ic_kod] != null && (
                          <span className={kodlar ? ' · ' : ''}>
                            Faydalanılan: <span className="font-medium text-accent">{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(kalemSonuclari[ic_kod]!)} TL</span>
                          </span>
                        )}
                      </p>
                    )}
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

      {/* Tamamlandı banner */}
      {calisma?.tamamlandi && (
        <div className="mt-8 flex items-center justify-between gap-3 p-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Bu çalışma tamamlandı olarak işaretlendi</span>
          </div>
          <button
            onClick={() => yenidenAc.mutate()}
            disabled={yenidenAc.isPending}
            className="text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:text-amber-600 dark:hover:text-amber-400 border border-emerald-300 dark:border-emerald-700 hover:border-amber-400 px-3 py-1.5 rounded-md transition-colors flex-shrink-0"
          >
            {yenidenAc.isPending ? '…' : '✎ Düzenlemeye Aç'}
          </button>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => navigate(`/calisma/${calismaId}/wizard/faz1`)}
          className="flex-1 text-sm border border-border-default text-secondary py-2 px-3 rounded-md hover:border-accent hover:text-accent transition-colors"
        >
          ← Faz 1
        </button>
        <button
          onClick={() => navigate(`/calisma/${calismaId}/wizard/faz2`)}
          className="flex-1 text-sm border border-border-default text-secondary py-2 px-3 rounded-md hover:border-accent hover:text-accent transition-colors"
        >
          ← Faz 2
        </button>
      </div>

      {downloadHata && (
        <div className="mt-6 p-2 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
          {downloadHata}
        </div>
      )}
      <button
        onClick={async () => {
          setDownloadHata(null)
          try {
            await downloadWithAuth(`/api/calisma/${calismaId}/istek-listesi/excel`, 'istek-listesi.xlsx')
          } catch (e) {
            setDownloadHata(e instanceof Error ? e.message : 'İndirme hatası')
          }
        }}
        className="mt-6 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md font-medium transition-colors"
      >
        ↓ İstek Listesi Excel İndir
      </button>
      <button
        onClick={() => navigate(`/calisma/${calismaId}/kalem/${seciliKalemler[0]}`)}
        disabled={seciliKalemler.length === 0}
        className="mt-3 w-full bg-accent text-white py-2 px-4 rounded-md hover:bg-accent-hover disabled:opacity-50 font-medium"
      >
        Çalışma Kâğıtlarını Aç →
      </button>
      <button
        onClick={() => navigate(`/calisma/${calismaId}/ozet`)}
        className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
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
