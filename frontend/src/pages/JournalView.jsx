import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { journalAPI, reminderAPI, calendarAPI } from '../services/api';

function JournalView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Reminder state
  const [settingReminder, setSettingReminder] = useState(null);
  
  // Calendar state
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [checkingCalendar, setCheckingCalendar] = useState(true);

  // Auto-save timer ref
  const autoSaveTimerRef = useRef(null);
  const autoAnalyzeTimerRef = useRef(null);
  const initialLoadRef = useRef(true);
  const initialAnalysisLoadRef = useRef(true);

  useEffect(() => {
    if (!isNew) {
      fetchJournal();
    }
    checkCalendarStatus();
  }, [id]);

  // Auto-save effect - triggers when title or content changes
  useEffect(() => {
    // Skip auto-save on initial load
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    // Skip auto-save for new journals (save manually first)
    if (isNew) {
      return;
    }

    // Skip if no content
    if (!content.trim()) {
      return;
    }

    // Mark as having unsaved changes
    setHasUnsavedChanges(true);

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for 2 seconds
    autoSaveTimerRef.current = setTimeout(() => {
      autoSave();
    }, 2000);

    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, content]);

  // Auto-analyze effect - triggers 5 seconds after user stops typing
  useEffect(() => {
    // Skip auto-analyze on initial load
    if (initialAnalysisLoadRef.current) {
      initialAnalysisLoadRef.current = false;
      return;
    }

    // Skip auto-analyze for new journals (save manually first)
    if (isNew) {
      return;
    }

    // Skip if no content
    if (!content.trim()) {
      return;
    }

    // Skip if already analyzing
    if (analyzing) {
      return;
    }

    // Clear existing timer
    if (autoAnalyzeTimerRef.current) {
      clearTimeout(autoAnalyzeTimerRef.current);
    }

    // Set new timer for 5 seconds
    autoAnalyzeTimerRef.current = setTimeout(() => {
      autoAnalyze();
    }, 5000);

    // Cleanup on unmount
    return () => {
      if (autoAnalyzeTimerRef.current) {
        clearTimeout(autoAnalyzeTimerRef.current);
      }
    };
  }, [content]); // Only trigger on content changes, not title

  const autoSave = async () => {
    if (isNew || !content.trim() || loading || autoSaving) {
      return;
    }

    setAutoSaving(true);
    setError('');

    try {
      const response = await journalAPI.update(id, { title, content });
      if (response.data.success) {
        setHasUnsavedChanges(false);
        // Show brief success indicator
        setSuccess('Auto-saved ✓');
        setTimeout(() => setSuccess(''), 1500);
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
      // Don't show error for auto-save failures to avoid disruption
    } finally {
      setAutoSaving(false);
    }
  };

  const autoAnalyze = async () => {
    if (isNew || !content.trim() || analyzing) {
      return;
    }

    setAnalyzing(true);
    
    try {
      const response = await journalAPI.analyze(id);
      if (response.data.success) {
        setAnalysis(response.data.data);
        // Show subtle indicator that auto-analysis completed
        setSuccess('Analysis updated ✓');
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err) {
      console.error('Auto-analysis failed:', err);
      // Don't show error for auto-analysis failures to avoid disruption
    } finally {
      setAnalyzing(false);
    }
  };

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

  const checkCalendarStatus = async () => {
    try {
      const response = await calendarAPI.getStatus();
      if (response.data.success) {
        setCalendarConnected(response.data.data.connected);
      }
    } catch (err) {
      console.error('Failed to check calendar status:', err);
    } finally {
      setCheckingCalendar(false);
    }
  };

  const connectCalendar = async () => {
    try {
      const response = await calendarAPI.getAuthUrl();
      if (response.data.success) {
        // Open auth URL in new window
        window.open(response.data.data.authUrl, '_blank');
        setSuccess('Please complete authorization in the new window');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get authorization URL');
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
        // Show success message with auto-reminder info
        const data = response.data.data;
        if (data.autoCreatedReminders > 0) {
          setSuccess(response.data.message || 'Analysis complete with auto-reminders!');
        } else {
          setSuccess('Analysis complete!');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  // handleSetReminder is no longer needed - reminders are auto-created
  // Keeping this code commented for reference
  /*
  const handleSetReminder = async (event) => {
    setSettingReminder(event);
    
    try {
      // Step 1: Propose reminder
      const proposeResponse = await reminderAPI.propose({
        journalId: id,
        eventTitle: event.title,
        eventDate: event.date,
        description: event.description || event.sentence,
        originalSentence: event.sentence
      });
      
      if (proposeResponse.data.success) {
        const reminderId = proposeResponse.data.data._id;
        
        // Step 2: Confirm reminder
        const confirmResponse = await reminderAPI.confirm(reminderId);
        
        if (confirmResponse.data.success) {
          // Step 3: If calendar connected, ask to sync
          if (calendarConnected) {
            const shouldSync = window.confirm(
              `Reminder created! Would you like to add "${event.title}" to your Google Calendar?`
            );
            
            if (shouldSync) {
              try {
                const syncResponse = await reminderAPI.syncToCalendar(reminderId);
                if (syncResponse.data.success) {
                  setSuccess(`Added to Google Calendar: ${event.title}`);
                  // Remove event from list after syncing
                  setAnalysis(prev => ({
                    ...prev,
                    detectedEvents: prev.detectedEvents.filter(e => e !== event)
                  }));
                }
              } catch (syncErr) {
                setError(syncErr.response?.data?.message || 'Failed to sync to calendar');
              }
            } else {
              setSuccess(`Reminder set: ${event.title}`);
              setAnalysis(prev => ({
                ...prev,
                detectedEvents: prev.detectedEvents.filter(e => e !== event)
              }));
            }
          } else {
            setSuccess(`Reminder set: ${event.title} (Connect Google Calendar to sync)`);
            setAnalysis(prev => ({
              ...prev,
              detectedEvents: prev.detectedEvents.filter(e => e !== event)
            }));
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set reminder');
    } finally {
      setSettingReminder(null);
    }
  };
  */

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this journal? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await journalAPI.delete(id);
      if (response.data.success) {
        setSuccess('Journal deleted successfully!');
        setTimeout(() => navigate('/journals'), 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete journal');
    } finally {
      setLoading(false);
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
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => navigate('/journals')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Journals
          </button>
          
          {!checkingCalendar && (
            <div className="flex items-center gap-2">
              {calendarConnected ? (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Google Calendar Connected
                </span>
              ) : (
                <button
                  onClick={connectCalendar}
                  className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                >
                  📅 Connect Google Calendar
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {isNew ? 'New Journal' : 'Edit Journal'}
            </h1>
            
            {/* Auto-save status indicator */}
            {!isNew && (
              <div className="text-sm">
                {autoSaving ? (
                  <span className="text-blue-600 flex items-center gap-1">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : hasUnsavedChanges ? (
                  <span className="text-orange-600">Unsaved changes</span>
                ) : (
                  <span className="text-gray-400">All changes saved</span>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-start gap-2">
              <span className="text-green-600 text-xl">✓</span>
              <span className="flex-1">{success}</span>
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
            {!isNew && (
              <p className="mt-1 text-xs text-gray-500">
                💡 Auto-save after 2 seconds • AI analysis after 5 seconds of inactivity
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading || autoSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isNew ? 'Create Journal' : 'Save Now')}
            </button>

            {!isNew && (
              <>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {analyzing ? 'Analyzing...' : 'Analyze Now'}
                </button>

                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 ml-auto"
                >
                  🗑️ Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Analysis Results</h2>

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

            {/* Detected Events - Now Auto-Created */}
            {analysis.detectedEvents && analysis.detectedEvents.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-purple-700 mb-2 flex items-center gap-2">
                  📅 Detected Events
                  <span className="text-sm font-normal text-green-600 bg-green-50 px-2 py-1 rounded">
                    ✓ Auto-created as reminders
                  </span>
                </h3>
                <div className="space-y-3">
                  {analysis.detectedEvents.map((event, idx) => (
                    <div
                      key={idx}
                      className="border border-green-200 bg-green-50 rounded-md p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 flex items-center gap-2">
                            {event.title}
                            <span className="text-xs text-green-600 bg-white px-2 py-0.5 rounded border border-green-200">
                              ✓ Reminder created
                            </span>
                          </p>
                          {event.date && (
                            <p className="text-sm text-gray-600 mt-1">
                              📆 {new Date(event.date).toLocaleString()}
                            </p>
                          )}
                          {event.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              💬 {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {analysis.autoSyncedToCalendar > 0 && (
                  <p className="mt-3 text-sm text-green-700 bg-green-100 border border-green-300 rounded px-3 py-2">
                    🎉 {analysis.autoSyncedToCalendar} event(s) automatically synced to Google Calendar!
                  </p>
                )}
                {analysis.autoCreatedReminders > 0 && analysis.autoSyncedToCalendar === 0 && !calendarConnected && (
                  <p className="mt-3 text-sm text-blue-700 bg-blue-100 border border-blue-300 rounded px-3 py-2">
                    💡 Connect Google Calendar to automatically sync events
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default JournalView;
