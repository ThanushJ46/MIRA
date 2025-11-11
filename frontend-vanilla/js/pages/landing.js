// Landing/Home Page - polished & left-aligned
function renderLandingPage() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <header class="landing-navbar">
      <div class="navbar-content">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="navbar-brand">MIRA</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.6);font-weight:600">Mindful Intelligent Reflective Assistant</div>
        </div>
        <div class="navbar-actions">
          <a href="#/login" class="btn btn-outline">Log in</a>
          <a href="#/login" class="btn btn-primary">Get Started</a>
        </div>
      </div>
    </header>

    <main class="landing-hero">
      <div class="container hero-content">
        <h1 class="hero-title">Journal. Reflect. Act — with intelligent autonomy.</h1>
        <p class="hero-sub">
          MIRA transforms daily journaling into an actionable assistant: automatic analysis, event detection,
          reminders and calendar sync — quietly working so you can focus on what matters.
        </p>

        <div class="hero-actions">
          <a href="#/login" class="btn btn-primary">Start free</a>
          <a href="#/features" class="btn btn-outline">See features</a>
        </div>
      </div>
    </main>

    <section id="features" class="features-section container">
      <h2 class="section-title">Agentic AI Features</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🤖</div>
          <div>
            <div class="feature-title">Autonomous Auto-Save</div>
            <div class="feature-description">Entries save automatically after 2 seconds of inactivity to protect your flow.</div>
          </div>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🧠</div>
          <div>
            <div class="feature-title">Deep AI Analysis</div>
            <div class="feature-description">Local Llama3 model analyzes sentiment, emotions and activity categories.</div>
          </div>
        </div>

        <div class="feature-card">
          <div class="feature-icon">📅</div>
          <div>
            <div class="feature-title">Event Detection</div>
            <div class="feature-description">Natural language detection finds meetings, deadlines and appointments.</div>
          </div>
        </div>

        <div class="feature-card">
          <div class="feature-icon">⏰</div>
          <div>
            <div class="feature-title">Auto Reminders</div>
            <div class="feature-description">Reminders are created automatically so you never miss an important task.</div>
          </div>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🔗</div>
          <div>
            <div class="feature-title">Calendar Sync</div>
            <div class="feature-description">Seamless Google Calendar sync (OAuth) keeps your schedule in one place.</div>
          </div>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🔍</div>
          <div>
            <div class="feature-title">Semantic Understanding</div>
            <div class="feature-description">AI understands context — not just keywords — for smarter suggestions.</div>
          </div>
        </div>
      </div>
    </section>

    <section class="how-it-works-section container">
      <h2 class="section-title">How it works</h2>
      <div class="workflow-steps">
        <div class="workflow-step">
          <div class="step-number">1</div>
          <div class="step-title">Write naturally</div>
          <div class="step-description">Write freely—MIRA understands relative and absolute dates, times and intent.</div>
        </div>

        <div class="workflow-step">
          <div class="step-number">2</div>
          <div class="step-title">Auto-save</div>
          <div class="step-description">Entries auto-save so you never lose your thoughts.</div>
        </div>

        <div class="workflow-step">
          <div class="step-number">3</div>
          <div class="step-title">AI analysis</div>
          <div class="step-description">Llama3 analyzes sentiment, activities and detects events.</div>
        </div>

        <div class="workflow-step">
          <div class="step-number">4</div>
          <div class="step-title">Auto-sync</div>
          <div class="step-description">Detected events are synced to Google Calendar automatically.</div>
        </div>
      </div>
    </section>

    <section class="cta-section container">
      <div class="cta-card">
        <div>
          <div class="cta-title">Ready to transform your journaling?</div>
          <div class="cta-description">Try MIRA today — smarter, calmer and more focused journaling.</div>
        </div>
        <div>
          <a href="#/login" class="btn btn-primary">Start your journey</a>
        </div>
      </div>
    </section>

    <footer class="site-footer container">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap">
        <div>
          <div style="font-weight:700;color:#fff">MIRA</div>
          <div style="color:rgba(255,255,255,0.6);margin-top:6px">Built by Team MIRA • <span class="small">© ${new Date().getFullYear()}</span></div>
        </div>

        <div style="text-align:right;color:rgba(255,255,255,0.6);font-size:13px">
         
          <div style="margin-top:6px">Mindful journaling • Autonomous AI</div>
        </div>
      </div>
    </footer>
  `;
}

// Register route
addRoute('/', renderLandingPage);
