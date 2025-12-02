// API helper to use environment variable for backend URL in production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://marketing-hack-i59y.vercel.app/'

export const apiFetch = (path, options = {}) => {
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path
  return fetch(url, options)
}



