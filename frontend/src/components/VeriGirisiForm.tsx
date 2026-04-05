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
            <label className="block text-sm font-medium text-gray-700">
              {alan.etiket}
              {alan.zorunlu && <span className="ml-1 text-red-500">*</span>}
            </label>

            {alan.aciklama && (
              <p className="text-xs text-gray-400">{alan.aciklama}</p>
            )}

            {alan.tip === 'para' && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₺</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  className={`w-full pl-8 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[alan.id] ? 'border-red-400' : 'border-gray-300'
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
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors[alan.id] ? 'border-red-400' : 'border-gray-300'
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
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors[alan.id] ? 'border-red-400' : 'border-gray-300'
                }`}
                {...register(alan.id, {
                  required: alan.zorunlu ? `${alan.etiket} zorunludur` : false,
                })}
              />
            )}

            {alan.tip === 'metin' && (
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors[alan.id] ? 'border-red-400' : 'border-gray-300'
                }`}
                {...register(alan.id, {
                  required: alan.zorunlu ? `${alan.etiket} zorunludur` : false,
                })}
              />
            )}

            {alan.tip === 'secenek' && (
              <select
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                  errors[alan.id] ? 'border-red-400' : 'border-gray-300'
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
                      className="accent-blue-600"
                      {...register(alan.id, {
                        required: alan.zorunlu ? `${alan.etiket} zorunludur` : false,
                      })}
                    />
                    <span className="text-sm">{val === 'evet' ? 'Evet' : 'Hayır'}</span>
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
          className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium text-sm transition-colors"
        >
          {isLoading ? 'Hesaplanıyor...' : 'Hesapla ve Kaydet'}
        </button>
      </form>

      {hesapSonucu && (
        <div className="space-y-3 pt-2">
          {hesapSonucu.hatalar.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-700 mb-1">Hatalar</p>
              <ul className="list-disc list-inside space-y-1">
                {hesapSonucu.hatalar.map((h, i) => (
                  <li key={i} className="text-sm text-red-600">
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hesapSonucu.uyarilar.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-semibold text-yellow-700 mb-1">Uyarılar</p>
              <ul className="list-disc list-inside space-y-1">
                {hesapSonucu.uyarilar.map((u, i) => (
                  <li key={i} className="text-sm text-yellow-700">
                    {u}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-semibold text-green-700 mb-2">Hesap Sonucu</p>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-green-800 font-medium">İstisna Tutarı</span>
              <span className="text-lg font-bold text-green-700">
                {formatCurrency(hesapSonucu.istisna_tutari)}
              </span>
            </div>

            {Object.keys(hesapSonucu.ara_sonuclar).length > 0 && (
              <div className="border-t border-green-200 pt-2 mt-2 space-y-1">
                <p className="text-xs text-green-600 font-medium mb-1">Ara Sonuçlar</p>
                {Object.entries(hesapSonucu.ara_sonuclar).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-xs text-green-700">
                    <span>{key}</span>
                    <span>{formatCurrency(val)}</span>
                  </div>
                ))}
              </div>
            )}

            {hesapSonucu.aciklama && (
              <p className="text-xs text-green-600 mt-2 border-t border-green-200 pt-2">
                {hesapSonucu.aciklama}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
