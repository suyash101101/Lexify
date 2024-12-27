import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight } from 'lucide-react';

const Blog = () => {
  return (
    <div className="min-h-screen bg-accent-white px-4 py-16 mt-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto text-center"
      >
        <div className="mb-12">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold text-black mb-4">Legal Insights Blog</h1>
          <p className="text-black/60 text-lg">Precedent-Setting Content Coming Soon</p>
        </div>

        <div className="max-w-2xl mx-auto bg-black/5 rounded-3xl p-8 backdrop-blur-xl">
          <p className="text-lg text-black/80 mb-6">
            Our team of legal experts is preparing thought-provoking articles, case studies, and legal insights that will help transform your practice.
          </p>
          
          <div className="space-y-4 text-left mb-8">
            <h3 className="font-medium text-black">Coming Soon:</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-black/60">
                <ArrowRight className="w-5 h-5" />
                Latest Legal Tech Trends
              </li>
              <li className="flex items-center gap-2 text-black/60">
                <ArrowRight className="w-5 h-5" />
                AI in Legal Practice
              </li>
              <li className="flex items-center gap-2 text-black/60">
                <ArrowRight className="w-5 h-5" />
                Case Law Analysis
              </li>
              <li className="flex items-center gap-2 text-black/60">
                <ArrowRight className="w-5 h-5" />
                Practice Management Tips
              </li>
            </ul>
          </div>

          <p className="text-sm text-black/40">
            (Coming Soon) Subscribe to our newsletter to be notified when we launch.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Blog; 