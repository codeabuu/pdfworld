// services/authService.ts
import axios from 'axios';

const API_BASE_URL = "http://127.0.0.1:8000";

let authToken: string | null = null;

// Configure axios to send credentials (cookies for session auth)
axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

class AuthService {
  async checkAuth(): Promise<boolean> {
    try {
    // Get token from memory or localStorage
    const token = authToken || localStorage.getItem('auth_token');
    
    const config = token ? {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    } : {};
    
    console.log('Checking auth with token:', token ? token.substring(0, 20) + '...' : 'No token');

    const response = await axios.get(`${API_BASE_URL}/api/me/`, config);
    console.log('Auth check successful:', response.data);
    return true;
  } catch (error: any) {
    console.error("Auth check failed:", error.response?.data || error.message);
    return false;
  }
  }

  // services/Myauthservice.ts
async login(email: string, password: string): Promise<boolean> {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/login/`, {
      email,
      password
    });
    
    console.log('Login response:', response.data);
    
    // Store the JWT token from the response
    if (response.data.session?.access_token) {
      authToken = response.data.session.access_token;
      localStorage.setItem('auth_token', authToken);
      console.log('JWT token stored:', authToken.substring(0, 20) + '...');
    }
    
    return response.status === 200;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
};
getAuthToken(): string | null {
    return authToken || localStorage.getItem('auth_token');
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
      throw new Error('Failed to create account. Please try again.');
    }
  }

  async logout(): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/api/logout/`);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}

export const authService = new AuthService();