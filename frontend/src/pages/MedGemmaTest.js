import React, { useState } from 'react';
import '../styles/MedGemmaTest.css';

const MedGemmaTest = () => {
  const [inputText, setInputText] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [modelStatus, setModelStatus] = useState('disconnected');

  // VS Code Server proxy path
  const PROXY_BASE = '/proxy/3000/api';

  // Check if local model server is running via Node proxy
  const checkModelStatus = async () => {
    try {
      const response = await fetch(`${PROXY_BASE}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setModelStatus('connected');
        return true;
      } else {
        setModelStatus('disconnected');
        return false;
      }
    } catch (err) {
      setModelStatus('disconnected');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) {
      setError('Please enter some text to generate');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const isConnected = await checkModelStatus();
      if (!isConnected) {
        setError('Local MedGemma model server is not running. Please start the server first.');
        setIsLoading(false);
        return;
      }

      const result = await fetch(`${PROXY_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: inputText,
          max_new_tokens: 512,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true,
        }),
      });

      if (!result.ok) throw new Error(`HTTP error! status: ${result.status}`);
      const data = await result.json();
      setResponse(data.response || data.generated_text);
    } catch (err) {
      console.error('Error calling local MedGemma:', err);
      setError(`Error: ${err.message || 'Failed to generate response. Make sure the local model server is running.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    checkModelStatus();
  }, []);

  return (
    <div className="medgemma-test">
      <div className="medgemma-container">
        <h1>MedGemma 4B Local Test</h1>
        <p className="description">
          Test connection to MedGemma 4B model running locally via Node proxy.
        </p>

        <div className="status-indicator">
          <div className={`status-dot ${modelStatus}`}></div>
          <span className="status-text">
            Model Status: {modelStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="medgemma-form">
          <div className="form-group">
            <label htmlFor="inputText">Input Text:</label>
            <textarea
              id="inputText"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter your medical question or text here..."
              className="text-input"
              rows="4"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading || modelStatus !== 'connected'}
            className="submit-btn"
          >
            {isLoading ? 'Generating...' : 'Generate Response'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {response && (
          <div className="response-container">
            <h3>Response:</h3>
            <div className="response-text">{response}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedGemmaTest;
