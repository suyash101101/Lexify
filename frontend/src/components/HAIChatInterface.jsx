import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth0 } from '@auth0/auth0-react';
import { api } from '../services/api';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, AlertCircle, Award, MessageCircle, Mic } from 'lucide-react';
import { useSpeechRecognition } from '../utils/useVoice';
import VoiceButton from './VoiceButton';
import { Gavel } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { useCredits } from '../context/CreditContext';
import { translateText } from './TranslationService';
import LanguageSelector from './LanguageSelector';

const HAIChatInterface = () => {
  const case_id = useParams();
  const caseId = case_id.case_id;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  const [isCourtSpeaking, setIsCourtSpeaking] = useState(false);
  const [hasStartedCase, setHasStartedCase] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth0();
  const { startListening, stopListening, isListening } = useSpeechRecognition();
  const endRef = useRef(null);
  const { deductCredits, CREDIT_COSTS } = useCredits();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translatedMessages, setTranslatedMessages] = useState({});

  const { sendMessage, lastMessage } = useWebSocket(
    `${import.meta.env.VITE_WS_URL}/ws/hai/${caseId}/${user?.sub}`
  );

  useEffect(() => {
    if (!user?.sub) {
      setError("User not authenticated");
      return;
    }
  }, [user]);

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage);
        
        if (data.type === "error") {
          setError(data.message);
          return;
        }
        
        if (data.type === "state_update" || data.type === "turn_update") {
          const state = data.data; //getting the whole turn response from hai.py
        //   TurnResponse(
        //     next_turn=self.current_turn,
        //     case_status="open",
        //     current_response=first_directive,
        //     human_score=0.0,
        //     ai_score=0.0
        //      last_response = last_response (basically only for handling the winner case)
        // )
        //this contains the first directive which is the lawyer context 
      //   LawyerContext(
      //     input=f"The {self.current_turn} lawyer will present first.",
      //     context="Please present your opening argument.",
      //     speaker="judge",
      //     score=0.0
      // )
          console.log("game state update: ",state)
          setGameState(state);

          if(state.case_status === 'closed' && state.last_response) {
            setMessages(prev => [...prev, {
              speaker: state.last_response.speaker,
              content: state.last_response.input,
              context: state.last_response.context,
              score: state.last_response.score
            }]);
          }
          
          if (state.current_response) {
            setMessages(prev => [...prev, {
              speaker: state.current_response.speaker,
              content: state.current_response.input,
              context: state.current_response.context,
              score: state.current_response.score
            }]);
          }

          if (state.judge_comment) {
            setMessages(prev => [...prev, {
              speaker: 'judge',
              content: state.judge_comment,
              isComment: true
            }]);
          }

          setIsCourtSpeaking(
            (state.next_turn === 'ai') || 
            (state.current_response.speaker === 'judge' && state.next_turn !== 'human')
          );
        }
      } catch (e) {
        console.error("Error processing message:", e);
        setError("Error processing message");
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    const startSimulation = async () => {
      try {
        if (!hasStartedCase) {
          // Use credits for starting courtroom session
          const success = await deductCredits('courtroom_session');
          if (!success) {
            toast.error("Not enough credits. Please purchase more credits to start a new case.");
            return;
          }

          const response = await api.startHAISimulation(caseId, user.sub);
          setGameState(response);
          setHasStartedCase(true);
        }
      } catch (e) {
        console.error("Error starting simulation:", e);
        toast.error("Failed to start simulation");
      }
    };

    if (user?.sub) {
      startSimulation();
    }
  }, [caseId, user, hasStartedCase, deductCredits]);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent form refresh
    if (!input.trim()) return;
    
    try {
      // Use credits for case response
      const result = await deductCredits('case_response');
      if (!result.success) {
        toast.error(result.message || "Not enough credits. Please purchase more credits to continue.");
        return;
      }

      // If credit deduction successful, proceed with sending message
      sendMessage(JSON.stringify({
        type: 'human_input',
        content: input
      }));
      
      setInput('');
      setIsCourtSpeaking(true);
    } catch (error) {
      console.error('Error processing response:', error);
      toast.error('Failed to process your response. Please try again.');
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(async (transcript) => {
        if (selectedLanguage !== 'en') {
          try {
            // Translate voice input to English
            const translatedInput = await translateText(transcript, 'en', selectedLanguage);
            setInput(translatedInput);
          } catch (error) {
            console.error('Translation error:', error);
            setInput(transcript);
          }
        } else {
          setInput(transcript);
        }
      });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(()=>{
    if(gameState?.case_status === 'closed'){
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  },[gameState?.case_status])

  const formatMarkdown = (content) => (
    <article className="prose prose-sm max-w-none
      prose-headings:font-semibold prose-headings:text-inherit
      prose-p:text-inherit prose-p:leading-relaxed
      prose-ul:my-2 prose-ul:list-disc prose-ul:pl-4
      prose-ol:my-2 prose-ol:pl-4
      prose-li:my-0.5
      prose-strong:font-semibold prose-strong:text-inherit
      prose-blockquote:border-l-4 prose-blockquote:border-current/20
      prose-blockquote:pl-4 prose-blockquote:italic"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </article>
  );

  // Add cleanup effect
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (isListening) {
        stopListening();
      }
    };
  }, [isListening]);

  // Update error handling to use toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null); // Clear the error after showing toast
    }
  }, [error]);

  useEffect(() => {
    const translateMessages = async () => {
      if (selectedLanguage === 'en') {
        setTranslatedMessages({});
        return;
      }

      const newTranslations = {};
      for (const msg of messages) {
        if (!msg.content) continue;
        try {
          const translated = await translateText(msg.content, selectedLanguage);
          newTranslations[msg.content] = translated;
        } catch (error) {
          console.error('Translation error:', error);
        }
      }
      setTranslatedMessages(newTranslations);
    };

    translateMessages();
  }, [messages, selectedLanguage]);

  const MessageBubble = ({ msg, idx }) => (
    <motion.div
      key={idx}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex ${msg.speaker === 'human' ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[85%] ${
        msg.speaker === 'human' 
          ? 'bg-black text-white' 
          : msg.speaker === 'judge' 
          ? msg.isComment
            ? 'bg-gray-50 border-l-2 border-gray-900'
            : 'bg-gray-50'
          : 'bg-gray-50'
      } rounded-xl p-4 shadow-sm`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {msg.speaker === 'ai' ? 'AI Lawyer' : 
             msg.speaker === 'human' ? 'You' : 
             msg.isComment ? 'Judge\'s Comment' : 'Judge'}
          </span>
          {(msg.speaker === 'judge' || msg.speaker === 'ai') && (
            <VoiceButton 
              text={selectedLanguage === 'en' ? msg.content : translatedMessages[msg.content]}
              language={selectedLanguage}
            />
          )}
        </div>
        <div className={`prose prose-sm max-w-none ${msg.speaker === 'human' ? 'text-white' : 'text-gray-800'}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {msg.content}
          </ReactMarkdown>
          {selectedLanguage !== 'en' && translatedMessages[msg.content] && (
            <div className="mt-2 pt-2 border-t border-gray-200/20">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {translatedMessages[msg.content]}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {msg.context && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            className="mt-3 pt-3 border-t border-gray-200/20"
          >
            <p className="font-medium mb-1 text-sm">Supporting Context</p>
            <div className={`text-sm ${msg.speaker === 'human' ? 'text-gray-300' : 'text-gray-600'}`}>
              {formatMarkdown(msg.context)}
            </div>
          </motion.div>
        )}
        {msg.score !== undefined && (
          <div className={`mt-2 text-xs ${msg.speaker === 'human' ? 'text-gray-300' : 'text-gray-500'}`}>
            Score Impact: {msg.score > 0 ? '+' : ''}{msg.score.toFixed(2)}
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-screen bg-white"
    >
      {error && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center shadow-sm"
        >
          <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
          <span className="text-red-600 text-sm font-medium">{error}</span>
        </motion.div>
      )}

      {/* Credit Status Bar */}
      {/* {user && userCredits !== null && (
        <div className="bg-black/5 px-4 py-2">
          <div className="max-w-3xl mx-auto flex justify-between items-center text-sm">
            <div className="space-x-4">
              <span className="font-medium">Available Credits: {userCredits}</span>
              <span className="text-black/60">Cost per case: 450 credits</span>
            </div>
            {userCredits < 450 && (
              <button 
                onClick={() => window.location.href = '/pricing'} 
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                <Coins className="w-4 h-4" />
                Buy More Credits
              </button>
            )}
          </div>
        </div>
      )} */}

      {/* Score Bar - Fixed at top */}
      <div className="sticky top-0 z-40 bg-white border-b border-black/5">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Gavel className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-black">HAI Court</h1>
                <p className="text-xs text-gray-500">Case #{caseId}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:ml-auto text-sm">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-gray-500 mr-2">You:</span>
                  <span className="font-medium">{gameState?.human_score?.toFixed(2) || '0.00'}</span>
                </div>
                <div>
                  <span className="text-gray-500 mr-2">AI:</span>
                  <span className="font-medium">{gameState?.ai_score?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
              <div className="px-2.5 py-1 bg-black/5 rounded-full text-xs font-medium">
                {gameState?.case_status || 'Loading...'}
              </div>
            </div>
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
            />
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4">
          <div className="space-y-6 py-4">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <MessageBubble msg={msg} idx={idx} />
              ))}
            </AnimatePresence>

            {isCourtSpeaking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center space-x-2 py-2"
              >
                <MessageCircle className="w-4 h-4 text-gray-400 animate-pulse" />
                <span className="text-sm text-gray-500">
                  {gameState?.case_status === 'closed' ? 'The case is closed' : 
                    gameState?.next_turn === 'ai' ? 
                      'AI Lawyer is preparing response...' : 
                      'The Judge is analyzing and speaking...'}
                </span>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Section */}
      {gameState?.case_status === 'open' && 
       gameState.next_turn === 'human' && 
       !isCourtSpeaking && (
        <motion.form 
          onSubmit={handleSubmit}
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="sticky bottom-0 bg-white border-t border-black/5"
        >
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Present your argument to the court..."
                className="w-full bg-white rounded-xl pl-4 pr-24 py-3 text-base text-black placeholder-gray-400 
                         border border-black/10 focus:outline-none focus:border-black/20 focus:ring-0
                         resize-none"
                rows="2"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-xs text-gray-500 mr-2">
                  {CREDIT_COSTS.case_response} credits
                </span>
                <motion.button
                  type="button"
                  onClick={handleVoiceInput}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {isListening ? (
                    <Mic className="w-5 h-5 text-red-500 animate-pulse" />
                  ) : (
                    <Mic className="w-5 h-5 text-gray-400" />
                  )}
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isCourtSpeaking || !input.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg bg-black text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.form>
      )}

      {/* Case Closed State */}
      {/* {gameState?.case_status === 'closed' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg">
            <Award className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-center mb-3">Case Closed</h3>
            <p className="text-lg text-center mb-2">Winner: {gameState.winner}</p>
            <p className="text-sm text-gray-500 text-center">
              Final Score Difference: {gameState.score_difference?.toFixed(2)}
            </p>
          </div>
        </motion.div>
      )} */}
      <div>
        {(gameState?.case_status === 'closed' || gameState?.case_status === 'Closed') && (
          <motion.div 
          initial={{ opacity: 0, y: 20 }}          animate={{ opacity: 1, y: 0 }}          className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg"          >            <Award className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-2xl font-bold mb-2 text-gray-800">Case Closed</h3>
            <p className="text-lg mb-2 text-gray-700">Winner: {gameState.winner}</p>
            <p className="text-sm text-gray-600 mb-4">
              Final Score Difference: {gameState.score_difference?.toFixed(2)}
            </p>
          </motion.div>
        )}
        <div ref={endRef}/>
        </div>
    </motion.div>
  );
};

export default HAIChatInterface;
