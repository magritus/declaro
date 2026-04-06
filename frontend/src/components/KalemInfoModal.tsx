import { useEffect } from 'react'
import { KalemSchema } from '@/api/kalem'

interface Props {
  kalem: KalemSchema
  yiakv?: string
  onClose: () => void
}

function renderAciklama(text: string): React.ReactNode {
  const lines = text.split('\n')
  const result: React.ReactNode[] = []
  let listItems: string[] = []

  const flushList = () => {
    if (listItems.length > 0) {
      result.push(
        <ul key={result.length} className="space-y-1.5 my-2">
          {listItems.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-secondary">
              <span className="text-accent mt-0.5 flex-shrink-0">▸</span>
              <span dangerouslySetInnerHTML={{ __html: boldify(item) }} />
            </li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      continue
    }
    if (trimmed.startsWith('### ')) {
      flushList()
      result.push(
        <h4 key={result.length} className="text-xs font-bold uppercase tracking-widest text-muted mt-4 mb-1.5">
          {trimmed.slice(4)}
        </h4>
      )
    } else if (trimmed.startsWith('## ')) {
      flushList()
      result.push(
        <h3 key={result.length} className="text-sm font-semibold text-primary mt-4 mb-1">
          {trimmed.slice(3)}
        </h3>
      )
    } else if (trimmed.match(/^[-•*] /)) {
      listItems.push(trimmed.slice(2))
    } else {
      flushList()
      result.push(
        <p key={result.length} className="text-sm text-secondary leading-relaxed"
          dangerouslySetInnerHTML={{ __html: boldify(trimmed) }} />
      )
    }
  }
  flushList()
  return result
}

function boldify(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-primary font-semibold">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 bg-surface-overlay rounded text-xs font-mono">$1</code>')
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
    ? [...new Set(kalem.beyanname_kodlari.map((b) => b.kod))].join(' / ')
    : undefined

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-raised border border-border-default rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border-subtle flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-1.5">Kalem Bilgisi</p>
              <h2 className="text-lg font-bold text-primary leading-snug">{kalem.baslik}</h2>
              {beyanKodlari && (
                <p className="text-xs text-muted mt-1">Beyanname satırı: <span className="font-mono font-medium text-secondary">{beyanKodlari}</span></p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-overlay hover:bg-border-subtle flex items-center justify-center text-muted hover:text-primary transition-colors flex-shrink-0"
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
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-accent/10 text-accent inline-flex items-center justify-center text-xs">⚖</span>
                Mevzuat Dayanağı
              </h3>
              <div className="space-y-2">
                {kalem.mevzuat_dayanagi.map((m, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="w-5 h-5 rounded-full bg-surface-overlay border border-border-default text-xs text-muted flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-sm text-secondary leading-relaxed">{m}</span>
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
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-accent/10 text-accent inline-flex items-center justify-center text-xs">✎</span>
                Uygulama Rehberi
              </h3>
              <div className="space-y-2">
                {renderAciklama(kalem.wizard_agaci.info_modal)}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
