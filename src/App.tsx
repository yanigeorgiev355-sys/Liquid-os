import React, { useState, useEffect, useRef } from 'react';

// --- INTERNAL STYLES (The Paint) ---
// We inject standard CSS for animations so we don't need Tailwind config
const styleTag = `
  @keyframes spin { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(1800deg); } }
  @keyframes breathe { 0% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.5); opacity: 1; } 100% { transform: scale(1); opacity: 0.5; } }
  @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); } 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); } }
  .animate-spin-fast { animation: spin 1s ease-out forwards; }
  .animate-breathe { animation: breathe 4s infinite ease-in-out; }
  .animate-pulse-ring { animation: pulse 2s infinite; }
`;

// --- DATABASE (The Memory) ---
const DB = {
  save: (key, data) => {
    const current = DB.load(key) || [];
    const updated = [...current, { ...data, timestamp: new Date().toISOString() }];
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  },
  load: (key) => JSON.parse(localStorage.getItem(key)) || [],
  clear: () => localStorage.clear()
};

// --- WIDGETS ---

const CoinFlipper = () => {
  const [result, setResult] = useState(null);
  const [flipping, setFlipping] = useState(false);

  const flip = () => {
    setFlipping(true);
    setResult(null);
    setTimeout(() => {
      const outcome = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
      setResult(outcome);
      setFlipping(false);
      DB.save('coin_history', { outcome });
    }, 1000);
  };

  useEffect(() => { flip(); }, []);

  return (
    <div style={{ background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155', textAlign: 'center', margin: '10px 0', color: 'white' }}>
      <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={flipping ? 'animate-spin-fast' : ''} style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', background: '#0f172a', margin: '0 auto' }}>
          {result ? (result === 'HEADS' ? '👑' : '🦅') : '❓'}
        </div>
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '10px 0' }}>{result || 'Flipping...'}</h3>
      <button onClick={flip} style={{ width: '100%', padding: '12px', background: '#2563eb', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>
        🔄 Flip Again
      </button>
    </div>
  );
};

const FocusTimer = () => {
  return (
    <div style={{ background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155', textAlign: 'center', color: 'white' }}>
      <div className="animate-breathe" style={{ fontSize: '4rem', marginBottom: '20px' }}>💨</div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 5px 0' }}>Inhale</h2>
      <p style={{ color: '#94a3b8', margin: 0 }}>Sync your breath.</p>
    </div>
  );
};

const StatsBoard = () => {
  const history = DB.load('coin_history');
  const heads = history.filter(h => h.outcome === 'HEADS').length;
  const tails = history.filter(h => h.outcome === 'TAILS').length;
  const total = heads + tails;
  const headsPct = total ? (heads / total) * 100 : 0;

  return (
    <div style={{ background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155', color: 'white' }}>
      <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>📊 Your Analysis</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
          <span>Heads ({heads})</span>
          <span>{Math.round(headsPct)}%</span>
        </div>
        <div style={{ height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${headsPct}%`, background: '#3b82f6' }}></div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
          <span>Tails ({tails})</span>
          <span>{Math.round(100 - headsPct)}%</span>
        </div>
        <div style={{ height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${100 - headsPct}%`, background: '#ef4444' }}></div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

function App() {
  const [messages, setMessages] = useState([
    { type: 'text', content: 'Systems Restored. Visuals Online.', sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = (text) => {
    if (!text || !text.trim()) return;
    setMessages(prev => [...prev, { type: 'text', content: text, sender: 'user' }]);
    setInput('');

    setTimeout(() => {
      const lower = text.toLowerCase();
      if (lower.includes('flip') || lower.includes('coin')) {
        setMessages(prev => [...prev, { type: 'component', content: 'coin', sender: 'ai' }]);
      } 
      else if (lower.includes('focus') || lower.includes('breathe')) {
        setMessages(prev => [...prev, { type: 'component', content: 'focus', sender: 'ai' }]);
      } 
      else if (lower.includes('stat') || lower.includes('analy')) {
        setMessages(prev => [...prev, { type: 'component', content: 'stats', sender: 'ai' }]);
      }
      else {
        setMessages(prev => [...prev, { type: 'text', content: `Try "Flip Coin", "Focus", or "Stats".`, sender: 'ai' }]);
      }
    }, 500);
  };

  const toggleMic = () => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) { alert("Use Chrome for Voice."); return; }

    if (isListening) {
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setInput(text);
        handleSend(text);
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    }
  };

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0f172a', fontFamily: 'sans-serif', color: 'white' }}>
      <style>{styleTag}</style>
      
      {/* HEADER */}
      <div style={{ padding: '15px', background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="animate-pulse-ring" style={{ width: '10px', height: '10px', background: '#22c55e', borderRadius: '50%' }}></div>
          <span style={{ fontWeight: 'bold', letterSpacing: '1px', fontSize: '0.9rem' }}>LIQUID OS v1.0</span>
        </div>
        <button onClick={() => handleSend("Stats")} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>📊</button>
      </div>

      {/* CHAT AREA */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.type === 'text' ? (
              <div style={{ 
                maxWidth: '80%', 
                padding: '12px 16px', 
                borderRadius: '16px', 
                fontSize: '0.95rem', 
                lineHeight: '1.5',
                background: msg.sender === 'user' ? '#2563eb' : '#1e293b',
                color: msg.sender === 'user' ? 'white' : '#e2e8f0',
                borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
                borderBottomLeftRadius: msg.sender === 'user' ? '16px' : '4px'
              }}>
                {msg.content}
              </div>
            ) : (
              <div style={{ width: '100%' }}>
                {msg.content === 'coin' && <CoinFlipper />}
                {msg.content === 'stats' && <StatsBoard />}
                {msg.content === 'focus' && <FocusTimer />}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT BAR */}
      <div style={{ padding: '15px', background: '#0f172a', borderTop: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', gap: '10px', maxWidth: '500px', margin: '0 auto' }}>
          <button onClick={toggleMic} style={{ 
            width: '50px', height: '50px', borderRadius: '50%', border: 'none', 
            background: isListening ? '#ef4444' : '#1e293b', 
            color: 'white', fontSize: '1.2rem', transition: '0.2s',
            boxShadow: isListening ? '0 0 15px rgba(239, 68, 68, 0.5)' : 'none'
          }}>
            {isListening ? '🛑' : '🎤'}
          </button>
          
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder={isListening ? "Listening..." : "Type here..."} 
            style={{ 
              flex: 1, background: '#1e293b', border: '1px solid #334155', 
              borderRadius: '25px', padding: '0 20px', color: 'white', fontSize: '1rem', outline: 'none' 
            }} 
          />
          
          <button onClick={() => handleSend(input)} style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#2563eb', border: 'none', color: 'white', fontSize: '1.2rem' }}>➡️</button>
        </div>
      </div>
    </div>
  );
}

export default App;
