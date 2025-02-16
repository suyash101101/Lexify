import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Search, History, X, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { initializeLegalResearch, sendResearchQuery, getUserResearch } from '../services/research';

// Chat Modal Component
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
          console.log("Initializing research");
          console.log("User ID:", user?.sub);
          const sid = await initializeLegalResearch(user?.sub);
          console.log("Session ID:", sid);
          setSessionId(sid);
        } catch (error) {
          console.error('Failed to initialize research:', error);
          toast.error('Failed to initialize research');
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
        addMessageToChat('user', message);

        const response = await sendResearchQuery(sessionId, message, null, user?.sub);
        console.log('Initial response:', response);

        if (response.needs_context) {
          setNeedsContext(true);
          setContextRequirements(response.context_requirements);
          setContextAnswers([]);
          setCurrentContextIndex(0);

          addMessageToChat('assistant', response.response);
          if (response.context_requirements.length > 0) {
            addMessageToChat('assistant', response.context_requirements[0].question);
          }
        } else {
          addMessageToChat('assistant', response.response);
        }
      } else {
        addMessageToChat('user', message);
        
        const newContextAnswers = [...contextAnswers];
        newContextAnswers[currentContextIndex] = message;
        setContextAnswers(newContextAnswers);

        if (currentContextIndex < contextRequirements.length - 1) {
          setCurrentContextIndex(currentContextIndex + 1);
          addMessageToChat('assistant', contextRequirements[currentContextIndex + 1].question);
        } else {
          const finalResponse = await sendResearchQuery(
            sessionId,
            currentQuery,
            newContextAnswers,
            user?.sub
          );

          if (finalResponse.needs_context) {
            setContextRequirements(finalResponse.context_requirements);
            setContextAnswers([]);
            setCurrentContextIndex(0);
            addMessageToChat('assistant', finalResponse.response);
            if (finalResponse.context_requirements.length > 0) {
              addMessageToChat('assistant', finalResponse.context_requirements[0].question);
            }
          } else {
            setNeedsContext(false);
            setContextRequirements([]);
            setContextAnswers([]);
            setCurrentContextIndex(0);
            setCurrentQuery('');
            addMessageToChat('assistant', finalResponse.response);
          }
        }
      }
    } catch (error) {
      console.error('Error in research:', error);
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
          <DialogTitle>Legal Research</DialogTitle>
        </DialogHeader>

        {/* Messages Area */}
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
                  : "Ask your legal research question..."
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

// History Modal Component
const ResearchHistoryModal = ({ isOpen, onClose, research }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Research History</DialogTitle>
          <div className="text-sm text-gray-500">
            Session ID: {research?.session_id}
            <br />
            Created: {new Date(research?.created_at).toLocaleString()}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Context History */}
          {research?.context_history?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Context History:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {research.context_history.map((context, idx) => (
                  <li key={idx} className="text-gray-700">{context}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Conversations */}
          <div className="space-y-8">
            {Object.entries(research?.conversations || {}).map(([queryId, conversation]) => (
              <div key={queryId} className="border rounded-lg p-4">
                {conversation.map((exchange, idx) => (
                  <div key={idx} className="space-y-4">
                    {/* Query */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-semibold text-sm text-gray-500 mb-1">Query:</div>
                      <div>{exchange.query}</div>
                    </div>

                    {/* Response */}
                    <div className="bg-white border p-3 rounded-lg">
                      <div className="font-semibold text-sm text-gray-500 mb-1">Response:</div>
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {exchange.response}
                        </ReactMarkdown>
                      </div>
                    </div>

                    {/* Context Used */}
                    {exchange.context?.length > 0 && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="font-semibold text-sm text-gray-500 mb-1">Context Used:</div>
                        <ul className="list-disc pl-5 space-y-1">
                          {exchange.context.map((ctx, ctxIdx) => (
                            <li key={ctxIdx}>{ctx}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Main Research Component
const Research = () => {
  const [showChat, setShowChat] = useState(false);
  const [selectedResearch, setSelectedResearch] = useState(null);
  const [researchSessions, setResearchSessions] = useState([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const { user } = useAuth0();

  // Fetch user's research sessions
  useEffect(() => {
    const fetchResearch = async () => {
      if (user?.sub) {
        try {
          const data = await getUserResearch(user.sub);
          setResearchSessions(data);
        } catch (error) {
          console.error('Error fetching research history:', error);
          toast.error('Failed to load research history');
        }
      }
    };
    fetchResearch();
  }, [user?.sub]);

  const researchGuidePoints = [
    {
      title: "Deep Legal Research",
      icon: Search,
      description: "Access comprehensive legal research with AI-powered analysis of cases and statutes."
    },
    {
      title: "Research History",
      icon: History,
      description: "Keep track of your research sessions and revisit previous findings."
    },
    {
      title: "Contextual Understanding",
      icon: Send,
      description: "Get detailed responses based on the specific context of your legal queries."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-4">
        {/* Guide and Action Section */}
        <div className="mt-8 text-center space-y-8">
          <h1 className="text-3xl font-bold">Legal Research Assistant</h1>
          
          {/* Guide Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {researchGuidePoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <div key={index} className="p-6 bg-gray-50 rounded-lg">
                  <Icon className="w-8 h-8 text-black mb-4 mx-auto" />
                  <h3 className="font-medium mb-2">{point.title}</h3>
                  <p className="text-sm text-gray-600">{point.description}</p>
                </div>
              );
            })}
          </div>

          {/* Action Button */}
          <button
            onClick={() => setShowChat(true)}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
          >
            <Search className="w-5 h-5" />
            Start New Research
          </button>
        </div>

        {/* History Section - Collapsible */}
        <div className="mt-12 border rounded-lg overflow-hidden">
          <button
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="w-5 h-5" />
              <span className="font-medium">Research History</span>
            </div>
            {isHistoryExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          {isHistoryExpanded && (
            <div className="p-4">
              {researchSessions.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Research Sessions Yet</h3>
                  <p className="text-gray-500 mb-4">
                    Start your first legal research session to explore cases and statutes.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {researchSessions.map((research) => (
                    <div
                      key={research.session_id}
                      className="border rounded-lg hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="p-4 border-b bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm text-gray-500">Session ID:</div>
                            <div className="font-mono text-sm truncate" title={research.session_id}>
                              {research.session_id}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Created:</div>
                            <div className="text-sm">
                              {new Date(research.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        {/* Show first query/response preview */}
                        {Object.entries(research.conversations)[0] && (
                          <div>
                            <div className="text-sm font-medium mb-2">Latest Query:</div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {Object.entries(research.conversations)[0][1][0].query}
                            </p>
                          </div>
                        )}
                        
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => setSelectedResearch(research)}
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
          )}
        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal 
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />

      {/* Detailed Research View Modal */}
      {selectedResearch && (
        <ResearchHistoryModal
          isOpen={!!selectedResearch}
          onClose={() => setSelectedResearch(null)}
          research={selectedResearch}
        />
      )}
    </div>
  );
};

export default Research; 