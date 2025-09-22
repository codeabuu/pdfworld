// src/components/EmailConfirmation.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface EmailConfirmationProps {}

const EmailConfirmation: React.FC<EmailConfirmationProps> = () => {
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const location = useLocation();
  const navigate = useNavigate();

  const API_BASE_URL = 'http://127.0.0.1:8000';
//   useEffect(() => {
//     // Get email from location state or session storage
//     const userEmail = location.state?.email || sessionStorage.getItem('signup_email');
//     if (userEmail) {
//       setEmail(userEmail);
//     } else {
//       navigate('/signup');
//     }
//   }, [location, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendConfirmation = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Email is required' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/resend-confirmation-email/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok && data.error && data.error.includes("already confirmed")) {
            await handleCheckConfirmation();
            setMessage({
                type: 'success',
                text: 'Email already confirmed. Redirecting to login...'
            });
            
            // ⏳ wait 3 seconds, then redirect
            setTimeout(() => {
                window.location.href = "/login";
            }, 3000);

            return;
            }

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: data.message || 'Confirmation email sent successfully! Please check your inbox.' 
        });
        setCountdown(60); // 60 seconds cooldown
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Failed to send confirmation email' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckConfirmation = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/check-email-confirmation/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.confirmed) {
        setMessage({ 
          type: 'success', 
          text: 'Email confirmed successfully! Redirecting to login...' 
        });
        sessionStorage.removeItem('signup_email');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Email not confirmed yet. Please check your email and click the confirmation link.' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Error checking confirmation status' 
      });
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setMessage(null);
  };

  const handleGoToLogin = () => {
    sessionStorage.removeItem('signup_email');
    navigate('/login');
  };

  // Helper function to get CSRF token
  const getCsrfToken = () => {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.getAttribute('value') || '';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Confirm Your Email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent a confirmation link to your email address
            </p>
          </div>

          <div className="mt-8">
            {/* Current Email Display */}
            {/* <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Email sent to:</strong> {email}
              </p>
            </div> */}

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                What to do next:
              </h3>
              <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                <li>Check your email inbox for the confirmation link</li>
                <li>If you don't see it, check your spam folder</li>
                <li>Click the link to verify your email address</li>
                {/* <li>Return to this page after clicking the link</li> */}
              </ul>
            </div>

            {/* Resend Email Form */}
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={handleEmailChange}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your email address"
                />
              </div>

              {message && (
                <div className={`rounded-md p-4 ${
                  message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm ${
                    message.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {message.text}
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={isLoading || countdown > 0}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Confirmation Email'}
                </button>

                {/* <button
                  type="button"
                  onClick={handleCheckConfirmation}
                  className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  I've Confirmed
                </button> */}
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleGoToLogin}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Return to login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmation;