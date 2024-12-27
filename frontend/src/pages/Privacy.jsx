import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database } from 'lucide-react';

const PrivacySection = ({ icon: Icon, title, children }) => (
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

const Privacy = () => {
  return (
    <div className="min-h-screen bg-accent-white px-4 py-16 mt-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold text-black mb-4">Privacy Policy</h1>
          <p className="text-black/60">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-lg mx-auto">
          <p className="text-lg text-black/80 mb-12">
            At Lexify, protecting your privacy is fundamental to our business. We are committed to maintaining the trust and confidence of our users while delivering exceptional legal AI services.
          </p>

          <PrivacySection icon={Eye} title="Information We Collect">
            <p className="text-black/80 mb-4">We collect and process the following types of information:</p>
            <ul className="space-y-3 text-black/70">
              <li>Personal identification (name, email, phone number)</li>
              <li>Professional information (bar number, practice areas)</li>
              <li>Usage data and analytics</li>
              <li>Communication preferences and history</li>
              <li>Payment information (processed securely through our payment providers)</li>
            </ul>
          </PrivacySection>

          <PrivacySection icon={Database} title="How We Use Your Data">
            <p className="text-black/80 mb-4">Your information helps us provide and improve our services:</p>
            <ul className="space-y-3 text-black/70">
              <li>Personalizing your AI legal assistant experience</li>
              <li>Improving our machine learning models and services</li>
              <li>Sending relevant updates and communications</li>
              <li>Ensuring platform security and preventing fraud</li>
              <li>Complying with legal and regulatory requirements</li>
            </ul>
          </PrivacySection>

          <PrivacySection icon={Lock} title="Data Security">
            <p className="text-black/80 mb-4">We implement robust security measures to protect your data:</p>
            <ul className="space-y-3 text-black/70">
              <li>End-to-end encryption for sensitive data</li>
              <li>Regular security audits and penetration testing</li>
              <li>Strict access controls and authentication</li>
              <li>Compliance with industry security standards</li>
              <li>Regular backups and disaster recovery protocols</li>
            </ul>
          </PrivacySection>

          <div className="bg-black/5 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-medium mb-4">Questions About Privacy?</h3>
            <p className="text-black/60 mb-6">
              We're here to help with any privacy-related concerns. Contact our dedicated privacy team at:
            </p>
            <a href="mailto:privacy@lexify.ai" className="text-black hover:text-black/80 font-medium">
              privacy@lexify.ai
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Privacy;