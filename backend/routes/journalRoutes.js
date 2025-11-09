const express = require('express');
const router = express.Router();
const {
  createJournal,
  getJournals,
  getJournalById,
  updateJournal,
  deleteJournal,
  analyzeJournal
} = require('../controllers/journalController');
const { protect } = require('../middleware/authMiddleware');

// All journal routes are protected
router.post('/create', protect, createJournal);
router.get('/', protect, getJournals);
router.get('/:id', protect, getJournalById);
router.put('/:id', protect, updateJournal);
router.delete('/:id', protect, deleteJournal);
router.post('/:id/analyze', protect, analyzeJournal);

module.exports = router;
