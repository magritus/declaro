import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Mukellef } from '@/types'

interface CreateMukellefInput {
  unvan: string
  vkn: string
  vergi_dairesi?: string
}

export function useMukellefler() {
  return useQuery<Mukellef[]>({
    queryKey: ['mukellefler'],
    queryFn: async () => {
      const { data } = await apiClient.get<Mukellef[]>('/mukellef')
      return data
    },
  })
}

export function useMukellef(id: number | undefined) {
  return useQuery<Mukellef>({
    queryKey: ['mukellef', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Mukellef>(`/mukellef/${id}`)
      return data
    },
    enabled: id !== undefined,
  })
}

export function useCreateMukellef() {
  const queryClient = useQueryClient()
  return useMutation<Mukellef, Error, CreateMukellefInput>({
    mutationFn: async (input) => {
      const { data } = await apiClient.post<Mukellef>('/mukellef', input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mukellefler'] })
    },
  })
}

export function useDeleteMukellef() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/mukellef/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mukellefler'] })
    },
  })
}
