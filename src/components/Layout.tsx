import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { 
  LayoutDashboard, 
  Megaphone, 
  Users, 
  FileText, 
  BarChart3, 
  Menu, 
  X, 
  LogOut,
  User
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'Candidates', href: '/candidates', icon: Users },
  { name: 'Forms', href: '/forms', icon: FileText },
  { name: 'Reporting', href: '/reporting', icon: BarChart3 },
]

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-ios-bg">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-20" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-64 ios-card">
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between p-4 border-b">
                <h1 className="text-xl font-bold text-ios-text">TFG Recruit</h1>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 p-4">
                <ul className="space-y-2">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center px-3 py-2 rounded-ios-sm transition-colors ${
                            isActive 
                              ? 'bg-ios-blue text-white' 
                              : 'text-ios-secondary hover:bg-gray-100'
                          }`}
                        >
                          <item.icon className="w-5 h-5 mr-3" />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-ios-card lg:shadow-ios">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-ios-text">TFG Recruit</h1>
            <p className="text-sm text-ios-secondary mt-1">Candidate Portal CRM</p>
          </div>
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center px-3 py-2 rounded-ios-sm transition-colors ${
                        isActive 
                          ? 'bg-ios-blue text-white' 
                          : 'text-ios-secondary hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-ios-card shadow-ios-sm">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-ios-sm hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="ml-4 text-xl font-semibold capitalize">
                {location.pathname.split('/').pop() || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-ios-secondary" />
                <span className="text-sm text-ios-secondary">
                  {user?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-ios-sm hover:bg-gray-100"
              >
                <LogOut className="w-5 h-5 text-ios-secondary" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}