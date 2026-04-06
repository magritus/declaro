import { useForm } from 'react-hook-form'
import type { VeriGirisiAlani, HesapSonucu } from '@/api/kalem'

// Human-readable labels for snake_case option values
const SECENEK_ETIKETLERI: Record<string, string> = {
  // Gelir türü (298 GSYF/GSYO)
  kar_payi_dagitim: 'Kâr Payı / Temettü Dağıtımı',
  fona_iade_kazanci: 'Fona İade Kazancı (Katılma Payı)',
  ucuncu_kisi_satis: 'Üçüncü Kişiye Hisse Satışı',
  vuk279_deger_artisi: 'VUK Madde 279 Değer Artışı',
  // Kurum türü (321 Banka/FK)
  banka_5411: 'Banka (5411 sayılı Bankacılık Kanunu)',
  finansal_kiralama_6361: 'Finansal Kiralama Şirketi (6361 s.K.)',
  finansal_sirket_6361: 'Finansman / Faktoring Şirketi (6361 s.K.)',
  tmsf: 'TMSF (Tasarruf Mevduatı Sigorta Fonu)',
  // Varlık türü (321 satış kalemi)
  tasinmaz: 'Taşınmaz (Gayrimenkul)',
  istirak_hissesi: 'İştirak Hissesi / Pay Senedi',
  tasinir_varlik: 'Taşınır Varlık (Makine, Teçhizat vb.)',
  kurucu_intifa_senedi: 'Kurucu / İntifa Senedi',
  ruchan_hakki: 'Rüçhan Hakkı',
  // Serbest bölge rejimi
  rejim_1_2004_oncesi: 'Rejim 1 — 06.02.2004 öncesi ruhsat (tam istisna)',
  rejim_2_2004_sonrasi: 'Rejim 2 — 06.02.2004 sonrası ruhsat (imalat + yurt dışı)',
  // Eğitim kurumu türü
  okul: 'Özel Okul (Okul öncesi, İlk/Orta/Lise)',
  kres_gunduz_bakim: 'Kreş / Gündüz Bakımevi',
  rehabilitasyon: 'Özel Rehabilitasyon Merkezi',
  // Ortulu sermaye karşı taraf durumu
  kar_ve_vergi_odedi: 'Kâr etti ve vergi ödedi — istisna güvenli',
  zarar_etti_vergi_odemedi: 'Zarar etti / vergi ödemedi — yüksek risk',
  donem_icinde_kkeg_yapildi: 'Dönem içinde KKEG yapıldı — istisna uygulanabilir',
  // Transfer fiyatlandırması taraf
  yurt_ici: 'Yurt içi ilişkili taraf',
  yurt_disi: 'Yurt dışı ilişkili taraf',
  // Transfer fiyatlandırması düzeltme
  kesinlesti_ve_odendi: 'Düzeltme kesinleşti ve ödendi',
  odenmedi_beklemede: 'Ödenmedi / beklemede — istisna uygulanamaz',
  hayir_odenmedi: 'Hayır, ödenmedi — istisna uygulanamaz',
}

function secenekEtiketi(value: string): string {
  return SECENEK_ETIKETLERI[value] ?? value
}

// Human-readable labels for snake_case formula/intermediate result keys
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

type FormFieldValue = string | number | boolean | null
type FormValues = Record<string, FormFieldValue>

interface VeriGirisiFormProps {
  alanlar: VeriGirisiAlani[]
  defaultValues?: FormValues
  onSubmit: (data: FormValues) => void
  isLoading?: boolean
  hesapSonucu?: HesapSonucu | null
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(value)
}

