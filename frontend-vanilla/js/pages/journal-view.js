// Journal View/Edit Page with Auto-save and Auto-analyze
let autoSaveTimer = null;
let autoAnalyzeTimer = null;
let hasUnsavedChanges = false;
let currentJournalId = null;
let initialLoad = true;

async function renderJournalViewPage() {
  const params = getRouteParams();
  const journalId = params.id;
  currentJournalId = journalId;
  const isNew = journalId === 'new';

  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="container">
      <div class="journal-view-header">
        <h1>${isNew ? 'New Journal Entry' : 'Edit Journal'}</h1>
        <div class="journal-view-actions">
          <span class="auto-save-indicator" id="save-status"></span>
          <button class="btn btn-secondary" onclick="navigateTo('/journals')">← Back to Journals</button>
          ${!isNew ? '<button class="btn btn-danger" id="delete-btn">Delete</button>' : ''}
        </div>
      </div>

      <div id="message-area"></div>

      <div class="card">
        <div class="form-group">
          <label class="form-label">Title (optional)</label>
          <input type="text" id="title-input" class="form-input" placeholder="Give your journal a title..." />
        </div>

        <div class="form-group">
          <label class="form-label">Your Journal</label>
          <textarea id="content-input" class="form-textarea" placeholder="Write your thoughts, events, feelings... The AI will auto-analyze after 5 seconds of inactivity." required></textarea>
        </div>

        <div style="display: flex; gap: 12px; align-items: center;">
          <button class="btn btn-primary" id="save-btn">Save Journal</button>
          <div id="calendar-status"></div>
        </div>
      </div>

      <div id="analysis-section"></div>
    </div>
  `;

  const titleInput = document.getElementById('title-input');
  const contentInput = document.getElementById('content-input');
  const saveBtn = document.getElementById('save-btn');
  const saveStatus = document.getElementById('save-status');
  const messageArea = document.getElementById('message-area');
  const analysisSection = document.getElementById('analysis-section');
  const calendarStatus = document.getElementById('calendar-status');

  // Load existing journal if not new
  if (!isNew) {
    try {
      const response = await journalAPI.getById(journalId);
      if (response.ok && response.data.success) {
        const journal = response.data.data;
        titleInput.value = journal.title || '';
        contentInput.value = journal.content || '';
        
        // Load existing analysis if available
        if (journal.analysis) {
          renderAnalysis(journal.analysis);
        }
      }
    } catch (error) {
      showMessage('Error loading journal', 'error');
    }
  }

  // Check calendar connection
  checkCalendarConnection();

  // Auto-save functionality
  function setupAutoSave() {
    const autoSave = async () => {
      console.log('🔄 Auto-save triggered', { initialLoad, hasContent: !!contentInput.value.trim() });
      
      if (initialLoad) {
        initialLoad = false;
        console.log('⏭️ Skipping auto-save (initial load)');
        return;
      }

      if (!contentInput.value.trim()) {
        console.log('⏭️ Skipping auto-save (empty content)');
        return;
      }

      saveStatus.textContent = 'Saving...';
      console.log('💾 Auto-saving journal...');
      
      try {
        const data = {
          title: titleInput.value,
          content: contentInput.value,
          date: new Date().toISOString()
        };

        let response;
        if (isNew || !currentJournalId || currentJournalId === 'new') {
          response = await journalAPI.create(data);
          if (response.ok && response.data.success) {
            currentJournalId = response.data.data._id;
            // Update URL without reload
            window.location.hash = `/journal/${currentJournalId}`;
          }
        } else {
          response = await journalAPI.update(currentJournalId, data);
        }

        if (response.ok) {
          saveStatus.textContent = '✓ Saved';
          console.log('✅ Auto-save successful');
          setTimeout(() => saveStatus.textContent = '', 2000);
          hasUnsavedChanges = false;
        } else {
          console.error('❌ Auto-save failed:', response);
        }
      } catch (error) {
        console.error('❌ Auto-save error:', error);
        saveStatus.textContent = '⚠ Save failed';
      }
    };

    console.log('🎯 Setting up auto-save listeners');
    
    titleInput.addEventListener('input', () => {
      console.log('📝 Title changed - auto-save in 2s');
      hasUnsavedChanges = true;
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(autoSave, 2000);
    });

    contentInput.addEventListener('input', () => {
      console.log('📝 Content changed - auto-save in 2s, auto-analyze in 5s');
      hasUnsavedChanges = true;
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(autoSave, 2000);
      
      // Trigger auto-analyze after 5 seconds
      clearTimeout(autoAnalyzeTimer);
      autoAnalyzeTimer = setTimeout(autoAnalyze, 5000);
    });
  }

  // Auto-analyze functionality
  async function autoAnalyze() {
    console.log('🤖 Auto-analyze triggered', { 
      currentJournalId, 
      hasContent: !!contentInput.value.trim() 
    });
    
    if (!currentJournalId || currentJournalId === 'new' || !contentInput.value.trim()) {
      console.log('⏭️ Skipping auto-analyze (journal not saved yet or empty)');
      return;
    }

    console.log('🔍 Starting AI analysis...');
    analysisSection.innerHTML = '<div class="analysis-section"><div class="spinner"></div><p class="text-center">AI is analyzing your journal...</p></div>';

    try {
      const response = await journalAPI.analyze(currentJournalId);
      console.log('📊 Analysis response:', response);
      
      if (response.ok && response.data.success) {
        console.log('✅ Analysis successful:', response.data.data);
        renderAnalysis(response.data.data);
        
        // Show success message if reminders were created
        if (response.data.data.autoCreatedReminders > 0) {
          const syncCount = response.data.data.autoSyncedToCalendar || 0;
          let msg = `✨ ${response.data.data.autoCreatedReminders} reminder(s) created automatically`;
          if (syncCount > 0) {
            msg += ` • ${syncCount} synced to Google Calendar`;
          }
          showMessage(msg, 'success');
        }
      } else {
        console.error('❌ Analysis failed:', response);
        analysisSection.innerHTML = `<div class="alert alert-error">Analysis failed: ${response.data.message}</div>`;
      }
    } catch (error) {
      console.error('❌ Analysis error:', error);
      analysisSection.innerHTML = '<div class="alert alert-error">Analysis failed. Make sure Ollama is running.</div>';
    }
  }

  // Render analysis results
  function renderAnalysis(analysis) {
    let html = '<div class="analysis-section"><h2 class="analysis-title">🤖 AI Analysis</h2>';

    if (analysis.productive && analysis.productive.length > 0) {
      html += `
        <div class="analysis-category">
          <h3 class="analysis-category-title">✅ Productive Activities</h3>
          <ul class="analysis-list">
            ${analysis.productive.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    if (analysis.unproductive && analysis.unproductive.length > 0) {
      html += `
        <div class="analysis-category">
          <h3 class="analysis-category-title">⏰ Unproductive Activities</h3>
          <ul class="analysis-list">
            ${analysis.unproductive.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    if (analysis.rest && analysis.rest.length > 0) {
      html += `
        <div class="analysis-category">
          <h3 class="analysis-category-title">😌 Restful Activities</h3>
          <ul class="analysis-list">
            ${analysis.rest.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    if (analysis.emotional && analysis.emotional.length > 0) {
      html += `
        <div class="analysis-category">
          <h3 class="analysis-category-title">💭 Emotional States</h3>
          <ul class="analysis-list">
            ${analysis.emotional.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    if (analysis.suggestions && analysis.suggestions.length > 0) {
      html += `
        <div class="analysis-category">
          <h3 class="analysis-category-title">💡 Suggestions</h3>
          <ul class="analysis-list">
            ${analysis.suggestions.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    if (analysis.detectedEvents && analysis.detectedEvents.length > 0) {
      html += `
        <div class="analysis-category">
          <h3 class="analysis-category-title">📅 Detected Events</h3>
          ${analysis.detectedEvents.map(event => `
            <div class="event-card">
              <div class="event-card-title">${event.title}</div>
              <div class="event-card-date">📅 ${new Date(event.date).toLocaleString()}</div>
              ${event.description ? `<p style="margin-top: 8px; font-size: 14px;">${event.description}</p>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    html += '</div>';
    analysisSection.innerHTML = html;
  }

  // Check calendar connection status
  async function checkCalendarConnection() {
    try {
      const response = await calendarAPI.getStatus();
      if (response.ok && response.data.success) {
        const isConnected = response.data.data.connected;
        if (isConnected) {
          calendarStatus.innerHTML = '<span class="calendar-status calendar-connected">✓ Calendar Connected</span>';
        } else {
          calendarStatus.innerHTML = '<button class="btn btn-primary" id="connect-calendar-btn">Connect Google Calendar</button>';
          document.getElementById('connect-calendar-btn').addEventListener('click', connectCalendar);
        }
      }
    } catch (error) {
      console.error('Error checking calendar status');
    }
  }

  // Connect to Google Calendar
  async function connectCalendar() {
    try {
      const response = await calendarAPI.getAuthUrl();
      if (response.ok && response.data.success) {
        window.location.href = response.data.data.authUrl;
      }
    } catch (error) {
      showMessage('Failed to get calendar auth URL', 'error');
    }
  }

  // Show message
  function showMessage(text, type) {
    messageArea.innerHTML = `<div class="alert alert-${type}">${text}</div>`;
    setTimeout(() => messageArea.innerHTML = '', 5000);
  }

  // Manual save button
  saveBtn.addEventListener('click', async () => {
    if (!contentInput.value.trim()) {
      showMessage('Please write something first', 'error');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const data = {
        title: titleInput.value,
        content: contentInput.value,
        date: new Date().toISOString()
      };

      let response;
      if (isNew || !currentJournalId || currentJournalId === 'new') {
        response = await journalAPI.create(data);
        if (response.ok && response.data.success) {
          currentJournalId = response.data.data._id;
          window.location.hash = `/journal/${currentJournalId}`;
          showMessage('Journal created successfully!', 'success');
        }
      } else {
        response = await journalAPI.update(currentJournalId, data);
        if (response.ok) {
          showMessage('Journal updated successfully!', 'success');
        }
      }
    } catch (error) {
      showMessage('Failed to save journal', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Journal';
    }
  });

  // Delete button
  if (!isNew) {
    document.getElementById('delete-btn').addEventListener('click', async () => {
      if (!confirm('Are you sure you want to delete this journal?')) return;

      try {
        const response = await journalAPI.delete(currentJournalId);
        if (response.ok) {
          navigateTo('/journals');
        }
      } catch (error) {
        showMessage('Failed to delete journal', 'error');
      }
    });
  }

  // Setup auto-save
  console.log('🚀 Initializing journal view page', { isNew, journalId: currentJournalId });
  setupAutoSave();

  // Reset initial load flag after short delay
  setTimeout(() => {
    initialLoad = false;
    console.log('✅ Initial load complete - auto-save now active');
  }, 500);
}

// Register route
addRoute('/journal/:id', renderJournalViewPage);
