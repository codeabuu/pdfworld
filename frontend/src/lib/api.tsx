import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/";

export const searchBooks = async(query: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}api/search/`, {
            params: { s: query }
        });
        return response.data;
    } catch (error) {
        console.error("Error searching books:", error);
        throw error;
    }
};

export const getBookDetails = async (book_slug: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}api/book-detail/${book_slug}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching book details:", error);
    throw error;
  }
};

export const getNewReleases = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}api/new-releases/`);
    
    return response.data;
  } catch (error) {
    console.error("Error fetching new releases:", error);
    throw error;
  }
};

export const getMagazines = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}api/magazines/`);

    return response.data;
  } catch (error) {
    console.error("Error fetching magazines:", error);
    throw error;
  }
};

export const getNewNovels = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}api/my-novels/`);

    return response.data;
  } catch (error) {
    console.error("Error fetching new novels:", error);
    throw error;
  }
};

export const getGenres = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}api/genres/`);
    if (response.status !== 200) {
      throw new Error("Network response was not ok");
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching genres:", error);
    throw error;
  }
};

export const getGenreBooks = async (genreSlug: string, page: number = 1) => {
  // console.log(`API CALL: Fetching ${genreSlug} books, page ${page}`);
  try {
    const response = await axios.get(`${API_BASE_URL}api/genres/${genreSlug}/books/?page=${page}`);
    // console.log(`API RESPONSE: ${genreSlug} page ${page} - ${response.data.results.length} books`);
    if (response.status !== 200) throw new Error('Failed to fetch genre books');
    return response.data;
  } catch (error) {
    // console.error("Error fetching genre books:", error);
    throw error;
  }
};

export const getPopularGenres = async (): Promise<{
  source: string;
  count: number;
  results: Array<{
    name: string;
    slug: string;
    url: string;
    book_count: number;
  }>;
}> => {
  try {
    const response = await axios.get(`${API_BASE_URL}api/genres/popular/`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch popular genres:', error);
    throw error;
  }
};


export const getSubscriptionStatus = async (): Promise<{
  status: string;
  current_period_end?: string;
  plan_name?: string;
  trial_end?: string;
}> => {
  try {
    const response = await axios.get('/api/check-subscription/');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch subscription status:', error);
    throw error;
  }
};

export interface StartSubscriptionResponse {
  authorization_url: string;
  reference: string;
  message: string;
  plan_type?: string;
  amount?: number;
}

export const startPaidSubscription = async (
  email: string, 
  user_id: string, 
  plan_type: "monthly" | "yearly"
): Promise<StartSubscriptionResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}api/start-subscription/`, {
      email,
      user_id,
      plan_type
    });
    return response.data;
  } catch (error: any) {
    console.error('Failed to start paid subscription:', error);
    
    // Handle specific error responses
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    throw new Error('Failed to start subscription. Please try again.');
  }
};

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
  user: {
    id: string;
    email: string;
  };
}

export interface ForgotPasswordData {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordData {
  newPassword: string;
  confirmPassword: string;
  token: string;
}

export interface ResetPasswordResponse {
  message: string;
  user: {
    id: string;
    email: string;
  };
}


export const changePassword = async (passwordData: ChangePasswordData): Promise<ChangePasswordResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}api/change-password/`, passwordData, {
      withCredentials: true,
    });

    if (response.status !== 200) {
      throw new Error(response.data.error || 'Password change failed');
    }

    return response.data;
  } catch (error: any) {
    console.error("Error changing password:", error);
    
    // Handle specific error responses
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data.error || 'Invalid input data');
    }
    
    throw new Error('Failed to change password. Please try again.');
  }
};

export const forgotPassword = async (emailData: ForgotPasswordData): Promise<ForgotPasswordResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}api/forgot-password/`, emailData);

    if (response.status !== 200) {
      throw new Error(response.data.error || 'Password reset request failed');
    }

    return response.data;
  } catch (error: any) {
    console.error("Error requesting password reset:", error);
    
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    
    throw new Error('Failed to send password reset email. Please try again.');
  }
};

export const resetPassword = async (passwordData: ResetPasswordData): Promise<ResetPasswordResponse> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}api/reset-password/`, 
      {
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
        token: passwordData.token // Make sure this is included
      },
      {
        withCredentials: true,
      }
    );

    if (response.status !== 200) {
      throw new Error(response.data.error || 'Password reset failed');
    }

    return response.data;
  } catch (error: any) {
    console.error("Error resetting password:", error);
    
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data.error || 'Invalid or expired reset token');
    }
    
    throw new Error('Failed to reset password. Please try again.');
  }
};