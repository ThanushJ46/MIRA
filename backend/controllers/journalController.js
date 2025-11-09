const Journal = require('../models/Journal');

// @desc    Create new journal entry
// @route   POST /api/journals/create
// @access  Private
const createJournal = async (req, res) => {
  try {
    const { title, content, date, streakCount } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide content',
        data: null
      });
    }

    const journal = await Journal.create({
      userId: req.userId,
      title: title || '',
      content,
      date: date || Date.now(),
      streakCount: streakCount || 0
    });

    res.status(201).json({
      success: true,
      message: 'Journal created successfully',
      data: journal
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, data: null });
  }
};

// @desc    Get all journals
// @route   GET /api/journals
// @access  Private
const getJournals = async (req, res) => {
  try {
    const journals = await Journal.find({ userId: req.userId }).sort({ date: -1 });
    res.json({ success: true, message: 'Journals retrieved successfully', data: journals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, data: null });
  }
};

// @desc    Get one journal
// @route   GET /api/journals/:id
// @access  Private
const getJournalById = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) return res.status(404).json({ success: false, message: 'Journal not found', data: null });

    if (journal.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized', data: null });
    }

    res.json({ success: true, message: 'Journal retrieved', data: journal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, data: null });
  }
};

// @desc    Update journal
// @route   PUT /api/journals/:id
// @access  Private
const updateJournal = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) return res.status(404).json({ success: false, message: 'Journal not found', data: null });

    if (journal.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized', data: null });
    }

    const { title, content, date, streakCount, summary, insights } = req.body;

    journal.title = title ?? journal.title;
    journal.content = content ?? journal.content;
    journal.date = date ?? journal.date;
    journal.streakCount = streakCount ?? journal.streakCount;
    journal.summary = summary ?? journal.summary;
    journal.insights = insights ?? journal.insights;

    const updatedJournal = await journal.save();
    res.json({ success: true, message: 'Journal updated successfully', data: updatedJournal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, data: null });
  }
};

// @desc    Delete journal
// @route   DELETE /api/journals/:id
// @access  Private
const deleteJournal = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) return res.status(404).json({ success: false, message: 'Journal not found', data: null });

    if (journal.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized', data: null });
    }

    await journal.deleteOne();
    res.json({ success: true, message: 'Journal deleted', data: null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, data: null });
  }
};

