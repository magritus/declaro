import { useForm, Controller, FormProvider, useWatch } from 'react-hook-form'
import type { VeriGirisiAlani, HesapSonucu } from '@/api/kalem'
import { NumberInput } from '@/components/NumberInput'
import MatrisInput from '@/components/MatrisInput'

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

// Kept for potential future use; secenekler now carry their own etiket from the API
function _secenekEtiketi(value: string): string {
  return SECENEK_ETIKETLERI[value] ?? value
}
void _secenekEtiketi // suppress unused warning

// Human-readable labels for snake_case formula/intermediate result keys
const ARA_ALAN_ETIKETLERI: Record<string, string> = {
  brut_kar_payi_tl: 'Brüt Kâr Payı (TL)',
  deger_farki: 'Değerleme Farkı',
  emisyon_primi_tutari: 'Emisyon Primi Tutarı',
  faaliyet_kari_ozet: 'Faaliyet Kârı',
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
  // Yatırım teşvikleri (500-502) ara sonuç etiketleri
  ytb_no: 'YTB Numarası',
  ytb_tarihi: 'YTB Düzenleme Tarihi',
  yatirim_bolgesi: 'Yatırım Bölgesi',
  yatirim_turu: 'Yatırım Türü',
  yatirim_tutari: 'Toplam Yatırım Tutarı (TL)',
  ykt_orani: 'YKT Oranı (%)',
  vergi_indirim_orani: 'Vergi İndirim Oranı (%)',
  donem_durumu: 'Dönem Durumu',
  bolge_yuzde_limiti: 'Bölge Yüzde Limiti (%)',
  kumulatif_yatirim_harcamasi: 'Kümülatif Yatırım Harcaması (TL)',
  onceki_donem_kumulatif_ykt: 'Önceki Dönem Kümülatif YKT Kullanımı (TL)',
  beyan_edilen_diger_kazanc: 'Beyan Edilen Diğer Faaliyet Kazancı (TL)',
  beyan_edilen_yatirim_kazanci: 'Beyan Edilen Yatırım Kazancı (TL)',
  sanayi_sicil_no: 'Sanayi Sicil Belge No',
  sanayi_sicil_tarihi: 'Sanayi Sicil Belge Tarihi',
  imalat_kazanc_matrahi: 'İmalat Faaliyeti Kazanç Matrahı (TL)',
  toplam_matrah: 'Dönem Toplam KV Matrahı (TL)',
  normal_kv_orani: 'Normal KV Oranı (%)',
  matrah_belirleme_yontemi: 'Matrah Belirleme Yöntemi',
  ihracat_hasilati: 'İhracat Hasılatı (TL)',
  toplam_hasilat: 'Toplam Hasılat (TL)',
  ihracat_orani: 'İhracat Oranı (% - opsiyonel)',
  ihracat_kazanc_matrahi: 'İhracat Faaliyeti Kazanç Matrahı (TL)',
  kv_tasarrufu: 'KV Tasarrufu (TL)',
  devreden_ykt: 'Devreden YKT (TL)',
  indirimli_matrah: 'İndirimli Matrah (TL)',
  ykt: 'Yatırıma Katkı Tutarı (YKT)',

  // 503 KVK 32/7+32/8 Birleşik Gelir Tablosu ara sonuçları
  brut_satis_ihracat: 'Brüt Satışlar — İhracat Payı (TL)',
  brut_satis_imalat: 'Brüt Satışlar — İmalat Payı (TL)',
  brut_satis_toplam: 'Brüt Satışlar Toplamı (TL)',
  net_satis_ihracat: 'Net Satışlar — İhracat Payı (TL)',
  net_satis_imalat: 'Net Satışlar — İmalat Payı (TL)',
  net_satis_toplam: 'Net Satışlar Toplamı (TL)',
  ihracat_hasilat_orani: 'İhracat Hasılat Oranı',
  imalat_hasilat_orani: 'İmalat Hasılat Oranı',
  brut_satis_kari: 'Brüt Satış Karı (TL)',
  faaliyet_kari: 'Faaliyet Karı (TL)',
  donem_kari: 'Dönem Karı / Ticari Bilanço Karı (TL)',
  kv_matrahi: 'KV Matrahı — Safi Kurum Kazancı (TL)',
  ihracat_matrahi: 'İhracat Faaliyeti KV Matrahı (TL)',
  imalat_matrahi: 'İmalat Faaliyeti KV Matrahı (TL)',
  diger_matrahi: 'Diğer Faaliyetler KV Matrahı (TL)',
  kv_32_7_normal: '32/7 — Normal KV (TL)',
  kv_32_7_indirim: '32/7 — 1 Puan İndirim Tutarı (TL)',
  kv_32_7_indirimli: '32/7 — İndirimli KV %24 (TL)',
  kv_tasarrufu_32_7: '32/7 İmalat KV Tasarrufu (TL)',
  kv_32_8_normal: '32/8 — Normal KV (TL)',
  kv_32_8_indirim: '32/8 — 5 Puan İndirim Tutarı (TL)',
  kv_32_8_indirimli: '32/8 — İndirimli KV %20 (TL)',
  kv_tasarrufu_32_8: '32/8 İhracat KV Tasarrufu (TL)',
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
  ticariKarZarar?: number | null
}

