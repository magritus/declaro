import axios from 'axios'

const TOKEN_KEY = 'declaro-auth-token'

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  let token: string | null = null
  try {
    token = localStorage.getItem(TOKEN_KEY)
  } catch {
    // ignore storage errors
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem(TOKEN_KEY)
      } catch {
        // ignore storage errors
      }
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
