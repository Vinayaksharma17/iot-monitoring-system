import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sensorSchema, type SensorFormData } from '@/validation/schemas'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { useCreateSensor, useUpdateSensor } from '@/hooks/useSensors'
import { useBedrooms } from '@/hooks/useBedrooms'
import type { Sensor } from '@/types'

type SensorFormModalProps = {
  isOpen: boolean
  editingSensor: Sensor | null
  defaultBedroomId: number | null
  onClose: () => void
}

const permissionHint = (message: string) =>
  `${message}. Please login as admin or contact an admin.`

const defaultValuesFor = (
  editingSensor: Sensor | null,
  defaultBedroomId: number | null
): Partial<SensorFormData> => {
  if (editingSensor) {
    return {
      bedroomId: editingSensor.bedroomId,
      name: editingSensor.name,
      type: editingSensor.type,
      unit: editingSensor.unit,
      minValue:
        editingSensor.minValue !== null
          ? Number(editingSensor.minValue)
          : undefined,
      maxValue:
        editingSensor.maxValue !== null
          ? Number(editingSensor.maxValue)
          : undefined,
      isActive: editingSensor.isActive,
    }
  }
  return {
    bedroomId: defaultBedroomId || undefined,
    name: '',
    type: 'temperature',
    unit: '°C',
    minValue: undefined,
    maxValue: undefined,
    isActive: true,
  }
}

export function SensorFormModal({
  isOpen,
  editingSensor,
  defaultBedroomId,
  onClose,
}: SensorFormModalProps) {
  const { data: bedrooms } = useBedrooms()
  const createMutation = useCreateSensor()
  const updateMutation = useUpdateSensor()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<SensorFormData>({
    resolver: zodResolver(sensorSchema),
    // Numeric fields are undefined until the user types them; the schema
    // enforces required/finite on submit.
    values: defaultValuesFor(editingSensor, defaultBedroomId) as SensorFormData,
  })

  const sensorType = watch('type')

  const handleClose = () => {
    clearErrors()
    reset()
    onClose()
  }

  const onSubmit = async (data: SensorFormData) => {
    try {
      if (editingSensor) {
        await updateMutation.mutateAsync({ id: editingSensor.id, data })
      } else {
        await createMutation.mutateAsync(data)
      }
      handleClose()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save sensor'
      setError('root', {
        type: 'server',
        message: permissionHint(message),
      })
    }
  }

  const mutationError = createMutation.error ?? updateMutation.error

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingSensor ? 'Edit Sensor' : 'Add Sensor'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="sensor-bedroomId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Bedroom
          </label>
          <select
            id="sensor-bedroomId"
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
            htmlFor="sensor-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name
          </label>
          <input
            id="sensor-name"
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
            htmlFor="sensor-type"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Type
          </label>
          <select
            id="sensor-type"
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
            htmlFor="sensor-unit"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Unit
          </label>
          <input
            id="sensor-unit"
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
              htmlFor="sensor-minValue"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Min Value
            </label>
            <input
              id="sensor-minValue"
              type="number"
              step="0.01"
              {...register('minValue', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
            />
            {errors.minValue && (
              <p className="mt-1 text-sm text-red-600">
                {errors.minValue.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="sensor-maxValue"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Max Value
            </label>
            <input
              id="sensor-maxValue"
              type="number"
              step="0.01"
              {...register('maxValue', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="100"
            />
            {errors.maxValue && (
              <p className="mt-1 text-sm text-red-600">
                {errors.maxValue.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="sensor-isActive"
            type="checkbox"
            {...register('isActive')}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label
            htmlFor="sensor-isActive"
            className="ml-2 text-sm text-gray-700"
          >
            Active
          </label>
        </div>

        {(errors.root || mutationError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
            {errors.root?.message ||
              (mutationError instanceof Error
                ? permissionHint(mutationError.message)
                : 'Action not permitted. Please login as admin or contact an admin.')}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={handleClose}>
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
  )
}
