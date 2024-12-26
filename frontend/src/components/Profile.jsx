import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { motion } from 'framer-motion';
import { User, Mail, Key, Shield, CheckCircle, Calendar } from 'lucide-react';
import { Card } from './shared/Card';

const ProfileCard = ({ icon: Icon, title, value }) => (
  <Card hover={false} className="space-y-4">
    <div className="flex items-start space-x-4">
      <div className="p-3 bg-royal/5 rounded-xl">
        <Icon className="w-6 h-6 text-royal" />
      </div>
      <div>
        <p className="text-sm text-royal/60">{title}</p>
        <p className="text-lg font-display font-semibold text-royal">{value}</p>
      </div>
    </div>
  </Card>
);

const Profile = () => {
  const { user } = useAuth0();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <motion.div
        
        className="space-y-12"
      >
        {/* Header Section */}
        <div className="relative bg-gradient-royal rounded-3xl p-8 overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative z-10 flex items-center space-x-8">
            <motion.div
          
            
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
                className="text-4xl font-display font-bold"
              >
                {user?.name}
              </motion.h1>
              <motion.p
               
                transition={{ delay: 0.4 }}
                className="text-white/80 mt-2"
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

