import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function CalendarConnected() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  
  const success = searchParams.get('success') === 'true';
  const error = searchParams.get('error');

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/journals');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {success ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-green-600">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Google Calendar Connected!
            </h2>
            <p className="text-gray-600 mb-6">
              Your Google Calendar has been successfully connected. You can now sync detected events directly to your calendar.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-red-600">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Connection Failed
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'Failed to connect Google Calendar. Please try again.'}
            </p>
          </>
        )}
        
        <div className="text-sm text-gray-500 mb-4">
          Redirecting to journals in {countdown} seconds...
        </div>
        
        <button
          onClick={() => navigate('/journals')}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Go to Journals Now
        </button>
      </div>
    </div>
  );
}

export default CalendarConnected;
