interface ErrorBoxProps {
  message: string
  onRetry?: () => void
}

export default function ErrorBox({ message, onRetry }: ErrorBoxProps) {
  return (
    <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg px-4 py-3 text-sm flex items-center justify-between gap-4">
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 text-xs font-semibold underline hover:no-underline transition-all"
        >
          Tekrar Dene
        </button>
      )}
    </div>
  )
}
