import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Donem } from '@/types'

interface CreateDonemInput {
  yil: number
  ceyrek: 'Q1-GV' | 'Q2-GV' | 'Q3-GV' | 'YILLIK'
}

export function useDonemler(mukellefId: number | undefined) {
  return useQuery<Donem[]>({
    queryKey: ['donemler', mukellefId],
    queryFn: async () => {
      const { data } = await apiClient.get<Donem[]>(`/mukellef/${mukellefId}/donem`)
      return data
    },
    enabled: mukellefId !== undefined,
  })
}

export function useCreateDonem(mukellefId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation<Donem, Error, CreateDonemInput>({
    mutationFn: async (input) => {
      const { data } = await apiClient.post<Donem>(`/mukellef/${mukellefId}/donem`, input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donemler', mukellefId] })
    },
  })
}
