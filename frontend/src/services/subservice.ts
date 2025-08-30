// services/subscriptionService.ts
import axios from 'axios';

const API_BASE_URL = "http://127.0.0.1:8000";

class SubscriptionService {
  async checkSubscriptionStatus(userId: string): Promise<{
    has_access: boolean;
    status: string;
    trial_end?: string;
    in_trial?: boolean;
    trial_has_ended?: boolean;
    message?: string;
  }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/check-subscription/`, {
        user_id: userId
      });
      
      return response.data;
    } catch (error: any) {
      console.error("Subscription check failed:", error.response?.data || error.message);
      throw new Error('Failed to check subscription status');
    }
  }

  async checkTrialEligibility(userId: string): Promise<{
    eligible: boolean;
    reason?: string;
    message: string;
  }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/check-trial-eligibility/`, {
        user_id: userId
      });
      
      return response.data;
    } catch (error: any) {
      console.error("Trial eligibility check failed:", error.response?.data || error.message);
      throw new Error('Failed to check trial eligibility');
    }
  }

  async startTrial(userId: string, email: string): Promise<{
    authorization_url: string;
    reference: string;
    message: string;
  }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/sub-starttrial/`, {
        user_id: userId,
        email: email
      });
      
      return response.data;
    } catch (error: any) {
      console.error("Trial start failed:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to start trial');
    }
  }
}

export const subscriptionService = new SubscriptionService();