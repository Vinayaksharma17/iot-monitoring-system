import { memo } from 'react'
import { Edit2, Trash2, Thermometer, Droplets } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import type { Sensor } from '@/types'

const getSensorIcon = (type: string) =>
  type === 'temperature' ? Thermometer : Droplets

type SensorCardProps = {
  sensor: Sensor
  isDeleting: boolean
  onEdit: (sensor: Sensor) => void
  onDelete: (id: number) => void
}

export const SensorCard = memo(function SensorCard({
  sensor,
  isDeleting,
  onEdit,
  onDelete,
}: SensorCardProps) {
  const Icon = getSensorIcon(sensor.type)
  const isTemperature = sensor.type === 'temperature'

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div
            className={`p-3 rounded-lg ${
              isTemperature ? 'bg-orange-100' : 'bg-blue-100'
            }`}
          >
            <Icon
              className={`h-6 w-6 ${
                isTemperature ? 'text-orange-600' : 'text-blue-600'
              }`}
            />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {sensor.name}
            </h3>
            <p className="text-sm text-gray-500 capitalize">{sensor.type}</p>
          </div>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            sensor.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {sensor.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Unit:</span>
          <span className="font-medium text-gray-900">{sensor.unit}</span>
        </div>
        {sensor.minValue !== null && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Min Value:</span>
            <span className="font-medium text-gray-900">
              {sensor.minValue} {sensor.unit}
            </span>
          </div>
        )}
        {sensor.maxValue !== null && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Max Value:</span>
            <span className="font-medium text-gray-900">
              {sensor.maxValue} {sensor.unit}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200">
        <span className="text-sm text-gray-500">ID: {sensor.id}</span>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => onEdit(sensor)}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(sensor.id)}
            disabled={isDeleting}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete"
          >
            {isDeleting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
})
