import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '@/api/client'
import { useWizardStore } from '@/store/wizardStore'
import ThemeToggle from '@/components/ThemeToggle'

const faz0Schema = z.object({
  ticari_kar_zarar: z.number({ invalid_type_error: 'Sayı giriniz' }),
  kkeg: z.number().default(0),
  finansman_fonu: z.number().default(0),
})

type Faz0Form = z.infer<typeof faz0Schema>

export default function Faz0DonemAcilis() {
  const { calismaId } = useParams<{ calismaId: string }>()
  const navigate = useNavigate()
  const setFaz0 = useWizardStore((s) => s.setFaz0)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Faz0Form>({
    resolver: zodResolver(faz0Schema),
    defaultValues: { kkeg: 0, finansman_fonu: 0 },
  })

  const onSubmit = async (data: Faz0Form) => {
    await apiClient.put(`/calisma/${calismaId}/wizard/faz0`, data)
    setFaz0(data)
    navigate(`/calisma/${calismaId}/wizard/faz1`)
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Dönem Açılışı</h1>
          <p className="text-muted mt-1">Temel finansal bilgileri girin</p>
        </div>
        <ThemeToggle />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            Ticari bilanço kârı / zararı (TL)
          </label>
          <input
            type="number"
            step="0.01"
            className="w-full border border-border-default bg-surface-raised text-primary rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent placeholder-muted"
            {...register('ticari_kar_zarar', { valueAsNumber: true })}
          />
          {errors.ticari_kar_zarar && (
            <p className="text-red-500 text-sm mt-1">{errors.ticari_kar_zarar.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            KKEG toplamı (TL)
          </label>
          <input
            type="number"
            step="0.01"
            defaultValue={0}
            className="w-full border border-border-default bg-surface-raised text-primary rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent placeholder-muted"
            {...register('kkeg', { valueAsNumber: true })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            Finansman fonu (TL)
          </label>
          <input
            type="number"
            step="0.01"
            defaultValue={0}
            className="w-full border border-border-default bg-surface-raised text-primary rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent placeholder-muted"
            {...register('finansman_fonu', { valueAsNumber: true })}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-accent text-white py-2 px-4 rounded-md hover:bg-accent-hover disabled:opacity-50 font-medium"
        >
          {isSubmitting ? 'Kaydediliyor...' : 'Devam →'}
        </button>
      </form>
    </div>
  )
}
