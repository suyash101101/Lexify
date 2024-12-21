import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth0 } from '@auth0/auth0-react';
import { api } from '../services/api';
import { useParams } from 'react-router-dom';



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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  return (
    <div className="chat-container">
      {error && <div className="error-message">{error}</div>}

      <div className="score-board">
        <div>Your Score: {gameState?.human_score?.toFixed(2)}</div>
        <div>Status: {gameState?.case_status}</div>
        <div>AI Score: {gameState?.ai_score?.toFixed(2)}</div>
      </div>

      <div className="messages-container">
        {messages.map((msg, idx) => renderMessage(msg, idx))}

        {isCourtSpeaking && (
          <div className="speaking-indicator">
            {gameState?.next_turn === 'ai' ? 
              'AI Lawyer is preparing response...' : 
              'The Judge is speaking...'}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {gameState?.case_status === 'open' && 
       gameState.next_turn === 'human' && 
       !isCourtSpeaking && (
        <form onSubmit={handleSubmit} className="input-form">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Present your argument to the court..."
          />
          <button type="submit" disabled={isCourtSpeaking}>
            Submit
          </button>
        </form>
      )}

      {gameState?.case_status === 'closed' && (
        <div className="case-closed">
          <h3>Case Closed</h3>
          <p>Winner: {gameState.winner}</p>
          <p>Final Score Difference: {gameState.score_difference?.toFixed(2)}</p>
          {gameState.ipfs_hash && (
            <a 
              href={gameState.ipfs_hash}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Case on IPFS
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default HAIChatInterface;

