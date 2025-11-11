// Calendar Connected Callback Page
function renderCalendarConnectedPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const success = urlParams.get('success') === 'true';

  const app = document.getElementById('app');
  
  if (success) {
    app.innerHTML = `
      ${renderNavbar()}
      <div class="calendar-success-container" style="padding-top: 100px;">
        <div class="card calendar-success-card">
          <div class="success-icon">✅</div>
          <h2 class="success-title">Google Calendar Connected!</h2>
          <p class="mb-4">Your events will now be automatically synced to your Google Calendar.</p>
          <p class="mb-4">Redirecting to journals in <span id="countdown">3</span> seconds...</p>
          <button class="btn btn-primary" onclick="navigateTo('/journals')">Go to Journals Now</button>
        </div>
      </div>
    `;

    let countdown = 3;
    const countdownEl = document.getElementById('countdown');
    
    const timer = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        countdownEl.textContent = countdown;
      } else {
        clearInterval(timer);
        navigateTo('/journals');
      }
    }, 1000);
  } else {
    app.innerHTML = `
      ${renderNavbar()}
      <div class="calendar-success-container" style="padding-top: 100px;">
        <div class="card calendar-success-card">
          <div class="success-icon">⚠️</div>
          <h2 style="color: #dc2626;">Connection Failed</h2>
          <p class="mb-4">Failed to connect Google Calendar. Please try again.</p>
          <button class="btn btn-primary" onclick="navigateTo('/journals')">Back to Journals</button>
        </div>
      </div>
    `;
  }
}

// Register route
addRoute('/calendar-connected', renderCalendarConnectedPage);
