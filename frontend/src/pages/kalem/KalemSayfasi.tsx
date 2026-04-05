import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import VeriGirisiForm from '@/components/VeriGirisiForm'
import {
  useKalemSchema,
  useHesapla,
  useSaveVeri,
  useUpdateChecklist,
  useUpdateBelgeler,
} from '@/api/kalem'
import type { HesapSonucu, ChecklistDurum, BelgeDurum } from '@/api/kalem'

type Tab = 'veri' | 'hesaplamalar' | 'checklist' | 'belgeler' | 'muhasebe'

const TABS: { id: Tab; label: string }[] = [
  { id: 'veri', label: 'Veri Girişi' },
  { id: 'hesaplamalar', label: 'Hesaplamalar' },
  { id: 'checklist', label: 'K-Checklist' },
  { id: 'belgeler', label: 'Belgeler' },
  { id: 'muhasebe', label: 'Muhasebe Kayıtları' },
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(value)
}

export default function KalemSayfasi() {
  const { calismaId, icKod } = useParams<{ calismaId: string; icKod: string }>()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<Tab>('veri')
  const [hesapSonucu, setHesapSonucu] = useState<HesapSonucu | null>(null)
  const [checklistDurum, setChecklistDurum] = useState<ChecklistDurum>({})
  const [belgeDurum, setBelgeDurum] = useState<BelgeDurum>({})
  const [kayitMesaji, setKayitMesaji] = useState<string | null>(null)

  const { data: kalem, isLoading: schemaYukleniyor, error: schemaHata } = useKalemSchema(icKod)
  const hesaplaMutation = useHesapla(calismaId, icKod)
  const saveVeriMutation = useSaveVeri(calismaId, icKod)
  const updateChecklistMutation = useUpdateChecklist(calismaId, icKod)
  const updateBelgelerMutation = useUpdateBelgeler(calismaId, icKod)

  const handleVeriSubmit = async (data: Record<string, unknown>) => {
    try {
      const sonuc = await hesaplaMutation.mutateAsync(data)
      setHesapSonucu(sonuc)
      await saveVeriMutation.mutateAsync(data)
    } catch {
      // Hata hesaplaMutation.error üzerinden gösterilir
    }
  }

  const handleChecklistKaydet = async () => {
    try {
      await updateChecklistMutation.mutateAsync(checklistDurum)
      setKayitMesaji('K-Checklist kaydedildi.')
      setTimeout(() => setKayitMesaji(null), 3000)
    } catch {
      // mutasyon hatası gösterilir
    }
  }

  const handleBelgelerKaydet = async () => {
    try {
      await updateBelgelerMutation.mutateAsync(belgeDurum)
      setKayitMesaji('Belgeler kaydedildi.')
      setTimeout(() => setKayitMesaji(null), 3000)
    } catch {
      // mutasyon hatası gösterilir
    }
  }

  if (schemaYukleniyor) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-gray-500 text-sm">
        Kalem bilgileri yükleniyor...
      </div>
    )
  }

  if (schemaHata || !kalem) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          Kalem şeması yüklenemedi. Lütfen sayfayı yenileyin.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <button
          onClick={() => navigate(`/calisma/${calismaId}/istek-listesi`)}
          className="hover:text-blue-600 transition-colors"
        >
          İstek Listesi
        </button>
        <span>/</span>
        <span className="text-gray-600">{kalem.baslik}</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{kalem.baslik}</h1>
          {kalem.kisa_aciklama && (
            <p className="text-gray-500 mt-1 text-sm">{kalem.kisa_aciklama}</p>
          )}
        </div>
        <button
          onClick={() => window.open(`/api/calisma/${calismaId}/export/kalem/${icKod}`, '_blank')}
          className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 flex items-center gap-1 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Excel İndir
        </button>
      </div>

      {/* Başarı mesajı */}
      {kayitMesaji && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          {kayitMesaji}
        </div>
      )}

      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0" aria-label="Sekmeler">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab İçerikleri */}

      {activeTab === 'veri' && (
        <VeriGirisiForm
          alanlar={kalem.hesaplama_sablonu.veri_girisi_alanlari}
          onSubmit={handleVeriSubmit}
          isLoading={hesaplaMutation.isPending || saveVeriMutation.isPending}
          hesapSonucu={hesapSonucu}
        />
      )}

      {activeTab === 'hesaplamalar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Hesaplama Sonuçları</h2>
            <button
              onClick={() => setActiveTab('veri')}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Yeniden Hesapla
            </button>
          </div>

          {!hesapSonucu ? (
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500 text-sm">
              Henüz hesaplama yapılmadı. Veri Girişi sekmesinden hesaplayın.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-green-800">İstisna Tutarı</span>
                  <span className="text-xl font-bold text-green-700">
                    {formatCurrency(hesapSonucu.istisna_tutari)}
                  </span>
                </div>
              </div>

              {Object.keys(hesapSonucu.ara_sonuclar).length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-700">Ara Sonuçlar</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {Object.entries(hesapSonucu.ara_sonuclar).map(([key, val]) => (
                      <div key={key} className="flex justify-between px-4 py-3 text-sm">
                        <span className="text-gray-600">{key}</span>
                        <span className="font-medium text-gray-800">{formatCurrency(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hesapSonucu.aciklama && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  {hesapSonucu.aciklama}
                </div>
              )}

              {hesapSonucu.hatalar.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-700 mb-1">Hatalar</p>
                  <ul className="list-disc list-inside space-y-1">
                    {hesapSonucu.hatalar.map((h, i) => (
                      <li key={i} className="text-sm text-red-600">{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {hesapSonucu.uyarilar.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-700 mb-1">Uyarılar</p>
                  <ul className="list-disc list-inside space-y-1">
                    {hesapSonucu.uyarilar.map((u, i) => (
                      <li key={i} className="text-sm text-yellow-700">{u}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'checklist' && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-800">K-Checklist</h2>

          {kalem.k_checklist.length === 0 ? (
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500 text-sm">
              Bu kalem için checklist maddesi bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3">
              {kalem.k_checklist.map((madde) => {
                const durum = checklistDurum[madde.id]
                return (
                  <div key={madde.id} className="p-4 border border-gray-200 rounded-lg space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{madde.soru}</p>
                        {madde.aciklama && (
                          <p className="text-xs text-gray-400 mt-0.5">{madde.aciklama}</p>
                        )}
                      </div>
                      {durum && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            durum === 'uygun'
                              ? 'bg-green-100 text-green-700'
                              : durum === 'eksik'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {durum === 'uygun' ? 'Uygun' : durum === 'eksik' ? 'Eksik' : 'Risk'}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-4">
                      {(['uygun', 'eksik', 'risk'] as const).map((val) => (
                        <label key={val} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`checklist-${madde.id}`}
                            value={val}
                            checked={checklistDurum[madde.id] === val}
                            onChange={() =>
                              setChecklistDurum((prev) => ({ ...prev, [madde.id]: val }))
                            }
                            className="accent-blue-600"
                          />
                          <span
                            className={`text-sm ${
                              val === 'uygun'
                                ? 'text-green-700'
                                : val === 'eksik'
                                ? 'text-red-700'
                                : 'text-yellow-700'
                            }`}
                          >
                            {val === 'uygun' ? 'Uygun' : val === 'eksik' ? 'Eksik' : 'Risk'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {updateChecklistMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              Checklist kaydedilemedi. Lütfen tekrar deneyin.
            </div>
          )}

          <button
            onClick={handleChecklistKaydet}
            disabled={updateChecklistMutation.isPending || kalem.k_checklist.length === 0}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium text-sm transition-colors"
          >
            {updateChecklistMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      {activeTab === 'belgeler' && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-800">Belgeler</h2>

          {kalem.belge_listesi.length === 0 ? (
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500 text-sm">
              Bu kalem için belge listesi bulunmuyor.
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Belge No
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Başlık
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Kategori
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Durum
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Not
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {kalem.belge_listesi.map((belge, idx) => (
                    <tr
                      key={belge.belge_no}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {belge.belge_no}
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        {belge.baslik}
                        {belge.aciklama && (
                          <p className="text-xs text-gray-400 mt-0.5">{belge.aciklama}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            belge.kategori === 'zorunlu'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {belge.kategori === 'zorunlu' ? 'Zorunlu' : 'Destekleyici'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={belgeDurum[belge.belge_no]?.durum ?? ''}
                          onChange={(e) =>
                            setBelgeDurum((prev) => ({
                              ...prev,
                              [belge.belge_no]: {
                                durum: e.target.value as 'uygun' | 'eksik',
                                not: prev[belge.belge_no]?.not ?? '',
                              },
                            }))
                          }
                        >
                          <option value="">Seçiniz</option>
                          <option value="uygun">Uygun</option>
                          <option value="eksik">Eksik</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="Not ekle..."
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={belgeDurum[belge.belge_no]?.not ?? ''}
                          onChange={(e) =>
                            setBelgeDurum((prev) => ({
                              ...prev,
                              [belge.belge_no]: {
                                durum: prev[belge.belge_no]?.durum ?? 'eksik',
                                not: e.target.value,
                              },
                            }))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {updateBelgelerMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              Belgeler kaydedilemedi. Lütfen tekrar deneyin.
            </div>
          )}

          <button
            onClick={handleBelgelerKaydet}
            disabled={updateBelgelerMutation.isPending || kalem.belge_listesi.length === 0}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium text-sm transition-colors"
          >
            {updateBelgelerMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      {activeTab === 'muhasebe' && (
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500 text-sm">
          Bu sekme ileride doldurulacak.
        </div>
      )}
    </div>
  )
}
