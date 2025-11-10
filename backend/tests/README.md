# Backend Tests

This folder contains all test files for the MIRA backend services.

## Test Files

### Ollama/LLM Analysis Tests
- **test-ollama.js** - Basic Ollama service functionality test
- **test-strict-extraction.js** - Tests strict activity extraction (no hallucinations)
- **test-semantic-understanding.js** - Tests semantic understanding with different phrasings
- **test-professional-extraction.js** - Tests professional activity description
- **test-diverse-activities.js** - Tests with varied activity types
- **test-with-unproductive.js** - Tests detection of unproductive activities when mentioned

### Event Detection Tests
- **test-events.js** - Basic event detection from journal entries
- **test-time-parsing.js** - Tests time parsing for events (10am, 2:30pm, etc.)

### Full Integration Tests
- **test-full.js** - Full journal analysis pipeline test
- **test-student-journal.js** - Real-world student journal test case

### Test Runner
- **run-all-tests.js** - Script to run all tests sequentially

## Running Tests

To run a specific test:
```bash
cd backend/tests
node test-name.js
```

Example:
```bash
node test-semantic-understanding.js
```

To run all tests:
```bash
node run-all-tests.js
```

## Requirements

- Ollama must be running with llama3 model installed
- Backend dependencies must be installed (`npm install` in backend folder)

## Adding New Tests

When creating new test files:
1. Place them in this `tests/` folder
2. Use the naming convention: `test-description.js`
3. Import services from parent directory: `require('../services/serviceName')`
4. Update this README with test description
