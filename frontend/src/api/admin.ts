import { apiClient } from './client'

export interface AdminUser {
  id: number
  email: string
  role: 'user' | 'admin'
  is_active: boolean
  created_at: string
  updated_at: string
  mukellef_count: number
}

export interface UserListResponse {
  items: AdminUser[]
  total: number
  page: number
  page_size: number
}

export interface AdminStats {
  total_users: number
  active_users: number
  total_mukellefler: number
  admin_count: number
  user_count: number
}

export interface MukellefKisa {
  id: number
  unvan: string
  vkn: string
  is_owner: boolean
}

export interface KullaniciSirketler {
  yetkili_sirketler: MukellefKisa[]
  tum_sirketler: MukellefKisa[]
}

export const adminApi = {
  listUsers: (params?: { page?: number; page_size?: number; role?: string; is_active?: boolean }) =>
    apiClient.get<UserListResponse>('/admin/users', { params }).then(r => r.data),
  getUser: (id: number) => apiClient.get<AdminUser>(`/admin/users/${id}`).then(r => r.data),
  updateUser: (id: number, data: { role?: string; is_active?: boolean }) =>
    apiClient.patch<AdminUser>(`/admin/users/${id}`, data).then(r => r.data),
  deleteUser: (id: number) => apiClient.delete(`/admin/users/${id}`),
  getStats: () => apiClient.get<AdminStats>('/admin/stats').then(r => r.data),
  getUserSirketler: (userId: number) =>
    apiClient.get<KullaniciSirketler>(`/admin/users/${userId}/sirketler`).then(r => r.data),
  addUserSirket: (userId: number, mukellefId: number) =>
    apiClient.post(`/admin/users/${userId}/sirketler`, { mukellef_id: mukellefId }).then(r => r.data),
  removeUserSirket: (userId: number, mukellefId: number) =>
    apiClient.delete(`/admin/users/${userId}/sirketler/${mukellefId}`),
}
