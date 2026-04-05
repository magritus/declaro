import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '@/api/client'
import { useWizardStore } from '@/store/wizardStore'
import ThemeToggle from '@/components/ThemeToggle'

const ANA_KATEGORILER = [
  { id: 'istirak_kazanci', soru: 'İştirak kazancın var mı?', grup: 'zarar_olsa_dahi',
    bilgi: 'KVK 5/1-a kapsamında tam mükellef kurumlardan elde edilen kâr payları.' },
  { id: 'emisyon_primi', soru: 'Emisyon primi kazancı var mı?', grup: 'zarar_olsa_dahi',
    bilgi: 'KVK 5/1-ç — Hisse senedi ihraç primlerinden elde edilen kazançlar.' },
  { id: 'yurtdisi_insaat', soru: 'Yurtdışı inşaat/teknik hizmet faaliyetin var mı?', grup: 'zarar_olsa_dahi',
    bilgi: 'KVK 5/1-h — Yurtdışında fiilen icra edilen inşaat işlerinden elde edilen kazançlar.' },
  { id: 'egitim_rehabilitasyon', soru: 'Özel okul, kreş veya rehabilitasyon merkezi işletiyor musun?', grup: 'kazanc_varsa',
    bilgi: 'KVK 5/1-ı — 5580 s.K. kapsamında faaliyete geçilen hesap döneminden itibaren 5 yıl istisna.', kalem_ic_kod: 'egitim_rehabilitasyon_5_1_i' },
  { id: 'sponsorluk', soru: 'Sponsorluk harcaman var mı?', grup: 'kazanc_varsa',
    bilgi: 'KVK 10/1-b — Amatör spor dalları için %100, profesyonel için %50 indirim.' },
  { id: 'bagis_yardim', soru: 'Bağış ve yardım yaptın mı?', grup: 'kazanc_varsa',
    bilgi: 'KVK 10/1-c ve diğer — Kurum kazancının %5\'i genel tavan.' },
  { id: 'arge', soru: 'Ar-Ge harcaman var mı?', grup: 'kazanc_varsa',
    bilgi: 'KVK 10/1-a — 5746 s.K. kapsamında Ar-Ge indirimi.' },
]

export default function Faz1AnaKategoriTarama() {
  const { calismaId } = useParams<{ calismaId: string }>()
  const navigate = useNavigate()
  const { faz0, setFaz1 } = useWizardStore()
  const [cevaplar, setCevaplar] = useState<Record<string, boolean>>({})
  const [acikModal, setAcikModal] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)

  const karDurumu = (faz0?.ticari_kar_zarar ?? 0) > 0

  const gorunurKategoriler = ANA_KATEGORILER.filter(
    (k) => karDurumu || k.grup !== 'kazanc_varsa'
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
