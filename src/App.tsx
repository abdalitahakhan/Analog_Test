import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import WalletDashboard from './components/WalletDashboard';
import { useGoogleAuth } from './hooks/useGoogleAuth';

function App() {
  const { user, isGoogleLoaded, loading } = useGoogleAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isGoogleLoaded) {
      // Simple delay to let everything initialize
      const timer = setTimeout(() => setReady(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isGoogleLoaded]);

  // Show loading while initializing
  if (!ready || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ZeroDev App...</p>
          <p className="text-xs text-gray-500 mt-2">
            Auth: {isGoogleLoaded ? '✅' : '⏳'} | Ready: {ready ? '✅' : '⏳'} | User: {user ? '✅' : '❌'}
          </p>
        </div>
      </div>
    );
  }

  // Simple routing without automatic redirects to prevent loops
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<WalletDashboard />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
