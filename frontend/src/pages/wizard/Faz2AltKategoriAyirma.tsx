import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '@/api/client'
import { useWizardStore } from '@/store/wizardStore'

const KALEM_ESLEME: Record<string, { ic_kod: string; kapi_sorulari: Array<{ id: string; soru: string; zorunlu_cevap: string; aciklama?: string }> }> = {
  egitim_rehabilitasyon: {
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Alt Kategori Ayırma</h1>
        <p className="text-gray-500 mt-1">Seçilen kategoriler için kapı sorularını yanıtlayın</p>
      </div>

      {seciliKategoriler.map((katId) => {
        const esleme = KALEM_ESLEME[katId]
        if (!esleme) return null
        const elinenMesaj = elinenler[esleme.ic_kod]

        return (
          <div key={katId} className={`mb-6 p-4 border rounded-lg ${elinenMesaj ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
            <h3 className="font-semibold text-gray-800 mb-3">
              {katId === 'egitim_rehabilitasyon' ? 'Eğitim, Öğretim ve Rehabilitasyon İstisnası (Kod 305)' : katId}
            </h3>

            {elinenMesaj && (
              <div className="mb-3 text-red-700 text-sm" data-testid={`${esleme.ic_kod}-elenme-ikonu`}>
                ❌ Bu kalem elendi: {elinenMesaj}
              </div>
            )}

            {esleme.kapi_sorulari.map((soru) => (
              <div key={soru.id} className="mb-3">
                <p className="text-sm text-gray-700 mb-1">{soru.soru}</p>
                {soru.aciklama && <p className="text-xs text-gray-400 mb-1">{soru.aciklama}</p>}
                <div className="flex gap-4">
                  {['evet', 'hayir'].map((sec) => (
                    <label key={sec} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name={`${katId}-${soru.id}`}
                        value={sec}
                        checked={cevaplar[katId]?.[soru.id] === sec}
                        onChange={() => cevapGuncelle(katId, soru.id, sec)}
                        className="accent-blue-600"
                        aria-label={sec === 'evet' ? 'Evet' : 'Hayır'}
                      />
                      <span className="text-sm capitalize">{sec === 'evet' ? 'Evet' : 'Hayır'}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      })}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-medium text-blue-800">Seçilen kalemler: {seciliKalemler.length}</p>
        <ul className="mt-1 text-sm text-blue-700 list-disc list-inside">
          {seciliKalemler.map((ic_kod) => <li key={ic_kod}>{ic_kod}</li>)}
        </ul>
      </div>

      <button
        onClick={devamEt}
        disabled={seciliKalemler.length === 0 || yukleniyor}
        className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
      >
        {yukleniyor ? 'Kaydediliyor...' : 'İstek Listesini Oluştur →'}
      </button>
    </div>
  )
}
