import { useForm } from 'react-hook-form'
import type { VeriGirisiAlani, HesapSonucu } from '@/api/kalem'

interface VeriGirisiFormProps {
  alanlar: VeriGirisiAlani[]
  defaultValues?: Record<string, unknown>
  onSubmit: (data: Record<string, unknown>) => void
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
  } = useForm<Record<string, unknown>>({
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

            {alan.aciklama && (
              <p className="text-xs text-muted">{alan.aciklama}</p>
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
                    {sec}
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
                    <span>{key}</span>
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
