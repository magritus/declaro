import { useState } from 'react'
import { NumberInput } from '@/components/NumberInput'
import type { HesapSonucu } from '@/api/kalem'

const YILLAR = [2020, 2021, 2022, 2023, 2024] as const
type Yil = (typeof YILLAR)[number]

interface GYZSatir {
  t1: number | null
  t2: number | null
}

type GYZVerisi = Record<Yil, GYZSatir>

function buildFieldNames(data: GYZVerisi): Record<string, number> {
  const out: Record<string, number> = {}
  for (const yil of YILLAR) {
    out[`y${yil}_t1`] = data[yil].t1 ?? 0
    out[`y${yil}_t2`] = data[yil].t2 ?? 0
  }
  return out
}

function parseDefaultValues(defaults?: Record<string, string | number | boolean | null>): GYZVerisi {
  const empty = (): GYZSatir => ({ t1: null, t2: null })
  const result = {
    2020: empty(), 2021: empty(), 2022: empty(), 2023: empty(), 2024: empty(),
  } as GYZVerisi

  if (!defaults) return result
  for (const yil of YILLAR) {
    const t1 = defaults[`y${yil}_t1`]
    const t2 = defaults[`y${yil}_t2`]
    result[yil] = {
      t1: typeof t1 === 'number' && t1 !== 0 ? t1 : null,
      t2: typeof t2 === 'number' && t2 !== 0 ? t2 : null,
    }
  }
  return result
}

function formatTL(v: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)
}

interface Props {
  defaultValues?: Record<string, string | number | boolean | null>
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  isLoading: boolean
  hesapSonucu: HesapSonucu | null
}

