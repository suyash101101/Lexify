import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Scale, Menu, X, ChevronDown } from 'lucide-react';
import { Button } from './shared/Button';

const NavLink = ({ to, children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === to;
  
  return (
    <button
      onClick={() => navigate(to)}
      className={`
        px-4 py-2 text-md font-medium transition-all duration-200 rounded-xl
        ${isActive 
          ? 'text-black' 
          : 'text-black/60 hover:text-black hover:bg-black/5'
        }
      `}
    >
      {children}
    </button>
  );
};

NavLink.propTypes = {
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, isAuthenticated } = useAuth0();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // List of paths where we use DashboardLayout (hide navbar here)
  const dashboardPaths = ['/cases', '/consultancy', '/profile'];
  
  // Check if current path is a dashboard path
  const isDashboardPage = dashboardPaths.some(path => 
    location.pathname.startsWith(path)
  );

  // Don't render navbar on dashboard pages
  if (isDashboardPage) {
    return null;
  }

  return (
    <header className="fixed top-0 sm:top-6 left-0 sm:left-1/2 sm:-translate-x-1/2 z-50 w-full sm:w-[95%] sm:max-w-3xl">
      <nav className="bg-accent-white/70 backdrop-blur-md sm:rounded-xl px-4 sm:px-6 py-3 
                     border-b sm:border shadow-[0_0_0_1px_rgba(0,0,0,0.03)]
                     hover:shadow-[0_0_0_1px_rgba(0,0,0,0.05)] transition-all duration-300">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div 
            onClick={() => navigate('/')}
            className="flex items-center cursor-pointer shrink-0"
          >
            <div className="w-8 h-8 bg-primary-main rounded-xl flex items-center justify-center mr-2">
              <Scale className="w-4 h-4 text-accent-white" />
            </div>
            <span className="text-lg font-display font-bold text-primary-main">
              Lexify
            </span>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink to="/cases">Cases</NavLink>
            <NavLink to="/consultancy">Consultancy</NavLink>
            <NavLink to="/contactus">Contact</NavLink>
          </div>

          {/* User Menu - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 px-4 py-2  rounded-full
                            hover:bg-primary-main/10 transition-colors duration-200"
                >
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-6 h-6 rounded-full border border-primary-main/10"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary-main/20 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-main">
                        {user?.name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-primary-main max-w-[100px] truncate">
                    {user?.name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-primary-main/60" />
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-primary-main/10 py-2">
                    <button
                      onClick={() => navigate('/profile')}
                      className="w-full text-left px-4 py-2 text-sm text-primary-main/60 hover:text-primary-main hover:bg-primary-main/5"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => logout()}
                      className="w-full text-left px-4 py-2 text-sm text-primary-main/60 hover:text-primary-main hover:bg-primary-main/5"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/login')}
                className="rounded-full"
              >
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-primary-main/5 rounded-full"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-primary-main/10">
            <div className="space-y-2">
              <NavLink to="/cases" className="block w-full">Cases</NavLink>
              <NavLink to="/consultancy" className="block w-full">Consultancy</NavLink>
              <NavLink to="/contactus" className="block w-full">Contact</NavLink>
              
              {isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-3 px-4 py-2 my-2">
                    {user?.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-6 h-6 rounded-full border border-primary-main/10"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary-main/20 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-main">
                          {user?.name?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-primary-main">
                      {user?.name}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logout()}
                    className="w-full rounded-full mt-2"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="w-full rounded-full mt-2"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navigation;

