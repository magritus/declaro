import type { KChecklistMaddesi, ChecklistDurum } from '@/api/kalem'

interface ChecklistTabProps {
  items: KChecklistMaddesi[]
  durum: ChecklistDurum
  onChange: (id: string, value: 'uygun' | 'eksik' | 'risk') => void
  onSave: () => void
  isSaving: boolean
  kayitMesaji: string | null
}

export default function ChecklistTab({
  items,
  durum,
  onChange,
  onSave,
  isSaving,
  kayitMesaji,
}: ChecklistTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-primary">K-Checklist</h2>

      {items.length === 0 ? (
        <div className="p-6 bg-surface-overlay border border-border-default rounded-lg text-center text-muted text-sm">
          Bu kalem için checklist maddesi bulunmuyor.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((madde) => {
            const madDurum = durum[madde.id]
            return (
              <div key={madde.id} className="p-4 border border-border-default bg-surface-raised rounded-lg space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary">{madde.soru}</p>
                    {madde.referans && (
                      <p className="text-xs text-muted mt-0.5">{madde.referans}</p>
                    )}
                  </div>
                  {madDurum && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        madDurum === 'uygun'
                          ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                          : madDurum === 'eksik'
                          ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                          : 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300'
                      }`}
                    >
                      {madDurum === 'uygun' ? 'Uygun' : madDurum === 'eksik' ? 'Eksik' : 'Risk'}
                    </span>
                  )}
                </div>

                <div className="flex gap-4">
                  {(['uygun', 'eksik', 'risk'] as const).map((val) => (
                    <label key={val} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name={`checklist-${madde.id}`}
                        value={val}
                        checked={durum[madde.id] === val}
                        onChange={() => onChange(madde.id, val)}
                        className="accent-accent"
                      />
                      <span
                        className={`text-sm ${
                          val === 'uygun'
                            ? 'text-green-700 dark:text-green-400'
                            : val === 'eksik'
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-yellow-700 dark:text-yellow-400'
                        }`}
                      >
                        {val === 'uygun' ? 'Uygun' : val === 'eksik' ? 'Eksik' : 'Risk'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {kayitMesaji && (
        <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md text-green-700 dark:text-green-300 text-sm">
          {kayitMesaji}
        </div>
      )}

      <button
        onClick={onSave}
        disabled={isSaving || items.length === 0}
        className="w-full bg-accent text-white py-2.5 px-4 rounded-md hover:bg-accent-hover disabled:opacity-50 font-medium text-sm transition-colors"
      >
        {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </div>
  )
}