// @desc    Analyze journal (FINAL VERSION)
// @route   POST /api/journals/:id/analyze
// @access  Private
const analyzeJournal = async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) return res.status(404).json({ success: false, message: "Journal not found", data: null });

    if (journal.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized", data: null });
    }

    const content = journal.content.toLowerCase();

    // ✅ Split cleanly & remove filler words
    const parts = content
      .split(/[\.\?\!]/)
      .map(s => s.trim())
      .map(s => s.replace(/^(and|but|then|so|also|well|anyway|though|however)\s+/g, ""))
      .map(s => s.replace(/^(i|me|my|we|us)\s+/g, ""))
      .filter(s => s.length > 3);

    // ✅ Pattern sets
    const productivePatterns = [
      /\bwoke up early\b/, /\bworked on\b/, /\bresearch paper\b/, /\bfound sources\b/,
      /\bwent to the library\b/, /\bsolid block of time\b/, /\bcompleted\b/, /\bfinished\b/,
      /\bstudied\b/, /\brevised\b/, /\bcleaned\b/, /\borganized\b/, /\btook notes\b/,
      /\bprepared for\b/, /\bexercise|workout|yoga|treadmill|run|jog\b/
    ];

    const unproductivePatterns = [
      /\bscrolled\b/, /\bdoom(-)?scroll\b/, /\bgroup chat\b/, /\bgossip\b/, /\bphone blew up\b/,
      /\bwasted (time|an hour|two hours|the day)\b/, /\bplayed\b.*(bgmi|pubg|valorant|apex|fortnite|csgo)/,
      /\bjust laid in bed\b/, /\bprocrastinat(e|ing|ed)\b/, /\bno motivation\b/
    ];

    const restPatterns = [
      /\brecharge\b/, /\brest(ed)?\b/, /\bslow day\b/, /\bchill(ed)?\b/,
      /\bwalk(ed)? in the park\b/, /\bcoffee on the balcony\b/, /\bbrain feels quiet\b/
    ];

    const emotionalPatterns = [
      /\boverwhelmed\b/, /\banxiety\b/, /\bheavy\b/, /\bfelt pointless\b/,
      /\bjust want to disappear\b/, /\blonely\b/, /\bshut down\b/
    ];

    const productive = [], unproductive = [], rest = [], emotional = [];

    parts.forEach(p => {
      if (productivePatterns.some(r => r.test(p))) productive.push(p);
      else if (unproductivePatterns.some(r => r.test(p))) unproductive.push(p);
      else if (restPatterns.some(r => r.test(p))) rest.push(p);
      else if (emotionalPatterns.some(r => r.test(p))) emotional.push(p);
    });

    // Clean up the activity descriptions - extract just the key activities
    const cleanProductiveActivities = [];
    productive.forEach(p => {
      if (/woke up early/.test(p)) cleanProductiveActivities.push('Woke up early');
      if (/worked on/.test(p) || /working on/.test(p)) {
        const match = p.match(/working on (my |the )?([^—,\.]+)/);
        cleanProductiveActivities.push(match ? `Worked on ${match[2].trim()}` : 'Worked on project');
      }
      if (/research paper/.test(p)) cleanProductiveActivities.push('Research paper work');
      if (/found sources|found.*sources/.test(p)) cleanProductiveActivities.push('Found research sources');
      if (/went to the library/.test(p)) cleanProductiveActivities.push('Library visit');
      if (/solid block of time/.test(p)) cleanProductiveActivities.push('Focused work session');
      if (/completed/.test(p)) cleanProductiveActivities.push('Completed tasks');
      if (/finished/.test(p)) cleanProductiveActivities.push('Finished work');
      if (/studied/.test(p)) cleanProductiveActivities.push('Studied');
      if (/revised/.test(p)) cleanProductiveActivities.push('Revised material');
      if (/cleaned/.test(p)) cleanProductiveActivities.push('Cleaned up');
      if (/organized/.test(p)) cleanProductiveActivities.push('Organized tasks');
      if (/took notes/.test(p)) cleanProductiveActivities.push('Took notes');
      if (/prepared for/.test(p)) cleanProductiveActivities.push('Prepared for tasks');
      if (/exercise|workout|yoga|treadmill|run|jog/.test(p)) cleanProductiveActivities.push('Exercise/Physical activity');
    });

    const cleanUnproductiveActivities = [];
    unproductive.forEach(p => {
      if (/scrolled|doom(-)?scroll/.test(p)) cleanUnproductiveActivities.push('Social media scrolling');
      if (/group chat/.test(p)) cleanUnproductiveActivities.push('Group chat distraction');
      if (/gossip/.test(p)) cleanUnproductiveActivities.push('Gossip/drama');
      if (/phone blew up/.test(p)) cleanUnproductiveActivities.push('Phone notifications');
      if (/wasted (time|an hour|two hours|the day)/.test(p)) {
        const match = p.match(/wasted (an hour|two hours|the day|time)/);
        cleanUnproductiveActivities.push(match ? `Wasted ${match[1]}` : 'Wasted time');
      }
      if (/played\b.*(bgmi|pubg|valorant|apex|fortnite|csgo)/.test(p)) cleanUnproductiveActivities.push('Gaming');
      if (/just laid in bed/.test(p)) cleanUnproductiveActivities.push('Laid in bed');
      if (/procrastinat/.test(p)) cleanUnproductiveActivities.push('Procrastination');
      if (/no motivation/.test(p)) cleanUnproductiveActivities.push('Lack of motivation');
    });

    const cleanRestActivities = [];
    rest.forEach(p => {
      if (/recharge/.test(p)) cleanRestActivities.push('Recharging');
      if (/rest(ed)?/.test(p)) cleanRestActivities.push('Rested');
      if (/slow day/.test(p)) cleanRestActivities.push('Slow day');
      if (/chill(ed)?/.test(p)) cleanRestActivities.push('Relaxed/Chilled');
      if (/walk(ed)? in the park/.test(p)) cleanRestActivities.push('Walk in the park');
      if (/coffee on the balcony/.test(p)) cleanRestActivities.push('Coffee break');
      if (/brain feels quiet/.test(p)) cleanRestActivities.push('Mental calm');
    });

    const cleanEmotionalStates = [];
    emotional.forEach(p => {
      if (/overwhelmed/.test(p)) cleanEmotionalStates.push('Feeling overwhelmed');
      if (/anxiety/.test(p)) cleanEmotionalStates.push('Anxiety');
      if (/heavy/.test(p)) cleanEmotionalStates.push('Feeling heavy');
      if (/felt pointless/.test(p)) cleanEmotionalStates.push('Feeling pointless');
      if (/just want to disappear/.test(p)) cleanEmotionalStates.push('Wanting to disappear');
      if (/lonely/.test(p)) cleanEmotionalStates.push('Loneliness');
      if (/shut down/.test(p)) cleanEmotionalStates.push('Shutting down');
    });

    // Remove duplicates
    const uniqueProductive = [...new Set(cleanProductiveActivities)];
    const uniqueUnproductive = [...new Set(cleanUnproductiveActivities)];
    const uniqueRest = [...new Set(cleanRestActivities)];
    const uniqueEmotional = [...new Set(cleanEmotionalStates)];

    // ✅ Scoring logic
    let score = Math.round(50 + uniqueProductive.length * 10 - uniqueUnproductive.length * 7 - uniqueEmotional.length * 4);
    score = Math.max(0, Math.min(score, 100));

    const analysis = { 
      score, 
      productive: uniqueProductive, 
      unproductive: uniqueUnproductive, 
      rest: uniqueRest, 
      emotional: uniqueEmotional 
    };
    journal.analysis = analysis;
    journal.analysisStatus = "ready";
    journal.analysisAt = Date.now();
    await journal.save();

    return res.json({ success: true, message: "Journal analyzed successfully", data: analysis });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
};

module.exports = {
  createJournal,
  getJournals,
  getJournalById,
  updateJournal,
  deleteJournal,
  analyzeJournal
};
