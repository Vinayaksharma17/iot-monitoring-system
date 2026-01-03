import { Link } from 'react-router-dom'
import { Bed, Gauge, Activity, TrendingUp, ExternalLink } from 'lucide-react'
import { useBedrooms } from '@/hooks/useBedrooms'
import { useSensors } from '@/hooks/useSensors'
import { useLatestSensorLogs } from '@/hooks/useSensorLogs'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { format } from 'date-fns'

export function Dashboard() {
  const { data: bedrooms, isLoading: bedroomsLoading } = useBedrooms()
  const { data: sensors, isLoading: sensorsLoading } = useSensors()
  const { data: latestLogs, isLoading: logsLoading } = useLatestSensorLogs()

  if (bedroomsLoading || sensorsLoading || logsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const totalReadings = latestLogs?.length || 0
  const activeSensors = sensors?.filter((s) => s.isActive).length || 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of your IoT monitoring system
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Bedrooms"
          value={bedrooms?.length || 0}
          icon={Bed}
          color="blue"
          link="/bedrooms"
        />
        <StatCard
          title="Total Sensors"
          value={sensors?.length || 0}
          icon={Gauge}
          color="green"
          link="/sensors"
        />
        <StatCard
          title="Active Sensors"
          value={activeSensors}
          icon={Activity}
          color="purple"
        />
        <StatCard
          title="Latest Readings"
          value={totalReadings}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Latest Sensor Readings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Latest Sensor Readings
          </h2>
        </div>
        <div className="overflow-x-auto">
          {!latestLogs || latestLogs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No readings yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Sensor data will appear here once available
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bedroom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sensor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {latestLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.bedroomName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.sensorName} ({log.sensorType})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {Number(log.value).toFixed(2)} {log.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Links
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/bedrooms"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <Bed className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Manage Bedrooms</h3>
              <p className="text-sm text-gray-500">Add, edit, or delete</p>
            </div>
          </Link>
          <Link
            to="/sensors"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <Gauge className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Manage Sensors</h3>
              <p className="text-sm text-gray-500">Configure sensors</p>
            </div>
          </Link>
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <Activity className="h-8 w-8 text-primary-600 mr-3" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">View in Grafana</h3>
              <p className="text-sm text-gray-500">Detailed analytics</p>
            </div>
            <ExternalLink className="h-5 w-5 text-gray-400" />
          </a>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number
  icon: React.ElementType
  color: 'blue' | 'green' | 'purple' | 'orange'
  link?: string
}

function StatCard({ title, value, icon: Icon, color, link }: StatCardProps) {
  const colorStyles = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  }

  const content = (
    <>
      <div className={`p-3 rounded-lg ${colorStyles[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </>
  )

  if (link) {
    return (
      <Link
        to={link}
        className="flex items-center bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="flex items-center bg-white p-6 rounded-lg shadow">
      {content}
    </div>
  )
}
