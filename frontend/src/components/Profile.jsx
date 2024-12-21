import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { motion } from 'framer-motion';
import { User, Mail, Key, Shield, CheckCircle, Calendar } from 'lucide-react';

const ProfileCard = ({ icon: Icon, title, value }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-gradient-to-r from-sky-50 to-blue-50 backdrop-blur-sm p-6 rounded-xl border border-sky-100 shadow-lg"
  >
    <div className="flex items-start space-x-4">
      <div className="p-3 bg-sky-100 rounded-xl">
        <Icon className="w-6 h-6 text-sky-600" />
      </div>
      <div>
        <p className="text-sm text-sky-400">{title}</p>
        <p className="text-lg font-semibold text-sky-600 mt-1">{value}</p>
      </div>
    </div>
  </motion.div>
);

const Profile = () => {
  const { user } = useAuth0();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        {/* Header Section */}
        <div className="relative bg-gradient-to-r from-sky-500 to-blue-600 rounded-3xl p-8 overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative z-10 flex items-center space-x-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <img
                src={user?.picture}
                alt={user?.name}
                className="w-32 h-32 rounded-2xl border-4 border-white/20 shadow-xl"
              />
            </motion.div>
            
            <div className="text-white">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold"
              >
                {user?.name}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sky-100 mt-2"
              >
                Legal Professional
              </motion.p>
            </div>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProfileCard
            icon={Mail}
            title="Email"
            value={user?.email}
          />
          <ProfileCard
            icon={Key}
            title="User ID"
            value={user?.sub}
          />
          <ProfileCard
            icon={Calendar}
            title="Member Since"
            value={new Date(user?.updated_at).toLocaleDateString()}
          />
          <ProfileCard
            icon={Shield}
            title="Account Type"
            value="Professional"
          />
          <ProfileCard
            icon={CheckCircle}
            title="Verification Status"
            value="Verified"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;

