import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth0 } from '@auth0/auth0-react';
import { api } from '../services/api';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, AlertCircle, Award, MessageCircle, Mic } from 'lucide-react';
import { formatMarkdownResponse } from '../utils/formatMarkdown.jsx';
import { useSpeechRecognition } from '../utils/useVoice';
import VoiceButton from './VoiceButton';
import { Gavel } from 'lucide-react';


const HAIChatInterface = () => {
  const case_id = useParams()
  const caseId = case_id.case_id
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  const [isCourtSpeaking, setIsCourtSpeaking] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth0();
  const { startListening, stopListening, isListening } = useSpeechRecognition();

  const { sendMessage, lastMessage, connectionStatus } = useWebSocket(
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
        const response = await api.startHAISimulation(caseId);
        setGameState(response);
      } catch (e) {
        console.error("Error starting simulation:", e);
        setError("Failed to start simulation");
      }
    };

    startSimulation();
  }, [caseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    sendMessage(JSON.stringify({
      type: 'human_input',
      content: input //this is what the user types in the input box
    }));
    
    setInput('');
    setIsCourtSpeaking(true);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatMessage = (content) => {
    return content.match(/\d+\./) ? formatMarkdownResponse(content) : <p>{content}</p>;
  };

  const renderMessage = (msg, idx) => (
    <motion.div
      key={idx}
      initial={{ x: msg.speaker === 'human' ? 20 : -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 50 }}
      className={`mb-4 ${
        msg.speaker === 'human' ? 'ml-auto' : 'mr-auto'
      } max-w-[80%]`}
    >
      <div className={`rounded-xl p-4 ${
        msg.speaker === 'human' 
          ? 'bg-blue-50 text-blue-800 ml-auto' 
          : msg.speaker === 'judge' 
          ? msg.isComment
            ? 'bg-purple-50/80 text-purple-800 border-l-4 border-purple-300'
            : 'bg-purple-50 text-purple-800'
          : 'bg-green-50 text-green-800'
      }`}>
        <div className="font-medium text-sm mb-1 flex justify-between items-center">
          <span>
            {msg.speaker === 'ai' ? 'AI Lawyer' : 
             msg.speaker === 'human' ? 'You' : 
             msg.isComment ? 'Judge\'s Comment' : 'Judge'}
          </span>
          {(msg.speaker === 'judge' || msg.speaker === 'ai') && (
            <VoiceButton text={msg.content} />
          )}
        </div>
        <div className="text-gray-700">
          {formatMessage(msg.content)}
        </div>
        {msg.context && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            className="mt-2 text-sm text-gray-600 border-t border-gray-200 pt-2"
          >
            <strong>Supporting Context:</strong>
            <p>{msg.context}</p>
          </motion.div>
        )}
        {msg.score !== undefined && (
          <div className="mt-2 text-sm text-gray-600">
            Score Impact: {msg.score > 0 ? '+' : ''}{msg.score.toFixed(2)}
          </div>
        )}
      </div>
    </motion.div>
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
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4">
          <div className="space-y-6 py-4">
            <AnimatePresence>
              {messages.map((msg, idx) => (
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
                        <VoiceButton text={msg.content} />
                      )}
                    </div>
                    <div className={`text-base ${msg.speaker === 'human' ? 'text-white' : 'text-gray-800'}`}>
                      {formatMessage(msg.content)}
                    </div>
                    {msg.context && (
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        className="mt-3 pt-3 border-t border-gray-200/20"
                      >
                        <p className="font-medium mb-1 text-sm">Supporting Context</p>
                        <p className={`text-sm ${msg.speaker === 'human' ? 'text-gray-300' : 'text-gray-600'}`}>
                          {msg.context}
                        </p>
                      </motion.div>
                    )}
                    {msg.score !== undefined && (
                      <div className={`mt-2 text-xs ${msg.speaker === 'human' ? 'text-gray-300' : 'text-gray-500'}`}>
                        Score Impact: {msg.score > 0 ? '+' : ''}{msg.score.toFixed(2)}
                      </div>
                    )}
                  </div>
                </motion.div>
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
                  {gameState?.next_turn === 'ai' ? 
                    'AI Lawyer is preparing response...' : 
                    'The Judge is speaking...'}
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
      {gameState?.case_status === 'closed' && (
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
      )}
    </motion.div>
  );
};

export default HAIChatInterface;
