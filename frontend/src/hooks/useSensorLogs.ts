import { useQuery } from '@tanstack/react-query'
import { sensorLogApi } from '@/services/api'
import type { LatestReading } from '@/types'

// Query keys
export const sensorLogKeys = {
  all: ['sensor-logs'] as const,
  latest: ['sensor-logs', 'latest'] as const,
  bySensor: (sensorId: number, limit?: number) =>
    ['sensor-logs', 'sensor', sensorId, limit] as const,
}

// Get latest sensor logs
export function useLatestSensorLogs() {
  return useQuery<LatestReading[], Error>({
    queryKey: sensorLogKeys.latest,
    queryFn: sensorLogApi.getLatest,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  })
}

// Get sensor logs by sensor ID
export function useSensorLogsBySensor(
  sensorId: number | null,
  limit: number = 100
) {
  return useQuery<LatestReading[], Error>({
    queryKey: sensorId
      ? sensorLogKeys.bySensor(sensorId, limit)
      : ['sensor-logs', 'sensor', 'none'],
    queryFn: () => sensorLogApi.getBySensor(sensorId!, limit),
    enabled: sensorId !== null,
    refetchInterval: 5000, // Refetch every 5 seconds
  })
}
