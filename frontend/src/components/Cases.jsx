import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { motion } from 'framer-motion';
import { Plus, MessageCircle, Briefcase } from 'lucide-react';
import CryptoJS from 'crypto-js';

const Cases = () => {
  const navigate = useNavigate();
  const { user } = useAuth0();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  const decryptData = (encryptedData) => {
    const bytes = CryptoJS.AES.decrypt(
      encryptedData,
      import.meta.env.VITE_ENCRYPTION_KEY
    );
    return bytes.toString(CryptoJS.enc.Utf8);
  };

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/cases`);
        if (response.ok) {
          const allCases = await response.json();
          const userCases = allCases.filter(
            legalCase => legalCase.lawyer1_address === user.sub
          );
          setCases(userCases);
        }
      } catch (error) {
        console.error('Error fetching cases:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-4"
          >
            <div className="p-3 bg-sky-100 rounded-xl">
              <Briefcase className="w-8 h-8 text-sky-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-sky-700">Your Cases</h1>
              <p className="text-sky-400">{cases.length} active cases</p>
            </div>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/cases/create')}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Case</span>
          </motion.button>
        </div>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((legalCase, index) => (
            <motion.div
              key={legalCase.case_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="relative group"
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-sky-100 to-blue-100 rounded-xl transform transition-transform group-hover:scale-105 opacity-30 blur" />
              
              <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-sky-100 shadow-lg transition-all group-hover:shadow-xl">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {legalCase.title}
                    </h3>
                    <motion.div
                      whileHover={{ rotate: 15 }}
                      className="p-2 bg-sky-50 rounded-lg"
                    >
                      <Briefcase className="w-5 h-5 text-sky-500" />
                    </motion.div>
                  </div>
                  
                  <p className="text-sm text-sky-400">
                    Case ID: {legalCase.case_id}
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/chat/${legalCase.case_id}`)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white hover:bg-sky-50 text-sky-400 rounded-lg border border-sky-100 transition-all"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Open Chat</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {cases.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-sky-300 mb-4">
              <Briefcase className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-sky-500 mb-2">
              No cases yet
            </h3>
            <p className="text-gray-500">
              Create your first case to get started
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Cases;

