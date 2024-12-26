import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { 
  Scale, 
  LayoutGrid,
  MessageSquare,
  Phone,
  Menu,
  X,
  User
} from 'lucide-react';

const SidebarLink = ({ to, icon: Icon, children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === to;

  return (
    <button
      onClick={() => navigate(to)}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl
        transition-all duration-200
        ${isActive 
          ? 'bg-primary-main text-accent-white' 
          : 'text-primary-main/60 hover:bg-primary-main/5 hover:text-primary-main'
        }
      `}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{children}</span>
    </button>
  );
};

SidebarLink.propTypes = {
  to: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  children: PropTypes.node.isRequired,
};

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuth0();
  const navigate = useNavigate();

  return (
    <div className="h-screen flex overflow-hidden bg-accent-gray">
      {/* Sidebar */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-50
          bg-accent-white border-r border-primary-main/5
          flex flex-col h-full
          transition-all duration-300
          ${isSidebarOpen ? 'w-72 translate-x-0' : '-translate-x-full md:w-20 md:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 py-4 shrink-0">
            <div className="w-10 h-10 bg-primary-main rounded-xl flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5 text-accent-white" />
            </div>
            <span className={`text-xl font-display font-bold text-primary-main transition-opacity duration-200
                          ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-0 hidden md:block'}`}>
              Lexify
            </span>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            <SidebarLink to="/cases" icon={LayoutGrid}>
              <span className={`transition-opacity duration-200
                            ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-0 hidden md:block'}`}>
                Dashboard
              </span>
            </SidebarLink>
            <SidebarLink to="/consultancy" icon={MessageSquare}>
              <span className={`transition-opacity duration-200
                            ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-0 hidden md:block'}`}>
                Consultancy
              </span>
            </SidebarLink>
            <SidebarLink to="/contactus" icon={Phone}>
              <span className={`transition-opacity duration-200
                            ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-0 hidden md:block'}`}>
                Contact Us
              </span>
            </SidebarLink>
          </nav>

          {/* User Profile - Fixed at bottom */}
          <div className="mt-auto border-t border-primary-main/5 p-4 space-y-2 bg-accent-white">
            {/* Profile Link */}
            <button
              onClick={() => navigate('/profile')}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                text-primary-main/60 hover:bg-primary-main/5 hover:text-primary-main
                transition-all duration-200
              `}
            >
              <User className="w-5 h-5" />
              <span className={`font-medium transition-opacity duration-200
                            ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-0 hidden md:block'}`}>
                View Profile
              </span>
            </button>

            {/* User Info & Sign Out */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-10 h-10 rounded-xl border border-primary-main/10"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-primary-main/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-main">
                    {user?.name?.charAt(0)}
                  </span>
                </div>
              )}
              <div className={`transition-opacity duration-200
                           ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-0 hidden md:block'}`}>
                <div className="font-medium text-primary-main truncate">
                  {user?.name}
                </div>
                <button
                  onClick={() => logout()}
                  className="text-sm text-primary-main/60 hover:text-primary-main"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 -right-4 w-8 h-8 bg-accent-white border border-primary-main/10 
                     rounded-full flex items-center justify-center md:hidden"
        >
          {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-primary-main/20 backdrop-blur-sm md:hidden z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default DashboardLayout; 