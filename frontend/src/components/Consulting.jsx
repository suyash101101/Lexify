import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, MessageSquare, Mic, X, Maximize2, Minimize2, Coins, AlertTriangle } from 'lucide-react';
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
import { useNavigate, useBeforeUnload } from 'react-router-dom';

// Separate component for the chat interface to reuse in both places
const ChatInterface = ({ isWidget = false }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translatedMessages, setTranslatedMessages] = useState({}); // Store translations for each message
  const [consultingId, setConsultingId] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth0();
  const { deductCredits, CREDIT_COSTS } = useCredits();
  const { startListening, stopListening, isListening } = useSpeechRecognition(selectedLanguage);
  const [isInitializing, setIsInitializing] = useState(true);

  // Modified translation effect to handle the new message format
  useEffect(() => {
    const translateMessages = async () => {
      if (selectedLanguage === 'en' || messages.length === 0) {
        setTranslatedMessages({});
        return;
      }

      const newTranslations = {};
      for (const message of messages) {
        try {
          // Translate prompt
          const translatedPrompt = await translateText(message.prompt, selectedLanguage);
          newTranslations[message.prompt] = translatedPrompt;

          // Translate response if it exists
          if (message.response) {
            const translatedResponse = await translateText(message.response, selectedLanguage);
            newTranslations[message.response] = translatedResponse;
          }
        } catch (error) {
          console.error('Translation error:', error);
        }
      }
      setTranslatedMessages(newTranslations);
    };

    translateMessages();
  }, [selectedLanguage, messages]);

  // Modified initialization effect
  useEffect(() => {
    const initializeConsulting = async () => {
      if (!user?.sub) return;
      
      setIsInitializing(true);
      try {
        console.log("Starting new consulting session...");
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/consultancy/start/consulting`, {
          auth_id: user.sub
        });
        
        const newConsultingId = response.data.consulting_id;
        console.log("Consulting session initialized with ID:", newConsultingId);
        
        setConsultingId(newConsultingId);
        setSessionActive(true);
        setIsInitializing(false);
      } catch (error) {
        console.error('Error initializing consulting:', error);
        toast.error('Failed to start consulting session');
        setIsInitializing(false);
      }
    };

    initializeConsulting();

    return () => {
      if (sessionActive) {
        console.log("Ending consulting session:", consultingId);
        toast.warning('Consulting session ended. You will need to start a new session to continue.');
        setSessionActive(false);
      }
    };
  }, [user?.sub]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Warning when leaving page
  useBeforeUnload(
    useCallback((event) => {
      if (sessionActive) {
        event.preventDefault();
        return (event.returnValue = 'Are you sure you want to leave? The consulting session will end.');
      }
    }, [sessionActive])
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Modified submit handler to match the message format
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !consultingId || !sessionActive) {
      console.log("Submit blocked:", {
        hasInput: !!input.trim(),
        hasConsultingId: !!consultingId,
        isSessionActive: sessionActive
      });
      return;
    }
    
    const userMessage = input;
    setInput('');
    setLoading(true);
    
    try {
      console.log("Sending message to consulting session:", consultingId);
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

      // Add user message to UI immediately
      const newMessage = {
        prompt: userMessage,
        response: null
      };
      setMessages(prev => [...prev, newMessage]);
      scrollToBottom();

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/consultancy/ask`, {
        auth_id: user?.sub,
        consulting_id: consultingId,
        prompt: processedInput
      });

      console.log("Received response:", response.data);
      
      // Update the message with the response
      setMessages(prev => prev.map(msg => 
        msg.prompt === userMessage && !msg.response
          ? { prompt: msg.prompt, response: response.data.response }
          : msg
      ));
      
      scrollToBottom();
    } catch (error) {
      console.error('Error in consulting session:', consultingId, error);
      toast.error('Failed to process your message');
      // Remove the pending message
      setMessages(prev => prev.filter(msg => msg.response !== null));
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

  // Modified MessageList component to handle the messages array format
  const MessageList = () => (
    <div className="space-y-4 mb-4 overflow-y-auto max-h-[60vh]">
      {messages.map((message, index) => (
        <div key={index} className="space-y-4">
          {/* User Message (Prompt) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/5 ml-auto max-w-[80%] p-4 rounded-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">You</span>
            </div>
            <div className="prose prose-sm max-w-none text-gray-800">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedLanguage === 'en' ? message.prompt : translatedMessages[message.prompt] || message.prompt}
              </ReactMarkdown>
            </div>
          </motion.div>

          {/* AI Response */}
          {message.response && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-black/5 max-w-[80%] p-4 rounded-xl"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">AI Assistant</span>
                <VoiceButton 
                  text={selectedLanguage === 'en' ? message.response : translatedMessages[message.response]}
                  language={selectedLanguage}
                />
              </div>
              <div className="prose prose-sm max-w-none text-gray-800">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedLanguage === 'en' ? message.response : translatedMessages[message.response] || message.response}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );

  // Loading state while initializing
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Initializing consulting session...</span>
      </div>
    );
  }

  // Session warning
  if (!sessionActive || !consultingId) {
    return (
      <div className="text-center py-8 bg-yellow-50 rounded-xl">
        <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
        <p className="text-yellow-700">
          {!consultingId 
            ? "Failed to initialize consulting session. Please refresh the page to try again."
            : "Consulting session has ended. Please refresh the page to start a new session."}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isWidget ? 'h-full flex flex-col' : ''}`}>
      {/* Language Selector */}
      <div className="flex justify-end mb-4">
        <LanguageSelector
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
        />
      </div>

      {/* Messages Section */}
      <div className="flex-1 overflow-auto">
        <MessageList />
      </div>

      {/* Input Section */}
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
        console.log("Fetched consulting history:", response.data);
        setConsultings(response.data);
      } catch (error) {
        console.error('Error fetching consulting history:', error);
        toast.error('Failed to load consulting history');
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
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-black mb-4">Consulting History</h2>
      <div className="space-y-4">
        {consultings.length > 0 ? (
          consultings.map((consulting) => (
            <div
              key={consulting.consulting_id}
              className="bg-white border border-black/5 rounded-xl p-4 hover:border-black/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Show the first message's prompt as title if available */}
                  <h3 className="font-medium text-black line-clamp-1">
                    {consulting.messages?.[0]?.prompt || "New Consultation"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-500">ID: {consulting.consulting_id}</p>
                    <span className="text-gray-300">•</span>
                    <p className="text-sm text-gray-500">Messages: {consulting.messages?.length || 0}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleExpand(consulting.consulting_id)}
                  className="shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="View Chat"
                >
                  {expandedId === consulting.consulting_id ? (
                    <Minimize2 className="w-5 h-5" />
                  ) : (
                    <Maximize2 className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Expanded chat history */}
              {expandedId === consulting.consulting_id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="space-y-4">
                    {consulting.messages?.map((message, index) => (
                      <div key={index} className="space-y-4">
                        {/* User Message */}
                        <div className="bg-black/5 ml-auto max-w-[80%] p-4 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">You</span>
                          </div>
                          <div className="prose prose-sm max-w-none text-gray-800">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.prompt}
                            </ReactMarkdown>
                          </div>
                        </div>

                        {/* AI Response */}
                        {message.response && (
                          <div className="bg-white border border-black/5 max-w-[80%] p-4 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-500">AI Assistant</span>
                            </div>
                            <div className="prose prose-sm max-w-none text-gray-800">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.response}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
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