import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Scale, ArrowRight } from 'lucide-react';
import { Button } from './shared/Button';
import { Loading } from './shared/Loading';

const Login = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (isAuthenticated) {
      const destination = location.state?.returnTo || '/cases';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-accent-white relative overflow-hidden flex items-center justify-center px-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-[0.02]" />
      
      {/* Content */}
      <div className="relative bg-accent-white border border-primary-main/5 rounded-3xl p-8 md:p-12 w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-primary-main rounded-2xl flex items-center justify-center mb-4">
              <Scale className="w-8 h-8 text-accent-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-primary-main">
              Welcome to Lexify
            </h1>
          </div>

          {/* Description */}
          <p className="text-primary-main/60 mb-8 leading-relaxed">
            Sign in to access your AI-powered legal practice platform. Transform your legal expertise with cutting-edge technology.
          </p>

          {/* Sign In Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={() => loginWithRedirect({
              appState: { returnTo: location.state?.returnTo || '/cases' }
            })}
            className="w-full sm:w-auto text-sm sm:text-base py-2.5 px-5 sm:py-3 sm:px-6 hover:opacity-90 transition-opacity"
          >
            <span>Sign in with Google</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          </Button>

          {/* Terms */}
          <p className="mt-6 text-sm text-primary-main/40">
            By signing in, you agree to our{' '}
            <a href="#terms" className="text-primary-main hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#privacy" className="text-primary-main hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

