import axios from 'axios';

const API_BASE_URL = "http://127.0.0.1:8000";

let authToken: string | null = null;
let currentUserId: string | null = null;

// Configure axios to send credentials (cookies for session auth)
axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

class AuthService {
  async checkAuth(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/me/`);
      
      if (response.data.user?.id) {
        currentUserId = response.data.user.id;
        localStorage.setItem('user_id', currentUserId);
      }

      return true;
    } catch (error: any) {
      console.error("Auth check failed:", error.response?.data || error.message);
      return false;
    }
  }

  async checkAuthStatus(): Promise<{ authenticated: boolean; user?: any }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/check-auth/`);
      return response.data;
    } catch (error: any) {
      console.error("Auth status check failed:", error.response?.data || error.message);
      return { authenticated: false };
    }
  }

  async login(email: string, password: string, rememberMe: boolean = true): Promise<{ success: boolean; userId?: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login/`, {
        email,
        password,
        remember_me: rememberMe
      });
      
      // Store user ID from response if available
      if (response.data.user?.id) {
        currentUserId = response.data.user.id;
        localStorage.setItem('user_id', currentUserId);
      }
      
      return { success: response.status === 200, userId: currentUserId || undefined };
    } catch (error: any) {
      console.error('Login failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }

  getAuthToken(): string | null {
    return authToken || localStorage.getItem('auth_token');
  }

  getUserId(): string | null {
    return currentUserId || localStorage.getItem('user_id');
  }

  async signUp(email: string, password: string, firstName: string, lastName: string, rememberMe: boolean = true): Promise<boolean> {
    try {
      await axios.post(`${API_BASE_URL}/api/signup/`, { 
        email, 
        password, 
        firstName, 
        lastName,
        remember_me: rememberMe
      });
      return true;
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Too many attempts, please try again later.');
      }
      throw new Error(error.response?.data?.error || 'Signup failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/api/logout/`);
      // Clear user data
      currentUserId = null;
      localStorage.removeItem('user_id');
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  // Helper to get CSRF token
  async getCsrfToken(): Promise<string> {
    try {
      await axios.get(`${API_BASE_URL}/api/csrf/`);
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1] || '';
      return cookieValue;
    } catch (error) {
      console.error('CSRF token fetch failed:', error);
      return '';
    }
  }
}

export const authService = new AuthService();