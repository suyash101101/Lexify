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
    `ws://localhost:8000/ws/hai/${caseId}/${user?.sub}`
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
          const state = data.data;
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    sendMessage(JSON.stringify({
      type: 'human_input',
      content: input
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
    <div key={idx} className={`message ${msg.speaker}`}>
      <div className="speaker-info">
        {msg.speaker === 'ai' ? 'AI Lawyer' : msg.speaker === 'human' ? 'You' : 'Judge'}
      </div>
      <div className="content">{msg.content}</div>
      {msg.context && (
        <div className="context">
          <strong>Supporting Context:</strong>
          <p>{msg.context}</p>
        </div>
      )}
      {msg.score !== undefined && (
        <div className="score">
          Argument Score: {msg.score.toFixed(2)}
        </div>
      )}
    </div>
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
      className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-white text-gray-800 p-4 pt-24" // Added pt-24 for navbar space
    >
      {error && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4 flex items-center"
        >
          <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
          {error}
        </motion.div>
      )}

      <motion.div 
        className="bg-white/70 backdrop-blur-sm rounded-xl p-4 mb-4 shadow-lg"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-600">Your Score</p>
            <p className="text-2xl font-bold text-blue-700">{gameState?.human_score?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-sm text-purple-600">Status</p>
            <p className="text-xl font-semibold text-purple-700">{gameState?.case_status || 'Loading...'}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-sm text-green-600">AI Score</p>
            <p className="text-2xl font-bold text-green-700">{gameState?.ai_score?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto mb-4 rounded-xl bg-white/70 backdrop-blur-sm p-4 shadow-lg">
        <AnimatePresence>
          {messages.map((msg, idx) => (
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
                  ? 'bg-purple-50 text-purple-800' 
                  : 'bg-green-50 text-green-800'
              }`}>
                <div className="font-medium text-sm mb-1 flex justify-between items-center">
                  <span>{msg.speaker === 'ai' ? 'AI Lawyer' : msg.speaker === 'human' ? 'You' : 'Judge'}</span>
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
          ))}
        </AnimatePresence>

        {isCourtSpeaking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center space-x-2 text-gray-600 py-4"
          >
            <MessageCircle className="w-4 h-4 animate-pulse" />
            <span>
              {gameState?.next_turn === 'ai' ? 
                'AI Lawyer is preparing response...' : 
                'The Judge is speaking...'}
            </span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {gameState?.case_status === 'open' && 
       gameState.next_turn === 'human' && 
       !isCourtSpeaking && (
        <motion.form 
          onSubmit={handleSubmit}
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="relative"
        >
          <div className="relative flex items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Present your argument to the court..."
              className="w-full bg-white/70 backdrop-blur-sm rounded-xl p-4 pr-12 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none shadow-lg"
              rows="3"
            />
            <motion.button
              type="button"
              onClick={handleVoiceInput}
              className="absolute right-16 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-100 hover:bg-blue-200"
            >
              {isListening ? (
                <Mic className="w-5 h-5 text-red-500 animate-pulse" />
              ) : (
                <Mic className="w-5 h-5 text-blue-600" />
              )}
            </motion.button>
            <motion.button
              type="submit"
              disabled={isCourtSpeaking || !input.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:hover:bg-blue-100 text-blue-600"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.form>
      )}

      {gameState?.case_status === 'closed' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg"
        >
          <Award className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-2xl font-bold mb-2 text-gray-800">Case Closed</h3>
          <p className="text-lg mb-2 text-gray-700">Winner: {gameState.winner}</p>
          <p className="text-sm text-gray-600 mb-4">
            Final Score Difference: {gameState.score_difference?.toFixed(2)}
          </p>
          {/* Removed IPFS button */}
        </motion.div>
      )}
    </motion.div>
  );
};

export default HAIChatInterface;

