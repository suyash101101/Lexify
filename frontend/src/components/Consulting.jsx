import { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, MessageSquare, Mic, X, Maximize2, Minimize2, Coins } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSpeechRecognition } from '../utils/useVoice';
import VoiceButton from './VoiceButton';
import { useAuth0 } from '@auth0/auth0-react';
import PropTypes from 'prop-types';
import { useCredits } from '../context/CreditContext';
import { toast } from 'react-hot-toast';

// Separate component for the chat interface to reuse in both places
const ChatInterface = ({ isWidget = false }) => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth0();
  const { deductCredits, CREDIT_COSTS } = useCredits();
  const { startListening, stopListening, isListening } = useSpeechRecognition();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    try {
      // Use credits for chat consulting
      const result = await deductCredits('chat_consulting');
      if (!result.success) {
        toast.error(result.message || "Not enough credits. Please purchase more credits to continue.");
        return;
      }

      // If credit deduction successful, proceed with sending message
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/consultancy/ask`, {
        prompt: input
      });
      console.log(response);

      setResponse(response.data);
      setInput('');
    } catch (error) {
      console.error('Error processing chat:', error);
      toast.error(error.response?.data?.detail || 'Failed to process your message. Please try again.');
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
    <div className={`space-y-6 ${isWidget ? 'h-full flex flex-col' : ''}`}>
      {/* Question Input Section */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          {!isWidget && (
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-black">
                Your Legal Question
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Voice Input</span>
                <motion.button
                  type="button"
                  onClick={handleVoiceInput}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                >
                  {isListening ? (
                    <Mic className="w-4 h-4 text-red-500 animate-pulse" />
                  ) : (
                    <Mic className="w-4 h-4 text-gray-400" />
                  )}
                </motion.button>
              </div>
            </div>
          )}
          <div className="relative bg-white rounded-xl shadow-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your legal situation or ask a specific question..."
              className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white
                       placeholder:text-gray-400 text-black focus:outline-none focus:border-black/20 focus:ring-0
                       resize-none text-base"
              rows={isWidget ? "3" : "4"}
              required
            />
            {isWidget && (
              <motion.button
                type="button"
                onClick={handleVoiceInput}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute right-3 top-3 p-2 rounded-lg hover:bg-black/5 transition-colors"
              >
                {isListening ? (
                  <Mic className="w-5 h-5 text-red-500 animate-pulse" />
                ) : (
                  <Mic className="w-5 h-5 text-gray-400" />
                )}
              </motion.button>
            )}
          </div>
          {!isWidget && (
            <p className="text-xs text-gray-500">
              Be specific and include relevant details for better assistance
            </p>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={loading || !input.trim()}
          className="w-full h-11 bg-black text-white rounded-xl flex items-center justify-center gap-2
                   disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Get Legal Advice ({CREDIT_COSTS.chat_consulting} Credits)</span>
              <Coins className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Response Section */}
      {response && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${isWidget ? 'flex-1 overflow-auto' : 'border-t border-black/5 pt-6'}`}
        >
          {/* Response Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-black/5 rounded-lg">
                <MessageSquare className="w-5 h-5 text-black" />
              </div>
              <h2 className="text-lg font-semibold text-black">Legal Opinion</h2>
            </div>
            {response && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Listen to Response</span>
                <VoiceButton text={typeof response === 'string' ? response : ''} />
              </div>
            )}
          </div>

          {/* Response Content */}
          <div className="bg-black/[0.02] rounded-xl p-6">
            <article className={`prose max-w-none ${
              isWidget ? 'prose-sm' : 'prose-lg'
            } prose-headings:font-display prose-headings:font-semibold
              prose-h1:text-2xl prose-h1:mb-4
              prose-h2:text-xl prose-h2:mb-3
              prose-h3:text-lg prose-h3:mb-2
              prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-4
              prose-ul:mb-4 prose-ul:list-disc prose-ul:pl-4
              prose-ol:mb-4 prose-ol:pl-4
              prose-li:mb-1 prose-li:text-gray-600
              prose-strong:font-semibold prose-strong:text-black
              prose-blockquote:border-l-4 prose-blockquote:border-black/10 
              prose-blockquote:pl-4 prose-blockquote:italic
              prose-code:bg-black/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-black/[0.03] prose-pre:p-4 prose-pre:rounded-lg
              prose-img:rounded-lg
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline`}
            >
              {typeof response === 'string' ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {response}
                </ReactMarkdown>
              ) : (
                JSON.stringify(response)
              )}
            </article>
          </div>
        </motion.div>
      )}
    </div>
  );
};

ChatInterface.propTypes = {
  isWidget: PropTypes.bool
};

ChatInterface.defaultProps = {
  isWidget: false
};

// Global widget component
export const GlobalConsultingWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 hidden md:block">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`bg-white rounded-2xl shadow-xl border border-black/5 overflow-hidden
              ${isExpanded ? 'fixed bottom-6 right-6 w-[800px] h-[80vh]' : 'w-[400px] h-[600px]'}`}
          >
            {/* Widget Header */}
            <div className="bg-black p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-medium">Legal Assistant</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isExpanded ? (
                    <Minimize2 className="w-4 h-4 text-white" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-white" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Widget Content */}
            <div className="p-4 h-[calc(100%-64px)] overflow-auto">
              <ChatInterface isWidget={true} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="bg-black text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <MessageSquare className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  );
};

// Main consulting page component
const Consulting = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-white"
    >
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-black mb-2">Legal Consultation</h1>
          <p className="text-gray-500">
            Get instant legal advice from our AI-powered consultant
          </p>
        </div>

        {/* Main Chat Interface */}
        <ChatInterface />

        {/* Tips Section */}
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          <div className="bg-white border border-black/5 rounded-xl p-4">
            <h3 className="text-base font-semibold text-black mb-3">Tips for Better Results</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>• Be specific about your legal situation</li>
              <li>• Include relevant dates and details</li>
              <li>• Ask one question at a time</li>
              <li>• Provide context when necessary</li>
            </ul>
          </div>
          <div className="bg-white border border-black/5 rounded-xl p-4">
            <h3 className="text-base font-semibold text-black mb-3">Important Note</h3>
            <p className="text-sm text-gray-500">
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