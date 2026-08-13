import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/supabase'
import { 
  LayoutDashboard, Utensils, QrCode, Users, Settings, 
  LogOut, ChevronRight, Shield 
} from 'lucide-react'
import { useEffect } from 'react'

const navItems = [
  { to: '/owner', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/owner/menu', icon: Utensils, label: 'Menu Manager' },
  { to: '/owner/qr-codes', icon: QrCode, label: 'QR Codes' },
  { to: '/owner/staff', icon: Users, label: 'Staff' },
  { to: '/owner/settings', icon: Settings, label: 'Settings' },
]

export function OwnerLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, isLoading, isOwner } = useAuth()

  useEffect(() => {
    if (!isLoading && !isOwner) {
      navigate('/staff-login', { replace: true })
    }
  }, [isLoading, isOwner, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" />
      </div>
    )
  }

  if (!isOwner) return null

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold">Owner Portal</h1>
              <p className="text-xs text-gray-400">Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to
            return (
              <Link key={to} to={to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold">
              {profile?.full_name?.[0] || profile?.email?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name || profile?.email}</p>
              <p className="text-xs text-gray-500">Owner</p>
            </div>
          </div>
          <button onClick={() => signOut()}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
