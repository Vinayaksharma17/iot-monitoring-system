import { Link, useLocation } from 'react-router-dom'
import { Home, Bed, Gauge, BarChart3, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/common/Button'

export function Header() {
  const location = useLocation()
  const { user, logout, isAuthenticated } = useAuth()

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/bedrooms', label: 'Bedrooms', icon: Bed },
    { path: '/sensors', label: 'Sensors', icon: Gauge },
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-primary-600" />
            <h1 className="ml-3 text-xl font-bold text-gray-900">
              IoT Monitoring System
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User Info */}
          {isAuthenticated && (
            <div className="flex items-center space-x-4">
              <div className="text-sm text-right">
                <p className="text-gray-900 font-medium">
                  {user?.email ?? 'User'}
                </p>
                <p className="text-gray-500 text-xs capitalize">
                  {user?.role ?? ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
