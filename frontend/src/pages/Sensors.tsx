import { useState } from 'react'
import { Gauge, Plus, Edit2, Trash2, Thermometer, Droplets } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useBedrooms } from '@/hooks/useBedrooms'
import {
  useSensorsByBedroom,
  useCreateSensor,
  useUpdateSensor,
  useDeleteSensor,
} from '@/hooks/useSensors'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import type { Sensor } from '@/types'

const sensorSchema = z.object({
  bedroomId: z.number().int().positive('Bedroom is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  type: z.enum(['temperature', 'humidity'], {
    errorMap: () => ({ message: 'Type must be temperature or humidity' }),
  }),
  unit: z.string().min(1, 'Unit is required').max(20, 'Unit too long'),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  isActive: z.boolean().default(true),
})

type SensorFormData = z.infer<typeof sensorSchema>

export function Sensors() {
  const [selectedBedroomId, setSelectedBedroomId] = useState<number | null>(
    null
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const { data: bedrooms, isLoading: bedroomsLoading } = useBedrooms()
  const { data: sensors, isLoading: sensorsLoading } =
    useSensorsByBedroom(selectedBedroomId)
  const createMutation = useCreateSensor()
  const updateMutation = useUpdateSensor()
  const deleteMutation = useDeleteSensor()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SensorFormData>({
    resolver: zodResolver(sensorSchema),
  })

  const sensorType = watch('type')

  const openCreateModal = () => {
    setEditingSensor(null)
    reset({
      bedroomId: selectedBedroomId || undefined,
      name: '',
      type: 'temperature',
      unit: '°C',
      minValue: undefined,
      maxValue: undefined,
      isActive: true,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (sensor: Sensor) => {
    setEditingSensor(sensor)
    reset({
      bedroomId: sensor.bedroomId,
      name: sensor.name,
      type: sensor.type as 'temperature' | 'humidity',
      unit: sensor.unit,
      minValue: sensor.minValue !== null ? Number(sensor.minValue) : undefined,
      maxValue: sensor.maxValue !== null ? Number(sensor.maxValue) : undefined,
      isActive: sensor.isActive,
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingSensor(null)
    reset()
  }

  const onSubmit = async (data: SensorFormData) => {
    try {
      if (editingSensor) {
        await updateMutation.mutateAsync({
          id: editingSensor.id,
          data,
        })
      } else {
        await createMutation.mutateAsync(data)
      }
      closeModal()
    } catch (error) {
      console.error('Failed to save sensor:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this sensor?')) {
      return
    }

    setDeletingId(id)
    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      console.error('Failed to delete sensor:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const getSensorIcon = (type: string) => {
    return type === 'temperature' ? Thermometer : Droplets
  }

  if (bedroomsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sensors</h1>
          <p className="mt-2 text-gray-600">
            Manage sensors and their configurations
          </p>
        </div>
        <Button onClick={openCreateModal} disabled={!selectedBedroomId}>
          <Plus className="h-5 w-5 mr-2" />
          Add Sensor
        </Button>
      </div>

      {/* Bedroom Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <label
          htmlFor="bedroom-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Select Bedroom
        </label>
        <select
          id="bedroom-select"
          value={selectedBedroomId || ''}
          onChange={(e) =>
            setSelectedBedroomId(e.target.value ? Number(e.target.value) : null)
          }
          className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">-- Choose a bedroom --</option>
          {bedrooms?.map((bedroom) => (
            <option key={bedroom.id} value={bedroom.id}>
              {bedroom.name} ({bedroom.description})
            </option>
          ))}
        </select>
      </div>

      {/* Sensors List */}
      {!selectedBedroomId ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Gauge className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No bedroom selected
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Please select a bedroom to view its sensors
          </p>
        </div>
      ) : sensorsLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : !sensors || sensors.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Gauge className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sensors</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new sensor for this bedroom
          </p>
          <div className="mt-6">
            <Button onClick={openCreateModal}>
              <Plus className="h-5 w-5 mr-2" />
              Add Sensor
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sensors.map((sensor) => {
            const Icon = getSensorIcon(sensor.type)
            return (
              <div
                key={sensor.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div
                      className={`p-3 rounded-lg ${
                        sensor.type === 'temperature'
                          ? 'bg-orange-100'
                          : 'bg-blue-100'
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${
                          sensor.type === 'temperature'
                            ? 'text-orange-600'
                            : 'text-blue-600'
                        }`}
                      />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {sensor.name}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {sensor.type}
                      </p>
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
                    <span className="font-medium text-gray-900">
                      {sensor.unit}
                    </span>
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
                      onClick={() => openEditModal(sensor)}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sensor.id)}
                      disabled={deletingId === sensor.id}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === sensor.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingSensor ? 'Edit Sensor' : 'Add Sensor'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="bedroomId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Bedroom
            </label>
            <select
              id="bedroomId"
              {...register('bedroomId', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">-- Select bedroom --</option>
              {bedrooms?.map((bedroom) => (
                <option key={bedroom.id} value={bedroom.id}>
                  {bedroom.name}
                </option>
              ))}
            </select>
            {errors.bedroomId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.bedroomId.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., DHT22 Sensor"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Type
            </label>
            <select
              id="type"
              {...register('type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="temperature">Temperature</option>
              <option value="humidity">Humidity</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="unit"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Unit
            </label>
            <input
              id="unit"
              type="text"
              {...register('unit')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={sensorType === 'humidity' ? '%' : '°C'}
            />
            {errors.unit && (
              <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="minValue"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Min Value (optional)
              </label>
              <input
                id="minValue"
                type="number"
                step="0.01"
                {...register('minValue', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label
                htmlFor="maxValue"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Max Value (optional)
              </label>
              <input
                id="maxValue"
                type="number"
                step="0.01"
                {...register('maxValue', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="100"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="isActive"
              type="checkbox"
              {...register('isActive')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingSensor ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
