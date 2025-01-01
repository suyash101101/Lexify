import { useAuth0 } from '@auth0/auth0-react';
import { motion } from 'framer-motion';
import { Send, Mail, MessageSquare, User, Phone, MapPin } from 'lucide-react';

const ContactUs = () => {
  const { user } = useAuth0();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
       
        className="space-y-12"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            transition={{ type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto"
          >
            <MessageSquare className="w-8 h-8 text-white" />
          </motion.div>
          
          <motion.h1
            
            transition={{ delay: 0.2 }}
            className="text-4xl font-display font-bold text-black"
          >
            Get in Touch
          </motion.h1>
          
          <motion.p
           
            transition={{ delay: 0.3 }}
            className="text-gray-500 max-w-2xl mx-auto"
          >
            Have questions about our legal services? We&apos;re here to help. Fill out the form below and our team will get back to you promptly.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Cards */}
          <motion.div
            
            transition={{ delay: 0.4 }}
            className="lg:col-span-1 space-y-4"
          >
            {/* Email Card */}
            <div className="bg-black/[0.02] p-6 rounded-2xl border border-black/5">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-2">Email Us</h3>
              <p className="text-gray-500 text-sm">support@lexify.com</p>
              <p className="text-gray-500 text-sm">contact@lexify.com</p>
            </div>

            {/* Phone Card */}
            <div className="bg-black/[0.02] p-6 rounded-2xl border border-black/5">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-2">Call Us</h3>
              <p className="text-gray-500 text-sm">+91 9033398366</p>
              <p className="text-gray-500 text-sm">Mon - Fri, 9am - 6pm IST</p>
            </div>

            {/* Office Card */}
            <div className="bg-black/[0.02] p-6 rounded-2xl border border-black/5">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-2">Visit Us</h3>
              <p className="text-gray-500 text-sm">NITK Surathkal</p>
              <p className="text-gray-500 text-sm">Karnataka, India</p>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
         
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-white border border-black/5 p-8 rounded-2xl shadow-sm"
          >
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-black">Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      defaultValue={user?.name}
                      className="pl-10 w-full h-11 px-4 rounded-xl border border-black/10 
                               focus:outline-none focus:border-black/20 focus:ring-0
                               bg-white text-black placeholder-gray-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-black">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="pl-10 w-full h-11 px-4 rounded-xl border border-black/10 
                               focus:outline-none focus:border-black/20 focus:ring-0
                               bg-white text-black placeholder-gray-400"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-black">Message</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-black/10 
                           focus:outline-none focus:border-black/20 focus:ring-0
                           bg-white text-black placeholder-gray-400"
                  required
                  placeholder="How can we help you?"
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-center gap-2 h-11 
                         bg-black text-white rounded-xl hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" />
                <span>Send Message</span>
              </motion.button>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ContactUs;

