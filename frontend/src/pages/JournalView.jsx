import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { journalAPI, reminderAPI } from '../services/api';

function JournalView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Analysis state
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Reminder state
  const [settingReminder, setSettingReminder] = useState(null);

  useEffect(() => {
    if (!isNew) {
      fetchJournal();
    }
  }, [id]);

  const fetchJournal = async () => {
    setLoading(true);
    try {
      const response = await journalAPI.getById(id);
      if (response.data.success) {
        const journal = response.data.data;
        setTitle(journal.title || '');
        setContent(journal.content || '');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load journal');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isNew) {
        const response = await journalAPI.create({ title, content });
        if (response.data.success) {
          setSuccess('Journal created successfully!');
          setTimeout(() => navigate(`/journal/${response.data.data._id}`), 1500);
        }
      } else {
        const response = await journalAPI.update(id, { title, content });
        if (response.data.success) {
          setSuccess('Journal updated successfully!');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save journal');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    
    try {
      const response = await journalAPI.analyze(id);
      if (response.data.success) {
        setAnalysis(response.data.data);
        setSuccess('Analysis complete!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSetReminder = async (event) => {
    setSettingReminder(event);
    
    try {
      // Step 1: Propose reminder
      const proposeResponse = await reminderAPI.propose({
        journalId: id,
        eventTitle: event.title,
        eventDate: event.date,
        description: event.description
      });
      
      if (proposeResponse.data.success) {
        const reminderId = proposeResponse.data.data._id;
        
        // Step 2: Confirm reminder
        const confirmResponse = await reminderAPI.confirm(reminderId);
        
        if (confirmResponse.data.success) {
          setSuccess(`Reminder set for: ${event.title}`);
          // Remove event from list after setting reminder
          setAnalysis(prev => ({
            ...prev,
            detectedEvents: prev.detectedEvents.filter(e => e !== event)
          }));
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set reminder');
    } finally {
      setSettingReminder(null);
    }
  };

  if (loading && !isNew) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading journal...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <button
            onClick={() => navigate('/journals')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Journals
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            {isNew ? 'New Journal' : 'Edit Journal'}
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Journal title..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
              placeholder="Write your journal entry..."
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isNew ? 'Save' : 'Update')}
            </button>

            {!isNew && (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Journal'}
              </button>
            )}
          </div>
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Analysis Results</h2>

            {/* Productivity Score */}
            {analysis.productivityScore !== undefined && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Productivity Score
                </h3>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-4 mr-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full"
                      style={{ width: `${analysis.productivityScore}%` }}
                    ></div>
                  </div>
                  <span className="text-lg font-bold text-gray-800">
                    {analysis.productivityScore}%
                  </span>
                </div>
              </div>
            )}

            {/* Productive Activities */}
            {analysis.productive && analysis.productive.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-green-700 mb-2">
                  ✓ Productive Activities
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.productive.map((item, idx) => (
                    <li key={idx} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Unproductive Activities */}
            {analysis.unproductive && analysis.unproductive.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-red-700 mb-2">
                  ✗ Unproductive Activities
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.unproductive.map((item, idx) => (
                    <li key={idx} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {analysis.suggestions && analysis.suggestions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-blue-700 mb-2">
                  💡 Suggestions
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.suggestions.map((item, idx) => (
                    <li key={idx} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Detected Events */}
            {analysis.detectedEvents && analysis.detectedEvents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-purple-700 mb-2">
                  📅 Detected Events
                </h3>
                <div className="space-y-3">
                  {analysis.detectedEvents.map((event, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-300 rounded-md p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{event.title}</p>
                        {event.date && (
                          <p className="text-sm text-gray-600">
                            {new Date(event.date).toLocaleString()}
                          </p>
                        )}
                        {event.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleSetReminder(event)}
                        disabled={settingReminder === event}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                      >
                        {settingReminder === event ? 'Setting...' : 'Set Reminder'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default JournalView;
