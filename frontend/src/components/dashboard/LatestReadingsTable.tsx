import { memo } from 'react'
import { Activity } from 'lucide-react'
import { useLatestSensorLogs } from '@/hooks/useSensorLogs'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorState } from '@/components/common/ErrorState'
import { safeFormatDate, safeNumber } from '@/utils/format'

export const LatestReadingsTable = memo(function LatestReadingsTable() {
  const {
    data: latestLogs,
    isLoading,
    isError,
    error,
    refetch,
  } = useLatestSensorLogs()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load readings"
        message={error?.message}
        onRetry={refetch}
        className="shadow-none"
      />
    )
  }

  if (!latestLogs || latestLogs.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <Activity className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No readings yet
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Sensor data will appear here once available
        </p>
      </div>
    )
  }

  return (
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
          <tr key={log.id ?? `${log.sensorName}-${log.timestamp}`} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {log.bedroomName}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {log.sensorName} ({log.sensorType})
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {safeNumber(log.value, 2)} {log.unit}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {safeFormatDate(log.timestamp, 'MMM dd, yyyy HH:mm:ss')}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
})
