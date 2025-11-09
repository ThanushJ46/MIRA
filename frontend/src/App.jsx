import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import JournalsList from './pages/JournalsList';
import JournalView from './pages/JournalView';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/journals"
          element={
            <ProtectedRoute>
              <JournalsList />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/journal/:id"
          element={
            <ProtectedRoute>
              <JournalView />
            </ProtectedRoute>
          }
        />
        
        <Route path="/" element={<Navigate to="/journals" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
