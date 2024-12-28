import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Send, Loader2, MessageSquare, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSpeechRecognition } from '../utils/useVoice';
import VoiceButton from './VoiceButton';

const Consulting = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { startListening, stopListening, isListening } = useSpeechRecognition();

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (isListening) {
        stopListening();
      }
    };
  }, [isListening]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await axios.post(`${import.meta.env.VITE_API_URL}/consultancy/ask`, {
        prompt: input
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log(result.data);
      setResponse(result.data);
      setInput('');
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to get response. Please try again.');
    } finally {
      setLoading(false);
    }
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-white"
    >
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-black mb-2">Legal Consultation</h1>
          <p className="text-gray-500">
            Get instant legal advice from our AI-powered consultant
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-black">
                Your Legal Question
              </label>
              <div className="relative">
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
              <p className="text-sm text-gray-500">
                Be specific and include relevant details for better assistance
              </p>
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
                  <span>Get Legal Advice</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Response Section */}
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t border-black/5 pt-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-black/5 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-black" />
                </div>
                <h2 className="text-lg font-semibold text-black">Legal Opinion</h2>
              </div>
              <div className="bg-black/[0.02] rounded-xl p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 text-gray-800">
                    <article className="prose prose-lg max-w-none
                      prose-headings:font-display prose-headings:font-semibold
                      prose-h1:text-2xl prose-h1:mb-4
                      prose-h2:text-xl prose-h2:mb-3
                      prose-h3:text-lg prose-h3:mb-2
                      prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-4
                      prose-ul:mb-4 prose-ul:list-disc prose-ul:pl-4
                      prose-ol:mb-4 prose-ol:pl-4
                      prose-li:mb-1 prose-li:text-gray-600
                      prose-strong:font-semibold prose-strong:text-black
                      prose-blockquote:border-l-4 prose-blockquote:border-black/10 
                      prose-blockquote:pl-4 prose-blockquote:italic
                      prose-code:bg-black/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                      prose-pre:bg-black/[0.03] prose-pre:p-4 prose-pre:rounded-lg
                      prose-img:rounded-lg
                      prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                    ">
                      {typeof response === 'string' ? (
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // Custom components for specific markdown elements
                            h1: (props) => <h1 className="text-2xl font-bold mb-4" {...props} />,
                            h2: (props) => <h2 className="text-xl font-semibold mb-3 mt-6" {...props} />,
                            h3: (props) => <h3 className="text-lg font-medium mb-2 mt-4" {...props} />,
                            p: (props) => <p className="mb-4 text-gray-600 leading-relaxed" {...props} />,
                            ul: (props) => <ul className="mb-4 pl-6 list-disc" {...props} />,
                            ol: (props) => <ol className="mb-4 pl-6 list-decimal" {...props} />,
                            li: (props) => <li className="mb-2 text-gray-600" {...props} />,
                            strong: (props) => <strong className="font-semibold text-black" {...props} />,
                            blockquote: (props) => (
                              <blockquote className="pl-4 border-l-4 border-black/10 italic my-4" {...props} />
                            ),
                            code: ({inline, ...props}) => 
                              inline ? (
                                <code className="bg-black/5 px-1 py-0.5 rounded" {...props} />
                              ) : (
                                <code className="block bg-black/[0.03] p-4 rounded-lg overflow-x-auto" {...props} />
                              ),
                          }}
                        >
                          {response}
                        </ReactMarkdown>
                      ) : (
                        JSON.stringify(response)
                      )}
                    </article>
                  </div>
                  {response && <VoiceButton text={typeof response === 'string' ? response : ''} />}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Tips Section */}
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          <div className="bg-white border border-black/5 rounded-xl p-4">
            <h3 className="text-base font-semibold text-black mb-3">Tips for Better Results</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>• Be specific about your legal situation</li>
              <li>• Include relevant dates and details</li>
              <li>• Ask one question at a time</li>
              <li>• Provide context when necessary</li>
            </ul>
          </div>
          <div className="bg-white border border-black/5 rounded-xl p-4">
            <h3 className="text-base font-semibold text-black mb-3">Important Note</h3>
            <p className="text-sm text-gray-500">
              This AI consultant provides general legal information and guidance. 
              For specific legal advice, please consult with a qualified attorney.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Consulting;