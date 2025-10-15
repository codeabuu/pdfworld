// services/cardService.ts
import axios from 'axios';

export interface Card {
  id: number;
  authorization_code: string;
  last4: string;
  card_type: string;
  bank: string;
  exp_month: string;
  exp_year: string;
  brand: string;
  is_default: boolean;
  created_at: string;
}

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // Relative to your domain
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    throw error;
  }
);

export const cardService = {
  async getCustomerCards(userId: string): Promise<Card[]> {
    try {
      const response = await apiClient.post('/cards/', { user_id: userId });
      return response.data.cards || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch cards');
    }
  },

  async initializeCardUpdate(email: string, userId: string, action: 'update' | 'add' = 'add') {
    try {
      const response = await apiClient.post('/cards/initialize-update/', {
        email,
        user_id: userId,
        action
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to initialize card update');
    }
  },

  async setDefaultCard(userId: string, cardId: number) {
    try {
      const response = await apiClient.post('/cards/set-default/', {
        user_id: userId,
        card_id: cardId
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to set default card');
    }
  },

  async removeCard(userId: string, cardId: number) {
    try {
      const response = await apiClient.post('/cards/remove/', {
        user_id: userId,
        card_id: cardId
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to remove card');
    }
  },

  // Optional: Add a method to verify card update (if you have this endpoint)
  async verifyCardUpdate(reference: string, userId: string) {
    try {
      const response = await apiClient.post('/cards/verify-update/', {
        reference,
        user_id: userId
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to verify card update');
    }
  },

//   // Optional: Test endpoint for development
//   async testAddCard(userId: string) {
//     try {
//       const response = await apiClient.post('/cards/test-add/', {
//         user_id: userId
//       });
//       return response.data;
//     } catch (error: any) {
//       throw new Error(error.response?.data?.error || 'Failed to add test card');
//     }
//   }
};