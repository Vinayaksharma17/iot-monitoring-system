import { useState } from 'react'
import { Gauge, Plus } from 'lucide-react'
import { useBedrooms } from '@/hooks/useBedrooms'
import { useSensorsByBedroom, useDeleteSensor } from '@/hooks/useSensors'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { SensorCard } from '@/components/sensors/SensorCard'
import { SensorFormModal } from '@/components/sensors/SensorFormModal'
import type { Sensor } from '@/types'

export function Sensors() {
  const [selectedBedroomId, setSelectedBedroomId] = useState<number | null>(
    null
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const { data: bedrooms, isLoading: bedroomsLoading } = useBedrooms()
  const {
    data: sensors,
    isLoading: sensorsLoading,
    isError: sensorsError,
    error: sensorsErrorData,
    refetch: refetchSensors,
  } = useSensorsByBedroom(selectedBedroomId)
  const deleteMutation = useDeleteSensor()

  const openCreateModal = () => {
    setEditingSensor(null)
    setIsModalOpen(true)
  }

  const openEditModal = (sensor: Sensor) => {
    setEditingSensor(sensor)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingSensor(null)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this sensor?')) {
      return
    }

    setDeletingId(id)
    try {
      await deleteMutation.mutateAsync(id)
    } catch (deleteError) {
      console.error('Failed to delete sensor:', deleteError)
    } finally {
      setDeletingId(null)
    }
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
              {bedroom.description
                ? `${bedroom.name} (${bedroom.description})`
                : bedroom.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sensors List */}
      {!selectedBedroomId ? (
        <EmptyState
          icon={Gauge}
          title="No bedroom selected"
          description="Please select a bedroom to view its sensors"
        />
      ) : sensorsLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : sensorsError ? (
        <ErrorState
          title="Failed to load sensors"
          message={sensorsErrorData?.message}
          onRetry={refetchSensors}
        />
      ) : !sensors || sensors.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title="No sensors"
          description="Get started by creating a new sensor for this bedroom"
          action={
            <Button onClick={openCreateModal}>
              <Plus className="h-5 w-5 mr-2" />
              Add Sensor
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sensors.map((sensor) => (
            <SensorCard
              key={sensor.id}
              sensor={sensor}
              isDeleting={deletingId === sensor.id}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <SensorFormModal
        isOpen={isModalOpen}
        editingSensor={editingSensor}
        defaultBedroomId={selectedBedroomId}
        onClose={closeModal}
      />
    </div>
  )
}
