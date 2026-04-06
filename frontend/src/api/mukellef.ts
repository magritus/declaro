import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Mukellef } from '@/types'

interface CreateMukellefInput {
  unvan: string
  vkn: string
  vergi_dairesi?: string
  kv_orani: number
}

interface UpdateMukellefInput {
  unvan?: string
  vergi_dairesi?: string
  kv_orani?: number
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

export function useUpdateMukellef() {
  const queryClient = useQueryClient()
  return useMutation<Mukellef, Error, { id: number } & UpdateMukellefInput>({
    mutationFn: async ({ id, ...input }) => {
      const { data } = await apiClient.put<Mukellef>(`/mukellef/${id}`, input)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mukellefler'] })
      queryClient.invalidateQueries({ queryKey: ['mukellef', data.id] })
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
