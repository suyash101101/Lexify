import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Scale, User, MessageSquare, Menu, X } from 'lucide-react';

const Navigation = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth0();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { icon: <Scale className="w-5 h-5" />, text: 'Cases', path: '/cases' },
    { icon: <User className="w-5 h-5" />, text: 'Profile', path: '/profile' },
    { icon: <MessageSquare className="w-5 h-5" />, text: 'Contact', path: '/contactus' },
  ];

  const NavLink = ({ item }) => {
    const isActive = location.pathname === item.path;
    
    return (
      <motion.button
        whileHover={{ 
          scale: 1.05,
          backgroundColor: "rgba(255, 255, 255, 0.15)"
        }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => navigate(item.path)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-xl backdrop-blur-sm
          transition-all duration-300 border border-transparent
          ${isActive 
            ? 'bg-white/20 text-white border-white/30 shadow-lg shadow-white/20 font-medium'
            : 'hover:border-white/20 text-white/80 hover:text-white hover:bg-white/10'
          }`}
      >
        <motion.span
          whileHover={{ rotate: 15 }}
          className="text-inherit"
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
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/20 bg-black/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="relative group"
          >
            <span className="text-2xl font-bold bg-gradient-to-r from-white via-white/95 to-white/90 text-transparent bg-clip-text">
              Lexify
            </span>
            <motion.div
              className="absolute inset-0 rounded-lg -z-10"
              animate={{
                background: [
                  "radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)",
                  "radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%)",
                  "radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>

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
              whileHover={{ scale: 1.02 }}
              className="hidden md:flex items-center space-x-3 px-3 py-2 rounded-xl 
                        bg-white/10 backdrop-blur-sm border border-white/20"
            >
              <motion.img
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                src={user?.picture}
                alt={user?.name}
                className="w-8 h-8 rounded-full ring-2 ring-white/20"
              />
              <span className="text-white font-medium">{user?.name}</span>
            </motion.div>

            <motion.button
              whileHover={{ 
                scale: 1.02,
                backgroundColor: "rgba(255, 255, 255, 0.15)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => logout()}
              className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-xl
                       backdrop-blur-sm border border-white/20 text-white font-medium
                       hover:bg-white/10 transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </motion.button>

            {/* Mobile menu button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-xl text-white hover:text-white
                       backdrop-blur-sm border border-white/20 hover:bg-white/10"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-white/20 backdrop-blur-md bg-black/5"
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

