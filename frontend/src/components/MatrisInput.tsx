import { useState, useEffect } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { NumberInput } from '@/components/NumberInput'

interface MatrisSatirBilesen {
  satir: string
  isaret: 1 | -1
}

interface MatrisSatir {
  id: string
  etiket: string
  tip?: 'satir' | 'bolum' | 'ara_toplam' | 'dagilim_secim'
  bilesenler?: MatrisSatirBilesen[]
  grup?: string
}

interface MatrisSutun {
  id: string
  etiket: string
  zorunlu?: boolean
  renk?: string
  hesapli?: boolean
}

interface MatrisInputProps {
  alanId: string
  satirlar: MatrisSatir[]
  sutunlar: MatrisSutun[]
}

const fmt = (v: number) =>
  new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)

// ─── Diğer = Toplam − İhracat − İmalat (auto-computed, registers hidden field)
function DigerHesapliCell({ satirId, renk: _renk }: { satirId: string; renk?: string }) {
  const { setValue } = useFormContext()
  const vals = useWatch({
    name: [`${satirId}_toplam`, `${satirId}_ihracat`, `${satirId}_imalat`],
  }) as [number, number, number]
  const diger = (Number(vals[0]) || 0) - (Number(vals[1]) || 0) - (Number(vals[2]) || 0)

  useEffect(() => {
    setValue(`${satirId}_diger`, diger, { shouldValidate: false })
  }, [diger, satirId, setValue])

  const isNeg = diger < 0
  return (
    <div
      className={`px-2 py-1 text-right rounded border text-xs font-medium min-w-[8rem] ${
        isNeg
          ? 'bg-red-50 text-red-600 border-red-200'
          : 'bg-[#FFFDE7] text-[#546E7A] border-[#CFD8DC]'
      }`}
    >
      {fmt(diger)}
    </div>
  )
}

// ─── Ara toplam hücre — bilesenlerden hesaplar, form değerini kaydeder
function AraToplamCell({
  satirId,
  sutunId,
  bilesenler,
  isAna,
}: {
  satirId: string
  sutunId: string
  bilesenler: MatrisSatirBilesen[]
  isAna: boolean
}) {
  const { setValue } = useFormContext()
  const fieldNames = bilesenler.map((b) => `${b.satir}_${sutunId}`)
  const values = useWatch({ name: fieldNames })
  const deger = bilesenler.reduce(
    (acc, b, i) => acc + b.isaret * (Number((values as (number | undefined)[])[i]) || 0),
    0,
  )

  useEffect(() => {
    setValue(`${satirId}_${sutunId}`, deger, { shouldValidate: false })
  }, [deger, satirId, sutunId, setValue])

  const isNeg = deger < 0
  const posStyle = isAna
    ? 'bg-[#E8EAF6] text-[#283593] border-[#9FA8DA]'
    : 'bg-[#F5F5F5] text-[#37474F] border-[#CFD8DC]'
  return (
    <div
      className={`px-2 py-1 text-right text-xs font-semibold rounded border min-w-[8rem] ${
        isNeg ? 'bg-red-50 text-red-700 border-red-300' : posStyle
      }`}
    >
      {fmt(deger)}
    </div>
  )
}

// ─── Faaliyet gideri hücre — hasılat oranına göre otomatik doldurur
function FaaliyetGideriAutoCell({
  satirId,
  sutunId,
  oran,
}: {
  satirId: string
  sutunId: string
  oran: number
}) {
  const { setValue } = useFormContext()
  const toplam = useWatch({ name: `${satirId}_toplam` })
  const deger = Math.round((Number(toplam) || 0) * oran)

  useEffect(() => {
    setValue(`${satirId}_${sutunId}`, deger, { shouldValidate: false })
  }, [deger, satirId, sutunId, setValue])

  return (
    <div className="px-2 py-1 text-right text-xs rounded border border-dashed border-blue-300 bg-blue-50/60 text-[#1565C0] min-w-[8rem]">
      {fmt(deger)}
    </div>
  )
}

// ─── Hasılat oranlarını net satışlar ara toplamından türet
function useHasilatOranlari() {
  const vals = useWatch({
    name: [
      'ara_net_satislar_toplam',
      'ara_net_satislar_ihracat',
      'ara_net_satislar_imalat',
    ],
  }) as [number, number, number]
  const [t, ih, im] = vals.map((v) => Number(v) || 0)
  return {
    ihracat: t > 0 ? ih / t : 0,
    imalat: t > 0 ? im / t : 0,
  }
}

