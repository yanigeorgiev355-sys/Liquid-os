import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";

// --- YOUR FIREBASE CONFIG (Pre-filled) ---
const firebaseConfig = {
  apiKey: "AIzaSyAo8-dWRi7Y6e7W4KqAp8dVc5rpPMDhelY",
  authDomain: "liquid-os-5da31.firebaseapp.com",
  projectId: "liquid-os-5da31",
  storageBucket: "liquid-os-5da31.firebasestorage.app",
  messagingSenderId: "1091307817494",
  appId: "1:1091307817494:web:437b4013da4ad0bdc60337"
};

// Initialize Cloud Database
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- INTERNAL STYLES ---
const styleTag = `
  @keyframes spin { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(1800deg); } }
  @keyframes breathe { 0% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.5); opacity: 1; } 100% { transform: scale(1); opacity: 0.5; } }
  .animate-spin-fast { animation: spin 1s ease-out forwards; }
  .animate-breathe { animation: breathe 4s infinite ease-in-out; }
`;

// --- WIDGETS ---

const CoinFlipper = () => {
  const [result, setResult] = useState(null);
  const [flipping, setFlipping] = useState(false);

  const flip = async () => {
    setFlipping(true);
    setResult(null);
    
    // 1. Calculate locally immediately (Speed)
    const outcome = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
    
    // 2. Save to Cloud (Async)
    try {
      await addDoc(collection(db, "history"), {
        type: 'coin',
        outcome: outcome,
        timestamp: new Date().toISOString()
      });
      console.log("Saved to Cloud!");
    } catch (e) {
      console.error("Error adding document: ", e);
    }

    // 3. Show result
    setTimeout(() => {
      setResult(outcome);
      setFlipping(false);
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

const StatsBoard = () => {
  const [stats, setStats] = useState({ heads: 0, tails: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Pull data from Google Cloud
        const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(50));
        const querySnapshot = await getDocs(q);
        
        let h = 0; 
        let t = 0;
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.type === 'coin') {
            if (data.outcome === 'HEADS') h++;
            if (data.outcome === 'TAILS') t++;
          }
        });
        setStats({ heads: h, tails: t, total: h + t });
      } catch (e) {
        console.error("Error fetching stats:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div style={{padding:'20px', textAlign:'center', color:'#94a3b8'}}>Downloading Cloud Data...</div>;

  const headsPct = stats.total ? (stats.heads / stats.total) * 100 : 0;

  return (
    <div style={{ background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155', color: 'white' }}>
      <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>☁️ Cloud Analysis</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
          <span>Heads ({stats.heads})</span>
          <span>{Math.round(headsPct)}%</span>
        </div>
        <div style={{ height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${headsPct}%`, background: '#3b82f6' }}></div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
          <span>Tails ({stats.tails})</span>
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
    { type: 'text', content: 'Liquid Cloud Online. Data is now permanent.', sender: 'ai' }
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
      else if (lower.includes('stat') || lower.includes('analy')) {
        setMessages(prev => [...prev, { type: 'component', content: 'stats', sender: 'ai' }]);
      }
      else {
        setMessages(prev => [...prev, { type: 'text', content: `Try "Flip Coin" or "Stats".`, sender: 'ai' }]);
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
          <div className="animate-pulse" style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '50%' }}></div>
          <span style={{ fontWeight: 'bold', letterSpacing: '1px', fontSize: '0.9rem' }}>LIQUID CLOUD</span>
        </div>
        <button onClick={() => handleSend("Stats")} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>☁️</button>
      </div>

      {/* CHAT AREA */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.type === 'text' ? (
              <div style={{ 
                maxWidth: '80%', padding: '12px 16px', borderRadius: '16px', fontSize: '0.95rem', lineHeight: '1.5',
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
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT BAR */}
      <div style={{ padding: '15px', background: '#0f172a', borderTop: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', gap: '10px', maxWidth: '500px', margin: '0 auto' }}>
          <button onClick={toggleMic} style={{ width: '50px', height: '50px', borderRadius: '50%', border: 'none', background: isListening ? '#ef4444' : '#1e293b', color: 'white', fontSize: '1.2rem' }}>
            {isListening ? '🛑' : '🎤'}
          </button>
          
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="Type here..." 
            style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: '25px', padding: '0 20px', color: 'white', fontSize: '1rem', outline: 'none' }} 
          />
          
          <button onClick={() => handleSend(input)} style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#2563eb', border: 'none', color: 'white', fontSize: '1.2rem' }}>➡️</button>
        </div>
      </div>
    </div>
  );
}

export default App;
