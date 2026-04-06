import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Calisma } from '@/types'

export function useCalismalar(donemId: number | undefined) {
  return useQuery<Calisma[]>({
    queryKey: ['calismalar', donemId],
    queryFn: async () => {
      const { data } = await apiClient.get<Calisma[]>(`/donem/${donemId}/calisma`)
      return data
    },
    enabled: donemId !== undefined,
  })
}

export function useCalisma(id: number | undefined) {
  return useQuery<Calisma>({
    queryKey: ['calisma', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Calisma>(`/calisma/${id}`)
      return data
    },
    enabled: id !== undefined,
  })
}

export function useTamamla(calismaId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation<Calisma, Error, void>({
    mutationFn: async () => {
      if (!calismaId) throw new Error('calismaId is required')
      const { data } = await apiClient.post<Calisma>(`/calisma/${calismaId}/tamamla`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calisma', calismaId] })
    },
  })
}

export function useYenidenAc(calismaId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation<Calisma, Error, void>({
    mutationFn: async () => {
      if (!calismaId) throw new Error('calismaId is required')
      const { data } = await apiClient.post<Calisma>(`/calisma/${calismaId}/yeniden_ac`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calisma', calismaId] })
    },
  })
}

export function useDeleteCalisma(donemId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (calismaId) => {
      await apiClient.delete(`/calisma/${calismaId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calismalar', donemId] })
    },
  })
}

export function useCreateCalisma(donemId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation<Calisma, Error, void>({
    mutationFn: async () => {
      if (!donemId) throw new Error('donemId is required')
      const { data } = await apiClient.post<Calisma>(`/donem/${donemId}/calisma`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calismalar', donemId] })
    },
  })
}
