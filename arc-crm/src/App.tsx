import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from '../src/pages/LoginPage';
import SignUpPage from '../src/pages/SignUpPage';

function App() {
  return (
      <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
      </Routes>
  );
}

export default App;
