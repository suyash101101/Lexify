import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, MessageSquare, Mic, X, Maximize2, Minimize2, Coins, AlertTriangle, Copy, Check } from 'lucide-react';
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
import { CREDIT_COSTS } from '../constants/credits';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { initializeConsultation, sendConsultQuery, getConsultStatus, getUserConsultings, getConsulting } from '../services/consulting';

// Add this new component for the copy button
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-black/5 rounded-lg transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4 text-gray-400" />
      )}
    </button>
  );
};

// Add this new component for the initial chat modal
const InitialChatModal = ({ isOpen, onClose, onSubmit }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(prompt);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Start Your Legal Consultation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What legal matter would you like to discuss?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white
                       placeholder:text-gray-400 text-black focus:outline-none focus:border-black/20 focus:ring-0
                       resize-none text-base"
              rows="4"
              placeholder="Describe your legal situation or ask a specific question..."
              required
            />
          </div>
          <button
            type="submit"
            className="w-full h-11 bg-black text-white rounded-xl flex items-center justify-center gap-2
                     hover:opacity-90 transition-opacity"
          >
            <Send className="w-4 h-4" />
            <span>Start Consultation</span>
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Separate component for the chat interface to reuse in both places
const ChatInterface = ({ isWidget = false, isModal = false, onClose }) => {
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
  const [showInitialModal, setShowInitialModal] = useState(true);
  const chatContainerRef = useRef(null);
  const isFirstRender = useRef(true);
  const [sessionId, setSessionId] = useState(null);
  const [needsContext, setNeedsContext] = useState(false);
  const [contextRequirements, setContextRequirements] = useState([]);
  const [contextAnswers, setContextAnswers] = useState([]);
  const [currentContextIndex, setCurrentContextIndex] = useState(0);
  const [currentQuery, setCurrentQuery] = useState('');

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

  // Optimize initialization
  useEffect(() => {
    const initializeConsulting = async () => {
      if (!user?.sub || !isFirstRender.current) return;
      
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/consultancy/start/consulting`, {
          auth_id: user.sub
        });
        
        setConsultingId(response.data.consulting_id);
        setSessionActive(true);
        isFirstRender.current = false;
      } catch (error) {
        console.error('Error initializing consulting:', error);
        toast.error('Failed to start consulting session');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeConsulting();
  }, [user?.sub]);

  // Improved scroll behavior
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      const container = chatContainerRef.current;
      const scrollOptions = {
        top: container.scrollHeight,
        behavior: messages.length === 1 ? 'auto' : 'smooth'
      };
      container.scrollTo(scrollOptions);
    }
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

  const handleVoiceInput = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript) => {
        setInput(prev => {
          // If there's existing input, add a space
          const prefix = prev.trim() ? prev.trim() + ' ' : '';
          return prefix + transcript.trim();
        });
      });
    }
  }, [isListening, startListening, stopListening]);

  // Modified MessageList component to handle the messages array format
  const MessageList = () => (
    <div 
      ref={chatContainerRef}
      className="space-y-4 mb-4 overflow-y-auto max-h-[60vh] scroll-smooth"
    >
      {messages.map((message, index) => (
        <motion.div
          key={`${index}-${message.prompt}`}
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* User Message */}
          <div className="bg-black/5 ml-auto max-w-[80%] p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">You</span>
              <CopyButton text={message.prompt} />
            </div>
            <div className="prose prose-sm max-w-none text-gray-800">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.prompt}
              </ReactMarkdown>
              {selectedLanguage !== 'en' && translatedMessages[message.prompt] && (
                <div className="mt-2 pt-2 border-t border-gray-200 text-gray-600">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {translatedMessages[message.prompt]}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>

          {/* AI Response */}
          {message.response && (
            <div className="bg-white border border-black/5 max-w-[80%] p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">AI Assistant</span>
                <div className="flex items-center gap-2">
                  <CopyButton text={message.response} />
                  <VoiceButton 
                    text={message.response}
                    language="en"
                  />
                </div>
              </div>
              <div className="prose prose-sm max-w-none text-gray-800">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.response}
                </ReactMarkdown>
                {selectedLanguage !== 'en' && translatedMessages[message.response] && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-gray-600">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {translatedMessages[message.response]}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );

  // Handle initial prompt
  const handleInitialPrompt = async (prompt) => {
    setInput(prompt);
    await handleSubmit({ preventDefault: () => {} });
  };

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

  // If in modal mode, show a different layout
  if (isModal) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
          />
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

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your legal situation or ask a specific question..."
          className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white
                   placeholder:text-gray-400 text-black focus:outline-none focus:border-black/20 focus:ring-0
                   resize-none text-base"
          rows="4"
          required
        />

        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={handleSubmit}
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
              <span>Start Consultation ({CREDIT_COSTS.chat_consulting} Credits)</span>
              <Coins className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isWidget ? 'h-full flex flex-col' : ''}`}>
      <InitialChatModal 
        isOpen={showInitialModal && messages.length === 0}
        onClose={() => setShowInitialModal(false)}
        onSubmit={handleInitialPrompt}
      />
      
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
  isWidget: PropTypes.bool,
  isModal: PropTypes.bool,
  onClose: PropTypes.func
};

ChatInterface.defaultProps = {
  isWidget: false,
  isModal: false,
  onClose: () => {}
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

// Create a separate ConsultingItem component
const ConsultingItem = ({ consulting }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const firstMessage = consulting.messages[0];

  if (!firstMessage) return null;

  return (
    <div className="bg-white border border-black/5 rounded-xl overflow-hidden">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-gray-400" />
          <div>
            <p className="font-medium text-sm text-gray-900">
              {firstMessage.prompt.length > 60 
                ? `${firstMessage.prompt.slice(0, 60)}...` 
                : firstMessage.prompt}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {consulting.messages.length} message{consulting.messages.length !== 1 ? 's' : ''}
          </span>
          {isExpanded ? (
            <Minimize2 className="w-4 h-4 text-gray-400" />
          ) : (
            <Maximize2 className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            key={`content-${consulting.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-black/5"
          >
            <div className="p-4 space-y-4">
              {consulting.messages.map((message, idx) => (
                <div key={`${consulting.id}-message-${idx}`} className="space-y-4">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-black/5 max-w-[80%] p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">You</span>
                        <CopyButton text={message.prompt} />
                      </div>
                      <div className="prose prose-sm max-w-none text-gray-800">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.prompt}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>

                  {/* AI Response */}
                  {message.response && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-black/5 max-w-[80%] p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-500">AI Assistant</span>
                          <div className="flex items-center gap-2">
                            <CopyButton text={message.response} />
                            <VoiceButton text={message.response} language="en" />
                          </div>
                        </div>
                        <div className="prose prose-sm max-w-none text-gray-800">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.response}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Update the ConsultingHistory component
const ConsultingHistory = () => {
  const [consultings, setConsultings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth0();
  const historyRef = useRef(null);

  const fetchConsultings = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/consultancy/user_consultings/${user?.sub}`);
      const validConsultings = response.data.filter(consulting => 
        consulting.messages && consulting.messages.length > 0
      );
      setConsultings(validConsultings);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching consulting history:', error);
      setIsLoading(false);
    }
  }, [user?.sub]);

  useEffect(() => {
    fetchConsultings();
  }, [fetchConsultings]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchConsultings();
    };

    window.addEventListener('refreshConsultingHistory', handleRefresh);
    return () => window.removeEventListener('refreshConsultingHistory', handleRefresh);
  }, [fetchConsultings]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (consultings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No consultation history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" ref={historyRef}>
      <h2 className="text-xl font-semibold mb-4">Consultation History</h2>
      <div className="space-y-4">
        {consultings.map(consulting => (
          <ConsultingItem 
            key={consulting.session_id} 
            consulting={consulting} 
          />
        ))}
      </div>
    </div>
  );
};

// Add this hook at the top level to initialize consulting session
const useConsultingInitialization = () => {
  const { user } = useAuth0();
  const [consultingId, setConsultingId] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeConsulting = async () => {
      if (!user?.sub) return;
      
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/consultancy/start/consulting`, {
          auth_id: user.sub
        });
        
        setConsultingId(response.data.consulting_id);
        setIsInitializing(false);
      } catch (error) {
        console.error('Error initializing consulting:', error);
        setError('Failed to initialize consulting session');
        setIsInitializing(false);
      }
    };

    initializeConsulting();
  }, [user?.sub]);

  return { consultingId, isInitializing, error };
};

// Update the ChatModal component to be a full chat interface
const ChatModal = ({ isOpen, onClose }) => {
  const [sessionId, setSessionId] = useState(null);
  const [needsContext, setNeedsContext] = useState(false);
  const [contextRequirements, setContextRequirements] = useState([]);
  const [contextAnswers, setContextAnswers] = useState([]);
  const [currentContextIndex, setCurrentContextIndex] = useState(0);
  const [currentQuery, setCurrentQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const { user } = useAuth0();
  const [userConsultings, setUserConsultings] = useState([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setNeedsContext(false);
      setContextRequirements([]);
      setContextAnswers([]);
      setCurrentContextIndex(0);
      setCurrentQuery('');
      setInput('');
      
      const initialize = async () => {
        try {
          console.log("Initializing consultation");
          console.log("User ID:", user?.sub);
          const sid = await initializeConsultation(user?.sub);  // Pass auth_id
          console.log("Session ID:", sid);
          setSessionId(sid);
        } catch (error) {
          console.error('Failed to initialize consultation:', error);
          toast.error('Failed to initialize consultation');
        }
      };
      initialize();
    }
  }, [isOpen, user?.sub]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessageToChat = (role, content) => {
    console.log(`Adding ${role} message:`, content);
    setMessages(prev => [...prev, { role, content }]);
  };

  const renderMessage = (content) => {
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            // Customize markdown components if needed
            p: ({ children }) => <p className="mb-2">{children}</p>,
            ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
            li: ({ children }) => <li className="mb-1">{children}</li>,
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {children}
              </a>
            ),
            code: ({ inline, children }) => (
              inline ? 
                <code className="bg-gray-100 px-1 rounded">{children}</code> :
                <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
                  <code>{children}</code>
                </pre>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || isLoading) return;

    const message = input.trim();
    setInput('');
    
    try {
      setIsLoading(true);
      
      if (!needsContext) {
        setCurrentQuery(message);
        // Add user message once
        addMessageToChat('user', message);

        const response = await sendConsultQuery(sessionId, message, null, user?.sub);
        console.log('Initial response:', response);

        if (response.needs_context) {
          setNeedsContext(true);
          setContextRequirements(response.context_requirements);
          setContextAnswers([]);
          setCurrentContextIndex(0);

          // Add only the response and first question
          addMessageToChat('assistant', response.response);
          if (response.context_requirements.length > 0) {
            addMessageToChat('assistant', response.context_requirements[0].question);
          }
        } else {
          // Add only the response
          addMessageToChat('assistant', response.response);
        }
      } else {
        // Add user's context answer once
        addMessageToChat('user', message);
        
        const newContextAnswers = [...contextAnswers];
        newContextAnswers[currentContextIndex] = message;
        setContextAnswers(newContextAnswers);

        if (currentContextIndex < contextRequirements.length - 1) {
          setCurrentContextIndex(currentContextIndex + 1);
          // Add only the next question
          addMessageToChat('assistant', contextRequirements[currentContextIndex + 1].question);
        } else {
          const finalResponse = await sendConsultQuery(
            sessionId,
            currentQuery,
            newContextAnswers,
            user?.sub
          );
          console.log('Final response with context:', finalResponse);

          if (finalResponse.needs_context) {
            setContextRequirements(finalResponse.context_requirements);
            setContextAnswers([]);
            setCurrentContextIndex(0);
            // Add only the response and first new question
            addMessageToChat('assistant', finalResponse.response);
            if (finalResponse.context_requirements.length > 0) {
              addMessageToChat('assistant', finalResponse.context_requirements[0].question);
            }
          } else {
            // Reset context state
            setNeedsContext(false);
            setContextRequirements([]);
            setContextAnswers([]);
            setCurrentContextIndex(0);
            setCurrentQuery('');
            // Add only the final response
            addMessageToChat('assistant', finalResponse.response);
          }
        }
      }
    } catch (error) {
      console.error('Error in consultation:', error);
      toast.error('Error processing your request');
      addMessageToChat('assistant', 'Sorry, there was an error processing your request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Legal Consultation</DialogTitle>
        </DialogHeader>

        {/* Messages Area with ReactMarkdown */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`${
                msg.role === 'user' ? 'ml-auto bg-black/5' : 'mr-auto bg-white border border-black/5'
              } max-w-[80%] p-4 rounded-xl`}
            >
              {renderMessage(msg.content)}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                needsContext 
                  ? `Question ${currentContextIndex + 1}/${contextRequirements.length}: ${
                      contextRequirements[currentContextIndex]?.question || 'Loading...'
                    }`
                  : "Type your legal question..."
              }
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-1"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-black text-white rounded-lg disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Update StartConsultingButton to use the new ChatModal
const StartConsultingButton = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex justify-center">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowModal(true)}
        className="flex items-center justify-center gap-3 bg-black text-white px-8 py-4 rounded-xl font-medium hover:opacity-90 transition-opacity"
      >
        <MessageSquare className="w-5 h-5" />
        Start New Consultation
        <div className="flex items-center gap-1 text-sm bg-white/10 px-2 py-1 rounded-lg">
          <Coins className="w-4 h-4" />
          {CREDIT_COSTS.chat_consulting}
        </div>
      </motion.button>

      <ChatModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};

// Update ConsultingHistoryModal component
const ConsultingHistoryModal = ({ isOpen, onClose, consulting }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl">Consultation History</DialogTitle>
          <div className="text-sm text-gray-500 space-y-1">
            <div><span className="font-medium">Session ID:</span> {consulting?.session_id}</div>
            <div><span className="font-medium">Created:</span> {new Date(consulting?.created_at).toLocaleString()}</div>
          </div>
        </DialogHeader>

        {/* Remove scrollIntoView and increase content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Context History with better styling */}
          {consulting?.context_history?.length > 0 && (
            <div className="mb-8 bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-lg mb-3">Context History</h3>
              <ul className="list-disc pl-5 space-y-2">
                {consulting.context_history.map((context, idx) => (
                  <li key={idx} className="text-gray-700">{context}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Conversations with better spacing and visual hierarchy */}
          <div className="space-y-10">
            {Object.entries(consulting?.conversations || {}).map(([queryId, conversation]) => (
              <div key={queryId} className="border rounded-xl shadow-sm bg-white overflow-hidden">
                {conversation.map((exchange, idx) => {
                  const questions = [];
                  if (exchange.response.includes('To better understand')) {
                    const lines = exchange.response.split('\n');
                    lines.forEach(line => {
                      if (line.startsWith('- ')) {
                        const [question, reasonPart] = line.split('(Reason:');
                        questions.push({
                          question: question.replace('- ', '').trim(),
                          reason: reasonPart ? reasonPart.replace(')', '').trim() : ''
                        });
                      }
                    });
                  }

                  return (
                    <div key={idx} className="divide-y">
                      {/* Query Section */}
                      <div className="p-5 bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="font-semibold text-gray-700">Query</div>
                          {questions.length > 0 && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                              Needs Context
                            </span>
                          )}
                        </div>
                        <div className="text-gray-800">{exchange.query}</div>
                      </div>

                      {/* Response Section */}
                      <div className="p-5">
                        <div className="font-semibold text-gray-700 mb-3">Response</div>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {exchange.response}
                          </ReactMarkdown>
                        </div>
                      </div>

                      {/* Questions Section with better visual hierarchy */}
                      {questions.length > 0 && (
                        <div className="p-5 bg-blue-50">
                          <div className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                            <span>Required Context</span>
                            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                              {questions.length} questions
                            </span>
                          </div>
                          <div className="space-y-4">
                            {questions.map((q, qIdx) => (
                              <div key={qIdx} className="pl-4 border-l-3 border-blue-300 bg-blue-50/50 p-3 rounded-r-lg">
                                <div className="font-medium text-blue-900">{q.question}</div>
                                {q.reason && (
                                  <div className="text-sm text-blue-700 mt-1 italic">
                                    {q.reason}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Context Used Section */}
                      {exchange.context?.length > 0 && (
                        <div className="p-5 bg-green-50">
                          <div className="font-semibold text-green-800 mb-3">Context Used</div>
                          <ul className="list-disc pl-5 space-y-2">
                            {exchange.context.map((ctx, ctxIdx) => (
                              <li key={ctxIdx} className="text-green-700">{ctx}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Add consulting history button to main component
const Consulting = () => {
  const [showChat, setShowChat] = useState(false);
  const [selectedConsulting, setSelectedConsulting] = useState(null);
  const [consultings, setConsultings] = useState([]);
  const { user } = useAuth0();

  // Fetch user's consultings
  useEffect(() => {
    const fetchConsultings = async () => {
      if (user?.sub) {
        try {
          console.log("Fetching consultings for user:", user.sub);
          const data = await getUserConsultings(user.sub);
          console.log("Fetched consultings:", data);
          setConsultings(data);
        } catch (error) {
          console.error('Error fetching consultings:', error);
          toast.error('Failed to load consultation history');
        }
      }
    };
    fetchConsultings();
  }, [user?.sub]);

  return (
    <div className="min-h-screen bg-white">
      {/* Top Section */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto p-4">
          <button
            onClick={() => setShowChat(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Start New Consultation
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-6">Consultation History</h2>
          
          {consultings.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Consultations Yet</h3>
              <p className="text-gray-500 mb-4">
                Start your first legal consultation to get expert guidance.
              </p>
              <button
                onClick={() => setShowChat(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Begin Consultation
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {consultings.map((consulting) => (
                <div
                  key={consulting.session_id}
                  className="border rounded-lg hover:shadow-md transition-shadow bg-white"
                >
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm text-gray-500">Session ID:</div>
                        <div className="font-mono text-sm truncate" title={consulting.session_id}>
                          {consulting.session_id}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Created:</div>
                        <div className="text-sm">
                          {new Date(consulting.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {/* Show first query/response preview */}
                    {Object.entries(consulting.conversations)[0] && (
                      <div>
                        <div className="text-sm font-medium mb-2">Latest Query:</div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {Object.entries(consulting.conversations)[0][1][0].query}
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => setSelectedConsulting(consulting)}
                        className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal 
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />

      {/* Detailed Consulting View Modal */}
      {selectedConsulting && (
        <ConsultingHistoryModal
          isOpen={!!selectedConsulting}
          onClose={() => setSelectedConsulting(null)}
          consulting={selectedConsulting}
        />
      )}
    </div>
  );
};

export default Consulting;