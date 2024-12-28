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
import HAIReviewConversation from './components/HAIReviewConversation';
import Login from './components/Login';
import { Loading } from './components/shared/Loading';
import Pricing from './pages/Pricing';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Blog from './pages/Blog';
import About from './pages/About';
import Footer from './components/shared/Footer';


// Wrapper for authenticated routes with DashboardLayout
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
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
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/about" element={<About />} />


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
        <Route path="/chat/:case_id/review" element={
          <PrivateRoute>
            <HAIReviewConversation />
          </PrivateRoute>
        } />
      </Routes>

      {/* Only show Footer on public routes */}
      {!isAuthenticated && <Footer />}

    </>
  );
};

export default App;