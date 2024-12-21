import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Send, Loader2, MessageSquare, Mic } from 'lucide-react';
import { formatMarkdownResponse } from '../utils/formatMarkdown.jsx'; // Update extension
import { useSpeechRecognition } from '../utils/useVoice';
import VoiceButton from './VoiceButton';

const Consulting = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { startListening, stopListening, isListening } = useSpeechRecognition();

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (isListening) {
        stopListening();
      }
    };
  }, [isListening]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await axios.post('http://localhost:8000/consultancy/ask', {
        prompt: input
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setResponse(result.data);
      setInput(''); // Clear input after successful response
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to get response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript) => {
        setInput(transcript);
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-28 px-4 pb-8"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Legal Consultation</h1>
          <p className="text-xl text-gray-600">
            Get instant legal advice from our AI-powered consultant
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Your Legal Question
              </label>
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your legal situation or ask a specific question..."
                  className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50"
                  rows="4"
                  required
                />
                <motion.button
                  type="button"
                  onClick={handleVoiceInput}
                  className="absolute right-4 top-4 p-2 rounded-lg bg-blue-100 hover:bg-blue-200"
                >
                  {isListening ? (
                    <Mic className="w-5 h-5 text-red-500 animate-pulse" />
                  ) : (
                    <Mic className="w-5 h-5 text-blue-600" />
                  )}
                </motion.button>
              </div>
              <p className="text-sm text-gray-500">
                Be specific and include relevant details for better assistance
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !input.trim()}
              className="w-full py-4 bg-blue-500 text-white rounded-xl flex items-center justify-center space-x-3 disabled:opacity-50 hover:bg-blue-600 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Get Legal Advice</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600"
            >
              {error}
            </motion.div>
          )}

          {/* Response Section */}
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t border-gray-100 pt-6 mt-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <MessageSquare className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-800">Legal Opinion</h2>
              </div>
              <div className="bg-blue-50 rounded-xl p-6 prose prose-blue max-w-none">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    {typeof response === 'string' 
                      ? formatMarkdownResponse(response)
                      : JSON.stringify(response)}
                  </div>
                  {response && <VoiceButton text={typeof response === 'string' ? response : ''} />}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Tips Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Tips for Better Results</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Be specific about your legal situation</li>
              <li>• Include relevant dates and details</li>
              <li>• Ask one question at a time</li>
              <li>• Provide context when necessary</li>
            </ul>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Important Note</h3>
            <p className="text-gray-600">
              This AI consultant provides general legal information and guidance. 
              For specific legal advice, please consult with a qualified attorney.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Consulting;