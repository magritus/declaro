import Sidebar from '@/components/Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-surface text-primary">
      <Sidebar />
      <div className="flex-1 ml-60 min-w-0">
        {children}
      </div>
    </div>
  )
}
