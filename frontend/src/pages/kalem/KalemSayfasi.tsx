import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import VeriGirisiForm from '@/components/VeriGirisiForm'
import ThemeToggle from '@/components/ThemeToggle'
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
      <div className="max-w-4xl mx-auto p-8 text-muted text-sm">
        Kalem bilgileri yükleniyor...
      </div>
    )
  }

  if (schemaHata || !kalem) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          Kalem şeması yüklenemedi. Lütfen sayfayı yenileyin.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-4">
        <button
          onClick={() => navigate(`/calisma/${calismaId}/istek-listesi`)}
          className="hover:text-accent transition-colors"
        >
          İstek Listesi
        </button>
        <span>/</span>
        <span className="text-secondary">{kalem.baslik}</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">{kalem.baslik}</h1>
          {kalem.kisa_aciklama && (
            <p className="text-muted mt-1 text-sm">{kalem.kisa_aciklama}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ThemeToggle />
          <button
            onClick={() => window.open(`/api/calisma/${calismaId}/export/kalem/${icKod}`, '_blank')}
            className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Excel İndir
          </button>
        </div>
      </div>

      {/* Başarı mesajı */}
      {kayitMesaji && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md text-green-700 dark:text-green-300 text-sm">
          {kayitMesaji}
        </div>
      )}

      {/* Tab navigation */}
      <div className="border-b border-border-default mb-6">
        <nav className="flex gap-0" aria-label="Sekmeler">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-secondary hover:border-border-default'
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
            <h2 className="text-base font-semibold text-primary">Hesaplama Sonuçları</h2>
            <button
              onClick={() => setActiveTab('veri')}
              className="px-4 py-2 text-sm bg-accent text-white rounded-md hover:bg-accent-hover transition-colors"
            >
              Yeniden Hesapla
            </button>
          </div>

          {!hesapSonucu ? (
            <div className="p-6 bg-surface-overlay border border-border-default rounded-lg text-center text-muted text-sm">
              Henüz hesaplama yapılmadı. Veri Girişi sekmesinden hesaplayın.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-green-800 dark:text-green-300">İstisna Tutarı</span>
                  <span className="text-xl font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(hesapSonucu.istisna_tutari)}
                  </span>
                </div>
              </div>

              {Object.keys(hesapSonucu.ara_sonuclar).length > 0 && (
                <div className="border border-border-default rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-surface-overlay border-b border-border-default">
                    <p className="text-sm font-medium text-secondary">Ara Sonuçlar</p>
                  </div>
                  <div className="divide-y divide-border-subtle">
                    {Object.entries(hesapSonucu.ara_sonuclar).map(([key, val]) => (
                      <div key={key} className="flex justify-between px-4 py-3 text-sm">
                        <span className="text-secondary">{key}</span>
                        <span className="font-medium text-primary">{formatCurrency(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hesapSonucu.aciklama && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                  {hesapSonucu.aciklama}
                </div>
              )}

              {hesapSonucu.hatalar.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">Hatalar</p>
                  <ul className="list-disc list-inside space-y-1">
                    {hesapSonucu.hatalar.map((h, i) => (
                      <li key={i} className="text-sm text-red-600 dark:text-red-400">{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {hesapSonucu.uyarilar.length > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-1">Uyarılar</p>
                  <ul className="list-disc list-inside space-y-1">
                    {hesapSonucu.uyarilar.map((u, i) => (
                      <li key={i} className="text-sm text-yellow-700 dark:text-yellow-400">{u}</li>
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
          <h2 className="text-base font-semibold text-primary">K-Checklist</h2>

          {kalem.k_checklist.length === 0 ? (
            <div className="p-6 bg-surface-overlay border border-border-default rounded-lg text-center text-muted text-sm">
              Bu kalem için checklist maddesi bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3">
              {kalem.k_checklist.map((madde) => {
                const durum = checklistDurum[madde.id]
                return (
                  <div key={madde.id} className="p-4 border border-border-default bg-surface-raised rounded-lg space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-primary">{madde.soru}</p>
                        {madde.aciklama && (
                          <p className="text-xs text-muted mt-0.5">{madde.aciklama}</p>
                        )}
                      </div>
                      {durum && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            durum === 'uygun'
                              ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                              : durum === 'eksik'
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                              : 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300'
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
                            className="accent-accent"
                          />
                          <span
                            className={`text-sm ${
                              val === 'uygun'
                                ? 'text-green-700 dark:text-green-400'
                                : val === 'eksik'
                                ? 'text-red-700 dark:text-red-400'
                                : 'text-yellow-700 dark:text-yellow-400'
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
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 text-sm">
              Checklist kaydedilemedi. Lütfen tekrar deneyin.
            </div>
          )}

          <button
            onClick={handleChecklistKaydet}
            disabled={updateChecklistMutation.isPending || kalem.k_checklist.length === 0}
            className="w-full bg-accent text-white py-2.5 px-4 rounded-md hover:bg-accent-hover disabled:opacity-50 font-medium text-sm transition-colors"
          >
            {updateChecklistMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      {activeTab === 'belgeler' && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-primary">Belgeler</h2>

          {kalem.belge_listesi.length === 0 ? (
            <div className="p-6 bg-surface-overlay border border-border-default rounded-lg text-center text-muted text-sm">
              Bu kalem için belge listesi bulunmuyor.
            </div>
          ) : (
            <div className="border border-border-default rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-overlay border-b border-border-default">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                      Belge No
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                      Başlık
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                      Kategori
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                      Durum
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">
                      Not
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {kalem.belge_listesi.map((belge, idx) => (
                    <tr
                      key={belge.belge_no}
                      className={idx % 2 === 0 ? 'bg-surface-raised' : 'bg-surface-overlay'}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted">
                        {belge.belge_no}
                      </td>
                      <td className="px-4 py-3 text-primary">
                        {belge.baslik}
                        {belge.aciklama && (
                          <p className="text-xs text-muted mt-0.5">{belge.aciklama}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            belge.kategori === 'zorunlu'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                              : 'bg-surface-overlay text-secondary'
                          }`}
                        >
                          {belge.kategori === 'zorunlu' ? 'Zorunlu' : 'Destekleyici'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="px-2 py-1 border border-border-default rounded text-xs bg-surface-raised text-primary focus:outline-none focus:ring-1 focus:ring-accent"
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
                          className="w-full px-2 py-1 border border-border-default rounded text-xs bg-surface-raised text-primary placeholder-muted focus:outline-none focus:ring-1 focus:ring-accent"
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
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 text-sm">
              Belgeler kaydedilemedi. Lütfen tekrar deneyin.
            </div>
          )}

          <button
            onClick={handleBelgelerKaydet}
            disabled={updateBelgelerMutation.isPending || kalem.belge_listesi.length === 0}
            className="w-full bg-accent text-white py-2.5 px-4 rounded-md hover:bg-accent-hover disabled:opacity-50 font-medium text-sm transition-colors"
          >
            {updateBelgelerMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      )}

      {activeTab === 'muhasebe' && (
        <div className="p-6 bg-surface-overlay border border-border-default rounded-lg text-center text-muted text-sm">
          Bu sekme ileride doldurulacak.
        </div>
      )}
    </div>
  )
}
