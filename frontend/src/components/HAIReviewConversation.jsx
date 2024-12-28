import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, AlertCircle, MessageCircle, Send, Mic } from 'lucide-react';
import { api } from '../services/api';
import VoiceButton from './VoiceButton';
import { useSpeechRecognition } from '../utils/useVoice';

const HAIReviewConversation = () => {
  const { case_id } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  const [isCourtSpeaking, setIsCourtSpeaking] = useState(false);
  const messagesEndRef = useRef(null);
  const endRef = useRef(null);
  const { startListening, stopListening, isListening } = useSpeechRecognition();

  useEffect(() => {
    const fetchCaseData = async () => {
      try {
        const response = await api.getCaseDetails(case_id);
        console.log("the response received in the frontend", response);
        setGameState(response);

        // Filter and format messages
        const filteredMessages = response.conversations.slice(1).map((msg, idx) => ({
          ...msg,
          isComment: idx % 2 == 0 && idx>=2
        }));
        setMessages(filteredMessages);
      } catch (e) {
        console.error("Error fetching case data:", e);
        setError("Failed to fetch case data");
      }
    };

    fetchCaseData();
  }, [case_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (gameState?.case_status === 'closed') {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState?.case_status]);

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript) => {
        setInput(transcript);
      });
    }
  };

  const renderMessage = (msg, idx) => (
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
            <VoiceButton text={msg.input} />
          )}
        </div>
        <div className={`text-base ${msg.speaker === 'human' ? 'text-white' : 'text-gray-800'}`}>
          {msg.input}
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
            Score Impact: {msg.score > 0 ? '+' : ''}{msg.score}
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

      {/* Score Bar - Fixed at top */}
      <div className="sticky top-0 z-40 bg-white border-b border-black/5">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Award className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-black">HAI Court</h1>
                <p className="text-xs text-gray-500">Case #{case_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:ml-auto text-sm">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-gray-500 mr-2">You:</span>
                  <span className="font-medium">{gameState?.human_score || '0.00'}</span>
                </div>
                <div>
                  <span className="text-gray-500 mr-2">AI:</span>
                  <span className="font-medium">{gameState?.ai_score || '0.00'}</span>
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
              {messages.map((msg, idx) => renderMessage(msg, idx))}
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

      {/* Case Closed State */}
      {(gameState?.case_status === 'closed' || gameState?.case_status==='Closed')&& (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg"
        >
          <Award className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-2xl font-bold mb-2 text-gray-800">Case Closed</h3>
          <p className="text-lg mb-2 text-gray-700">Winner: {gameState.winner || 'Unknown'}</p>
          <p className="text-sm text-gray-600 mb-4">
            Final Score Difference: {gameState.score_difference}
          </p>
        </motion.div>
      )}
      <div ref={endRef} />
    </motion.div>
  );
};

export default HAIReviewConversation;