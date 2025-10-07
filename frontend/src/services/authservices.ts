// services/authService.ts
import axios from 'axios';

interface User {
  id: string;
  email: string;
  // Add other user properties as needed
}

interface Session {
  expires_at: number;
}

interface AuthResponse {
  user: User;
  session: Session;
}

interface LoginData {
  email: string;
  password: string;
  remember_me?: boolean; // Add remember_me to the request
}

// Create axios instance with default config
const api = axios.create({
  baseURL: '/', // or your API base URL
  withCredentials: true, // Always send cookies
});

class AuthService {
  private async request(endpoint: string, data: any): Promise<AuthResponse> {
    try {
      const response = await api.post(`/api/${endpoint}/`, data, {
        headers: {
          "X-CSRFToken": this.getCSRFToken(),
        },
      });
      return response.data;
    } catch (err: any) {
      if (err.response?.data?.error) {
        throw new Error(err.response.data.error);
      }
      throw new Error(`Auth ${endpoint} failed`);
    }
  }

  private getCSRFToken(): string {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    return cookieValue || '';
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    return this.request("login", { email, password });
  }

  async signUp(email: string, password: string): Promise<AuthResponse> {
    return this.request("signup", { email, password });
  }

  async signOut(): Promise<void> {
    try {
      await api.post("/api/logout/", {}, {
        headers: {
          "X-CSRFToken": this.getCSRFToken(),
        },
      });
    } catch (err) {
      console.error("Logout error:", err);
      // Still clear local storage even if server logout fails
    } finally {
      // Clear local storage
      localStorage.removeItem("user");
      localStorage.removeItem("session_expires");
    }
  }

  async refreshToken(): Promise<Session> {
    try {
      const response = await api.post("/api/refresh_token/", {}, {
        headers: {
          "X-CSRFToken": this.getCSRFToken(),
        },
      });
      return response.data.session;
    } catch (err: any) {
      throw new Error("Token refresh failed");
    }
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  isSessionValid(): boolean {
    const expiresAt = localStorage.getItem("session_expires");
    if (!expiresAt) return false;

    const expiryTime = parseInt(expiresAt, 10) * 1000; // Convert to milliseconds
    return Date.now() < expiryTime;
  }
}

export const authService = new AuthService();