interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
}

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div className={`flex justify-center py-12 ${className}`}>
      <div
        className={`${SIZE_CLASSES[size]} border-accent border-t-transparent rounded-full animate-spin`}
      />
    </div>
  )
}
