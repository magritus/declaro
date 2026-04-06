import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '@/api/client'
import { useWizardStore } from '@/store/wizardStore'
import { useKatalogKalemler } from '@/api/kalem'
import ThemeToggle from '@/components/ThemeToggle'

// Category IDs must match the ana_kategori values in the YAML catalog.
const ANA_KATEGORILER = [
  // Zarar olsa dahi (always shown)
  { id: 'istirak_kazanc_istisnalari', soru: 'İştirak kazancı istisnası (KVK 5/1-a, 5/1-b, 5/1-d)?', grup: 'zarar_olsa_dahi',
    bilgi: 'Tam ve dar mükellef kurumlardan elde edilen kâr payları, yurtdışı iştirak kazançları, fon/ortaklık kazançları.' },
  { id: 'serbest_bolge_tgb_istisnalari', soru: 'Serbest bölge veya TGB (Teknoloji Geliştirme Bölgesi) faaliyetin var mı?', grup: 'zarar_olsa_dahi',
    bilgi: '3218 s.K. Serbest Bölge istisnası ve 4691 s.K. Teknoloji Geliştirme Bölgesi kazanç istisnası.' },
  { id: 'yurtdisi_istisnalar', soru: 'Yurtdışı şube, daimi temsilci veya inşaat/montaj faaliyetin var mı?', grup: 'zarar_olsa_dahi',
    bilgi: 'KVK 5/1-g yurtdışı şube/daimi temsilci, KVK 5/1-h yurtdışı inşaat/montaj/teknik hizmet kazanç istisnaları.' },
  // Kazanç varsa
  { id: 'doviz_alacak_istisnalari', soru: 'KKM veya altın hesabı TL\'ye dönüştürdün mü? (Geçici Md.14)', grup: 'kazanc_varsa',
    bilgi: 'KVK Geçici Madde 14 kapsamında yabancı para veya altın hesaplarının TL\'ye dönüştürülmesinden doğan kazanç ve faiz istisnası (370–387 beyanname satırları).' },
  { id: 'varlik_satis_istisnalari', soru: 'Taşınmaz, iştirak hissesi veya sat-kirala-geri al işlemi yaptın mı?', grup: 'kazanc_varsa',
    bilgi: 'KVK 5/1-e taşınmaz/iştirak hissesi satışı, KVK 5/1-j sat-kirala-geri al, KVK 5/1-k kira sertifikası ihracı kazanç istisnaları.' },
  { id: 'ar_ge_istisna', soru: 'Patent veya faydalı model belgeli buluşundan kazanç elde ettin mi?', grup: 'kazanc_varsa',
    bilgi: 'KVK Madde 5/B — Türkiye\'de yapılan Ar-Ge sonucu elde edilen patent/faydalı model belgeli buluşlardan kazancın %50\'si istisna (NEXUS oranıyla).' },
  { id: 'egitim_saglik_istisnalari', soru: 'Özel okul, kreş veya rehabilitasyon merkezi işletiyor musun?', grup: 'kazanc_varsa',
    bilgi: 'KVK 5/1-ı — 5580 s.K. kapsamında faaliyete geçilen hesap döneminden itibaren 5 yıl istisna.' },
  { id: 'diger_istisnalar', soru: 'Diğer özel indirim veya istisna kalemlerin var mı?', grup: 'kazanc_varsa',
    bilgi: 'Beyanname 350 (diğer indirimler), GVK Geçici Md.76 ürün senedi istisnası, CVOA kapsamı ve benzeri özel kalemler.' },
]

export default function Faz1AnaKategoriTarama() {
  const { calismaId } = useParams<{ calismaId: string }>()
  const navigate = useNavigate()
  const { faz0, setFaz1 } = useWizardStore()
  const [cevaplar, setCevaplar] = useState<Record<string, boolean>>({})
  const [acikModal, setAcikModal] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)

  const { data: katalogKalemler = [] } = useKatalogKalemler()
  const karDurumu = (faz0?.ticari_kar_zarar ?? 0) > 0

  // Derive active categories from catalog — hide categories with no active kalemler
  const aktifKatalogKategoriler = useMemo(() => {
    return new Set(
      katalogKalemler
        .filter((k) => k.durum === 'aktif')
        .map((k) => k.ana_kategori)
    )
  }, [katalogKalemler])

  const gorunurKategoriler = ANA_KATEGORILER.filter(
    (k) =>
      (karDurumu || k.grup !== 'kazanc_varsa') &&
      (aktifKatalogKategoriler.size === 0 || aktifKatalogKategoriler.has(k.id))
  )

  const enAzBirEvet = Object.values(cevaplar).some(Boolean)

  const devamEt = async () => {
    setYukleniyor(true)
    try {
      await apiClient.put(`/calisma/${calismaId}/wizard/faz1`, {
        secilen_kategoriler: cevaplar,
      })
      setFaz1(cevaplar)
      navigate(`/calisma/${calismaId}/wizard/faz2`)
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Kategori Tarama</h1>
          {!karDurumu && (
            <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-amber-800 dark:text-amber-300 text-sm">
              ⚠️ Zarar nedeniyle "kazanç varsa indirilecek" grup otomatik atlandı
            </div>
          )}
        </div>
        <ThemeToggle />
      </div>

      <div className="space-y-4">
        {gorunurKategoriler.map((kat) => (
          <div key={kat.id} className="flex items-start gap-3 p-4 border border-border-default bg-surface-raised rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-primary">{kat.soru}</p>
              {kat.grup === 'kazanc_varsa' && (
                <span className="text-xs text-muted">Kazanç varsa indirilecek</span>
              )}
            </div>
            <button
              onClick={() => setAcikModal(kat.id)}
              className="text-accent hover:text-accent-hover text-lg"
              title="Bilgi"
            >
              ℹ
            </button>
            <div className="flex gap-2">
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

      <button
        onClick={devamEt}
        disabled={!enAzBirEvet || yukleniyor}
        className="mt-8 w-full bg-accent text-white py-2 px-4 rounded-md hover:bg-accent-hover disabled:opacity-50 font-medium"
      >
        {yukleniyor ? 'Kaydediliyor...' : 'Devam →'}
      </button>

      {/* Info Modal */}
      {acikModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setAcikModal(null)}>
          <div className="bg-surface-raised border border-border-default rounded-lg p-6 max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2 text-primary">{ANA_KATEGORILER.find(k => k.id === acikModal)?.soru}</h3>
            <p className="text-secondary">{ANA_KATEGORILER.find(k => k.id === acikModal)?.bilgi}</p>
            <button onClick={() => setAcikModal(null)} className="mt-4 text-accent hover:underline">Kapat</button>
          </div>
        </div>
      )}
    </div>
  )
}
