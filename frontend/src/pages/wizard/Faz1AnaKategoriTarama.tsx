import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { apiClient } from '@/api/client'
import { useWizardStore } from '@/store/wizardStore'
import { useWizardNavigation } from '@/hooks/useWizardNavigation'
import { useKatalogKalemler, useAnaKategoriler } from '@/api/kalem'
import { useCalisma } from '@/api/calisma'
import { renderMarkdown } from '@/lib/renderMarkdown'

interface KategoriInfo {
  id: string
  soru: string
  grup: 'zarar_olsa_dahi' | 'kazanc_varsa' | 'gecmis_yil_zarari' | 'ilave' | 'hesaplanan_kv_indirimi'
  etiket: string
  bilgi: string
}

export default function Faz1AnaKategoriTarama() {
  const { calismaId } = useParams<{ calismaId: string }>()
  const { navigateNext } = useWizardNavigation()
  const { getFaz0, getFaz1, setFaz1 } = useWizardStore()
  // calismaId'ye özgü store verisi — farklı çalışmada null döner, DB'den yüklenir
  const faz0 = getFaz0(calismaId ?? '')
  const faz1 = getFaz1(calismaId ?? '')
  const [cevaplar, setCevaplar] = useState<Record<string, boolean>>(() => faz1 ?? {})

  // calismaId değiştiğinde state'i sıfırla
  useEffect(() => {
    const stored = getFaz1(calismaId ?? '')
    setCevaplar(stored ?? {})
  }, [calismaId])
  const [acikModal, setAcikModal] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)

  const calismaIdNum = calismaId ? Number(calismaId) : undefined
  const { data: calisma } = useCalisma(calismaIdNum)
  const { data: katalogKalemler = [] } = useKatalogKalemler()
  const { data: rawAnaKategoriler, isLoading: kategorilerYukleniyor } = useAnaKategoriler()
  const karDurumu = (faz0?.ticari_kar_zarar ?? calisma?.ticari_kar_zarar ?? 0) > 0

  // Sayfa yenilenirse backend'den geri yükle (store boşsa)
  useEffect(() => {
    if (!calisma?.wizard_cevaplari) return
    const savedFaz1 = calisma.wizard_cevaplari['faz1'] as Record<string, boolean> | undefined
    if (!savedFaz1 || Object.keys(savedFaz1).length === 0) return
    setCevaplar((prev) => (Object.keys(prev).length === 0 ? savedFaz1 : prev))
  }, [calisma])

  // Map DB response to KategoriInfo
  const anaKategoriler: KategoriInfo[] = useMemo(() => {
    if (!rawAnaKategoriler) return []
    return rawAnaKategoriler.map((k) => ({
      id: k.kod,
      soru: k.soru,
      grup: k.grup,
      etiket: k.etiket,
      bilgi: k.bilgi ?? '',
    }))
  }, [rawAnaKategoriler])

  const aktifKatalogKategoriler = useMemo(() => {
    return new Set(
      katalogKalemler.filter((k) => k.durum === 'aktif').map((k) => k.ana_kategori)
    )
  }, [katalogKalemler])

  const gorunurKategoriler = anaKategoriler.filter(
    (k) =>
      (karDurumu || (k.grup !== 'kazanc_varsa' && k.grup !== 'hesaplanan_kv_indirimi')) &&
      (aktifKatalogKategoriler.size === 0 || aktifKatalogKategoriler.has(k.id))
  )

  // Kategori listesi yüklenince: hâlâ boşsa tümünü "Hayır" yap
  useEffect(() => {
    if (gorunurKategoriler.length === 0) return
    setCevaplar((prev) => {
      if (Object.keys(prev).length > 0) return prev
      return Object.fromEntries(gorunurKategoriler.map((k) => [k.id, false]))
    })
  }, [gorunurKategoriler])

  const enAzBirEvet = Object.values(cevaplar).some(Boolean)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAcikModal(null) }
    if (acikModal) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [acikModal])

  const devamEt = async () => {
    setYukleniyor(true)
    try {
      await apiClient.put(`/calisma/${calismaId}/wizard/faz1`, { secilen_kategoriler: cevaplar })
      setFaz1(calismaId!, cevaplar)
      navigateNext()
    } finally {
      setYukleniyor(false)
    }
  }

  const modalKategori = anaKategoriler.find((k) => k.id === acikModal)

  if (kategorilerYukleniyor) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <p className="text-muted">Yükleniyor...</p>
      </div>
    )
  }

  const gruplar: { grup: string; baslik: string; renk: string; kategoriler: typeof gorunurKategoriler }[] = [
    {
      grup: 'ilave',
      baslik: 'İlaveler (matrah artırıcı kalemler)',
      renk: 'amber',
      kategoriler: gorunurKategoriler.filter((k) => k.grup === 'ilave'),
    },
    {
      grup: 'zarar_olsa_dahi',
      baslik: 'Zarar olsa dahi indirilecek istisnalar',
      renk: 'emerald',
      kategoriler: gorunurKategoriler.filter((k) => k.grup === 'zarar_olsa_dahi'),
    },
    {
      grup: 'gecmis_yil_zarari',
      baslik: 'Geçmiş yıl zararı mahsubu',
      renk: 'indigo',
      kategoriler: gorunurKategoriler.filter((k) => k.grup === 'gecmis_yil_zarari'),
    },
    {
      grup: 'kazanc_varsa',
      baslik: 'Kazancın bulunması halinde indirilecek kalemler',
      renk: 'blue',
      kategoriler: gorunurKategoriler.filter((k) => k.grup === 'kazanc_varsa'),
    },
    {
      grup: 'hesaplanan_kv_indirimi',
      baslik: 'Hesaplanan KV indirimleri',
      renk: 'violet',
      kategoriler: gorunurKategoriler.filter((k) => k.grup === 'hesaplanan_kv_indirimi'),
    },
  ].filter((g) => g.kategoriler.length > 0)

  const renkler: Record<string, { header: string; badge: string; border: string }> = {
    amber: {
      header: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
      badge: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
    },
    emerald: {
      header: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
      badge: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    indigo: {
      header: 'bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300',
      badge: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800',
    },
    blue: {
      header: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
      badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
    },
    violet: {
      header: 'bg-violet-50 dark:bg-violet-950 border-violet-200 dark:border-violet-800 text-violet-800 dark:text-violet-300',
      badge: 'bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300',
      border: 'border-violet-200 dark:border-violet-800',
    },
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Kategori Tarama</h1>
        <p className="text-muted mt-1 text-sm">Aşağıdaki kategorilerde faaliyetinizin bulunup bulunmadığını belirtin.</p>
        {!karDurumu && (
          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-amber-800 dark:text-amber-300 text-sm">
            ⚠️ Ticari zarar nedeniyle "kazancın bulunması halinde" grubu atlandı
          </div>
        )}
      </div>

      <div className="space-y-8">
        {gruplar.map((g) => {
          const r = renkler[g.renk]
          return (
            <div key={g.grup}>
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg border ${r.header}`}>
                <span className="text-sm font-semibold">{g.baslik}</span>
                <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${r.badge}`}>
                  {g.kategoriler.filter((k) => cevaplar[k.id] === true).length}/{g.kategoriler.length} evet
                </span>
              </div>
              <div className={`border-x border-b ${r.border} rounded-b-lg overflow-hidden`}>
                {g.kategoriler.map((kat, idx) => (
                  <div
                    key={kat.id}
                    className={`flex items-start gap-3 p-4 bg-surface-raised ${
                      idx < g.kategoriler.length - 1 ? 'border-b border-border-subtle' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-primary text-sm leading-snug">{kat.soru}</p>
                    </div>
                    <button
                      onClick={() => setAcikModal(kat.id)}
                      className="flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors px-1.5 py-0.5 rounded border border-border-default hover:border-accent flex-shrink-0 mt-0.5"
                      title="Kategori hakkında bilgi"
                    >
                      ℹ Detay
                    </button>
                    <div className="flex gap-2 flex-shrink-0">
                      {['Evet', 'Hayır'].map((sec) => (
                        <label key={sec} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={kat.id}
                            value={sec}
                            checked={cevaplar[kat.id] === (sec === 'Evet')}
                            onChange={() => setCevaplar((p) => ({ ...p, [kat.id]: sec === 'Evet' }))}
                            className="accent-accent"
                          />
                          <span className="text-sm text-primary">{sec}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={devamEt}
        disabled={!enAzBirEvet || yukleniyor}
        className="mt-8 w-full bg-accent text-white py-2 px-4 rounded-md hover:bg-accent-hover disabled:opacity-50 font-medium"
      >
        {yukleniyor ? 'Kaydediliyor...' : 'Devam →'}
      </button>

      {/* Info Modal */}
      {acikModal && modalKategori && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setAcikModal(null)}
        >
          <div
            className="bg-surface-raised border border-border-default rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-border-subtle flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-1.5">Kategori Bilgisi</p>
                  <h2 className="text-lg font-bold text-primary leading-snug">{modalKategori.soru}</h2>
                </div>
                <button
                  onClick={() => setAcikModal(null)}
                  className="w-8 h-8 rounded-full bg-surface-overlay hover:bg-border-subtle flex items-center justify-center text-muted hover:text-primary transition-colors flex-shrink-0"
                >
                  ✕
                </button>
              </div>
              <div className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                modalKategori.grup === 'ilave'
                  ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : modalKategori.grup === 'zarar_olsa_dahi'
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : modalKategori.grup === 'gecmis_yil_zarari'
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                  : modalKategori.grup === 'hesaplanan_kv_indirimi'
                  ? 'bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800'
                  : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
              }`}>
                {modalKategori.grup === 'ilave'
                  ? '▲ Matrah artırıcı kalem'
                  : modalKategori.grup === 'zarar_olsa_dahi'
                  ? '✓ Her koşulda uygulanır'
                  : modalKategori.grup === 'gecmis_yil_zarari'
                  ? '◈ Mali kârdan mahsup edilir'
                  : modalKategori.grup === 'hesaplanan_kv_indirimi'
                  ? '▼ Hesaplanan KV\u2019den indirilir'
                  : '○ Kazanç varsa uygulanır'}
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {renderMarkdown(modalKategori.bilgi)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
