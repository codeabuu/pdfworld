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

  async login(email: string, password: string): Promise<{ success: boolean; userId?: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login/`, {
        email,
        password
      });
      
      // Store user ID from response if available
      if (response.data.user?.id) {
        currentUserId = response.data.user.id;
        localStorage.setItem('user_id', currentUserId);
      }
      
      return { success: response.status === 200, userId: currentUserId || undefined };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false };
    }
  }

  getAuthToken(): string | null {
    return authToken || localStorage.getItem('auth_token');
  }

  getUserId(): string | null {
    return currentUserId || localStorage.getItem('user_id');
  }

  async signUp(email: string, password: string, firstName: string, lastName: string): Promise<boolean> {
    try {
      await axios.post(`${API_BASE_URL}/api/signup/`, { 
        email, 
        password, 
        firstName, 
        lastName 
      });
      return true;
    } catch (error) {
      throw new Error('Too many attempts, please try again later.');
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
}

export const authService = new AuthService();