import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import VeriGirisiForm from '@/components/VeriGirisiForm'
import GYZVeriGirisi from '@/components/kalem/GYZVeriGirisi'
import { downloadWithAuth } from '@/lib/downloadWithAuth'
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
import { useCalisma, useIstekListesiGuncelle } from '@/api/calisma'

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
  // Yeni kalemler (401+) için ara sonuç etiketleri
  arge_indirimi_hesaplanan: 'Hesaplanan Ar-Ge İndirimi (TL)',
  azami_gsf: 'Azami Girişim Sermayesi Fonu (TL)',
  bagis_indirimi: 'Bağış İndirimi (TL)',
  bagis_kamu_toplam: 'Kamu Bağışı Toplam (TL)',
  bagis_kyd_vakif_toplam: 'KYD/Vakıf Bağışı Toplam (TL)',
  bagis_toplam: 'Toplam Bağış (TL)',
  cari_donem_indirim_hakki: 'Cari Dönem İndirim Hakkı (TL)',
  devreden_bakiye: 'Devreden İndirim Bakiyesi (TL)',
  devreden_sonraki_doneme: 'Sonraki Döneme Devreden İndirim (TL)',
  gsf_yukumlulugu: 'Girişim Sermayesi Fonu Yükümlülüğü (TL)',
  indirim_kamu: 'Kamu Bağışından Hesaplanan İndirim (TL)',
  indirim_kyd_vakif: 'KYD/Vakıf Bağışından Hesaplanan İndirim (TL)',
  indirim_orani: 'İndirim Oranı',
  kalan_ozkaynak_tavan: 'Kalan Özkaynak Tavanı (TL)',
  kullanilabilir_toplam_indirim: 'Kullanılabilir Toplam İndirim (TL)',
  max_kazanc_siniri: 'Azami Kazanç Sınırı (TL)',
  net_kazanc: 'Net Kazanç (TL)',
  nitelikli_ek: 'Nitelikli Personel Ek Oranı',
  nitelikli_ek_indirim: 'Nitelikli Personel Ek İndirimi (TL)',
  ortak_kazanci: 'Ortak Muamelelerinden Doğan Kazanç (TL)',
  ozkaynak_tavan: 'Özkaynak Tavanı (TL)',
  sponsorluk_indirimi: 'Sponsorluk İndirimi (TL)',
  stopaj_tutari: 'Stopaj Tutarı (TL)',
  temel_indirim: 'Temel İndirim (TL)',
  toplam_bagis: 'Toplam Bağış (TL)',
  toplam_indirim: 'Toplam İndirim (TL)',
  toplam_kullanilabilir: 'Toplam Kullanılabilir İndirim (TL)',
  toplam_sponsorluk: 'Toplam Sponsorluk (TL)',
  yillik_faiz: 'Yıllık Faiz Oranı',
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

function parseInstanceNo(ic_kod: string): number | null {
  const m = ic_kod?.match(/^.+_(\d+)$/)
  return m ? parseInt(m[1]) : null
}

function baseIcKod(ic_kod: string): string {
  const m = ic_kod?.match(/^(.+)_\d+$/)
  return m ? m[1] : ic_kod
}

