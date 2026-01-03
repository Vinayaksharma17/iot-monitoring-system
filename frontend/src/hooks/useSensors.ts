import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sensorApi } from '@/services/api'
import type { Sensor, CreateSensorInput, UpdateSensorInput } from '@/types'

// Query keys
export const sensorKeys = {
  all: ['sensors'] as const,
  byBedroom: (bedroomId: number) => ['sensors', 'bedroom', bedroomId] as const,
  detail: (id: number) => ['sensors', id] as const,
}

// Get all sensors
export function useSensors() {
  return useQuery<Sensor[], Error>({
    queryKey: sensorKeys.all,
    queryFn: sensorApi.getAll,
  })
}

// Get sensors by bedroom ID
export function useSensorsByBedroom(bedroomId: number | null) {
  return useQuery<Sensor[], Error>({
    queryKey: bedroomId
      ? sensorKeys.byBedroom(bedroomId)
      : ['sensors', 'bedroom', 'none'],
    queryFn: () => sensorApi.getByBedroom(bedroomId!),
    enabled: bedroomId !== null,
  })
}

// Get sensor by ID
export function useSensor(id: number) {
  return useQuery<Sensor, Error>({
    queryKey: sensorKeys.detail(id),
    queryFn: () => sensorApi.getById(id),
    enabled: !!id,
  })
}

// Create sensor
export function useCreateSensor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSensorInput & { bedroomId: number }) =>
      sensorApi.create(data),
    onSuccess: (newSensor: Sensor) => {
      queryClient.invalidateQueries({ queryKey: sensorKeys.all })
      queryClient.invalidateQueries({
        queryKey: sensorKeys.byBedroom(newSensor.bedroomId),
      })
    },
  })
}

// Update sensor
export function useUpdateSensor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSensorInput }) =>
      sensorApi.update(id, data),
    onSuccess: (
      updatedSensor: Sensor,
      variables: { id: number; data: UpdateSensorInput }
    ) => {
      queryClient.invalidateQueries({ queryKey: sensorKeys.all })
      queryClient.invalidateQueries({
        queryKey: sensorKeys.byBedroom(updatedSensor.bedroomId),
      })
      queryClient.invalidateQueries({
        queryKey: sensorKeys.detail(variables.id),
      })
    },
  })
}

// Delete sensor
export function useDeleteSensor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => sensorApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sensorKeys.all })
    },
  })
}
