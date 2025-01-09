import React from 'react';
import { motion } from 'framer-motion';
import { Scale, Users, Sparkles, Shield } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-black/5 rounded-2xl p-6">
    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-lg font-medium text-black mb-2">{title}</h3>
    <p className="text-black/60">{description}</p>
  </div>
);

const About = () => {
  return (
    <div className="min-h-screen bg-accent-white px-4 py-16 mt-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold text-black mb-4">About Lexify</h1>
          <p className="text-black/60 text-lg max-w-2xl mx-auto">
            Transforming legal practice through innovative AI technology while maintaining the highest standards of professional excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <FeatureCard
            icon={Users}
            title="Our Mission"
            description="To empower legal professionals with cutting-edge AI tools that enhance their practice while maintaining the human touch in legal services."
          />
          <FeatureCard
            icon={Sparkles}
            title="Our Vision"
            description="To lead the transformation of legal practice by bridging the gap between traditional legal expertise and modern technology."
          />
          <FeatureCard
            icon={Shield}
            title="Our Values"
            description="Commitment to excellence, ethical practice, innovation, and unwavering dedication to protecting our clients' interests."
          />
        </div>

        <div className="bg-black text-white rounded-3xl p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">
              Join Us in Shaping the Future of Legal Practice
            </h2>
            <p className="text-white/60 mb-8">
              Experience the perfect blend of legal expertise and technological innovation. 
              Lexify is more than a platform; it's a movement towards smarter, more efficient legal practice.
            </p>
            <button onClick={() => window.open("https://lexifyai.in/login", "_blank")} className="bg-white text-black px-8 py-3 rounded-xl font-medium hover:bg-white/90 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default About; 