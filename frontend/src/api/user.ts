import { apiClient } from './client'

export interface UserProfile {
  id: number
  email: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
  mukellef_count: number
}

export const userApi = {
  getProfile: () => apiClient.get<UserProfile>('/users/me/profile').then(r => r.data),
  updateProfile: (data: { email?: string }) => apiClient.patch('/users/me', data).then(r => r.data),
  changePassword: (data: { current_password: string; new_password: string }) =>
    apiClient.post('/users/me/change-password', data),
}
