import { motion } from 'framer-motion';
import { ScrollText, Shield, FileText, AlertCircle } from 'lucide-react';

const TermsSection = ({ icon: Icon, title, children }) => (
  <div className="mb-12">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center">
        <Icon className="w-5 h-5 text-black" />
      </div>
      <h2 className="text-2xl font-display font-bold">{title}</h2>
    </div>
    {children}
  </div>
);

const Terms = () => {
  return (
    <div className="min-h-screen bg-accent-white px-4 py-16 mt-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ScrollText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold text-black mb-4">Terms of Service</h1>
          <p className="text-black/60">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-lg mx-auto">
          <p className="text-lg text-black/80 mb-12">
            Welcome to Lexify. By using our services, you agree to be bound by the following terms and conditions. Please read them carefully.
          </p>

          <TermsSection icon={Shield} title="1. Acceptance of Terms">
            <p className="text-black/80">
              By accessing and using Lexify, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
            </p>
          </TermsSection>

          <TermsSection icon={FileText} title="2. Use License">
            <ul className="space-y-3 text-black/70">
              <li>Permission is granted to temporarily access Lexify for personal and professional legal use</li>
              <li>This license is non-exclusive, non-transferable, and limited</li>
              <li>You may not modify, copy, distribute, or create derivative works</li>
              <li>Usage is restricted to authorized legal professionals</li>
            </ul>
          </TermsSection>

          <TermsSection icon={AlertCircle} title="3. Professional Conduct">
            <p className="text-black/80 mb-4">Users must maintain professional standards including:</p>
            <ul className="space-y-3 text-black/70">
              <li>Adherence to legal ethics and professional responsibility</li>
              <li>Maintaining client confidentiality</li>
              <li>Providing accurate information</li>
              <li>Using the platform for legitimate legal purposes only</li>
            </ul>
          </TermsSection>

          <div className="bg-black/5 rounded-2xl p-8 text-center mt-12">
            <h3 className="text-xl font-medium mb-4">Questions About Our Terms?</h3>
            <p className="text-black/60 mb-6">
              If you have any questions or concerns about our Terms of Service, please contact our legal team.
            </p>
            <button className="bg-black text-white px-8 py-3 rounded-xl font-medium hover:bg-black/90 transition-colors">
              Contact Legal Team
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Terms;