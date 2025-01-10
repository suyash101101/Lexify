import React, { useState, useEffect } from 'react';
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
  User,
  CreditCard,
  Coins,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { GlobalConsultingWidget } from '../Consulting';
import { Button } from '../shared/Button';
import { motion } from 'framer-motion';

const SidebarLink = ({ to, icon: Icon, children, onNavigate }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === to;

  const handleClick = () => {
    navigate(to);
    if (onNavigate) onNavigate();
  };

  return (
    <button
      onClick={handleClick}
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
  onNavigate: PropTypes.func,
};

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreditsExpanded, setIsCreditsExpanded] = useState(false);
  const { user, logout } = useAuth0();
  const [credits, setCredits] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCredits = async () => {
      if (user?.sub) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/credits/${user.sub}`);
          const data = await response.json();
          setCredits(data.credits);
        } catch (error) {
          console.error('Error fetching credits:', error);
        }
      }
    };

    fetchCredits();
    const interval = setInterval(fetchCredits, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMobileNavigate = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Format date to show days remaining
  const getDaysRemaining = (nextReset) => {
    if (!nextReset) return null;
    const resetDate = new Date(nextReset);
    const now = new Date();
    const days = Math.ceil((resetDate - now) / (1000 * 60 * 60 * 24));
    return days;
  };

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
            <SidebarLink to="/cases" icon={LayoutGrid} onNavigate={handleMobileNavigate}>
              <span className={`transition-opacity duration-200
                            ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-0 hidden md:block'}`}>
                Dashboard
              </span>
            </SidebarLink>
            <SidebarLink to="/consultancy" icon={MessageSquare} onNavigate={handleMobileNavigate}>
              <span className={`transition-opacity duration-200
                            ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-0 hidden md:block'}`}>
                Consultancy
              </span>
            </SidebarLink>
            <SidebarLink to="/contactus" icon={Phone} onNavigate={handleMobileNavigate}>
              <span className={`transition-opacity duration-200
                            ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-0 hidden md:block'}`}>
                Contact Us
              </span>
            </SidebarLink>
          </nav>

          {/* User Profile - Fixed at bottom */}
          <div className="mt-auto border-t border-primary-main/5 p-4 space-y-2 bg-accent-white">
            {/* Credits Display */}
            {credits !== null && (
              <div className="p-4 bg-black/[0.02] rounded-xl border border-black/5">
                <button 
                  onClick={() => setIsCreditsExpanded(!isCreditsExpanded)}
                  className="w-full flex items-center justify-between mb-2"
                >
                  <span className="text-sm font-medium text-black">Available Credits</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-black">{credits}</span>
                    {isCreditsExpanded ? (
                      <ChevronUp className="w-4 h-4 text-black/60" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-black/60" />
                    )}
                  </div>
                </button>
                
                {isCreditsExpanded && (
                  <div className="pt-2 border-t border-black/5 mt-2 space-y-2">
                    <h1 className="text-sm font-medium text-black">Credits Breakdown</h1>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-black/60">Case Creation</span>
                      <span className="font-medium">450 credits</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-black/60">Chat Consulting</span>
                      <span className="font-medium">85 credits</span>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center gap-2 mt-3" 
                      onClick={() => navigate('/pricing')}
                    >
                      <Coins className="w-4 h-4" />
                      <span className="font-medium">Buy More Credits</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Profile Link */}
            <Button onClick={() => navigate('/profile')}>
              <User className="w-5 h-5" />
              <span className={`font-medium transition-opacity duration-200
                            ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-0 hidden md:block'}`}>
                View Profile
              </span>
            </Button>
          

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

      {/* Global Consulting Widget */}
      <GlobalConsultingWidget />
    </div>
  );
};

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default DashboardLayout; 