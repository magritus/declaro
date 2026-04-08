import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { apiClient } from '@/api/client'
import { useWizardNavigation } from '@/hooks/useWizardNavigation'
import { useWizardStore } from '@/store/wizardStore'
import { useKatalogKalemler, useAnaKategoriler, KalemSchema } from '@/api/kalem'
import { useCalisma } from '@/api/calisma'
import KalemInfoModal from '@/components/KalemInfoModal'

const KATEGORI_BASLIKLAR: Record<string, string> = {
  // İlaveler
  kkeg: 'İlaveler',
  enflasyon_duzeltmesi: 'Enflasyon Düzeltmesi Farklarından İlaveler',
  // Zarar olsa dahi
  gecmis_yil_zararlari: 'Geçmiş Yıl Zararları Mahsubu',
  istirak_kazanc_istisnalari: 'İştirak Kazancı İstisnaları',
  portfoy_isletmeciligi: 'Portföy İşletmeciliği Kazancı İstisnaları',
  serbest_bolge_tgb_istisnalari: 'Serbest Bölge ve TGB İstisnaları',
  yurtdisi_istisnalar: 'Yurtdışı Faaliyet İstisnaları',
  doviz_alacak_istisnalari: 'Döviz/Altın Hesabı Dönüşüm İstisnaları (Geçici Md.14)',
  varlik_satis_istisnalari: 'Varlık Satış ve Finansman İstisnaları',
  ar_ge_istisna: 'Ar-Ge ve Sınai Mülkiyet Hakları İstisnası',
  egitim_saglik_istisnalari: 'Eğitim, Öğretim ve Rehabilitasyon İstisnası',
  diger_istisnalar: 'Diğer İndirim ve İstisnalar',
  // Kazanç varsa
  arge_tasarim_indirimleri: 'Ar-Ge, Tasarım ve Teknogirişim İndirimleri',
  arge_indirimleri: 'Ar-Ge İndirimleri',
  bagis_yardim_sponsorluk: 'Bağış, Yardım ve Sponsorluk İndirimleri',
  bagis_yardim_indirimleri: 'Bağış ve Yardım İndirimleri',
  sponsorluk_indirimi: 'Sponsorluk Harcaması İndirimi',
  yatirim_tesvikleri: 'Yatırım Teşvikleri ve Özel İndirimler',
  yatirim_indirimi: 'Yatırım İndirimi (GVK Geçici Md.61)',
  nakdi_sermaye_indirimi: 'Nakdi Sermaye Artırımı Faiz İndirimi',
  hizmet_indirimleri: 'Risturn ve Korumalı İşyeri İndirimi',
  saglik_egitim_hizmet_indirimi: 'Sağlık ve Eğitim Hizmeti İndirimi',
  risturn_ve_saglik_indirimleri: 'Risturn, Sağlık/Eğitim ve Korumalı İşyeri İndirimi',
  diger_indirimler: 'Diğer İndirimler',
  diger_indirimler_alt: 'Diğer Özel İndirimler',
  // Hesaplanan KV indirimleri
  vergi_indirimleri: 'Hesaplanan Vergi İndirimleri',
}

interface InfoState {
  schema: KalemSchema
  yiakv: string
}

