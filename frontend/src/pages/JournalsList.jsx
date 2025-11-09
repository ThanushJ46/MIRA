import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { journalAPI } from '../services/api';
import { removeToken } from '../utils/auth';

function JournalsList() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      const response = await journalAPI.getAll();
      if (response.data.success) {
        setJournals(response.data.data);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        removeToken();
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to load journals');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading journals...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Journals</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <button
          onClick={() => navigate('/journal/new')}
          className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          + New Journal
        </button>

        <div className="bg-white rounded-lg shadow-md">
          {journals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No journals yet. Create your first journal!
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {journals.map((journal) => (
                <li
                  key={journal._id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => navigate(`/journal/${journal._id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {journal.title || 'Untitled Journal'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(journal.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      {journal.content && (
                        <p className="mt-2 text-gray-600 line-clamp-2">
                          {journal.content.substring(0, 150)}...
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/journal/${journal._id}`);
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      View
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default JournalsList;
