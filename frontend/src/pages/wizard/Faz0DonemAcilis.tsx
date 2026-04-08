import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiClient } from '@/api/client'
import { useWizardStore } from '@/store/wizardStore'
import { useWizardNavigation } from '@/hooks/useWizardNavigation'
import { NumberInput } from '@/components/NumberInput'

const inputClass =
  'w-full border border-border-default bg-surface-raised text-primary rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent placeholder-muted'

export default function Faz0DonemAcilis() {
  const { calismaId } = useParams<{ calismaId: string }>()
  const setFaz0 = useWizardStore((s) => s.setFaz0)
  const { navigateNext } = useWizardNavigation()

  const [ticariKar, setTicariKar] = useState<number | undefined>(undefined)
  const [ticariZarar, setTicariZarar] = useState<number | undefined>(undefined)
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    apiClient.get(`/calisma/${calismaId}`).then((res) => {
      const d = res.data
      const tkz: number | null = d.ticari_kar_zarar ?? null
      if (tkz !== null && tkz !== 0) {
        if (tkz > 0) setTicariKar(tkz)
        else setTicariZarar(-tkz)
      }
    }).catch(() => {
      // mevcut veri yüklenemezse boş formla devam et
    }).finally(() => setLoading(false))
  }, [calismaId])

  const karDolu = ticariKar !== undefined && ticariKar > 0
  const zararDolu = ticariZarar !== undefined && ticariZarar > 0
  const herhangiDolu = karDolu || zararDolu

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)
    setSubmitting(true)
    try {
      const payload = {
        ticari_kar: karDolu ? ticariKar : 0,
        ticari_zarar: zararDolu ? ticariZarar : 0,
      }
      await apiClient.put(`/calisma/${calismaId}/wizard/faz0`, payload)
      const ticariKarZarar = (payload.ticari_kar ?? 0) - (payload.ticari_zarar ?? 0)
      setFaz0(calismaId!, { ticari_kar_zarar: ticariKarZarar })
      navigateNext()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bir hata oluştu'
      setApiError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <p className="text-muted">Yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Dönem Açılışı</h1>
        <p className="text-muted mt-1 text-sm">Dönemin ticari bilanço sonucunu girin.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Ticari Kâr */}
          <div className={`p-4 rounded-lg border-2 transition-colors ${
            karDolu
              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700'
              : zararDolu
              ? 'border-border-subtle bg-surface opacity-50'
              : 'border-border-default bg-surface-raised hover:border-emerald-300'
          }`}>
            <label className="block text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
              Ticari Bilanço Kârı (TL)
            </label>
            <NumberInput
              value={ticariKar}
              onChange={(v) => {
                setTicariKar(v && v > 0 ? v : undefined)
                if (v && v > 0) setTicariZarar(undefined)
              }}
              disabled={zararDolu}
              className={inputClass}
              placeholder="0"
            />
            <p className="text-xs text-muted mt-1.5">Kâr varsa buraya girin</p>
          </div>

          {/* Ticari Zarar */}
          <div className={`p-4 rounded-lg border-2 transition-colors ${
            zararDolu
              ? 'border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-700'
              : karDolu
              ? 'border-border-subtle bg-surface opacity-50'
              : 'border-border-default bg-surface-raised hover:border-red-300'
          }`}>
            <label className="block text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
              Ticari Bilanço Zararı (TL)
            </label>
            <NumberInput
              value={ticariZarar}
              onChange={(v) => {
                setTicariZarar(v && v > 0 ? v : undefined)
                if (v && v > 0) setTicariKar(undefined)
              }}
              disabled={karDolu}
              className={inputClass}
              placeholder="0"
            />
            <p className="text-xs text-muted mt-1.5">Zarar varsa buraya girin</p>
          </div>
        </div>

        {!herhangiDolu && (
          <p className="text-amber-600 dark:text-amber-400 text-sm">
            Lütfen kâr veya zarar tutarından birini girin.
          </p>
        )}

        <button
          type="submit"
          disabled={!herhangiDolu || submitting}
          className="w-full bg-accent text-white py-2 px-4 rounded-md hover:bg-accent-hover disabled:opacity-50 font-medium"
        >
          {submitting ? 'Kaydediliyor...' : 'Devam →'}
        </button>

        {apiError && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
            {apiError}
          </div>
        )}
      </form>
    </div>
  )
}
