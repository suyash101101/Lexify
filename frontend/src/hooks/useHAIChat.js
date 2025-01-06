import { useState, useEffect } from 'react';
import { startHAISimulation, processHAIInput, endCase } from '../services/api';

export const useHAIChat = (caseId) => {
  const [messages, setMessages] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Start simulation
  useEffect(() => {
    const startSimulation = async () => {
      try {
        setIsLoading(true);
        const response = await startHAISimulation(caseId);
        handleStateUpdate(response);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    startSimulation();
  }, [caseId]);

  // Handle state updates
  const handleStateUpdate = (state) => {
    setGameState(state);

    // Add messages based on state
    if (state.case_status === 'closed' && state.last_response) {
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
  };

  // Send message
  const sendMessage = async (content) => {
    try {
      setIsLoading(true);
      const response = await processHAIInput({
        turn_type: 'human',
        input_text: content,
        case_id: caseId
      });
      handleStateUpdate(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameState?.case_status === 'closed') {
        endCase(caseId).catch(console.error);
      }
    };
  }, [caseId, gameState?.case_status]);

  return {
    messages,
    gameState,
    isLoading,
    error,
    sendMessage
  };
}; 