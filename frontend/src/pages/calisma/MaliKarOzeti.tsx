import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCalisma, useTamamla, useYenidenAc } from '@/api/calisma'
import { usePipeline, type PipelineSonucu } from '@/api/pipeline'
import { useKatalogKalemler, type KatalogKalem } from '@/api/kalem'
import { downloadWithAuth } from '@/lib/downloadWithAuth'

function formatTRY(value: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value)
}

const KATEGORI_BASLIKLAR: Record<string, string> = {
  kkeg: 'İlaveler',
  enflasyon_duzeltmesi: 'Enflasyon Düzeltmesi Farklarından İlaveler',
  gecmis_yil_zararlari: 'Geçmiş Yıl Zararları Mahsubu',
  istirak_kazanc_istisnalari: 'İştirak Kazancı İstisnaları',
  portfoy_isletmeciligi: 'Portföy İşletmeciliği',
  serbest_bolge_tgb_istisnalari: 'Serbest Bölge ve TGB İstisnaları',
  yurtdisi_istisnalar: 'Yurtdışı Faaliyet İstisnaları',
  doviz_alacak_istisnalari: 'Döviz/Altın Hesabı Dönüşüm İstisnaları',
  varlik_satis_istisnalari: 'Varlık Satış ve Finansman İstisnaları',
  ar_ge_istisna: 'Ar-Ge ve Sınai Mülkiyet Hakları İstisnası',
  egitim_saglik_istisnalari: 'Eğitim, Öğretim ve Rehabilitasyon İstisnası',
  diger_istisnalar: 'Diğer İndirim ve İstisnalar',
  arge_tasarim_indirimleri: 'Ar-Ge, Tasarım ve Teknogirişim İndirimleri',
  arge_indirimleri: 'Ar-Ge İndirimleri',
  bagis_yardim_sponsorluk: 'Bağış, Yardım ve Sponsorluk',
  bagis_yardim_indirimleri: 'Bağış ve Yardım İndirimleri',
  sponsorluk_indirimi: 'Sponsorluk Harcaması İndirimi',
  yatirim_tesvikleri: 'Yatırım Teşvikleri ve Özel İndirimler',
  yatirim_indirimi: 'Yatırım İndirimi (GVK Geçici Md.61)',
  nakdi_sermaye_indirimi: 'Nakdi Sermaye Artırımı Faiz İndirimi',
  hizmet_indirimleri: 'Risturn ve Korumalı İşyeri İndirimi',
  saglik_egitim_hizmet_indirimi: 'Sağlık ve Eğitim Hizmeti İndirimi',
  risturn_ve_saglik_indirimleri: 'Risturn ve Sağlık/Eğitim İndirimi',
  diger_indirimler: 'Diğer İndirimler',
  diger_indirimler_alt: 'Diğer Özel İndirimler',
  vergi_indirimleri: 'Hesaplanan Vergi İndirimleri',
}

interface BolumMeta {
  baslik: string
  isaret: '+' | '−'
  borderColor: string
  bgColor: string
  textColor: string
}

const BOLUM_META: Record<string, BolumMeta> = {
  ilave: {
    baslik: 'İlaveler',
    isaret: '+',
    borderColor: 'border-amber-200 dark:border-amber-800',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    textColor: 'text-amber-800 dark:text-amber-200',
  },
  zarar_olsa_dahi: {
    baslik: 'Zarar Olsa Dahi İndirilecekler',
    isaret: '−',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    textColor: 'text-emerald-800 dark:text-emerald-200',
  },
  gecmis_yil_zarari: {
    baslik: 'Geçmiş Yıl Zarar Mahsubu',
    isaret: '−',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950',
    textColor: 'text-indigo-800 dark:text-indigo-200',
  },
  kazanc_varsa: {
    baslik: 'Kazanç Varsa İndirilecekler',
    isaret: '−',
    borderColor: 'border-blue-200 dark:border-blue-800',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    textColor: 'text-blue-800 dark:text-blue-200',
  },
  hesaplanan_kv_indirimi: {
    baslik: 'Hesaplanan Vergi İndirimleri',
    isaret: '−',
    borderColor: 'border-violet-200 dark:border-violet-800',
    bgColor: 'bg-violet-50 dark:bg-violet-950',
    textColor: 'text-violet-800 dark:text-violet-200',
  },
}

const BOLUM_ORDER = ['ilave', 'zarar_olsa_dahi', 'gecmis_yil_zarari', 'kazanc_varsa', 'hesaplanan_kv_indirimi']

type KalemSonucEntry = { istisna_tutari: number; hatalar: string[]; uyarilar: string[]; aciklama: string }

