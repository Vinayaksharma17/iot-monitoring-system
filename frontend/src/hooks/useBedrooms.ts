import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bedroomApi } from '@/services/api'
import type { Bedroom, CreateBedroomInput, UpdateBedroomInput } from '@/types'

// Query keys
export const bedroomKeys = {
  all: ['bedrooms'] as const,
  detail: (id: number) => ['bedrooms', id] as const,
}

// Get all bedrooms
export function useBedrooms() {
  return useQuery<Bedroom[], Error>({
    queryKey: bedroomKeys.all,
    queryFn: bedroomApi.getAll,
  })
}

// Get bedroom by ID
export function useBedroom(id: number) {
  return useQuery<Bedroom, Error>({
    queryKey: bedroomKeys.detail(id),
    queryFn: () => bedroomApi.getById(id),
    enabled: !!id,
  })
}

// Create bedroom
export function useCreateBedroom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBedroomInput) => bedroomApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bedroomKeys.all })
    },
  })
}

// Update bedroom
export function useUpdateBedroom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBedroomInput }) =>
      bedroomApi.update(id, data),
    onSuccess: (
      _data: Bedroom,
      variables: { id: number; data: UpdateBedroomInput }
    ) => {
      queryClient.invalidateQueries({ queryKey: bedroomKeys.all })
      queryClient.invalidateQueries({
        queryKey: bedroomKeys.detail(variables.id),
      })
    },
  })
}

// Delete bedroom
export function useDeleteBedroom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => bedroomApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bedroomKeys.all })
    },
  })
}
