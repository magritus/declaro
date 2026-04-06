import { useEffect } from 'react'
import type { KalemSchema } from '@/api/kalem'
import { renderMarkdown } from '@/lib/renderMarkdown'

interface Props {
  kalem: KalemSchema
  yiakv?: string
  onClose: () => void
}

const YIAKV_STYLE: Record<string, { label: string; cls: string }> = {
  dusulur: { label: 'YİAKV Matrahından Düşülür', cls: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  dusulmez: { label: 'YİAKV Matrahından Düşülemez', cls: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
  tartismali: { label: 'YİAKV Etkisi Tartışmalı', cls: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
}

export default function KalemInfoModal({ kalem, yiakv, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const yiakvInfo = yiakv ? YIAKV_STYLE[yiakv] : undefined
  const beyanKodlari = kalem.beyanname_kodlari
    ? [...new Set(kalem.beyanname_kodlari.map((b: { kod: number }) => b.kod))].join(' / ')
    : undefined

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-raised border border-border-default rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Renkli üst şerit */}
        <div className="h-1 bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400 flex-shrink-0" />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border-subtle flex-shrink-0 bg-gradient-to-b from-sky-50/70 to-transparent dark:from-sky-950/30 dark:to-transparent">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sky-500 dark:text-sky-400 uppercase tracking-widest mb-1.5">Kalem Bilgisi</p>
              <h2 className="text-lg font-bold text-sky-900 dark:text-sky-100 leading-snug">{kalem.baslik}</h2>
              {beyanKodlari && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  Beyanname satırı:{' '}
                  <span className="font-mono font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-1.5 py-0.5 rounded">{beyanKodlari}</span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-overlay hover:bg-sky-100 dark:hover:bg-sky-950 flex items-center justify-center text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex-shrink-0"
            >
              ✕
            </button>
          </div>
          {yiakvInfo && (
            <div className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${yiakvInfo.cls}`}>
              <span>{yiakv === 'dusulur' ? '✓' : yiakv === 'dusulmez' ? '✗' : '!'}</span>
              {yiakvInfo.label}
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Mevzuat */}
          {kalem.mevzuat_dayanagi && kalem.mevzuat_dayanagi.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 inline-flex items-center justify-center text-xs">⚖</span>
                Mevzuat Dayanağı
              </h3>
              <div className="space-y-2">
                {kalem.mevzuat_dayanagi.map((m: string, i: number) => (
                  <div key={i} className="flex gap-3 items-start bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 rounded-lg px-3 py-2.5">
                    <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900 text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{m}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Divider */}
          {kalem.mevzuat_dayanagi?.length && kalem.wizard_agaci?.info_modal && (
            <div className="border-t border-border-subtle" />
          )}

          {/* Açıklama */}
          {kalem.wizard_agaci?.info_modal && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 inline-flex items-center justify-center text-xs">✎</span>
                Uygulama Rehberi
              </h3>
              <div className="space-y-2 text-slate-600 dark:text-slate-300">
                {renderMarkdown(kalem.wizard_agaci.info_modal)}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
