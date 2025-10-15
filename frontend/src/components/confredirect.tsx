import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ConfirmationRedirect: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login', { 
        state: { message: 'Email confirmed successfully! Please log in.' } 
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Email Confirmed!</h2>
        <p className="mt-2 text-sm text-gray-600">
          Your email has been successfully verified. Redirecting to login page...
        </p>
        <button
          onClick={() => navigate('/login')}
          className="mt-4 text-blue-600 hover:text-blue-500"
        >
          Go to login now
        </button>
      </div>
    </div>
  );
};

export default ConfirmationRedirect;