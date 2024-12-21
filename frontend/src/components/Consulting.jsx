import { useState } from 'react';
import axios from 'axios';

const Consulting = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await axios.post('http://localhost:8000/consultancy/ask', {
        prompt: input
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setResponse(result.data);
    } catch (error) {
      console.error('Error:', error);
      setResponse('Error occurred while fetching response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Legal Consultant</h2>
      <div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your legal question..."
            style={{ width: '300px', marginRight: '10px' }}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
      
      {response && (
        <div style={{ marginTop: '20px' }}>
          <h3>Response:</h3>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};

export default Consulting;