export default function MatrisInput({ alanId: _alanId, satirlar, sutunlar }: MatrisInputProps) {
  const { control } = useFormContext()
  const [dagilimYontemi, setDagilimYontemi] = useState<'ortalama_dagit' | 'manuel_gir'>(
    'ortalama_dagit',
  )
  const hasilatOranlari = useHasilatOranlari()

  const totalCols = sutunlar.length + 1 // +1 for kalem label column

  const inputBgClass = (sutunId: string) =>
    sutunId === 'toplam'
      ? 'bg-white'
      : sutunId === 'ihracat'
        ? 'bg-blue-50'
        : sutunId === 'imalat'
          ? 'bg-green-50'
          : 'bg-[#FFFDE7]'

  return (
    <div className="overflow-x-auto rounded-md border border-border-default">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            {sutunlar.map((s) => (
              <th
                key={s.id}
                className="px-3 py-2 text-right font-semibold min-w-[8rem] text-white"
                style={{ backgroundColor: s.hesapli ? '#607D8B' : (s.renk ?? '#1F3864') }}
              >
                {s.etiket}
                {s.hesapli && (
                  <span className="ml-1 font-normal text-[10px] opacity-80">(oto)</span>
                )}
                {s.zorunlu && <span className="ml-1 text-red-300">*</span>}
              </th>
            ))}
            <th className="px-3 py-2 text-left font-semibold w-56 min-w-[14rem] bg-[#1F3864] text-white border-l border-white/20">
              Kalem
            </th>
          </tr>
        </thead>
        <tbody>
          {satirlar.map((satir, rowIdx) => {
            // ── Bölüm başlığı
            if (satir.tip === 'bolum') {
              return (
                <tr key={satir.id} className="bg-[#ECEFF1]">
                  <td
                    colSpan={totalCols}
                    className="px-3 py-1.5 text-xs font-bold text-[#37474F] uppercase tracking-wide border-t border-b border-border-default"
                  >
                    {satir.etiket}
                  </td>
                </tr>
              )
            }

            // ── Dağılım seçim satırı
            if (satir.tip === 'dagilim_secim') {
              return (
                <tr key={satir.id} className="bg-[#E8F5E9] border-t-2 border-[#43A047]">
                  <td colSpan={totalCols} className="px-3 py-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-semibold text-[#2E7D32]">
                        Faaliyet Giderleri Dağılımı:
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDagilimYontemi('ortalama_dagit')}
                          className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${
                            dagilimYontemi === 'ortalama_dagit'
                              ? 'bg-[#43A047] text-white border-[#43A047]'
                              : 'bg-white text-[#2E7D32] border-[#A5D6A7] hover:border-[#43A047]'
                          }`}
                        >
                          Hasılata Göre Dağıt
                        </button>
                        <button
                          type="button"
                          onClick={() => setDagilimYontemi('manuel_gir')}
                          className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${
                            dagilimYontemi === 'manuel_gir'
                              ? 'bg-[#546E7A] text-white border-[#546E7A]'
                              : 'bg-white text-[#37474F] border-[#CFD8DC] hover:border-[#546E7A]'
                          }`}
                        >
                          Manuel Gir
                        </button>
                      </div>
                      {dagilimYontemi === 'ortalama_dagit' && (
                        <span className="text-[10px] text-[#388E3C] italic">
                          İhracat: %{(hasilatOranlari.ihracat * 100).toFixed(1)} · İmalat:{' '}
                          %{(hasilatOranlari.imalat * 100).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            }

            // ── Ara toplam satırı
            if (satir.tip === 'ara_toplam' && satir.bilesenler) {
              const isAna = satir.etiket.startsWith('=')
              const rowCls = isAna
                ? 'bg-[#E8EAF6] border-t-2 border-[#5C6BC0]'
                : 'bg-[#FAFAFA] border-t border-border-default'
              const labelCls = isAna
                ? 'text-[#283593] font-bold italic'
                : 'text-[#546E7A] font-semibold'
              return (
                <tr key={satir.id} className={rowCls}>
                  {sutunlar.map((sutun) => (
                    <td key={sutun.id} className="px-2 py-1">
                      {sutun.hesapli ? (
                        <DigerHesapliCell satirId={satir.id} renk={sutun.renk} />
                      ) : (
                        <AraToplamCell
                          satirId={satir.id}
                          sutunId={sutun.id}
                          bilesenler={satir.bilesenler!}
                          isAna={isAna}
                        />
                      )}
                    </td>
                  ))}
                  <td className={`px-3 py-1.5 text-xs border-l border-border-default ${labelCls}`}>
                    {satir.etiket}
                  </td>
                </tr>
              )
            }

            // ── Normal veri satırı
            const rowBg = rowIdx % 2 === 0 ? 'bg-surface-raised' : 'bg-surface'
            const isFaaliyetGideri = satir.grup === 'faaliyet_gideri'
            return (
              <tr key={satir.id} className={rowBg}>
                {sutunlar.map((sutun) => {
                  const fieldId = `${satir.id}_${sutun.id}`

                  // Otomatik hesaplanan sütun (diğer)
                  if (sutun.hesapli) {
                    return (
                      <td key={sutun.id} className="px-2 py-1">
                        <DigerHesapliCell satirId={satir.id} renk={sutun.renk} />
                      </td>
                    )
                  }

                  // Faaliyet giderleri + hasılata göre dağıt + toplam değil
                  if (
                    isFaaliyetGideri &&
                    dagilimYontemi === 'ortalama_dagit' &&
                    sutun.id !== 'toplam'
                  ) {
                    const oran =
                      sutun.id === 'ihracat'
                        ? hasilatOranlari.ihracat
                        : sutun.id === 'imalat'
                          ? hasilatOranlari.imalat
                          : 0
                    return (
                      <td key={sutun.id} className="px-2 py-1">
                        <FaaliyetGideriAutoCell
                          satirId={satir.id}
                          sutunId={sutun.id}
                          oran={oran}
                        />
                      </td>
                    )
                  }

                  // Normal kullanıcı girişi
                  return (
                    <td key={sutun.id} className="px-2 py-1">
                      <Controller
                        name={fieldId}
                        control={control}
                        defaultValue={0}
                        rules={{
                          required: sutun.zorunlu
                            ? `${satir.etiket} — ${sutun.etiket} zorunludur`
                            : false,
                        }}
                        render={({ field }) => (
                          <NumberInput
                            value={field.value as number | null}
                            onChange={(v) => field.onChange(v ?? 0)}
                            onBlur={field.onBlur}
                            className={`w-full px-2 py-1 text-right border border-border-default rounded text-xs text-primary focus:outline-none focus:ring-1 focus:ring-accent min-w-[8rem] ${inputBgClass(sutun.id)}`}
                          />
                        )}
                      />
                    </td>
                  )
                })}
                <td className="px-3 py-1.5 text-secondary font-medium border-l border-border-default">
                  {satir.etiket}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
