import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Scale, User, MessageSquare, Menu, X, Briefcase } from 'lucide-react';

const Navigation = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth0();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { icon: <Scale className="w-5 h-5" />, text: 'Cases', path: '/cases' },
    { icon: <User className="w-5 h-5" />, text: 'Profile', path: '/profile' },
    { icon: <MessageSquare className="w-5 h-5" />, text: 'Contact', path: '/contactus' },
    { icon: <Briefcase className="w-5 h-5" />, text: 'Consultancy', path: '/consultancy' }, // Add this line
  ];

  const NavLink = ({ item }) => {
    const isActive = location.pathname === item.path;
    
    return (
      <motion.button
        whileHover={{ 
          scale: 1.05,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          textShadow: "0 0 8px rgba(255, 255, 255, 0.5)"
        }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => navigate(item.path)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-xl
          transition-all duration-300 group
          ${isActive 
            ? 'text-blue-400 font-medium' // Changed from text-white
            : 'text-blue-300/70 hover:text-blue-400' // Changed from text-white/70 hover:text-white
          }`}
      >
        <motion.span
          whileHover={{ scale: 1.1 }}
          initial={{ opacity: 0.7 }}
          animate={{ opacity: isActive ? 1 : 0.7 }}
          className="group-hover:opacity-100 transition-opacity"
        >
          {item.icon}
        </motion.span>
        <span>{item.text}</span>
      </motion.button>
    );
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Remove the Lexify logo section completely */}
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item, index) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <NavLink item={item} />
              </motion.div>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ 
                scale: 1.02,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              }}
              className="hidden md:flex items-center space-x-3 px-4 py-2 rounded-xl"
            >
              <motion.img
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
                src={user?.picture}
                alt={user?.name}
                className="w-9 h-9 rounded-full"
              />
              <span className="text-blue-400/90 font-medium">{user?.name}</span> 
            </motion.div>

            <motion.button
              whileHover={{ 
                scale: 1.02,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => logout()}
              className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-xl
                       text-blue-400/90 font-medium group" 
            >
              <motion.span
                animate={{ 
                  rotate: [0, 10, 0],
                  transition: { duration: 2, repeat: Infinity }
                }}
                className="opacity-70 group-hover:opacity-100"
              >
                <LogOut className="w-4 h-4" />
              </motion.span>
              <span>Logout</span>
            </motion.button>

            {/* Mobile menu button */}
            <motion.button
              whileHover={{ 
                scale: 1.05,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-xl text-white"
            >
              <motion.div
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: 1, 
              height: "auto",
              transition: {
                height: { type: "spring", stiffness: 300, damping: 30 }
              }
            }}
            exit={{ 
              opacity: 0, 
              height: 0,
              transition: { duration: 0.2 }
            }}
            className="md:hidden backdrop-blur-lg"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-2"
            >
              {navItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <NavLink item={item} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navigation;

