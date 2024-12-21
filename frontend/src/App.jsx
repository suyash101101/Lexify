import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import Navigation from './components/Navigation';
import Landing from './components/Landing';
import Login from './components/Login';
import Profile from './components/Profile';
import ContactUs from './components/ContactUs';
import Hello from './components/Hello';
import Cases from './components/Cases';
import { useAuth0 } from '@auth0/auth0-react';
import CreateCase from './components/CreateCase';
import HAIChatInterface from './components/HAIChatInterface';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './styles/theme';
import Background from './components/Background';
import Consulting from './components/Consulting';

// Protected Route wrapper component
const ProtectedRoute = ({ component, ...args }) => {
  const Component = withAuthenticationRequired(component, {
    onRedirecting: () => <div>Loading...</div>,
    ...args,
  });
  return <Component />;
};

// Navigation wrapper that only shows when authenticated
const NavigationWrapper = ({ children }) => {
  const { isAuthenticated } = useAuth0();
  return (
    <>
      {isAuthenticated && <Navigation />}
      {children}
    </>
  );
};

// Auth0 Provider wrapper
const Auth0ProviderWithNavigate = ({ children }) => {
  const navigate = useNavigate();

  const onRedirectCallback = (appState) => {
    navigate(appState?.returnTo || window.location.pathname);
  };

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
};

// Main App component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="min-h-screen relative overflow-hidden">
        <Background />
        
        {/* Main content */}
        <div className="relative z-10">
          <Auth0ProviderWithNavigate>
            <NavigationWrapper>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/consultancy" element ={<Consulting/>} />
                
                {/* Protected routes */}
                <Route
                  path="/profile"
                  element={<ProtectedRoute component={Profile} />}
                />
                <Route
                  path="/contactus"
                  element={<ProtectedRoute component={ContactUs} />}
                />
                <Route
                  path="/hello"
                  element={<ProtectedRoute component={Hello} />}
                />
                <Route
                  path="/cases"
                  element={<ProtectedRoute component={Cases} />}
                />
                <Route
                  path="/cases/create"
                  element={<ProtectedRoute component={CreateCase} />}
                />
                <Route
                  path="/chat/:case_id"
                  element={<ProtectedRoute component={HAIChatInterface} />}
                />
                <Route
                  path="/create-case"
                  element={<ProtectedRoute component={CreateCase} />}
                />

              </Routes>
            </NavigationWrapper>
          </Auth0ProviderWithNavigate>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;