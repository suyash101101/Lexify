import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, MessageSquare, Mic, X, Maximize2, Minimize2, Coins } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSpeechRecognition } from '../utils/useVoice';
import VoiceButton from './VoiceButton';
import LanguageSelector from './LanguageSelector';
import { translateText } from './TranslationService';
import { useAuth0 } from '@auth0/auth0-react';
import PropTypes from 'prop-types';
import { useCredits } from '../context/CreditContext';
import { toast } from 'react-hot-toast';

// Separate component for the chat interface to reuse in both places
const ChatInterface = ({ isWidget = false }) => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translatedResponse, setTranslatedResponse] = useState('');
  const { user, isAuthenticated } = useAuth0();
  const { deductCredits, CREDIT_COSTS } = useCredits();
  const { startListening, stopListening, isListening } = useSpeechRecognition(selectedLanguage);

  // Effect to translate response when language changes
  useEffect(() => {
    const translateResponse = async () => {
      if (selectedLanguage === 'en' || !response) {
        setTranslatedResponse('');
        return;
      }

      try {
        const translated = await translateText(response, selectedLanguage);
        setTranslatedResponse(translated);
      } catch (error) {
        console.error('Translation error:', error);
      }
    };

    translateResponse();
  }, [selectedLanguage, response]);

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    if (!input.trim()) return;
    
    try {
      // If input is not in English, translate it first
      let processedInput = input;
      if (selectedLanguage !== 'en') {
        try {
          processedInput = await translateText(input, 'en', selectedLanguage);
        } catch (error) {
          console.error('Translation error:', error);
        }
      }

      const result = await deductCredits('chat_consulting');
      if (!result.success) {
        toast.error(result.message || "Not enough credits");
        return;
      }
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/consultancy/ask`, {
        auth_id: user?.sub,
        prompt: processedInput
      });

      setResponse(response.data.response);
      setInput('');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to process your message');
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

  const ResponseSection = ({ response, translatedResponse, selectedLanguage }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Response</h3>
          <VoiceButton 
            text={selectedLanguage === 'en' ? response : translatedResponse}
            language={selectedLanguage}
          />
        </div>
        <div className="prose prose-sm max-w-none text-gray-800">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {response}
          </ReactMarkdown>
          {selectedLanguage !== 'en' && translatedResponse && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {translatedResponse}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`space-y-6 ${isWidget ? 'h-full flex flex-col' : ''}`}>
      {/* Language Selector */}
      <div className="flex justify-end mb-4">
        <LanguageSelector
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
        />
      </div>

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

      {/* Response Section */}
      {response && (
        <ResponseSection 
          response={response}
          translatedResponse={translatedResponse}
          selectedLanguage={selectedLanguage}
        />
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

// Add ConsultingHistory component
const ConsultingHistory = () => {
  const { user } = useAuth0();
  const [consultings, setConsultings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null); // Track which consulting is expanded

  useEffect(() => {
    const fetchConsultings = async () => {
      if (!user?.sub) return;
      
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/consultancy/user_consultings/${user.sub}`);
        const sortedConsultings = response.data.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        setConsultings(sortedConsultings);
      } catch (error) {
        console.error('Error fetching consultings:', error);
        toast.error('Failed to fetch consultation history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsultings();
  }, [user?.sub]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="text-xl font-display font-semibold text-black mb-4">Consultation History</h2>
      <div className="grid gap-4">
        {consultings.map((consulting) => (
          <div
            key={consulting.consulting_id}
            className="bg-white border border-black/5 rounded-xl p-4 hover:border-black/10 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-medium text-black line-clamp-1">{consulting.prompt}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-500">ID: {consulting.consulting_id}</p>
                  <span className="text-gray-300">•</span>
                  <p className="text-sm text-gray-500">User: {consulting.lawyer1_address}</p>
                </div>
              </div>
              <button
                onClick={() => toggleExpand(consulting.consulting_id)}
                className="shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="View Chat"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
            
            {/* Expandable Response Section */}
            {expandedId === consulting.consulting_id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 border-t border-gray-100 pt-4"
              >
                <div className="bg-gray-50 rounded-lg p-3">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {consulting.response}
                  </ReactMarkdown>
                </div>
              </motion.div>
            )}
          </div>
        ))}
        
        {consultings.length === 0 && (
          <div className="text-center py-8 bg-white border border-black/5 rounded-xl">
            <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No consultation history found</p>
          </div>
        )}
      </div>
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
        <div id="chat-interface">
          <ChatInterface />
        </div>

        {/* Consultation History */}
        <ConsultingHistory />

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