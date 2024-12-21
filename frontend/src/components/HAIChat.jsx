import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/system';
import CryptoJS from 'crypto-js';

const MessageBubble = ({ message, isAi }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    className={`flex ${isAi ? 'justify-start' : 'justify-end'} mb-4`}
  >
    <div className={`max-w-[80%] ${isAi ? 'order-2' : 'order-1'}`}>
      <div className={`relative p-4 rounded-2xl ${
        isAi 
          ? 'bg-gradient-to-br from-sky-400 to-blue-400 text-white' 
          : 'bg-gradient-to-br from-blue-300 to-sky-400 text-white'
      }`}>
        <div className="font-medium mb-1">{message.speaker.toUpperCase()}</div>
        <div className="text-white/90">{message.text}</div>
        {message.score > 0 && (
          <div className="mt-2 text-sm text-white/70">
            Score: {message.score.toFixed(2)}
          </div>
        )}
        
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </div>
    </div>
  </motion.div>
);

const HAIChat = () => {
  const { case_id } = useParams();
  const { user } = useAuth0();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [isInputDisabled, setIsInputDisabled] = useState(true);
  const webSocketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = `ws://localhost:8000/ws/hai/${case_id}/${(user.sub)}`;
      
      console.log('Attempting to connect to:', wsUrl);
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = async () => {
        console.log('WebSocket Connected');
        setError(null);
        
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/hai/start-simulation`,
            { method: 'POST' }
          );
          const data = await response.json();
          handleTurnResponse(data);
        } catch (err) {
          console.error('Simulation start error:', err);
          setError('Failed to start simulation');
          setIsLoading(false);
        }
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError(`WebSocket connection error: ${error.message}`);
        setIsLoading(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setError('Connection closed');
        setIsLoading(false);
      };

      webSocketRef.current = ws;
    };

    if (case_id && user?.sub) {
      connectWebSocket();
    }

    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, [case_id, user]);

  const handleWebSocketMessage = (data) => {
    if (data.type === 'turn_update') {
      handleTurnResponse(data.data);
    }
  };

  const handleTurnResponse = (response) => {
    setGameState(response);
    setIsLoading(false);

    const newMessage = {
      text: response.current_response.context,
      speaker: response.current_response.speaker,
      score: response.current_response.score
    };
    setMessages(prev => [...prev, newMessage]);

    setIsInputDisabled(
      response.next_turn !== 'human' || response.case_status === 'closed'
    );

    if (response.case_status === 'closed') {
      handleCaseCompletion(response);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isInputDisabled) return;

    setIsInputDisabled(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/hai/process-input`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            turn_type: 'human',
            input_text: inputText,
            case_id: case_id
          }),
        }
      );

      const data = await response.json();
      handleTurnResponse(data);
      setInputText('');
    } catch (err) {
      setError('Failed to process input');
      setIsInputDisabled(false);
    }
  };

  const handleCaseCompletion = (finalState) => {
    setMessages(prev => [
      ...prev,
      {
        text: `Case Concluded! Winner: ${finalState.winner}`,
        speaker: 'system',
        score: 0
      },
      {
        text: `Final Scores - Human: ${finalState.human_score.toFixed(2)}, AI: ${finalState.ai_score.toFixed(2)}`,
        speaker: 'system',
        score: 0
      },
      {
        text: `Case Record: ${finalState.ipfs_hash}`,
        speaker: 'system',
        score: 0
      }
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="relative min-h-[80vh] bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 shadow-xl overflow-hidden">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-0 left-0 right-0 p-4 bg-red-50 border-b border-red-100"
          >
            <p className="text-red-600">{error}</p>
          </motion.div>
        )}

        <div className="h-full flex flex-col">
          {/* Chat messages */}
          <div className="flex-1 p-6 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <MessageBubble key={index} message={msg} isAi={msg.speaker === 'ai'} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          {gameState?.case_status === 'open' && (
            <motion.form
              onSubmit={handleSubmit}
              className="border-t border-sky-100 bg-sky-50/30 p-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <div className="flex space-x-4">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isInputDisabled ? "Waiting for other party..." : "Enter your argument..."}
                  disabled={isInputDisabled}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all resize-none"
                  rows={2}
                />
                <motion.button
                  type="submit"
                  disabled={isInputDisabled || !inputText.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 rounded-xl flex items-center justify-center ${
                    isInputDisabled || !inputText.trim()
                      ? 'bg-gray-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.form>
          )}
        </div>
      </div>
    </div>
  );
};

export default HAIChat;

