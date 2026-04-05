import { useNavigate, useParams } from 'react-router-dom'
import { useCalisma } from '@/api/calisma'
import { usePipeline, type PipelineSonucu } from '@/api/pipeline'

function formatTRY(value: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value)
}

interface SonucKartProps {
  baslik: string
  deger: number
  badge?: string
  highlighted?: boolean
}

function SonucKart({ baslik, deger, badge, highlighted }: SonucKartProps) {
  if (highlighted) {
    return (
      <div className="bg-blue-600 text-white rounded-xl p-6 shadow-sm">
        <p className="text-sm font-medium text-blue-100">{baslik}</p>
        <p className="text-3xl font-bold mt-2">{formatTRY(deger)}</p>
        {badge && (
          <span className="inline-block mt-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
    )
  }
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{baslik}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{formatTRY(deger)}</p>
      {badge && (
        <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
          {badge}
        </span>
      )}
    </div>
  )
}

interface HesaplamaAdimlariProps {
  adimlar: PipelineSonucu['adimlar']
}

function HesaplamaAdimlari({ adimlar }: HesaplamaAdimlariProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">Hesaplama Adımları</h2>
      <div className="relative">
        {adimlar.map((adim, idx) => (
          <div key={adim.adim_no} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {adim.adim_no}
              </div>
              {idx < adimlar.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-200 my-1" style={{ minHeight: '24px' }} />
              )}
            </div>
            <div className="pb-6 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-medium text-gray-800">{adim.baslik}</p>
                <p className="font-semibold text-gray-900">{formatTRY(adim.deger)}</p>
              </div>
              {adim.aciklama && (
                <p className="text-xs text-gray-500 mt-1">{adim.aciklama}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface KalemIstisnalariProps {
  kalemler: PipelineSonucu['kalemler']
}

function KalemIstisnalari({ kalemler }: KalemIstisnalariProps) {
  const entries = Object.entries(kalemler)
  if (entries.length === 0) return null

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Kalem İstisnaları</h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <th className="px-6 py-3">İç Kod</th>
            <th className="px-6 py-3">Açıklama</th>
            <th className="px-6 py-3 text-right">İstisna Tutarı</th>
            <th className="px-6 py-3">Durum</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {entries.map(([ic_kod, kalem]) => (
            <tr key={ic_kod} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 font-mono text-xs text-gray-600">{ic_kod}</td>
              <td className="px-6 py-4 text-gray-700">{kalem.aciklama || '—'}</td>
              <td className="px-6 py-4 text-right font-medium text-gray-900">
                {formatTRY(kalem.istisna_tutari)}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {kalem.hatalar.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                      {kalem.hatalar.length} Hata
                    </span>
                  )}
                  {kalem.uyarilar.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      {kalem.uyarilar.length} Uyarı
                    </span>
                  )}
                  {kalem.hatalar.length === 0 && kalem.uyarilar.length === 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Temiz
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function MaliKarOzeti() {
  const { calismaId } = useParams<{ calismaId: string }>()
  const navigate = useNavigate()
  const { data: calisma } = useCalisma(calismaId ? Number(calismaId) : undefined)
  const pipeline = usePipeline(calismaId)

  const sonuc = pipeline.data

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <button
              onClick={() => navigate('/')}
              className="hover:text-blue-600 transition-colors"
            >
              Çalışmalar
            </button>
            <span>›</span>
            <span className="text-gray-800 font-medium">Mali Kâr Özeti</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Mali Kâr Özeti</h1>
          {calisma && (
            <p className="text-gray-500 mt-1 text-sm">
              Çalışma #{calisma.id}
              {calisma.ticari_kar_zarar !== undefined && (
                <span className="ml-2">
                  · Ticari Kâr/Zarar: {formatTRY(calisma.ticari_kar_zarar)}
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.open(`/api/calisma/${calismaId}/export/ozet`, '_blank')}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Özet Excel İndir
          </button>
          <button
            onClick={() => pipeline.mutate()}
            disabled={pipeline.isPending}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed font-medium transition-colors shadow-sm"
          >
            {pipeline.isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Hesaplanıyor…
              </>
            ) : (
              'Hesapla'
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {pipeline.isError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          Hesaplama sırasında bir hata oluştu: {pipeline.error?.message ?? 'Bilinmeyen hata'}
        </div>
      )}

      {/* Pre-calculation state */}
      {!sonuc && !pipeline.isPending && (
        <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          {calisma && (
            <div className="mb-6 grid grid-cols-3 gap-4 max-w-lg mx-auto text-sm text-left">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Ticari Kâr/Zarar</p>
                <p className="font-semibold text-gray-800">
                  {calisma.ticari_kar_zarar !== undefined ? formatTRY(calisma.ticari_kar_zarar) : '—'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">KKEG</p>
                <p className="font-semibold text-gray-800">
                  {calisma.kkeg !== undefined ? formatTRY(calisma.kkeg) : '—'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">Finansman Fonu</p>
                <p className="font-semibold text-gray-800">
                  {calisma.finansman_fonu !== undefined ? formatTRY(calisma.finansman_fonu) : '—'}
                </p>
              </div>
            </div>
          )}
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Pipeline Hesaplamasını Başlat</h2>
          <p className="text-gray-500 mb-6 text-sm">
            Tüm kalemlerin istisna tutarlarını ve kurumlar vergisi matrahını hesaplamak için butona tıklayın.
          </p>
          <button
            onClick={() => pipeline.mutate()}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm"
          >
            Pipeline Hesaplamasını Başlat
          </button>
        </div>
      )}

      {/* Loading state */}
      {pipeline.isPending && (
        <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm text-center">
          <div className="flex items-center justify-center gap-3 text-gray-600">
            <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="font-medium">Hesaplama yapılıyor, lütfen bekleyin…</span>
          </div>
        </div>
      )}

      {/* Results */}
      {sonuc && (
        <div className="space-y-6">
          {/* Uyarı: kazanc_varsa_gruplari_atlanmis */}
          {sonuc.kazanc_varsa_gruplari_atlanmis && (
            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-amber-800 font-medium">
                Ticari zarar nedeniyle &quot;kazanç varsa&quot; grubundaki kalemler hesaba katılmamıştır.
              </p>
            </div>
          )}

          {/* Sonuç kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SonucKart baslik="Vergi Matrahı" deger={sonuc.matrah} />
            <SonucKart baslik="Hesaplanan KV" deger={sonuc.hesaplanan_kv} />
            <SonucKart
              baslik="YİAKV"
              deger={sonuc.yiakv}
              badge={sonuc.yiakv_uygulanmis ? 'Uygulanmış' : undefined}
            />
            <SonucKart baslik="Ödenecek KV" deger={sonuc.odenecek_kv} highlighted />
          </div>

          {/* Hesaplama adımları */}
          {sonuc.adimlar.length > 0 && (
            <HesaplamaAdimlari adimlar={sonuc.adimlar} />
          )}

          {/* Kalem istisnaları */}
          <KalemIstisnalari kalemler={sonuc.kalemler} />
        </div>
      )}
    </div>
  )
}