interface GrupEntry {
  kalem: KatalogKalem
  sonuc: KalemSonucEntry
  icKod: string  // actual ic_kod (may be _N variant)
}

function parseBase(icKod: string): string {
  const m = icKod.match(/^(.+)_(\d+)$/)
  return m ? m[1] : icKod
}

interface BolumSectionProps {
  meta: BolumMeta
  kategoriler: Record<string, GrupEntry[]>
  calismaId: string
}

function BolumSection({ meta, kategoriler, calismaId }: BolumSectionProps) {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const bolumToplam = Object.values(kategoriler).flat().reduce(
    (sum, { sonuc }) => sum + (sonuc.hatalar.length === 0 ? sonuc.istisna_tutari : 0),
    0
  )

  return (
    <div className={`border rounded-xl overflow-hidden ${meta.borderColor}`}>
      {/* Section header */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={`w-full flex items-center justify-between px-5 py-3 ${meta.bgColor} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${meta.textColor}`}>
            {meta.isaret === '+' ? '(+)' : '(−)'}
          </span>
          <span className={`font-semibold ${meta.textColor}`}>{meta.baslik}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${meta.textColor}`}>{formatTRY(bolumToplam)}</span>
          <span className={`text-xs ${meta.textColor} opacity-60`}>{collapsed ? '▼' : '▲'}</span>
        </div>
      </button>

      {!collapsed && (
        <div className="divide-y divide-border-subtle">
          {Object.entries(kategoriler).map(([kat, entries]) => {
            const katToplam = entries.reduce(
              (sum, { sonuc }) => sum + (sonuc.hatalar.length === 0 ? sonuc.istisna_tutari : 0),
              0
            )
            return (
              <div key={kat} className="bg-surface-raised">
                {/* Category subheader */}
                <div className="flex items-center justify-between px-5 py-2 bg-surface-overlay">
                  <span className="text-xs font-semibold text-secondary uppercase tracking-wide">
                    {KATEGORI_BASLIKLAR[kat] ?? kat}
                  </span>
                  <span className="text-xs font-semibold text-secondary">{formatTRY(katToplam)}</span>
                </div>

                {/* Individual kalemler */}
                {entries.map(({ kalem, sonuc, icKod }) => {
                  const temiz = sonuc.hatalar.length === 0 && sonuc.uyarilar.length === 0
                  const hataVar = sonuc.hatalar.length > 0

                  // Beyanname kodu badge
                  const kodlar = kalem.beyanname_kodlari && kalem.beyanname_kodlari.length > 0
                    ? [...new Set(kalem.beyanname_kodlari.map((b) => b.kod))].join('/')
                    : null
                  const refLabel = kodlar ? `Satır ${kodlar}` : kalem.dahili_ref ? kalem.dahili_ref : null

                  return (
                    <div
                      key={icKod}
                      className={`flex items-center gap-3 px-5 py-3 hover:bg-surface-overlay cursor-pointer transition-colors group ${
                        hataVar ? 'opacity-60' : ''
                      }`}
                      onClick={() => navigate(`/calisma/${calismaId}/kalem/${icKod}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-primary">{kalem.baslik}</span>
                          {refLabel && (
                            <span className="text-xs font-mono text-muted bg-surface-overlay border border-border-default px-1.5 py-0.5 rounded">
                              {refLabel}
                            </span>
                          )}
                          {sonuc.hatalar.length > 0 && (
                            <span className="text-xs bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded font-medium">
                              {sonuc.hatalar.length} Hata
                            </span>
                          )}
                          {sonuc.uyarilar.length > 0 && (
                            <span className="text-xs bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-medium">
                              {sonuc.uyarilar.length} Uyarı
                            </span>
                          )}
                          {temiz && (
                            <span className="text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded font-medium">
                              ✓
                            </span>
                          )}
                        </div>
                        {sonuc.aciklama && (
                          <p className="text-xs text-muted mt-0.5">{sonuc.aciklama}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-sm font-semibold ${hataVar ? 'text-muted line-through' : 'text-primary'}`}>
                          {formatTRY(sonuc.istisna_tutari)}
                        </span>
                        <span className="text-muted group-hover:text-accent transition-colors text-sm">→</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface SonucKartProps {
  baslik: string
  deger: number
  badge?: string
  highlighted?: boolean
  sub?: string
}

function SonucKart({ baslik, deger, badge, highlighted, sub }: SonucKartProps) {
  if (highlighted) {
    return (
      <div className="bg-accent text-white rounded-xl p-5 shadow-sm">
        <p className="text-sm font-medium opacity-80">{baslik}</p>
        <p className="text-2xl font-bold mt-1">{formatTRY(deger)}</p>
        {badge && (
          <span className="inline-block mt-2 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
    )
  }
  return (
    <div className="bg-surface-raised border border-border-default rounded-xl p-5 shadow-sm">
      <p className="text-sm font-medium text-muted">{baslik}</p>
      <p className="text-xl font-bold text-primary mt-1">{formatTRY(deger)}</p>
      {badge && (
        <span className="inline-block mt-2 text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
          {badge}
        </span>
      )}
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  )
}

export default function MaliKarOzeti() {
  const { calismaId } = useParams<{ calismaId: string }>()
  const navigate = useNavigate()
  const calismaIdNum = calismaId ? Number(calismaId) : undefined
  const { data: calisma } = useCalisma(calismaIdNum)
  const pipeline = usePipeline(calismaId)
  const tamamla = useTamamla(calismaIdNum)
  const yenidenAc = useYenidenAc(calismaIdNum)
  const { data: katalogKalemler = [] } = useKatalogKalemler()
  const [downloadHata, setDownloadHata] = useState<string | null>(null)
  const [adimlarAcik, setAdimlarAcik] = useState(false)

  const katalogMap = useMemo(
    () => Object.fromEntries(katalogKalemler.map((k) => [k.ic_kod, k])),
    [katalogKalemler]
  )

  // Group pipeline kalemler by beyanname_bolumu → ana_kategori
  const gruplarByBolum = useMemo(() => {
    const sonuc = pipeline.data
    if (!sonuc) return {} as Record<string, Record<string, GrupEntry[]>>

    const result: Record<string, Record<string, GrupEntry[]>> = {}

    for (const [icKod, kalemSonuc] of Object.entries(sonuc.kalemler)) {
      const base = parseBase(icKod)
      const katalogKalem = katalogMap[icKod] ?? katalogMap[base]
      if (!katalogKalem) continue

      const bolum = katalogKalem.beyanname_bolumu
      const kat = katalogKalem.ana_kategori

      if (!result[bolum]) result[bolum] = {}
      if (!result[bolum][kat]) result[bolum][kat] = []
      result[bolum][kat].push({ kalem: katalogKalem, sonuc: kalemSonuc, icKod })
    }

    return result
  }, [pipeline.data, katalogMap])

  const handleOzetIndir = async () => {
    setDownloadHata(null)
    try {
      await downloadWithAuth(`/api/calisma/${calismaId}/export/ozet`, 'ozet.xlsx')
    } catch (e) {
      setDownloadHata(e instanceof Error ? e.message : 'İndirme hatası')
    }
  }

  const sonuc: PipelineSonucu | undefined = pipeline.data

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => navigate(`/calisma/${calismaId}/istek-listesi`)}
              className="text-sm text-muted hover:text-accent transition-colors"
            >
              ← İstek Listesi
            </button>
          </div>
          <h1 className="text-2xl font-bold text-primary">Mali Kâr Özeti</h1>
          {calisma && (
            <p className="text-muted mt-0.5 text-sm">
              Çalışma #{calisma.id}
              {calisma.ticari_kar_zarar !== undefined && (
                <span className="ml-2">· Ticari Kâr/Zarar: {formatTRY(calisma.ticari_kar_zarar)}</span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={handleOzetIndir}
            className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 font-medium transition-colors text-sm"
          >
            ↓ Excel
          </button>
          <button
            onClick={() => pipeline.mutate()}
            disabled={pipeline.isPending}
            className="flex items-center gap-1.5 bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-hover disabled:opacity-60 font-medium transition-colors text-sm"
          >
            {pipeline.isPending ? (
              <><span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Hesaplanıyor…</>
            ) : 'Hesapla'}
          </button>
          {calisma?.tamamlandi ? (
            <button
              onClick={() => yenidenAc.mutate()}
              disabled={yenidenAc.isPending}
              className="flex items-center gap-1.5 bg-surface-raised border border-amber-500 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950 disabled:opacity-60 font-medium transition-colors text-sm"
            >
              {yenidenAc.isPending ? '…' : '✎ Düzenlemeye Aç'}
            </button>
          ) : (
            <button
              onClick={() => tamamla.mutate()}
              disabled={tamamla.isPending || !pipeline.data}
              className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-60 font-medium transition-colors text-sm"
              title={!pipeline.data ? 'Önce hesaplama yapın' : undefined}
            >
              {tamamla.isPending ? '…' : '✓ Tamamla'}
            </button>
          )}
        </div>
      </div>

      {downloadHata && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {downloadHata}
        </div>
      )}

      {pipeline.isError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          Hesaplama hatası: {pipeline.error?.message ?? 'Bilinmeyen hata'}
        </div>
      )}

      {/* Pre-calculation */}
      {!sonuc && !pipeline.isPending && (
        <div className="bg-surface-raised border border-border-default rounded-xl p-10 shadow-sm text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          {calisma && (
            <div className="mb-6 grid grid-cols-3 gap-4 max-w-lg mx-auto text-sm">
              <div className="bg-surface-overlay rounded-lg p-3">
                <p className="text-muted text-xs mb-1">Ticari Kâr/Zarar</p>
                <p className="font-semibold text-primary">
                  {calisma.ticari_kar_zarar !== undefined ? formatTRY(calisma.ticari_kar_zarar) : '—'}
                </p>
              </div>
              <div className="bg-surface-overlay rounded-lg p-3">
                <p className="text-muted text-xs mb-1">KKEG</p>
                <p className="font-semibold text-primary">
                  {calisma.kkeg !== undefined ? formatTRY(calisma.kkeg) : '—'}
                </p>
              </div>
              <div className="bg-surface-overlay rounded-lg p-3">
                <p className="text-muted text-xs mb-1">Finansman Fonu</p>
                <p className="font-semibold text-primary">
                  {calisma.finansman_fonu !== undefined ? formatTRY(calisma.finansman_fonu) : '—'}
                </p>
              </div>
            </div>
          )}
          <h2 className="text-xl font-semibold text-primary mb-2">Pipeline Hesaplamasını Başlat</h2>
          <p className="text-muted mb-6 text-sm">
            Tüm kalemlerin istisna tutarlarını ve kurumlar vergisi matrahını hesaplamak için butona tıklayın.
          </p>
          <button
            onClick={() => pipeline.mutate()}
            className="bg-accent text-white px-8 py-3 rounded-lg hover:bg-accent-hover font-semibold transition-colors shadow-sm"
          >
            Hesaplamayı Başlat
          </button>
        </div>
      )}

      {pipeline.isPending && (
        <div className="bg-surface-raised border border-border-default rounded-xl p-10 shadow-sm text-center">
          <div className="flex items-center justify-center gap-3 text-secondary">
            <svg className="animate-spin h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="font-medium">Hesaplama yapılıyor…</span>
          </div>
        </div>
      )}

      {sonuc && (
        <div className="space-y-5">
          {/* Zarar uyarısı */}
          {sonuc.kazanc_varsa_gruplari_atlanmis && (
            <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                Ticari zarar nedeniyle &quot;kazanç varsa&quot; grubundaki kalemler hesaba katılmamıştır.
              </p>
            </div>
          )}

          {/* Sonuç kartları */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SonucKart baslik="Vergi Matrahı" deger={sonuc.matrah} />
            <SonucKart baslik="Hesaplanan KV" deger={sonuc.hesaplanan_kv} />
            <SonucKart
              baslik="YİAKV"
              deger={sonuc.yiakv}
              badge={sonuc.yiakv_uygulanmis ? 'Uygulandı' : undefined}
            />
            <SonucKart baslik="Ödenecek KV" deger={sonuc.odenecek_kv} highlighted />
          </div>

          {/* Kalem grupları */}
          {BOLUM_ORDER.map((bolum) => {
            const meta = BOLUM_META[bolum]
            const kategoriler = gruplarByBolum[bolum]
            if (!meta || !kategoriler || Object.keys(kategoriler).length === 0) return null
            return (
              <BolumSection
                key={bolum}
                meta={meta}
                kategoriler={kategoriler}
                calismaId={calismaId!}
              />
            )
          })}

          {/* Pipeline adımları (gizlenebilir) */}
          <div className="border border-border-default rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setAdimlarAcik(!adimlarAcik)}
              className="w-full flex items-center justify-between px-5 py-3 bg-surface-overlay hover:bg-surface-raised transition-colors"
            >
              <span className="font-medium text-primary text-sm">Hesaplama Adımları (Detay)</span>
              <span className="text-xs text-muted">{adimlarAcik ? '▲ Gizle' : '▼ Göster'}</span>
            </button>
            {adimlarAcik && (
              <div className="divide-y divide-border-subtle">
                {sonuc.adimlar.map((adim) => (
                  <div key={`${adim.adim_no}-${adim.baslik}`} className="flex items-center justify-between px-5 py-3 bg-surface-raised hover:bg-surface-overlay transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {adim.adim_no}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary">{adim.baslik}</p>
                        {adim.aciklama && <p className="text-xs text-muted">{adim.aciklama}</p>}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary flex-shrink-0 ml-4">{formatTRY(adim.deger)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
