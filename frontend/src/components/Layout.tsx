import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-surface text-primary">
      <Sidebar />
      <div className="flex-1 ml-60 min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