function UzlastirmaKarti({
  kaynakAlan,
  ticariKarZarar,
  yardim,
}: {
  kaynakAlan: string
  ticariKarZarar: number | null | undefined
  yardim?: string
}) {
  const donemKari = useWatch({ name: `${kaynakAlan}_toplam` }) as number | undefined
  const dk = Number(donemKari) || 0
  const tk = Number(ticariKarZarar) || 0
  const fark = dk - tk
  const farkYuzde = tk !== 0 ? Math.abs(fark / tk) * 100 : null
  const uyumlu = Math.abs(fark) < 1

  const durumRenk = uyumlu
    ? 'border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-700'
    : Math.abs(fark) < 1000
      ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-700'
      : 'border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-700'

  const fmt = (v: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(v)

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${durumRenk}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-primary">Dönem Kârı — Ticari Bilanço Kârı Uyumu</h4>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            uyumlu
              ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
              : Math.abs(fark) < 1000
                ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                : 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
          }`}
        >
          {uyumlu ? '✓ Uyumlu' : '⚠ Uyumsuz'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm">
        <div className="flex justify-between items-center py-1 border-b border-current/10">
          <span className="text-secondary">Gelir Tablosu — Dönem Kârı</span>
          <span className="font-mono font-semibold text-primary">{fmt(dk)}</span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-current/10">
          <span className="text-secondary">Sistemdeki Ticari Bilanço Kârı</span>
          <span className="font-mono font-semibold text-primary">
            {ticariKarZarar != null ? fmt(tk) : <span className="text-muted italic">Girilmemiş</span>}
          </span>
        </div>
        {!uyumlu && (
          <div className="flex justify-between items-center py-1">
            <span className="text-secondary font-medium">Fark (Dönem Kârı − Ticari Kar)</span>
            <span className={`font-mono font-bold ${fark > 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {fark > 0 ? '+' : ''}{fmt(fark)}
              {farkYuzde != null && (
                <span className="ml-1 text-xs font-normal opacity-70">(%{farkYuzde.toFixed(1)})</span>
              )}
            </span>
          </div>
        )}
      </div>

      {!uyumlu && (
        <p className="text-xs text-muted mt-1">
          Fark; kayıt dışı kalemler, KKEG, ertelenmiş vergi ya da geçici farklar nedeniyle oluşuyor olabilir.
          Hesaplama doğruluğu için tutarların uyumlu olması önerilir.
        </p>
      )}
      {yardim && uyumlu && (
        <p className="text-xs text-muted">{yardim}</p>
      )}
    </div>
  )
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
  ticariKarZarar,
}: VeriGirisiFormProps) {
  const methods = useForm<FormValues>({
    defaultValues: defaultValues ?? {},
  })
  const { register, control, handleSubmit, formState: { errors } } = methods

  return (
    <FormProvider {...methods}>
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {alanlar.map((alan) => {
          // Section header — not a form input
          if (alan.tip === 'bolum') {
            return (
              <div key={alan.id} className="pt-3 pb-1 border-b border-accent/30 mt-2">
                <h4 className="text-xs font-bold text-accent uppercase tracking-widest">
                  {alan.etiket}
                </h4>
              </div>
            )
          }

          if (alan.tip === 'matris') {
            return (
              <div key={alan.id} className="space-y-1">
                <label className="block text-sm font-medium text-secondary">{alan.etiket}</label>
                {alan.yardim && <p className="text-xs text-muted">{alan.yardim}</p>}
                <MatrisInput
                  alanId={alan.id}
                  satirlar={alan.satirlar ?? []}
                  sutunlar={alan.sutunlar ?? []}
                />
              </div>
            )
          }

          if (alan.tip === 'uzlastirma') {
            return (
              <UzlastirmaKarti
                key={alan.id}
                kaynakAlan={alan.kaynak_alan ?? 'ara_donem_kari'}
                ticariKarZarar={ticariKarZarar}
                yardim={alan.yardim}
              />
            )
          }

          return (
          <div key={alan.id} className="space-y-1">
            <label className="block text-sm font-medium text-secondary">
              {alan.etiket}
              {alan.zorunlu && <span className="ml-1 text-red-500">*</span>}
            </label>

            {alan.yardim && (
              alan.tip === 'secenek' ? (
                <div className="rounded-md bg-surface-raised border border-border-default p-3 space-y-1.5">
                  {alan.yardim.trim().split('\n').filter(Boolean).map((line, i) => (
                    <p key={i} className="text-xs text-secondary leading-relaxed">{line.trim()}</p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted">{alan.yardim}</p>
              )
            )}

            {alan.tip === 'para' && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₺</span>
                <Controller
                  name={alan.id}
                  control={control}
                  rules={{ required: alan.zorunlu ? `${alan.etiket} zorunludur` : false }}
                  render={({ field }) => (
                    <NumberInput
                      value={field.value as number | null}
                      onChange={(v) => field.onChange(v ?? 0)}
                      onBlur={field.onBlur}
                      className={`w-full pl-8 pr-3 py-2 border rounded-md text-sm bg-surface-raised text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent ${
                        errors[alan.id] ? 'border-red-400' : 'border-border-default'
                      }`}
                    />
                  )}
                />
              </div>
            )}

            {alan.tip === 'sayi' && (
              <Controller
                name={alan.id}
                control={control}
                rules={{ required: alan.zorunlu ? `${alan.etiket} zorunludur` : false }}
                render={({ field }) => (
                  <NumberInput
                    value={field.value as number | null}
                    onChange={(v) => field.onChange(v ?? 0)}
                    onBlur={field.onBlur}
                    className={`w-full px-3 py-2 border rounded-md text-sm bg-surface-raised text-primary focus:outline-none focus:ring-2 focus:ring-accent ${
                      errors[alan.id] ? 'border-red-400' : 'border-border-default'
                    }`}
                  />
                )}
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
                  <option key={sec.deger} value={sec.deger}>
                    {sec.etiket}
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
          )
        })}

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
    </FormProvider>
  )
}