export default function GYZVeriGirisi({ defaultValues, onSubmit, isLoading, hesapSonucu }: Props) {
  const [verisi, setVerisi] = useState<GYZVerisi>(() => parseDefaultValues(defaultValues))

  const set = (yil: Yil, tip: 't1' | 't2', val: number | null) => {
    setVerisi((prev) => ({
      ...prev,
      [yil]: { ...prev[yil], [tip]: val },
    }))
  }

  // Satır toplamları
  const satirToplam = (yil: Yil) => (verisi[yil].t1 ?? 0) + (verisi[yil].t2 ?? 0)

  // Sütun toplamları
  const t1Toplam = YILLAR.reduce((acc, y) => acc + (verisi[y].t1 ?? 0), 0)
  const t2Toplam = YILLAR.reduce((acc, y) => acc + (verisi[y].t2 ?? 0), 0)
  const genelToplam = t1Toplam + t2Toplam

  const handleSubmit = async () => {
    await onSubmit(buildFieldNames(verisi))
  }

  const inputClass =
    'w-full border border-border-default bg-surface-raised text-primary rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent placeholder-muted text-right'

  return (
    <div className="space-y-6">
      {/* Tip açıklamaları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
              Tip 1
            </span>
            <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">Diğer Zararlar</span>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            Normal ticari faaliyetlerden doğan geçmiş yıl zararlarıdır. Örtülü sermaye (KVK Md. 12) veya
            transfer fiyatlandırması (KVK Md. 13) kaynaklı kısımlar <strong>dahil edilemez.</strong>
          </p>
        </div>
        <div className="p-4 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700">
              Tip 2
            </span>
            <span className="text-sm font-semibold text-violet-800 dark:text-violet-200">İstisnadan Kaynaklanan Zararlar</span>
          </div>
          <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
            İstisna kapsamındaki faaliyetlerden doğan zararlar (örn. taşınmaz satışı, TGB/SB faaliyeti).
            Beyannamede ayrı satırda gösterilmesi zorunludur.
          </p>
        </div>
      </div>

      {/* Uyarı bandı */}
      <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-xs text-amber-700 dark:text-amber-300">
        <span className="flex-shrink-0 mt-0.5">⚠</span>
        <span>
          <strong>5 yıl kuralı:</strong> Yalnızca son 5 takvim yılının (2020–2024) zararı mahsup edilebilir.
          Mahsup tutarı dönem mali kârını aşamaz — pipeline otomatik olarak kaplar.
          Mahsup sırası en eski yıldan başlar (FIFO).
        </span>
      </div>

      {/* Matris tablosu */}
      <div className="border border-border-default rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-overlay border-b border-border-default">
              <th className="text-left px-4 py-3 font-semibold text-secondary w-20">Yıl</th>
              <th className="text-right px-4 py-3 font-semibold text-blue-700 dark:text-blue-300">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-700">T1</span>
                  Diğer Zarar (TL)
                </div>
              </th>
              <th className="text-right px-4 py-3 font-semibold text-violet-700 dark:text-violet-300">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900 border border-violet-200 dark:border-violet-700">T2</span>
                  İstisna Kaynaklı (TL)
                </div>
              </th>
              <th className="text-right px-4 py-3 font-semibold text-secondary w-36">Satır Toplam</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {YILLAR.map((yil) => {
              const satirT = satirToplam(yil)
              const bosmu = verisi[yil].t1 === null && verisi[yil].t2 === null
              return (
                <tr
                  key={yil}
                  className={`transition-colors ${bosmu ? '' : 'bg-surface-raised'} hover:bg-surface-overlay`}
                >
                  <td className="px-4 py-2.5 font-mono font-semibold text-primary tabular-nums">{yil}</td>
                  <td className="px-3 py-2">
                    <NumberInput
                      value={verisi[yil].t1}
                      onChange={(v) => set(yil, 't1', v)}
                      className={inputClass}
                      placeholder="0,00"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <NumberInput
                      value={verisi[yil].t2}
                      onChange={(v) => set(yil, 't2', v)}
                      className={inputClass}
                      placeholder="0,00"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-secondary font-medium">
                    {satirT > 0 ? formatTL(satirT) : <span className="text-muted">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border-default bg-surface-overlay font-semibold">
              <td className="px-4 py-3 text-secondary text-xs uppercase tracking-wide">Toplam</td>
              <td className="px-4 py-3 text-right tabular-nums text-blue-700 dark:text-blue-300">
                {t1Toplam > 0 ? formatTL(t1Toplam) : <span className="text-muted font-normal">—</span>}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-violet-700 dark:text-violet-300">
                {t2Toplam > 0 ? formatTL(t2Toplam) : <span className="text-muted font-normal">—</span>}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-primary text-base">
                {genelToplam > 0 ? formatTL(genelToplam) : <span className="text-muted font-normal">—</span>}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Hesapla butonu */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || genelToplam === 0}
        className="w-full py-2.5 px-4 rounded-md bg-accent text-white font-medium text-sm hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Hesaplanıyor...' : 'Hesapla ve Kaydet'}
      </button>

      {/* Hesap sonucu */}
      {hesapSonucu && (
        <div className="rounded-lg border border-green-200 dark:border-green-800 overflow-hidden">
          <div className="px-4 py-3 bg-green-50 dark:bg-green-950 flex items-center justify-between">
            <span className="text-sm font-semibold text-green-800 dark:text-green-200">
              Mahsup Edilecek Toplam Zarar
            </span>
            <span className="text-xl font-bold text-green-700 dark:text-green-300 tabular-nums">
              {formatTL(hesapSonucu.istisna_tutari)} TL
            </span>
          </div>
          {Object.keys(hesapSonucu.ara_sonuclar).length > 0 && (
            <div className="divide-y divide-border-subtle border-t border-green-200 dark:border-green-800">
              {Object.entries(hesapSonucu.ara_sonuclar).map(([k, v]) => (
                <div key={k} className="flex justify-between px-4 py-2 text-xs">
                  <span className="text-secondary capitalize">{k.replace(/_/g, ' ')}</span>
                  <span className="font-medium text-primary tabular-nums">{formatTL(v)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950 border-t border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
            ℹ Pipeline'da bu tutar dönem mali kârını aşarsa otomatik kırpılır.
          </div>
        </div>
      )}
    </div>
  )
}
