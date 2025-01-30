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
            key={consulting.id} 
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
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translatedMessages, setTranslatedMessages] = useState({});
  const { user } = useAuth0();
  const { deductCredits } = useCredits();
  const chatContainerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [localConsultingId, setLocalConsultingId] = useState(null);
  const { startListening, stopListening, isListening } = useSpeechRecognition(selectedLanguage);

  // Add translation effect
  useEffect(() => {
    const translateMessages = async () => {
      if (selectedLanguage === 'en' || messages.length === 0) {
        setTranslatedMessages({});
        return;
      }

      const newTranslations = {};
      for (const message of messages) {
        try {
          const translatedPrompt = await translateText(message.prompt, selectedLanguage);
          newTranslations[message.prompt] = translatedPrompt;

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

  // Update handleSubmit with better error handling and translation
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading || !localConsultingId) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    try {
      // Check credits first
      const result = await deductCredits('chat_consulting');
      if (!result.success) {
        toast.error(result.message || "Not enough credits");
        return;
      }

      // Translate input if needed
      let processedInput = userMessage;
      if (selectedLanguage !== 'en') {
        try {
          processedInput = await translateText(userMessage, 'en', selectedLanguage);
        } catch (error) {
          console.error('Translation error:', error);
          toast.error('Translation failed, using original text');
        }
      }

      // Add user message immediately
      setMessages(prev => [...prev, { prompt: userMessage, response: null }]);

      // Make API call
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/consultancy/ask`, {
        auth_id: user?.sub,
        consulting_id: localConsultingId,
        prompt: processedInput
      });

      if (response.data && response.data.response) {
        setMessages(prev => prev.map(msg => 
          msg.prompt === userMessage && !msg.response
            ? { prompt: msg.prompt, response: response.data.response }
            : msg
        ));
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('Error in consulting:', error);
      toast.error(error.response?.data?.message || 'Failed to process your message');
      // Remove the pending message
      setMessages(prev => prev.filter(msg => msg.prompt !== userMessage));
    } finally {
      setLoading(false);
    }
  };

  // Add scroll effect
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      const container = chatContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Close handler
  const handleClose = useCallback(() => {
    if (messages.length > 0) {
      window.dispatchEvent(new CustomEvent('refreshConsultingHistory'));
    }
    stopListening();
    onClose();
  }, [messages.length, onClose, stopListening]);

  // Initialize consulting session
  useEffect(() => {
    const initializeSession = async () => {
      if (!user?.sub) return;
      
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/consultancy/start/consulting`, {
          auth_id: user.sub
        });
        
        setLocalConsultingId(response.data.consulting_id);
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing consulting:', error);
        toast.error('Failed to start consulting session');
        handleClose();
      }
    };

    if (isOpen) {
      initializeSession();
    }
  }, [isOpen, user?.sub]);

  // Add voice input handler
  const handleVoiceInput = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript) => {
        setInput(prev => {
          const prefix = prev.trim() ? prev.trim() + ' ' : '';
          return prefix + transcript.trim();
        });
      });
    }
  }, [isListening, startListening, stopListening]);

  // Add keyboard handler
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Loading state
  if (!isReady) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <p className="mt-4 text-gray-600">Initializing consultation...</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-lg font-semibold">Legal Consultation</DialogTitle>
          <div className="flex items-center justify-end gap-4">
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
            />
          </div>
        </DialogHeader>

        {/* Chat Messages */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto py-4 space-y-4"
        >
          {messages.map((message, index) => (
            <div key={index} className="space-y-4">
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
                    {selectedLanguage !== 'en' && translatedMessages[message.prompt] && (
                      <div className="mt-2 pt-2 border-t border-gray-200 text-gray-600">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {translatedMessages[message.prompt]}
                        </ReactMarkdown>
                      </div>
                    )}
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
                      {selectedLanguage !== 'en' && translatedMessages[message.response] && (
                        <div className="mt-2 pt-2 border-t border-gray-200 text-gray-600">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {translatedMessages[message.response]}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="border-t pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="w-full px-4 py-3 pr-12 rounded-xl border border-black/10 bg-white
                         placeholder:text-gray-400 text-black focus:outline-none focus:border-black/20
                         resize-none text-base"
                rows="3"
              />
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
            </div>
            <button
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
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>
        </div>
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

// Update the main Consulting component
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
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold text-black mb-3">Legal Consultation</h1>
          <p className="text-gray-500 text-lg mb-8">
            Get instant legal advice from our AI-powered consultant
          </p>
          <StartConsultingButton />
        </div>

        {/* Tips Section */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          <div className="bg-white border border-black/5 rounded-xl p-4">
            <h3 className="text-base font-semibold text-black mb-3">How It Works</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>• Start a new consultation</li>
              <li>• Describe your legal situation</li>
              <li>• Get AI-powered legal guidance</li>
            </ul>
          </div>
          <div className="bg-white border border-black/5 rounded-xl p-4">
            <h3 className="text-base font-semibold text-black mb-3">Tips for Better Results</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>• Be specific about your case</li>
              <li>• Include relevant details</li>
              <li>• Ask clear questions</li>
            </ul>
          </div>
          <div className="bg-white border border-black/5 rounded-xl p-4">
            <h3 className="text-base font-semibold text-black mb-3">Important Note</h3>
            <p className="text-sm text-gray-500">
              This AI consultant provides general legal information. For specific legal advice, please consult with a qualified attorney.
            </p>
          </div>
        </div>

        {/* Consultation History */}
        <ConsultingHistory />
      </div>
    </motion.div>
  );
};

export default Consulting;