export default function KalemSayfasi() {
  const { calismaId, icKod } = useParams<{ calismaId: string; icKod: string }>()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<Tab>('veri')
  const [hesapSonucu, setHesapSonucu] = useState<HesapSonucu | null>(null)
  const [checklistDurum, setChecklistDurum] = useState<ChecklistDurum>({})
  const [belgeDurum, setBelgeDurum] = useState<BelgeDurum>({})
  const [kayitMesaji, setKayitMesaji] = useState<string | null>(null)
  const [downloadHata, setDownloadHata] = useState<string | null>(null)

  const handleExcelIndir = async () => {
    setDownloadHata(null)
    try {
      await downloadWithAuth(
        `/api/calisma/${calismaId}/export/kalem/${icKod}`,
        `${icKod}.xlsx`,
      )
    } catch (e) {
      setDownloadHata(e instanceof Error ? e.message : 'İndirme başarısız')
    }
  }
  const kayitMesajiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: kalem, isLoading: schemaYukleniyor, error: schemaHata } = useKalemSchema(icKod)
  const { data: kalemVeri } = useKalemVeri(calismaId, icKod)
  const calismaIdNum = calismaId ? parseInt(calismaId) : undefined
  const { data: calisma } = useCalisma(calismaIdNum)
  const istekListesiGuncelle = useIstekListesiGuncelle(calismaIdNum)

  // coklu_instance: istek listesindeki tüm instance'ları bul
  const base = icKod ? baseIcKod(icKod) : ''
  const tumInstances = useMemo(() => {
    const liste: string[] = calisma?.istek_listesi ?? []
    // Include legacy base entry (no suffix) and suffixed entries
    return liste.filter((k) => {
      if (k === base) return true
      const m = k.match(/^(.+)_(\d+)$/)
      return m ? m[1] === base : false
    })
  }, [calisma?.istek_listesi, base])

  const ytbEkle = () => {
    const liste: string[] = calisma?.istek_listesi ?? []
    const nolar = tumInstances
      .map((k) => parseInstanceNo(k))
      .filter((n): n is number => n !== null)
    const yeniNo = nolar.length > 0 ? Math.max(...nolar) + 1 : tumInstances.length + 1
    const yeniKod = `${base}_${yeniNo}`
    istekListesiGuncelle.mutate([...liste, yeniKod], {
      onSuccess: () => navigate(`/calisma/${calismaId}/kalem/${yeniKod}`),
    })
  }

  const instanceKaldir = () => {
    if (!icKod || tumInstances.length <= 1) return
    const liste: string[] = calisma?.istek_listesi ?? []
    const yeni = liste.filter((k) => k !== icKod)
    // Navigate to first remaining instance
    const kalan = tumInstances.filter((k) => k !== icKod)
    istekListesiGuncelle.mutate(yeni, {
      onSuccess: () => navigate(`/calisma/${calismaId}/kalem/${kalan[0]}`),
    })
  }

  // Schema'daki varsayilan değerleri form default'larına ekle (kayıtlı veri varsa üzerine geçmez)
  const formDefaultValues = useMemo(() => {
    const schemaDefaults: Record<string, string | number | boolean | null> = {}
    if (kalem) {
      for (const alan of kalem.hesaplama_sablonu.veri_girisi_alanlari) {
        if (alan.varsayilan !== undefined && alan.varsayilan !== null) {
          schemaDefaults[alan.id] = alan.varsayilan as string | number | boolean | null
        }
      }
    }
    const saved = kalemVeri?.girdi_verileri as Record<string, string | number | boolean | null> | null
    return saved ? { ...schemaDefaults, ...saved } : (Object.keys(schemaDefaults).length > 0 ? schemaDefaults : undefined)
  }, [kalem, kalemVeri])

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

  const showKayitMesaji = (mesaj: string) => {
    if (kayitMesajiTimerRef.current) {
      clearTimeout(kayitMesajiTimerRef.current)
    }
    setKayitMesaji(mesaj)
    kayitMesajiTimerRef.current = setTimeout(() => setKayitMesaji(null), 3000)
  }

  useEffect(() => {
    return () => {
      if (kayitMesajiTimerRef.current) {
        clearTimeout(kayitMesajiTimerRef.current)
      }
    }
  }, [])

  const handleVeriSubmit = async (data: Record<string, unknown>) => {
    try {
      const sonuc = await hesaplaMutation.mutateAsync(data)
      setHesapSonucu(sonuc)
      await saveVeriMutation.mutateAsync(data)
      showKayitMesaji('Veriler kaydedildi.')
    } catch {
      // Error displayed via hesaplaMutation.error / saveVeriMutation.error in UI
    }
  }

  const handleChecklistKaydet = async () => {
    try {
      await updateChecklistMutation.mutateAsync(checklistDurum)
      showKayitMesaji('K-Checklist kaydedildi.')
    } catch {
      // mutasyon hatası gösterilir
    }
  }

  const handleBelgelerKaydet = async () => {
    try {
      await updateBelgelerMutation.mutateAsync(belgeDurum)
      showKayitMesaji('Belgeler kaydedildi.')
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
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2 flex-wrap">
            {kalem.baslik}
            {icKod && parseInstanceNo(icKod) !== null && (
              <span className="text-base font-semibold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                #{parseInstanceNo(icKod)}
              </span>
            )}
          </h1>
          {kalem.kisa_aciklama && (
            <p className="text-muted mt-1 text-sm">{kalem.kisa_aciklama}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => navigate(`/calisma/${calismaId}/istek-listesi`)}
            className="border border-border-default text-secondary px-3 py-1.5 rounded text-sm hover:bg-surface-raised flex items-center gap-1 transition-colors"
          >
            ← İstek Listesi
          </button>
          <button
            onClick={handleExcelIndir}
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

      {/* coklu_instance: instance navigasyon + ekle/kaldır */}
      {kalem.coklu_instance && (
        <div className="mb-5 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mr-1">YTB Listesi:</span>
          {tumInstances.map((k, i) => {
            const no = parseInstanceNo(k) ?? (i + 1)
            const aktif = k === icKod
            return (
              <button
                key={k}
                onClick={() => navigate(`/calisma/${calismaId}/kalem/${k}`)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  aktif
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800'
                }`}
              >
                YTB {no}
              </button>
            )
          })}
          <button
            onClick={ytbEkle}
            disabled={istekListesiGuncelle.isPending}
            className="px-2.5 py-1 rounded text-xs font-semibold border border-dashed border-blue-400 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors ml-1"
          >
            {istekListesiGuncelle.isPending ? '…' : '+ Yeni YTB Ekle'}
          </button>
          {tumInstances.length > 1 && (
            <button
              onClick={instanceKaldir}
              disabled={istekListesiGuncelle.isPending}
              className="ml-auto text-xs text-red-500 hover:text-red-700 border border-transparent hover:border-red-300 px-2 py-1 rounded transition-colors"
              title="Bu YTB'yi kaldır"
            >
              Bu YTB'yi Kaldır
            </button>
          )}
        </div>
      )}

      {/* Başarı mesajı */}
      {kayitMesaji && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md text-green-700 dark:text-green-300 text-sm">
          {kayitMesaji}
        </div>
      )}

      {/* Download hata */}
      {downloadHata && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 text-sm">
          {downloadHata}
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
          {icKod === 'gecmis_yil_zarari_mahsubu' ? (
            <GYZVeriGirisi
              defaultValues={formDefaultValues}
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
          ) : (
            <VeriGirisiForm
              alanlar={kalem.hesaplama_sablonu.veri_girisi_alanlari}
              defaultValues={formDefaultValues}
              onSubmit={handleVeriSubmit}
              isLoading={hesaplaMutation.isPending || saveVeriMutation.isPending}
              ticariKarZarar={calisma?.ticari_kar_zarar ?? null}
              hesapSonucu={hesapSonucu ?? (kalemVeri?.istisna_tutari != null ? {
                ic_kod: icKod ?? '',
                istisna_tutari: kalemVeri.istisna_tutari,
                ara_sonuclar: kalemVeri.ara_sonuclar ?? {},
                hatalar: [],
                uyarilar: [],
                aciklama: '',
              } : null)}
            />
          )}
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