export default function Faz2AltKategoriAyirma() {
  const { calismaId } = useParams<{ calismaId: string }>()
  const { navigateNext, navigatePrev } = useWizardNavigation()
  const { getFaz1, setFaz2 } = useWizardStore()
  const faz1 = getFaz1(calismaId ?? '')
  const [seciliKalemler, setSeciliKalemler] = useState<Set<string>>(new Set())
  const [yukleniyor, setYukleniyor] = useState(false)
  const [infoModal, setInfoModal] = useState<InfoState | null>(null)
  const [infoYukleniyor, setInfoYukleniyor] = useState<string | null>(null)

  const calismaIdNum = calismaId ? parseInt(calismaId) : undefined
  const { data: calisma } = useCalisma(calismaIdNum)
  const { data: katalogKalemler = [], isLoading } = useKatalogKalemler()
  const { data: anaKategoriler = [] } = useAnaKategoriler()

  // Daha önce kaydedilmiş seçimleri yükle
  useEffect(() => {
    const kaydedilen = calisma?.istek_listesi
    if (kaydedilen && kaydedilen.length > 0) {
      setSeciliKalemler(new Set(kaydedilen))
    }
  }, [calisma?.istek_listesi])

  // Faz1'de seçilen kategorileri DB sira'sına göre sırala
  // Store boşsa (sayfa yenileme, direkt URL) DB'den faz1 cevaplarına fallback yap
  const seciliKategoriler = useMemo(() => {
    const faz1Kaynak: Record<string, boolean> | null =
      faz1 ?? (calisma?.wizard_cevaplari?.['faz1'] as Record<string, boolean> | undefined) ?? null
    const secilen = new Set(
      Object.entries(faz1Kaynak ?? {}).filter(([, evet]) => evet).map(([id]) => id)
    )
    if (anaKategoriler.length > 0) {
      return anaKategoriler
        .filter((k) => secilen.has(k.kod))
        .sort((a, b) => a.sira - b.sira)
        .map((k) => k.kod)
    }
    return [...secilen]
  }, [faz1, calisma, anaKategoriler])

  const kalemlerByKategori = useMemo(() => {
    const result: Record<string, typeof katalogKalemler> = {}
    for (const kat of seciliKategoriler) {
      const kalemler = katalogKalemler.filter(
        (k) => k.ana_kategori === kat && k.durum === 'aktif'
      )
      if (kalemler.length > 0) result[kat] = kalemler
    }
    return result
  }, [katalogKalemler, seciliKategoriler])

  const katalogMap = useMemo(
    () => Object.fromEntries(katalogKalemler.map((k) => [k.ic_kod, k])),
    [katalogKalemler]
  )

  const isChecked = (icKod: string): boolean => {
    if (seciliKalemler.has(icKod)) return true
    // coklu_instance: any _N variant counts as checked
    if (katalogMap[icKod]?.coklu_instance) {
      return Array.from(seciliKalemler).some((k) => k.match(new RegExp(`^${icKod}_\\d+$`)))
    }
    return false
  }

  const toggleKalem = (icKod: string) => {
    const coklu = katalogMap[icKod]?.coklu_instance
    setSeciliKalemler((prev) => {
      const next = new Set(prev)
      if (isChecked(icKod)) {
        // Remove — for coklu, remove all _N instances
        if (coklu) {
          for (const k of Array.from(next)) {
            if (k.match(new RegExp(`^${icKod}_\\d+$`))) next.delete(k)
          }
        } else {
          next.delete(icKod)
        }
      } else {
        // Add — for coklu, add _1 instance
        next.add(coklu ? `${icKod}_1` : icKod)
      }
      return next
    })
  }

  const acikInfo = async (icKod: string, yiakv: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setInfoYukleniyor(icKod)
    try {
      const { data } = await apiClient.get<KalemSchema>(`/katalog/kalemler/${icKod}`)
      setInfoModal({ schema: data, yiakv })
    } finally {
      setInfoYukleniyor(null)
    }
  }

  const seciliArray = Array.from(seciliKalemler)

  const devamEt = async () => {
    setYukleniyor(true)
    try {
      await apiClient.put(`/calisma/${calismaId}/wizard/faz2`, {
        secilen_kalemler: seciliArray,
        kapi_soru_cevaplari: {},
      })
      setFaz2(calismaId!, { secilen_kalemler: seciliArray, kapi_soru_cevaplari: {} })
      navigateNext()
    } finally {
      setYukleniyor(false)
    }
  }

  if (isLoading) {
    return <div className="max-w-2xl mx-auto p-8 text-center text-muted">Katalog yükleniyor...</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Kalem Seçimi</h1>
        <p className="text-muted mt-1 text-sm">
          Uyguladığınız istisna kalemlerini seçin. Seçilen kalemler istek listenize eklenir.
        </p>
      </div>

      {Object.entries(kalemlerByKategori).map(([katId, kalemler]) => (
        <div key={katId} className="mb-8">
          <h2 className="text-base font-semibold text-primary mb-3 pb-2 border-b border-border-subtle">
            {KATEGORI_BASLIKLAR[katId] ?? katId}
            <span className="ml-2 text-xs font-normal text-muted">
              ({kalemler.filter((k) => isChecked(k.ic_kod)).length}/{kalemler.length} seçili)
            </span>
          </h2>

          <div className="space-y-2">
            {kalemler.map((kalem) => {
              const secili = isChecked(kalem.ic_kod)
              const kodlar = kalem.beyanname_kodlari && kalem.beyanname_kodlari.length > 0
                ? [...new Set(kalem.beyanname_kodlari.map((b: { kod: number }) => b.kod))].join('/')
                : null
              const refLabel = kodlar
                ? `Beyanname: ${kodlar}`
                : kalem.dahili_ref
                ? `Ref: ${kalem.dahili_ref}`
                : null
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
                    <span className="text-sm font-medium text-primary">{kalem.baslik}</span>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        kalem.yiakv_etkisi === 'dusulur'
                          ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                          : kalem.yiakv_etkisi === 'dusulmez'
                          ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                          : 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300'
                      }`}>
                        YİAKV: {kalem.yiakv_etkisi === 'dusulur' ? 'Düşülür' : kalem.yiakv_etkisi === 'dusulmez' ? 'Düşülemez' : 'Tartışmalı'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => acikInfo(kalem.ic_kod, kalem.yiakv_etkisi, e)}
                        disabled={infoYukleniyor === kalem.ic_kod}
                        className="flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors px-1.5 py-0.5 rounded border border-border-default hover:border-accent"
                        title="Mevzuat ve uygulama rehberi"
                      >
                        {infoYukleniyor === kalem.ic_kod
                          ? <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          : 'ℹ Detay'}
                      </button>
                      {refLabel && (
                        <span className="text-xs text-muted font-mono px-1.5 py-0.5 rounded border border-border-default bg-surface-overlay select-none">
                          {refLabel}
                        </span>
                      )}
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

      {seciliArray.length > 0 && (
        <div className="mb-4 p-3 bg-surface-overlay border border-border-default rounded-lg text-sm text-secondary">
          <strong className="text-primary">{seciliArray.length} kalem</strong> seçildi → istek listesine eklenecek
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={navigatePrev}
          className="flex-shrink-0 bg-surface-raised border border-border-default text-primary py-2.5 px-4 rounded-md hover:bg-surface-overlay font-medium text-sm transition-colors"
        >
          ← Geri
        </button>
        <button
          onClick={devamEt}
          disabled={seciliArray.length === 0 || yukleniyor}
          className="flex-1 bg-accent text-white py-2.5 px-4 rounded-md hover:bg-accent-hover disabled:opacity-50 font-medium text-sm transition-colors"
        >
          {yukleniyor ? 'Kaydediliyor...' : `${seciliArray.length} Kalem ile Devam Et →`}
        </button>
      </div>

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
