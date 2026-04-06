import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '@/api/client'
import { useWizardStore } from '@/store/wizardStore'
import { useKatalogKalemler } from '@/api/kalem'
import ThemeToggle from '@/components/ThemeToggle'

// Category display labels
const KATEGORI_BASLIKLAR: Record<string, string> = {
  istirak_kazanc_istisnalari: 'İştirak Kazancı İstisnaları',
  serbest_bolge_tgb_istisnalari: 'Serbest Bölge ve TGB İstisnaları',
  yurtdisi_istisnalar: 'Yurtdışı Faaliyet İstisnaları',
  doviz_alacak_istisnalari: 'Döviz/Altın Hesabı Dönüşüm İstisnaları (Geçici Md.14)',
  varlik_satis_istisnalari: 'Varlık Satış ve Finansman İstisnaları',
  ar_ge_istisna: 'Ar-Ge ve Sınai Mülkiyet Hakları İstisnası',
  egitim_saglik_istisnalari: 'Eğitim, Öğretim ve Rehabilitasyon İstisnası',
  diger_istisnalar: 'Diğer İndirim ve İstisnalar',
}

export default function Faz2AltKategoriAyirma() {
  const { calismaId } = useParams<{ calismaId: string }>()
  const navigate = useNavigate()
  const { faz1, setFaz2 } = useWizardStore()
  const [seciliKalemler, setSeciliKalemler] = useState<Set<string>>(new Set())
  const [yukleniyor, setYukleniyor] = useState(false)

  const { data: katalogKalemler = [], isLoading } = useKatalogKalemler()

  const seciliKategoriler = Object.entries(faz1 ?? {})
    .filter(([, evet]) => evet)
    .map(([id]) => id)

  // Group active kalemler by category, filtered to selected categories
  const kalemlerByKategori = useMemo(() => {
    const result: Record<string, typeof katalogKalemler> = {}
    for (const kat of seciliKategoriler) {
      const kalemler = katalogKalemler.filter(
        (k) => k.ana_kategori === kat && k.durum === 'aktif'
      )
      if (kalemler.length > 0) {
        result[kat] = kalemler
      }
    }
    return result
  }, [katalogKalemler, seciliKategoriler])

  const toggleKalem = (icKod: string) => {
    setSeciliKalemler((prev) => {
      const next = new Set(prev)
      if (next.has(icKod)) {
        next.delete(icKod)
      } else {
        next.add(icKod)
      }
      return next
    })
  }

  const seciliArray = Array.from(seciliKalemler)
  const enAzBirSecili = seciliArray.length > 0

  const devamEt = async () => {
    setYukleniyor(true)
    try {
      await apiClient.put(`/calisma/${calismaId}/wizard/faz2`, {
        secilen_kalemler: seciliArray,
        kapi_soru_cevaplari: {},
      })
      setFaz2({ secilen_kalemler: seciliArray, kapi_soru_cevaplari: {} })
      navigate(`/calisma/${calismaId}/istek-listesi`)
    } finally {
      setYukleniyor(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center text-muted">Katalog yükleniyor...</div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Kalem Seçimi</h1>
          <p className="text-muted mt-1 text-sm">
            Uyguladığınız istisna kalemlerini seçin. Seçilen kalemler istek listenize eklenir.
          </p>
        </div>
        <ThemeToggle />
      </div>

      {Object.entries(kalemlerByKategori).map(([katId, kalemler]) => (
        <div key={katId} className="mb-8">
          <h2 className="text-base font-semibold text-primary mb-3 pb-2 border-b border-border-subtle">
            {KATEGORI_BASLIKLAR[katId] ?? katId}
            <span className="ml-2 text-xs font-normal text-muted">
              ({kalemler.filter((k) => seciliKalemler.has(k.ic_kod)).length}/{kalemler.length} seçili)
            </span>
          </h2>

          <div className="space-y-2">
            {kalemler.map((kalem) => {
              const secili = seciliKalemler.has(kalem.ic_kod)
              return (
                <label
                  key={kalem.ic_kod}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    secili
                      ? 'border-accent bg-accent/5 dark:bg-accent/10'
                      : 'border-border-default bg-surface-raised hover:border-border-strong'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={secili}
                    onChange={() => toggleKalem(kalem.ic_kod)}
                    className="mt-0.5 accent-accent"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-primary">{kalem.baslik}</span>
                      <span className="text-xs text-muted font-mono">
                        {kalem.beyanname_kodlari?.map((b: { kod: number }) => b.kod).join('/')}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        kalem.yiakv_etkisi === 'dusulur'
                          ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                          : kalem.yiakv_etkisi === 'dusulmez'
                          ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                          : 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300'
                      }`}>
                        YİAKV: {kalem.yiakv_etkisi === 'dusulur' ? 'Düşülür' : kalem.yiakv_etkisi === 'dusulmez' ? 'Düşülemez' : 'Tartışmalı'}
                      </span>
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      ))}

      {Object.keys(kalemlerByKategori).length === 0 && (
        <div className="p-6 bg-surface-overlay border border-border-default rounded-lg text-center text-muted">
          Seçilen kategorilerde aktif kalem bulunamadı.
        </div>
      )}

      {enAzBirSecili && (
        <div className="mb-4 p-3 bg-surface-overlay border border-border-default rounded-lg text-sm text-secondary">
          <strong className="text-primary">{seciliArray.length} kalem</strong> seçildi → istek listesine eklenecek
        </div>
      )}

      <button
        onClick={devamEt}
        disabled={!enAzBirSecili || yukleniyor}
        className="w-full bg-accent text-white py-2.5 px-4 rounded-md hover:bg-accent-hover disabled:opacity-50 font-medium text-sm transition-colors"
      >
        {yukleniyor ? 'Kaydediliyor...' : `${seciliArray.length} Kalem ile Devam Et →`}
      </button>
    </div>
  )
}
