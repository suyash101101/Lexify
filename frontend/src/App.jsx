import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import Navigation from './components/Navigation';
import Landing from './components/Landing';
import Cases from './components/Cases';
import CreateCase from './components/CreateCase';
import Profile from './components/Profile';
import DashboardLayout from './components/layouts/DashboardLayout';
import ContactUs from './components/ContactUs';
import Consulting from './components/Consulting';
import HAIChatInterface from './components/HAIChatInterface';
import Login from './components/Login';

// Wrapper for authenticated routes with DashboardLayout
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

const App = () => {
  const { isAuthenticated } = useAuth0();

  return (
    <>
      {/* Only show Navigation on public routes */}
      {!isAuthenticated && <Navigation />}
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />


        {/* Protected Routes - All wrapped with DashboardLayout */}
        <Route path="/cases" element={
          <PrivateRoute>
            <Cases />
          </PrivateRoute>
        } />
        <Route path="/cases/create" element={
          <PrivateRoute>
            <CreateCase />
          </PrivateRoute>
        } />
        <Route path="/contactus" element={
          <PrivateRoute>
            <ContactUs />
          </PrivateRoute>
        } />
        <Route path="/consultancy" element={
          <PrivateRoute>
            <Consulting />
          </PrivateRoute>
        } />

        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
        <Route path="/chat/:case_id" element={
          <PrivateRoute>
            <HAIChatInterface />
          </PrivateRoute>
        } />
      </Routes>
    </>
  );
};

export default App;