import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { motion } from 'framer-motion';
import { User, Mail, Key, Shield, CheckCircle, Calendar } from 'lucide-react';
import { Card } from './shared/Card';

const ProfileCard = ({ icon: Icon, title, value }) => (
  <Card hover={false} className="p-4">
    <div className="flex items-center gap-4">
      <div className="p-2 bg-black/5 rounded-xl shrink-0">
        <Icon className="w-5 h-5 text-black" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-black/60 mb-0.5">{title}</p>
        <p className="text-sm font-medium text-black truncate">{value}</p>
      </div>
    </div>
  </Card>
);

const Profile = () => {
  const { user } = useAuth0();

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header Section */}
        <div className="relative bg-black rounded-2xl p-6 sm:p-8 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-[0.03]" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-white/20"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white/20 flex items-center justify-center">
                  <User className="w-12 h-12 sm:w-16 sm:h-16 text-white/60" />
                </div>
              )}
            </motion.div>
            
            <div className="text-center sm:text-left">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl sm:text-4xl font-display font-bold text-white"
              >
                {user?.name}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/60 mt-2"
              >
                Legal Professional
              </motion.p>
            </div>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

