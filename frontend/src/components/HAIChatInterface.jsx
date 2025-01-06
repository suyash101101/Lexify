import React, { useState, useEffect, useRef } from 'react';
import { useHAIChat } from '../hooks/useHAIChat';
import { useAuth0 } from '@auth0/auth0-react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, AlertCircle, Award, MessageCircle, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useSpeechRecognition } from '../utils/useVoice';
import VoiceButton from './VoiceButton';
import { Gavel } from 'lucide-react';

const HAIChatInterface = () => {
  const { case_id } = useParams();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const { user } = useAuth0();
  const { startListening, stopListening, isListening } = useSpeechRecognition();
  const endRef = useRef(null);

  const {
    messages,
    gameState,
    isLoading,
    error: chatError,
    sendMessage
  } = useHAIChat(case_id);

  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.sub) {
      setError("User not authenticated");
      return;
    }
  }, [user]);

  useEffect(() => {
    if (chatError) {
      setError(chatError);
    }
  }, [chatError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const humanMessage = {
      content: input.trim(),
      context: "",
      speaker: "human",
      score: 0
    };
    
    setInput('');
    await sendMessage(humanMessage.content);
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

  useEffect(() => {
    if (gameState?.case_status === 'closed') {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState?.case_status]);

  const renderMessage = (msg, idx) => {
    // Ensure we have a string for ReactMarkdown
    const getMessageContent = (message) => {
      if (!message) return '';
      if (typeof message === 'string') return message;
      if (typeof message.content === 'string') return message.content;
      if (typeof message.input === 'string') return message.input;
      return JSON.stringify(message);
    };

    const messageContent = getMessageContent(msg.content || msg.input);
    const contextContent = getMessageContent(msg.context);

    return (
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`flex ${msg.speaker === 'human' ? 'justify-end' : 'justify-start'} mb-6`}
      >
        <div className={`max-w-[85%] ${
          msg.speaker === 'human' 
            ? 'bg-black text-white' 
            : msg.speaker === 'judge' 
            ? 'bg-gray-100 border-l-4 border-yellow-600'
            : 'bg-gray-50'
        } rounded-xl p-4 shadow-md`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              {msg.speaker === 'judge' && (
                <Gavel className="w-4 h-4 mr-2 text-yellow-600" />
              )}
              <span className={`text-sm font-medium ${
                msg.speaker === 'judge' ? 'text-yellow-700' : ''
              }`}>
                {msg.speaker === 'ai' ? 'AI Lawyer' : 
                 msg.speaker === 'human' ? 'You' : 
                 'The Honorable Court'}
              </span>
            </div>
            {(msg.speaker === 'judge' || msg.speaker === 'ai') && (
              <VoiceButton text={messageContent} />
            )}
          </div>
          <div className={`text-base prose prose-sm max-w-none ${
            msg.speaker === 'human' 
              ? 'text-white prose-invert' 
              : msg.speaker === 'judge'
              ? 'text-gray-800 font-serif italic'
              : 'text-gray-800'
          }`}>
            <ReactMarkdown>{messageContent}</ReactMarkdown>
          </div>
          {msg.context && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              className={`mt-3 pt-3 border-t ${
                msg.speaker === 'human' 
                  ? 'border-gray-200/20' 
                  : msg.speaker === 'judge'
                  ? 'border-yellow-200'
                  : 'border-gray-200'
              }`}
            >
              <p className={`font-medium mb-1 text-sm ${
                msg.speaker === 'judge' ? 'text-yellow-700' : ''
              }`}>
                {msg.speaker === 'judge' ? 'Court Direction' : 'Supporting Context'}
              </p>
              <div className={`text-sm prose prose-sm max-w-none ${
                msg.speaker === 'human' 
                  ? 'text-gray-300 prose-invert' 
                  : msg.speaker === 'judge'
                  ? 'text-gray-700'
                  : 'text-gray-600'
              }`}>
                <ReactMarkdown>{contextContent}</ReactMarkdown>
              </div>
            </motion.div>
          )}
          {msg.score !== undefined && msg.speaker !== 'judge' && (
            <div className={`mt-2 text-xs ${
              msg.speaker === 'human' 
                ? 'text-gray-300' 
                : 'text-gray-500'
            }`}>
              Score Impact: {msg.score > 0 ? '+' : ''}{typeof msg.score === 'number' ? msg.score.toFixed(2) : msg.score}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

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

      {/* Score Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-black/5">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Gavel className="w-4 h-4 text-white" />
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
              {messages.map((msg, idx) => renderMessage(msg, idx))}
            </AnimatePresence>

            {isLoading && (
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
       !isLoading && (
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
                  disabled={isLoading || !input.trim()}
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
      {(gameState?.case_status === 'closed' || gameState?.case_status === 'Closed') && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg"
        >
          <Award className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-2xl font-bold mb-2 text-gray-800">Case Closed</h3>
          <p className="text-lg mb-2 text-gray-700">Winner: {gameState.winner || 'Unknown'}</p>
          <p className="text-sm text-gray-600 mb-4">
            Final Score Difference: {parseFloat(gameState.score_difference || 0).toFixed(2)}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default HAIChatInterface;
