import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";

// --- CONFIGURATION ---
const GEMINI_API_KEY = "AIzaSyAhhB16FzCUJtjfEmB7llffOgdavtEOQMU"; 

const firebaseConfig = {
  apiKey: "AIzaSyAo8-dWRi7Y6e7W4KqAp8dVc5rpPMDhelY",
  authDomain: "liquid-os-5da31.firebaseapp.com",
  projectId: "liquid-os-5da31",
  storageBucket: "liquid-os-5da31.firebasestorage.app",
  messagingSenderId: "1091307817494",
  appId: "1:1091307817494:web:437b4013da4ad0bdc60337"
};

// Initialize Firebase
let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase Init Error", e);
}

// --- STYLES ---
const styleTag = `
  @keyframes spin { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(1800deg); } }
  .animate-spin-fast { animation: spin 1s ease-out forwards; }
  .mic-button { transition: all 0.2s; }
  .mic-button:active { transform: scale(0.9); }
  .mic-active { box-shadow: 0 0 15px #ef4444; background: #ef4444 !important; }
`;

// --- WIDGETS ---
const CoinFlipper = () => {
  const [result, setResult] = useState(null);
  const [flipping, setFlipping] = useState(false);
  const flip = async () => {
    setFlipping(true); setResult(null);
    const outcome = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
    try { await addDoc(collection(db, "history"), { type: 'coin', outcome, timestamp: new Date().toISOString() }); } catch (e) {}
    setTimeout(() => { setResult(outcome); setFlipping(false); }, 1000);
  };
  useEffect(() => { flip(); }, []);
  return (
    <div style={{ background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155', textAlign: 'center', margin: '10px 0', color: 'white' }}>
      <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={flipping ? 'animate-spin-fast' : ''} style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', background: '#0f172a', margin: '0 auto' }}>{result ? (result === 'HEADS' ? '👑' : '🦅') : '❓'}</div>
      </div>
      <button onClick={flip} style={{ width: '100%', padding: '12px', background: '#2563eb', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'bold' }}>🔄 Flip Again</button>
    </div>
  );
};

const StatsBoard = () => {
  const [stats, setStats] = useState({ heads: 0, tails: 0, total: 0 });
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(50));
        const snap = await getDocs(q);
        let h = 0; let t = 0;
        snap.forEach((doc) => { const d = doc.data(); if (d.outcome === 'HEADS') h++; else t++; });
        setStats({ heads: h, tails: t, total: h + t });
      } catch (e) { console.log(e); }
    };
    fetchStats();
  }, []);
  const headsPct = stats.total ? (stats.heads / stats.total) * 100 : 0;
  return (
    <div style={{ background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155', color: 'white' }}>
      <h3 style={{ margin: '0 0 10px 0' }}>📊 Cloud Stats</h3>
      <div style={{ height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${headsPct}%`, background: '#3b82f6' }}></div>
      </div>
      <p style={{fontSize: '0.8rem', marginTop: '10px'}}>Heads: {stats.heads} | Tails: {stats.tails}</p>
    </div>
  );
};

// --- MAIN APP ---
function App() {
  const [messages, setMessages] = useState([{ type: 'text', content: 'Online. Tap 🎤 and say "Flip a coin".', sender: 'ai' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { type: 'text', content: text, sender: 'user' }]);
    setInput('');
    setLoading(true);

    try {
      // FIX: Changed model to 'gemini-pro' (Universal Availability)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
      
      const payload = {
        contents: [{
          parts: [{
            text: `You are LiquidOS. User said: "${text}". 
            Reply ONLY in JSON format: {"tool": "coin"|"stats"|"text", "reply": "short message"}.
            If indecisive, use "coin". If asking history, use "stats".`
          }]
        }]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      const aiText = data.candidates[0].content.parts[0].text;
      const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const toolData = JSON.parse(cleanJson);

      if (toolData.tool === 'text') {
        setMessages(prev => [...prev, { type: 'text', content: toolData.reply, sender: 'ai' }]);
      } else {
        setMessages(prev => [...prev, { type: 'component', content: toolData.tool, sender: 'ai' }]);
      }

    } catch (e) {
      setMessages(prev => [...prev, { type: 'text', content: 'Connection Error: ' + e.message, sender: 'ai' }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    if (isListening) { setIsListening(false); return; }
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) { alert("Use Chrome"); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      handleSend(text);
    };
    recognition.start();
  };

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0f172a', color: 'white', fontFamily: 'sans-serif' }}>
      <style>{styleTag}</style>
      <div style={{ padding: '15px', borderBottom: '1px solid #1e293b', textAlign: 'center', fontWeight: 'bold', display:'flex', justifyContent:'space-between' }}>
        <span>LIQUID OS</span>
        {loading && <span className="animate-spin-fast">🧠</span>}
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            {msg.type === 'text' ? (
              <div style={{ background: msg.sender === 'user' ? '#2563eb' : '#1e293b', padding: '12px', borderRadius: '12px' }}>{msg.content}</div>
            ) : (
              <div style={{ width: '280px' }}>
                {msg.content === 'coin' && <CoinFlipper />}
                {msg.content === 'stats' && <StatsBoard />}
              </div>
            )}
          </div>
        ))}
        {loading && <div style={{color: '#94a3b8', fontSize: '0.8rem'}}>Connecting...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '15px', background: '#0f172a', borderTop: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={toggleMic} className={`mic-button ${isListening ? 'mic-active' : ''}`} style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#1e293b', border: 'none', color: 'white', fontSize: '1.2rem' }}>{isListening ? '🛑' : '🎤'}</button>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend(input)} placeholder="Speak..." style={{ flex: 1, background: '#1e293b', border: 'none', borderRadius: '20px', padding: '12px 20px', color: 'white', outline: 'none' }} />
          <button onClick={() => handleSend(input)} style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#7c3aed', border: 'none', color: 'white' }}>➡️</button>
        </div>
      </div>
    </div>
  );
}

export default App;