export default function VeriGirisiForm({
  alanlar,
  defaultValues,
  onSubmit,
  isLoading = false,
  hesapSonucu,
}: VeriGirisiFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: defaultValues ?? {},
  })

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {alanlar.map((alan) => (
          <div key={alan.id} className="space-y-1">
            <label className="block text-sm font-medium text-secondary">
              {alan.etiket}
              {alan.zorunlu && <span className="ml-1 text-red-500">*</span>}
            </label>

            {alan.yardim && (
              <p className="text-xs text-muted">{alan.yardim}</p>
            )}

            {alan.tip === 'para' && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₺</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  className={`w-full pl-8 pr-3 py-2 border rounded-md text-sm bg-surface-raised text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent ${
                    errors[alan.id] ? 'border-red-400' : 'border-border-default'
                  }`}
                  {...register(alan.id, {
                    required: alan.zorunlu ? `${alan.etiket} zorunludur` : false,
                    valueAsNumber: true,
                  })}
                />
              </div>
            )}

            {alan.tip === 'sayi' && (
              <input
                type="number"
                step="1"
                className={`w-full px-3 py-2 border rounded-md text-sm bg-surface-raised text-primary focus:outline-none focus:ring-2 focus:ring-accent ${
                  errors[alan.id] ? 'border-red-400' : 'border-border-default'
                }`}
                {...register(alan.id, {
                  required: alan.zorunlu ? `${alan.etiket} zorunludur` : false,
                  valueAsNumber: true,
                })}
              />
            )}

            {alan.tip === 'tarih' && (
              <input
                type="date"
                className={`w-full px-3 py-2 border rounded-md text-sm bg-surface-raised text-primary focus:outline-none focus:ring-2 focus:ring-accent ${
                  errors[alan.id] ? 'border-red-400' : 'border-border-default'
                }`}
                {...register(alan.id, {
                  required: alan.zorunlu ? `${alan.etiket} zorunludur` : false,
                })}
              />
            )}

            {alan.tip === 'metin' && (
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-md text-sm bg-surface-raised text-primary focus:outline-none focus:ring-2 focus:ring-accent ${
                  errors[alan.id] ? 'border-red-400' : 'border-border-default'
                }`}
                {...register(alan.id, {
                  required: alan.zorunlu ? `${alan.etiket} zorunludur` : false,
                })}
              />
            )}

            {alan.tip === 'secenek' && (
              <select
                className={`w-full px-3 py-2 border rounded-md text-sm bg-surface-raised text-primary focus:outline-none focus:ring-2 focus:ring-accent ${
                  errors[alan.id] ? 'border-red-400' : 'border-border-default'
                }`}
                {...register(alan.id, {
                  required: alan.zorunlu ? `${alan.etiket} zorunludur` : false,
                })}
              >
                <option value="">Seçiniz...</option>
                {(alan.secenekler ?? []).map((sec) => (
                  <option key={sec} value={sec}>
                    {secenekEtiketi(sec)}
                  </option>
                ))}
              </select>
            )}

            {alan.tip === 'evet_hayir' && (
              <div className="flex gap-6">
                {['evet', 'hayir'].map((val) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={val}
                      className="accent-accent"
                      {...register(alan.id, {
                        required: alan.zorunlu ? `${alan.etiket} zorunludur` : false,
                      })}
                    />
                    <span className="text-sm text-primary">{val === 'evet' ? 'Evet' : 'Hayır'}</span>
                  </label>
                ))}
              </div>
            )}

            {errors[alan.id] && (
              <p className="text-xs text-red-500">
                {errors[alan.id]?.message as string}
              </p>
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-accent text-white py-2.5 px-4 rounded-md hover:bg-accent-hover disabled:opacity-50 font-medium text-sm transition-colors"
        >
          {isLoading ? 'Hesaplanıyor...' : 'Hesapla ve Kaydet'}
        </button>
      </form>

      {hesapSonucu && (
        <div className="space-y-3 pt-2">
          {hesapSonucu.hatalar.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">Hatalar</p>
              <ul className="list-disc list-inside space-y-1">
                {hesapSonucu.hatalar.map((h, i) => (
                  <li key={i} className="text-sm text-red-600 dark:text-red-400">
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hesapSonucu.uyarilar.length > 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-1">Uyarılar</p>
              <ul className="list-disc list-inside space-y-1">
                {hesapSonucu.uyarilar.map((u, i) => (
                  <li key={i} className="text-sm text-yellow-700 dark:text-yellow-400">
                    {u}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">Hesap Sonucu</p>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-green-800 dark:text-green-300 font-medium">İstisna Tutarı</span>
              <span className="text-lg font-bold text-green-700 dark:text-green-300">
                {formatCurrency(hesapSonucu.istisna_tutari)}
              </span>
            </div>

            {Object.keys(hesapSonucu.ara_sonuclar).length > 0 && (
              <div className="border-t border-green-200 dark:border-green-800 pt-2 mt-2 space-y-1">
                <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Ara Sonuçlar</p>
                {Object.entries(hesapSonucu.ara_sonuclar).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-xs text-green-700 dark:text-green-400">
                    <span>{araAlaniEtiketi(key)}</span>
                    <span>{formatCurrency(val)}</span>
                  </div>
                ))}
              </div>
            )}

            {hesapSonucu.aciklama && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2 border-t border-green-200 dark:border-green-800 pt-2">
                {hesapSonucu.aciklama}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
