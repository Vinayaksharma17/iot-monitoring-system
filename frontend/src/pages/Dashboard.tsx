import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bed, Gauge, Activity, TrendingUp } from 'lucide-react'
import { useBedrooms } from '@/hooks/useBedrooms'
import { useSensors, useActiveSensors } from '@/hooks/useSensors'
import { useLatestSensorLogs } from '@/hooks/useSensorLogs'
import { StatCard } from '@/components/dashboard/StatCard'
import { LatestReadingsTable } from '@/components/dashboard/LatestReadingsTable'
import { GrafanaDashboardModal } from '@/components/dashboard/GrafanaDashboardModal'
import { ErrorState } from '@/components/common/ErrorState'
import {
  IS_GRAFANA_ENABLED,
  type GrafanaDashboardKey,
} from '@/utils/grafana'

const StatCardSkeleton = ({ title }: { title: string }) => (
  <div className="flex items-center bg-white p-6 rounded-lg shadow animate-pulse">
    <div className="p-3 rounded-lg bg-gray-200 h-12 w-12" />
    <div className="ml-4 flex-1">
      <div className="h-3 bg-gray-200 rounded w-24" />
      <div className="h-7 bg-gray-200 rounded w-16 mt-2" />
    </div>
    <span className="sr-only">{title}</span>
  </div>
)

export function Dashboard() {
  const bedroomsQuery = useBedrooms()
  const sensorsQuery = useSensors()
  const activeSensorsQuery = useActiveSensors()
  const {
    data: latestLogs,
    isLoading: logsLoading,
    refetch: refetchLogs,
    isError: logsError,
    error: logsErrorData,
  } = useLatestSensorLogs()
  const [grafanaModal, setGrafanaModal] = useState<GrafanaDashboardKey | null>(
    null
  )

  const statsLoading =
    bedroomsQuery.isLoading ||
    sensorsQuery.isLoading ||
    activeSensorsQuery.isLoading
  const statsError =
    bedroomsQuery.isError || sensorsQuery.isError || activeSensorsQuery.isError

  const retryStats = () => {
    if (bedroomsQuery.isError) bedroomsQuery.refetch()
    if (sensorsQuery.isError) sensorsQuery.refetch()
    if (activeSensorsQuery.isError) activeSensorsQuery.refetch()
  }

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
      {statsError ? (
        <ErrorState title="Failed to load overview" onRetry={retryStats} />
      ) : statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCardSkeleton title="Total Bedrooms" />
          <StatCardSkeleton title="Total Sensors" />
          <StatCardSkeleton title="Active Sensors" />
          <StatCardSkeleton title="Latest Readings" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Bedrooms"
            value={bedroomsQuery.data?.length || 0}
            icon={Bed}
            color="blue"
            link="/bedrooms"
          />
          <StatCard
            title="Total Sensors"
            value={sensorsQuery.data?.length || 0}
            icon={Gauge}
            color="green"
            link="/sensors"
          />
          <StatCard
            title="Active Sensors"
            value={activeSensorsQuery.data?.length || 0}
            icon={Activity}
            color="purple"
          />
          <StatCard
            title="Latest Readings"
            value={logsLoading ? '…' : latestLogs?.length || 0}
            icon={TrendingUp}
            color="orange"
          />
        </div>
      )}

      {/* Latest Sensor Readings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Latest Sensor Readings
          </h2>
        </div>
        <div className="overflow-x-auto">
          {logsError ? (
            <ErrorState
              title="Failed to load readings"
              message={logsErrorData?.message}
              onRetry={refetchLogs}
              className="shadow-none"
            />
          ) : (
            <LatestReadingsTable />
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Links
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          {IS_GRAFANA_ENABLED && (
            <>
              <button
                type="button"
                onClick={() => setGrafanaModal('allBedrooms')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left w-full"
              >
                <Activity className="h-8 w-8 text-primary-600 mr-3" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">All Bedrooms</h3>
                  <p className="text-sm text-gray-500">Real-time overview</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setGrafanaModal('singleBedroom')}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left w-full"
              >
                <Activity className="h-8 w-8 text-primary-600 mr-3" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Single Bedroom</h3>
                  <p className="text-sm text-gray-500">Detailed view</p>
                </div>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grafana Dashboard Modal */}
      {grafanaModal && (
        <GrafanaDashboardModal
          dashboardKey={grafanaModal}
          onClose={() => setGrafanaModal(null)}
        />
      )}
    </div>
  )
}

