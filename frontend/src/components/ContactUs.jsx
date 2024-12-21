import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { motion } from 'framer-motion';
import { Send, Mail, MessageSquare, User } from 'lucide-react';

const ContactUs = () => {
  const { user } = useAuth0();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto"
          >
            <MessageSquare className="w-8 h-8 text-sky-600" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-sky-600"
          >
            Contact Us
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sky-400 max-w-2xl mx-auto"
          >
            Have questions? We're here to help! Fill out the form below and our team will get back to you as soon as possible.
          </motion.p>
        </div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-sky-100 shadow-xl"
        >
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-sky-300" />
                  </div>
                  <input
                    type="text"
                    defaultValue={user?.name}
                    className="pl-10 w-full px-4 py-3 rounded-xl border border-sky-200 focus:ring-2 focus:ring-sky-300 focus:border-sky-300 bg-white/50 text-sky-600 placeholder-sky-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    defaultValue={user?.email}
                    className="pl-10 w-full px-4 py-3 rounded-xl border border-sky-200 focus:ring-2 focus:ring-sky-300 focus:border-sky-300 bg-white/50 text-sky-600 placeholder-sky-300"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-sky-200 focus:ring-2 focus:ring-sky-300 focus:border-sky-300 bg-white/50 text-sky-600 placeholder-sky-300"
                required
                placeholder="How can we help you?"
              />
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all"
            >
              <Send className="w-5 h-5" />
              <span>Send Message</span>
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ContactUs;

