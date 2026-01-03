import { Link, useLocation } from 'react-router-dom'
import { Home, Bed, Gauge, BarChart3 } from 'lucide-react'

export function Header() {
  const location = useLocation()

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
          <div className="flex items-center">
            <div className="text-sm">
              <p className="text-gray-900 font-medium">Admin User</p>
              <p className="text-gray-500 text-xs">admin@example.com</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
