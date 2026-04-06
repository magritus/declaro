import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import VeriGirisiForm from '@/components/VeriGirisiForm'
import ThemeToggle from '@/components/ThemeToggle'
import ChecklistTab from '@/components/kalem/ChecklistTab'
import BelgelerTab from '@/components/kalem/BelgelerTab'
import {
  useKalemSchema,
  useKalemVeri,
  useHesapla,
  useSaveVeri,
  useUpdateChecklist,
  useUpdateBelgeler,
} from '@/api/kalem'
import type { HesapSonucu, ChecklistDurum, BelgeDurum } from '@/api/kalem'

const ARA_ALAN_ETIKETLERI: Record<string, string> = {
  brut_kar_payi_tl: 'Brüt Kâr Payı (TL)',
  deger_farki: 'Değerleme Farkı',
  emisyon_primi_tutari: 'Emisyon Primi Tutarı',
  faaliyet_kari: 'Faaliyet Kârı',
  fiili_vergi_yuku_oran: 'Fiili Vergi Yükü Oranı',
  gsyf_toplam: 'GSYF Toplam Kazanç',
  gsyo_toplam: 'GSYO Toplam Kazanç',
  istisna_toplam: 'İstisna Toplamı',
  istisna_tutari: 'İstisna Tutarı',
  kapsam_ici_gelir: 'Kapsam İçi Gelir',
  kiyaslama_borcu: 'Örtülü Sermaye Kıyaslama Borcu',
  kkeg_faiz: 'KKEG Faiz Tutarı',
  kkeg_tutari: 'KKEG Tutarı',
  kur_farki_kazanci: 'Kur Farkı Kazancı',
  max_izin_verilen_borc: 'Azami İzin Verilen Borç',
  narge_carpili: 'Ar-Ge Oranı Uygulanmış Tutar',
  net_istisna: 'Net İstisna',
  net_istisna_tutari: 'Net İstisna Tutarı',
  net_portfoy_kazanci: 'Net Portföy Kazancı',
  net_sube_kazanci: 'Net Şube Kazancı',
  nexus_orani: 'NEXUS Oranı',
  oran_sayisal: 'Oran (Sayısal)',
  ortulu_kazanc: 'Örtülü Kazanç Tutarı',
  ortulu_sermaye: 'Örtülü Sermaye Tutarı',
  ortulu_sermaye_orani: 'Örtülü Sermaye Oranı',
  portfoy_ici_toplam: 'Portföy İçi Toplam',
  satis_kazanci: 'Satış Kazancı',
  urun_senedi_satis_kazanci: 'Ürün Senedi Satış Kazancı',
  vergiye_tabi_kisim: 'Vergiye Tabi Kısım',
  yonetim_kazanci: 'Yönetim Kazancı',
  yurtdisi_faaliyet_kazanci: 'Yurt Dışı Faaliyet Kazancı',
}

function araAlaniEtiketi(key: string): string {
  return ARA_ALAN_ETIKETLERI[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

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
  const { data: kalemVeri } = useKalemVeri(calismaId, icKod)

  useEffect(() => {
    if (kalemVeri?.k_checklist_durumu) {
      setChecklistDurum(kalemVeri.k_checklist_durumu)
    }
    if (kalemVeri?.belge_durumu) {
      setBelgeDurum(kalemVeri.belge_durumu)
    }
  }, [kalemVeri])
  const hesaplaMutation = useHesapla(calismaId, icKod)
  const saveVeriMutation = useSaveVeri(calismaId, icKod)
  const updateChecklistMutation = useUpdateChecklist(calismaId, icKod)
  const updateBelgelerMutation = useUpdateBelgeler(calismaId, icKod)

  const handleVeriSubmit = async (data: Record<string, unknown>) => {
    try {
      const sonuc = await hesaplaMutation.mutateAsync(data)
      setHesapSonucu(sonuc)
      await saveVeriMutation.mutateAsync(data)
      setKayitMesaji('Veriler kaydedildi.')
      setTimeout(() => setKayitMesaji(null), 3000)
    } catch (err) {
      // Error displayed via hesaplaMutation.error / saveVeriMutation.error in UI
      console.error('Veri kaydetme hatası:', err)
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

  const handleChecklistChange = (id: string, value: 'uygun' | 'eksik' | 'risk') => {
    setChecklistDurum((prev) => ({ ...prev, [id]: value }))
  }

  const handleBelgeChange = (no: string, field: 'durum' | 'not', value: string) => {
    setBelgeDurum((prev) => ({
      ...prev,
      [no]: {
        durum: field === 'durum' ? (value as 'uygun' | 'eksik') : (prev[no]?.durum ?? 'eksik'),
        not: field === 'not' ? value : (prev[no]?.not ?? ''),
      },
    }))
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
        <>
          <VeriGirisiForm
            alanlar={kalem.hesaplama_sablonu.veri_girisi_alanlari}
            defaultValues={(kalemVeri?.girdi_verileri as Record<string, string | number | boolean | null>) ?? undefined}
            onSubmit={handleVeriSubmit}
            isLoading={hesaplaMutation.isPending || saveVeriMutation.isPending}
            hesapSonucu={hesapSonucu ?? (kalemVeri?.istisna_tutari != null ? {
              ic_kod: icKod ?? '',
              istisna_tutari: kalemVeri.istisna_tutari,
              ara_sonuclar: kalemVeri.ara_sonuclar ?? {},
              hatalar: [],
              uyarilar: [],
              aciklama: '',
            } : null)}
          />
          {hesaplaMutation.error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
              Hesaplama hatası: {hesaplaMutation.error instanceof Error ? hesaplaMutation.error.message : 'Bilinmeyen hata'}
            </div>
          )}
        </>
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
                        <span className="text-secondary">{araAlaniEtiketi(key)}</span>
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
        <>
          <ChecklistTab
            items={kalem.k_checklist}
            durum={checklistDurum}
            onChange={handleChecklistChange}
            onSave={handleChecklistKaydet}
            isSaving={updateChecklistMutation.isPending}
            kayitMesaji={kayitMesaji}
          />
          {updateChecklistMutation.isError && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 text-sm">
              Checklist kaydedilemedi. Lütfen tekrar deneyin.
            </div>
          )}
        </>
      )}

      {activeTab === 'belgeler' && (
        <>
          <BelgelerTab
            items={kalem.belge_listesi}
            durum={belgeDurum}
            onChange={handleBelgeChange}
            onSave={handleBelgelerKaydet}
            isSaving={updateBelgelerMutation.isPending}
            kayitMesaji={kayitMesaji}
          />
          {updateBelgelerMutation.isError && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 text-sm">
              Belgeler kaydedilemedi. Lütfen tekrar deneyin.
            </div>
          )}
        </>
      )}

      {activeTab === 'muhasebe' && (
        <div className="p-6 bg-surface-overlay border border-border-default rounded-lg text-center text-muted text-sm">
          Bu sekme ileride doldurulacak.
        </div>
      )}
    </div>
  )
}
