// auth.service.js
class AuthService {
  constructor(baseURL = 'http://127.0.0.1:8000/api/v1/auth') {
    this.baseURL = baseURL
    this.token = localStorage.getItem('access_token')
  }

  async register(email, firstName, lastName, password, passwordConfirm, role = 'STUDENT') {
    try {
      const response = await fetch(`${this.baseURL}/users/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName,
          password,
          password_confirm: passwordConfirm,
          role
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(JSON.stringify(error))
      }

      const data = await response.json()
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/users/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Login failed')
      }

      const data = await response.json()
      
      // Sauvegarder les tokens
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      this.token = data.access
      return { success: true, user: data.user, token: data.access }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async logout() {
    try {
      const response = await this.authenticatedRequest(`${this.baseURL}/users/logout/`, {
        method: 'POST'
      })

      // Nettoyer
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      this.token = null

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async getProfile() {
    return this.authenticatedRequest(`${this.baseURL}/users/me/`, { method: 'GET' })
  }

  async updateProfile(data) {
    return this.authenticatedRequest(`${this.baseURL}/users/me/update/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async changePassword(oldPassword, newPassword) {
    return this.authenticatedRequest(`${this.baseURL}/users/me/change-password/`, {
      method: 'POST',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword
      })
    })
  }

  async getUsers(filters = {}) {
    const params = new URLSearchParams()
    if (filters.role) params.append('role', filters.role)
    if (filters.search) params.append('search', filters.search)
    if (filters.page) params.append('page', filters.page)

    let url = `${this.baseURL}/users/`
    if (params.toString()) url += '?' + params.toString()

    return this.authenticatedRequest(url, { method: 'GET' })
  }

  async getUser(id) {
    return this.authenticatedRequest(`${this.baseURL}/users/${id}/`, { method: 'GET' })
  }

  isAuthenticated() {
    return !!localStorage.getItem('access_token')
  }

  getUser() {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }

  async authenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Not authenticated')
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }

    const response = await fetch(url, { ...options, headers })

    if (response.status === 401) {
      // Token expiré, essayer de le rafraîchir
      const refreshed = await this.refreshToken()
      if (refreshed) {
        return this.authenticatedRequest(url, options)
      } else {
        // Logout
        this.logout()
        throw new Error('Session expired')
      }
    }

    if (!response.ok) {
      const error = await response.json()
      throw new Error(JSON.stringify(error))
    }

    return await response.json()
  }

  async refreshToken() {
    try {
      const refresh = localStorage.getItem('refresh_token')
      if (!refresh) return false

      const response = await fetch('http://127.0.0.1:8000/api/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh })
      })

      if (!response.ok) return false

      const data = await response.json()
      localStorage.setItem('access_token', data.access)
      this.token = data.access
      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }
}

export default new AuthService()