import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '@/api/client'
import { useWizardStore } from '@/store/wizardStore'
import ThemeToggle from '@/components/ThemeToggle'

// TODO: KALEM_ESLEME maps ana_kategori IDs (from Faz1) to kalem ic_kod values and their
// kapi_sorulari. This mapping is currently hardcoded and should eventually be derived from
// the backend catalog (GET /katalog/kalemler/{ic_kod}) to avoid drift. Keys must match
// the ana_kategori values in the YAML catalog — currently "egitim_saglik_istisnalari".
// ic_kod values must match the ic_kod field in the YAML (e.g. "egitim_rehabilitasyon_5_1_i").
const KALEM_ESLEME: Record<string, { ic_kod: string; kapi_sorulari: Array<{ id: string; soru: string; zorunlu_cevap: string; aciklama?: string }> }> = {
  egitim_saglik_istisnalari: {
    ic_kod: 'egitim_rehabilitasyon_5_1_i',
    kapi_sorulari: [
      { id: 'mev_5580_kapsami', soru: "MEB veya ASHB'den 5580 s.K. kapsamında kurum açma iznin var mı?", zorunlu_cevap: 'evet', aciklama: 'Dershaneler ve etüt merkezleri kapsam dışıdır.' },
      { id: 'donem_karda_mi', soru: 'Bu dönem kârda mısın?', zorunlu_cevap: 'evet' },
      { id: 'bes_yil_icinde_mi', soru: 'Faaliyete geçiş yılından itibaren 5 yıl içinde misin?', zorunlu_cevap: 'evet' },
    ],
  },
}

export default function Faz2AltKategoriAyirma() {
  const { calismaId } = useParams<{ calismaId: string }>()
  const navigate = useNavigate()
  const { faz1, setFaz2 } = useWizardStore()
  const [cevaplar, setCevaplar] = useState<Record<string, Record<string, string>>>({})
  const [elinenler, setElinenler] = useState<Record<string, string>>({})
  const [yukleniyor, setYukleniyor] = useState(false)

  const seciliKategoriler = Object.entries(faz1 ?? {})
    .filter(([, evet]) => evet)
    .map(([id]) => id)

  const cevapGuncelle = (kategoriId: string, soruId: string, deger: string) => {
    const esleme = KALEM_ESLEME[kategoriId]
    if (!esleme) return

    setCevaplar((p) => ({ ...p, [kategoriId]: { ...(p[kategoriId] ?? {}), [soruId]: deger } }))

    // Kapı sorusu HAYIR ise elemek
    const soru = esleme.kapi_sorulari.find((s) => s.id === soruId)
    if (soru && soru.zorunlu_cevap === 'evet' && deger === 'hayir') {
      setElinenler((p) => ({ ...p, [esleme.ic_kod]: soru.aciklama ?? 'Koşul sağlanamadı' }))
    } else {
      setElinenler((p) => {
        const yeni = { ...p }
        delete yeni[esleme.ic_kod]
        return yeni
      })
    }
  }

  const seciliKalemler = seciliKategoriler
    .map((katId) => KALEM_ESLEME[katId]?.ic_kod)
    .filter((ic_kod): ic_kod is string => !!ic_kod && !elinenler[ic_kod])

  const devamEt = async () => {
    setYukleniyor(true)
    try {
      await apiClient.put(`/calisma/${calismaId}/wizard/faz2`, {
        secilen_kalemler: seciliKalemler,
        kapi_soru_cevaplari: cevaplar,
      })
      setFaz2({ secilen_kalemler: seciliKalemler, kapi_soru_cevaplari: cevaplar })
      navigate(`/calisma/${calismaId}/istek-listesi`)
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Alt Kategori Ayırma</h1>
          <p className="text-muted mt-1">Seçilen kategoriler için kapı sorularını yanıtlayın</p>
        </div>
        <ThemeToggle />
      </div>

      {seciliKategoriler.map((katId) => {
        const esleme = KALEM_ESLEME[katId]
        if (!esleme) return null
        const elinenMesaj = elinenler[esleme.ic_kod]

        return (
          <div key={katId} className={`mb-6 p-4 border rounded-lg ${elinenMesaj ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950' : 'border-border-default bg-surface-raised'}`}>
            <h3 className="font-semibold text-primary mb-3">
              {katId === 'egitim_saglik_istisnalari' ? 'Eğitim, Öğretim ve Rehabilitasyon İstisnası (Kod 305)' : katId}
            </h3>

            {elinenMesaj && (
              <div className="mb-3 text-red-700 dark:text-red-300 text-sm" data-testid={`${esleme.ic_kod}-elenme-ikonu`}>
                ❌ Bu kalem elendi: {elinenMesaj}
              </div>
            )}

            {esleme.kapi_sorulari.map((soru) => (
              <div key={soru.id} className="mb-3">
                <p className="text-sm text-secondary mb-1">{soru.soru}</p>
                {soru.aciklama && <p className="text-xs text-muted mb-1">{soru.aciklama}</p>}
                <div className="flex gap-4">
                  {['evet', 'hayir'].map((sec) => (
                    <label key={sec} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name={`${katId}-${soru.id}`}
                        value={sec}
                        checked={cevaplar[katId]?.[soru.id] === sec}
                        onChange={() => cevapGuncelle(katId, soru.id, sec)}
                        className="accent-accent"
                        aria-label={sec === 'evet' ? 'Evet' : 'Hayır'}
                      />
                      <span className="text-sm text-primary capitalize">{sec === 'evet' ? 'Evet' : 'Hayır'}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      })}

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Seçilen kalemler: {seciliKalemler.length}</p>
        <ul className="mt-1 text-sm text-blue-700 dark:text-blue-400 list-disc list-inside">
          {seciliKalemler.map((ic_kod) => <li key={ic_kod}>{ic_kod}</li>)}
        </ul>
      </div>

      <button
        onClick={devamEt}
        disabled={seciliKalemler.length === 0 || yukleniyor}
        className="mt-6 w-full bg-accent text-white py-2 px-4 rounded-md hover:bg-accent-hover disabled:opacity-50 font-medium"
      >
        {yukleniyor ? 'Kaydediliyor...' : 'İstek Listesini Oluştur →'}
      </button>
    </div>
  )
}
